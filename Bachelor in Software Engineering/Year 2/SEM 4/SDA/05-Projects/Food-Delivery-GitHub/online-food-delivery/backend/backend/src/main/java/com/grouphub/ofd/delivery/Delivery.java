package com.grouphub.ofd.delivery;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DELIVERY entity (SDD §5.4.4). Live GPS (current_lat/lng) is pushed over
 * WebSocket every 10s by the Observer (DT-M3-2).
 */
@Entity
@Table(name = "delivery")
@Getter
@Setter
@NoArgsConstructor
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delivery_id")
    private Long deliveryId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "driver_id")
    private Long driverId;

    private String status;   // PREPARING, OUT_FOR_DELIVERY, DELIVERED

    @Column(name = "current_lat")
    private BigDecimal currentLat;

    @Column(name = "current_lng")
    private BigDecimal currentLng;

    private LocalDateTime eta;
}
