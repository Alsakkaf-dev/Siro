# CH10 Mastery — MySQL Integration: PDO + Prepared Statements (+ Ch8's mysql2 recap)

> Sources: SCSM2223_Ch10_Slides_v2 + Ch10 Lab Manual v2 (Books API refactor to MySQL via **PDO**), plus Ch8 Lab (mysql2, Student Records schema).
> ⚠️ The course's *dedicated* database chapter (Ch10) is **PHP PDO**, used by the Slim Books API. The Node side (Ch8) used **mysql2**. SQL itself (CREATE TABLE / INSERT / SELECT / UPDATE / DELETE / LIKE / ORDER BY / LIMIT) is identical in both — and is a prime blank target.

---

## 1. The Mental Model (5 lines)

1. **PDO = PHP Data Objects** — one consistent OO API over 12 engines (MySQL, PostgreSQL, SQLite…); switch engines by changing only the **DSN** string.
2. Connect = `new PDO($dsn, $user, $pass, $options)` with three sacred options: **ERRMODE_EXCEPTION** (throw on errors), **FETCH_ASSOC** (assoc arrays), **EMULATE_PREPARES = false** (real server-side prepares).
3. **Never concatenate user input into SQL.** `prepare()` the statement with `?` or `:name` placeholders, then `execute([values])` — the data never becomes part of the query = SQL injection eliminated.
4. Read with `fetch()` (one row / false) or `fetchAll()`; write results via `lastInsertId()` (INSERT) and `rowCount()` (UPDATE/DELETE → detect 404).
5. **Repository pattern**: controllers stay thin (HTTP only); one Repository class owns ALL SQL for a resource; transactions (`beginTransaction/commit/rollBack`) make multi-statement writes all-or-nothing.

---

## 2. The schemas he uses (memorize the column style)

### books table (Ch10)
```sql
CREATE DATABASE IF NOT EXISTS books_api
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;          -- ⚡ utf8mb4 always
USE books_api;

DROP TABLE IF EXISTS books;

CREATE TABLE books (
    id         INT AUTO_INCREMENT PRIMARY KEY,               -- ⚡ AUTO_INCREMENT PK
    title      VARCHAR(200) NOT NULL,
    author     VARCHAR(150) NOT NULL,
    year       SMALLINT     NOT NULL,
    genre      VARCHAR(80)  NOT NULL DEFAULT 'Uncategorised',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- ⚡ timestamp defaults
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP      -- ⚡ auto-touch on UPDATE
) ENGINE=InnoDB;

INSERT INTO books (title, author, year, genre) VALUES
  ('Clean Code',          'Robert C. Martin', 2008, 'Software Engineering'),
  ('Eloquent JavaScript', 'Marijn Haverbeke', 2018, 'Programming'),
  ('Vue.js 3 By Example', 'John Au-Yeung',    2021, 'Web Development');
```

### students table (Ch8 — mysql2 side)
```sql
CREATE TABLE students (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  matricNo VARCHAR(10) NOT NULL UNIQUE,                      -- ⚡ UNIQUE → ER_DUP_ENTRY → 409
  name     VARCHAR(120) NOT NULL,
  course   VARCHAR(150) NOT NULL,
  faculty  VARCHAR(30)  NOT NULL,
  gpa      DECIMAL(3,2) NOT NULL,                            -- ⚡ DECIMAL returns as STRING in JS
  email    VARCHAR(120) NOT NULL,
  year     TINYINT      NOT NULL,
  active   TINYINT(1)   NOT NULL DEFAULT 1,                  -- boolean style
  CHECK (gpa >= 0 AND gpa <= 4)
) ENGINE=InnoDB;
```

---

## 3. PDO connection (DSN anatomy — slide 6)

```php
$dsn = 'mysql:host=127.0.0.1;dbname=books_api;charset=utf8mb4';  // ⚡ DSN format
$pdo = new PDO($dsn, 'root', '', [                               // user, pass (Laragon: empty)
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,      // ⚡ throw on errors
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,            // ⚡ assoc arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                       // ⚡ real prepared stmts
]);
```

### Lab's Database factory with .env (vlucas/phpdotenv)
```php
composer require vlucas/phpdotenv
// public/index.php bootstrap:
Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();     // ⚡ load .env

// src/Database.php — singleton-style factory
final class Database {
    private static ?PDO $pdo = null;
    public static function get(): PDO {
        if (self::$pdo) return self::$pdo;                       // reuse one instance
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $_ENV['DB_HOST'] ?? '127.0.0.1', $_ENV['DB_PORT'] ?? '3306',
            $_ENV['DB_NAME'] ?? 'books_api', $_ENV['DB_CHARSET'] ?? 'utf8mb4');
        self::$pdo = new PDO($dsn, $_ENV['DB_USER'] ?? 'root', $_ENV['DB_PASS'] ?? '', [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return self::$pdo;
    }
}
```
.env keys: `DB_HOST DB_PORT DB_NAME DB_USER DB_PASS DB_CHARSET` (+ `.env.example` committed, `.env` ignored).

---

## 4. query() vs prepare()/execute() — THE security slide

```php
// ✗ NEVER — string concatenation = SQL injection
$sql = "SELECT * FROM books WHERE id = $id";       // ?id=1 OR 1=1 dumps the table

// ✓ ALWAYS — placeholder
$stmt = $pdo->prepare('SELECT * FROM books WHERE id = ?');   // ⚡ prepare
$stmt->execute([$id]);                                       // ⚡ execute with array
$row = $stmt->fetch();
```
Injection demo (login bypass): username `admin' --` turns
`...WHERE username='admin' --' AND password='...'` — everything after `--` is a comment. Prepared statements kill the entire attack class because **data never becomes query text**.

### Positional vs named placeholders
```php
// Positional ? — indexed array, ORDER MATTERS
$stmt = $pdo->prepare('INSERT INTO books(title,author,year) VALUES(?, ?, ?)');
$stmt->execute([$title, $author, $year]);

// Named :name — assoc array, order-free (course favourite)
$stmt = $pdo->prepare('INSERT INTO books(title,author,year) VALUES(:t, :a, :y)');
$stmt->execute([':t' => $title, ':a' => $author, ':y' => $year]);
```
**GOTCHA (lab callout):** with `EMULATE_PREPARES=false`, each named placeholder must be **UNIQUE** — reuse raises `SQLSTATE HY093 Invalid parameter number`. Need same value twice? `:q_title` and `:q_author`, bind both.

### Fetch modes
| Call | Returns |
|---|---|
| `$stmt->fetch()` | next row (assoc) or **false** |
| `$stmt->fetchAll()` | all rows array |
| `$stmt->fetch(PDO::FETCH_OBJ)` | stdClass `$row->title` |
| `$stmt->fetchAll(PDO::FETCH_CLASS, Book::class)` | your class instances |
| `$stmt->fetchColumn()` | single value — perfect for **COUNT(*)** ⚡ |

---

## 5. CRUD with PDO (BookRepository — the lab's worked example)

```php
final class BookRepository {
    public function __construct(private PDO $pdo) {}             // ⚡ constructor injection

    public function all(string $q = '', int $limit = 0): array {
        $sql = 'SELECT * FROM books';
        $args = [];
        if ($q !== '') {
            $sql .= ' WHERE title LIKE :q_title OR author LIKE :q_author';  // ⚡ unique names
            $args[':q_title']  = '%' . $q . '%';                 // ⚡ wildcards in the VALUE
            $args[':q_author'] = '%' . $q . '%';
        }
        $sql .= ' ORDER BY id ASC';
        if ($limit > 0) $sql .= ' LIMIT ' . max(1, $limit);      // int-safe concat
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($args);
        return $stmt->fetchAll();                                // ⚡
    }

    public function find(int $id): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM books WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;                     // ⚡ false→null convention
    }

    public function create(array $b): int {
        $sql = 'INSERT INTO books (title, author, year, genre)
                VALUES (:title, :author, :year, :genre)';
        $this->pdo->prepare($sql)->execute([
            ':title' => trim($b['title']),  ':author' => trim($b['author']),
            ':year'  => (int)$b['year'],    ':genre'  => trim($b['genre'] ?? 'Uncategorised'),
        ]);
        return (int)$this->pdo->lastInsertId();                  // ⚡ new PK
    }

    public function update(int $id, array $b): int {             // dynamic partial update
        $sets = []; $args = [':id' => $id];
        foreach (['title','author','genre'] as $f) {
            if (array_key_exists($f, $b)) { $sets[] = "$f=:$f"; $args[":$f"] = trim($b[$f]); }
        }
        if (array_key_exists('year', $b)) { $sets[] = 'year=:year'; $args[':year'] = (int)$b['year']; }
        if (!$sets) return 0;
        $sql = 'UPDATE books SET ' . implode(',', $sets) . ' WHERE id=:id';  // ⚡ implode SET
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($args);
        return $stmt->rowCount();                                // ⚡ rows touched
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare('DELETE FROM books WHERE id = :id');    // ⚡ ALWAYS a WHERE
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() === 1;                          // ⚡ false → controller sends 404
    }
}
```

### Wiring (routes.php)
```php
$controller = new BookController(new BookRepository(Database::get()));  // ⚡ DI chain
$app->group('/api', function ($g) use ($controller) {
    $g->get   ('/books',      [$controller, 'index']);
    $g->get   ('/books/{id}', [$controller, 'show']);
    $g->post  ('/books',      [$controller, 'create']);
    $g->put   ('/books/{id}', [$controller, 'update']);
    $g->delete('/books/{id}', [$controller, 'delete']);
});
```
Repository pattern layers: **Controller** (validate, status codes, JSON) → **Repository** (ALL SQL) → **Database** (PDO). Zero SQL in controllers.

---

## 6. Transactions + error handling

```php
try {
    $pdo->beginTransaction();                                    // ⚡
    $pdo->prepare('UPDATE accounts SET balance = balance - :a WHERE id = :id')
        ->execute([':a' => 100, ':id' => 1]);
    $pdo->prepare('UPDATE accounts SET balance = balance + :a WHERE id = :id')
        ->execute([':a' => 100, ':id' => 2]);
    $pdo->commit();                                              // ⚡ both succeeded
} catch (PDOException $e) {
    $pdo->rollBack();                                            // ⚡ any failure → undo all
    throw $e;
}
```
ACID = Atomicity, Consistency, Isolation, Durability (free with InnoDB).

```php
try { ... } catch (PDOException $e) {
    error_log('DB error: ' . $e->getMessage());                  // ⚡ log detail server-side
    http_response_code(500);
    echo json_encode(['error' => 'Database unavailable']);       // ⚡ generic to client (no schema leak)
}
```

---

## 7. mysql2 (Node) ↔ PDO (PHP) Rosetta table

| Task | mysql2 (Ch8) | PDO (Ch10) |
|---|---|---|
| connect | `mysql.createPool({host,user,password,database})` | `new PDO($dsn, $user, $pass, $opts)` |
| placeholder | `?` only | `?` or `:name` |
| run query | `const [rows] = await pool.query(sql, [vals])` | `$stmt = $pdo->prepare($sql); $stmt->execute([vals]);` |
| read all | `rows` (already array) | `$stmt->fetchAll()` |
| read one | `rows[0]` (check `rows.length`) | `$stmt->fetch()` (false if none) |
| new id | `result.insertId` | `$pdo->lastInsertId()` |
| affected | `result.affectedRows` | `$stmt->rowCount()` |
| dup key error | `err.code === 'ER_DUP_ENTRY'` → 409 | catch PDOException |

---

## 8. Memorization anchors ⚡ (Ch10)

1. `'mysql:host=127.0.0.1;dbname=books_api;charset=utf8mb4'` — DSN
2. `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION`
3. `PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC`
4. `PDO::ATTR_EMULATE_PREPARES => false`
5. `$stmt = $pdo->prepare('SELECT * FROM books WHERE id = :id');`
6. `$stmt->execute([':id' => $id]);`
7. `$row = $stmt->fetch();` / `return $stmt->fetchAll();`
8. `(int)$pdo->lastInsertId()`
9. `$stmt->rowCount() > 0` (update) / `=== 1` (delete)
10. `' WHERE title LIKE :q_title OR author LIKE :q_author'` + `'%' . $q . '%'`
11. `INSERT INTO books (title, author, year, genre) VALUES (:title, :author, :year, :genre)`
12. `UPDATE books SET title=:title, author=:author, year=:year, genre=:genre WHERE id=:id`
13. `DELETE FROM books WHERE id = :id`
14. `id INT AUTO_INCREMENT PRIMARY KEY` + `ENGINE=InnoDB` + `utf8mb4`
15. `updated_at DATETIME ... ON UPDATE CURRENT_TIMESTAMP`
16. `$pdo->beginTransaction(); ... $pdo->commit();` catch → `$pdo->rollBack();`
17. `$count = $stmt->fetchColumn();` for COUNT(*)
18. `Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();`
19. `new BookController(new BookRepository(Database::get()))`
20. mysql2: `const [rows] = await pool.query(sql, params)` / `r.insertId` / `r.affectedRows`

---

## 9. MCQ trivia (Ch10)

- PDO supports **12 engines**; mysqli = MySQL-only, positional-only; old `mysql_*` removed in PHP 7.
- Named placeholders are a **PDO** advantage over mysqli.
- DSN = Data Source Name.
- `EMULATE_PREPARES=false` → MySQL truly prepares server-side; named placeholders must be unique (HY093 otherwise).
- `fetch()` returns **false** when no more rows; `fetchColumn()` = single value (COUNT).
- lastInsertId on the **PDO object**; rowCount on the **statement**.
- `DELETE FROM books` with no WHERE = every row gone ("bye-bye every row" — his words).
- Transactions: ACID, InnoDB; rollBack inside catch.
- utf8mb4 = real Unicode; MySQL's plain `utf8` is broken (3-byte).
- Errors: log full message server-side, return **generic 500** to the client (no schema leak).
- Repository pattern: SQL out of controllers; one class per resource.
- Troubleshooting: SQLSTATE[2002] = MySQL not running; 28000 = bad credentials; 42S02 = table missing (run schema.sql); "could not find driver" = enable `extension=pdo_mysql` in php.ini; HY093 = reused placeholder.
- HeidiSQL = Laragon's GUI client; root with **empty password** by default (never in production).
- Pagination SQL: `LIMIT ? OFFSET ?` with offset = (page-1)*size; total via `SELECT COUNT(*)`.
- Aggregation: `SELECT faculty, COUNT(*) AS total, AVG(gpa) AS avgGpa FROM students GROUP BY faculty ORDER BY total DESC`.

---

## 10. Minimal-pair confusions (Ch10)

| A | B | Difference |
|---|---|---|
| `query()` | `prepare()/execute()` | direct (concat danger) vs placeholders (safe) |
| `?` | `:name` | positional/order matters vs named/assoc array |
| `fetch()` | `fetchAll()` | one row (or false) vs every row |
| `fetchColumn()` | `fetch()` | single scalar vs whole row |
| `lastInsertId()` | `rowCount()` | after INSERT (on PDO) vs after UPDATE/DELETE (on stmt) |
| `FETCH_ASSOC` | `FETCH_OBJ` | `$row['title']` vs `$row->title` |
| PDO | mysqli | multi-engine + named params vs MySQL-only |
| `commit()` | `rollBack()` | make permanent vs undo |
| `beginTransaction` | autocommit | grouped all-or-nothing vs each stmt instant |
| `ERRMODE_EXCEPTION` | silent mode | throw (course style) vs error codes |
| `LIKE '%q%'` | `= q` | substring search vs exact match |
| `DECIMAL(3,2)` | `FLOAT` | exact (string in drivers) vs approximate |
| `UNIQUE` | `PRIMARY KEY` | no duplicates vs identity (one per table) |
| `.env` | `.env.example` | secrets, git-ignored vs committed placeholders |
