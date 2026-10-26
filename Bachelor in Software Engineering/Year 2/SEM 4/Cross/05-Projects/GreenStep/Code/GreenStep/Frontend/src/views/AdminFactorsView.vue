<script setup>
import { ref, onMounted } from 'vue'
import { getFactors, updateFactor } from '@/services/api'
import AdminSidebar from '@/components/AdminSidebar.vue'

const factors = ref([])
const loading = ref(true)
const error = ref('')
const savingId = ref(null)
const editValues = ref({})

async function fetchFactors() {
  loading.value = true
  error.value = ''
  try {
    factors.value = await getFactors()
    // seed the editable input values from the fetched data
    editValues.value = Object.fromEntries(
      factors.value.map((f) => [f.id, f.kg_co2_per_unit])
    )
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function saveFactor(id) {
  savingId.value = id
  error.value = ''
  try {
    // Wrap your raw input text into a typed JSON body object
    const payload = {
      kg_co2_per_unit: parseFloat(editValues.value[id])
    }
    
    await updateFactor(id, payload)
    await fetchFactors() // Refresh the numbers
  } catch (err) {
    error.value = err.message
  } finally {
    savingId.value = null
  }
}

onMounted(fetchFactors)
</script>

<template>
  <main class="admin-page">
    <div class="admin-layout">
      <AdminSidebar />
      <section class="admin-main">
        <div class="admin-top">
          <div>
            <h1 style="margin: 0">Emission Factors</h1>
            <p class="subtitle">Update CO₂ factors used across activity logging.</p>
          </div>
        </div>

        <p v-if="loading">Loading factors...</p>
        <p v-if="error" style="color: red">{{ error }}</p>

        <section v-if="!loading" class="admin-panel" style="margin-top: 18px">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Name</th>
                <th>Unit</th>
                <th>kg CO₂ per unit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in factors" :key="f.id">
                <td>{{ f.category }}</td>
                <td>{{ f.name }}</td>
                <td>{{ f.unit }}</td>
                <td>
                  <input
                    class="input"
                    style="margin: 0; padding: 8px 10px; width: 120px"
                    type="number"
                    step="0.0001"
                    v-model="editValues[f.id]"
                  />
                </td>
                <td>
                  <button
                    class="btn"
                    style="width: auto; padding: 8px 16px"
                    :disabled="savingId === f.id"
                    @click="saveFactor(f.id)"
                  >
                    {{ savingId === f.id ? 'Saving...' : 'Save' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>
    </div>
  </main>
</template>