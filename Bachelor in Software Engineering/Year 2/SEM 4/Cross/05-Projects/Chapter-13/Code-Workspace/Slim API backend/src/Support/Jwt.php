<?php

declare(strict_types=1);

namespace App\Support;

use RuntimeException;

/**
 * Minimal, dependency-free, standards-compliant JSON Web Token (HS256).
 *
 * Implements the RFC 7519 / RFC 7515 HS256 profile:
 *   - signs base64url(header) "." base64url(payload) with HMAC-SHA256;
 *   - compares signatures in constant time (hash_equals) to defeat timing attacks;
 *   - validates the alg header, the signature, and the exp / nbf / iss claims.
 *
 * Tokens produced here decode cleanly on https://jwt.io and verify with any
 * conforming HS256 library (e.g. firebase/php-jwt), so they are easy to inspect
 * during the demo video.
 */
final class Jwt
{
    public function __construct(
        private readonly string $secret,
        private readonly string $issuer = 'books-api',
        private readonly int $ttl = 3600,
    ) {
        if ($secret === '') {
            throw new RuntimeException('JWT secret must not be empty.');
        }
    }

    /**
     * Issue a signed token. Standard claims (iss, iat, nbf, exp) are added
     * automatically; caller-supplied claims (e.g. sub, role) are merged in.
     *
     * @param array<string,mixed> $claims
     */
    public function issue(array $claims): string
    {
        $now = time();
        $payload = array_merge([
            'iss' => $this->issuer,
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $this->ttl,
        ], $claims);

        $segments = [
            self::base64UrlEncode((string) json_encode(['typ' => 'JWT', 'alg' => 'HS256'], JSON_UNESCAPED_SLASHES)),
            self::base64UrlEncode((string) json_encode($payload, JSON_UNESCAPED_SLASHES)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $this->secret, true);
        $segments[] = self::base64UrlEncode($signature);

        return implode('.', $segments);
    }

    /**
     * Verify a token and return its claims, or throw on any failure.
     *
     * @return array<string,mixed>
     * @throws RuntimeException
     */
    public function verify(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new RuntimeException('Malformed token.');
        }
        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        $header = json_decode(self::base64UrlDecode($encodedHeader), true);
        if (!is_array($header) || ($header['alg'] ?? null) !== 'HS256') {
            throw new RuntimeException('Unsupported token algorithm.');
        }

        $expected = hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", $this->secret, true);
        $provided = self::base64UrlDecode($encodedSignature);
        if (!hash_equals($expected, $provided)) {
            throw new RuntimeException('Invalid token signature.');
        }

        $claims = json_decode(self::base64UrlDecode($encodedPayload), true);
        if (!is_array($claims)) {
            throw new RuntimeException('Invalid token payload.');
        }

        $now = time();
        // small leeway (1s) to tolerate clock skew between hosts
        if (isset($claims['nbf']) && $now + 1 < (int) $claims['nbf']) {
            throw new RuntimeException('Token is not yet valid.');
        }
        if (isset($claims['exp']) && $now >= (int) $claims['exp']) {
            throw new RuntimeException('Token has expired.');
        }
        if ($this->issuer !== '' && isset($claims['iss']) && $claims['iss'] !== $this->issuer) {
            throw new RuntimeException('Invalid token issuer.');
        }

        return $claims;
    }

    private static function base64UrlEncode(string $binary): string
    {
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder !== 0) {
            $value .= str_repeat('=', 4 - $remainder);
        }
        $decoded = base64_decode(strtr($value, '-_', '+/'), true);
        if ($decoded === false) {
            throw new RuntimeException('Invalid base64url segment.');
        }
        return $decoded;
    }
}
