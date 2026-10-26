package com.grouphub.ofd.common.dto;

import lombok.Data;

/**
 * Body for POST /api/cart/items and PATCH /api/cart/items/{id} (SDD DT-M2-1).
 * Quantity is validated 1..20 in CartService so rule R1 can fire.
 */
@Data
public class AddCartItemRequest {

    private Long menuItemId;
    private Integer quantity;
}
