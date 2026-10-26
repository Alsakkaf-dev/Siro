<?php

declare(strict_types=1);

/**
 * Central application settings.
 * Values are read from environment variables (loaded from .env in public/index.php)
 * so secrets never live in source control.
 */
return [
    'displayErrorDetails' => filter_var($_ENV['DISPLAY_ERROR_DETAILS'] ?? false, FILTER_VALIDATE_BOOL),

    'db' => [
        'host'    => $_ENV['DB_HOST'] ?? '127.0.0.1',
        'port'    => $_ENV['DB_PORT'] ?? '3306',
        'name'    => $_ENV['DB_NAME'] ?? 'greenstep',
        'user'    => $_ENV['DB_USER'] ?? 'root',
        'pass'    => $_ENV['DB_PASS'] ?? '',
        'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
    ],

    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'] ?? 'insecure-dev-secret',
        'issuer' => $_ENV['JWT_ISSUER'] ?? 'greenstep-api',
        'ttl'    => (int) ($_ENV['JWT_TTL'] ?? 3600),
        'alg'    => 'HS256',
    ],
];
