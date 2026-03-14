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
      deviceId: 'device123',
    }))

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
      loginThunk.fulfilled(payload, '', {
        useremail: 'a@test.com',
        userpassword: '123',
        deviceId: 'device123',
      })
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
        {
          useremail: 'a@test.com',
          userpassword: '123',
          deviceId: 'device123',
        },
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
      deviceId: 'device123',
      remember: true,
    })(dispatch, getState, undefined)

    expect(localStorage.getItem('accessToken')).toBe('access123')
    expect(localStorage.getItem('authUser')).toContain('Administrator')
  })

  it('loginThunk should support accessToken fallback and use sessionStorage when remember is false', async () => {
    const mockUser = { id: 1, email: 'test@example.com' }
    const mockResp = { user: mockUser, accessToken: 'token-abc' }
    ;(apiLogin as jest.Mock).mockResolvedValue(mockResp)

    const dispatch = jest.fn()
    const getState = jest.fn()
    const action = loginThunk({ useremail: 'a', userpassword: 'b', deviceId: 'd', remember: false })
    
    await action(dispatch, getState, undefined)

    expect(sessionStorage.getItem('accessToken')).toBe('token-abc')
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('loginThunk should handle generic token key fallback', async () => {
    const mockUser = { id: 1, email: 'test@example.com' }
    const mockResp = { user: mockUser, token: 'just-token' }
    ;(apiLogin as jest.Mock).mockResolvedValue(mockResp)

    const dispatch = jest.fn()
    const getState = jest.fn()
    const action = loginThunk({ useremail: 'a', userpassword: 'b', deviceId: 'd', remember: true })
    
    await action(dispatch, getState, undefined)
    expect(localStorage.getItem('accessToken')).toBe('just-token')
  })

  it('loginThunk should use "User" fallback if email split fails', async () => {
    const mockUser = { id: 1, email: '' } // empty email
    const mockResp = { user: mockUser, token: 't' }
    ;(apiLogin as jest.Mock).mockResolvedValue(mockResp)

    const dispatch = jest.fn()
    const getState = jest.fn()
    const action = loginThunk({ useremail: 'a', userpassword: 'b', deviceId: 'd', remember: true })
    
    const result = await action(dispatch, getState, undefined)
    // @ts-expect-error - payload type is complex
    expect(result.payload.user.name).toBe('User')
  })

  it('loginThunk should handle error field in rejection', async () => {
    const errorResp = { response: { data: { error: 'Direct Error Message' } } }
    ;(apiLogin as jest.Mock).mockRejectedValue(errorResp)

    const dispatch = jest.fn()
    const getState = jest.fn()
    const action = loginThunk({ useremail: 'a', userpassword: 'b', deviceId: 'd' })
    
    const result = await action(dispatch, getState, undefined)
    expect(result.payload).toBe('Direct Error Message')
  })

  it('loginThunk should handle generic error fallback', async () => {
    ;(apiLogin as jest.Mock).mockRejectedValue(new Error('Network Fail'))

    const dispatch = jest.fn()
    const getState = jest.fn()
    const action = loginThunk({ useremail: 'a', userpassword: 'b', deviceId: 'd' })
    
    const result = await action(dispatch, getState, undefined)
    expect(result.payload).toBe('Failed to sign in')
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

  it('logoutThunk should clear local storage even if server logout fails', async () => {
    mockLogout.mockRejectedValue(new Error('Server Error'))
    localStorage.setItem('accessToken', 'token123')
    
    const dispatch = jest.fn()
    const getState = jest.fn()
    
    await logoutThunk()(dispatch, getState, undefined)
    
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('logoutThunk should handle unexpected errors during cleanup', async () => {
    const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage Error')
    })
    
    const dispatch = jest.fn()
    const getState = jest.fn()
    
    const result = await logoutThunk()(dispatch, getState, undefined)
    expect(result.payload).toBe('Storage Error')
    
    removeItemSpy.mockRestore()
  })

  it('should initialize from sessionStorage if localStorage is empty', () => {
    const user = { name: 'SessionUser', role: 'User' }
    sessionStorage.setItem('authUser', JSON.stringify(user))
    sessionStorage.setItem('accessToken', 'sess-token')

    // We need to re-require or trigger the logic. Since 'initialState' is static,
    // we might need to mock readInitialUser or just check if the logic works.
    // In this test file, the reducer is imported at top level.
    // Let's use a fresh require to trigger the initialization logic.
    jest.isolateModules(() => {
        // @ts-expect-error - require() is used for module isolation
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const freshReducer = require('../../../store/slices/authSlice').default
        const state = freshReducer(undefined, { type: 'INIT' })
        expect(state.user).toEqual(user)
        expect(state.token).toBe('sess-token')
    })
    
    sessionStorage.clear()
  })
})
