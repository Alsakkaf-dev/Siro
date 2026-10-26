package com.grouphub.ofd.common.dto;

import com.grouphub.ofd.order.Order;

import java.math.BigDecimal;

/**
 * Read model returned after checkout (SDD §5.6.3b — OrderSummaryDTO.from(order)).
 */
public record OrderSummaryDTO(
        Long orderId,
        String status,
        BigDecimal totalAmount,
        String deliveryAddress,
        Long cartId
) {
    public static OrderSummaryDTO from(Order o) {
        return new OrderSummaryDTO(o.getOrderId(), o.status(),
                o.getTotalAmount(), o.getDeliveryAddress(), o.getCartId());
    }
}
