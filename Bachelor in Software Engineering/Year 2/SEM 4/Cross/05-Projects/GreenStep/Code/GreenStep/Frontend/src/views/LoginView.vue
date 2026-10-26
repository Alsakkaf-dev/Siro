<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getPublicSettings } from '@/services/api'
import '../assets/main.css'

const router = useRouter()
const authoStore = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref('')
const siteName = ref('GreenStep')
const maintenanceMode = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await authoStore.loginUser(email.value, password.value)
    if (authoStore.user?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const settings = await getPublicSettings()
    siteName.value = settings.site_name
    maintenanceMode.value = settings.maintenance_mode
  } catch (err) {
    console.error('Failed to load site settings:', err)
  }
})
</script>

<template>
  <main class="mobile-page">
    <section style="text-align: center; margin-top: 70px; margin-bottom: 30px">
      <h1 class="brand-title">🌱 {{ siteName }}</h1>      <p class="subtitle">Track. Reduce. Inspire.</p>
    </section>

    <section class="card">
      <p v-if="maintenanceMode" style="background:#fff4e5; color:#b76e00; padding:12px; border-radius:12px; font-weight:700; text-align:center; margin-bottom:16px;">
        ⚠️ The site is under maintenance. Only administrators can log in right now.
      </p>
      <h2>Welcome Back</h2>
      <p class="subtitle">Log in to continue your eco journey.</p>

      <label class="label">Email</label>
      <input v-model="email" class="input" type="email" placeholder="you@example.com" />

      <label class="label">Password</label>
      <input v-model="password" class="input" type="password" placeholder="Enter your password" />

      <p v-if="error" style="color: red">{{ error }}</p>

      <button class="btn" @click="handleLogin">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>

      <p style="text-align: center; margin-top: 18px">
        New user?
        <RouterLink to="/register" class="success-text">Create account</RouterLink>
      </p>
    </section>

    <section class="card green-card">
      <h3>Small steps, measurable impact.</h3>
      <p>Record daily activities and understand your carbon footprint better.</p>
    </section>
  </main>
</template>
