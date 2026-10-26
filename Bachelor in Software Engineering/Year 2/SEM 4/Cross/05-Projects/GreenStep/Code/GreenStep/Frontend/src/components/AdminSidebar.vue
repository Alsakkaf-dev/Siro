<template>
  <aside class="sidebar">
    <h2>🌱 GreenStep</h2>
    <p class="subtitle">Admin Panel</p>

    <RouterLink to="/admin" class="sidebar-item" active-class="active" exact>Dashboard</RouterLink>
    <RouterLink to="/admin/users" class="sidebar-item" active-class="active">Users</RouterLink>
    <RouterLink to="/admin/tips" class="sidebar-item" active-class="active">Eco Tips</RouterLink>
    <RouterLink to="/admin/challenges" class="sidebar-item" active-class="active">Challenges</RouterLink>
    <RouterLink to="/admin/badges" class="sidebar-item" active-class="active">Badges</RouterLink>
    <RouterLink to="/admin/factors" class="sidebar-item" active-class="active">Emission Factors</RouterLink>
    <RouterLink to="/admin/settings" class="sidebar-item" active-class="active">Settings</RouterLink>

    <hr class="sidebar-divider" />
    <button @click="handleLogout" class="sidebar-logout">
      🚪 Logout
    </button>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  if (confirm('Are you sure you want to log out of the admin session?')) {
    // Reset state values
    authStore.token = null
    authStore.user = null
    
    // Clear storage references
    localStorage.clear()
    sessionStorage.clear()

    // Redirect to login page
    router.push('/login')
  }
}
</script>