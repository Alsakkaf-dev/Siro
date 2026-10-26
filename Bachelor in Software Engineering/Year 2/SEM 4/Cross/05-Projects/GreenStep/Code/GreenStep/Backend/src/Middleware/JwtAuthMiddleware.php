<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Support\JsonResponse;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;
use Throwable;

/**
 * Verifies the JWT on protected routes and (optionally) enforces a role.
 *
 *   $app->get('/api/logs', ...)->add(new JwtAuthMiddleware($jwt));            // any logged-in user
 *   $app->post('/api/admin/tips', ...)->add(new JwtAuthMiddleware($jwt, 'admin')); // admin only
 *
 * On success the decoded claims are attached to the request as the 'user'
 * attribute, so controllers can read $request->getAttribute('user').
 *
 *  - Missing / malformed / expired token  -> 401 Unauthorized
 *  - Valid token but wrong role           -> 403 Forbidden
 *
 * Token issuance lives in AuthController/Security layer; this class only verifies.
 */
final class JwtAuthMiddleware implements MiddlewareInterface
{
    /** @param array<string,mixed> $jwtConfig the 'jwt' settings block */
    public function __construct(
        private array $jwtConfig,
        private ?string $requiredRole = null
    ) {
    }

    public function process(Request $request, Handler $handler): Response
    {
        $header = $request->getHeaderLine('Authorization');

        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return $this->deny('Missing or malformed Authorization header.', 401);
        }

        try {
            $decoded = JWT::decode(
                $matches[1],
                new Key($this->jwtConfig['secret'], $this->jwtConfig['alg'])
            );
        } catch (Throwable $e) {
            return $this->deny('Invalid or expired token.', 401);
        }

        if ($this->requiredRole !== null && ($decoded->role ?? null) !== $this->requiredRole) {
            return $this->deny('Insufficient permissions for this resource.', 403);
        }

        // Pass the authenticated identity downstream.
        $request = $request->withAttribute('user', (array) $decoded);

        return $handler->handle($request);
    }

    private function deny(string $message, int $status): Response
    {
        return JsonResponse::error(new SlimResponse(), $message, $status);
    }
}
