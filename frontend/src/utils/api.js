import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send cookies (for cookie-based auth)
})

api.interceptors.request.use((config) => {
  // Keep supporting Authorization header for backward compatibility (localStorage)
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

