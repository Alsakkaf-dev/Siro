package com.grouphub.ofd.order;

import com.grouphub.ofd.cart.CartService;
import com.grouphub.ofd.cart.ShoppingCart;
import com.grouphub.ofd.common.dto.CheckoutRequest;
import com.grouphub.ofd.common.dto.OrderSummaryDTO;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Checkout + order endpoints (SDD §6.2). Authenticated — operates on the
 * JWT-identified user's active cart.
 */
@RestController
public class OrderController {

    private final CheckoutFacade checkoutFacade;
    private final CartService cartService;
    private final OrderService orderService;

    public OrderController(CheckoutFacade checkoutFacade, CartService cartService, OrderService orderService) {
        this.checkoutFacade = checkoutFacade;
        this.cartService = cartService;
        this.orderService = orderService;
    }

    /** DT-M2-2 — 'Place Order'. */
    @PostMapping("/api/checkout")
    public OrderSummaryDTO checkout(@RequestBody CheckoutRequest req) {
        ShoppingCart cart = cartService.getOrCreateActiveCart(currentUserId());
        return checkoutFacade.checkout(cart.getCartId(), req.getAddress());
    }

    @GetMapping("/api/orders/{id}")
    public OrderSummaryDTO getOrder(@PathVariable long id) {
        return OrderSummaryDTO.from(orderService.getOrder(id));
    }

    private long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ((Number) principal).longValue();
    }
}
