package com.grouphub.ofd.order;

import com.grouphub.ofd.cart.CartService;
import com.grouphub.ofd.cart.InventoryService;
import com.grouphub.ofd.common.dto.OrderSummaryDTO;
import com.grouphub.ofd.common.exception.EmptyCartException;
import com.grouphub.ofd.common.exception.MissingAddressException;
import org.springframework.stereotype.Component;

/**
 * ── Structural: FACADE ── one checkout() entry point over the cart, inventory
 * and order subsystems (SDD §5.6.3b · DT-M2-2).
 */
@Component
public class CheckoutFacade {   // UML: «Facade»

    private final CartService cartService;
    private final InventoryService inventoryService;
    private final OrderService orderService;

    public CheckoutFacade(CartService cartService, InventoryService inventoryService, OrderService orderService) {
        this.cartService = cartService;
        this.inventoryService = inventoryService;
        this.orderService = orderService;
    }

    public OrderSummaryDTO checkout(long cartId, String address) {   // Seq SD002
        if (!cartService.validateCart(cartId))                       // DT-M2-2 C1
            throw new EmptyCartException(cartId);                    // R1 → A4
        if (address == null || address.isBlank())                   // C2
            throw new MissingAddressException();                    // R2 → A3
        String reservationId =                                      // C3 (may throw InsufficientStock)
                inventoryService.reserveInventory(cartService.getItems(cartId));
        Order order = orderService.createOrder(cartId, address, reservationId); // R4 → A1
        cartService.convertCart(cartId);                            // cart ACTIVE → CONVERTED
        orderService.sendOrderConfirmation(order.getOrderId(), order.getUserId()); // async
        return OrderSummaryDTO.from(order);
    }
}
