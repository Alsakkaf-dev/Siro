package com.grouphub.ofd.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Login request body for POST /api/auth/login (SDD DT-M1-1).
 * Email-format validity (C1) is checked explicitly in AuthService so the
 * decision-table rule R1 can fire — hence no @Email here.
 */
@Data
public class LoginRequest {

    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
