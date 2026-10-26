package com.grouphub.ofd.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * Read model for a restaurant card (SDD §5.5.2 / §6.1).
 * {@code isOpen=false} drives the "Currently Closed" badge and the disabled
 * Add-to-Cart control (DT-M1-3 R4 → A4).
 */
public record RestaurantDTO(
        Long id,
        String name,
        String cuisine,
        BigDecimal rating,
        String location,
        @JsonProperty("isOpen") boolean isOpen
) {
}
