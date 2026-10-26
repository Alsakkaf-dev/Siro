<?php

declare(strict_types=1);

namespace App\Database;

use PDO;

/**
 * Thin PDO factory. Produces a single, hardened PDO connection for the whole app.
 *
 * Hardening choices (defended in the proposal, Section III.3):
 *  - ERRMODE_EXCEPTION  -> failures throw, caught by the central error handler.
 *  - EMULATE_PREPARES = false -> the MySQL server does the real preparing, so
 *    parameters can never be reinterpreted as SQL. This is the structural SQLi defence.
 *  - DEFAULT_FETCH_MODE = FETCH_ASSOC -> predictable associative arrays for JSON.
 */
final class Database
{
    private static ?PDO $instance = null;

    /** @param array<string,mixed> $config the 'db' settings block */
    public static function connect(array $config): PDO
    {
        if (self::$instance instanceof PDO) {
            return self::$instance;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['name'],
            $config['charset']
        );
  
        self::$instance = new PDO($dsn, $config['user'], $config['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // to throw exceptions on errors
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // to return associative arrays instead of numeric arrays
            PDO::ATTR_EMULATE_PREPARES   => false, // to prevent SQL injection attacks
        ]);

        return self::$instance;
    }
}
