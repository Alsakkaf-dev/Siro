<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\Json;
use App\Support\Jwt;
use App\Support\Validator;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

/**
 * Authentication endpoints: register, login, and "who am I".
 *
 * Hardening highlights:
 *   - passwords are stored as bcrypt hashes (password_hash);
 *   - credentials are checked in constant time by password_verify;
 *   - repeated failed logins are throttled per email+IP (HTTP 429);
 *   - the same generic "invalid email or password" is returned whether the
 *     email exists or not, so the endpoint cannot be used to enumerate users.
 */
final class AuthController
{
    private const MAX_FAILED_ATTEMPTS = 10;
    private const ATTEMPT_WINDOW_MINUTES = 15;

    public function __construct(
        private readonly PDO $pdo,
        private readonly Jwt $jwt,
        private readonly int $ttl,
    ) {
    }

    public function register(Request $request, Response $response): Response
    {
        $body = (array) ($request->getParsedBody() ?? []);

        $validator = (new Validator($body))
            ->required('name')->max('name', 100)
            ->required('email')->email('email')->max('email', 190)
            ->required('password')->min('password', 8)->max('password', 200);

        if ($validator->fails()) {
            return Json::write($response, ['errors' => $validator->errors()], 422);
        }

        $name = trim((string) $body['name']);
        $email = strtolower(trim((string) $body['email']));

        $exists = $this->pdo->prepare('SELECT 1 FROM users WHERE email = ?');
        $exists->execute([$email]);
        if ($exists->fetchColumn() !== false) {
            return Json::write($response, ['errors' => ['email' => 'That email is already registered.']], 422);
        }

        $now = gmdate('Y-m-d H:i:s');
        $insert = $this->pdo->prepare(
            'INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
        );
        $insert->execute([
            $name,
            $email,
            password_hash((string) $body['password'], PASSWORD_BCRYPT),
            'member',
            $now,
        ]);

        $user = [
            'id'         => (int) $this->pdo->lastInsertId(),
            'name'       => $name,
            'email'      => $email,
            'role'       => 'member',
            'created_at' => $now,
        ];

        return Json::write($response, ['user' => $user], 201);
    }

    public function login(Request $request, Response $response): Response
    {
        $body = (array) ($request->getParsedBody() ?? []);
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $ip = $this->clientIp($request);

        if ($email === '' || $password === '') {
            return Json::write($response, ['error' => 'Email and password are required.'], 422);
        }

        if ($this->tooManyAttempts($email, $ip)) {
            return Json::write(
                $response,
                ['error' => 'Too many failed login attempts. Please wait a few minutes and try again.'],
                429
            );
        }

        $statement = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $statement->execute([$email]);
        $user = $statement->fetch();

        if ($user === false || !password_verify($password, (string) $user['password_hash'])) {
            $this->recordAttempt($email, $ip, false);
            return Json::write($response, ['error' => 'Invalid email or password.'], 401);
        }

        $this->clearAttempts($email, $ip);

        $token = $this->jwt->issue([
            'sub'   => (int) $user['id'],
            'role'  => $user['role'],
            'email' => $user['email'],
            'name'  => $user['name'],
        ]);

        return Json::write($response, [
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'expires_in'   => $this->ttl,
            'user'         => [
                'id'         => (int) $user['id'],
                'name'       => $user['name'],
                'email'      => $user['email'],
                'role'       => $user['role'],
                'created_at' => $user['created_at'],
            ],
        ], 200);
    }

    public function me(Request $request, Response $response): Response
    {
        // The JWT middleware guarantees this attribute is present.
        return Json::write($response, $request->getAttribute('user'), 200);
    }

    // --- Login throttling (fail-open) ----------------------------------------

    private function tooManyAttempts(string $email, string $ip): bool
    {
        try {
            $statement = $this->pdo->prepare(
                'SELECT COUNT(*) FROM login_attempts
                 WHERE email = ? AND ip = ? AND success = 0
                   AND created_at >= ?'
            );
            $since = gmdate('Y-m-d H:i:s', time() - self::ATTEMPT_WINDOW_MINUTES * 60);
            $statement->execute([$email, $ip, $since]);
            return (int) $statement->fetchColumn() >= self::MAX_FAILED_ATTEMPTS;
        } catch (Throwable) {
            return false; // never block a real user because throttling broke
        }
    }

    private function recordAttempt(string $email, string $ip, bool $success): void
    {
        try {
            $statement = $this->pdo->prepare(
                'INSERT INTO login_attempts (email, ip, success, created_at) VALUES (?, ?, ?, ?)'
            );
            $statement->execute([$email, $ip, $success ? 1 : 0, gmdate('Y-m-d H:i:s')]);
        } catch (Throwable) {
            // ignore — throttling is best-effort
        }
    }

    private function clearAttempts(string $email, string $ip): void
    {
        try {
            $statement = $this->pdo->prepare('DELETE FROM login_attempts WHERE email = ? AND ip = ?');
            $statement->execute([$email, $ip]);
        } catch (Throwable) {
            // ignore
        }
    }

    private function clientIp(Request $request): string
    {
        $server = $request->getServerParams();
        return (string) ($server['REMOTE_ADDR'] ?? '0.0.0.0');
    }
}
