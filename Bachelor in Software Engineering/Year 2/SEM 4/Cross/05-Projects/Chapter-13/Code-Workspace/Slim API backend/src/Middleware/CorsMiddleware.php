<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

/**
 * CORS handling for a token-based (header) API.
 *
 * Registered as the OUTERMOST middleware so that every response — including
 * errors produced deeper in the stack — carries the CORS headers the browser
 * needs in order to read them. Pre-flight OPTIONS requests are answered here
 * with 204 before routing, so no per-route OPTIONS handler is required.
 */
final class CorsMiddleware implements MiddlewareInterface
{
    /** @param string[] $allowedOrigins */
    public function __construct(private readonly array $allowedOrigins)
    {
    }

    public function process(Request $request, Handler $handler): Response
    {
        $origin = $request->getHeaderLine('Origin');
        $allowOrigin = $this->resolveOrigin($origin);

        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            return $this->decorate(new SlimResponse(204), $allowOrigin);
        }

        return $this->decorate($handler->handle($request), $allowOrigin);
    }

    private function resolveOrigin(string $origin): string
    {
        if ($origin === '') {
            return '';
        }
        if (in_array('*', $this->allowedOrigins, true)) {
            // Reflect the caller's origin. Safe here because the API is
            // stateless (Bearer tokens, no cookies) — we never set credentials.
            return $origin;
        }
        return in_array($origin, $this->allowedOrigins, true) ? $origin : '';
    }

    private function decorate(Response $response, string $allowOrigin): Response
    {
        if ($allowOrigin !== '') {
            $response = $response
                ->withHeader('Access-Control-Allow-Origin', $allowOrigin)
                ->withHeader('Vary', 'Origin');
        }

        return $response
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin')
            ->withHeader('Access-Control-Max-Age', '86400');
    }
}
