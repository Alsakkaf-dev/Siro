# ANSWERS — Set 2: JSON, AJAX, Fetch & jQuery

## Exercise 2.1 — JSON round-trip
| # | Missing line | Why |
|---|---|---|
| 1 | `JSON.parse` | String → JavaScript object (data arriving from server). |
| 2 | `JSON.stringify` | Object → JSON string (data leaving for server). |
| 3 | `null, 2` | `JSON.stringify(obj, null, 2)` — replacer null, 2-space indent. |
| 4 | `{ "city": "Johor Bahru" }` | Keys/strings need DOUBLE quotes; trailing comma is illegal JSON. |

## Exercise 2.2 — XHR GET
| # | Missing line | Why |
|---|---|---|
| 1 | `new XMLHttpRequest()` | Step 1: create the request object. |
| 2 | `open` | Step 2: `open(method, url, async)` configures it; `true` = asynchronous. |
| 3 | `xhr.status === 200` | 200 = OK; onload fires for any response, so check the status. |
| 4 | `JSON.parse` | responseText is a raw string — parse it to an object. |
| 5 | `send()` | Step 5: nothing happens until you send. |

## Exercise 2.3 — XHR POST
| # | Missing line | Why |
|---|---|---|
| 1 | `setRequestHeader` | Tells the server the body is `application/json`. |
| 2 | `201` | Created — the status a successful POST returns. |
| 3 | `JSON.stringify(newPost)` | Bodies travel as strings; objects must be stringified. |

## Exercise 2.4 — Fetch .then chain
| # | Missing line | Why |
|---|---|---|
| 1 | `return response.json()` | `.json()` returns ANOTHER promise — returning it feeds the next .then. |
| 2 | `data.name` | The second .then finally holds the parsed object. |
| 3 | `.catch` | Network errors and thrown errors land in the chain's catch. |

## Exercise 2.5 — Fetch async/await
| # | Missing line | Why |
|---|---|---|
| 1 | `async` | Only async functions may use await; it makes the fn return a promise. |
| 2 | `await` | Pauses until the fetch promise resolves to a Response. |
| 3 | `!response.ok` | fetch does NOT reject on 404/500 — you must check ok (status 200–299). |
| 4 | `response.json()` | The body parse is async too — await it. |
| 5 | `catch (error)` | try/catch is the async/await replacement for `.catch()`. |

## Exercise 2.6 — Fetch POST + timeout
| # | Missing line | Why |
|---|---|---|
| 1 | `new AbortController()` | Creates the cancellation controller (WeatherNow Task 4). |
| 2 | `controller.abort()` | Fires after 10 s — fetch rejects with an AbortError. |
| 3 | `method` | The fetch options key for the HTTP verb. |
| 4 | `"Content-Type"` | Header announcing the JSON payload. |
| 5 | `body` | The options key carrying the stringified payload. |

## Exercise 2.7 — jQuery Live Search
| # | Missing line | Why |
|---|---|---|
| 1 | `document` | `$(document).ready(fn)` waits for the DOM before running. |
| 2 | `$.get` | jQuery's GET shorthand: `$.get(url, callback)`. |
| 3 | `keyup` | Fires after each released keystroke — the live-search trigger. |
| 4 | `this` | `$(this)` = the element the event fired on (the search box). |
| 5 | `empty` | Removes all child elements before appending fresh results. |

## Exercise 2.8 — $.ajax POST + chaining
| # | Missing line | Why |
|---|---|---|
| 1 | `method` | The HTTP verb key in the $.ajax config (`method: "POST"`). |
| 2 | `JSON.stringify` | contentType says JSON, so the data must be a JSON string. |
| 3 | `success` | The $.ajax success callback key. |
| 4 | `done` | Promise-style success handler (rubric forbids config callbacks here). |
| 5 | `always` | Runs after success OR failure — the timestamp logger. |
