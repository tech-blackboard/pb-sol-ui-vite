import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import themeReducer from './slices/themeSlice'
import abstractsReducer from './slices/abstracts/abstracts.slice'
import registrationsReducer from './slices/registrations/registrations.slice'
import sponsorshipsReducer from './slices/sponsorships/sponsorships.slice'
import brochuresReducer from './slices/brochures/brochures.slice'
import accRegistrationsReducer from './slices/accRegistrations/accRegistrations.slice'
import contactsReducer from './slices/contacts/contacts.slice'
import crmReducer from './slices/crm/crm.slice'

export const store = configureStore({
	reducer: {
		auth: authReducer,
		theme: themeReducer,
		abstracts: abstractsReducer,
		registrations: registrationsReducer,
		sponsorships: sponsorshipsReducer,
		brochures: brochuresReducer,
		accRegistrations: accRegistrationsReducer,
		contacts: contactsReducer,
		crm: crmReducer,
	},
})


export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
