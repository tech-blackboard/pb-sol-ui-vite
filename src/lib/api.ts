import axios from 'axios'
import { API_BASE, AUTH_BASE } from '../config/env';
// const API_BASE = import.meta.env.VITE_API_BASE;
// const AUTH_BASE = import.meta.env.VITE_AUTH_BASE;

function getToken() {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
}
function setToken(token: string) {
  localStorage.setItem('accessToken', token)
}


function clearToken() {
  localStorage.removeItem('accessToken')
  sessionStorage.removeItem('accessToken')
  localStorage.removeItem('authUser')
  sessionStorage.removeItem('authUser')
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
}

function setRefreshToken(token: string) {
  localStorage.setItem('refreshToken', token)
  sessionStorage.setItem('refreshToken', token)
}

function clearRefreshToken() {
  localStorage.removeItem('refreshToken')
  sessionStorage.removeItem('refreshToken')
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getToken()
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

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${AUTH_BASE}/refresh-token`,
        undefined, // no body
        {
          withCredentials: true,
          headers: {
            ...(getRefreshToken() ? { Authorization: `Bearer ${getRefreshToken()}` } : {}),
          },
        },
      )
      .then((res) => {
        const token = res.data?.access_token || res.data?.accessToken || res.data?.token || ''
        if (!token) throw new Error('No access token in refresh response')
        setToken(token)
        setRefreshToken(res.data?.refresh_token || res.data?.refreshToken || '')
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status
    const original = err?.config || {}
    const code = err?.code

    // global UX hooks
    if (typeof status === 'number' && status >= 500) {
      // Server error (5xx)
      window.dispatchEvent(new CustomEvent('app:server-error'))
    } else if (!status && (code === 'ECONNREFUSED' || code === 'ERR_CONNECTION_REFUSED' || code === 'ERR_NETWORK')) {
      // Server stopped/unreachable
      window.dispatchEvent(new CustomEvent('app:server-unavailable'))
    } else if ((code === 'ERR_NETWORK' && !status) || !navigator.onLine) {
      // True network/offline issue
      window.dispatchEvent(new CustomEvent('app:network-error'))
    } 

    const isAuthFailure = [401, 403, 419, 498].includes(status as number)
    const isRefreshCall = String(original?.url || '').includes('/refresh-token')

    // If the refresh token itself failed/expired → hard logout
    if (isAuthFailure && isRefreshCall) {
      clearToken()
      clearRefreshToken()
      window.location.href = '/'
      return Promise.reject(err)
    }

    // For normal requests, try a single refresh+retry
    if (isAuthFailure && !original._retry) {
      original._retry = true
      try {
        const newToken = await refreshAccessToken()
        original.headers = original.headers || {}
        if (typeof (original.headers as any).set === 'function') {
          ;(original.headers as any).set('Authorization', `Bearer ${newToken}`)
        } else {
          ;(original.headers as any).Authorization = `Bearer ${newToken}`
        }
        return api(original)
      } catch (e) {
        clearToken()
        clearRefreshToken()
        window.location.href = '/'
        return Promise.reject(e)
      }
    }

    return Promise.reject(err)
  },
)


