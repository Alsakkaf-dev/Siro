package com.grouphub.ofd.delivery;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DRIVER entity (SDD §5.4.4). is_active = eligible for dispatch.
 */
@Entity
@Table(name = "driver")
@Getter
@Setter
@NoArgsConstructor
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "driver_id")
    private Long driverId;

    private String name;
    private String phone;
    private String vehicle;

    @Column(name = "is_active")
    private boolean isActive;
}
