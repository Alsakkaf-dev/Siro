package com.grouphub.ofd.common.dto;

import lombok.Data;

/**
 * Body for POST /api/checkout (SDD DT-M2-2). A blank address triggers rule R2.
 */
@Data
public class CheckoutRequest {

    private String address;
}
