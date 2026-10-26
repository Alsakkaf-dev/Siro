package com.grouphub.ofd.common.dto;

import lombok.Data;

/**
 * Registration request body for POST /api/auth/register (SDD DT-M1-2).
 * {@link #isValid()} realises condition C1 ("all required fields valid?") so the
 * service can fire rule R1 exactly as the decision table specifies.
 */
@Data
public class RegisterRequest {

    // Simple, permissive email shape used for C1 field validity.
    private static final String EMAIL_REGEX = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

    private String name;
    private String email;
    private String password;
    private String phone;

    /** DT-M1-2 C1 — all required fields present and well-formed. */
    public boolean isValid() {
        return isFilled(name)
                && isFilled(email) && email.matches(EMAIL_REGEX)
                && isFilled(password);
    }

    private static boolean isFilled(String s) {
        return s != null && !s.isBlank();
    }
}
