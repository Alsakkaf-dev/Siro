<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\JsonResponse;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class UserController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/admin/users -> list every user with role + active status */
    public function index(Request $request, Response $response): Response
    {
        $stmt = $this->db->query(
            'SELECT u.user_id AS id, u.name, u.email, u.is_active, u.joined_at, r.name AS role
             FROM   `User` u
             JOIN   `Role` r ON r.role_id = u.role_id
             ORDER  BY u.user_id ASC'
        );

        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['is_active'] = (int) $row['is_active'];
        }
        unset($row);

        return JsonResponse::success($response, $rows, 200);
    }

    /** PUT /api/admin/users/{id}/role -> change a user's role */
    public function updateRole(Request $request, Response $response, array $args): Response
    {
        $targetId = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);
        $adminId  = (int) ($request->getAttribute('user')['sub'] ?? 0);

        if ($targetId === false) {
            return JsonResponse::error($response, 'Invalid user ID.', 400);
        }
        if ($targetId === $adminId) {
            return JsonResponse::error($response, 'You cannot change your own role.', 403);
        }

        $body    = (array) $request->getParsedBody();
        $newRole = trim((string) ($body['role'] ?? ''));

        if (!in_array($newRole, ['user', 'leader', 'admin'], true)) {
            return JsonResponse::error($response, 'role must be one of: user, leader, admin.', 400);
        }

        $roleStmt = $this->db->prepare('SELECT role_id FROM `Role` WHERE name = :name LIMIT 1');
        $roleStmt->execute([':name' => $newRole]);
        $roleId = $roleStmt->fetchColumn();

        if ($roleId === false) {
            return JsonResponse::error($response, 'Role not found.', 500);
        }

        $stmt = $this->db->prepare('UPDATE `User` SET role_id = :rid WHERE user_id = :id');
        $stmt->execute([':rid' => (int) $roleId, ':id' => $targetId]);

        if ($stmt->rowCount() === 0) {
            return JsonResponse::error($response, 'User not found or role unchanged.', 404);
        }

        return JsonResponse::success($response, ['id' => $targetId, 'role' => $newRole], 200);
    }

    /** PUT /api/admin/users/{id}/status -> activate or deactivate a user */
    public function updateStatus(Request $request, Response $response, array $args): Response
    {
        $targetId = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);
        $adminId  = (int) ($request->getAttribute('user')['sub'] ?? 0);

        if ($targetId === false) {
            return JsonResponse::error($response, 'Invalid user ID.', 400);
        }
        if ($targetId === $adminId) {
            return JsonResponse::error($response, 'You cannot deactivate your own account.', 403);
        }

        $body     = (array) $request->getParsedBody();
        $isActive = filter_var($body['is_active'] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($isActive === null) {
            return JsonResponse::error($response, 'is_active (true/false) is required.', 400);
        }

        $stmt = $this->db->prepare('UPDATE `User` SET is_active = :active WHERE user_id = :id');
        $stmt->execute([':active' => $isActive ? 1 : 0, ':id' => $targetId]);

        if ($stmt->rowCount() === 0) {
            return JsonResponse::error($response, 'User not found or status unchanged.', 404);
        }

        return JsonResponse::success($response, ['id' => $targetId, 'is_active' => $isActive], 200);
    }

    /** DELETE /api/admin/users/{id} -> delete, blocked if user has existing data */
    public function destroy(Request $request, Response $response, array $args): Response
    {
        $targetId = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);
        $adminId  = (int) ($request->getAttribute('user')['sub'] ?? 0);

        if ($targetId === false) {
            return JsonResponse::error($response, 'Invalid user ID.', 400);
        }
        if ($targetId === $adminId) {
            return JsonResponse::error($response, 'You cannot delete your own account.', 403);
        }

        $logCount = (int) $this->fetchCount('Activity_Log', $targetId);
        $badgeCount = (int) $this->fetchCount('User_Badge', $targetId);
        $challengeCount = (int) $this->fetchCount('Challenge_Member', $targetId);

        if ($logCount > 0 || $badgeCount > 0 || $challengeCount > 0) {
            return JsonResponse::error(
                $response,
                'Cannot delete: user has existing logs, badges, or challenge memberships. Deactivate instead.',
                409
            );
        }

        $stmt = $this->db->prepare('DELETE FROM `User` WHERE user_id = :id');
        $stmt->execute([':id' => $targetId]);

        if ($stmt->rowCount() === 0) {
            return JsonResponse::error($response, 'User not found.', 404);
        }

        return JsonResponse::success($response, null, 200);
    }

    private function fetchCount(string $table, int $userId): int
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM `{$table}` WHERE user_id = :uid");
        $stmt->execute([':uid' => $userId]);
        return (int) $stmt->fetchColumn();
    }
}