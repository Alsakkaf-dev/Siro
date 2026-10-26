package com.grouphub.ofd.cart;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * CART entity (SDD §5.4.3 — table cart). status ACTIVE → CONVERTED after checkout;
 * subtotal is recomputed by CartService.updateCartTotal().
 */
@Entity
@Table(name = "cart")
@Getter
@Setter
@NoArgsConstructor
public class ShoppingCart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id")
    private Long cartId;

    @Column(name = "user_id")
    private Long userId;

    private String status;

    private BigDecimal subtotal;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Factory for a fresh active cart. */
    public static ShoppingCart active(long userId) {
        ShoppingCart c = new ShoppingCart();
        c.userId = userId;
        c.status = "ACTIVE";
        c.subtotal = BigDecimal.ZERO;
        c.updatedAt = LocalDateTime.now();
        return c;
    }
}
