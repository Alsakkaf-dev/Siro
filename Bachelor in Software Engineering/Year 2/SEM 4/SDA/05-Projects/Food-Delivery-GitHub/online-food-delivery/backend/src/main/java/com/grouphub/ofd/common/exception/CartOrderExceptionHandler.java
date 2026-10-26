package com.grouphub.ofd.common.exception;

import com.grouphub.ofd.common.exception.GlobalExceptionHandler.ApiError;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Maps Module 2 cart/checkout exceptions to HTTP outcomes (SDD DT-M2-1 / DT-M2-2).
 */
@RestControllerAdvice
public class CartOrderExceptionHandler {

    @ExceptionHandler(InvalidQuantityException.class)   // DT-M2-1 R1 → A4
    public ResponseEntity<ApiError> handleQuantity(InvalidQuantityException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "QUANTITY_RANGE", ex.getMessage()));
    }

    @ExceptionHandler(InsufficientStockException.class) // DT-M2-1 R2 / DT-M2-2 R3 → A2/A3
    public ResponseEntity<ApiError> handleStock(InsufficientStockException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError(409, "UNAVAILABLE", ex.getMessage()));
    }

    @ExceptionHandler(EmptyCartException.class)         // DT-M2-2 R1 → A4
    public ResponseEntity<ApiError> handleEmptyCart(EmptyCartException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "EMPTY_CART", ex.getMessage()));
    }

    @ExceptionHandler(MissingAddressException.class)    // DT-M2-2 R2 → A3
    public ResponseEntity<ApiError> handleMissingAddress(MissingAddressException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "MISSING_ADDRESS", ex.getMessage()));
    }
}
