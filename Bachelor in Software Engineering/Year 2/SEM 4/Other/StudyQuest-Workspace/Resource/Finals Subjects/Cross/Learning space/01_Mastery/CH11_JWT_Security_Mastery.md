# CH11 Mastery — Securing the API with JWT (firebase/php-jwt on Slim)

> Sources: SCSM2223_Ch11_Slides.pptx, jwt-authentication-slides.pptx, Ch11 Lab Manual (Books API + users table + JwtService + AuthMiddleware).
> Course implementation: **PHP, firebase/php-jwt, HS256, password_hash/password_verify**, PSR-15 AuthMiddleware, roles `member`/`admin`. The Vue side stores the token (localStorage in dev) and sends `Authorization: Bearer <token>` — the Ch8 Axios interceptor line.

---

## 1. The Mental Model (5 lines)

1. **AuthN ≠ AuthZ**: Authentication = *who are you?* (verify identity); Authorization = *what may you do?* (roles/policies). Any user reads books; only **admin** deletes.
2. **Token-based beats sessions for REST**: stateless — the signed token carries the data; any server can validate; sent as `Authorization: Bearer <token>`; natural fit for SPA/mobile.
3. **JWT = header.payload.signature**, each part base64url; header = `{alg, typ}`, payload = claims (`iss, sub, iat, exp, role, email`), signature = HMAC-SHA256(header.payload, SECRET). **Anyone can READ the payload** — never put secrets in it; the signature only proves it wasn't tampered.
4. Flow: login → `password_verify` against stored hash → `JWT::encode(payload, secret, 'HS256')` → client stores → sends Bearer on each call → middleware `JWT::decode(token, new Key(secret, 'HS256'))` → attach payload via `withAttribute('auth', ...)` → handlers read `sub`/`role`.
5. Passwords are **hashed, never stored**: `password_hash($plain, PASSWORD_DEFAULT)` on register, `password_verify($plain, $row['password_hash'])` on login; secret + TTL live in `.env` (`JWT_SECRET`, `JWT_TTL=3600`, `JWT_ISSUER=books-api`).

---

## 2. JWT anatomy (slide 6–7 — guaranteed MCQ/blank)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOjQyLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3MTcwMDM2MDB9 . S9-2pFJ...
        HEADER                              PAYLOAD                                  SIGNATURE
```
```json
// HEADER
{ "alg": "HS256", "typ": "JWT" }
// PAYLOAD (claims)
{ "iss": "books-api", "sub": 42, "email": "hilang@example.com",
  "role": "admin", "iat": 1717000000, "exp": 1717003600 }
```
```
SIGNATURE = HMACSHA256( base64UrlEncode(header) + "." + base64UrlEncode(payload), YOUR_SERVER_SECRET )
```
Claim names: **iss** = issuer, **sub** = subject (user id), **iat** = issued-at, **exp** = expiry, plus custom `role`, `email`.

**HS256 vs RS256**: HS256 = symmetric, ONE shared secret signs AND verifies (this course — monolith). RS256 = asymmetric, private key signs / public key verifies (microservices, OIDC).

**Session vs Token table** (memorize 3 rows): state on server vs in token; sent in cookie vs `Authorization: Bearer`; logout easy vs needs denylist/short TTL.

---

## 3. Database + setup steps (lab order)

```sql
USE books_api;
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,            -- ⚡ 255: hashes are long
    role          ENUM('member','admin') NOT NULL DEFAULT 'member',  -- ⚡ ENUM roles
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```
```bash
composer require firebase/php-jwt                   # ⚡ THE package
php -r "echo password_hash('password', PASSWORD_DEFAULT);"   # seed hash
php -r "echo bin2hex(random_bytes(32));"            # generate real secret
```
```ini
# .env
JWT_SECRET=<long random — never commit>
JWT_TTL=3600
JWT_ISSUER=books-api
```

---

## 4. Password hashing (slide 10)

```php
// Registration — store the hash, never the password
$hash = password_hash($plainPassword, PASSWORD_DEFAULT);     // ⚡ → $2y$12$...

// Login — verify the attempt against the stored hash
if (password_verify($plainPassword, $row['password_hash'])) { // ⚡ (plain, hash) ORDER!
    // success — issue a JWT
} else {
    // 401 Unauthorized
}

// Bonus: upgrade old hashes
if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) { ... }
```

---

## 5. JwtService (lab Step 5 — issue + verify)

```php
namespace App\Auth;
use Firebase\JWT\JWT;                                // ⚡ both imports
use Firebase\JWT\Key;

final class JwtService {
    private string $secret;
    private string $algo = 'HS256';                  // ⚡ pinned algorithm
    private int    $ttl;
    private string $issuer;

    public function __construct() {
        $this->secret = $_ENV['JWT_SECRET'];         // ⚡ from .env
        $this->ttl    = (int)($_ENV['JWT_TTL'] ?? 3600);
        $this->issuer = $_ENV['JWT_ISSUER'] ?? 'books-api';
    }
    public function issue(int $userId, array $extra = []): string {
        $now = time();
        $payload = array_merge([
            'iss' => $this->issuer,
            'sub' => $userId,                        // ⚡ sub = user id
            'iat' => $now,
            'exp' => $now + $this->ttl,              // ⚡ expiry = now + TTL
        ], $extra);                                  // extra: role, email
        return JWT::encode($payload, $this->secret, $this->algo);   // ⚡ encode(payload, secret, algo)
    }
    public function verify(string $token): array {
        return (array)JWT::decode($token, new Key($this->secret, $this->algo));  // ⚡ decode(token, new Key(secret, algo))
    }
    public function ttl(): int { return $this->ttl; }
}
```

---

## 6. AuthController — register / login / me (lab Step 7)

```php
public function register(Request $r, Response $s): Response {
    $b = (array)$r->getParsedBody();
    $errors = [];
    if (empty($b['name']) || mb_strlen($b['name']) < 2) $errors['name'] = 'min 2 chars';
    if (empty($b['email']) || !filter_var($b['email'], FILTER_VALIDATE_EMAIL))
        $errors['email'] = 'invalid email';
    if (empty($b['password']) || mb_strlen($b['password']) < 6)
        $errors['password'] = 'min 6 chars';
    if ($errors) return $this->json($s, ['errors'=>$errors], 400);          // ⚡ 400 validation
    if ($this->users->emailExists($b['email']))
        return $this->json($s, ['error'=>'Email already registered'], 409); // ⚡ 409 duplicate
    $id = $this->users->create($b['name'], $b['email'],
              password_hash($b['password'], PASSWORD_DEFAULT));             // ⚡ hash here
    return $this->json($s, ['message'=>'Registered', 'user'=>$this->users->findById($id)], 201);
}

public function login(Request $r, Response $s): Response {
    $b = (array)$r->getParsedBody();
    $u = $this->users->findByEmail($b['email'] ?? '');
    if (!$u || !password_verify($b['password'] ?? '', $u['password_hash'])) // ⚡ verify
        return $this->json($s, ['error'=>'Invalid credentials'], 401);      // ⚡ 401
    $token = $this->jwt->issue((int)$u['id'], ['role'=>$u['role'], 'email'=>$u['email']]); // ⚡ role into payload
    return $this->json($s, [
        'token_type'   => 'Bearer',                                         // ⚡ response shape
        'expires_in'   => $this->jwt->ttl(),
        'access_token' => $token,
    ]);
}

public function me(Request $r, Response $s): Response {
    $auth = (array)$r->getAttribute('auth', []);                            // ⚡ read attached payload
    $u = $this->users->findById((int)($auth['sub'] ?? 0));                  // ⚡ sub → user id
    return $u ? $this->json($s, $u) : $this->json($s, ['error'=>'Not found'], 404);
}
```

UserRepository essentials: `findByEmail` (`SELECT ... WHERE email = :e`), `findById` (NO password_hash in select), `create` (`INSERT INTO users (name,email,password_hash,role) VALUES (:n,:e,:h,:r)`), `emailExists` (`SELECT 1 ... fetchColumn()`).

---

## 7. AuthMiddleware (lab Step 8 — the #1 structured-question candidate)

```php
final class AuthMiddleware implements MiddlewareInterface {
    public function __construct(private JwtService $jwt) {}

    public function process(ServerRequestInterface $req, RequestHandlerInterface $h): ResponseInterface {
        $hdr = $req->getHeaderLine('Authorization');                 // ⚡ read the header
        if (!preg_match('/^Bearer\s+(.+)$/i', $hdr, $m)) {           // ⚡ Bearer regex
            return $this->fail('Missing or malformed token');
        }
        try {
            $payload = $this->jwt->verify($m[1]);                    // ⚡ verify signature+expiry
        } catch (\Throwable $e) {
            return $this->fail('Invalid or expired token');
        }
        $req = $req->withAttribute('auth', $payload);                // ⚡ attach for handlers
        return $h->handle($req);                                     // ⚡ pass downstream
    }

    private function fail(string $msg): ResponseInterface {
        $r = new SlimResponse(401);                                  // ⚡ 401
        $r->getBody()->write(json_encode(['error'=>$msg]));
        return $r->withHeader('Content-Type','application/json')
                 ->withHeader('WWW-Authenticate','Bearer');          // ⚡ WWW-Authenticate header
    }
}
```

---

## 8. Route protection map (lab Step 9 — memorize the table)

| Route | Method | Auth | Extra |
|---|---|---|---|
| /api/books | GET | No | — |
| /api/books/{id} | GET | No | — |
| /auth/register | POST | No | — |
| /auth/login | POST | No | — |
| /api/books | POST | **Bearer** | — |
| /api/books/{id} | PUT | **Bearer** | — |
| /api/books/{id} | DELETE | **Bearer** | **role = admin** |
| /auth/me | GET | **Bearer** | — |

```php
$pdo  = Database::get();
$jwt  = new JwtService();
$auth = new AuthMiddleware($jwt);
$bookCtrl = new BookController(new BookRepository($pdo));
$authCtrl = new AuthController(new UserRepository($pdo), $jwt);

// Public
$app->post('/auth/register', [$authCtrl, 'register']);
$app->post('/auth/login',    [$authCtrl, 'login']);
$app->get ('/api/books',     [$bookCtrl, 'index']);
$app->get ('/api/books/{id}',[$bookCtrl, 'show']);

// Protected
$app->get('/auth/me', [$authCtrl, 'me'])->add($auth);            // ⚡ ->add($auth) on one route
$app->group('/api/books', function ($g) use ($bookCtrl) {        // ⚡ group write routes
    $g->post  ('',      [$bookCtrl, 'create']);                  // ⚡ '' = group prefix itself
    $g->put   ('/{id}', [$bookCtrl, 'update']);
    $g->delete('/{id}', [$bookCtrl, 'delete']);
})->add($auth);                                                  // ⚡ middleware on the GROUP
```

### Role check inside delete() (admin only)
```php
$auth = (array)$req->getAttribute('auth', []);                   // ⚡
if (($auth['role'] ?? 'member') !== 'admin') {
    return $this->json($res, ['error' => 'Admins only'], 403);   // ⚡ 403 Forbidden (NOT 401)
}
```

### Vue/Axios side (connects to Ch8)
```js
const token = localStorage.getItem('token')
if (token) config.headers.Authorization = `Bearer ${token}`     // ⚡ interceptor line
```
Token storage options: in-memory (XSS-safe, lost on refresh) / **localStorage (course dev choice**, XSS-vulnerable) / HttpOnly cookie (XSS-safe, needs CSRF defence).

---

## 9. End-to-end test expectations (lab Part G — know the codes)

1. Register → **201**. 2. Login → **200** + access_token. 3. GET /auth/me with Bearer → **200**.
4. POST /api/books with token → **201**. 5. Member DELETE → **403 "Admins only"**.
6. Admin DELETE → **200**. 7. POST with NO header → **401 "Missing or malformed token"**.
8. Tampered token → **401 "Invalid or expired token"**. (TTL=10 experiment → expired = 401.)

---

## 10. Memorization anchors ⚡ (Ch11)

1. `composer require firebase/php-jwt`
2. `use Firebase\JWT\JWT;  use Firebase\JWT\Key;`
3. `password_hash($plainPassword, PASSWORD_DEFAULT)`
4. `password_verify($plain, $row['password_hash'])` — (plain, hash) order
5. `'sub' => $userId, 'iat' => $now, 'exp' => $now + $this->ttl`
6. `JWT::encode($payload, $this->secret, 'HS256')`
7. `JWT::decode($token, new Key($this->secret, 'HS256'))`
8. `$hdr = $req->getHeaderLine('Authorization');`
9. `preg_match('/^Bearer\s+(.+)$/i', $hdr, $m)`
10. `$req = $req->withAttribute('auth', $payload);`
11. `return $h->handle($req);`
12. `->withHeader('WWW-Authenticate', 'Bearer')` on 401
13. `$app->group('/api/books', ...)->add($auth);`
14. `$app->get('/auth/me', [$authCtrl, 'me'])->add($auth);`
15. `(array)$req->getAttribute('auth', [])` then `$auth['sub']` / `$auth['role']`
16. `if (($auth['role'] ?? 'member') !== 'admin') → 403`
17. `'token_type' => 'Bearer', 'expires_in' => ttl, 'access_token' => $token`
18. `JWT_SECRET / JWT_TTL=3600 / JWT_ISSUER=books-api` in .env
19. `password_hash` column = VARCHAR(**255**); role = ENUM('member','admin')
20. Axios: `config.headers.Authorization = \`Bearer ${token}\``

---

## 11. MCQ trivia (Ch11)

- Authentication = identity ("who are you"); Authorization = permission ("what can you do").
- JWT = JSON Web Token: compact, URL-safe, digitally **signed** (NOT encrypted — payload is readable by anyone).
- Three parts separated by dots: header.payload.signature, each base64url.
- Claims: iss issuer, sub subject/user-id, iat issued-at, exp expiry (+ custom role/email).
- HS256 = HMAC-SHA256, **symmetric** (one secret) — course choice; RS256 = RSA, asymmetric (private signs, public verifies).
- Token sent in `Authorization: Bearer <token>` header.
- Stateless: server stores NO session; any server with the secret can validate → scales horizontally.
- Logout weakness: needs denylist or short TTL (vs sessions: just delete the entry).
- password_hash uses bcrypt by default (`$2y$...`); store in VARCHAR(255); never store plain text; never put passwords in the JWT payload.
- Pitfalls slide: hard-coded secret ✗ (use .env), accepting `alg=none` ✗ (pin HS256 in decode), no exp ✗, sensitive data in payload ✗; short TTL + HTTPS ✓.
- Middleware failure path returns **401** + `WWW-Authenticate: Bearer`; role failure returns **403**.
- Refresh tokens: short-lived access (e.g. 15 min) + long-lived refresh; rotation; revocation via jti denylist (extension topic).
- Storage trade-offs: in-memory (lost on refresh) / localStorage (XSS risk — dev choice) / HttpOnly cookie (CSRF needed).
- The middleware **never trusts the payload** — it always re-verifies the signature with the server secret.

---

## 12. Minimal-pair confusions (Ch11)

| A | B | Difference |
|---|---|---|
| Authentication | Authorization | who you are vs what you may do |
| 401 | 403 | no/invalid token vs valid token, wrong role |
| `JWT::encode` | `JWT::decode` | issue (payload,secret,algo) vs verify (token, new Key(secret,algo)) |
| `password_hash` | `password_verify` | register (make hash) vs login (check attempt vs hash) |
| signed | encrypted | tamper-proof but readable vs hidden (JWT is only SIGNED) |
| HS256 | RS256 | one shared secret vs private/public key pair |
| `sub` | `iss` | user id vs token creator |
| `iat` | `exp` | issued-at vs expires-at |
| sessions | tokens | server state + cookie vs stateless + Bearer header |
| `->add($auth)` on group | global `$app->add()` | protect selected routes vs every route |
| `getAttribute('auth')` | `getParsedBody()` | middleware-attached payload vs request JSON |
| localStorage | HttpOnly cookie | JS-readable (XSS risk) vs JS-invisible (needs CSRF guard) |
| access token | refresh token | short TTL, sent every call vs long TTL, exchanged for new access |
| `Bearer eyJ...` | raw token | scheme prefix required vs what regex captures |
