<template>
  <main class="admin-page">
    <div class="admin-layout">
      <AdminSidebar />
      <section class="admin-main">
        <div class="admin-top">
          <div>
            <h1 style="margin: 0">Users</h1>
            <p class="subtitle">Manage roles and account status.</p>
          </div>
        </div>

        <p v-if="feedbackMsg" :style="{ padding: '12px', borderRadius: '10px', marginTop: '16px', fontWeight: 'bold', backgroundColor: isError ? '#fde8e8' : '#eafaf1', color: isError ? '#c62828' : '#2f8f46' }">
          {{ feedbackMsg }}
        </p>

        <section class="admin-panel" style="margin-top: 18px">
          <p v-if="loading">Loading users...</p>

          <table v-else class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td><strong>{{ u.name }}</strong></td>
                <td>{{ u.email }}</td>
                <td>
                  <select
                    :value="u.role"
                    :disabled="u.id === myId || busyId === u.id"
                    @change="handleRoleChange(u, $event.target.value)"
                    class="input"
                    style="margin: 0; padding: 6px 8px; width: 120px"
                  >
                    <option value="user">user</option>
                    <option value="leader">leader</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <span :style="{ color: u.is_active ? '#2f8f46' : '#c62828', fontWeight: 'bold' }">
                    {{ u.is_active ? 'Active' : 'Deactivated' }}
                  </span>
                </td>
                <td style="text-align: right; white-space: nowrap">
                  <button
                    v-if="u.id !== myId"
                    @click="handleToggleStatus(u)"
                    :disabled="busyId === u.id"
                    class="btn secondary-btn"
                    style="width: auto; padding: 6px 12px; margin-right: 6px"
                  >
                    {{ u.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button
                    v-if="u.id !== myId"
                    @click="handleDelete(u)"
                    :disabled="busyId === u.id"
                    style="background: transparent; border: none; color: #c62828; font-weight: bold; cursor: pointer; font-size: 13px"
                  >
                    Delete
                  </button>
                  <span v-if="u.id === myId" style="color: #6d7a6b; font-size: 12px">You</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, updateUserRole, updateUserStatus, deleteUser } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import AdminSidebar from '@/components/AdminSidebar.vue'

const authStore = useAuthStore()
const myId = authStore.user?.id

const users = ref([])
const loading = ref(true)
const busyId = ref(null)
const feedbackMsg = ref('')
const isError = ref(false)

async function fetchUsers() {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (err) {
    console.error('Failed to load users:', err)
  } finally {
    loading.value = false
  }
}

async function handleRoleChange(user, newRole) {
  busyId.value = user.id
  feedbackMsg.value = ''
  isError.value = false
  try {
    await updateUserRole(user.id, newRole)
    feedbackMsg.value = `${user.name}'s role updated to ${newRole}.`
    await fetchUsers()
  } catch (err) {
    isError.value = true
    feedbackMsg.value = err.message
  } finally {
    busyId.value = null
  }
}

async function handleToggleStatus(user) {
  busyId.value = user.id
  feedbackMsg.value = ''
  isError.value = false
  try {
    await updateUserStatus(user.id, !user.is_active)
    feedbackMsg.value = `${user.name} ${user.is_active ? 'deactivated' : 'activated'}.`
    await fetchUsers()
  } catch (err) {
    isError.value = true
    feedbackMsg.value = err.message
  } finally {
    busyId.value = null
  }
}

async function handleDelete(user) {
  if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return
  busyId.value = user.id
  feedbackMsg.value = ''
  isError.value = false
  try {
    await deleteUser(user.id)
    feedbackMsg.value = `${user.name} deleted.`
    await fetchUsers()
  } catch (err) {
    isError.value = true
    feedbackMsg.value = err.message
  } finally {
    busyId.value = null
  }
}

onMounted(fetchUsers)
</script>