package com.grouphub.ofd.cart;

import com.grouphub.ofd.common.dto.AddCartItemRequest;
import com.grouphub.ofd.common.dto.CartDTO;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Cart endpoints (SDD §6.2). Authenticated — the active cart belongs to the
 * JWT-identified user (principal set by JwtAuthFilter).
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /** DT-M2-1 — 'Add to Cart'. */
    @PostMapping("/items")
    public CartDTO addItem(@RequestBody AddCartItemRequest req) {
        return cartService.addItem(currentUserId(), req.getMenuItemId(), req.getQuantity());
    }

    @PatchMapping("/items/{id}")
    public CartDTO updateItem(@PathVariable long id, @RequestBody AddCartItemRequest req) {
        return cartService.updateItem(currentUserId(), id, req.getQuantity());
    }

    @GetMapping
    public CartDTO getCart() {
        return cartService.getCartDTO(currentUserId());
    }

    private long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ((Number) principal).longValue();
    }
}
