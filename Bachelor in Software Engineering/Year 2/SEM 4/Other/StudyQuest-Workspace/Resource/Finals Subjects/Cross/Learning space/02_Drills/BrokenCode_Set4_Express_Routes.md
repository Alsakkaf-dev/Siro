# Broken-Code Set 4 — Backend Routes: Express (Ch8) + Slim 4 (Ch9) (8 exercises)

> World: the professor's Student Records Manager (Express + mysql2, port 3000) and Books REST API (PHP Slim 4, port 8000).
> Exercises 4.1–4.4 = Express/Node. Exercises 4.5–4.8 = Slim/PHP. Both styles appear in his materials — expect either on the exam.
> Answers in `BrokenCode_Set4_ANSWERS.md`.

---

## Exercise 4.1 — Express app skeleton + middleware

The Vue dev server (5173) gets CORS errors and `req.body` is always undefined. Restore the server bootstrap.

```js
const express = require('express')
const cors    = require('cors')
const pool    = require('./db')

const app = ____(1)____

app.use(____(2)____)                 // allow requests from http://localhost:5173
app.use(____(3)____)                 // parse application/json request bodies

app.get('/', (req, res) => res.json({ status: 'ok' }))

const PORT = 3000
app.____(4)____(PORT, () =>
  console.log(`API running at http://localhost:${____(5)____}`))
```

**Must:** construct the app, enable cross-origin calls, enable JSON body parsing, start listening on port 3000, and interpolate the port into the startup log.

---

## Exercise 4.2 — Express GET list with search + whitelisted sort

`GET /students?q=aisyah&sortBy=gpa&order=desc` must work safely. Complete the handler.

```js
app.get('/students', async (req, res) => {
  try {
    const { q, sortBy, order } = ____(1)____
    let sql = 'SELECT * FROM students'
    const params = []

    if (q) {
      sql += ` WHERE name LIKE ? OR matricNo LIKE ? OR email LIKE ? OR course LIKE ?`
      const like = ____(2)____
      params.push(like, like, like, like)
    }

    const allowedSort = ['name', 'matricNo', 'gpa', 'year']
    if (sortBy && ____(3)____) {
      const direction = order === 'desc' ? 'DESC' : 'ASC'
      sql += ` ORDER BY ${sortBy} ${direction}`
    }

    const ____(4)____ = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    ____(5)____.json({ error: 'Database error' })
  }
})
```

**Must:** read the query-string values, build the LIKE value with surrounding wildcards, only accept column names from the whitelist, destructure the rows from the pool result, and answer failures with HTTP 500.

---

## Exercise 4.3 — Express GET one + POST create

Complete the single-record read and the create endpoint (including the duplicate-matric conflict).

```js
app.get('/students/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM students WHERE id = ?', [____(1)____])
  if (!rows.length) return ____(2)____.json({ error: 'Not found' })
  res.json(rows[0])
})

app.post('/students', async (req, res) => {
  try {
    const { matricNo, name, course, faculty, gpa, email, year, active } = ____(3)____
    const [r] = await pool.query(
      `INSERT INTO students (matricNo, name, course, faculty, gpa, email, year, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [matricNo, name, course, faculty, gpa, email, year, active ? 1 : 0]
    )
    res.status(201).json({ ____(4)____, ...req.body })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(____(5)____).json({ error: 'Matric number already exists' })
    }
    res.status(500).json({ error: 'Database error' })
  }
})
```

**Must:** bind the path id into the placeholder, return 404 when no row matches, read the JSON payload, echo the new auto-increment id back in the 201 response, and answer duplicates with the conflict status.

---

## Exercise 4.4 — Express PUT + DELETE with affectedRows

Finish the update and delete endpoints so unknown ids yield 404.

```js
app.put('/students/:id', async (req, res) => {
  const { matricNo, name, course, faculty, gpa, email, year, active } = req.body
  const [r] = await pool.query(
    `UPDATE students SET matricNo=?, name=?, course=?, faculty=?,
        gpa=?, email=?, year=?, active=?
      ____(1)____`,
    [matricNo, name, course, faculty, gpa, email, year, active ? 1 : 0, req.params.id]
  )
  if (____(2)____) return res.status(404).json({ error: 'Not found' })
  res.json({ id: Number(req.params.id), ...req.body })
})

app.____(3)____('/students/:id', async (req, res) => {
  const [r] = await pool.query(____(4)____, [req.params.id])
  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
  res.json({ ____(5)____ })
})
```

**Must:** scope the UPDATE to the path id, detect that nothing was updated, register the delete verb, write the parameterised DELETE statement, and confirm deletion in the JSON body (lab shape: deleted true).

---

## Exercise 4.5 — Slim bootstrap (public/index.php)

The Books API returns blank pages. Restore the Slim 4 entry file.

```php
<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = ____(1)____;
$app->____(2)____();                       // enable route dispatch
$app->addErrorMiddleware(true, true, true);

$app->get('/', function (Request $req, Response $res) {
    $res->____(3)____->write('Hello, Slim!');
    ____(4)____;
});

$app->____(5)____;
```

**Must:** build the app via the factory, add the routing middleware, write into the response body stream, hand the response back to Slim, and start the request lifecycle.

---

## Exercise 4.6 — Slim routes file with group + controller callables

Wire the Books endpoints exactly as the Ch9 lab does.

```php
<?php
use Slim\App;
use App\Controllers\BookController;

return function (App $app): void {

    $app->group('____(1)____', function ($g) {
        $g->get   ('/books',      [BookController::class, '____(2)____']);
        $g->get   ('____(3)____', [BookController::class, 'show']);
        $g->____(4)____('/books',      [BookController::class, 'create']);
        $g->put   ('/books/{id}', [BookController::class, 'update']);
        $g->____(5)____('/books/{id}', [BookController::class, 'delete']);
    });
};
```

**Must:** prefix every route with /api, name the list-all action, declare the path with the id parameter, register the create verb, and register the remove verb.

---

## Exercise 4.7 — Slim handler: read inputs, return JSON + status

Complete the show/create pair in the controller (PSR-7 style).

```php
public function show(Request $req, Response $res, ____(1)____): Response {
    $id = (int)($args['id'] ?? 0);
    $book = $this->findById($id);
    return $book
        ? $this->json($res, $book)
        : $this->json($res, ['error' => "Book {$id} not found"], ____(2)____);
}

public function create(Request $req, Response $res): Response {
    $body = (array)($req->____(3)____() ?? []);
    // ...validate, build $book, save...
    return $this->json($res, ['message' => 'Book created', 'data' => $book], 201)
                ->withHeader('____(4)____', '/api/books/' . $id);
}

private function json(Response $res, mixed $data, int $status = 200): Response {
    $res->getBody()->write(____(5)____);
    return $res->withHeader('Content-Type', 'application/json')
               ->withStatus($status);
}
```

**Must:** accept the route arguments array as the third parameter, answer missing books with the right status, read the parsed JSON body, point the client at the newly created resource, and serialize the payload into the body.

---

## Exercise 4.8 — Slim middleware: JSON body parser + CORS preflight

Both middleware classes have holes. The Vue dev server must be able to POST JSON.

```php
final class JsonBodyParser implements MiddlewareInterface {
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface {
        if (stripos($request->getHeaderLine('Content-Type'), 'application/json') === 0) {
            $raw     = (string)$request->getBody();
            $decoded = $raw === '' ? [] : json_decode($raw, ____(1)____);   // assoc array, not stdClass
            if (!is_array($decoded)) $decoded = [];
            $request = $request->____(2)____($decoded);
        }
        return ____(3)____;        // pass the (possibly new) request to the next layer
    }
}

final class Cors implements MiddlewareInterface {
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface {
        if ($request->getMethod() === '____(4)____') {        // browser preflight
            return $this->withCors(new \Slim\Psr7\Response(204));
        }
        return $this->withCors($handler->handle($request));
    }
    private function withCors(ResponseInterface $r): ResponseInterface {
        return $r->withHeader('Access-Control-Allow-Origin', '*')
                 ->withHeader('Access-Control-Allow-Headers', '____(5)____')
                 ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
}
```

**Must:** decode JSON into an associative array, attach the decoded body so `getParsedBody()` works, forward to the next layer, short-circuit the browser's preflight verb, and allow the two headers the Vue app sends (content type + the JWT header).
