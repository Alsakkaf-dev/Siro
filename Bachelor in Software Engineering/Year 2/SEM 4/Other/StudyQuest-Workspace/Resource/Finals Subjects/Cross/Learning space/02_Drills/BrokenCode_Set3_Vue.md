# Broken-Code Set 3 — Vue.js (10 exercises)

> World: the professor's own apps — Ch6 Interactive Profile Card (CDN), Ch6 mini todo, Ch7 Todo SPA (Vite + Router + Pinia), Ch8 Student Records Manager (Axios).
> Style to reproduce: **Vue 3 Composition API** — CDN `setup()` + `return {...}` in Ch6 contexts; `<script setup>` SFC in Ch7/8 contexts.
> Answers in `BrokenCode_Set3_ANSWERS.md`.

---

## Exercise 3.1 — Bootstrap a CDN Vue app (Profile Card Activity 1)

The page shows the literal text `{{ greeting }}` — Vue never mounted. Complete the file.

```html
<div id="app">
  <h1>{{ greeting }}</h1>
</div>

<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
  const { createApp, ref } = ____(1)____

  ____(2)____({
    ____(3)____ {
      const greeting = ____(4)____('Hello from Vue 3!')
      ____(5)____
    }
  }).____(6)____('#app')
</script>
```

**Must:** destructure from the global Vue object, create the application, declare the Composition-API entry function, make the greeting reactive, expose it to the template, and attach the app to the `#app` div.

---

## Exercise 3.2 — Profile card bindings (v-bind / v-model / :class)

The editable profile card must live-update and support dark mode. Fill the directive blanks.

```html
<div id="app" ____(1)____>
  <section class="card">
    <img ____(2)____ :alt="name" class="avatar">
    <h2>{{ name }}</h2>
    <p class="bio">{{ bio }}</p>
  </section>

  <section class="editor">
    <label>Name:
      <input ____(3)____ type="text">
    </label>
    <label>
      <input type="checkbox" ____(4)____> Dark mode
    </label>
    <label>Add a skill:
      <input v-model="newSkill" ____(5)____ placeholder="e.g. Node.js">
    </label>
  </section>
</div>
```

**Must:** apply the `dark` CSS class only while darkMode is true, bind the image source to the reactive `avatar`, two-way-bind the name input, two-way-bind the dark-mode checkbox, and add the skill when Enter is released in the input.

---

## Exercise 3.3 — Skills list: v-for, :key, computed, v-if/v-else

Complete the skills section of the Profile Card.

```html
<ul class="skills">
  <li ____(1)____ :key="skill">
    {{ skill }}
    <button @click="____(2)____" title="Remove">&times;</button>
  </li>
</ul>

<p ____(3)____ class="muted">No skills yet — add your first skill to get started.</p>
<p ____(4)____ class="muted">Listed <strong>{{ skillCount }}</strong> skills.</p>
```

```js
const { createApp, ref, computed } = Vue
// inside setup():
const skills = ref(['Vue.js', 'JavaScript', 'HTML & CSS'])
const skillCount = ____(5)____
```

**Must:** loop over skills with access to each item AND its index, remove the clicked skill by index, show the empty message only when the count is zero, show the count message otherwise, and derive skillCount reactively from the array length.

---

## Exercise 3.4 — addSkill / removeSkill logic (ref arrays)

Implement the two actions exactly in the lab's style.

```js
const skills   = ref(['Vue.js', 'JavaScript', 'HTML & CSS'])
const newSkill = ref('')

function addSkill() {
  const s = newSkill.____(1)____.trim()
  if (!s) return
  if (!skills.value.includes(s)) {
    skills.____(2)____.push(s)
  }
  ____(3)____ = ''
}

function removeSkill(index) {
  skills.value.____(4)____
}

return { skills, newSkill, ____(5)____ }
```

**Must:** read the ref's current string, push into the ref's underlying array, clear the input ref after adding, delete exactly one skill at the given index, and expose both functions to the template.

---

## Exercise 3.5 — watch + reactive vs ref

Two snippets from the slides. Complete both.

```js
// (a) watcher logging old → new on the username ref
import { watch } from 'vue'
watch(username, (____(1)____) => {
  console.log(`changed: ${oldVal} -> ${newVal}`)
})

// (b) object state without .value
import { reactive } from 'vue'
const user = ____(2)____({ name: 'Ali', age: 21 })
user.____(3)____ = 22                 // triggers DOM update — note: NO .value

// (c) same update if user had been declared with ref instead:
const user2 = ref({ name: 'Ali', age: 21 })
user2.____(4)____.age = 22
```

**Must:** receive the new and old values in the watcher's callback signature (correct order), construct a reactive object, mutate its property directly, and mutate the ref version through its container property.

---

## Exercise 3.6 — Single File Component with props + emits (TodoItem.vue)

The Todo SPA's row component compiles with errors. Restore the macros and emissions.

```vue
<template>
  <li :class="{ done: todo.done }" class="todo">
    <input type="checkbox"
           :checked="todo.done"
           @change="____(1)____">
    <router-link :to="{ name: 'todo-detail', params: { id: todo.id } }">
      {{ todo.text }}
    </router-link>
    <button @click="$emit('remove', todo.id)">&times;</button>
  </li>
</template>

<script setup>
____(2)____({
  todo: { type: ____(3)____, required: true }
})

____(4)____(['toggle', 'remove'])
</script>

<style ____(5)____>
.todo { display: flex; gap: .75rem; }
</style>
```

**Must:** announce the toggle event with the todo's id when the checkbox changes, declare the incoming prop, type it as an object, declare the two emitted events, and scope the CSS to this component only.

---

## Exercise 3.7 — Parent wiring (TodosView.vue)

The list view renders TodoItem rows from the store and adds new todos. Complete it.

```vue
<template>
  <form ____(1)____ class="add-form">
    <input v-model="text" placeholder="What needs doing?">
    <button type="submit" :disabled="!text.trim()">Add</button>
  </form>

  <ul>
    <TodoItem v-for="t in store.items"
              ____(2)____
              :todo="t"
              ____(3)____
              @remove="store.remove" />
  </ul>
</template>

<script setup>
import { ref } from 'vue'
import { useTodosStore } from '@/stores/todos'
import TodoItem from '____(4)____'

const store = ____(5)____
const text = ref('')

function submit() {
  store.add(text.value)
  text.value = ''
}
</script>
```

**Must:** submit without reloading the page, give Vue a stable identity per row, forward the child's toggle event to the store action, import the row component via the src alias, and obtain the store instance.

---

## Exercise 3.8 — Router configuration (router/index.js)

Deep links into `/todos/42` give a blank page. Rebuild the router file.

```js
import { ____(1)____ } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TodosView from '@/views/TodosView.vue'

const router = createRouter({
  ____(2)____: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',      name: 'home',  component: HomeView },
    { path: '/todos', name: 'todos', component: TodosView },
    {
      path: '____(3)____',
      name: 'todo-detail',
      component: ____(4)____            // lazy-loaded on first visit
    }
  ]
})

____(5)____
```

**Must:** import the two factory functions, configure HTML5 history mode, declare the dynamic id segment, lazy-load TodoDetailView from `@/views/TodoDetailView.vue`, and let main.js import this router.

---

## Exercise 3.9 — Reading the route + Pinia store (TodoDetailView.vue)

The detail page must find its todo from the URL. Complete the script.

```vue
<script setup>
import { ref, watch, computed } from 'vue'
import { ____(1)____ } from 'vue-router'
import { useTodosStore } from '@/stores/todos'

const route = useRoute()
const store = useTodosStore()

const todo = computed(() => store.getById(____(2)____))
</script>
```

```js
// stores/todos.js — the matching store pieces
export const useTodosStore = ____(3)____('todos', () => {
  const items = ref([ /* ... */ ])

  function getById(id) {
    return items.value.find(t => t.id === ____(4)____)
  }
  function toggle(id) {
    const t = items.value.find(t => t.id === id)
    ____(5)____
  }
  return { items, getById, toggle }
})
```

**Must:** import the composable that exposes the current route, read the id URL parameter, define the store with id + setup function, compare safely given that URL params are strings, and flip the found todo's done flag (guarding against not-found).

---

## Exercise 3.10 — main.js + onMounted Axios load (Ch7 wiring + Ch8 data)

Two fragments: the app entry file, and the Student Records list loading on mount.

```js
// (a) src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(____(1)____)
app.use(router)
app.____(2)____('#app')
```

```vue
<!-- (b) StudentList loading -->
<script setup>
import { ref, ____(3)____ } from 'vue'
import { getStudents } from '../api/studentApi.js'

const students = ref([])
const loading  = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getStudents()
    students.value = ____(4)____
  } catch (e) {
    console.error('Could not load.')
  } finally {
    ____(5)____
  }
}
onMounted(load)
</script>
```

**Must:** install Pinia as a plugin, mount last, import the lifecycle hook that runs after the component appears, copy the parsed body into the reactive array, and always clear the loading flag.
