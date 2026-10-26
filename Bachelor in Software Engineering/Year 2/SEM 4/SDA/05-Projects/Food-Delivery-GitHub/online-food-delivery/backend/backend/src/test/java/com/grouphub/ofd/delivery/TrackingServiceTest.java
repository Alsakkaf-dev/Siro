package com.grouphub.ofd.delivery;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

/**
 * Verifies the Observer pattern (SDD §5.6.4c): the subject broadcasts to every
 * subscribed observer, and subscribe/unsubscribe adjust the set.
 */
class TrackingServiceTest {

    @Test
    void broadcast_notifies_all_observers() {
        List<LocationEvent> received = new ArrayList<>();
        DeliveryObserver observer = received::add;
        TrackingService ts = new TrackingService(mock(DeliveryRepository.class), List.of(observer));

        ts.broadcastLocation(7L, 3.14, 101.68, "OUT_FOR_DELIVERY");

        assertEquals(1, received.size());
        assertEquals(7L, received.get(0).orderId());
        assertEquals("OUT_FOR_DELIVERY", received.get(0).status());
    }

    @Test
    void subscribe_and_unsubscribe_adjust_the_observer_set() {
        TrackingService ts = new TrackingService(mock(DeliveryRepository.class), List.of());
        DeliveryObserver o = e -> { };
        ts.subscribe(o);
        assertEquals(1, ts.observerCount());
        ts.unsubscribe(o);
        assertEquals(0, ts.observerCount());
    }
}
