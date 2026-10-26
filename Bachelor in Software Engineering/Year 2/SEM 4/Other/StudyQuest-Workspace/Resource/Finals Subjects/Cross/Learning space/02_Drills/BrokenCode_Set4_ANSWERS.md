# ANSWERS — Set 4: Express + Slim Routes

## Exercise 4.1 — Express skeleton
| # | Missing line | Why |
|---|---|---|
| 1 | `express()` | Calling the imported factory creates the app. |
| 2 | `cors()` | The cors middleware (call it!) allows the 5173 origin. |
| 3 | `express.json()` | Built-in body parser — without it `req.body` is undefined. |
| 4 | `listen` | `app.listen(PORT, callback)` starts the server — last line. |
| 5 | `PORT` | Template literal interpolation of the constant. |

## Exercise 4.2 — GET list with search/sort
| # | Missing line | Why |
|---|---|---|
| 1 | `req.query` | `?q=&sortBy=&order=` live on the query object. |
| 2 | `` `%${q}%` `` | Wildcards go in the VALUE, never in the SQL string. |
| 3 | `allowedSort.includes(sortBy)` | Whitelist check — column names cannot be parameterised, so validate them. |
| 4 | `[rows]` | mysql2/promise returns `[rows, fields]` — destructure the first. |
| 5 | `res.status(500)` | Database failures = Internal Server Error. |

## Exercise 4.3 — GET one + POST
| # | Missing line | Why |
|---|---|---|
| 1 | `req.params.id` | `:id` in the path arrives via req.params. |
| 2 | `res.status(404)` | Empty result set = Not Found. |
| 3 | `req.body` | The parsed JSON payload (thanks to express.json()). |
| 4 | `id: r.insertId` | mysql2 exposes the AUTO_INCREMENT id as insertId. |
| 5 | `409` | Conflict — duplicate unique key (ER_DUP_ENTRY). |

## Exercise 4.4 — PUT + DELETE
| # | Missing line | Why |
|---|---|---|
| 1 | `WHERE id=?` | Scope the update; its value is the LAST array item (req.params.id). |
| 2 | `!r.affectedRows` | 0 rows touched = the id didn't exist → 404. |
| 3 | `delete` | `app.delete(path, handler)` registers the DELETE verb. |
| 4 | `'DELETE FROM students WHERE id = ?'` | Parameterised delete — always with WHERE. |
| 5 | `deleted: true` | The lab's confirmation body shape. |

## Exercise 4.5 — Slim bootstrap
| # | Missing line | Why |
|---|---|---|
| 1 | `AppFactory::create()` | Builds the Slim app instance. |
| 2 | `addRoutingMiddleware` | Enables route dispatching. |
| 3 | `getBody()` | PSR-7 responses write through the body stream object. |
| 4 | `return $res;` | Handlers MUST return the response object. |
| 5 | `run()` | Starts the middleware/dispatch lifecycle — final line. |

## Exercise 4.6 — Slim routes
| # | Missing line | Why |
|---|---|---|
| 1 | `/api` | Group prefix shared by every book route. |
| 2 | `index` | His controller naming: index = list all. |
| 3 | `/books/{id}` | Slim path parameters use {curly} braces. |
| 4 | `post` | Create = POST. |
| 5 | `delete` | Remove = DELETE. |

## Exercise 4.7 — Slim handler
| # | Missing line | Why |
|---|---|---|
| 1 | `array $args` | Third callback parameter receives the path parameters. |
| 2 | `404` | Resource not found. |
| 3 | `getParsedBody` | Returns the decoded JSON (requires the JsonBodyParser middleware). |
| 4 | `Location` | 201 responses point at the new resource: `Location: /api/books/<id>`. |
| 5 | `json_encode($data)` | Serialize once; the helper then sets header + status. |

## Exercise 4.8 — Slim middleware
| # | Missing line | Why |
|---|---|---|
| 1 | `true` | `json_decode($raw, true)` = associative array (his convention). |
| 2 | `withParsedBody` | Immutable PSR-7: returns a NEW request carrying the parsed body. |
| 3 | `$handler->handle($request)` | Pass control (and the new request) to the next onion layer. |
| 4 | `OPTIONS` | The browser's CORS preflight method — answer 204 + headers, skip the route. |
| 5 | `Content-Type, Authorization` | Both must be allowed — Authorization carries the JWT in Ch11. |
