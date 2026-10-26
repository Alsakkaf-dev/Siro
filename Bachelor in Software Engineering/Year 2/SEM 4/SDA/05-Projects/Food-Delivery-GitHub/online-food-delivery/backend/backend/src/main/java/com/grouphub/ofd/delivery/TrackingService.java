package com.grouphub.ofd.delivery;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * ── Behavioural: OBSERVER (Subject) ── (SDD §5.6.4c · DT-M3-2). Holds the
 * subscribers and pushes every GPS update to all of them. A scheduled task
 * streams live positions for active deliveries every 10 seconds.
 */
@Service
public class TrackingService {   // UML: «Subject»

    private final List<DeliveryObserver> observers = new CopyOnWriteArrayList<>();
    private final DeliveryRepository deliveryRepo;

    public TrackingService(DeliveryRepository deliveryRepo, List<DeliveryObserver> observers) {
        this.deliveryRepo = deliveryRepo;
        this.observers.addAll(observers);   // subscribe every DeliveryObserver bean (DT-M3-2 R1)
    }

    public void subscribe(DeliveryObserver o)   { observers.add(o); }
    public void unsubscribe(DeliveryObserver o) { observers.remove(o); }

    /** Notify all subscribers of a new GPS position. */
    public void broadcastLocation(long orderId, double lat, double lng, String status) {
        LocationEvent event = new LocationEvent(orderId, lat, lng, getETA(orderId), status, false);
        for (DeliveryObserver o : observers) o.update(event);
    }

    /** ETA from the delivery's stored arrival time (DT-M3-2 A1). Falls back to a
     *  default until a delivery/ETA exists (e.g. before dispatch). */
    public String getETA(long orderId) {
        Delivery d = deliveryRepo.findByOrderId(orderId);
        if (d == null || d.getEta() == null) return "12 min";
        long mins = Duration.between(LocalDateTime.now(), d.getEta()).toMinutes();
        return mins <= 0 ? "Arriving now" : mins + " min";
    }

    public int observerCount() { return observers.size(); }

    /** Streams live GPS for every OUT_FOR_DELIVERY delivery every 10 seconds. */
    @Scheduled(fixedRate = 10_000)
    public void pushActiveDeliveries() {
        for (Delivery d : deliveryRepo.findByStatus("OUT_FOR_DELIVERY")) {
            if (d.getCurrentLat() == null || d.getCurrentLng() == null) continue; // GPS lost → DT-M3-2 R2
            d.setCurrentLat(d.getCurrentLat().add(new BigDecimal("0.0008")));      // simulate movement
            d.setCurrentLng(d.getCurrentLng().add(new BigDecimal("0.0006")));
            deliveryRepo.save(d);
            broadcastLocation(d.getOrderId(), d.getCurrentLat().doubleValue(),
                    d.getCurrentLng().doubleValue(), d.getStatus());
        }
    }
}
