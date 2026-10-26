<script setup>
import { onMounted, onActivated, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { watch } from 'vue'
import { getDashboard, getDailyTip } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const dashboard = ref(null)
const tip = ref(null)
const error = ref('')
const loading = ref(true)
const route = useRoute()

async function fetchDashboard() {
  loading.value = true
  error.value = ''
  try {
    dashboard.value = await getDashboard()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function fetchTip() {
  try {
    tip.value = await getDailyTip()
  } catch (err) {
    console.error('Failed to load daily tip:', err.message)
  }
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchDashboard()
  fetchTip()
})
onActivated(fetchDashboard)

watch(() => route.path, (path) => {
  if (path === '/dashboard') fetchDashboard()
})
</script>

<template>
  <main class="mobile-page">
    <header class="mobile-header">
      <div>
        <h2 style="margin: 0">Hello, {{ authStore.user?.name }}! 👋</h2>
        <p class="subtitle">Let's make today greener.</p>
      </div>
      <button
        @click="logout"
        style="background:#fde8e8; color:#c62828; border:none; padding:8px 14px; border-radius:12px; font-weight:700; cursor:pointer; font-size:13px;">
        Logout
      </button>
    </header>

    <p v-if="loading">Loading dashboard...</p>
    <p v-if="error" style="color: red">{{ error }}</p>

    <section v-if="tip" class="card green-card">
      <p style="margin: 0; font-weight: 700">🌿 Tip of the Day</p>
      <h3 style="margin: 6px 0">{{ tip.title }}</h3>
      <p style="margin: 0">{{ tip.body }}</p>
    </section>

    <template v-if="dashboard">
      <section class="card green-card">
        <p>Today's Carbon Footprint</p>
        <div class="stat-value">{{ dashboard.today_kg_co2 }} kg CO2</div>
        <p class="success-text">Yesterday: {{ dashboard.yesterday_kg_co2 }} kg CO2</p>
      </section>

      <section class="card">
        <h3>Weekly Summary</h3>
        <div class="chart-bars">
          <div
            v-for="item in dashboard.week || []"
            :key="item.date || item.day"
            class="bar"
            :style="{ height: Math.max(20, item.kg_co2 * 8) + 'px' }"
          ></div>
        </div>
      </section>

      <section class="card">
        <h3>Your Progress</h3>
        <p>🔥 {{ dashboard.streak_days }}-day streak</p>
        <p>🌱Joined {{ dashboard.joined_challenges }} challenges</p>
      </section>

      <section class="card">
        <h3>Category Breakdown</h3>
        <p v-for="item in dashboard.by_category">{{ item.category }}:{{ item.kg_co2 }}kg CO2</p>
      </section>
    </template>

    <nav class="bottom-nav">
      <RouterLink to="/dashboard">Home</RouterLink>
      <RouterLink to="/log">Log</RouterLink>
      <RouterLink to="/challenges">Challenges</RouterLink>
      <RouterLink to="/badges">Badges</RouterLink>
    </nav>
  </main>
</template>