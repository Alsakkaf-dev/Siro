<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\JsonResponse;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Activity Types — the emission-factor catalogue (read-only for authenticated users).
 * Table names match the authoritative schema (PascalCase, Linux case-sensitive safe):
 *   Activity_Type, Category
 */
final class ActivityTypeController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/activity-types -> full catalogue ordered by category then name */
    public function index(Request $request, Response $response): Response
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
}
