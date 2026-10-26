# CH7 Mastery — Full Vue Apps: Vite, SFCs, Props/Emits, Router, Pinia

> Sources: Chapter_7_Full_Vue_Apps_Slides.pdf + Lab (Todo SPA: todo-spa project, TodoItem.vue, TodosView.vue, TodoDetailView.vue, stores/todos.js, router/index.js).
> Style: **`<script setup>` SFCs**, `defineProps` / `defineEmits`, **setup-function Pinia stores**, Vue Router 4 (`createRouter` + `createWebHistory`). The lab's app world = **Todo List SPA** with `/`, `/todos`, `/todos/:id`.

---

## 1. The Mental Model (5 lines)

1. **Vite scaffolds the app**: `npm create vue@latest` (pick Router + Pinia) → `npm install` → `npm run dev` → http://localhost:5173.
2. A **Single File Component** = `<template>` + `<script setup>` + `<style scoped>` in one `.vue` file; import it, use it as a tag.
3. Communication: **props down** (`defineProps`), **events up** (`defineEmits` / `$emit`), **slots** inject content, **Pinia** for shared state (kills prop drilling).
4. **Vue Router** maps URLs to view components: `createRouter({ history: createWebHistory(), routes: [...] })`; navigate with `<router-link>`, render with `<router-view>`, read params with `useRoute()`.
5. **main.js wires it**: `createApp(App)` → `app.use(createPinia())` → `app.use(router)` → `app.mount('#app')` — **mount LAST**.

---

## 2. Scaffolding (exact prompts from the lab)

```bash
npm create vue@latest            # ⚡ THE scaffold command
# Project name: todo-spa
# Add TypeScript? No / JSX? No
# Add Vue Router for SPA? Yes   ← important
# Add Pinia for state management? Yes  ← important
# ESLint? Yes / Prettier? Yes
cd todo-spa
npm install                      # ⚡
npm run dev                      # ⚡ → VITE ready → http://localhost:5173/
```
Why Vite: instant dev server (native ESM), HMR < 50 ms, Rollup builds, official replacement for Vue CLI. Needs **Node.js 18+**.

### Project structure (slide 6 — MCQ magnet)
```
my-app/
├── public/              # static assets
├── src/
│   ├── assets/          # images, global css
│   ├── components/      # reusable .vue pieces (TodoItem.vue)
│   ├── views/           # route-level pages (TodosView.vue)
│   ├── router/index.js  # ⚡ route definitions
│   ├── stores/          # ⚡ Pinia stores
│   ├── App.vue          # root component (RouterView lives here)
│   └── main.js          # ⚡ entry point
├── index.html           # ONE <div id="app">
└── vite.config.js
```
`@` alias = `src/` (e.g. `import { useTodosStore } from '@/stores/todos'`).

---

## 3. main.js (his exact file)

```js
import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'                // ⚡
import App from './App.vue'
import router from './router'                      // ⚡ default export of router/index.js

const app = createApp(App)

app.use(createPinia())                             // ⚡ install Pinia plugin
app.use(router)                                    // ⚡ install Router plugin

app.mount('#app')                                  // ⚡ MOUNT LAST
```

---

## 4. Single File Components

```vue
<!-- HelloCard.vue -->
<template>
  <div class="card">
    <h2>{{ title }}</h2>
    <p>Clicked {{ count }} times</p>
    <button @click="count++">+1</button>
  </div>
</template>

<script setup>                                     <!-- ⚡ script setup = Composition API sugar -->
import { ref } from 'vue'
defineProps({                                      // ⚡ no import needed (compiler macro)
  title: { type: String, default: 'Hello!' }
})
const count = ref(0)
</script>

<style scoped>                                     <!-- ⚡ scoped = CSS only for THIS component -->
.card { padding: 1rem; border: 2px solid #42B883; }
</style>
```
Usage rules: import locally, **no registration** in `<script setup>`; PascalCase `<HelloCard />` (or kebab-case); self-closing allowed; component state is isolated.

```vue
<!-- App.vue -->
<template>
  <HelloCard title="Welcome" />
</template>
<script setup>
import HelloCard from './components/HelloCard.vue' // ⚡ import → usable as tag
</script>
```

---

## 5. Props down, events up (the lab's TodoItem.vue)

```vue
<!-- Child: components/TodoItem.vue -->
<template>
  <li :class="{ done: todo.done }" class="todo">
    <input type="checkbox"
           :checked="todo.done"
           @change="$emit('toggle', todo.id)">     <!-- ⚡ $emit in template -->
    <router-link :to="{ name: 'todo-detail', params: { id: todo.id } }" class="text">
      {{ todo.text }}
    </router-link>
    <button class="remove" @click="$emit('remove', todo.id)">&times;</button>
  </li>
</template>

<script setup>
defineProps({
  todo: { type: Object, required: true }           // ⚡ typed, required prop
})
defineEmits(['toggle', 'remove'])                  // ⚡ declare emitted events
</script>
```

```vue
<!-- Parent listens with @event-name -->
<TodoItem v-for="t in store.items"
          :key="t.id"
          :todo="t"
          @toggle="store.toggle"
          @remove="store.remove" />                <!-- ⚡ event name matches emit -->
```

Script-side emit (slide 11):
```vue
<script setup>
const emit = defineEmits(['saved'])                // ⚡ capture the emit fn
function onClick() {
  emit('saved', { ok: true, at: Date.now() })      // ⚡ emit(name, payload)
}
</script>
```
Parent: `<SaveButton @saved="onSaved" />` → `function onSaved(payload) { ... }`.

### Slots (slide 12)
```vue
<!-- Child: Card.vue -->
<header><slot name="title">Default title</slot></header>  <!-- named slot + fallback -->
<div class="body"><slot /></div>                          <!-- default slot -->

<!-- Parent -->
<Card>
  <template #title>Welcome back, Ali!</template>          <!-- ⚡ #title fills named slot -->
  <p>Here are your tasks for today.</p>                   <!-- goes to default slot -->
</Card>
```

---

## 6. Vue Router (lab's router/index.js)

```js
import { createRouter, createWebHistory } from 'vue-router'   // ⚡ BOTH imports
import HomeView from '@/views/HomeView.vue'
import TodosView from '@/views/TodosView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),        // ⚡ history mode
  routes: [
    { path: '/',      name: 'home',  component: HomeView },   // ⚡ path/name/component
    { path: '/todos', name: 'todos', component: TodosView },
    {
      path: '/todos/:id',                                     // ⚡ dynamic param
      name: 'todo-detail',
      component: () => import('@/views/TodoDetailView.vue')   // ⚡ lazy load
    },
    { path: '/:pathMatch(.*)*', name: 'not-found',
      component: () => import('@/views/HomeView.vue') }       // catch-all
  ]
})

export default router                                         // ⚡ main.js imports this
```

### Navigation tags + programmatic
```vue
<nav>
  <router-link to="/">Home</router-link>                      <!-- ⚡ renders <a> -->
  <router-link :to="{ name: 'todos' }">Todos</router-link>    <!-- by name -->
</nav>
<router-view />                                               <!-- ⚡ matched view renders HERE -->
```
- Active link auto-gets class `router-link-active`.
```js
import { useRouter } from 'vue-router'
const router = useRouter()
router.push('/todos')                                         // ⚡ programmatic nav
router.push({ name: 'todo', params: { id: 7 } })
router.back()
```

### Reading params (lab's TodoDetailView.vue)
```vue
<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'                         // ⚡ useRoute (NOT useRouter)
import { useTodosStore } from '@/stores/todos'

const route = useRoute()
const store = useTodosStore()
const todo = computed(() => store.getById(route.params.id))   // ⚡ route.params.id
const notes = ref(todo.value?.notes ?? '')
watch(todo, t => { notes.value = t?.notes ?? '' })            // re-sync on navigation
</script>
```

---

## 7. Pinia (lab's stores/todos.js — setup-function style)

```js
import { defineStore } from 'pinia'                           // ⚡
import { ref, computed } from 'vue'

export const useTodosStore = defineStore('todos', () => {     // ⚡ defineStore(id, setupFn)
  // -------- state --------
  const items = ref([
    { id: 1, text: 'Finish Chapter 7 lab', done: false, notes: '' },
    { id: 2, text: 'Commit code to Git',   done: false, notes: '' },
  ])
  // -------- getters --------
  const total       = computed(() => items.value.length)
  const doneCount   = computed(() => items.value.filter(t => t.done).length)  // ⚡
  const activeCount = computed(() => total.value - doneCount.value)
  // -------- actions --------
  function add(text) {
    const clean = text.trim()
    if (!clean) return
    items.value.push({ id: Date.now(), text: clean, done: false, notes: '' }) // ⚡ Date.now() id
  }
  function remove(id) {
    items.value = items.value.filter(t => t.id !== id)        // ⚡ filter-out pattern
  }
  function toggle(id) {
    const t = items.value.find(t => t.id === id)              // ⚡ find-then-flip
    if (t) t.done = !t.done
  }
  function updateNotes(id, notes) {
    const t = items.value.find(t => t.id === id)
    if (t) t.notes = notes
  }
  function getById(id) {
    return items.value.find(t => t.id === Number(id))         // ⚡ Number() — route params are strings!
  }
  return { items, total, doneCount, activeCount,
           add, remove, toggle, updateNotes, getById }        // ⚡ ONLY returned names are public
})
```

### Consuming the store (TodosView.vue)
```vue
<script setup>
import { ref } from 'vue'
import { useTodosStore } from '@/stores/todos'
import TodoItem from '@/components/TodoItem.vue'

const store = useTodosStore()                                 // ⚡ call the composable
const text = ref('')
function submit() {
  store.add(text.value)                                       // ⚡ actions via store.
  text.value = ''
}
</script>

<template>
  <form @submit.prevent="submit" class="add-form">            <!-- ⚡ form + .prevent -->
    <input v-model="text" placeholder="What needs doing?">
    <button type="submit" :disabled="!text.trim()">Add</button>
  </form>
  <p v-if="store.total === 0" class="empty">Nothing yet…</p>
  <ul v-else>
    <TodoItem v-for="t in store.items" :key="t.id" :todo="t"
              @toggle="store.toggle" @remove="store.remove" />
  </ul>
  <p>{{ store.activeCount }} active · {{ store.doneCount }} done · {{ store.total }} total</p>
</template>
```
Pinia state lives **in memory** — full reload resets it (localStorage persistence = bonus challenge with `watch(items, fn, { deep: true })`).

---

## 8. Memorization anchors ⚡ (Ch7)

1. `npm create vue@latest` → `npm install` → `npm run dev` (port **5173**)
2. `<script setup>` + `<style scoped>`
3. `defineProps({ todo: { type: Object, required: true } })`
4. `defineEmits(['toggle', 'remove'])` / `const emit = defineEmits(['saved'])`
5. `@change="$emit('toggle', todo.id)"` and parent `@toggle="store.toggle"`
6. `emit('saved', payload)`
7. `<slot name="title">` ↔ `<template #title>`
8. `import { createRouter, createWebHistory } from 'vue-router'`
9. `history: createWebHistory(import.meta.env.BASE_URL)`
10. `{ path: '/todos/:id', name: 'todo-detail', component: () => import('@/views/TodoDetailView.vue') }`
11. `<router-link to="/todos">` / `:to="{ name: 'todo-detail', params: { id: todo.id } }"`
12. `<router-view />`
13. `const route = useRoute()` → `route.params.id`
14. `const router = useRouter()` → `router.push('/todos')`
15. `export const useTodosStore = defineStore('todos', () => { ... return {...} })`
16. `const store = useTodosStore()`
17. `items.value = items.value.filter(t => t.id !== id)` (remove)
18. `const t = items.value.find(t => t.id === id); if (t) t.done = !t.done` (toggle)
19. `items.value.find(t => t.id === Number(id))` (params are strings)
20. `app.use(createPinia())` + `app.use(router)` + `app.mount('#app')` — mount LAST

---

## 9. MCQ trivia (Ch7)

- Vite replaced Vue CLI; HMR; dev server uses native ES modules; production builds via Rollup; default port **5173**.
- `npm create vue@latest` is powered by **create-vue**.
- SFC = template + script + style in one `.vue` file.
- `<style scoped>` rewrites selectors so CSS affects only this component.
- In `<script setup>`, imported components need **no registration**; `defineProps/defineEmits` are **compiler macros** (no import).
- Data flow mantra: **props down, events up**.
- Prop drilling = passing props through many layers → solved by **Pinia** (Vue's official store).
- `<router-link>` renders an `<a>`; active one gets `router-link-active`.
- `<router-view>` is the placeholder where the matched route component renders.
- `useRoute()` = current route info (params/query); `useRouter()` = navigation object (push/back).
- Lazy route: `component: () => import('...')` — fetched on first visit.
- Catch-all route path: `/:pathMatch(.*)*`.
- Pinia store = `defineStore(id, setupFn)`; only returned names are public; state = ref, getters = computed, actions = functions.
- Pinia state resets on full page reload (memory only).
- `@` alias points to `src/`.

---

## 10. Minimal-pair confusions (Ch7)

| A | B | Difference |
|---|---|---|
| `useRoute()` | `useRouter()` | READ current route (params) vs NAVIGATE (push/back) |
| `defineProps` | `defineEmits` | data in vs events out |
| `$emit('x')` (template) | `emit('x')` (script) | direct vs via `const emit = defineEmits` |
| props | slots | pass DATA vs pass MARKUP |
| `<router-link>` | `<a href>` | client-side (no reload) vs full reload |
| `<router-view>` | `<RouterView>` | same thing (both valid) |
| `createWebHistory` | hash history | clean URLs (his choice) vs `#/` URLs |
| component in `views/` | in `components/` | route-level page vs reusable piece |
| Pinia getter | Pinia action | computed (derived) vs function (mutates) |
| `store.items` | `items` local ref | shared app-wide vs component-local |
| `route.params.id` | `Number(route.params.id)` | string from URL vs number for === compare |
| `npm run dev` | `npm run build` | dev server vs production dist/ |
| scoped style | global style | this component only vs whole app (App.vue's plain `<style>`) |
