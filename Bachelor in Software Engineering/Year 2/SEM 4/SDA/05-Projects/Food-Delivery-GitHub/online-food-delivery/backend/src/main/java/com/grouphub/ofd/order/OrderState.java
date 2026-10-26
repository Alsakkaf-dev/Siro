package com.grouphub.ofd.order;

/**
 * ── Behavioural: STATE ── the order changes behaviour with its lifecycle
 * (SDD §5.6.3c · §5.8.5). The «State» interface and all five concrete states
 * live together as one cohesive unit; Order delegates to the current state so
 * transitions carry no if/else.
 */
public interface OrderState {   // UML: «State»

    void next(Order order);       // legal forward transition
    void cancel(Order order);     // cancellation rule (state-specific)
    String name();

    /** Rebuilds the state object from the persisted status string after a DB load. */
    static OrderState fromName(String status) {
        return switch (status == null ? "PENDING_PAYMENT" : status) {
            case "CONFIRMED"        -> new ConfirmedState();
            case "OUT_FOR_DELIVERY" -> new OutForDeliveryState();
            case "DELIVERED"        -> new DeliveredState();
            case "CANCELLED"        -> new CancelledState();
            default                 -> new PendingPaymentState();
        };
    }
}

/** Initial state — advances to CONFIRMED on payment; cancellable on failure/timeout. */
class PendingPaymentState implements OrderState {
    public void next(Order o)   { o.setState(new ConfirmedState()); }
    public void cancel(Order o) { o.setState(new CancelledState()); }
    public String name()        { return "PENDING_PAYMENT"; }
}

/** Paid & confirmed — advances to OUT_FOR_DELIVERY; can no longer cancel. */
class ConfirmedState implements OrderState {
    public void next(Order o)   { o.setState(new OutForDeliveryState()); }
    public void cancel(Order o) { throw new IllegalStateException("Confirmed order cannot cancel"); }
    public String name()        { return "CONFIRMED"; }
}

/** En route — advances to DELIVERED; not cancellable. */
class OutForDeliveryState implements OrderState {
    public void next(Order o)   { o.setState(new DeliveredState()); }
    public void cancel(Order o) { throw new IllegalStateException("In-transit order cannot cancel"); }
    public String name()        { return "OUT_FOR_DELIVERY"; }
}

/** Terminal — delivered. No further transitions; not cancellable. */
class DeliveredState implements OrderState {
    public void next(Order o)   { /* no-op: already delivered */ }
    public void cancel(Order o) { throw new IllegalStateException("Delivered order cannot cancel"); }
    public String name()        { return "DELIVERED"; }
}

/** Terminal — cancelled. Cannot proceed; cancel is a no-op. */
class CancelledState implements OrderState {
    public void next(Order o)   { throw new IllegalStateException("Cancelled order cannot proceed"); }
    public void cancel(Order o) { /* no-op */ }
    public String name()        { return "CANCELLED"; }
}
