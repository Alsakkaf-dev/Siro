<template>
  <main class="admin-page">
    <div class="admin-layout">
      <AdminSidebar />
      <section class="admin-main">
        <div class="admin-top">
          <div>
            <h1 style="margin: 0">Badges</h1>
            <p class="subtitle">Create achievement badges awarded automatically when users meet criteria.</p>
          </div>
        </div>

        <p v-if="feedbackMsg" :style="{ padding: '12px', borderRadius: '10px', marginTop: '16px', fontWeight: 'bold', backgroundColor: isError ? '#fde8e8' : '#eafaf1', color: isError ? '#c62828' : '#2f8f46' }">
          {{ feedbackMsg }}
        </p>

        <div class="admin-content-grid" style="margin-top: 18px">
          <section class="admin-panel">
            <h2 style="margin-top: 0">Create New Badge</h2>
            <form @submit.prevent="handleCreateBadge">
              <label class="label">Badge Name</label>
              <input v-model="form.name" type="text" placeholder="e.g., Eco Warrior" required class="input" />

              <label class="label">Image URL (optional)</label>
              <input v-model="form.image_url" type="text" placeholder="/assets/badges/eco_warrior.png" class="input" />

              <label class="label">Criteria Type</label>
              <select v-model="form.criteria_type" required class="input" style="height: 48px">
                <option value="" disabled>-- Select --</option>
                <option value="total_logs">Total activity logs</option>
                <option value="streak_days">Consecutive-day streak</option>
                <option value="category_logs">Logs in a specific category</option>
              </select>

              <div v-if="form.criteria_type === 'category_logs'">
                <label class="label">Category</label>
                <select v-model="form.category" required class="input" style="height: 48px">
                  <option value="" disabled>-- Select --</option>
                  <option value="transport">Transport</option>
                  <option value="energy">Energy</option>
                  <option value="food">Food</option>
                  <option value="recycling">Recycling</option>
                </select>
              </div>

              <label class="label">Threshold</label>
              <input v-model.number="form.threshold" type="number" min="1" required class="input" />

              <button type="submit" :disabled="submitting" class="btn" style="width: auto; padding: 12px 28px; margin-top: 8px">
                {{ submitting ? 'Creating...' : 'Create Badge' }}
              </button>
            </form>
          </section>

          <section class="admin-panel">
            <h2 style="margin-top: 0">Overview</h2>
            <p class="subtitle">Total Badges</p>
            <div style="font-size: 28px; font-weight: 800">{{ badges.length }}</div>
          </section>
        </div>

        <section class="admin-panel" style="margin-top: 18px">
          <h2 style="margin-top: 0">All Badges</h2>
          <p v-if="loading">Loading badges...</p>

          <table v-else class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Criteria</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in badges" :key="b.badge_id">
                <td><strong>{{ b.name }}</strong></td>
                <td>{{ describeCriteria(b.criteria) }}</td>
                <td style="text-align: right">
                  <button
                    @click="handleDeleteBadge(b.badge_id)"
                    :disabled="deletingId === b.badge_id"
                    style="background: transparent; border: none; color: #c62828; font-weight: bold; cursor: pointer; font-size: 13px"
                  >
                    {{ deletingId === b.badge_id ? 'Deleting...' : 'Delete' }}
                  </button>
                </td>
              </tr>
              <tr v-if="badges.length === 0">
                <td colspan="3" style="text-align: center; color: #6d7a6b; padding: 24px">
                  No badges yet. Create one above.
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
import { getBadges, createBadge, deleteBadge } from '@/services/api'
import AdminSidebar from '@/components/AdminSidebar.vue'

const badges = ref([])
const loading = ref(true)
const submitting = ref(false)
const deletingId = ref(null)
const feedbackMsg = ref('')
const isError = ref(false)

const form = ref({
  name: '',
  image_url: '',
  criteria_type: '',
  category: '',
  threshold: 1,
})

function describeCriteria(criteria) {
  if (!criteria) return '—'
  if (criteria.type === 'total_logs') return `${criteria.threshold} total logs`
  if (criteria.type === 'streak_days') return `${criteria.threshold}-day streak`
  if (criteria.type === 'category_logs') return `${criteria.threshold} logs in ${criteria.category}`
  return '—'
}

async function fetchBadges() {
  loading.value = true
  try {
    badges.value = await getBadges()
  } catch (err) {
    console.error('Failed to load badges:', err)
  } finally {
    loading.value = false
  }
}

async function handleCreateBadge() {
  submitting.value = true
  feedbackMsg.value = ''
  isError.value = false
  try {
    await createBadge({
      name: form.value.name.trim(),
      image_url: form.value.image_url.trim(),
      criteria_type: form.value.criteria_type,
      category: form.value.category,
      threshold: form.value.threshold,
    })
    feedbackMsg.value = 'Badge created successfully.'
    form.value = { name: '', image_url: '', criteria_type: '', category: '', threshold: 1 }
    await fetchBadges()
  } catch (err) {
    isError.value = true
    feedbackMsg.value = err.message
  } finally {
    submitting.value = false
  }
}

async function handleDeleteBadge(id) {
  if (!confirm('Delete this badge? Users who earned it will lose it.')) return
  deletingId.value = id
  feedbackMsg.value = ''
  isError.value = false
  try {
    await deleteBadge(id)
    feedbackMsg.value = 'Badge deleted.'
    await fetchBadges()
  } catch (err) {
    isError.value = true
    feedbackMsg.value = err.message
  } finally {
    deletingId.value = null
  }
}

onMounted(fetchBadges)
</script>