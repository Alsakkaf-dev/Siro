package com.grouphub.ofd.common.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Read model for the whole cart (SDD §5.5.3). subtotal is recomputed by
 * CartService.updateCartTotal() (CART.subtotal).
 */
public record CartDTO(
        Long cartId,
        String status,
        List<CartItemDTO> items,
        BigDecimal subtotal
) {
}
