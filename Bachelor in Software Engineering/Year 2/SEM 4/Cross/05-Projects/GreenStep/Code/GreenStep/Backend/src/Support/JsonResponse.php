<?php

declare(strict_types=1);

namespace App\Support;

use Psr\Http\Message\ResponseInterface as Response;

/**
 * Uniform JSON output for the whole API.
 *
 * Success envelope: { "success": true,  "data": <payload> }
 * Error envelope:   { "success": false, "error": { "message": "...", "details": ... } }
 *
 * Keeping one shape means the Vue frontend can parse every response the same way.
 */
final class JsonResponse
{
    public static function success(Response $response, mixed $data = null, int $status = 200): Response
    {
        return self::write($response, ['success' => true, 'data' => $data], $status);
    }

    public static function error(Response $response, string $message, int $status = 400, mixed $details = null): Response
    {
        $body = ['success' => false, 'error' => ['message' => $message]];
        if ($details !== null) {
            $body['error']['details'] = $details;
        }
        return self::write($response, $body, $status);
    }

    private static function write(Response $response, array $body, int $status): Response
    {
        $response->getBody()->write(
            json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
