package com.grouphub.ofd.common.exception;

/**
 * Thrown when a checkout is attempted on an empty cart
 * (SDD DT-M2-2 R1 → A4 "Your cart is empty").
 */
public class EmptyCartException extends RuntimeException {

    public EmptyCartException(long cartId) {
        super("Your cart is empty (cart " + cartId + ")");
    }
}
