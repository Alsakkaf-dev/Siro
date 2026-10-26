<template>
  <main class="admin-page">
    <div class="admin-layout">
      <AdminSidebar />

      <section class="admin-main">
        <div class="admin-top">
          <div>
            <h1 style="margin: 0; color: #1f7a36;">Dashboard Overview</h1>
            <p class="subtitle">Monitor live GreenStep platform logs and activity metrics.</p>
          </div>
          <input v-model="searchQuery" class="admin-search" placeholder="Search activity logs..." />
        </div>

        <div v-if="loading" style="padding: 40px; text-align: center; color: #6d7a6b;">
          Loading real-time platform analytics...
        </div>

        <template v-else>
          <div class="admin-grid">
            <div class="admin-card">
              <p class="subtitle" style="margin:0;">Total Users</p>
              <h2>{{ stats?.total_users ?? 0 }}</h2>
            </div>

            <div class="admin-card">
              <p class="subtitle" style="margin:0;">Total Logs</p>
              <h2>{{ stats?.total_logs ?? 0 }}</h2>
            </div>

            <div class="admin-card">
              <p class="subtitle" style="margin:0;">Active Challenges</p>
              <h2>{{ stats?.active_challenges ?? 0 }}</h2>
            </div>

            <div class="admin-card">
              <p class="subtitle" style="margin:0;">System Badges</p>
              <h2>{{ stats?.total_badges ?? 0 }}</h2>
            </div>
          </div>

          <div class="admin-content-grid">
            <section class="admin-panel">
              <h2 style="margin-top: 0; color: #1f7a36;">Carbon Impact Analytics</h2>
              <div class="chart-bars" style="height: 180px;">
                <div
                  v-for="(heightValue, index) in chartHeights"
                  :key="index"
                  class="bar"
                  :style="{ height: heightValue + 'px' }"
                ></div>
              </div>
            </section>

            <section class="admin-panel">
              <h2 style="margin-top: 0; color: #1f7a36;">System Status</h2>
              <p style="margin: 10px 0;">👤 Root Admin Session: <span class="success-text">Active</span></p>
              <p style="margin: 10px 0;">🏆 Badge Engines: <span class="success-text">Online</span></p>
              <p style="margin: 10px 0;">⚙️ Emission Tables: <span class="success-text">Verified</span></p>
            </section>
          </div>

          <section class="admin-panel" style="margin-top: 18px">
            <h2 style="margin-top: 0; color: #1f7a36;">Real-time Activity Log Buffer</h2>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Activity Type</th>
                  <th>Recorded Volume</th>
                  <th>Calculated Carbon Offset</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(log, idx) in filteredLogs" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td><strong>{{ log.activity_name || 'Generic Event' }}</strong></td>
                  <td>{{ log.amount }} {{ log.unit }}</td>
                  <td class="success-text">{{ log.co2_saved }} kg CO₂</td>
                </tr>
                <tr v-if="filteredLogs.length === 0">
                  <td colspan="4" style="text-align: center; color: #6d7a6b; padding: 20px;">
                    No log parameters match your search criteria.
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </template>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, onActivated, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getAdminStats } from '@/services/api'
import AdminSidebar from '@/components/AdminSidebar.vue'

const route = useRoute()
const stats = ref(null)
const loading = ref(true)
const searchQuery = ref('')

async function fetchStats() {
  loading.value = true
  try {
    stats.value = await getAdminStats()
  } catch (err) {
    console.error('Failed to load admin stats:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
onActivated(fetchStats)
watch(() => route.path, (path) => {
  if (path === '/admin') fetchStats()
})

const chartHeights = computed(() => {
  if (!stats.value?.recent_logs?.length) return [40, 40, 40, 40, 40, 40, 40]
  return stats.value.recent_logs
    .slice(0, 7)
    .map((log) => Math.min(40 + log.co2_saved * 6, 170))
})

const filteredLogs = computed(() => {
  if (!stats.value?.recent_logs) return []
  return stats.value.recent_logs.filter((log) =>
    (log.activity_name || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
</script>