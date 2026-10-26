# Broken-Code Set 1 — HTML, CSS, JavaScript & DOM (8 exercises)

> Exam simulation rules: each exercise = scenario → code with numbered blanks `____(n)____` → required behaviour. Write the EXACT missing line/fragment. Answers in `BrokenCode_Set1_ANSWERS.md`.
> World: the professor's own labs — portfolio page, Quick Notes Dashboard, Kanban Task Board.

---

## Exercise 1.1 — Portfolio skeleton (HTML anatomy)

A student's portfolio page fails W3C validation and looks wrong on phones. Complete the document so it is a valid, mobile-ready HTML5 page with semantic landmarks.

```html
____(1)____
<html lang="en">
<head>
  <meta charset="UTF-8">
  ____(2)____
  <title>My Portfolio</title>
</head>
<body>
  ____(3)____
    <h1>Nur Aisyah</h1>
    <p>Full-Stack Developer in training</p>
  </header>
  <nav>
    <ul>
      <li><a ____(4)____>About</a></li>
    </ul>
  </nav>
  <main>
    <section id="about">...</section>
  </main>
  <footer>
    ____(5)____nur.aisyah@graduate.utm.my</address>
  </footer>
</body>
</html>
```

**The page must:** validate as HTML5, scale correctly on mobile, use a semantic header landmark, make the nav link jump to the About section on the same page, and mark up the contact email semantically.

---

## Exercise 1.2 — Academic results table

The grades table renders but screen readers cannot associate headers with cells, and the merged header is broken. Fill the blanks.

```html
<table border="1" cellpadding="8" cellspacing="0">
  ____(1)____Year 2 Academic Results</caption>
  <thead>
    <tr>
      <th ____(2)____ colspan="2">Semester 1 &amp; 2</th>
      <th scope="col">Credits</th>
      <th scope="col">Grade</th>
    </tr>
  </thead>
  ____(3)____
    <tr>
      <th ____(4)____>SCSM2223</th>
      <td>Cross-Platform Dev</td>
      <td>3</td>
      <td>A</td>
    </tr>
  </tbody>
  <tfoot>
    <tr><td ____(5)____>Total</td><td><strong>120</strong></td></tr>
  </tfoot>
</table>
```

**The table must:** show a caption above it, merge the first header across two columns, mark column headers and row headers for assistive tech, and have the footer's "Total" cell span two columns.

---

## Exercise 1.3 — Design tokens + reset (CSS architecture)

The stylesheet must define the design-token system and reset exactly as Lab 1B requires.

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap');

____(1)____ {
  --color-primary: #1a1a2e;
  --font-heading: 'Playfair Display', serif;
  --space-md: 1.5rem;
}

* { ____(2)____ }

html { ____(3)____ }        /* so that 1rem = 10px */

h1 {
  color: ____(4)____;
  font-family: var(--font-heading);
  margin-bottom: var(--space-md);
}
```

**The sheet must:** declare global custom properties, make padding count inside element width everywhere, set the 62.5% base-font trick, and consume the primary colour variable in h1.

---

## Exercise 1.4 — Sticky flexbox nav + responsive card grid

Complete the layout CSS for the portfolio: a sticky horizontal nav (logo left, links right) and a card grid that fills the row and wraps automatically.

```css
nav {
  ____(1)____;
  ____(2)____;
  align-items: center;
  gap: 1rem;
  ____(3)____ top: 0;
  z-index: 10;
}

.card-grid {
  display: grid;
  ____(4)____;
  gap: 1.5rem;
}

@media ____(5)____ {
  .card-grid { grid-template-columns: repeat(2, 1fr); }   /* tablet: 2 columns */
}
```

**The layout must:** lay nav children on one row with space between the two ends, keep the nav visible while scrolling, auto-fit cards at minimum 260px each, and switch to exactly 2 columns from 600px upward (mobile-first).

---

## Exercise 1.5 — Quick Notes: render a note card (pure DOM, no innerHTML)

The Quick Notes Dashboard must build each note card with the DOM API only (lab constraint: `innerHTML` is banned). Complete `renderNotes()`.

```js
notes.forEach(note => {
  const noteDiv = ____(1)____;
  noteDiv.classList.add("note-item");
  noteDiv.____(2)____("data-id", note.id);

  const titleSpan = document.createElement("span");
  ____(3)____ = note.title;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.setAttribute("data-action", "delete");
  deleteBtn.setAttribute("data-id", note.id);

  noteDiv.appendChild(titleSpan);
  noteDiv.____(4)____(deleteBtn);
  ____(5)____.appendChild(noteDiv);
});
```

**The function must:** create a wrapper div, stamp the note id as a data attribute, write the title as safe text, attach the delete button into the card, and insert the finished card into the `notesContainer` element.

---

## Exercise 1.6 — Quick Notes: add & delete with BOM dialogs

Complete the add/delete logic. The lab requires BOM `alert()` validation and a BOM `confirm()` before deletion.

```js
function addNote() {
  const title = titleInput.____(1)____;
  if (title === "") {
    ____(2)____("Title cannot be empty!");
    titleInput.focus();
    return;
  }
  notes.push({ id: nextId++, title, content: contentInput.value.trim() });
  renderNotes();
  titleInput.value = "";
}

function deleteNoteById(id) {
  const ok = ____(3)____("Are you sure you want to delete this note?");
  if (!ok) return;
  const index = notes.____(4)____(n => n.id === id);
  if (index !== -1) {
    notes.____(5)____;
    renderNotes();
  }
}
```

**The code must:** read the trimmed input text, warn with a blocking browser dialog when empty, ask yes/no before deleting, locate the note's position in the array by id, and remove exactly one element at that position.

---

## Exercise 1.7 — Kanban board: event delegation

The Kanban Task Board creates Edit/Delete buttons dynamically, so the lab demands ONE listener per column list. Complete the delegation handler.

```js
todoList.____(1)____('click', function(event) {
  const action = event.target.____(2)____('data-action');   // 'edit' or 'delete'
  const idStr  = event.target.getAttribute('data-id');
  ____(3)____ return;                       // click was on something else

  const taskId = ____(4)____(idStr, 10);

  if (action === 'delete') { deleteTask(taskId); }
  if (action === 'edit')   { ____(5)____;   }
});
```

**The handler must:** listen on the parent `<ul>`, read which action the clicked button carries, bail out when the click was not on an action button, convert the id string to a base-10 integer, and open the edit flow for that task.

---

## Exercise 1.8 — BOM panel: window size + resize + Enter shortcut

Complete the Quick Notes BOM features: live window size, user agent display, and the Enter-to-add bonus.

```js
function updateWindowSize() {
  const w = ____(1)____;
  const h = window.innerHeight;
  windowSizeSpan.textContent = ____(2)____;       // e.g. "1280 x 720 px" using a template literal
}

window.____(3)____("resize", updateWindowSize);

function showUserAgent() {
  userAgentSpan.textContent = ____(4)____;
}

titleInput.addEventListener("keydown", (e) => {
  if (____(5)____) {
    addNote();
  }
});
```

**The code must:** read the viewport width from the BOM, render `"<w> x <h> px"` with a template literal, re-run the size display whenever the browser window is resized, show the browser identification string, and submit the note when the Enter key is pressed.
