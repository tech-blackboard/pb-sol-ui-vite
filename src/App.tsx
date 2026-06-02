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
import { setActiveFolder } from './store/slices/crm/crm.slice'
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
import MailboxPage from './features/crm/pages/MailboxPage'
import GlobalContactsPage from './features/globalContacts/pages/GlobalContactsPage'


function App() {
  const dispatch = useDispatch<AppDispatch>()
  const [activeId, setActiveId] = useState<string>('abstracts')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [navCollapsed, setNavCollapsed] = useState<boolean>(false)
  const [showNetwork, setShowNetwork] = useState(false)
  const [showServer, setShowServer] = useState(false)
  const [showServerUnavailable, setShowServerUnavailable] = useState(false)
  useEffect(() => {
    const onNet = () => setShowNetwork(true)
    const onSrv = () => setShowServer(true)
    const onUnavail = () => setShowServerUnavailable(true)

    window.addEventListener('app:network-error', onNet as EventListener)
    window.addEventListener('app:server-error', onSrv as EventListener)
    window.addEventListener('app:server-unavailable', onUnavail as EventListener)

    // Handle auth failures (token expiry)
    const onAuthFail = () => {
      dispatch(logoutThunk())
    }

    // Handle device revocation
    const onDeviceRevoked = (e: Event) => {
      const customEvent = e as CustomEvent
      toast.error(customEvent.detail?.message || 'Device access revoked externally')
      dispatch(logoutThunk())
    }

    window.addEventListener('app:auth-failure', onAuthFail as EventListener)
    window.addEventListener('app:device-not-approved', onDeviceRevoked as EventListener)

    // Global navigation listener to email in contact bucket navigate to mailbox 
    const onNavigate = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        setActiveId(customEvent.detail)
      }
    }
    window.addEventListener('app:navigate', onNavigate as EventListener)

    return () => {
      window.removeEventListener('app:network-error', onNet as EventListener)
      window.removeEventListener('app:server-error', onSrv as EventListener)
      window.removeEventListener('app:server-unavailable', onUnavail as EventListener)
      window.removeEventListener('app:auth-failure', onAuthFail as EventListener)
      window.removeEventListener('app:device-not-approved', onDeviceRevoked as EventListener)
      window.removeEventListener('app:navigate', onNavigate as EventListener)
    }
  }, [dispatch])

  // Theme managed by Redux
  const { user: authUser, loading: authLoading, error: authError } = useSelector(selectAuth)
  const isAdmin = Boolean(authUser?.isAdmin)
  const themeMode = useSelector(selectTheme)
  const links: NavLink[] = [
    { id: 'dashboard', label: 'Dashboard' },
    {
      id: 'websiteFormEntries',
      label: 'Website Form Entries',
      items: [
        { id: 'abstracts', label: 'Abstracts' },
        { id: 'registrations', label: 'Registrations' },
        { id: 'accRegistrations', label: 'Accommodation Registrations' },
        { id: 'sponsorships', label: 'Sponsors/Exhibitors' },
        { id: 'brochures', label: 'Brochures' },
        { id: 'contacts', label: 'Contacts' },
      ]
    },
    ...(isAdmin ? [{ id: 'deviceManagment', label: 'Device Management' }] : []),
    { id: 'crm', label: 'Mailbox' },
    ...(isAdmin ? [
      { id: 'contactBucket', label: 'Contact Bucket' },
      { id: 'globalContacts', label: 'Global Contacts' }
    ] : [])
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

  useEffect(() => {
    if (activeId === 'crm') {
      dispatch(setActiveFolder('Inbox'));
    } else if (activeId === 'contactBucket') {
      dispatch(setActiveFolder('Contact Bucket'));
    }
  }, [activeId, dispatch]);

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


      <div className="flex flex-1 pt-11 pb-12 overflow-hidden">
        {/* Sidebar */}
        <Nav
          links={links}
          activeId={activeId}
          onNavigate={setActiveId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={navCollapsed}
          onToggleCollapse={() => setNavCollapsed((prev) => !prev)}
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {/* Overlay for mobile when sidebar open */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-48 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <main className="w-full h-full px-2 sm:px-2 lg:px-2 py-2 overflow-hidden">
            <div className="h-full overflow-hidden flex flex-col rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 shadow-sm text-left">
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
              ) : activeId === 'crm' || (activeId === 'contactBucket' && isAdmin) ? (
                <MailboxPage />
              ) : activeId === 'globalContacts' && isAdmin ? (
                <GlobalContactsPage />
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
