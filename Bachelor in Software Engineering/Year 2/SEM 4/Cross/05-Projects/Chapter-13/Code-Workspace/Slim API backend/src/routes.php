<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\BookController;
use App\Middleware\JwtAuthMiddleware;
use App\Support\Json;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

/**
 * Register all routes.
 *
 * @param App                  $app
 * @param array{
 *   auth: AuthController,
 *   books: BookController,
 *   jwt: JwtAuthMiddleware,
 *   pdo: PDO
 * } $deps
 */
return static function (App $app, array $deps): void {
    /** @var AuthController $auth */
    $auth = $deps['auth'];
    /** @var BookController $books */
    $books = $deps['books'];
    /** @var JwtAuthMiddleware $requireAuth */
    $requireAuth = $deps['jwt'];

    // --- Health / root -------------------------------------------------------
    $app->get('/', static function (Request $request, Response $response) {
        return Json::write($response, [
            'name'    => 'UTM Books API',
            'status'  => 'ok',
            'version' => '1.0.0',
            'time'    => gmdate('c'),
            'docs'    => ['GET /api/health', 'POST /auth/login', 'GET /api/books'],
        ]);
    });

    $app->get('/api/health', static function (Request $request, Response $response) use ($deps) {
        $db = 'connected';
        try {
            $deps['pdo']->query('SELECT 1');
        } catch (\Throwable $e) {
            $db = 'error';
        }
        $status = $db === 'connected' ? 200 : 503;
        return Json::write($response, [
            'status' => $db === 'connected' ? 'ok' : 'degraded',
            'db'     => $db,
            'time'   => gmdate('c'),
        ], $status);
    });

    // --- Auth ----------------------------------------------------------------
    $app->post('/auth/register', [$auth, 'register']);
    $app->post('/auth/login', [$auth, 'login']);
    $app->get('/auth/me', [$auth, 'me'])->add($requireAuth);

    // --- Books ---------------------------------------------------------------
    // Public reads so the home page works for signed-out visitors.
    $app->get('/api/books', [$books, 'index']);
    $app->get('/api/books/{id:[0-9]+}', [$books, 'show']);

    // Protected writes.
    $app->post('/api/books', [$books, 'store'])->add($requireAuth);
    $app->put('/api/books/{id:[0-9]+}', [$books, 'update'])->add($requireAuth);
    $app->patch('/api/books/{id:[0-9]+}', [$books, 'update'])->add($requireAuth);
    $app->delete('/api/books/{id:[0-9]+}', [$books, 'destroy'])->add($requireAuth);
};
