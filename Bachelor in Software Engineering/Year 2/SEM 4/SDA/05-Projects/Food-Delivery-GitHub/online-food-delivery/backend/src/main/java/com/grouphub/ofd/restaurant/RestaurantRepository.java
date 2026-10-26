package com.grouphub.ofd.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data access for RESTAURANT (SDD §6.1).
 */
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
}
