-- ============================================================================
--  SCSM2223 — Books API : MySQL schema + seed data
--  Apply with:  mysql -u root < sql/schema.sql
--  (Laragon: open the MySQL shell, or import this file in phpMyAdmin.)
--
--  Seeded passwords are bcrypt hashes of the word:  password
--    admin@books.test  / password   (role: admin)
--    member@books.test / password   (role: member)
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS `books`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE `books`;

-- Drop in dependency order so the script is re-runnable.
DROP TABLE IF EXISTS `login_attempts`;
DROP TABLE IF EXISTS `books`;
DROP TABLE IF EXISTS `users`;

-- ---------------------------------------------------------------------------
--  Users
-- ---------------------------------------------------------------------------
CREATE TABLE `users` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`          VARCHAR(100) NOT NULL,
    `email`         VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role`          ENUM('admin','member') NOT NULL DEFAULT 'member',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
--  Books
-- ---------------------------------------------------------------------------
CREATE TABLE `books` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title`      VARCHAR(200) NOT NULL,
    `author`     VARCHAR(120) NOT NULL,
    `year`       SMALLINT NOT NULL,
    `genre`      VARCHAR(80) DEFAULT NULL,
    `created_by` INT UNSIGNED DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_books_title`  (`title`),
    KEY `idx_books_author` (`author`),
    KEY `idx_books_owner`  (`created_by`),
    CONSTRAINT `fk_books_user`
        FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
--  Login attempts (powers the per-email/IP login throttle -> HTTP 429)
-- ---------------------------------------------------------------------------
CREATE TABLE `login_attempts` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email`      VARCHAR(190) NOT NULL,
    `ip`         VARCHAR(45) NOT NULL,
    `success`    TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_attempts_lookup` (`email`, `ip`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
--  Seed: users  (password = "password")
-- ---------------------------------------------------------------------------
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `created_at`) VALUES
('Site Admin',  'admin@books.test',  '$2y$10$xVvXALo8phVnYp5daS2a/.czlU9VQGkakPOqOKwxYcI6HYDM84Uau', 'admin',  UTC_TIMESTAMP()),
('Demo Member', 'member@books.test', '$2y$10$kFHG6iu88Io.cLQC2jl7S.kgkf4uDGt8uuaf6xaPrAuzR96GhgNaK', 'member', UTC_TIMESTAMP());

-- ---------------------------------------------------------------------------
--  Seed: books  (owner 1 = admin, owner 2 = member)
--  Two "Clean ..." titles guarantee the lab's  ?q=clean  search returns rows.
-- ---------------------------------------------------------------------------
INSERT INTO `books` (`title`, `author`, `year`, `genre`, `created_by`, `created_at`) VALUES
('Clean Code',                     'Robert C. Martin',                 2008, 'Software',         1, UTC_TIMESTAMP()),
('Clean Architecture',             'Robert C. Martin',                 2017, 'Software',         1, UTC_TIMESTAMP()),
('The Pragmatic Programmer',       'Andrew Hunt & David Thomas',       1999, 'Software',         1, UTC_TIMESTAMP()),
('Refactoring',                    'Martin Fowler',                    2018, 'Software',         2, UTC_TIMESTAMP()),
('Design Patterns',                'Gamma, Helm, Johnson, Vlissides',  1994, 'Software',         2, UTC_TIMESTAMP()),
('Introduction to Algorithms',     'Cormen, Leiserson, Rivest, Stein', 2009, 'Computer Science', 1, UTC_TIMESTAMP()),
('Eloquent JavaScript',            'Marijn Haverbeke',                 2018, 'JavaScript',       2, UTC_TIMESTAMP()),
('The Mythical Man-Month',         'Frederick P. Brooks Jr.',          1975, 'Management',       1, UTC_TIMESTAMP());
