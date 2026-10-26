package com.grouphub.ofd.common.exception;

/**
 * Thrown when a registration targets an email that already exists
 * (SDD DT-M1-2 R3 → A2 "This email is already registered").
 */
public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String email) {
        super("This email is already registered: " + email);
    }
}
