package com.grouphub.ofd.payment;

import com.grouphub.ofd.common.dto.PaymentRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Payment endpoint (SDD §6.3). Maps each DT-M3-1 rule to its HTTP outcome.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> pay(@RequestBody PaymentRequest req) {
        double amount = req.getAmount() == null ? 0 : req.getAmount();
        PaymentResult r = paymentService.pay(req.getOrderId(), req.getToken(), amount);
        if (r.isSuccess()) return ResponseEntity.ok(body(r));            // R1 → A1
        HttpStatus status = switch (r.getCode()) {
            case "NOT_PAYABLE"    -> HttpStatus.CONFLICT;                 // R5 → A5
            case "INVALID_AMOUNT" -> HttpStatus.BAD_REQUEST;             // R3 → A3
            case "PENDING"        -> HttpStatus.ACCEPTED;                // R4 → A4
            case "DECLINED"       -> HttpStatus.PAYMENT_REQUIRED;        // R2 → A2
            default               -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(status).body(err(r));
    }

    private Map<String, Object> body(PaymentResult r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", r.getCode());
        m.put("message", r.getMessage());
        m.put("transactionId", r.getTransaction() != null ? r.getTransaction().getTransactionId() : null);
        m.put("gatewayRef", r.getTransaction() != null ? r.getTransaction().getGatewayRef() : null);
        return m;
    }

    private Map<String, Object> err(PaymentResult r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", r.getCode());
        m.put("message", r.getMessage());
        return m;
    }
}
