package com.grouphub.ofd.common.dto;

import java.math.BigDecimal;

/**
 * Read model for a single cart line (SDD §5.5.3 Cart screen).
 */
public record CartItemDTO(
        Long id,
        Long menuItemId,
        String name,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
