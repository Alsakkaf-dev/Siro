package com.grouphub.ofd.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ORDERS entity (SDD §5.4.3) and State context (SDD §5.6.3c). The persisted
 * {@code status} string mirrors the current OrderState; proceed()/cancel()
 * delegate to that state so transitions carry no if/else in the entity.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "cart_id")
    private Long cartId;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    private String status;   // persisted mirror of the current state

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Transient
    private OrderState state;   // UML: -state : OrderState

    public void setState(OrderState s) {   // keeps the persisted status in sync
        this.state = s;
        this.status = s.name();
    }

    public void proceed() { ensureState(); state.next(this); }   // delegate — no if/else

    public void cancel() { ensureState(); state.cancel(this); }

    public String status() { return status; }

    private void ensureState() {
        if (state == null) state = OrderState.fromName(status);   // rebuild after DB load
    }
}
