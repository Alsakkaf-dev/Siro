# ANSWERS — Set 3: Vue.js

## Exercise 3.1 — Bootstrap CDN Vue
| # | Missing line | Why |
|---|---|---|
| 1 | `Vue` | The CDN build exposes one global object: `const { createApp, ref } = Vue`. |
| 2 | `createApp` | Creates the application instance from the options object. |
| 3 | `setup()` | Composition-API entry point. |
| 4 | `ref` | Wraps the string in a reactive ref. |
| 5 | `return { greeting }` | Only returned names are visible to the template. |
| 6 | `mount` | `.mount('#app')` attaches the app — always last. |

## Exercise 3.2 — Profile card bindings
| # | Missing line | Why |
|---|---|---|
| 1 | `:class="{ dark: darkMode }"` | Object class binding: class `dark` present only while darkMode is true. |
| 2 | `:src="avatar"` | v-bind shorthand — attribute follows the reactive ref. |
| 3 | `v-model="name"` | Two-way binding: typing updates the ref, ref updates the card. |
| 4 | `v-model="darkMode"` | Checkbox + v-model = boolean binding. |
| 5 | `@keyup.enter="addSkill"` | Key-modifier event: run addSkill when Enter is released. |

## Exercise 3.3 — Skills list
| # | Missing line | Why |
|---|---|---|
| 1 | `v-for="(skill, i) in skills"` | Need item AND index (the remove button uses i). |
| 2 | `removeSkill(i)` | Pass the index so splice knows where to cut. |
| 3 | `v-if="skillCount === 0"` | Render the empty message only at zero. |
| 4 | `v-else` | The complementary branch of the v-if. |
| 5 | `computed(() => skills.value.length)` | Cached derived value; `.value` needed in JS. |

## Exercise 3.4 — addSkill / removeSkill
| # | Missing line | Why |
|---|---|---|
| 1 | `value` | Refs are read via `.value` in script code. |
| 2 | `value` | The array lives at `skills.value` — push there. |
| 3 | `newSkill.value` | Clear the ref by assigning to `.value`. |
| 4 | `splice(index, 1)` | Remove exactly one element at that index. |
| 5 | `addSkill, removeSkill` | Functions must be returned to be usable in the template. |

## Exercise 3.5 — watch + reactive vs ref
| # | Missing line | Why |
|---|---|---|
| 1 | `newVal, oldVal` | Watch callback signature: NEW first, OLD second. |
| 2 | `reactive` | Object reactivity without .value. |
| 3 | `age` | reactive objects mutate via plain property access. |
| 4 | `value` | A ref holding an object: go through `.value` first (`user2.value.age`). |

## Exercise 3.6 — TodoItem.vue (props + emits)
| # | Missing line | Why |
|---|---|---|
| 1 | `$emit('toggle', todo.id)` | Template-side emit with the id payload. |
| 2 | `defineProps` | Compiler macro declaring incoming props (no import needed). |
| 3 | `Object` | The todo prop is a whole object, required. |
| 4 | `defineEmits` | Declares the component's events: `(['toggle', 'remove'])`. |
| 5 | `scoped` | `<style scoped>` confines CSS to this component. |

## Exercise 3.7 — TodosView.vue
| # | Missing line | Why |
|---|---|---|
| 1 | `@submit.prevent="submit"` | Submit handler + .prevent stops the page reload. |
| 2 | `:key="t.id"` | Stable identity per row — Vue tracks list changes by key. |
| 3 | `@toggle="store.toggle"` | Child's toggle event → store action (it receives the id payload). |
| 4 | `@/components/TodoItem.vue` | `@` = src/ alias; component imports include `.vue`. |
| 5 | `useTodosStore()` | Call the composable to get the store instance. |

## Exercise 3.8 — Router config
| # | Missing line | Why |
|---|---|---|
| 1 | `createRouter, createWebHistory` | Both factories come from 'vue-router'. |
| 2 | `history` | The config key holding the history mode. |
| 3 | `/todos/:id` | `:id` declares the dynamic URL parameter. |
| 4 | `() => import('@/views/TodoDetailView.vue')` | Arrow returning import() = lazy loading. |
| 5 | `export default router` | main.js does `import router from './router'`. |

## Exercise 3.9 — Route + store
| # | Missing line | Why |
|---|---|---|
| 1 | `useRoute` | Reads the CURRENT route (params) — not useRouter (navigation). |
| 2 | `route.params.id` | The `:id` segment arrives as `params.id` (a string). |
| 3 | `defineStore` | `defineStore('todos', setupFn)` — id + setup-function style. |
| 4 | `Number(id)` | URL params are strings; ids in the store are numbers — convert before `===`. |
| 5 | `if (t) t.done = !t.done` | Guarded flip — avoid crashing when the id is unknown. |

## Exercise 3.10 — main.js + onMounted load
| # | Missing line | Why |
|---|---|---|
| 1 | `createPinia()` | The plugin instance is the function's return value — call it. |
| 2 | `mount` | Mount comes after every `app.use(...)`. |
| 3 | `onMounted` | Lifecycle hook import — runs after the component is inserted. |
| 4 | `res.data` | Axios responses carry the parsed body in `.data`. |
| 5 | `loading.value = false` | `finally` guarantees the spinner clears on success AND failure. |
