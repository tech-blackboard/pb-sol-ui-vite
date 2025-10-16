import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  if (token) {
    if (config.headers && typeof (config.headers as any).set === 'function') {
      ;(config.headers as any).set('Authorization', `Bearer ${token}`)
    } else {
      const headers = (config.headers as Record<string, any>) || {}
      headers.Authorization = headers.Authorization ?? `Bearer ${token}`
      config.headers = headers as any
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('authUser')
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('authUser')
      window.location.href = '/'
    }
    return Promise.reject(err)
  },
)


