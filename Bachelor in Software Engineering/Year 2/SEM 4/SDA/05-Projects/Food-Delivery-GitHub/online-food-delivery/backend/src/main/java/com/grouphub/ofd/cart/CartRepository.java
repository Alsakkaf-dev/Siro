package com.grouphub.ofd.cart;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data access for CART (SDD §5.4.3).
 */
public interface CartRepository extends JpaRepository<ShoppingCart, Long> {

    /** The user's current working cart (status = ACTIVE), or null. */
    ShoppingCart findByUserIdAndStatus(Long userId, String status);
}
