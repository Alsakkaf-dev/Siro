<?php

declare(strict_types=1);

namespace App\Support;

use PDO;

/**
 * Gamification engine: consecutive-day streak + badge criteria evaluation/awarding.
 *
 * Extracted from LogController::dashboard() so the exact same logic powers both the
 * dashboard and GET /api/badges without duplication (Objective 5: "automated
 * engagement engine that tracks user activity streaks, unlocking achievement badges
 * based on structured JSON criteria").
 *
 * Table names match the authoritative schema (PascalCase, Linux case-sensitive safe):
 *   Badge, User_Badge, Activity_Log, Activity_Type, Category
 */
final class BadgeEvaluator
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * Consecutive-day streak ending today: number of unbroken days (today, yesterday, …)
     * on which the user logged at least one activity.
     */
    public function currentStreak(int $userId): int
    {
        $stmt = $this->db->prepare(
            'SELECT DISTINCT DATE(logged_on) AS log_date
             FROM   `Activity_Log`
             WHERE  user_id = :uid
             ORDER  BY log_date DESC'
        );
        $stmt->execute([':uid' => $userId]);
        $loggedDates = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $streak   = 0;
        $expected = new \DateTime('today');
        foreach ($loggedDates as $dateStr) {
            $day = new \DateTime($dateStr);
            if ($day->format('Y-m-d') === $expected->format('Y-m-d')) {
                $streak++;
                $expected->modify('-1 day');
            } elseif ($day < $expected) {
                break;
            }
        }

        return $streak;
    }

    /**
     * Evaluate every badge's criteria_json for the user, INSERT IGNORE any newly
     * earned ones, and return the list of badges the user qualifies for right now.
     *
     * Supported criteria types:
     *   { "type": "total_logs",    "threshold": N }
     *   { "type": "streak_days",   "threshold": N }
     *   { "type": "category_logs", "category": "<name>", "threshold": N }
     *
     * @param  int $streak the value from currentStreak() (passed in so the dashboard,
     *                     which already computed it, does not recompute it)
     * @return list<array{badge_id:int,name:string,image_url:string}>
     */
    public function evaluateAndAward(int $userId, int $streak): array
    {
        $allBadges = $this->db
            ->query('SELECT badge_id, name, criteria_json, image_url FROM `Badge`')
            ->fetchAll();

        $totalLogsStmt = $this->db->prepare(
            'SELECT COUNT(*) FROM `Activity_Log` WHERE user_id = :uid'
        );
        $totalLogsStmt->execute([':uid' => $userId]);
        $totalLogs = (int) $totalLogsStmt->fetchColumn();

        $categoryLogCounts = [];
        $catLogsStmt = $this->db->prepare(
            'SELECT c.name AS category, COUNT(*) AS cnt
             FROM   `Activity_Log` al
             JOIN   `Activity_Type` at ON at.activity_type_id = al.activity_type_id
             JOIN   `Category` c       ON c.category_id       = at.category_id
             WHERE  al.user_id = :uid
             GROUP  BY c.category_id'
        );
        $catLogsStmt->execute([':uid' => $userId]);
        foreach ($catLogsStmt->fetchAll() as $row) {
            $categoryLogCounts[$row['category']] = (int) $row['cnt'];
        }

        $earnedBadges = [];
        foreach ($allBadges as $badge) {
            $criteria = json_decode($badge['criteria_json'], true);
            $earned   = false;

            switch ($criteria['type'] ?? '') {
                case 'total_logs':
                    $earned = $totalLogs >= (int) $criteria['threshold'];
                    break;
                case 'streak_days':
                    $earned = $streak >= (int) $criteria['threshold'];
                    break;
                case 'category_logs':
                    $cat    = (string) ($criteria['category'] ?? '');
                    $earned = ($categoryLogCounts[$cat] ?? 0) >= (int) $criteria['threshold'];
                    break;
            }

            if ($earned) {
                // INSERT IGNORE skips duplicate composite PK (badge_id, user_id) silently
                $awardStmt = $this->db->prepare(
                    'INSERT IGNORE INTO `User_Badge` (badge_id, user_id, awarded_on)
                     VALUES (:bid, :uid, NOW())'
                );
                $awardStmt->execute([':bid' => $badge['badge_id'], ':uid' => $userId]);

                $earnedBadges[] = [
                    'badge_id'  => (int) $badge['badge_id'],
                    'name'      => $badge['name'],
                    'image_url' => $badge['image_url'],
                ];
            }
        }

        return $earnedBadges;
    }

    /**
     * List EVERY badge with the user's earned status — powers the "Badges → View all"
     * screen, which must show both unlocked and still-locked badges.
     *
     * @return list<array{badge_id:int,name:string,image_url:string,criteria:mixed,earned:bool,awarded_on:?string}>
     */
    public function listForUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT b.badge_id,
                    b.name,
                    b.image_url,
                    b.criteria_json,
                    ub.awarded_on
             FROM   `Badge` b
             LEFT   JOIN `User_Badge` ub
                    ON ub.badge_id = b.badge_id AND ub.user_id = :uid
             ORDER  BY b.badge_id ASC'
        );
        $stmt->execute([':uid' => $userId]);

        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[] = [
                'badge_id'   => (int) $row['badge_id'],
                'name'       => $row['name'],
                'image_url'  => $row['image_url'],
                'criteria'   => json_decode($row['criteria_json'], true),
                'earned'     => $row['awarded_on'] !== null,
                'awarded_on' => $row['awarded_on'],
            ];
        }

        return $out;
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
