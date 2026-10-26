package com.grouphub.ofd.order;

import com.grouphub.ofd.cart.CartItem;
import com.grouphub.ofd.common.exception.EmptyCartException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ── Creational: BUILDER ── step-by-step assembly of a complex Order
 * (SDD §5.6.3a). Keeps construction logic out of Order; sets the initial
 * PendingPaymentState and computes the grand total from the cart lines.
 */
public class OrderBuilder {   // UML: «Builder»

    private Long userId;
    private long cartId;
    private String address;
    private String reservationId;
    private final List<CartItem> items = new ArrayList<>();

    public OrderBuilder withUser(Long id)          { this.userId = id;  return this; }
    public OrderBuilder withCart(long id)          { this.cartId = id;  return this; }
    public OrderBuilder withAddress(String a)      { this.address = a;  return this; }
    public OrderBuilder withReservation(String r)  { this.reservationId = r; return this; }
    public OrderBuilder addItem(CartItem i)        { this.items.add(i); return this; }
    public OrderBuilder addItems(List<CartItem> i) { this.items.addAll(i); return this; }

    public Order build() {   // UML: +build() : Order
        if (items.isEmpty()) throw new EmptyCartException(cartId);   // guard
        BigDecimal total = items.stream()
                .map(CartItem::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Order order = new Order();
        order.setUserId(userId);
        order.setCartId(cartId);
        order.setDeliveryAddress(address);
        order.setTotalAmount(total);
        order.setCreatedAt(LocalDateTime.now());
        order.setState(new PendingPaymentState());   // initial State
        return order;
    }
}
