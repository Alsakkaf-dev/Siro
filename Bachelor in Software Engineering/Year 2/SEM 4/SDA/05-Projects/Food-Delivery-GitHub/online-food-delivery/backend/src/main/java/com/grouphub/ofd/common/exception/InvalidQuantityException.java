package com.grouphub.ofd.common.exception;

/**
 * Thrown when a cart quantity falls outside 1..20
 * (SDD DT-M2-1 R1 → A4 "Enter a quantity between 1 and 20").
 */
public class InvalidQuantityException extends RuntimeException {

    public InvalidQuantityException() {
        super("Enter a quantity between 1 and 20");
    }
}
