package com.grouphub.ofd.restaurant;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * MENU_ITEM entity (SDD §5.4.2) — composition under RESTAURANT.
 */
@Entity
@Table(name = "menu_item")
@Getter
@Setter
@NoArgsConstructor
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_item_id")
    private Long menuItemId;

    @Column(name = "restaurant_id")
    private Long restaurantId;

    private String name;
    private String description;
    private BigDecimal price;

    @Column(name = "is_available")
    private boolean isAvailable;
}
