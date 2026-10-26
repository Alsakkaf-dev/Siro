<template>
  <main class="admin-page">
    <div class="admin-layout">
      <AdminSidebar />

      <section class="admin-main">
        <div class="admin-top">
          <div>
            <h1 style="margin: 0">Challenges</h1>
            <p class="subtitle">Create and manage community sustainability challenges.</p>
          </div>
        </div>

        <p v-if="feedbackMsg" :style="{ padding: '12px', borderRadius: '10px', marginTop: '16px', fontWeight: 'bold', backgroundColor: isError ? '#fde8e8' : '#eafaf1', color: isError ? '#c62828' : '#2f8f46' }">
          {{ feedbackMsg }}
        </p>

        <div class="admin-content-grid" style="margin-top: 18px">
          <section class="admin-panel">
            <h2 style="margin-top: 0">Create New Challenge</h2>
            <form @submit.prevent="handleCreateChallenge">
              <label class="label">Name</label>
              <input v-model="form.name" type="text" placeholder="e.g., Eco-Commuter Sprint" required class="input" />

              <label class="label">Description</label>
              <textarea v-model="form.description" rows="3" required class="input" style="font-family: inherit; resize: vertical; min-height: 70px"></textarea>

              <div style="display: flex; gap: 12px">
                <div style="flex: 1">
                  <label class="label">Start Date</label>
                  <input v-model="form.start_date" type="date" required class="input" />
                </div>
                <div style="flex: 1">
                  <label class="label">End Date</label>
                  <input v-model="form.end_date" type="date" required class="input" />
                </div>
              </div>

              <label class="label">Target CO₂ Reduction (kg)</label>
              <input v-model.number="form.target_co2_reduction" type="number" step="0.01" min="0" required class="input" />

              <button type="submit" :disabled="submitting" class="btn" style="width: auto; padding: 12px 28px; margin-top: 8px">
                {{ submitting ? 'Creating...' : 'Create Challenge' }}
              </button>
            </form>
          </section>

          <section class="admin-panel">
            <h2 style="margin-top: 0">Overview</h2>
            <p class="subtitle">Total Challenges</p>
            <div style="font-size: 28px; font-weight: 800">{{ challenges.length }}</div>
          </section>
        </div>

        <section class="admin-panel" style="margin-top: 18px">
          <h2 style="margin-top: 0">All Challenges</h2>

          <p v-if="loading">Loading challenges...</p>

          <table v-else class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Target CO₂</th>
                <th>Dates</th>
                <th>Members</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in challenges" :key="c.id">
                <td>
                  <strong>{{ c.name }}</strong>
                  <div style="font-size: 12px; color: #6d7a6b; margin-top: 4px">{{ c.description }}</div>
                </td>
                <td class="success-text">{{ c.target_co2_reduction }} kg</td>
                <td>{{ c.start_date }} → {{ c.end_date }}</td>
                <td>{{ c.member_count }}</td>
                <td style="text-align: right">
                  <button
                    @click="handleDeleteChallenge(c.id)"
                    :disabled="deletingId === c.id"
                    style="background: transparent; border: none; color: #c62828; font-weight: bold; cursor: pointer; font-size: 13px"
                  >
                    {{ deletingId === c.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </td>
              </tr>
              <tr v-if="challenges.length === 0">
                <td colspan="5" style="text-align: center; color: #6d7a6b; padding: 24px">
                  No challenges yet. Create one above.
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
import { getChallenges, createChallenge, deleteChallenge } from '@/services/api'
import AdminSidebar from '@/components/AdminSidebar.vue'

const challenges = ref([])
const loading = ref(true)
const submitting = ref(false)
const deletingId = ref(null)
const feedbackMsg = ref('')
const isError = ref(false)

const form = ref({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  target_co2_reduction: 0,
})

async function fetchChallenges() {
  loading.value = true
  try {
    challenges.value = await getChallenges()
  } catch (err) {
    console.error('Failed to load challenges:', err)
  } finally {
    loading.value = false
  }
}

async function handleCreateChallenge() {
  submitting.value = true
  feedbackMsg.value = ''
  isError.value = false
  try {
    await createChallenge({
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      target_co2_reduction: form.value.target_co2_reduction,
    })
    feedbackMsg.value = 'Challenge created successfully.'
    form.value = { name: '', description: '', start_date: '', end_date: '', target_co2_reduction: 0 }
    await fetchChallenges()
  } catch (err) {
    isError.value = true
    feedbackMsg.value = err.message
  } finally {
    submitting.value = false
  }
}

async function handleDeleteChallenge(id) {
  if (!confirm('Delete this challenge? This cannot be undone.')) return
  deletingId.value = id
  feedbackMsg.value = ''
  isError.value = false
  try {
    await deleteChallenge(id)
    feedbackMsg.value = 'Challenge deleted.'
    await fetchChallenges()
  } catch (err) {
    isError.value = true
    feedbackMsg.value = err.message
  } finally {
    deletingId.value = null
  }
}

onMounted(fetchChallenges)
</script>