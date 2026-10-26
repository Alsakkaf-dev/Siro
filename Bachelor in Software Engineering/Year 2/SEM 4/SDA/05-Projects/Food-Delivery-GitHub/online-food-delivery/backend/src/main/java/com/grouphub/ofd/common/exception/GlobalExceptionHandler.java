package com.grouphub.ofd.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Central mapping of domain exceptions to HTTP responses.
 * Backstop for DT-M1-2 R3 (duplicate email → 409) when the DB UNIQUE
 * constraint fires instead of the explicit pre-check.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Minimal error envelope returned to the client. */
    public record ApiError(int status, String code, String message) {
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiError> handleDuplicateEmail(DuplicateEmailException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError(409, "EMAIL_TAKEN", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldError() != null
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : "Validation failed";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "FIELD_INVALID", msg));
    }
}
