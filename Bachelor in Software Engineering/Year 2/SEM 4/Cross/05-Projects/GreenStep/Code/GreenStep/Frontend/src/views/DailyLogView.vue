<script setup>
import { computed, onMounted, ref } from 'vue'
import { createLog, getActivityTypes } from '@/services/api'
import { useRouter } from 'vue-router' 

const router = useRouter()
const activityTypes = ref([])
const selectedTransport = ref('Public Transport')
const transportDistance = ref(10)
const selectedMeal = ref('Mixed Meal')
const mealAmount = ref(1)
const electricityAmount = ref(5)
const recyclingAmount = ref(3)

function todayLocalDate() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loggedOn = ref(todayLocalDate())

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')

const transportOptions = [
  { label: 'Walking', icon: '🚶' },
  { label: 'Cycling', icon: '🚲' },
  { label: 'Public Transport', icon: '🚌' },
  { label: 'Car', icon: '🚗' },
]

const mealOptions = [
  { label: 'Vegetarian Meal', icon: '🥦' },
  { label: 'Mixed Meal', icon: '🍱' },
  { label: 'Red Meat Meal', icon: '🥩' },
]

function findActivityType(keyword, categoryKeyword = '') {
  return activityTypes.value.find((activity) => {
    const name = String(activity.name || '').toLowerCase()
    const category = String(activity.category || '').toLowerCase()

    return (
      name.includes(keyword.toLowerCase()) &&
      (!categoryKeyword || category.includes(categoryKeyword.toLowerCase()))
    )
  })
}

const selectedTransportActivity = computed(() => {
  return findActivityType(selectedTransport.value, 'transport')
})

const selectedMealActivity = computed(() => {
  return findActivityType(selectedMeal.value, 'food')
})

const electricityActivity = computed(() => {
  return findActivityType('electricity')
})

const recyclingActivity = computed(() => {
  return findActivityType('recycling')
})

onMounted(async () => {
  try {
    activityTypes.value = await getActivityTypes()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function submitOneLog(activityType, amount, label) {
  if (!activityType) {
    console.warn(`Skipped "${label}": no matching activity type found.`)
    return
  }
  if (!amount || Number(amount) <= 0) {
    return
  }

  await createLog({
    activity_type_id: activityType.id,
    amount: Number(amount),
    logged_on: loggedOn.value,
  })
}

async function submitLog() {
  error.value = ''
  successMessage.value = ''
  saving.value = true

  try {
    await submitOneLog(selectedTransportActivity.value, transportDistance.value, 'transport')
    await submitOneLog(selectedMealActivity.value, mealAmount.value, 'meal')
    await submitOneLog(electricityActivity.value, electricityAmount.value, 'electricity')
    await submitOneLog(recyclingActivity.value, recyclingAmount.value, 'recycling')

    successMessage.value = 'Activity log saved successfully.'

    setTimeout(() => router.push('/dashboard'), 1000)
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="mobile-page">
    <header class="mobile-header">
      <div>
        <h2 style="margin: 0">Daily Activity Log</h2>
        <p class="subtitle">Record today's eco activities.</p>
      </div>
    </header>

    <p v-if="loading">Loading activity types...</p>
    <p v-if="error" style="color: red">{{ error }}</p>

    <section class="card">
      <h3>Transport</h3>
      <div class="option-grid">
        <div
          v-for="option in transportOptions"
          :key="option.label"
          class="activity-option"
          :class="{ active: selectedTransport === option.label }"
          @click="selectedTransport = option.label"
        >
          <div class="icon-bubble">{{ option.icon }}</div>
          <span>{{ option.label }}</span>
        </div>
      </div>

      <label class="label">Distance (km)</label>
      <input v-model="transportDistance" class="input" type="number" />
    </section>

    <section class="card">
      <h3>Meal Type</h3>

      <div class="option-grid">
        <div
          v-for="option in mealOptions"
          :key="option.label"
          class="activity-option"
          :class="{ active: selectedMeal === option.label }"
          @click="selectedMeal = option.label"
        >
          <div class="icon-bubble">{{ option.icon }}</div>
          <span>{{ option.label }}</span>
        </div>
      </div>
      <label class="label">Meal Amount</label>
      <input v-model="mealAmount" class="input" type="number" />
    </section>

    <section class="card">
      <h3>Electricity Usage</h3>
      <label class="label">Electricity Used (KWh)</label>
      <input v-model="electricityAmount" class="input" type="number" />
    </section>

    <section class="card">
      <h3>Recycling</h3>
      <label class="label">Recycled Items</label>
      <input v-model="recyclingAmount" class="input" type="number" />
    </section>

    <section class="card">
      <h3>Date</h3>
      <input v-model="loggedOn" class="input" type="date" />
    </section>

    <button class="btn" @click="submitLog">
      {{ saving ? 'Saving...' : 'Calculate & Save' }}
    </button>

    <section v-if="successMessage" class="card green-card" style="margin-top: 16px">
      <h3>{{ successMessage }}</h3>
      <p>Your activity records have been submitted to the backend.</p>
    </section>

    <nav class="bottom-nav">
      <RouterLink to="/dashboard">Home</RouterLink>
      <RouterLink to="/log">Log</RouterLink>
      <RouterLink to="/challenges">Challenges</RouterLink>
      <RouterLink to="/badges">Badges</RouterLink>
    </nav>
  </main>
</template>
