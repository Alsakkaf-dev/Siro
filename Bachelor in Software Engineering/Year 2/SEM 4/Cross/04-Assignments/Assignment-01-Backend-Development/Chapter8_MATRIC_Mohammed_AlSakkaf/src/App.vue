<script setup>
import { ref, computed, onMounted } from 'vue'
import EmployeeForm from './components/EmployeeForm.vue'
import EmployeeControls from './components/EmployeeControls.vue'
import EmployeeList from './components/EmployeeList.vue'
import {
  getEmployees, createEmployee, updateEmployee, deleteEmployee
} from './api/employeeApi.js'

// Parent holds the state; children talk via props + emits.
const employees = ref([])
const editingEmployee = ref(null)
const serverErrors = ref({})
const loading = ref(false)
const errorMsg = ref('')

// current search/sort query state
const query = ref({ q: '', sortBy: '', order: 'asc' })

const activeCount = computed(() => employees.value.filter((e) => e.active).length)

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const params = {}
    if (query.value.q) params.q = query.value.q
    if (query.value.sortBy) { params.sortBy = query.value.sortBy; params.order = query.value.order }
    const { data } = await getEmployees(params)
    employees.value = data
  } catch (e) {
    errorMsg.value = e.userMessage || 'Failed to load employees.'
  } finally {
    loading.value = false
  }
}

async function handleSave(payload) {
  errorMsg.value = ''
  serverErrors.value = {}
  try {
    if (editingEmployee.value) {
      await updateEmployee(editingEmployee.value.id, payload)
      editingEmployee.value = null
    } else {
      await createEmployee(payload)
    }
    await load()
  } catch (e) {
    if (e.fieldErrors) serverErrors.value = e.fieldErrors
    errorMsg.value = e.userMessage || 'Save failed.'
  }
}

function handleEdit(e) { editingEmployee.value = { ...e }; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function handleCancel() { editingEmployee.value = null; serverErrors.value = {} }

async function handleDelete(id) {
  if (!confirm('Delete this employee? This cannot be undone.')) return
  errorMsg.value = ''
  try {
    await deleteEmployee(id)
    await load()
  } catch (e) {
    errorMsg.value = e.userMessage || 'Delete failed.'
  }
}

function handleSearch(q) { query.value.q = q; load() }
function handleSort({ sortBy, order }) { query.value.sortBy = sortBy; query.value.order = order; load() }

onMounted(load)
</script>

<template>
  <header>
    <div class="header-inner">
      <div>
        <h1>Employee Directory</h1>
        <p class="subtitle">Vue 3 · Axios · Express · MySQL</p>
      </div>
      <div class="headcount">
        <span class="num">{{ activeCount }}</span>
        <span class="label">Active employees</span>
      </div>
    </div>
  </header>

  <main>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

    <EmployeeForm
      :editingEmployee="editingEmployee"
      :serverErrors="serverErrors"
      @save="handleSave"
      @cancel="handleCancel" />

    <EmployeeControls
      @search="handleSearch"
      @sort="handleSort" />

    <p v-if="loading" class="loading">Loading…</p>
    <EmployeeList
      v-else
      :employees="employees"
      @edit="handleEdit"
      @delete="handleDelete" />
  </main>
</template>
