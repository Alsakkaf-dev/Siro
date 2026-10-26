# CH6 Mastery — Vue.js Basics (CDN + Composition API)

> Sources: Chapter_6_Vue_Basics_Slides.pdf + Chapter_6_Vue_Basics_Lab.pdf (Interactive Profile Card).
> **Course style confirmed: Vue 3, Composition API, CDN build.** In Ch6 the pattern is always `const { createApp, ref } = Vue` + `setup()` that **returns** what the template uses. NOT Options API (no `data()`, no `methods:{}`).

---

## 1. The Mental Model (5 lines)

1. Frameworks exist because manual DOM updates don't scale: **declarative UI = describe WHAT from data; Vue handles the DOM**.
2. Every Vue app = `createApp({ setup() { ...; return {...} } }).mount('#app')` — create, set up state, mount to one element.
3. `ref(x)` makes a value reactive: **`.value` in JS, no `.value` in the template**. `reactive({})` for objects (no .value at all). Rule of thumb: use `ref()` by default.
4. Directives wire HTML to state: `v-bind`(`:`) attributes in, `v-on`(`@`) events out, `v-model` both ways, `v-if/v-else/v-show` conditionals, `v-for` + `:key` lists.
5. `computed(() => ...)` = cached derived value; methods = plain functions you call; `watch(src, (newVal, oldVal) => ...)` = side effects on change.

---

## 2. The skeleton he uses in EVERY Ch6 example

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Vue Lab — Profile Card</title></head>
<body>
  <div id="app">                                   <!-- ⚡ the mount point -->
    <h1>{{ greeting }}</h1>                        <!-- ⚡ mustache interpolation -->
  </div>

  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script> <!-- ⚡ CDN BEFORE app code -->
  <script>
    const { createApp, ref } = Vue                 // ⚡ destructure from global Vue

    createApp({                                    // ⚡ createApp(options)
      setup() {                                    // ⚡ Composition API entry point
        const greeting = ref('Hello from Vue 3!')  // ⚡ ref() = reactive value
        return { greeting }                        // ⚡ MUST return what template uses
      }
    }).mount('#app')                               // ⚡ attach to #app — LAST
  </script>
</body>
</html>
```
*If the page shows literal `{{ greeting }}` → Vue didn't mount (check console).*
*"skills is not defined" → you forgot it in the **return** object.*

---

## 3. Interpolation rules (slide 10)

```html
<p>Hello, {{ name }}!</p>                <!-- simple value -->
<p>Total: {{ price * quantity }}</p>     <!-- JS expression OK -->
<p>{{ name.toUpperCase() }}</p>          <!-- method call OK -->
<p>{{ age >= 18 ? 'Adult' : 'Minor' }}</p> <!-- ternary OK -->
```
- ONE **expression** per `{{ }}` — no statements (no if/for inside).
- Works only in **text**, not attributes → use `v-bind` for attributes.
- Output is **HTML-escaped** by default (XSS-safe).

---

## 4. ref() vs reactive() (slide 11 — classic exam contrast)

```js
import { ref } from 'vue'           // CDN version: const { ref } = Vue
const count = ref(0)
console.log(count.value)            // ⚡ .value in JS
count.value++                       // ⚡ changes the DOM!
// Template: {{ count }}            // ⚡ NO .value in templates

import { reactive } from 'vue'
const user = reactive({ name: 'Ali', age: 21 })
user.age = 22                       // ⚡ no .value — direct property access
// Template: {{ user.name }} — {{ user.age }}
```
Rule of thumb (his words): **use ref() by default; it works for everything.**

---

## 5. Core directives — the toolkit table

| Directive | Shorthand | Purpose | His example |
|---|---|---|---|
| `v-bind:src` | `:src` | bind attribute to state | `<img :src="imageUrl" :alt="caption">` |
| `v-on:click` | `@click` | listen to events | `<button @click="count++">+1</button>` |
| `v-model` | — | two-way form binding | `<input v-model="username">` |
| `v-if / v-else-if / v-else` | — | add/remove from DOM | `<p v-if="score >= 80">Excellent</p>` |
| `v-show` | — | toggle CSS display | `<div v-show="isMenuOpen">Menu</div>` |
| `v-for` | — | render list | `<li v-for="t in todos" :key="t.id">` |

### 5.1 v-bind variants
```html
<img v-bind:src="imageUrl" v-bind:alt="caption">   <!-- full form -->
<img :src="imageUrl" :alt="caption">               <!-- ⚡ shorthand -->
<p :class="{ active: isActive }">Hello</p>         <!-- ⚡ class object binding -->
<div :style="{ color: textColor, fontSize: size + 'px' }">...</div>
<button :disabled="!canSubmit">Save</button>       <!-- ⚡ disable until valid -->
<div id="app" :class="{ dark: darkMode }">         <!-- lab's dark-mode toggle -->
```

### 5.2 v-on + modifiers
```html
<button v-on:click="count++">+1</button>
<button @click="addItem">Add</button>              <!-- method by name -->
<button @click="remove(item.id)">Delete</button>   <!-- with argument -->
<form @submit.prevent="save">...</form>            <!-- ⚡ .prevent = preventDefault -->
<input @keyup.enter="search">                      <!-- ⚡ .enter key modifier -->
```
Modifiers: `.prevent` `.stop` `.once` `.enter` `.esc`.

### 5.3 v-model across input types + modifiers
```html
<input v-model="username" placeholder="Your name">
<textarea v-model="message"></textarea>
<input type="checkbox" v-model="agree">            <!-- boolean -->
<input type="radio" value="L"  v-model="size">     <!-- shared model = group -->
<select v-model="country"><option>Malaysia</option></select>
<input v-model.trim="email">                       <!-- ⚡ .trim .number .lazy -->
```

### 5.4 v-if vs v-show (slide 16)
```html
<p v-if="score >= 80">Excellent</p>
<p v-else-if="score >= 50">Good</p>
<p v-else>Keep trying</p>
<template v-if="isLoggedIn">  <!-- group without extra DOM -->
  <h2>Welcome back!</h2><button @click="logout">Logout</button>
</template>
```
- `v-if` **adds/removes the element** — use for rare toggles.
- `v-show` **toggles display:none** (always rendered) — use for frequent toggles.

### 5.5 v-for + :key discipline
```html
<li v-for="fruit in fruits" :key="fruit">{{ fruit }}</li>
<li v-for="(fruit, i) in fruits" :key="i">{{ i + 1 }}. {{ fruit }}</li>  <!-- with index -->
<tr v-for="s in students" :key="s.id"><td>{{ s.name }}</td></tr>          <!-- ⚡ id as key -->
```
- Always give a **unique :key** (usually id). **Never index as key** when list reorders/deletes.

---

## 6. computed / methods / watch (slide 18 + lab)

```js
const { createApp, ref, computed } = Vue           // ⚡ add computed to the destructure

const doneCount = computed(() =>                   // ⚡ cached, re-runs only when deps change
  todos.value.filter(t => t.done).length
)
const skillCount = computed(() => skills.value.length)  // lab version

function addTodo() {                               // method = plain function
  todos.value.push(newTodo.value)
  newTodo.value = ''
}

watch(username, (newVal, oldVal) => {              // ⚡ watch(source, callback(new, old))
  console.log(`changed: ${oldVal} -> ${newVal}`)
})
watch(items, save, { deep: true })                 // deep option for objects/arrays
```
computed vs method: computed is **cached** until dependencies change; a method re-runs on every render.

---

## 7. The complete mini todo app (slide 19 — HIS canonical example)

```html
<div id="app">
  <h2>Todos ({{ todos.length }})</h2>
  <input v-model="newTodo" @keyup.enter="add" placeholder="What to do?">
  <button @click="add">Add</button>
  <ul>
    <li v-for="(t,i) in todos" :key="i">
      <input type="checkbox" v-model="t.done">
      <span :class="{done:t.done}">{{ t.text }}</span>
      <button @click="todos.splice(i,1)">x</button>
    </li>
  </ul>
  <p>{{ doneCount }} / {{ todos.length }}</p>
</div>

<script src="https://unpkg.com/vue@3"></script>
<script>
const { createApp, ref, computed } = Vue
createApp({
  setup() {
    const newTodo = ref('')
    const todos   = ref([])
    const doneCount = computed(() => todos.value.filter(t => t.done).length)
    function add() {
      const t = newTodo.value.trim()               // ⚡ trim-then-guard idiom
      if (!t) return
      todos.value.push({ text: t, done: false })   // ⚡ push object into ref array (.value!)
      newTodo.value = ''
    }
    return { newTodo, todos, doneCount, add }      // ⚡ return everything
  }
}).mount('#app')
</script>
```

### Lab's Profile Card add/removeSkill (same idiom, different nouns)
```js
const skills   = ref(['Vue.js', 'JavaScript', 'HTML & CSS'])
const newSkill = ref('')
function addSkill() {
  const s = newSkill.value.trim()
  if (!s) return
  if (!skills.value.includes(s)) { skills.value.push(s) }   // no duplicates
  newSkill.value = ''
}
function removeSkill(index) { skills.value.splice(index, 1) } // ⚡ splice(i, 1)
```

---

## 8. Memorization anchors ⚡ (Ch6)

1. `<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>`
2. `const { createApp, ref, computed } = Vue`
3. `createApp({ setup() { ... return {...} } }).mount('#app')`
4. `const count = ref(0)` → JS: `count.value++` → template: `{{ count }}`
5. `return { name, title, skills, addSkill }` — forget = "not defined"
6. `:src="avatar"` / `:class="{ dark: darkMode }"` / `:disabled="!newSkill.trim()"`
7. `@click="addSkill"` / `@keyup.enter="addSkill"` / `@submit.prevent="save"`
8. `<input v-model="username">` / `v-model.trim` / `v-model.number`
9. `v-if` / `v-else-if` / `v-else` chain; `v-show` for frequent toggles
10. `<li v-for="(skill, i) in skills" :key="skill">`
11. `computed(() => skills.value.length)`
12. `watch(name, (n, o) => console.log(o, '->', n))`
13. `todos.value.push({ text: t, done: false })`
14. `skills.value.splice(index, 1)`
15. `const t = newTodo.value.trim(); if (!t) return`
16. `reactive({ name: 'Ali', age: 21 })` — no .value
17. `{{ price * quantity }}` — expressions yes, statements no
18. mount must come **last**; one `<div id="app">`

---

## 9. MCQ trivia (Ch6)

- Vue = **progressive** JavaScript framework; created by **Evan You (2014)**; current stable **Vue 3.x**; **MIT** license; vuejs.org.
- Key features: Declarative Rendering, Reactivity System, Component-Based, Progressive Adoption.
- Vue vs React vs Angular: Vue = framework, HTML-based templates, **gentle** learning curve, ~34 KB, community-backed. React = library, JSX, Meta. Angular = full framework, steep, Google, ~130 KB.
- Two ways to use Vue: **CDN (no build step — Ch6)** and **build tools Vite/create-vue (Ch7)**.
- `setup()` is the **entry point of the Composition API**.
- Interpolation is HTML-escaped; one expression per mustache; attributes need v-bind.
- `ref()` for primitives (needs .value in JS); `reactive()` for objects (no .value); template never needs .value.
- computed is **cached**; method is not.
- `v-if` = expensive toggle, removes from DOM; `v-show` = cheap toggle via CSS.
- `:key` lets Vue track list items; never index when reordering/deleting.
- Modifiers: `.prevent`, `.stop`, `.once`, `.enter`, `.esc`; v-model modifiers: `.lazy`, `.number`, `.trim`.
- v-model under the hood = `:value="name"` + `@input="name = $event.target.value"` (Ch8 slide).

---

## 10. Minimal-pair confusions (Ch6)

| A | B | Difference |
|---|---|---|
| `ref()` | `reactive()` | primitive w/ .value vs object direct access |
| `count.value` (JS) | `{{ count }}` (template) | .value needed vs auto-unwrapped |
| `v-bind` / `:` | `v-on` / `@` | data INTO attribute vs event OUT |
| `v-if` | `v-show` | DOM add/remove vs display:none |
| `v-for="t in todos"` | `v-for="(t, i) in todos"` | item only vs item+index |
| computed | method | cached vs re-runs every call |
| computed | watch | derived VALUE vs side EFFECT |
| `@keyup.enter` | `@submit.prevent` | key modifier vs default-suppressing modifier |
| `{{ }}` | `v-bind` | text content vs attribute values |
| `createApp` | `mount` | builds the app vs attaches it (mount LAST) |
| Options API | Composition API | data()/methods (NOT his style) vs setup()/ref (HIS style) |
| `.lazy` | `.trim` | sync on change vs strip whitespace |
