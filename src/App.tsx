import { useEffect, useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import Header, { type User } from './components/Header'
import Nav, { type NavLink } from './components/Nav'
import AbstractsPage from './features/abstracts/pages/AbstractsPage'
import DashboardPage from './pages/DashboardPage'
import Footer from './components/Footer'
import SignInPage, { type SignInCredentials } from './pages/SignInPage'
import { type AppDispatch } from './store'
import { selectAuth, loginThunk, logoutThunk } from './store/slices/authSlice'
import { selectTheme, toggleTheme } from './store/slices/themeSlice'
import NetworkErrorAlert from './alerts/NetworkErrorAlert'
import ServerIssueAlert from './alerts/ServerIssueAlert'
import ServerUnavailableAlert from './alerts/ServerUnavailableAlert'
import DeviceManagement from './pages/DeviceManagement'

import RegistrationsPage from './features/registrations/pages/RegistrationsPage'
import SponsorshipsPage from './features/sponsorships/pages/SponsorshipsPage'
import BrochuresPage from './features/brochures/pages/BrochuresPage'
import AccRegistrationsPage from './features/accRegistrations/pages/AccRegistrationsPage'
import ContactsPage from './features/contacts/pages/ContactsPage'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const [activeId, setActiveId] = useState<string>('abstracts')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [showNetwork, setShowNetwork] = useState(false)
  const [showServer, setShowServer] = useState(false)
  const [showServerUnavailable, setShowServerUnavailable] = useState(false)
  useEffect(() => {
    const onNet = () => setShowNetwork(true)
    const onSrv = () => setShowServer(true)
    const onUnavail = () => setShowServerUnavailable(true)

    window.addEventListener('app:network-error', onNet as any)
    window.addEventListener('app:server-error', onSrv as any)
    window.addEventListener('app:server-unavailable', onUnavail as any)

    // Handle auth failures (token expiry)
    const onAuthFail = () => {
      dispatch(logoutThunk())
    }

    // Handle device revocation
    const onDeviceRevoked = (e: CustomEvent) => {
      toast.error(e.detail?.message || 'Device access revoked externally')
      dispatch(logoutThunk())
    }

    window.addEventListener('app:auth-failure', onAuthFail as any)
    window.addEventListener('app:device-not-approved', onDeviceRevoked as any)

    return () => {
      window.removeEventListener('app:network-error', onNet as any)
      window.removeEventListener('app:server-error', onSrv as any)
      window.removeEventListener('app:server-unavailable', onUnavail as any)
      window.removeEventListener('app:auth-failure', onAuthFail as any)
      window.removeEventListener('app:device-not-approved', onDeviceRevoked as any)
    }
  }, [])

  // Theme managed by Redux
  const { user: authUser, loading: authLoading, error: authError } = useSelector(selectAuth)
  const isAdmin = Boolean((authUser as any)?.isAdmin)
  const themeMode = useSelector(selectTheme)
  const links: NavLink[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'abstracts', label: 'Abstracts' },
    { id: 'registrations', label: 'Registrations' },
    { id: 'accRegistrations', label: 'Accommodation Registrations' },
    { id: 'brochures', label: 'Brochure' },
    { id: 'sponsorships', label: 'Sponsorship' },
    { id: 'contacts', label: 'Contact' },
    ...(isAdmin ? [{ id: 'deviceManagment', label: 'Device Management' }] : []),
  ];

  const user: User | null = (authUser as unknown as User) ?? null

  async function handleLogout() {
    await dispatch(logoutThunk()).unwrap()
    setActiveId('abstracts')
  }

  async function handleSignIn(creds: SignInCredentials) {
    try {
      await dispatch(loginThunk({ useremail: creds.useremail, userpassword: creds.userpassword, remember: creds.remember, deviceId: creds.deviceid })).unwrap()
      setActiveId('dashboard')
    } catch {
      // errors are handled in slice state
    }
  }

  useEffect(() => {
    const root = document.documentElement
    if (themeMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', themeMode)
  }, [themeMode])

  if (!user) {
    return <SignInPage onSignIn={handleSignIn} isLoading={authLoading} error={authError} />
  }

  if (showServerUnavailable) {
    return <ServerUnavailableAlert />
  }

  if (showNetwork) {
    return <NetworkErrorAlert />
  }

  if (showServer) {
    return <ServerIssueAlert />
  }

  return (

    <div className="h-dvh overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2500,
          style: { fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#16a34a', secondary: 'white' } },
        }}
      />
      <Header
        user={user}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        theme={themeMode}
        onToggleTheme={() => dispatch(toggleTheme())}
      />


      <div className="flex flex-1 pt-16 pb-12 overflow-hidden">
        {/* Sidebar */}
        <Nav
          links={links}
          activeId={activeId}
          onNavigate={setActiveId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {/* Overlay for mobile when sidebar open */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <main className="w-full h-full px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
            <div className="h-full overflow-hidden flex flex-col rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 shadow-sm text-left">
              {activeId === 'abstracts' ? (
                <AbstractsPage />
              ) : activeId === 'registrations' ? (
                <RegistrationsPage />
              ) : activeId === 'accRegistrations' ? (
                <AccRegistrationsPage />
              ) : activeId === 'brochures' ? (
                <BrochuresPage />
              ) : activeId === 'sponsorships' ? (
                <SponsorshipsPage />
              ) : activeId === 'contacts' ? (
                <ContactsPage />
              ) : activeId === 'deviceManagment' && isAdmin ? (
                <DeviceManagement />
              ) : (
                <DashboardPage />
              )}

            </div>
          </main>
        </div>

      </div>

      <Footer />

    </div>

  )
}

export default App
