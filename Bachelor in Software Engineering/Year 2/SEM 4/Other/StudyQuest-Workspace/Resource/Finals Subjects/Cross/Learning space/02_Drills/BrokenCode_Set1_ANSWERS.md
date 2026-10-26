# ANSWERS — Set 1: HTML, CSS, JavaScript & DOM

## Exercise 1.1 — Portfolio skeleton
| # | Missing line | Why |
|---|---|---|
| 1 | `<!DOCTYPE html>` | HTML5 doctype must be the first line — without it the browser enters quirks mode. |
| 2 | `<meta name="viewport" content="width=device-width, initial-scale=1.0">` | Makes the page scale to device width — required for responsive design. |
| 3 | `<header>` | Semantic landmark for the page banner (closes with `</header>` already shown). |
| 4 | `href="#about"` | In-page anchor: `#` + the target section's id jumps to it. |
| 5 | `<address>` | Semantic element for contact info, used inside footer in Lab 1. |

## Exercise 1.2 — Academic results table
| # | Missing line | Why |
|---|---|---|
| 1 | `<caption>` | Caption must be the first child of `<table>`; renders above it. |
| 2 | `scope="col"` | Tells screen readers this header governs the cells below it. |
| 3 | `<tbody>` | Body section between thead and tfoot — never omitted in his lab. |
| 4 | `scope="row"` | This `<th>` is a row header — governs cells to its right. |
| 5 | `colspan="2"` | Merges the Total label across the first two columns. |

## Exercise 1.3 — Design tokens + reset
| # | Missing line | Why |
|---|---|---|
| 1 | `:root` | Pseudo-class for the document root — where custom properties live. |
| 2 | `box-sizing: border-box;` | Padding/border count inside the declared width — predictable boxes. |
| 3 | `font-size: 62.5%;` | 62.5% of 16px = 10px, so 1rem = 10px for easy math. |
| 4 | `var(--color-primary)` | `var()` reads a custom property — no hard-coded hex allowed. |

## Exercise 1.4 — Sticky nav + card grid
| # | Missing line | Why |
|---|---|---|
| 1 | `display: flex` | Makes nav a flex container (horizontal by default). |
| 2 | `justify-content: space-between` | Pushes logo and link list to opposite ends of the main axis. |
| 3 | `position: sticky;` | With `top: 0`, the nav sticks to the viewport while scrolling. |
| 4 | `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` | The lab's signature responsive card-grid line — auto-fit collapses empty tracks. |
| 5 | `(min-width: 600px)` | Mobile-first tablet breakpoint uses min-width 600px. |

## Exercise 1.5 — Render a note card
| # | Missing line | Why |
|---|---|---|
| 1 | `document.createElement("div")` | The only allowed way to build elements (innerHTML banned). |
| 2 | `setAttribute` | Stamps `data-id` so delegation can find the note later. |
| 3 | `titleSpan.textContent` | Safe text assignment — no HTML parsing, no XSS. |
| 4 | `appendChild` | Inserts the delete button inside the card. |
| 5 | `notesContainer` | The cached parent element receives the finished card. |

## Exercise 1.6 — Add & delete with BOM
| # | Missing line | Why |
|---|---|---|
| 1 | `value.trim()` | Read the input text and strip surrounding whitespace. |
| 2 | `alert` | BOM blocking dialog for the empty-title validation (lab requirement). |
| 3 | `confirm` | Returns true (OK) / false (Cancel) — gate before destructive action. |
| 4 | `findIndex` | Returns the position of the matching note, or −1. |
| 5 | `splice(index, 1)` | Removes exactly one element at that index (mutates the array). |

## Exercise 1.7 — Event delegation
| # | Missing line | Why |
|---|---|---|
| 1 | `addEventListener` | One listener on the parent list — clicks bubble up to it. |
| 2 | `getAttribute` | Reads the `data-action` value off the clicked element. |
| 3 | `if (!action || !idStr)` | Guard: ignore clicks that aren't on an action button. |
| 4 | `parseInt` | Convert the data-id string to an integer (radix 10). |
| 5 | `editTask(taskId)` | The matching action function for 'edit'. |

## Exercise 1.8 — BOM panel
| # | Missing line | Why |
|---|---|---|
| 1 | `window.innerWidth` | BOM property: viewport width in px. |
| 2 | `` `${w} x ${h} px` `` | Template literal interpolating both dimensions. |
| 3 | `addEventListener` | `window.addEventListener("resize", ...)` re-runs on every resize. |
| 4 | `navigator.userAgent` | BOM navigator object's browser identification string. |
| 5 | `e.key === "Enter"` | Modern key check (replaces keyCode 13). |
