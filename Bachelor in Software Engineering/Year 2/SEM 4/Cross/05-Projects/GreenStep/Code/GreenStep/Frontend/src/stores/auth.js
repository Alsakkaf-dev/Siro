import { defineStore } from 'pinia'
import { login, register } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),
  actions: {
    async loginUser(email, password) {
      const data = await login(email, password)
      const token = data.token || data.access_token
      this.token = token
      this.user = data.user || null
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(this.user))
      return data
    },
    async registerUser(name, email, password) {
      const data = await register(name, email, password)
      return data
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})
