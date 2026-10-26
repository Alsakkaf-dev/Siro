<?php

declare(strict_types=1);

namespace App\Support;

use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Exception\HttpException;
use Throwable;

/**
 * Default error handler registered on Slim's error middleware.
 *
 * Maps thrown exceptions to HTTP status codes and a consistent JSON body, so the
 * client never receives an HTML stack trace. Slim's own HttpException subclasses
 * (HttpNotFoundException -> 404, HttpUnauthorizedException -> 401, etc.) already
 * carry the correct code; anything else is treated as a 500.
 */
final class JsonErrorHandler
{
    public function __construct(private ResponseFactoryInterface $responseFactory)
    {
    }

    public function __invoke(
        ServerRequestInterface $request,
        Throwable $exception,
        bool $displayErrorDetails,
        bool $logErrors,
        bool $logErrorDetails
    ): ResponseInterface {
        $status  = $exception instanceof HttpException ? $exception->getCode() : 500;
        $message = $exception instanceof HttpException
            ? $exception->getMessage()
            : 'Internal Server Error';

        // Only leak the real exception text in development.
        $details = $displayErrorDetails ? $exception->getMessage() : null;

        $response = $this->responseFactory->createResponse($status);

        return JsonResponse::error($response, $message, $status, $details);
    }
}
