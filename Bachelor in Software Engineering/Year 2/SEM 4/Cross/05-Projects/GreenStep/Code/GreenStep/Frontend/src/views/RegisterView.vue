<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Password do not match.'
    return
  }

  loading.value = true
  try {
    await authStore.registerUser(name.value, email.value, password.value)
    router.push('/login')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mobile-page">
    <section style="text-align: center; margin-top: 40px; margin-bottom: 24px">
      <h1 class="brand-title">🌱 GreenStep</h1>
      <p class="subtitle">Create your account</p>
    </section>

    <section class="card">
      <h2>Sign Up</h2>

      <label class="label">Full Name</label>
      <input v-model="name" class="input" type="text" placeholder="Your name" />

      <label class="label">Email</label>
      <input v-model="email" class="input" type="email" placeholder="you@example.com" />

      <label class="label">Password</label>
      <input v-model="password" class="input" type="password" placeholder="Create a password" />

      <label class="label">Confirm Password</label>
      <input
        v-model="confirmPassword"
        class="input"
        type="password"
        placeholder="Confirm password"
      />

      <p v-if="error" style="color: red">{{ error }}</p>

      <button class="btn" @click="handleRegister">
        {{ loading ? 'Creating account...' : 'Register' }}
      </button>

      <p style="text-align: center; margin-top: 18px">
        Already have an account?
        <RouterLink to="/login" class="success-text">Login</RouterLink>
      </p>
    </section>
  </main>
</template>
