<?php

declare(strict_types=1);

namespace App\Support;

use PDO;

/**
 * Collective challenge progress — Objective 5: "aggregate collective data metrics
 * for community challenges", and the Community Leader persona's "monitoring aggregated
 * group progress … against shared goals".
 *
 * Reduction is measured as a BASELINE-vs-DURING comparison, exactly as the PR1
 * challenge mock-up frames it: "reduce your total emissions by 20% compared to last
 * week". `Challenge.target_co2_reduction` is an absolute kg figure, so progress is
 * expressed as the kg saved relative to that target.
 *
 * For a challenge running [start_date .. end_date] (inclusive, D days):
 *   during window   = [start_date, end_date]
 *   baseline window = the D days immediately BEFORE start_date
 *   member saved_kg = footprint(baseline) − footprint(during)
 *   collective_saved_kg = Σ members' saved_kg          (net; a member who emitted
 *                                                        more contributes negatively)
 *   progress_pct = clamp(collective_saved_kg / target_co2_reduction × 100, 0, 100)
 *
 * Computed entirely from existing tables (Challenge_Member, Activity_Log,
 * Activity_Type) — no schema change, so no dependency on the Database lead.
 *
 * Table names match the authoritative schema (PascalCase, Linux case-sensitive safe):
 *   Challenge_Member, Activity_Log, Activity_Type, User
 */
final class ChallengeProgress
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * Headline numbers for one challenge.
     *
     * @return array{collective_saved_kg:float,progress_pct:float,days_left:int}
     */
    public function summary(int $challengeId, string $startDate, string $endDate, float $target): array
    {
        $w = $this->windows($startDate, $endDate);

        $stmt = $this->db->prepare(
            'SELECT ROUND(
                        SUM(CASE WHEN DATE(al.logged_on) BETWEEN :base_start AND :base_end
                                 THEN al.amount * at.kg_co2_per_unit ELSE 0 END)
                      - SUM(CASE WHEN DATE(al.logged_on) BETWEEN :dur_start AND :dur_end
                                 THEN al.amount * at.kg_co2_per_unit ELSE 0 END)
                    , 4) AS collective_saved
             FROM   `Challenge_Member` cm
             LEFT   JOIN `Activity_Log` al
                    ON  al.user_id = cm.user_id
                    AND DATE(al.logged_on) BETWEEN :all_start AND :all_end
             LEFT   JOIN `Activity_Type` at
                    ON  at.activity_type_id = al.activity_type_id
             WHERE  cm.challenge_id = :cid'
        );
        $stmt->execute([
            ':base_start' => $w['base_start'],
            ':base_end'   => $w['base_end'],
            ':dur_start'  => $w['dur_start'],
            ':dur_end'    => $w['dur_end'],
            ':all_start'  => $w['base_start'],
            ':all_end'    => $w['dur_end'],
            ':cid'        => $challengeId,
        ]);

        $saved = (float) ($stmt->fetchColumn() ?: 0);

        $progress = 0.0;
        if ($target > 0) {
            $progress = max(0.0, min(100.0, round($saved / $target * 100, 2)));
        }

        return [
            'collective_saved_kg' => $saved,
            'progress_pct'        => $progress,
            'days_left'           => $this->daysLeft($endDate),
        ];
    }

    /**
     * Per-member contribution, ranked best-saver first — powers the challenge
     * "View Details" leaderboard.
     *
     * @return list<array{user_id:int,name:string,saved_kg:float}>
     */
    public function leaderboard(int $challengeId, string $startDate, string $endDate): array
    {
        $w = $this->windows($startDate, $endDate);

        $stmt = $this->db->prepare(
            'SELECT u.user_id,
                    u.name,
                    ROUND(
                        SUM(CASE WHEN DATE(al.logged_on) BETWEEN :base_start AND :base_end
                                 THEN al.amount * at.kg_co2_per_unit ELSE 0 END)
                      - SUM(CASE WHEN DATE(al.logged_on) BETWEEN :dur_start AND :dur_end
                                 THEN al.amount * at.kg_co2_per_unit ELSE 0 END)
                    , 4) AS saved_kg
             FROM   `Challenge_Member` cm
             JOIN   `User` u ON u.user_id = cm.user_id
             LEFT   JOIN `Activity_Log` al
                    ON  al.user_id = cm.user_id
                    AND DATE(al.logged_on) BETWEEN :all_start AND :all_end
             LEFT   JOIN `Activity_Type` at
                    ON  at.activity_type_id = al.activity_type_id
             WHERE  cm.challenge_id = :cid
             GROUP  BY u.user_id, u.name
             ORDER  BY saved_kg DESC, u.name ASC'
        );
        $stmt->execute([
            ':base_start' => $w['base_start'],
            ':base_end'   => $w['base_end'],
            ':dur_start'  => $w['dur_start'],
            ':dur_end'    => $w['dur_end'],
            ':all_start'  => $w['base_start'],
            ':all_end'    => $w['dur_end'],
            ':cid'        => $challengeId,
        ]);

        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[] = [
                'user_id'  => (int) $row['user_id'],
                'name'     => $row['name'],
                'saved_kg' => (float) ($row['saved_kg'] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * Resolve the during/baseline date windows for a challenge.
     *
     * @return array{base_start:string,base_end:string,dur_start:string,dur_end:string}
     */
    private function windows(string $startDate, string $endDate): array
    {
        $start = new \DateTimeImmutable($startDate);
        $end   = new \DateTimeImmutable($endDate);

        // Inclusive duration; guard against an end_date before start_date.
        $durationDays = max(1, (int) $start->diff($end)->days + 1);

        return [
            'base_start' => $start->modify('-' . $durationDays . ' day')->format('Y-m-d'),
            'base_end'   => $start->modify('-1 day')->format('Y-m-d'),
            'dur_start'  => $start->format('Y-m-d'),
            'dur_end'    => $end->format('Y-m-d'),
        ];
    }

    /** Whole days remaining until end_date (0 once the challenge has ended). */
    private function daysLeft(string $endDate): int
    {
        $today = new \DateTimeImmutable('today');
        $end   = new \DateTimeImmutable($endDate);

        return $today > $end ? 0 : (int) $today->diff($end)->days;
    }
}
