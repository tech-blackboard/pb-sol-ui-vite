import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import themeReducer from './slices/themeSlice'
import abstractsReducer from './slices/abstracts/abstracts.slice'

export const store = configureStore({
	reducer: {
		auth: authReducer,
		theme: themeReducer,
		abstracts: abstractsReducer,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
