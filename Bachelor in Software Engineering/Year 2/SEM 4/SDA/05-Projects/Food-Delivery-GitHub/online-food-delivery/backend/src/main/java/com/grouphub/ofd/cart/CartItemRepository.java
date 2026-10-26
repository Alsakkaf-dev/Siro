package com.grouphub.ofd.cart;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Data access for CART_ITEM (SDD §5.4.3).
 */
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByCartId(Long cartId);

    /** DT-M2-1 C3 — is this menu item already in the cart? */
    CartItem findByCartIdAndMenuItemId(Long cartId, Long menuItemId);
}
