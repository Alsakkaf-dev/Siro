package com.grouphub.ofd.common.dto;

import java.math.BigDecimal;

/**
 * Tracking read model (SDD §5.5.4 / DT-M3-2). {@code state} is one of
 * AWAITING_DRIVER (R4), TRACKING (R1), LAST_KNOWN (R2), DELIVERED (R3).
 */
public record DeliveryStatusDTO(
        long orderId,
        String state,
        String message,
        Long driverId,
        String driverName,
        String driverPhone,
        String driverVehicle,
        BigDecimal lat,
        BigDecimal lng,
        String eta
) {
}
