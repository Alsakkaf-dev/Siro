<script setup>
defineProps({ employees: { type: Array, required: true } })
const emit = defineEmits(['edit', 'delete'])

// Format monthly salary as Malaysian Ringgit.
const rm = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' })
function formatSalary(v) { return rm.format(Number(v)) }
function formatDate(v) { return String(v).slice(0, 10) }
</script>

<template>
  <div v-if="!employees.length" class="empty card">
    No employees found. Add one above or clear the search filter.
  </div>

  <div v-else class="table-wrap card">
    <table class="employee-table">
      <thead>
        <tr>
          <th>Emp ID</th><th>Name</th><th>Department</th>
          <th>Position</th><th>Hire Date</th><th>Salary</th>
          <th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in employees" :key="e.id" :class="{ inactive: !e.active }">
          <td><code>{{ e.empId }}</code></td>
          <td>
            <strong>{{ e.name }}</strong>
            <div class="muted">{{ e.email }}</div>
          </td>
          <td>{{ e.department }}</td>
          <td>{{ e.position }}</td>
          <td>{{ formatDate(e.hireDate) }}</td>
          <td>{{ formatSalary(e.salary) }}</td>
          <td>
            <span :class="e.active ? 'badge ok' : 'badge no'">
              {{ e.active ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="row-actions">
            <button @click="emit('edit', e)">Edit</button>
            <button class="danger" @click="emit('delete', e.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
