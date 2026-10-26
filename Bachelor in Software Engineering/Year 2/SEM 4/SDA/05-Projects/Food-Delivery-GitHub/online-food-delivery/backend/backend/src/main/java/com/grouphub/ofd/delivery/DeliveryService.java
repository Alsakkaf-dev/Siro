package com.grouphub.ofd.delivery;

import com.grouphub.ofd.common.dto.DeliveryStatusDTO;
import com.grouphub.ofd.order.Order;
import com.grouphub.ofd.order.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Delivery lifecycle + tracking (SDD §5.6.4 · DT-M3-2). dispatch() assigns an
 * active driver after payment; getTracking() resolves the DT-M3-2 rule.
 */
@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepo;
    private final DriverRepository driverRepo;
    private final OrderRepository orderRepo;
    private final TrackingService trackingService;

    public DeliveryService(DeliveryRepository deliveryRepo, DriverRepository driverRepo,
                           OrderRepository orderRepo, TrackingService trackingService) {
        this.deliveryRepo = deliveryRepo;
        this.driverRepo = driverRepo;
        this.orderRepo = orderRepo;
        this.trackingService = trackingService;
    }

    /** Called after payment approval — assign an active driver and open the DELIVERY. */
    public void dispatch(long orderId) {
        Driver driver = driverRepo.findFirstByIsActiveTrue();
        Delivery d = new Delivery();
        d.setOrderId(orderId);
        if (driver != null) d.setDriverId(driver.getDriverId());
        d.setStatus("OUT_FOR_DELIVERY");
        d.setCurrentLat(new BigDecimal("3.139000"));    // KLCC start point
        d.setCurrentLng(new BigDecimal("101.686900"));
        d.setEta(LocalDateTime.now().plusMinutes(20));
        deliveryRepo.save(d);
        advanceOrder(orderId, "CONFIRMED");   // State: CONFIRMED → OUT_FOR_DELIVERY (SDD §5.8.5)
    }

    /** DT-M3-2 — current tracking state for an order (incl. driver contact for 'Contact Driver'). */
    public DeliveryStatusDTO getTracking(long orderId) {
        Order order = orderRepo.findById(orderId).orElse(null);
        Delivery d = deliveryRepo.findByOrderId(orderId);
        boolean confirmed = order != null
                && !"PENDING_PAYMENT".equals(order.status()) && !"CANCELLED".equals(order.status());
        boolean driverAssigned = d != null && d.getDriverId() != null;
        Driver driver = driverAssigned ? driverRepo.findById(d.getDriverId()).orElse(null) : null;

        if (!confirmed || !driverAssigned)                              // C1 = N → R4 → A4
            return build(orderId, "AWAITING_DRIVER", "Awaiting driver assignment", null, null, null, null);
        if ("DELIVERED".equals(d.getStatus()))                         // C2 = Y → R3 → A3
            return build(orderId, "DELIVERED", "Delivered — please rate your driver",
                    driver, d.getCurrentLat(), d.getCurrentLng(), null);
        if (d.getCurrentLat() == null || d.getCurrentLng() == null)    // C3 = N → R2 → A2
            return build(orderId, "LAST_KNOWN", "Showing last known location, reconnecting…", driver, null, null, null);
        return build(orderId, "TRACKING", "Live tracking",             // R1 → A1
                driver, d.getCurrentLat(), d.getCurrentLng(), trackingService.getETA(orderId));
    }

    /** Simulate completion (driver marks the order delivered). */
    public void markDelivered(long orderId) {
        Delivery d = deliveryRepo.findByOrderId(orderId);
        if (d != null) {
            d.setStatus("DELIVERED");
            deliveryRepo.save(d);
        }
        advanceOrder(orderId, "OUT_FOR_DELIVERY");   // State: OUT_FOR_DELIVERY → DELIVERED (SDD §5.8.5)
    }

    /** Advance the Order one legal State step, only from the expected state — this
     *  is what drives the SDD §5.8.5 lifecycle through the delivery flow at runtime. */
    private void advanceOrder(long orderId, String expected) {
        orderRepo.findById(orderId).ifPresent(order -> {
            if (expected.equals(order.status())) {   // guard: never an illegal/double transition
                order.proceed();                     // State pattern drives the lifecycle
                orderRepo.save(order);
            }
        });
    }

    private DeliveryStatusDTO build(long orderId, String state, String msg, Driver driver,
                                    BigDecimal lat, BigDecimal lng, String eta) {
        return new DeliveryStatusDTO(orderId, state, msg,
                driver != null ? driver.getDriverId() : null,
                driver != null ? driver.getName() : null,
                driver != null ? driver.getPhone() : null,
                driver != null ? driver.getVehicle() : null,
                lat, lng, eta);
    }
}
