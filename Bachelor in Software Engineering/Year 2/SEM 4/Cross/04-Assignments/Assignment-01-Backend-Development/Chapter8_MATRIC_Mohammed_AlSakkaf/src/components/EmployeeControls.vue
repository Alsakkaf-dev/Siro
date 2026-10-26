<script setup>
// Search + sort controls. Emits changes up to the parent (App.vue),
// which performs the actual server-side query through Axios.
import { ref, watch } from 'vue'

const emit = defineEmits(['search', 'sort'])

const q = ref('')
const sortBy = ref('')
const order = ref('asc')

let debounce
watch(q, (val) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => emit('search', val.trim()), 300)
})

function applySort() {
  emit('sort', { sortBy: sortBy.value, order: order.value })
}
</script>

<template>
  <div class="controls card">
    <label class="search">Search
      <input v-model.trim="q" placeholder="Search by name, ID, email or department…" />
    </label>

    <label>Sort by
      <select v-model="sortBy" @change="applySort">
        <option value="">Default (ID)</option>
        <option value="name">Name</option>
        <option value="hireDate">Hire date</option>
        <option value="salary">Salary</option>
      </select>
    </label>

    <label>Order
      <select v-model="order" @change="applySort">
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </label>
  </div>
</template>
