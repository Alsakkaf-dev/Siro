<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\ChallengeProgress;
use App\Support\JsonResponse;
use PDO;
use PDOException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Community Challenges — primary CRUD entity #2.
 * Table names match the authoritative schema (PascalCase, Linux case-sensitive safe):
 *   Challenge, Challenge_Member
 */
final class ChallengeController
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * GET /api/challenges -> list all challenges with member_count, is_joined, and
     * collective progress (days_left, collective_saved_kg, progress_pct) for the cards.
     */
    public function index(Request $request, Response $response): Response
    {
        $userId = (int) ($request->getAttribute('user')['sub'] ?? 0);

        $stmt = $this->db->prepare(
            'SELECT c.challenge_id                                                           AS id,
                    c.name,
                    c.description,
                    c.start_date,
                    c.end_date,
                    c.target_co2_reduction,
                    COUNT(cm.user_id)                                                        AS member_count,
                    CAST(MAX(CASE WHEN cm.user_id = :uid THEN 1 ELSE 0 END) AS UNSIGNED)     AS is_joined
             FROM   `Challenge` c
             LEFT   JOIN `Challenge_Member` cm ON cm.challenge_id = c.challenge_id
             GROUP  BY c.challenge_id
             ORDER  BY c.start_date DESC'
        );
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll();

        // Enrich each card with collective progress (one aggregate query per challenge;
        // fine at project scale — the challenge list is short).
        $progress = new ChallengeProgress($this->db);
        foreach ($rows as &$row) {
            $summary = $progress->summary(
                (int) $row['id'],
                (string) $row['start_date'],
                (string) $row['end_date'],
                (float) $row['target_co2_reduction']
            );
            $row['member_count']        = (int) $row['member_count'];
            $row['is_joined']           = (int) $row['is_joined'];
            $row['collective_saved_kg'] = $summary['collective_saved_kg'];
            $row['progress_pct']        = $summary['progress_pct'];
            $row['days_left']           = $summary['days_left'];
        }
        unset($row);

        return JsonResponse::success($response, $rows, 200);
    }

    /** GET /api/challenges/{id} -> one challenge with progress + per-member leaderboard */
    public function show(Request $request, Response $response, array $args): Response
    {
        $id = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false) {
            return JsonResponse::error($response, 'Invalid challenge ID.', 400);
        }

        $userId = (int) ($request->getAttribute('user')['sub'] ?? 0);

        $stmt = $this->db->prepare(
            'SELECT c.challenge_id                                                          AS id,
                    c.name,
                    c.description,
                    c.start_date,
                    c.end_date,
                    c.target_co2_reduction,
                    (SELECT COUNT(*) FROM `Challenge_Member` cm
                      WHERE cm.challenge_id = c.challenge_id)                               AS member_count,
                    (SELECT COUNT(*) FROM `Challenge_Member` cm
                      WHERE cm.challenge_id = c.challenge_id AND cm.user_id = :uid)         AS is_joined
             FROM   `Challenge` c
             WHERE  c.challenge_id = :id
             LIMIT  1'
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);
        $challenge = $stmt->fetch();

        if (!$challenge) {
            return JsonResponse::error($response, 'Challenge not found.', 404);
        }

        $progress = new ChallengeProgress($this->db);
        $summary  = $progress->summary(
            (int) $challenge['id'],
            (string) $challenge['start_date'],
            (string) $challenge['end_date'],
            (float) $challenge['target_co2_reduction']
        );

        $challenge['member_count']        = (int) $challenge['member_count'];
        $challenge['is_joined']           = (int) $challenge['is_joined'];
        $challenge['collective_saved_kg'] = $summary['collective_saved_kg'];
        $challenge['progress_pct']        = $summary['progress_pct'];
        $challenge['days_left']           = $summary['days_left'];
        $challenge['leaderboard']         = $progress->leaderboard(
            (int) $challenge['id'],
            (string) $challenge['start_date'],
            (string) $challenge['end_date']
        );

        return JsonResponse::success($response, $challenge, 200);
    }

    /** POST /api/challenges -> create (Community Leader) -> 201 */
    public function store(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            return JsonResponse::error($response, 'Challenge name is required.', 400);
        }

        $target = filter_var($body['target_co2_reduction'] ?? 0, FILTER_VALIDATE_FLOAT);
        if ($target === false) {
            return JsonResponse::error($response, 'target_co2_reduction must be a number.', 400);
        }

        $stmt = $this->db->prepare(
            'INSERT INTO `Challenge` (name, description, start_date, end_date, target_co2_reduction)
             VALUES (:name, :desc, :start, :end, :target)'
        );
        $stmt->execute([
            ':name'   => $name,
            ':desc'   => (string) ($body['description'] ?? ''),
            ':start'  => (string) ($body['start_date'] ?? date('Y-m-d')),
            ':end'    => (string) ($body['end_date'] ?? date('Y-m-d')),
            ':target' => $target,
        ]);

        return JsonResponse::success($response, ['id' => (int) $this->db->lastInsertId()], 201);
    }

    /** PUT /api/challenges/{id} -> partial update (Community Leader) */
    public function update(Request $request, Response $response, array $args): Response
    {
        $id = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false) {
            return JsonResponse::error($response, 'Invalid challenge ID.', 400);
        }

        $body   = (array) $request->getParsedBody();
        $sets   = [];
        $params = [':id' => $id];

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if ($name === '') {
                return JsonResponse::error($response, 'Challenge name cannot be empty.', 400);
            }
            $sets[':name'] = $name;
        }

        if (array_key_exists('description', $body)) {
            $sets[':desc'] = (string) $body['description'];
        }

        if (array_key_exists('target_co2_reduction', $body)) {
            $target = filter_var($body['target_co2_reduction'], FILTER_VALIDATE_FLOAT);
            if ($target === false) {
                return JsonResponse::error($response, 'target_co2_reduction must be a number.', 400);
            }
            $sets[':target'] = $target;
        }

        if (empty($sets)) {
            return JsonResponse::error($response, 'Provide at least one of: name, description, target_co2_reduction.', 400);
        }

        $columnMap  = [':name' => 'name', ':desc' => 'description', ':target' => 'target_co2_reduction'];
        $setClauses = [];
        foreach ($sets as $placeholder => $value) {
            $setClauses[]         = $columnMap[$placeholder] . ' = ' . $placeholder;
            $params[$placeholder] = $value;
        }

        $stmt = $this->db->prepare(
            'UPDATE `Challenge` SET ' . implode(', ', $setClauses) . ' WHERE challenge_id = :id'
        );
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            return JsonResponse::error($response, 'Challenge not found.', 404);
        }

        return JsonResponse::success($response, ['id' => $id], 200);
    }

    /** DELETE /api/challenges/{id} -> delete (Community Leader) */
    public function destroy(Request $request, Response $response, array $args): Response
    {
        $id = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false) {
            return JsonResponse::error($response, 'Invalid challenge ID.', 400);
        }

        $stmt = $this->db->prepare('DELETE FROM `Challenge` WHERE challenge_id = :id');
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            return JsonResponse::error($response, 'Challenge not found.', 404);
        }

        return JsonResponse::success($response, null, 200);
    }

    /** POST /api/challenges/{id}/join -> current user joins -> 201 */
    public function join(Request $request, Response $response, array $args): Response
    {
        $userId = (int) ($request->getAttribute('user')['sub'] ?? 0);
        $id     = filter_var($args['id'] ?? null, FILTER_VALIDATE_INT);

        if ($id === false) {
            return JsonResponse::error($response, 'Invalid challenge ID.', 400);
        }

        $check = $this->db->prepare('SELECT 1 FROM `Challenge` WHERE challenge_id = :id LIMIT 1');
        $check->execute([':id' => $id]);
        if (!$check->fetch()) {
            return JsonResponse::error($response, 'Challenge not found.', 404);
        }

        try {
            $stmt = $this->db->prepare(
                'INSERT INTO `Challenge_Member` (challenge_id, user_id) VALUES (:cid, :uid)'
            );
            $stmt->execute([':cid' => $id, ':uid' => $userId]);
        } catch (PDOException $e) {
            if ((string) $e->getCode() === '23000') {
                return JsonResponse::error($response, 'You have already joined this challenge.', 409);
            }
            throw $e;
        }

        return JsonResponse::success($response, ['challenge_id' => $id], 201);
    }
}
