<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\BadgeEvaluator;
use App\Support\JsonResponse;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Badge catalogue — the gamification "Badges → View all" screen.
 * Returns every badge with the current user's earned/locked status.
 * Awarding logic lives in App\Support\BadgeEvaluator (shared with the dashboard).
 */
final class BadgeController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/badges -> every badge with this user's earned status */
    public function index(Request $request, Response $response): Response
    {
        $userId    = (int) ($request->getAttribute('user')['sub'] ?? 0);
        $evaluator = new BadgeEvaluator($this->db);

        // Re-evaluate first so a badge the user just qualified for shows as earned,
        // even if they have not opened the dashboard since crossing the threshold.
        $evaluator->evaluateAndAward($userId, $evaluator->currentStreak($userId));

        return JsonResponse::success($response, $evaluator->listForUser($userId), 200);
    }

    /** POST /api/admin/badges -> create a badge -> 201 */
    public function store(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();

        $name     = trim((string) ($body['name'] ?? ''));
        $imageUrl = trim((string) ($body['image_url'] ?? ''));
        $type     = trim((string) ($body['criteria_type'] ?? ''));
        $threshold = filter_var($body['threshold'] ?? null, FILTER_VALIDATE_INT);

        if ($name === '' || !in_array($type, ['total_logs', 'streak_days', 'category_logs'], true) || $threshold === false) {
            return JsonResponse::error($response, 'name, valid criteria_type, and numeric threshold are required.', 400);
        }

        $criteria = ['type' => $type, 'threshold' => $threshold];

        if ($type === 'category_logs') {
            $category = trim((string) ($body['category'] ?? ''));
            if ($category === '') {
                return JsonResponse::error($response, 'category is required for category_logs badges.', 400);
            }
            $criteria['category'] = $category;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO `Badge` (name, criteria_json, image_url) VALUES (:name, :criteria, :img)'
        );
        $stmt->execute([
            ':name'     => $name,
            ':criteria' => json_encode($criteria),
            ':img'      => $imageUrl,
        ]);

        return JsonResponse::success($response, ['id' => (int) $this->db->lastInsertId()], 201);
    }

    /** DELETE /api/admin/badges/{id} -> remove a badge */
    public function destroy(Request $request, Response $response, array $args): Response
    {
        $id = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false) {
            return JsonResponse::error($response, 'Invalid badge ID.', 400);
        }

        $stmt = $this->db->prepare('DELETE FROM `Badge` WHERE badge_id = :id');
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            return JsonResponse::error($response, 'Badge not found.', 404);
        }

        return JsonResponse::success($response, null, 200);
    }
}
