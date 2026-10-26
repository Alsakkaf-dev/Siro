<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Support\JsonResponse;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class SettingsController
{
    private const KNOWN_KEYS = [
        'site_name',
        'maintenance_mode',
        'password_min_length',
        'password_require_upper',
        'password_require_number',
    ];

    public function __construct(private PDO $db)
    {
    }

    /** GET /api/admin/settings -> all settings (admin only) */
    public function index(Request $request, Response $response): Response
    {
        return JsonResponse::success($response, $this->fetchAll(), 200);
    }

    /** PUT /api/admin/settings -> update one or more settings (admin only) */
    public function update(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();

        $stmt = $this->db->prepare(
            'INSERT INTO `Setting` (setting_key, setting_value) VALUES (:k, :v)
             ON DUPLICATE KEY UPDATE setting_value = :v2'
        );

        foreach (self::KNOWN_KEYS as $key) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $value = is_bool($body[$key]) ? ($body[$key] ? '1' : '0') : (string) $body[$key];
            $stmt->execute([':k' => $key, ':v' => $value, ':v2' => $value]);
        }

        return JsonResponse::success($response, $this->fetchAll(), 200);
    }

    /** GET /api/settings/public -> site_name + maintenance_mode only (no auth) */
    public function publicSettings(Request $request, Response $response): Response
    {
        $all = $this->fetchAll();

        return JsonResponse::success($response, [
            'site_name'        => $all['site_name'] ?? 'GreenStep',
            'maintenance_mode' => (bool) ($all['maintenance_mode'] ?? '0'),
        ], 200);
    }

    /** @return array<string,string> */
    private function fetchAll(): array
    {
        $rows = $this->db->query('SELECT setting_key, setting_value FROM `Setting`')->fetchAll();
        $out  = [];
        foreach ($rows as $row) {
            $out[$row['setting_key']] = $row['setting_value'];
        }
        return $out;
    }
}