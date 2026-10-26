<script setup>
import { computed, onMounted, ref } from 'vue'
import { getBadges } from '../services/api'

const badges = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    badges.value = await getBadges()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
const earnedCount = computed(() => {
  return badges.value.filter((badge) => badge.earned).length
})

const lockedCount = computed(() => {
  return badges.value.filter((badge) => !badge.earned).length
})
</script>

<template>
  <main class="mobile-page">
    <header class="mobile-header">
      <div>
        <h2 style="margin: 0">Badges</h2>
        <p class="subtitle">Track your eco achievements.</p>
      </div>

      <div style="font-size: 28px">🏅</div>
    </header>

    <p v-if="loading">Loading badges...</p>
    <p v-if="error" style="color: red">{{ error }}</p>
    <template v-if="!loading">
      <section class="card green-card">
        <h3>Your Progress</h3>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: badges.length ? (earnedCount / (earnedCount + lockedCount)) * 100 + '%' : '0%',
            }"
          ></div>
        </div>
        <div class="stat-value">{{ earnedCount }}</div>
        <p class="success-text">badges earned</p>
        <p>🔒 {{ lockedCount }} badges still locked</p>
      </section>

      <section class="card">
        <h3>Achievement Collection</h3>

        <div
          v-for="badge in badges"
          :key="badge.id"
          class="option-card"
          style="margin-bottom: 12px"
          :style="{ opacity: badge.earned ? 1 : 0.5 }"
        >
          <div style="display: flex; justify-content: space-between; align-items: center">
            <div>
              <h4 style="margin-bottom: 8px">
                {{ badge.earned ? '🏅' : '🔒' }}
                {{ badge.name }}
              </h4>
              <p class="subtitle">{{ badge.description }}</p>
              <p v-if="badge.earned" class="success-text">
                Earned on {{ badge.awarded_on || 'Unknown date' }}
              </p>
              <p v-else style="color: #999">Not earned yet</p>
            </div>
          </div>
        </div>
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
