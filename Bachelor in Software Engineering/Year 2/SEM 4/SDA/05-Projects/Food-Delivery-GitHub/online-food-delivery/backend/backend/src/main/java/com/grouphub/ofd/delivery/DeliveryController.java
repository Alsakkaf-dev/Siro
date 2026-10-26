package com.grouphub.ofd.delivery;

import com.grouphub.ofd.common.dto.DeliveryStatusDTO;
import org.springframework.web.bind.annotation.*;

/**
 * Delivery tracking endpoints (SDD §6.3). Live GPS is also streamed over
 * WebSocket to /topic/order/{id}; this REST view resolves DT-M3-2.
 */
@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    /** DT-M3-2 — tracking state for an order. */
    @GetMapping("/{orderId}")
    public DeliveryStatusDTO track(@PathVariable long orderId) {
        return deliveryService.getTracking(orderId);
    }

    /** Driver marks the order delivered (DT-M3-2 R3). */
    @PostMapping("/{orderId}/deliver")
    public DeliveryStatusDTO deliver(@PathVariable long orderId) {
        deliveryService.markDelivered(orderId);
        return deliveryService.getTracking(orderId);
    }
}
