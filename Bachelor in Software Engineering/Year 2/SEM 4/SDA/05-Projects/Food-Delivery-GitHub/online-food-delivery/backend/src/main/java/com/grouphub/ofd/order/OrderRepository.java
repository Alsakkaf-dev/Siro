package com.grouphub.ofd.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Data access for ORDERS (SDD §5.4.3).
 */
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);
}
