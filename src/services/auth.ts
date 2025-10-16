import axios from 'axios'

export type LoginRequest = { useremail: string; userpassword: string }
export type LoginResponse = {
  message?: string
  token?: string
  accessToken?: string
  access_token?: string
  user: { id: string | number; email: string; roles?: string[] }
  isAdmin?: boolean
}

const AUTH_BASE = (import.meta as any).env?.VITE_AUTH_BASE || '/auth'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(`${AUTH_BASE}/login`, body, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  })

  return data
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  await axios.post(
    `${AUTH_BASE}/logout`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      withCredentials: true,
    },
  )
}


