import axios from 'axios'
import { API_BASE, AUTH_BASE } from '../config/env';
import { getCachedDeviceFingerprint } from '../services/deviceFingerprint';
// const API_BASE = import.meta.env.VITE_API_BASE;
// const AUTH_BASE = import.meta.env.VITE_AUTH_BASE;

function getToken() {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
}
let isAuthFailureDispatched = false

function setToken(token: string) {
  isAuthFailureDispatched = false
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
    if (config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
  }

  // Add device ID header
  const deviceId = getCachedDeviceFingerprint()
  if (deviceId) {
    if (config.headers) {
      config.headers.set('x-device-id', deviceId)
    }
  }

  return config
})

const refreshApi = axios.create({
  baseURL: API_BASE,
});

let refreshPromise: Promise<string> | null = null
async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    console.log('refreshing token');
    const deviceId = getCachedDeviceFingerprint()
    refreshPromise = refreshApi.post(
      `${AUTH_BASE}/refresh-token`,
      {},
      {
        headers: {
          Authorization: `Bearer ${getRefreshToken()}`,
          ...(deviceId ? { 'x-device-id': deviceId } : {}),
        },
      },
    )

      .then((res) => {
        const token = res.data?.access_token || res.data?.accessToken || res.data?.token || ''
        if (!token) {
          throw new Error('No access token in refresh response');
        }
        setToken(token)
        const newRefresh = res.data?.refresh_token || res.data?.refreshToken
        if (newRefresh) {
          setRefreshToken(newRefresh)
        }
        return token
      })

      .catch(err => {
        throw err;
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

    // 🛑 1. Prevent infinite loop: If logout itself fails (401), DO NOT trigger auth-failure again
    const isLogoutCall = String(original?.url || '').includes('/logout')
    if (isLogoutCall) return Promise.reject(err)

    // global UX hooks
    if (typeof status === 'number' && status >= 500) {
      // Server error (5xx)
      window.dispatchEvent(new CustomEvent('app:server-error'))
    } else if (!status && (code === 'ECONNREFUSED' || code === 'ERR_CONNECTION_REFUSED')) {
      // Server stopped/unreachable
      window.dispatchEvent(new CustomEvent('app:server-unavailable'))
    } else if ((code === 'ERR_NETWORK' && !status) || !navigator.onLine) {
      // True network/offline issue
      window.dispatchEvent(new CustomEvent('app:network-error'))
    }

    // 🔹 DEVICE restriction
    const errorMessage = err?.response?.data?.message || '';
    if (status === 403 && errorMessage.toLowerCase().includes('device')) {
      window.dispatchEvent(new CustomEvent('app:device-not-approved', { detail: { message: errorMessage } }))
      return Promise.reject(err)
    }

    const isAuthFailure = [401, 403, 419, 498].includes(status as number)
    const isRefreshCall = String(original.url || '').includes('/refresh-token')

    // 🛑 2. If we already know the session is dead, stop everything
    if (isAuthFailure && isAuthFailureDispatched) {
      return Promise.reject(err)
    }

    // 🛑 3. Refresh token failure -> hard logout
    if (isAuthFailure && isRefreshCall) {
      clearToken()
      clearRefreshToken()
      if (!isAuthFailureDispatched) {
        isAuthFailureDispatched = true
        window.dispatchEvent(new CustomEvent('app:auth-failure'))
      }
      return Promise.reject(err)
    }

    // � 4. For normal requests, try a single refresh+retry
    if (isAuthFailure && !original._retry) {
      original._retry = true

      // 🏎️ Optimistic Concurrency Check
      const currentToken = getToken()
      const sentToken = original.headers?.Authorization?.replace('Bearer ', '')
      if (currentToken && sentToken && currentToken !== sentToken) {
        original.headers = original.headers || {}
        if (typeof original.headers.set === 'function') {
          original.headers.set('Authorization', `Bearer ${currentToken}`)
        } else {
          original.headers['Authorization'] = `Bearer ${currentToken}`
        }
        return api(original)
      }

      try {
        const newToken = await refreshAccessToken()
        original.headers = original.headers || {}
        if (typeof original.headers.set === 'function') {
          original.headers.set('Authorization', `Bearer ${newToken}`)
        } else {
          original.headers['Authorization'] = `Bearer ${newToken}`
        }
        return api(original)
      } catch (e) {
        clearToken()
        clearRefreshToken()
        if (!isAuthFailureDispatched) {
          isAuthFailureDispatched = true
          window.dispatchEvent(new CustomEvent('app:auth-failure'))
        }
        return Promise.reject(e)
      }
    }

    return Promise.reject(err)
  },
)


