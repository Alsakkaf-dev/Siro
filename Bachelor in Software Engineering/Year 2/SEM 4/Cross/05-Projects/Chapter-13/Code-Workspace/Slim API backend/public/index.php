<?php

declare(strict_types=1);

/**
 * SCSM2223 — Books REST API
 * Front controller / application bootstrap.
 *
 * Run locally with PHP's built-in server:
 *     php -S localhost:8000 -t public
 */

use App\Controllers\AuthController;
use App\Controllers\BookController;
use App\Middleware\CorsMiddleware;
use App\Middleware\JwtAuthMiddleware;
use App\Support\Database;
use App\Support\Json;
use App\Support\Jwt;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Exception\HttpException;
use Slim\Exception\HttpMethodNotAllowedException;
use Slim\Exception\HttpNotFoundException;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$settings = require __DIR__ . '/../src/settings.php';

// --- Wiring (no DI container needed) -----------------------------------------
$pdo = Database::connect($settings['db']);
$jwt = new Jwt(
    $settings['jwt']['secret'],
    $settings['jwt']['issuer'],
    $settings['jwt']['ttl'],
);

$app = AppFactory::create();

// Parse JSON / form bodies into the request.
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

// Error handling -> consistent JSON shape ({ "error": "..." }).
$errorMiddleware = $app->addErrorMiddleware((bool) $settings['debug'], true, true);
$errorMiddleware->setDefaultErrorHandler(
    static function (
        Request $request,
        Throwable $exception,
        bool $displayErrorDetails
    ) use ($app): Response {
        $status = 500;
        $message = $displayErrorDetails ? $exception->getMessage() : 'Internal server error.';

        if ($exception instanceof HttpNotFoundException) {
            $status = 404;
            $message = 'The requested resource was not found.';
        } elseif ($exception instanceof HttpMethodNotAllowedException) {
            $status = 405;
            $message = 'Method not allowed for this resource.';
        } elseif ($exception instanceof HttpException) {
            $status = $exception->getCode() ?: 500;
            $message = $exception->getMessage();
        }

        $response = $app->getResponseFactory()->createResponse($status);
        return Json::write($response, ['error' => $message], $status);
    }
);

// CORS as the OUTERMOST middleware so even error responses carry the headers.
$app->add(new CorsMiddleware($settings['cors']));

// --- Routes ------------------------------------------------------------------
(require __DIR__ . '/../src/routes.php')($app, [
    'auth'  => new AuthController($pdo, $jwt, $settings['jwt']['ttl']),
    'books' => new BookController($pdo),
    'jwt'   => new JwtAuthMiddleware($jwt, $pdo),
    'pdo'   => $pdo,
]);

$app->run();
