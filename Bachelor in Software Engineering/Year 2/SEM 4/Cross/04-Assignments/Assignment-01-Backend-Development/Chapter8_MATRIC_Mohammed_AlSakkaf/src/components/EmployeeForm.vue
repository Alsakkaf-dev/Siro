<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  editingEmployee: { type: Object, default: null },
  // optional field errors pushed down from the server (HTTP 400)
  serverErrors: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['save', 'cancel'])

const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Operations']

const emptyForm = () => ({
  empId: '', name: '', email: '', department: '',
  position: '', hireDate: '', salary: '', active: true
})

const form = ref(emptyForm())
const errors = ref({})

watch(() => props.editingEmployee, (val) => {
  // hireDate comes from MySQL as an ISO datetime string — keep only YYYY-MM-DD
  form.value = val
    ? { ...val, hireDate: String(val.hireDate).slice(0, 10), salary: Number(val.salary) }
    : emptyForm()
  errors.value = {}
}, { immediate: true })

// merge any server-side field errors into the visible error list
watch(() => props.serverErrors, (val) => {
  if (val && Object.keys(val).length) errors.value = { ...errors.value, ...val }
})

const isEditing = computed(() => Boolean(props.editingEmployee))

const empIdRegex = /^EMP[0-9]{3,5}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
  const e = {}
  const f = form.value

  if (!f.empId.trim()) e.empId = 'Employee ID is required.'
  else if (!empIdRegex.test(f.empId.trim().toUpperCase()))
    e.empId = 'Format: EMP followed by 3–5 digits (e.g. EMP001).'

  if (!f.name.trim() || f.name.trim().length < 3)
    e.name = 'Name must be at least 3 characters.'

  if (!emailRegex.test(f.email.trim()))
    e.email = 'Please enter a valid email address.'

  if (!f.department) e.department = 'Please choose a department.'
  if (!f.position.trim()) e.position = 'Position is required.'

  if (!f.hireDate) e.hireDate = 'Hire date is required.'
  else {
    const today = new Date(new Date().toDateString())
    if (new Date(f.hireDate) > today) e.hireDate = 'Hire date cannot be in the future.'
  }

  const salary = Number(f.salary)
  if (Number.isNaN(salary) || salary < 1500 || salary > 50000)
    e.salary = 'Salary must be between RM 1,500 and RM 50,000.'

  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('save', {
    ...form.value,
    empId: form.value.empId.trim().toUpperCase(),
    name: form.value.name.trim(),
    email: form.value.email.trim(),
    position: form.value.position.trim(),
    salary: Number(form.value.salary)
  })
  if (!isEditing.value) { form.value = emptyForm(); errors.value = {} }
}

function onCancel() {
  emit('cancel')
  form.value = emptyForm()
  errors.value = {}
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="employee-form card">
    <h3>{{ isEditing ? 'Edit Employee' : 'Add New Employee' }}</h3>

    <div class="grid">
      <label>Employee ID
        <input v-model.trim="form.empId" placeholder="EMP001" :disabled="isEditing" />
        <span v-if="errors.empId" class="err">{{ errors.empId }}</span>
      </label>

      <label>Full Name
        <input v-model.trim="form.name" placeholder="Full name" />
        <span v-if="errors.name" class="err">{{ errors.name }}</span>
      </label>

      <label>Email
        <input v-model.trim="form.email" type="email" placeholder="name@company.com.my" />
        <span v-if="errors.email" class="err">{{ errors.email }}</span>
      </label>

      <label>Department
        <select v-model="form.department">
          <option value="">-- Select --</option>
          <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
        </select>
        <span v-if="errors.department" class="err">{{ errors.department }}</span>
      </label>

      <label>Position
        <input v-model.trim="form.position" placeholder="Job title" />
        <span v-if="errors.position" class="err">{{ errors.position }}</span>
      </label>

      <label>Hire Date
        <input v-model="form.hireDate" type="date" />
        <span v-if="errors.hireDate" class="err">{{ errors.hireDate }}</span>
      </label>

      <label>Salary (RM)
        <input v-model.number="form.salary" type="number" step="50" min="1500" max="50000" />
        <span v-if="errors.salary" class="err">{{ errors.salary }}</span>
      </label>

      <label class="check">
        <input type="checkbox" v-model="form.active" /> Active employee
      </label>
    </div>

    <div class="actions">
      <button type="submit">{{ isEditing ? 'Update' : 'Add' }}</button>
      <button v-if="isEditing" type="button" class="ghost" @click="onCancel">Cancel</button>
    </div>
  </form>
</template>
