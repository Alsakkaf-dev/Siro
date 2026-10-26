<template>
  <main class="admin-page">
    <div class="admin-layout">
      <AdminSidebar />
      <section class="admin-main">
        <div class="admin-top">
          <div>
            <h1 style="margin: 0; color: #1f7a36;">Eco Tips Management</h1>
            <p class="subtitle">Create and distribute advice items to user logs.</p>
          </div>
        </div>

        <div class="admin-content-grid" style="grid-template-columns: 1fr; margin-top: 18px;">
          <section class="admin-panel">
            <h2 style="margin-top: 0; color: #1f7a36; margin-bottom: 20px;">Publish New Advice Tip</h2>
            
            <p v-if="feedbackMsg" :style="{ padding: '12px', borderRadius: '10px', fontWeight: 'bold', backgroundColor: isError ? '#fde8e8' : '#eafaf1', color: isError ? '#c62828' : '#2f8f46' }">
              {{ feedbackMsg }}
            </p>

            <form @submit.prevent="handlePublishTip">
              <div style="margin-bottom: 16px;">
                <label class="label">Tip Headline Title</label>
                <input v-model="form.title" type="text" placeholder="e.g., Wash Clothes in Cold Water" required class="input" style="margin-bottom: 0;" />
              </div>

              <div style="margin-bottom: 16px;">
                <label class="label">Database Verified Target Category</label>
                <select v-model="form.category" required class="input" style="margin-bottom: 0; height: 48px;">
                  <option value="" disabled>-- Select Category Scope --</option>
                  <option value="transport">Transport</option>
                  <option value="energy">Energy</option>
                  <option value="food">Food</option>
                  <option value="recycling">Recycling</option>
                </select>
              </div>

              <div style="margin-bottom: 16px;">
                <label class="label">Detailed Core Explanation Text</label>
                <textarea v-model="form.body" rows="4" placeholder="Break down detailed eco actionable instructions here..." required class="input" style="margin-bottom: 0; resize: vertical; min-height: 100px; font-family: inherit;"></textarea>
              </div>

              <div style="margin-bottom: 24px;">
                <label class="label">External Source Reference URL (Optional)</label>
                <input v-model="form.source_url" type="url" placeholder="https://example.com/sustainability-metrics" class="input" style="margin-bottom: 0;" />
              </div>

              <button type="submit" :disabled="pending" class="btn" style="width: auto; padding: 14px 32px;">
                {{ pending ? 'Publishing Entry...' : 'Commit Tip to Live Library' }}
              </button>
            </form>
          </section>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { createTip } from '@/services/api'
import AdminSidebar from '@/components/AdminSidebar.vue'

const form = ref({ title: '', category: '', body: '', source_url: '' })
const pending = ref(false)
const feedbackMsg = ref('')
const isError = ref(false)

async function handlePublishTip() {
  pending.value = true
  feedbackMsg.value = ''
  isError.value = false
  
  try {
    const payload = {
      title: form.value.title.trim(),
      body: form.value.body.trim(),
      category: form.value.category,
      source_url: form.value.source_url.trim() || null
    }
    
    await createTip(payload)
    feedbackMsg.value = 'Success: Global eco guidance node created cleanly.'
    form.value = { title: '', category: '', body: '', source_url: '' }
  } catch (err) {
    isError.value = true
    feedbackMsg.value = `Execution Error: ${err.message}`
  } finally {
    pending.value = false
  }
}
</script>