package com.grouphub.ofd.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * ── Behavioural: OBSERVER ── (SDD §5.6.4c · DT-M3-2). The «Observer» interface,
 * the event it carries, and both concrete observers (the customer's WebSocket
 * client and the notification service) live together; TrackingService is the
 * «Subject» that pushes to them.
 */
public interface DeliveryObserver {   // UML: «Observer»

    void update(LocationEvent event);
}

/** One live GPS update broadcast to every subscriber. */
record LocationEvent(long orderId, double lat, double lng, String eta, String status, boolean arrivingSoon) {
}

/** Observer #1 — pushes each update to the customer over STOMP/WebSocket. */
@Component
class CustomerTrackingClient implements DeliveryObserver {

    private final SimpMessagingTemplate ws;

    CustomerTrackingClient(SimpMessagingTemplate ws) {
        this.ws = ws;
    }

    @Override
    public void update(LocationEvent e) {
        ws.convertAndSend("/topic/order/" + e.orderId(), e);   // animate marker + ETA
    }
}

/** Observer #2 — added in the Final Project; reacts to the same events. */
@Component
class NotificationObserver implements DeliveryObserver {

    private static final Logger log = LoggerFactory.getLogger(NotificationObserver.class);

    @Override
    public void update(LocationEvent e) {
        if (e.arrivingSoon())
            log.info("[NOTIFY] order {} — your driver is arriving!", e.orderId());
    }
}
