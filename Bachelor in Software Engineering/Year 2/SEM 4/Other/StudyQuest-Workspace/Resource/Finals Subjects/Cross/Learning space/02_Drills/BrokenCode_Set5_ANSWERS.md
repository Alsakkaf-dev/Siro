# ANSWERS — Set 5: MySQL/PDO + JWT

## Exercise 5.1 — schema.sql
| # | Missing line | Why |
|---|---|---|
| 1 | `utf8mb4` | Real 4-byte Unicode; MySQL's `utf8` is broken (3-byte). |
| 2 | `AUTO_INCREMENT` | MySQL assigns ids on INSERT (returned as lastInsertId/insertId). |
| 3 | `DEFAULT` | Column default for missing genre values. |
| 4 | `ON UPDATE` | `ON UPDATE CURRENT_TIMESTAMP` re-stamps updated_at automatically. |
| 5 | `InnoDB` | Transactional engine — ACID, used in every course table. |

## Exercise 5.2 — PDO connection
| # | Missing line | Why |
|---|---|---|
| 1 | `mysql:host=127.0.0.1;dbname=books_api;charset=utf8mb4` | DSN format: driver:key=value pairs separated by `;`. |
| 2 | `PDO::ERRMODE_EXCEPTION` | Throw PDOException on any DB error → try/catch works. |
| 3 | `PDO::FETCH_ASSOC` | Rows come back as assoc arrays (JSON-friendly, no duplicate numeric keys). |
| 4 | `PDO::ATTR_EMULATE_PREPARES` | false = real server-side prepared statements. |
| 5 | `$stmt = $pdo->prepare('SELECT * FROM books WHERE id = ?');`<br>`$stmt->execute([$id]); $rows = $stmt->fetchAll();` | Data goes through a placeholder — never into the SQL string. |

## Exercise 5.3 — Repository CRUD
| # | Missing line | Why |
|---|---|---|
| 1 | `:title, :author, :year, :genre` | Named placeholders matching the execute() keys. |
| 2 | `lastInsertId()` | The new PK lives on the PDO object (cast to int). |
| 3 | `':id' => $id` | Named binding for the delete target. |
| 4 | `rowCount()` | Rows affected — exactly 1 means the delete happened. |
| 5 | `:q_author` | EMULATE_PREPARES=false forbids reusing `:q_title`; unique names or SQLSTATE HY093. |

## Exercise 5.4 — Transactions + count
| # | Missing line | Why |
|---|---|---|
| 1 | `beginTransaction()` | Opens the all-or-nothing block. |
| 2 | `commit()` | Both updates succeeded → make permanent. |
| 3 | `rollBack()` | Any exception → undo everything. |
| 4 | `COUNT(*) AS total` | Aggregate row count (alias optional but his style). |
| 5 | `fetchColumn()` | Pulls the single scalar out of the result. |

## Exercise 5.5 — users table + hashing
| # | Missing line | Why |
|---|---|---|
| 1 | `UNIQUE` | One account per email; violations → 409 in register. |
| 2 | `VARCHAR(255)` | bcrypt hashes are long — 255 is the lab's size (truncation breaks verify!). |
| 3 | `member` | New users are members; admin is assigned explicitly. |
| 4 | `password_hash` | `password_hash($plain, PASSWORD_DEFAULT)` → `$2y$...` bcrypt hash. |
| 5 | `password_verify` | `(plain, storedHash)` order — checks attempt against hash. |

## Exercise 5.6 — JwtService
| # | Missing line | Why |
|---|---|---|
| 1 | `Key` | `Firebase\JWT\Key` wraps the secret + algorithm for decode. |
| 2 | `sub` | Subject claim = the user id. |
| 3 | `$now + $this->ttl` | exp = issued time + TTL seconds (3600 default). |
| 4 | `encode` | `JWT::encode($payload, $secret, 'HS256')` signs the token. |
| 5 | `new Key($this->secret, $this->algo)` | decode requires a Key with the secret AND pinned algorithm. |

## Exercise 5.7 — AuthMiddleware
| # | Missing line | Why |
|---|---|---|
| 1 | `getHeaderLine` | Reads a header as a string from the PSR-7 request. |
| 2 | `/^Bearer\s+(.+)$/i` | Match the Bearer scheme; capture group 1 = the raw token. |
| 3 | `$m[1]` | The captured token from the regex match array. |
| 4 | `withAttribute` | Immutable request: returns a NEW request carrying the payload. |
| 5 | `401` | Unauthenticated — plus the `WWW-Authenticate: Bearer` header. |

## Exercise 5.8 — Route protection + role check
| # | Missing line | Why |
|---|---|---|
| 1 | `add($auth)` | Attach the middleware to that single route. |
| 2 | `->add($auth)` | Attach to the whole group — POST/PUT/DELETE all gated at once. |
| 3 | `getAttribute` | Reads what the middleware attached (`'auth'`, default []). |
| 4 | `$auth['role']` | The role claim baked into the token at login. |
| 5 | `403` | Forbidden — authenticated but not allowed (401 would mean no/invalid token). |
