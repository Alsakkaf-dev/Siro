<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\JsonResponse;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Administrator-only operations.
 * Table names match the authoritative schema (PascalCase, Linux case-sensitive safe):
 *   Tip, Category, Activity_Type
 */
final class AdminController
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * GET /api/admin/factors -> list all emission factors with category names.
     * Lets the admin see every factor ID and current value before updating.
     */
    public function listFactors(Request $request, Response $response): Response
    {
        $stmt = $this->db->query(
            'SELECT at.activity_type_id AS id,
                    c.name              AS category,
                    at.name,
                    at.unit,
                    at.kg_co2_per_unit
             FROM   `Activity_Type` at
             JOIN   `Category` c ON c.category_id = at.category_id
             ORDER  BY c.name, at.name'
        );

        return JsonResponse::success($response, $stmt->fetchAll(), 200);
    }

    /**
     * POST /api/admin/tips -> add a tip to the library -> 201
     * Body: { title, body, category, source_url? }
     * "category" is the human-readable name resolved to category_id server-side.
     */
    public function createTip(Request $request, Response $response): Response
    {
        $adminId = (int) ($request->getAttribute('user')['sub'] ?? 0);
        $body    = (array) $request->getParsedBody();

        $title = trim((string) ($body['title'] ?? ''));
        $tbody = trim((string) ($body['body'] ?? ''));

        if ($title === '' || $tbody === '') {
            return JsonResponse::error($response, 'Tip title and body are required.', 400);
        }

        // Resolve category name → category_id (required — Tip.category_id is NOT NULL)
        $categoryName = trim((string) ($body['category'] ?? ''));
        if ($categoryName === '') {
            return JsonResponse::error($response, 'category is required.', 400);
        }

        $catStmt = $this->db->prepare(
            'SELECT category_id FROM `Category` WHERE name = :name LIMIT 1'
        );
        $catStmt->execute([':name' => $categoryName]);
        $catId = $catStmt->fetchColumn();

        if ($catId === false) {
            return JsonResponse::error($response, 'Category "' . $categoryName . '" not found.', 422);
        }

        $stmt = $this->db->prepare(
            'INSERT INTO `Tip` (category_id, added_by, title, body, source_url)
             VALUES (:category_id, :added_by, :title, :body, :source_url)'
        );
        $stmt->execute([
            ':category_id' => (int) $catId,
            ':added_by'    => $adminId,
            ':title'       => $title,
            ':body'        => $tbody,
            ':source_url'  => trim((string) ($body['source_url'] ?? '')) ?: null,
        ]);

        return JsonResponse::success($response, ['id' => (int) $this->db->lastInsertId()], 201);
    }

    /** PUT /api/admin/factors/{id} -> update one emission factor */
    public function updateFactor(Request $request, Response $response, array $args): Response
    {
        $id    = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);
        $value = filter_var(
            ((array) $request->getParsedBody())['kg_co2_per_unit'] ?? null,
            FILTER_VALIDATE_FLOAT
        );

        if ($id === false || $value === false) {
            return JsonResponse::error($response, 'Valid factor id and numeric kg_co2_per_unit are required.', 400);
        }

        $exists = $this->db->prepare('SELECT 1 FROM `Activity_Type` WHERE activity_type_id = :id LIMIT 1');
        $exists->execute([':id' => $id]);
        if (!$exists->fetch()) {
            return JsonResponse::error($response, 'Emission factor not found.', 404);
        }

        $stmt = $this->db->prepare(
            'UPDATE `Activity_Type` SET kg_co2_per_unit = :v WHERE activity_type_id = :id'
        );
        $stmt->execute([':v' => $value, ':id' => $id]);

        return JsonResponse::success($response, ['id' => $id, 'kg_co2_per_unit' => $value], 200);
    }

    /** GET /api/admin/stats -> platform-wide totals for the admin dashboard */
    public function stats(Request $request, Response $response): Response
    {
        $totalUsers = (int) $this->db->query('SELECT COUNT(*) FROM `User`')->fetchColumn();
        $totalLogs  = (int) $this->db->query('SELECT COUNT(*) FROM `Activity_Log`')->fetchColumn();
        $totalChallenges = (int) $this->db->query('SELECT COUNT(*) FROM `Challenge`')->fetchColumn();
        $activeChallenges = (int) $this->db->query(
            'SELECT COUNT(*) FROM `Challenge` WHERE CURDATE() BETWEEN start_date AND end_date'
        )->fetchColumn();
        $totalBadges = (int) $this->db->query('SELECT COUNT(*) FROM `Badge`')->fetchColumn();
        $badgesIssued = (int) $this->db->query('SELECT COUNT(*) FROM `User_Badge`')->fetchColumn();

        $recentLogs = $this->db->query(
            'SELECT at.name AS activity_name, al.amount, at.unit,
                    ROUND(al.amount * at.kg_co2_per_unit, 2) AS co2_saved
            FROM   `Activity_Log` al
            JOIN   `Activity_Type` at ON at.activity_type_id = al.activity_type_id
            ORDER  BY al.logged_on DESC
            LIMIT  20'
        )->fetchAll();

        return JsonResponse::success($response, [
            'total_users'        => $totalUsers,
            'total_logs'         => $totalLogs,
            'total_challenges'   => $totalChallenges,
            'active_challenges'  => $activeChallenges,
            'total_badges'       => $totalBadges,
            'badges_issued'      => $badgesIssued,
            'recent_logs'        => $recentLogs,
        ], 200);
    }
}
