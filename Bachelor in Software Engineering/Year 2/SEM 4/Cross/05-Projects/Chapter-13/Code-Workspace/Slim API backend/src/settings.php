<?php

declare(strict_types=1);

/**
 * Application settings.
 *
 * Loads a local .env file (if present) with a tiny dependency-free parser,
 * then returns a fully-resolved configuration array. Environment variables
 * always win over the .env file, which always wins over the built-in defaults.
 */

// --- Minimal .env loader (no external dependency) ----------------------------
(static function (): void {
    $envFile = dirname(__DIR__) . '/.env';
    if (!is_file($envFile) || !is_readable($envFile)) {
        return;
    }
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        // Strip a single pair of surrounding quotes, if present.
        $len = strlen($value);
        if ($len >= 2
            && ($value[0] === '"' || $value[0] === "'")
            && $value[$len - 1] === $value[0]) {
            $value = substr($value, 1, -1);
        }

        // Do not clobber a real environment variable that is already set.
        if ($key !== '' && getenv($key) === false) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
})();

/** Read an env var with a typed default. */
$env = static function (string $key, ?string $default = null): ?string {
    $value = getenv($key);
    return $value === false ? $default : $value;
};

$asBool = static function (?string $value, bool $default): bool {
    if ($value === null) {
        return $default;
    }
    return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
};

return [
    'debug' => $asBool($env('APP_DEBUG', 'true'), true),

    'db' => [
        'driver'   => $env('DB_DRIVER', 'mysql'),
        'host'     => $env('DB_HOST', '127.0.0.1'),
        'port'     => $env('DB_PORT', '3306'),
        'database' => $env('DB_NAME', 'books'),
        'username' => $env('DB_USER', 'root'),
        'password' => $env('DB_PASS', ''),
    ],

    'jwt' => [
        // `?:` so a present-but-empty JWT_SECRET= also falls back (never empty -> never throws).
        'secret' => $env('JWT_SECRET') ?: 'insecure-development-secret-change-me',
        'issuer' => $env('JWT_ISSUER', 'books-api'),
        'ttl'    => (int) $env('JWT_TTL', '3600'),
    ],

    // Comma-separated origins -> clean array.
    'cors' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) $env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:4173'))
    ))),
];
