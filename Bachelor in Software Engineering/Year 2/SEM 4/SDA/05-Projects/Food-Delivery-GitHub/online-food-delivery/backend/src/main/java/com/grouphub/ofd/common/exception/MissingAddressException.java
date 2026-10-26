package com.grouphub.ofd.common.exception;

/**
 * Thrown when a checkout is missing the delivery address
 * (SDD DT-M2-2 R2 → A3 "Prompt to enter delivery address").
 */
public class MissingAddressException extends RuntimeException {

    public MissingAddressException() {
        super("Please enter a delivery address");
    }
}
