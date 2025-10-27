import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '..'
import { login as apiLogin, logout as apiLogout } from '../../services/auth'

export type AuthUser = { name: string; role: string; isAdmin?: boolean }

export type LoginPayload = {
	useremail: string
	userpassword: string
	remember?: boolean
}

export type AuthState = {
	user: AuthUser | null
	token: string | null
	loading: boolean
	error: string | null
}

function readInitialUser(): { user: AuthUser | null; token: string | null } {
	const userRaw = localStorage.getItem('authUser') ?? sessionStorage.getItem('authUser')
	const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken')
	return { user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null, token }
}

const initial: AuthState = {
	...readInitialUser(),
	loading: false,
	error: null,
}

export const loginThunk = createAsyncThunk(
	'auth/login',
	async ({ useremail, userpassword, remember }: LoginPayload, { rejectWithValue }) => {
		try {
			const resp = await apiLogin({ useremail, userpassword })
			const roles = resp.user.roles || []
			const hasAdminRole = roles.map((r) => r.toLowerCase()).includes('admin')
			const isAdmin = resp.isAdmin === true || hasAdminRole
			const token = (resp as any).access_token || (resp as any).accessToken || (resp as any).token || null
			const refreshToken = (resp as any).refresh_token || (resp as any).refreshToken || null
			const user: AuthUser = {
				name: resp.user.email.split('@')[0] || 'User',
				role: isAdmin ? 'Administrator' : 'User',
				isAdmin,
			}
			const storage = remember ? localStorage : sessionStorage
			if (token) storage.setItem('accessToken', String(token))
			if (refreshToken) storage.setItem('refreshToken', String(refreshToken))
			storage.setItem('authUser', JSON.stringify(user))
		    storage.setItem('userData', JSON.stringify(resp.user))
			return { user, token }
		} catch (e: any) {
			return rejectWithValue(e?.message || 'Failed to sign in')
		}
	},
)

export const logoutThunk = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
	try {
		await apiLogout()
		localStorage.removeItem('accessToken')
		localStorage.removeItem('refreshToken')
		localStorage.removeItem('authUser')
		sessionStorage.removeItem('accessToken')
		sessionStorage.removeItem('refreshToken')
		sessionStorage.removeItem('authUser')
		sessionStorage.removeItem('userData')
		localStorage.removeItem('userData')
		return { success: true }
	} catch (e: any) {
		return rejectWithValue(e?.message || 'Failed to logout')
	}
})

const slice = createSlice({
	name: 'auth',
	initialState: initial,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(loginThunk.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(loginThunk.fulfilled, (state, action: PayloadAction<{ user: AuthUser; token: string | null }>) => {
				state.loading = false
				state.user = action.payload.user
				state.token = action.payload.token
				state.error = null
			})
			.addCase(loginThunk.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to sign in'
			})
			.addCase(logoutThunk.fulfilled, (state) => {
				state.user = null
				state.token = null
				state.error = null
			})
	},
})

export const selectAuth = (s: RootState) => s.auth
export default slice.reducer
