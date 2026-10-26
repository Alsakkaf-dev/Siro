package com.grouphub.ofd.payment;

import com.grouphub.ofd.delivery.DeliveryService;
import com.grouphub.ofd.order.Order;
import com.grouphub.ofd.order.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payment orchestration (SDD §5.6.4 · DT-M3-1). Uses the Factory Method to build
 * a gateway (Adapter), records a Transaction, advances the Order to CONFIRMED via
 * the State pattern, and dispatches delivery.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final TransactionRepository txRepo;
    private final OrderRepository orderRepo;
    private final DeliveryService deliveryService;

    public PaymentService(TransactionRepository txRepo, OrderRepository orderRepo, DeliveryService deliveryService) {
        this.txRepo = txRepo;
        this.orderRepo = orderRepo;
        this.deliveryService = deliveryService;
    }

    public PaymentResult pay(long orderId, String token, double amount) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!"PENDING_PAYMENT".equals(order.status()))                       // DT-M3-1 C1
            return PaymentResult.fail("NOT_PAYABLE", "Order is not payable"); // R5 → A5

        GatewayResult result;
        try {
            result = new StripeGatewayFactory().processPayment(token, amount); // C2 (amount) + charge
        } catch (InvalidPaymentException e) {
            return PaymentResult.fail("INVALID_AMOUNT", "Invalid payment request"); // R3 → A3
        } catch (GatewayTimeoutException e) {
            record(order, null, amount, "PENDING");                          // R4 → A4 (no double charge)
            return PaymentResult.fail("PENDING", "Payment pending — will reconcile");
        }

        if ("APPROVED".equals(result.status())) {                            // C4 → R1
            Transaction tx = record(order, result.gatewayRef(), amount, "APPROVED");
            order.proceed();                                                 // PENDING_PAYMENT → CONFIRMED (State)
            orderRepo.save(order);
            deliveryService.dispatch(order.getOrderId());                    // assign driver + create DELIVERY
            log.info("Order {} CONFIRMED via tx {}", orderId, tx.getTransactionId());
            return PaymentResult.ok(tx);                                     // A1
        }
        record(order, result.gatewayRef(), amount, "DECLINED");
        return PaymentResult.fail("DECLINED", "Payment declined");           // R2 → A2
    }

    private Transaction record(Order order, String gatewayRef, double amount, String status) {
        Transaction tx = new Transaction();
        tx.setOrderId(order.getOrderId());
        tx.setGatewayRef(gatewayRef);
        tx.setAmount(BigDecimal.valueOf(amount));
        tx.setCurrency("MYR");
        tx.setStatus(status);
        if ("APPROVED".equals(status)) tx.setPaidAt(LocalDateTime.now());
        return txRepo.save(tx);
    }
}

/** Outcome of a payment attempt; the controller maps its code to an HTTP status. */
class PaymentResult {
    private final boolean success;
    private final String code;
    private final String message;
    private final Transaction transaction;

    private PaymentResult(boolean success, String code, String message, Transaction transaction) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.transaction = transaction;
    }

    static PaymentResult ok(Transaction tx) { return new PaymentResult(true, "APPROVED", "Payment approved", tx); }
    static PaymentResult fail(String code, String msg) { return new PaymentResult(false, code, msg, null); }

    boolean isSuccess() { return success; }
    String getCode() { return code; }
    String getMessage() { return message; }
    Transaction getTransaction() { return transaction; }
}
