package com.grouphub.ofd.common.exception;

/**
 * Thrown when one or more cart items are out of stock during checkout
 * (SDD DT-M2-1 / DT-M2-2 R3 → A2 "Item currently unavailable / adjust").
 */
public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String itemName) {
        super("Item currently unavailable: " + itemName);
    }
}
