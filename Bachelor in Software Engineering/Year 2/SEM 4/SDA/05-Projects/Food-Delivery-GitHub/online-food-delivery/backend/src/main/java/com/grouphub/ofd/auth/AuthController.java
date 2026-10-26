package com.grouphub.ofd.auth;

import com.grouphub.ofd.common.dto.AuthResult;
import com.grouphub.ofd.common.dto.LoginRequest;
import com.grouphub.ofd.common.dto.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Auth endpoints (SDD §6.1). Maps every DT-M1-1 / DT-M1-2 rule to its HTTP outcome.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        AuthResult r = authService.authenticate(req.getEmail(), req.getPassword());
        if (r.isSuccess()) return ResponseEntity.ok(authBody(r));            // R3 → A1
        return switch (r.getCode()) {
            case "INVALID_EMAIL"  -> status(HttpStatus.BAD_REQUEST, r);      // R1 → A2
            case "NO_ACCOUNT"     -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(offer(r)); // R2 → A5
            case "ACCOUNT_LOCKED" -> status(HttpStatus.LOCKED, r);           // R5 → A4
            default               -> status(HttpStatus.UNAUTHORIZED, r);     // R4 → A3
        };
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        AuthResult r = authService.register(req);
        if (r.isSuccess()) return ResponseEntity.status(HttpStatus.CREATED).body(authBody(r)); // R4 → A1
        // WEAK_PASSWORD (R2/A4) and FIELD_INVALID (R1/A3) are both 400;
        // EMAIL_TAKEN (R3/A2) surfaces as DuplicateEmailException → 409 (GlobalExceptionHandler).
        return status(HttpStatus.BAD_REQUEST, r);
    }

    // ── response helpers ───────────────────────────────────────────────────
    private ResponseEntity<Map<String, Object>> status(HttpStatus s, AuthResult r) {
        return ResponseEntity.status(s).body(err(r));
    }

    private Map<String, Object> authBody(AuthResult r) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("token", r.getToken());
        body.put("user", userView(r.getUser()));
        return body;
    }

    private Map<String, Object> userView(User u) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", u.getUserId());
        v.put("name", u.getName());
        v.put("email", u.getEmail());
        v.put("role", u.getRole() != null ? u.getRole().name() : null);
        return v;
    }

    private Map<String, Object> err(AuthResult r) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("code", r.getCode());
        v.put("message", r.getMessage());
        return v;
    }

    private Map<String, Object> offer(AuthResult r) {
        Map<String, Object> v = err(r);
        v.put("offerRegistration", true);   // DT-M1-1 R2 → A5
        return v;
    }
}
