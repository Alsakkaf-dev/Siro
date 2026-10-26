package com.grouphub.ofd.auth;

import com.grouphub.ofd.common.dto.RegisterRequest;
import com.grouphub.ofd.common.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.time.LocalDateTime;

/**
 * USER entity (SDD §5.4.2 — table app_user). Also owns the failed-attempt /
 * lock state that realises DT-M1-1 R4 (increment) and R5 (lock 15 minutes).
 */
@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String phone;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** DT-M1-2 R4 — build a new customer from a registration request (password BCrypt-hashed). */
    public static User from(RegisterRequest dto) {
        User u = new User();
        u.name = dto.getName();
        u.email = dto.getEmail();
        u.passwordHash = BCrypt.hashpw(dto.getPassword(), BCrypt.gensalt());
        u.phone = dto.getPhone();
        u.role = Role.CUSTOMER;
        u.createdAt = LocalDateTime.now();
        return u;
    }

    /** Strategy #2 — provision a customer on first OAuth login. */
    public static User fromOAuth(OAuthClient.OAuthProfile p) {
        User u = new User();
        u.name = p.name();
        u.email = p.email();
        u.passwordHash = "";           // OAuth users have no local password
        u.role = Role.CUSTOMER;
        u.createdAt = LocalDateTime.now();
        return u;
    }

    // ── DT-M1-1 lock helpers ───────────────────────────────────────────────
    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }

    public void recordFailedAttempt() { this.failedAttempts++; }            // R4/R5 → A3

    public void resetFailedAttempts() { this.failedAttempts = 0; this.lockedUntil = null; } // R3

    public void lockFor(int minutes) { this.lockedUntil = LocalDateTime.now().plusMinutes(minutes); } // R5 → A4
}
