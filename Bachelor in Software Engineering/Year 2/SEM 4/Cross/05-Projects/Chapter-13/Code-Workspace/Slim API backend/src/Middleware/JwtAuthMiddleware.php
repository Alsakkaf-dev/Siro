<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Support\Json;
use App\Support\Jwt;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;
use Throwable;

/**
 * Authenticates a request from its "Authorization: Bearer <jwt>" header.
 *
 * On success the authenticated user row is attached to the request as the
 * "user" attribute (and the raw claims as "claims") for downstream handlers.
 * On any failure a 401 JSON response is returned — which the frontend Axios
 * interceptor turns into an automatic logout.
 */
final class JwtAuthMiddleware implements MiddlewareInterface
{
    public function __construct(
        private readonly Jwt $jwt,
        private readonly PDO $pdo,
    ) {
    }

    public function process(Request $request, Handler $handler): Response
    {
        $header = $request->getHeaderLine('Authorization');
        if (!preg_match('/^\s*Bearer\s+(.+)\s*$/i', $header, $matches)) {
            return $this->unauthorized('Missing or malformed Authorization header.');
        }

        try {
            $claims = $this->jwt->verify(trim($matches[1]));
        } catch (Throwable) {
            return $this->unauthorized('Invalid or expired token.');
        }

        $userId = (int) ($claims['sub'] ?? 0);
        $statement = $this->pdo->prepare(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
        );
        $statement->execute([$userId]);
        $user = $statement->fetch();

        if ($user === false) {
            return $this->unauthorized('The authenticated user no longer exists.');
        }

        $user['id'] = (int) $user['id'];

        $request = $request
            ->withAttribute('user', $user)
            ->withAttribute('claims', $claims);

        return $handler->handle($request);
    }

    private function unauthorized(string $message): Response
    {
        return Json::write(new SlimResponse(), ['error' => $message], 401);
    }
}
