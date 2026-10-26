package com.grouphub.ofd.common.dto;

import lombok.Data;

/**
 * Body for POST /api/payments (SDD DT-M3-1). The token is a gateway card token —
 * no raw card data ever reaches the server (PCI). amount is validated non-zero.
 */
@Data
public class PaymentRequest {

    private Long orderId;
    private String token;
    private Double amount;
}
