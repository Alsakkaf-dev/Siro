package com.grouphub.ofd.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Signs and verifies stateless JWTs (HS256). The secret comes from the
 * ConfigurationManager singleton (SDD §5.6.2 — createSession → JwtUtil.sign).
 */
public final class JwtUtil {

    private JwtUtil() {
    }

    /** SDD: createSession() → JwtUtil.sign(userId, ttl, secret). */
    public static String sign(long userId, long ttlSeconds, String secret) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(key)
                .compact();
    }

    /** Verifies signature + expiry and returns the user id (subject). */
    public static long verify(String token, String secret) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.parseLong(claims.getSubject());
    }
}
