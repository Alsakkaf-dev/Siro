<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\BadgeEvaluator;
use App\Support\JsonResponse;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Activity Logs — primary CRUD entity #1.
 * Table names match the authoritative schema (PascalCase, Linux case-sensitive safe):
 *   Activity_Log, Activity_Type, Category, Challenge_Member, Badge, User_Badge
 */
final class LogController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/logs -> list the current user's logs with server-calculated kg_co2 */
    public function index(Request $request, Response $response): Response
    {
        $userId = (int) ($request->getAttribute('user')['sub'] ?? 0);

        $stmt = $this->db->prepare(
            'SELECT al.activity_log_id                          AS id,
                    al.activity_type_id,
                    c.name                                      AS category,
                    at.name                                     AS activity_name,
                    at.unit,
                    al.amount,
                    ROUND(al.amount * at.kg_co2_per_unit, 4)   AS kg_co2,
                    DATE(al.logged_on)                          AS logged_on
             FROM   `Activity_Log` al
             JOIN   `Activity_Type` at ON at.activity_type_id = al.activity_type_id
             JOIN   `Category` c       ON c.category_id       = at.category_id
             WHERE  al.user_id = :uid
             ORDER  BY al.logged_on DESC, al.activity_log_id DESC'
        );
        $stmt->execute([':uid' => $userId]);

        return JsonResponse::success($response, $stmt->fetchAll(), 200);
    }

    /** POST /api/logs -> create a log -> 201 */
    public function store(Request $request, Response $response): Response
    {
        $userId = (int) ($request->getAttribute('user')['sub'] ?? 0);
        $body   = (array) $request->getParsedBody();

        $activityTypeId = filter_var($body['activity_type_id'] ?? null, FILTER_VALIDATE_INT);
        $amount         = filter_var($body['amount'] ?? null, FILTER_VALIDATE_FLOAT);
        $loggedOn       = (string) ($body['logged_on'] ?? date('Y-m-d'));

        if ($activityTypeId === false || $amount === false) {
            return JsonResponse::error($response, 'activity_type_id (int) and amount (number) are required.', 400);
        }

        $typeCheck = $this->db->prepare(
            'SELECT 1 FROM `Activity_Type` WHERE activity_type_id = :id LIMIT 1'
        );
        $typeCheck->execute([':id' => $activityTypeId]);
        if (!$typeCheck->fetch()) {
            return JsonResponse::error($response, 'activity_type_id does not reference a known activity type.', 422);
        }

        $stmt = $this->db->prepare(
            'INSERT INTO `Activity_Log` (user_id, activity_type_id, amount, logged_on)
             VALUES (:uid, :type, :amount, :on)'
        );
        $stmt->execute([
            ':uid'    => $userId,
            ':type'   => $activityTypeId,
            ':amount' => $amount,
            ':on'     => $loggedOn,
        ]);

        return JsonResponse::success($response, ['id' => (int) $this->db->lastInsertId()], 201);
    }

    /** PUT /api/logs/{id} -> update one of the user's logs */
    public function update(Request $request, Response $response, array $args): Response
    {
        $userId = (int) ($request->getAttribute('user')['sub'] ?? 0);
        $id     = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);

        if ($id === false) {
            return JsonResponse::error($response, 'Invalid log ID.', 400);
        }

        $body           = (array) $request->getParsedBody();
        $activityTypeId = filter_var($body['activity_type_id'] ?? null, FILTER_VALIDATE_INT);
        $amount         = filter_var($body['amount'] ?? null, FILTER_VALIDATE_FLOAT);
        $loggedOn       = (string) ($body['logged_on'] ?? date('Y-m-d'));

        if ($activityTypeId === false || $amount === false) {
            return JsonResponse::error($response, 'activity_type_id (int) and amount (number) are required.', 400);
        }

        $stmt = $this->db->prepare(
            'UPDATE `Activity_Log`
             SET    activity_type_id = :type,
                    amount           = :amount,
                    logged_on        = :on
             WHERE  activity_log_id = :id AND user_id = :uid'
        );
        $stmt->execute([
            ':type'   => $activityTypeId,
            ':amount' => $amount,
            ':on'     => $loggedOn,
            ':id'     => $id,
            ':uid'    => $userId,
        ]);

        if ($stmt->rowCount() === 0) {
            return JsonResponse::error($response, 'Log entry not found or access denied.', 404);
        }

        return JsonResponse::success($response, ['id' => $id], 200);
    }

    /** DELETE /api/logs/{id} -> delete one of the user's logs */
    public function destroy(Request $request, Response $response, array $args): Response
    {
        $userId = (int) ($request->getAttribute('user')['sub'] ?? 0);
        $id     = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);

        if ($id === false) {
            return JsonResponse::error($response, 'Invalid log ID.', 400);
        }

        $stmt = $this->db->prepare(
            'DELETE FROM `Activity_Log` WHERE activity_log_id = :id AND user_id = :uid'
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);

        if ($stmt->rowCount() === 0) {
            return JsonResponse::error($response, 'Log entry not found or access denied.', 404);
        }

        return JsonResponse::success($response, null, 200);
    }

    /**
     * GET /api/dashboard -> aggregated footprint + streak + badges.
     *
     * Response shape:
     * {
     *   "today_kg_co2":      float,
     *   "yesterday_kg_co2":  float,
     *   "streak_days":       int,
     *   "joined_challenges": int,
     *   "week":              [{"date": "YYYY-MM-DD", "kg_co2": float}, ...],
     *   "by_category":       [{"category": string, "kg_co2": float}, ...],
     *   "badges":            [{"badge_id": int, "name": string, "image_url": string}, ...]
     * }
     */
    public function dashboard(Request $request, Response $response): Response
    {
        $userId = (int) ($request->getAttribute('user')['sub'] ?? 0);

        // ── 1. Today vs yesterday ──────────────────────────────────────────────
        $todayStmt = $this->db->prepare(
            'SELECT
                 ROUND(SUM(CASE WHEN DATE(al.logged_on) = CURDATE()
                                THEN al.amount * at.kg_co2_per_unit ELSE 0 END), 4) AS today_kg,
                 ROUND(SUM(CASE WHEN DATE(al.logged_on) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                                THEN al.amount * at.kg_co2_per_unit ELSE 0 END), 4) AS yesterday_kg
             FROM `Activity_Log` al
             JOIN `Activity_Type` at ON at.activity_type_id = al.activity_type_id
             WHERE al.user_id = :uid
               AND DATE(al.logged_on) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
        );
        $todayStmt->execute([':uid' => $userId]);
        $todayRow    = $todayStmt->fetch();
        $todayKg     = (float) ($todayRow['today_kg'] ?? 0);
        $yesterdayKg = (float) ($todayRow['yesterday_kg'] ?? 0);

        // ── 2. Last 7 days for the weekly chart ───────────────────────────────
        $weekStmt = $this->db->prepare(
            'SELECT   DATE(al.logged_on)                                AS date,
                      ROUND(SUM(al.amount * at.kg_co2_per_unit), 4)   AS kg_co2
             FROM     `Activity_Log` al
             JOIN     `Activity_Type` at ON at.activity_type_id = al.activity_type_id
             WHERE    al.user_id = :uid
               AND    DATE(al.logged_on) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             GROUP BY DATE(al.logged_on)
             ORDER BY DATE(al.logged_on) ASC'
        );
        $weekStmt->execute([':uid' => $userId]);
        $weekRows = $weekStmt->fetchAll();

        // ── 3. Last 30 days by category ───────────────────────────────────────
        $catStmt = $this->db->prepare(
            'SELECT   c.name                                            AS category,
                      ROUND(SUM(al.amount * at.kg_co2_per_unit), 4)   AS kg_co2
             FROM     `Activity_Log` al
             JOIN     `Activity_Type` at ON at.activity_type_id = al.activity_type_id
             JOIN     `Category` c       ON c.category_id       = at.category_id
             WHERE    al.user_id = :uid
               AND    DATE(al.logged_on) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
               AND    at.kg_co2_per_unit > 0
             GROUP BY c.category_id
             ORDER BY kg_co2 DESC'
        );
        $catStmt->execute([':uid' => $userId]);
        $byCategory = $catStmt->fetchAll();

        // ── 4. Joined challenge count ─────────────────────────────────────────
        $challengeStmt = $this->db->prepare(
            'SELECT COUNT(*) FROM `Challenge_Member` WHERE user_id = :uid'
        );
        $challengeStmt->execute([':uid' => $userId]);
        $joinedChallenges = (int) $challengeStmt->fetchColumn();

        // ── 5 & 6. Streak + badge evaluation/awarding ─────────────────────────
        // Shared with GET /api/badges via BadgeEvaluator so the rules live in one place.
        $gamification = new BadgeEvaluator($this->db);
        $streak       = $gamification->currentStreak($userId);
        $earnedBadges = $gamification->evaluateAndAward($userId, $streak);

        return JsonResponse::success($response, [
            'today_kg_co2'      => $todayKg,
            'yesterday_kg_co2'  => $yesterdayKg,
            'streak_days'       => $streak,
            'joined_challenges' => $joinedChallenges,
            'week'              => $weekRows,
            'by_category'       => $byCategory,
            'badges'            => $earnedBadges,
        ], 200);
    }
}
