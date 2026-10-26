package com.grouphub.ofd.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * TRANSACTION entity (SDD §5.4.4). Stores only the gateway reference — never
 * card data (PCI DSS). status ∈ {APPROVED, DECLINED, PENDING}.
 */
@Entity
@Table(name = "transaction")
@Getter
@Setter
@NoArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "gateway_ref")
    private String gatewayRef;

    private BigDecimal amount;

    private String currency;

    private String status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
