<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\JsonResponse;
use Firebase\JWT\JWT;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Authentication: registration, login, JWT issuance.
 * Table names match the authoritative schema (PascalCase, Linux case-sensitive safe):
 *   User, Role
 */
final class AuthController
{
    /** @param array<string,mixed> $jwtConfig */
    public function __construct(
        private PDO $db,
        private array $jwtConfig
    ) {
    }

    /** POST /api/auth/register -> 201 Created */
    public function register(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();

        $name     = trim((string) ($body['name'] ?? ''));
        $email    = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        $policy = $this->fetchPasswordPolicy();

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return JsonResponse::error($response, 'Name and a valid email are required.', 400);
        }

        if (strlen($password) < $policy['min_length']) {
            return JsonResponse::error($response, "Password must be at least {$policy['min_length']} characters.", 400);
        }
        if ($policy['require_upper'] && !preg_match('/[A-Z]/', $password)) {
            return JsonResponse::error($response, 'Password must contain at least one uppercase letter.', 400);
        }
        if ($policy['require_number'] && !preg_match('/[0-9]/', $password)) {
            return JsonResponse::error($response, 'Password must contain at least one number.', 400);
        }

        $check = $this->db->prepare('SELECT 1 FROM `User` WHERE email = :email LIMIT 1');
        $check->execute([':email' => $email]);
        if ($check->fetch()) {
            return JsonResponse::error($response, 'Email is already registered.', 409);
        }

        $roleStmt = $this->db->prepare('SELECT role_id FROM `Role` WHERE name = :name LIMIT 1');
        $roleStmt->execute([':name' => 'user']);
        $roleId = (int) ($roleStmt->fetchColumn() ?? 0);

        if ($roleId === 0) {
            return JsonResponse::error($response, 'Server configuration error: roles not seeded.', 500);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $insert = $this->db->prepare(
            'INSERT INTO `User` (role_id, name, email, password_hash, joined_at)
            VALUES (:role_id, :name, :email, :hash, NOW())'
        );
        $insert->execute([
            ':role_id' => $roleId,
            ':name'    => $name,
            ':email'   => $email,
            ':hash'    => $hash,
        ]);

        return JsonResponse::success(
            $response,
            ['id' => (int) $this->db->lastInsertId(), 'name' => $name, 'email' => $email, 'role' => 'user'],
            201
        );
    }

    /** @return array{min_length:int,require_upper:bool,require_number:bool} */
    private function fetchPasswordPolicy(): array
    {
        $rows = $this->db->query(
            "SELECT setting_key, setting_value FROM `Setting`
            WHERE setting_key IN ('password_min_length','password_require_upper','password_require_number')"
        )->fetchAll();

        $map = [];
        foreach ($rows as $row) {
            $map[$row['setting_key']] = $row['setting_value'];
        }

        return [
            'min_length'     => (int) ($map['password_min_length'] ?? 8),
            'require_upper'  => (bool) ($map['password_require_upper'] ?? true),
            'require_number' => (bool) ($map['password_require_number'] ?? true),
        ];
    }

    /** POST /api/auth/login -> 200 OK with JWT */
    /** POST /api/auth/login -> 200 OK with JWT */
    public function login(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();

        $email    = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($email === '' || $password === '') {
            return JsonResponse::error($response, 'Email and password are required.', 400);
        }

        $stmt = $this->db->prepare(
            'SELECT u.user_id    AS id,
                    u.name,
                    u.email,
                    u.password_hash,
                    u.is_active,
                    r.name       AS role
            FROM   `User` u
            JOIN   `Role` r ON r.role_id = u.role_id
            WHERE  u.email = :email
            LIMIT  1'
        );
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return JsonResponse::error($response, 'Invalid credentials.', 401);
        }

        if ((int) $user['is_active'] === 0) {
            return JsonResponse::error($response, 'This account has been deactivated.', 403);
        }

        if ($user['role'] !== 'admin' && $this->isMaintenanceMode()) {
            return JsonResponse::error($response, 'The site is currently under maintenance. Please try again later.', 503);
        }

        $token = $this->issueToken((int) $user['id'], $user['role']);

        return JsonResponse::success($response, [
            'token' => $token,
            'user'  => [
                'id'    => (int) $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
            ],
        ], 200);
    }

    private function issueToken(int $userId, string $role): string
    {
        $now = time();
        $payload = [
            'iss'  => $this->jwtConfig['issuer'],
            'iat'  => $now,
            'exp'  => $now + $this->jwtConfig['ttl'],
            'sub'  => $userId,
            'role' => $role,
        ];

        return JWT::encode($payload, $this->jwtConfig['secret'], $this->jwtConfig['alg']);
    }

    private function isMaintenanceMode(): bool
    {
        $stmt = $this->db->prepare("SELECT setting_value FROM `Setting` WHERE setting_key = 'maintenance_mode' LIMIT 1");
        $stmt->execute();
        return (bool) ($stmt->fetchColumn() ?: '0');
    }
}
