<script setup>
import { onMounted, ref } from 'vue'
import { getChallenges, joinChallenge } from '@/services/api'
const challenges = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  await loadChallenges()
})

async function loadChallenges() {
  loading.value = true
  try {
    challenges.value = await getChallenges()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleJoin(id) {
  error.value = ''
  try {
    await joinChallenge(id)
    await loadChallenges()
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <main class="mobile-page">
    <header class="mobile-header">
      <div>
        <h2 style="margin: 0">Challenges</h2>
        <p class="subtitle">Join community sustainability goals.</p>
      </div>
    </header>

    <p v-if="loading">Loading challenges...</p>
    <p v-if="error" style="color: red">{{ error }}</p>

    <section v-for="challenge in challenges" :key="challenge.id" class="card">
      <h3>{{ challenge.name }}</h3>
      <p>{{ challenge.description }}</p>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (challenge.progress_pct || 0) + '%' }"></div>
      </div>

      <p class="success-text">{{ challenge.progress_pct || 0 }}% completed</p>
      <p>{{ challenge.member_count || 0 }} participants</p>
      <p>{{ challenge.days_left || 0 }} days left</p>
      <p>{{ challenge.collective_saved_kg || 0 }}kg CO2 saved by group</p>

      <button
        class="btn"
        :class="{ 'secondary-btn': challenge.is_joined }"
        :disabled="challenge.is_joined"
        @click="handleJoin(challenge.id)"
      >
        {{ challenge.is_joined ? 'Joined √' : 'Join Challenge' }}
      </button>
    </section>

    <nav class="bottom-nav">
      <RouterLink to="/dashboard">Home</RouterLink>
      <RouterLink to="/log">Log</RouterLink>
      <RouterLink to="/challenges">Challenges</RouterLink>
      <RouterLink to="/badges">Badges</RouterLink>
    </nav>
  </main>
</template>