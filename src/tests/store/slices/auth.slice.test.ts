jest.mock('../../../services/auth', () => ({
    login: jest.fn(),
    logout: jest.fn(),
  }))
  import reducer, { loginThunk, logoutThunk } from '../../../store/slices/authSlice'
  import type { AuthState } from '../../../store/slices/authSlice'
  import { login as apiLogin, logout as apiLogout } from '../../../services/auth'
  
  const mockLogin = apiLogin as jest.Mock
  const mockLogout = apiLogout as jest.Mock
  
  describe('auth slice', () => {
    const initialState: AuthState = {
      user: null,
      token: null,
      loading: false,
      error: null,
    }
  
    beforeEach(() => {
      jest.clearAllMocks()
      localStorage.clear()
      sessionStorage.clear()
    })
  
    /* -------------------------------------------------- */
    /* INITIAL STATE                                      */
    /* -------------------------------------------------- */
  
    it('should return initial state', () => {
      const state = reducer(undefined, { type: 'INIT' })
      expect(state.loading).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })
  
    /* -------------------------------------------------- */
    /* LOGIN THUNK                                        */
    /* -------------------------------------------------- */
  
    it('loginThunk.pending → sets loading true', () => {
      const state = reducer(initialState, loginThunk.pending('', {
        useremail: 'a@test.com',
        userpassword: '123',
      } as any))
  
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })
  
    it('loginThunk.fulfilled → sets user and token', () => {
      const payload = {
        user: { name: 'john', role: 'Administrator', isAdmin: true },
        token: 'jwt-token',
      }
  
      const state = reducer(
        initialState,
        loginThunk.fulfilled(payload, '', {} as any)
      )
  
      expect(state.loading).toBe(false)
      expect(state.user).toEqual(payload.user)
      expect(state.token).toBe('jwt-token')
      expect(state.error).toBeNull()
    })
  
    it('loginThunk.rejected → sets error', () => {
      const state = reducer(
        initialState,
        loginThunk.rejected(
          new Error(),
          '',
          {} as any,
          'Invalid credentials'
        )
      )
  
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Invalid credentials')
    })
  
    /* -------------------------------------------------- */
    /* LOGIN THUNK SIDE EFFECT (storage)                   */
    /* -------------------------------------------------- */
  
    it('loginThunk stores token and user when remember=true', async () => {
      mockLogin.mockResolvedValue({
        user: {
          email: 'admin@test.com',
          roles: ['ADMIN'],
        },
        access_token: 'access123',
        refresh_token: 'refresh123',
      })
  
      const dispatch = jest.fn()
      const getState = jest.fn()
  
      await loginThunk({
        useremail: 'admin@test.com',
        userpassword: 'pass',
        remember: true,
      })(dispatch, getState, undefined)
  
      expect(localStorage.getItem('accessToken')).toBe('access123')
      expect(localStorage.getItem('authUser')).toContain('Administrator')
    })
  
    /* -------------------------------------------------- */
    /* LOGOUT THUNK                                       */
    /* -------------------------------------------------- */
  
    it('logoutThunk.fulfilled → clears auth state', () => {
      const loggedInState: AuthState = {
        user: { name: 'john', role: 'User' },
        token: 'abc',
        loading: false,
        error: null,
      }
  
      const state = reducer(
        loggedInState,
        logoutThunk.fulfilled({ success: true }, '')
      )
  
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.error).toBeNull()
    })
  
    it('logoutThunk clears storage', async () => {
      mockLogout.mockResolvedValue({})
  
      localStorage.setItem('accessToken', 'token')
      sessionStorage.setItem('authUser', 'user')
  
      const dispatch = jest.fn()
      const getState = jest.fn()
  
      await logoutThunk()(dispatch, getState, undefined)
  
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(sessionStorage.getItem('authUser')).toBeNull()
    })
  })
    