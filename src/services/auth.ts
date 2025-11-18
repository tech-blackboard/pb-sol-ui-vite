import { api } from '../lib/api';

export type LoginRequest = { useremail: string; userpassword: string }
export type LoginResponse = {
  message?: string
  token?: string
  accessToken?: string
  access_token?: string
  user: { id: string | number; email: string; roles?: string[] }
  isAdmin?: boolean
}


const AUTH_BASE = import.meta.env.VITE_AUTH_BASE;

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(`${AUTH_BASE}/login`, body, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  })

  return data
}

export async function logout(): Promise<void> {
  await api.post(`${AUTH_BASE}/logout`, null)
}

export async function refreshToken(): Promise<string> {
  const { data } = await api.post(
    `${(import.meta as any).env?.VITE_AUTH_BASE || import.meta.env.VITE_AUTH_BASE}/refresh-token`,
    {},
    { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
  )
  const token = data?.access_token || data?.accessToken || data?.token
  if (token) localStorage.setItem('accessToken', token)
  return token
}
