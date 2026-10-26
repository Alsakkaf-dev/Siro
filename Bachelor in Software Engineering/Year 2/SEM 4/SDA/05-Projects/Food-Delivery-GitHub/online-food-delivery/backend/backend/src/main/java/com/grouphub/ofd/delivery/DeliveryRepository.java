package com.grouphub.ofd.delivery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Data access for DELIVERY (SDD §5.4.4).
 */
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    Delivery findByOrderId(Long orderId);

    List<Delivery> findByStatus(String status);
}
