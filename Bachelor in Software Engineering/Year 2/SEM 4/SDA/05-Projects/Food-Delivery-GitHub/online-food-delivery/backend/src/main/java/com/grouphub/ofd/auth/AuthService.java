package com.grouphub.ofd.auth;

import com.grouphub.ofd.common.dto.AuthRequest;
import com.grouphub.ofd.common.dto.AuthResult;
import com.grouphub.ofd.common.dto.RegisterRequest;
import com.grouphub.ofd.common.exception.DuplicateEmailException;
import com.grouphub.ofd.config.ConfigurationManager;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Strategy context (SDD §5.6.2b). Owns DT-M1-1 C1 (email format) and JWT
 * issuance, and DT-M1-2 registration. Holds an AuthenticationStrategy reference
 * defaulting to PasswordAuthStrategy; setStrategy() swaps it (e.g. to OAuth).
 */
@Service
public class AuthService {

    private static final String EMAIL_REGEX = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

    private final UserRepository userRepo;
    private final SessionRepository sessionRepo;
    private AuthenticationStrategy strategy;      // UML: -strategy

    public AuthService(UserRepository userRepo, SessionRepository sessionRepo,
                       PasswordAuthStrategy passwordStrategy) {
        this.userRepo = userRepo;
        this.sessionRepo = sessionRepo;
        this.strategy = passwordStrategy;         // default strategy (SDD)
    }

    public void setStrategy(AuthenticationStrategy s) { this.strategy = s; }

    /** DT-M1-1 — login. */
    public AuthResult authenticate(String email, String pwd) {
        if (email == null || !email.matches(EMAIL_REGEX))                 // C1
            return AuthResult.fail("INVALID_EMAIL", "Invalid email format"); // R1 → A2
        String secret = ConfigurationManager.getInstance().get("jwtSecret"); // Singleton
        AuthResult r = strategy.authenticate(new AuthRequest(email, pwd));    // Strategy (C2–C4)
        if (r.isSuccess())
            r.attachToken(createSession(r.getUser().getUserId(), secret));    // R3 → A1
        return r;
    }

    /** DT-M1-2 — registration. */
    public AuthResult register(RegisterRequest dto) {
        if (!dto.isValid())                                              // C1
            return AuthResult.fail("FIELD_INVALID", "Please fill all fields with a valid email"); // R1 → A3
        if (dto.getPassword().length() < 8)                            // C2
            return AuthResult.fail("WEAK_PASSWORD", "Password must be at least 8 characters"); // R2 → A4
        if (userRepo.existsByEmail(dto.getEmail()))                    // C3
            throw new DuplicateEmailException(dto.getEmail());         // R3 → A2 (409)
        userRepo.save(User.from(dto));                                // R4 → A1 (create USER)
        return authenticate(dto.getEmail(), dto.getPassword());       // issue JWT
    }

    /** UML: +createSession() — sign a JWT and record the SESSION audit row. */
    public String createSession(long userId, String secret) {
        long ttl = Long.parseLong(ConfigurationManager.getInstance().get("sessionTtl"));
        String token = JwtUtil.sign(userId, ttl, secret);
        Session s = new Session();
        s.setUserId(userId);
        s.setJwtToken(token);
        s.setIssuedAt(LocalDateTime.now());
        s.setExpiresAt(LocalDateTime.now().plusSeconds(ttl));
        sessionRepo.save(s);
        return token;
    }
}
