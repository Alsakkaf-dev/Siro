package com.grouphub.ofd.delivery;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data access for DRIVER (SDD §5.4.4).
 */
public interface DriverRepository extends JpaRepository<Driver, Long> {

    /** Pick the next available driver for dispatch. */
    Driver findFirstByIsActiveTrue();
}
