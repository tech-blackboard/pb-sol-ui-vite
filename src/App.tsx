import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Header, { type User } from './components/Header'
import Nav, { type NavLink } from './components/Nav'
import AbstractsPage from './pages/AbstractsPage'
import Footer from './components/Footer'
import SignInPage, { type SignInCredentials } from './pages/SignInPage'
import { type AppDispatch } from './store'
import { selectAuth, loginThunk, logoutThunk } from './store/slices/authSlice'
import { selectTheme, toggleTheme } from './store/slices/themeSlice'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const [activeId, setActiveId] = useState<string>('abstracts')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  // Theme managed by Redux
  const { user: authUser, loading: authLoading, error: authError } = useSelector(selectAuth)
  const isAdmin = Boolean((authUser as any)?.isAdmin)
  const themeMode = useSelector(selectTheme)
  const links: NavLink[] = isAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'abstracts', label: 'Abstracts' },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard' },
      ]

  const user: User | null = (authUser as unknown as User) ?? null

  async function handleLogout() {
    await dispatch(logoutThunk()).unwrap()
    setActiveId('abstracts')
  }

  async function handleSignIn(creds: SignInCredentials) {
    try {
      await dispatch(loginThunk({ useremail: creds.useremail, userpassword: creds.userpassword, remember: creds.remember })).unwrap()
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

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header
        user={user}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        theme={themeMode}
        onToggleTheme={() => dispatch(toggleTheme())}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Nav
          links={links}
          activeId={activeId}
          onNavigate={setActiveId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content area */}
        <div className="flex-1">
          {/* Overlay for mobile when sidebar open */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm text-left">
              {activeId === 'abstracts' ? (
                isAdmin ? (
                  <AbstractsPage />
                ) : (
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">You do not have access to Abstracts.</p>
                  </div>
                )
              ) : (
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {links.find((l) => l.id === activeId)?.label}
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    This is a placeholder for the "{activeId}" page.
                  </p>
                </div>
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
