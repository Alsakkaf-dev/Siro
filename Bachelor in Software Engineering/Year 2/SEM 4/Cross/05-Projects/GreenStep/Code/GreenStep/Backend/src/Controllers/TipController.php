<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\JsonResponse;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Eco-tips shown to users. One randomised tip per call.
 * Table names match the authoritative schema (PascalCase, Linux case-sensitive safe):
 *   Tip, Category
 */
final class TipController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/tips/daily -> one random tip */
    public function daily(Request $request, Response $response): Response
    {
        $stmt = $this->db->query(
            'SELECT t.tip_id   AS id,
                    t.title,
                    t.body,
                    c.name     AS category,
                    t.source_url
             FROM   `Tip` t
             LEFT   JOIN `Category` c ON c.category_id = t.category_id
             ORDER  BY RAND()
             LIMIT  1'
        );
        $tip = $stmt->fetch();

        if (!$tip) {
            return JsonResponse::error($response, 'No tips available.', 404);
        }

        return JsonResponse::success($response, $tip, 200);
    }
}
