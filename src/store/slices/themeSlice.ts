import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '..'

export type ThemeMode = 'light' | 'dark'

function detectInitialTheme(): ThemeMode {
  const stored = (localStorage.getItem('theme') as ThemeMode | null) ?? null
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

type ThemeState = {
  mode: ThemeMode
}

const initialState: ThemeState = {
  mode: detectInitialTheme(),
}

const slice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload
    },
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
    },
  },
})

export const { setTheme, toggleTheme } = slice.actions
export const selectTheme = (s: RootState) => s.theme.mode
export default slice.reducer


