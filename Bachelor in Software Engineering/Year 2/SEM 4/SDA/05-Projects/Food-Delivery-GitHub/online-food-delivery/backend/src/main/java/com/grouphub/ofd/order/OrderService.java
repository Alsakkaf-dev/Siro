package com.grouphub.ofd.order;

import com.grouphub.ofd.cart.CartItem;
import com.grouphub.ofd.cart.CartItemRepository;
import com.grouphub.ofd.cart.CartRepository;
import com.grouphub.ofd.cart.ShoppingCart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Order lifecycle service (SDD §5.6.3). Uses OrderBuilder to assemble a new
 * Order (initialised to PendingPaymentState) and persists it.
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepo;
    private final CartRepository cartRepo;
    private final CartItemRepository itemRepo;

    public OrderService(OrderRepository orderRepo, CartRepository cartRepo, CartItemRepository itemRepo) {
        this.orderRepo = orderRepo;
        this.cartRepo = cartRepo;
        this.itemRepo = itemRepo;
    }

    public Order createOrder(long cartId, String address, String reservationId) {
        ShoppingCart cart = cartRepo.findById(cartId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
        List<CartItem> items = itemRepo.findByCartId(cartId);
        Order order = new OrderBuilder()
                .withUser(cart.getUserId())
                .withCart(cartId)
                .withAddress(address)
                .withReservation(reservationId)
                .addItems(items)
                .build();                                   // Builder → initial PENDING_PAYMENT
        return orderRepo.save(order);
    }

    /** Async in the SDD; logged here (the notification service is out of scope). */
    public void sendOrderConfirmation(long orderId, long userId) {
        log.info("Order {} confirmation queued for user {}", orderId, userId);
    }

    public Order getOrder(long orderId) {
        return orderRepo.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }
}
