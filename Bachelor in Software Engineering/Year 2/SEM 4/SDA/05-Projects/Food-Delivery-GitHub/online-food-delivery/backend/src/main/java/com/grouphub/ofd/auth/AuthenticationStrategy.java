package com.grouphub.ofd.auth;

import com.grouphub.ofd.common.dto.AuthRequest;
import com.grouphub.ofd.common.dto.AuthResult;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Component;

/**
 * ── Behavioural: STRATEGY ── interchangeable auth algorithms (SDD §5.6.2b · DT-M1-1).
 * The «Strategy» interface, its two concrete strategies (password + OAuth) and the
 * OAuth port are one cohesive unit, so they live in one file.
 */
public interface AuthenticationStrategy {   // UML: «Strategy»

    AuthResult authenticate(AuthRequest credentials);
}

/**
 * Concrete Strategy #1 — email + password (BCrypt). Owns DT-M1-1 C2 (account
 * exists), C3 (hash matches) and C4 (attempts &lt; 5), including lock-after-5 (R5).
 */
@Component
class PasswordAuthStrategy implements AuthenticationStrategy {

    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;

    private final UserRepository userRepo;

    PasswordAuthStrategy(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    public AuthResult authenticate(AuthRequest c) {
        User user = userRepo.findByEmail(c.getEmail());                       // C2
        if (user == null)
            return AuthResult.fail("NO_ACCOUNT", "No account for this email"); // R2 → A5
        if (user.isLocked())
            return AuthResult.fail("ACCOUNT_LOCKED", "Account is locked. Try again later.");
        boolean ok = BCrypt.checkpw(c.getPassword(), user.getPasswordHash()); // C3
        if (ok) {
            user.resetFailedAttempts();                                       // R3 → A1
            userRepo.save(user);
            return AuthResult.success(user);
        }
        user.recordFailedAttempt();                                          // R4/R5 → A3
        if (user.getFailedAttempts() >= MAX_ATTEMPTS) {                      // C4 = N → R5
            user.lockFor(LOCK_MINUTES);                                      // A4 (lock 15 min)
            userRepo.save(user);
            return AuthResult.fail("ACCOUNT_LOCKED",
                    "Too many attempts — account locked for 15 minutes.");
        }
        userRepo.save(user);
        return AuthResult.fail("BAD_CREDENTIALS", "Incorrect email or password"); // R4 → A3
    }
}

/**
 * Concrete Strategy #2 — OAuth 2.0 (SDD Final Project). Provisions the user on
 * first verified login; swappable at runtime via AuthService.setStrategy().
 */
@Component
class OAuthStrategy implements AuthenticationStrategy {

    private final OAuthClient oauth;

    OAuthStrategy(OAuthClient oauth) {
        this.oauth = oauth;
    }

    @Override
    public AuthResult authenticate(AuthRequest c) {
        OAuthClient.OAuthProfile p = oauth.exchangeCodeForProfile(c.getOauthCode());
        if (p == null || !p.emailVerified())
            return AuthResult.fail("OAUTH_FAILED", "OAuth verification failed");
        return AuthResult.success(User.fromOAuth(p));
    }
}

/** Port to an external OAuth provider; StubOAuthClient ships for completeness. */
interface OAuthClient {

    OAuthProfile exchangeCodeForProfile(String code);

    record OAuthProfile(String email, boolean emailVerified, String name) {
    }
}

@Component
class StubOAuthClient implements OAuthClient {

    @Override
    public OAuthProfile exchangeCodeForProfile(String code) {
        return null;   // provider not configured in this build
    }
}
