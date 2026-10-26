<template>
  <main class="admin-page">
    <div class="admin-layout">
      <AdminSidebar />
      <section class="admin-main">
        <div class="admin-top">
          <div>
            <h1 style="margin: 0">Settings</h1>
            <p class="subtitle">Platform-wide configuration.</p>
          </div>
        </div>

        <p v-if="feedbackMsg" :style="{ padding: '12px', borderRadius: '10px', marginTop: '16px', fontWeight: 'bold', backgroundColor: isError ? '#fde8e8' : '#eafaf1', color: isError ? '#c62828' : '#2f8f46' }">
          {{ feedbackMsg }}
        </p>

        <p v-if="loading">Loading settings...</p>

        <template v-else>
          <section class="admin-panel" style="margin-top: 18px">
            <h2 style="margin-top: 0">Branding</h2>
            <label class="label">Site Name</label>
            <input v-model="form.site_name" type="text" class="input" />
          </section>

          <section class="admin-panel" style="margin-top: 18px">
            <h2 style="margin-top: 0">Maintenance Mode</h2>
            <p class="subtitle">When enabled, only admins can log in. Everyone else sees a maintenance message.</p>
            <label style="display: flex; align-items: center; gap: 10px; font-weight: 700; margin-top: 10px">
              <input type="checkbox" v-model="form.maintenance_mode" style="width: 18px; height: 18px" />
              Enable maintenance mode
            </label>
          </section>

          <section class="admin-panel" style="margin-top: 18px">
            <h2 style="margin-top: 0">Password Policy</h2>
            <label class="label">Minimum Length</label>
            <input v-model.number="form.password_min_length" type="number" min="4" class="input" />

            <label style="display: flex; align-items: center; gap: 10px; font-weight: 700; margin-top: 10px">
              <input type="checkbox" v-model="form.password_require_upper" style="width: 18px; height: 18px" />
              Require at least one uppercase letter
            </label>
            <label style="display: flex; align-items: center; gap: 10px; font-weight: 700; margin-top: 10px">
              <input type="checkbox" v-model="form.password_require_number" style="width: 18px; height: 18px" />
              Require at least one number
            </label>
          </section>

          <button @click="handleSave" :disabled="saving" class="btn" style="width: auto; padding: 14px 32px; margin-top: 18px">
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </template>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminSettings, updateAdminSettings } from '@/services/api'
import AdminSidebar from '@/components/AdminSidebar.vue'

const loading = ref(true)
const saving = ref(false)
const feedbackMsg = ref('')
const isError = ref(false)

const form = ref({
  site_name: 'GreenStep',
  maintenance_mode: false,
  password_min_length: 8,
  password_require_upper: true,
  password_require_number: true,
})

async function fetchSettings() {
  loading.value = true
  try {
    const data = await getAdminSettings()
    form.value = {
      site_name: data.site_name ?? 'GreenStep',
      maintenance_mode: data.maintenance_mode === '1',
      password_min_length: parseInt(data.password_min_length ?? 8),
      password_require_upper: data.password_require_upper === '1',
      password_require_number: data.password_require_number === '1',
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  feedbackMsg.value = ''
  isError.value = false
  try {
    await updateAdminSettings(form.value)
    feedbackMsg.value = 'Settings saved.'
  } catch (err) {
    isError.value = true
    feedbackMsg.value = err.message
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>