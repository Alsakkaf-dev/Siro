// src/api/employeeApi.js
// Single, reusable Axios instance + interceptors + CRUD helpers.
// Components import THESE functions — never axios directly.
import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

// Request interceptor — log the method + URL of every outgoing request.
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — map any server/network error to one readable message.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message
    if (error.response) {
      // server responded with a non-2xx status
      if (error.response.status === 400 && error.response.data?.errors) {
        // field-level validation errors — let the form display them
        error.fieldErrors = error.response.data.errors
        message = 'Please fix the highlighted fields.'
      } else {
        message = error.response.data?.error || `Request failed (${error.response.status}).`
      }
    } else if (error.request) {
      message = 'No response from server. Is the API running on :3001?'
    } else {
      message = error.message
    }
    error.userMessage = message
    console.error(`[API ERROR] ${message}`)
    return Promise.reject(error)
  }
)

// CRUD helpers (all async via the returned promise)
export const getEmployees = (params = {}) => apiClient.get('/employees', { params })
export const getEmployee = (id) => apiClient.get(`/employees/${id}`)
export const createEmployee = (e) => apiClient.post('/employees', e)
export const updateEmployee = (id, e) => apiClient.put(`/employees/${id}`, e)
export const deleteEmployee = (id) => apiClient.delete(`/employees/${id}`)

export default apiClient
