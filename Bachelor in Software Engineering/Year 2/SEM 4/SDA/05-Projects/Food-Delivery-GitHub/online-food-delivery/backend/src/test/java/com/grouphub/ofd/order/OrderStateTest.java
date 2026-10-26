package com.grouphub.ofd.order;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Verifies the State pattern (SDD §5.6.3c · §5.8.5): legal lifecycle transitions
 * and the illegal-transition guards.
 */
class OrderStateTest {

    private Order orderIn(OrderState state) {
        Order o = new Order();
        o.setState(state);
        return o;
    }

    @Test
    void lifecycle_advances_pending_to_delivered() {
        Order o = orderIn(new PendingPaymentState());
        assertEquals("PENDING_PAYMENT", o.status());
        o.proceed();
        assertEquals("CONFIRMED", o.status());
        o.proceed();
        assertEquals("OUT_FOR_DELIVERY", o.status());
        o.proceed();
        assertEquals("DELIVERED", o.status());
        o.proceed();                                   // terminal no-op
        assertEquals("DELIVERED", o.status());
    }

    @Test
    void pending_payment_can_cancel() {
        Order o = orderIn(new PendingPaymentState());
        o.cancel();
        assertEquals("CANCELLED", o.status());
    }

    @Test
    void confirmed_cannot_cancel() {
        Order o = orderIn(new ConfirmedState());
        assertThrows(IllegalStateException.class, o::cancel);
    }

    @Test
    void cancelled_cannot_proceed() {
        Order o = orderIn(new CancelledState());
        assertThrows(IllegalStateException.class, o::proceed);
    }

    @Test
    void state_is_rebuilt_from_persisted_status() {
        Order o = new Order();
        o.setStatus("CONFIRMED");                      // simulate a DB load (transient state null)
        o.proceed();
        assertEquals("OUT_FOR_DELIVERY", o.status());
    }
}
