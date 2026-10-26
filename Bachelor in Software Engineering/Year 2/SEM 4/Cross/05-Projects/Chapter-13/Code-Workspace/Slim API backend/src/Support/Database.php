<?php

declare(strict_types=1);

namespace App\Support;

use PDO;
use RuntimeException;
use Throwable;

/**
 * Thin PDO factory. Supports MySQL (production / Laragon) and SQLite
 * (zero-config local testing) chosen by the DB_DRIVER setting.
 *
 * The connection is created once per request and reused.
 */
final class Database
{
    private static ?PDO $pdo = null;

    /**
     * @param array<string,mixed> $config
     */
    public static function connect(array $config): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $driver = (string) ($config['driver'] ?? 'mysql');

        try {
            self::$pdo = $driver === 'sqlite'
                ? self::connectSqlite($config)
                : self::connectMysql($config);
        } catch (Throwable $e) {
            throw new RuntimeException('Database connection failed: ' . $e->getMessage(), 0, $e);
        }

        return self::$pdo;
    }

    /** @param array<string,mixed> $config */
    private static function connectMysql(array $config): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $config['host'] ?? '127.0.0.1',
            $config['port'] ?? '3306',
            $config['database'] ?? 'books',
        );

        return new PDO($dsn, (string) ($config['username'] ?? 'root'), (string) ($config['password'] ?? ''), [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    /** @param array<string,mixed> $config */
    private static function connectSqlite(array $config): PDO
    {
        $path = (string) ($config['database'] ?? ':memory:');
        if ($path !== ':memory:' && !is_dir(dirname($path))) {
            @mkdir(dirname($path), 0775, true);
        }

        $pdo = new PDO('sqlite:' . $path, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');

        return $pdo;
    }

    /** Reset the cached connection (used by tests). */
    public static function reset(): void
    {
        self::$pdo = null;
    }
}
