package com.grouphub.ofd.restaurant;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * RESTAURANT entity (SDD §5.4.2). is_open drives the 'Currently Closed'
 * badge and disabled Add-to-Cart (DT-M1-3 R4 → A4).
 */
@Entity
@Table(name = "restaurant")
@Getter
@Setter
@NoArgsConstructor
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "restaurant_id")
    private Long restaurantId;

    private String name;
    private String cuisine;
    private BigDecimal rating;
    private String location;

    @Column(name = "is_open")
    private boolean isOpen;
}
