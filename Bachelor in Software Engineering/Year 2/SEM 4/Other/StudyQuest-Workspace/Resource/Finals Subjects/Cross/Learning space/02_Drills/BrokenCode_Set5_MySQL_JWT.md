# Broken-Code Set 5 — MySQL/PDO + JWT Security (8 exercises)

> World: the professor's Books API (Ch10 PDO refactor + Ch11 JWT) and Student Records schema (Ch8).
> Exercises 5.1–5.4 = database layer (SQL, PDO, mysql2). Exercises 5.5–5.8 = JWT auth.
> Answers in `BrokenCode_Set5_ANSWERS.md`.

---

## Exercise 5.1 — schema.sql (books table)

Recreate the Ch10 schema exactly: auto ids, sane defaults, auto-touch timestamps.

```sql
CREATE DATABASE IF NOT EXISTS books_api
  CHARACTER SET ____(1)____ COLLATE utf8mb4_unicode_ci;
USE books_api;

DROP TABLE IF EXISTS books;

CREATE TABLE books (
    id         INT ____(2)____ PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    author     VARCHAR(150) NOT NULL,
    year       SMALLINT     NOT NULL,
    genre      VARCHAR(80)  NOT NULL ____(3)____ 'Uncategorised',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ____(4)____ CURRENT_TIMESTAMP
) ENGINE=____(5)____;
```

**Must:** use full Unicode, auto-number the primary key, give unlabelled genres a fallback, refresh updated_at automatically on every UPDATE, and use the transactional storage engine.

---

## Exercise 5.2 — PDO connection (DSN + the three options)

The Database factory throws no exceptions and returns numeric-keyed rows — its options are missing. Restore them.

```php
$dsn = '____(1)____';   // MySQL on 127.0.0.1, database books_api, charset utf8mb4

$pdo = new PDO($dsn, 'root', '', [
    PDO::ATTR_ERRMODE            => ____(2)____,   // throw on any DB error
    PDO::ATTR_DEFAULT_FETCH_MODE => ____(3)____,   // assoc arrays
    ____(4)____                  => false,         // real server-side prepares
]);
```

A teammate then writes this query — rewrite line (5) so it is injection-safe:
```php
$rows = $pdo->query("SELECT * FROM books WHERE id = $id")->fetchAll();   // ← line (5): replace with prepare/execute (2 lines)
```

**Must:** write the exact DSN string, name the three attribute constants, and convert the concatenated query into a prepared statement with a placeholder.

---

## Exercise 5.3 — BookRepository CRUD (named placeholders)

Complete the repository's write path.

```php
public function create(array $b): int {
    $sql = 'INSERT INTO books (title, author, year, genre)
            VALUES (____(1)____)';
    $this->pdo->prepare($sql)->execute([
        ':title' => trim($b['title']),  ':author' => trim($b['author']),
        ':year'  => (int)$b['year'],    ':genre'  => trim($b['genre'] ?? 'Uncategorised'),
    ]);
    return (int)$this->pdo->____(2)____;
}

public function delete(int $id): bool {
    $stmt = $this->pdo->prepare('DELETE FROM books WHERE id = :id');
    $stmt->execute([____(3)____]);
    return $stmt->____(4)____ === 1;
}

public function all(string $q = ''): array {
    $sql = 'SELECT * FROM books';
    $args = [];
    if ($q !== '') {
        $sql .= ' WHERE title LIKE :q_title OR author LIKE ____(5)____';  // ⚠ EMULATE_PREPARES=false!
        $args[':q_title']  = '%' . $q . '%';
        $args[':q_author'] = '%' . $q . '%';
    }
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute($args);
    return $stmt->fetchAll();
}
```

**Must:** write the four named placeholders in order, fetch the new primary key, bind the id, count affected rows to signal success, and respect the unique-placeholder rule under real prepares.

---

## Exercise 5.4 — Transactions + count endpoint

Two short fragments from the Ch10 extensions.

```php
// (a) transfer must be all-or-nothing
try {
    $pdo->____(1)____;
    $pdo->prepare('UPDATE accounts SET balance = balance - :a WHERE id = :id')
        ->execute([':a' => 100, ':id' => 1]);
    $pdo->prepare('UPDATE accounts SET balance = balance + :a WHERE id = :id')
        ->execute([':a' => 100, ':id' => 2]);
    $pdo->____(2)____;
} catch (PDOException $e) {
    $pdo->____(3)____;
    throw $e;
}

// (b) total row count for the UI
$stmt = $pdo->query('SELECT ____(4)____ FROM books');
$count = $stmt->____(5)____;
```

**Must:** open the transaction, make it permanent, undo on any failure, write the aggregate that counts rows (aliased AS total is fine), and pull that single value out of the statement.

---

## Exercise 5.5 — users table + password hashing (Ch11 Part A/D)

Set up authentication storage and the registration hash.

```sql
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(190) NOT NULL ____(1)____,
    password_hash ____(2)____ NOT NULL,
    role          ENUM('member','admin') NOT NULL DEFAULT '____(3)____'
) ENGINE=InnoDB;
```

```php
// registration:
$id = $this->users->create($b['name'], $b['email'],
          ____(4)____($b['password'], PASSWORD_DEFAULT));

// login:
if (!$u || !____(5)____($b['password'] ?? '', $u['password_hash']))
    return $this->json($s, ['error' => 'Invalid credentials'], 401);
```

**Must:** forbid duplicate emails, size the hash column correctly, default new users to the non-admin role, hash at registration, and verify the attempt against the stored hash at login.

---

## Exercise 5.6 — JwtService: issue + verify (firebase/php-jwt)

The token service compiles but issues nothing. Fill the JWT library calls.

```php
use Firebase\JWT\JWT;
use Firebase\JWT\____(1)____;

public function issue(int $userId, array $extra = []): string {
    $now = time();
    $payload = array_merge([
        'iss' => $this->issuer,
        '____(2)____' => $userId,            // subject claim = user id
        'iat' => $now,
        'exp' => ____(3)____,                // expires TTL seconds from now
    ], $extra);
    return JWT::____(4)____($payload, $this->secret, 'HS256');
}

public function verify(string $token): array {
    return (array)JWT::decode($token, ____(5)____);
}
```

**Must:** import the key wrapper class, name the subject claim, compute the expiry from now + ttl, sign the payload, and decode with the secret pinned to HS256.

---

## Exercise 5.7 — AuthMiddleware (the Bearer gate)

Protected routes must reject missing/invalid tokens with 401 and attach the payload otherwise.

```php
public function process(ServerRequestInterface $req, RequestHandlerInterface $h): ResponseInterface {
    $hdr = $req->____(1)____('Authorization');
    if (!preg_match('____(2)____', $hdr, $m)) {
        return $this->fail('Missing or malformed token');
    }
    try {
        $payload = $this->jwt->verify(____(3)____);
    } catch (\Throwable $e) {
        return $this->fail('Invalid or expired token');
    }
    $req = $req->____(4)____('auth', $payload);
    return $h->handle($req);
}

private function fail(string $msg): ResponseInterface {
    $r = new SlimResponse(____(5)____);
    $r->getBody()->write(json_encode(['error' => $msg]));
    return $r->withHeader('Content-Type', 'application/json')
             ->withHeader('WWW-Authenticate', 'Bearer');
}
```

**Must:** read the auth header line, match the Bearer scheme and capture the raw token, verify the captured group, attach the decoded payload onto the request for downstream handlers, and answer with the unauthenticated status.

---

## Exercise 5.8 — Protecting routes + admin-only delete

Wire the public/protected split and the role check exactly as the lab does.

```php
$auth = new AuthMiddleware($jwt);

// Public
$app->post('/auth/register', [$authCtrl, 'register']);
$app->post('/auth/login',    [$authCtrl, 'login']);
$app->get ('/api/books',     [$bookCtrl, 'index']);

// Protected
$app->get('/auth/me', [$authCtrl, 'me'])->____(1)____;

$app->group('/api/books', function ($g) use ($bookCtrl) {
    $g->post  ('',      [$bookCtrl, 'create']);
    $g->put   ('/{id}', [$bookCtrl, 'update']);
    $g->delete('/{id}', [$bookCtrl, 'delete']);
})____(2)____;

// inside BookController::delete() — admins only:
$auth = (array)$req->____(3)____('auth', []);
if ((____(4)____ ?? 'member') !== 'admin') {
    return $this->json($res, ['error' => 'Admins only'], ____(5)____);
}
```

**Must:** attach the middleware to the single /auth/me route, attach it to the whole write group, read the payload the middleware stored, inspect the role claim, and answer non-admins with the authorization-failure status (not 401!).
