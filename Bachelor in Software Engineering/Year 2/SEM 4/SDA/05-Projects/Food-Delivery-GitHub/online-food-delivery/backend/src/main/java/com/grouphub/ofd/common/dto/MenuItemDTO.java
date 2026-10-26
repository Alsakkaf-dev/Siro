package com.grouphub.ofd.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * Read model for a menu item on the Menu screen (SDD §5.5.2 / §6.1).
 */
public record MenuItemDTO(
        Long id,
        String name,
        String description,
        BigDecimal price,
        @JsonProperty("isAvailable") boolean isAvailable
) {
}
