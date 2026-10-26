-- ============================================================================
--  SQLite equivalent of schema.sql — ONLY for zero-config local testing
--  (set DB_DRIVER=sqlite, DB_NAME=./storage/books.sqlite).
--  Production uses sql/schema.sql (MySQL).
--
--  Apply with:  sqlite3 storage/books.sqlite < sql/schema.sqlite.sql
--  Seeded passwords are bcrypt hashes of:  password
-- ============================================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
);

CREATE TABLE books (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    author     TEXT NOT NULL,
    year       INTEGER NOT NULL,
    genre      TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')),
    updated_at TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_books_title  ON books(title);
CREATE INDEX idx_books_author ON books(author);

CREATE TABLE login_attempts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL,
    ip         TEXT NOT NULL,
    success    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
);
CREATE INDEX idx_attempts_lookup ON login_attempts(email, ip, created_at);

INSERT INTO users (name, email, password_hash, role) VALUES
('Site Admin',  'admin@books.test',  '$2y$10$xVvXALo8phVnYp5daS2a/.czlU9VQGkakPOqOKwxYcI6HYDM84Uau', 'admin'),
('Demo Member', 'member@books.test', '$2y$10$kFHG6iu88Io.cLQC2jl7S.kgkf4uDGt8uuaf6xaPrAuzR96GhgNaK', 'member');

INSERT INTO books (title, author, year, genre, created_by) VALUES
('Clean Code',                 'Robert C. Martin',                 2008, 'Software',         1),
('Clean Architecture',         'Robert C. Martin',                 2017, 'Software',         1),
('The Pragmatic Programmer',   'Andrew Hunt & David Thomas',       1999, 'Software',         1),
('Refactoring',                'Martin Fowler',                    2018, 'Software',         2),
('Design Patterns',            'Gamma, Helm, Johnson, Vlissides',  1994, 'Software',         2),
('Introduction to Algorithms', 'Cormen, Leiserson, Rivest, Stein', 2009, 'Computer Science', 1),
('Eloquent JavaScript',        'Marijn Haverbeke',                 2018, 'JavaScript',       2),
('The Mythical Man-Month',     'Frederick P. Brooks Jr.',          1975, 'Management',       1);
