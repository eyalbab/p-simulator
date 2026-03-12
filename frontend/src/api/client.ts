import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_MANAGEMENT_SERVER_URL ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
