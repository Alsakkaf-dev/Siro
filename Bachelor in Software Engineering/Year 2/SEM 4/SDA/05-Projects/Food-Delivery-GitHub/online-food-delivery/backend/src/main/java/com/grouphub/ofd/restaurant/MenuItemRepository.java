package com.grouphub.ofd.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Data access for MENU_ITEM (SDD §6.1).
 */
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByRestaurantId(Long restaurantId);
}
