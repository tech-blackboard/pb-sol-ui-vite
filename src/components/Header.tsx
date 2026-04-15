import { useEffect, useRef, useState } from 'react'

export type User = {
  name: string
  role: string
}

type HeaderProps = {
  user: User
  onLogout: () => void
  onToggleSidebar: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

export default function Header({ user, onLogout, onToggleSidebar }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-45 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="h-11 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open sidebar"
            onClick={onToggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <img src="/logo-min.jpg" alt="Logo" className="h-8 w-auto" />
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">CRM</div>
        </div>

        <div className="flex items-center gap-2">
          {/* <button
        type="button"
        onClick={onToggleTheme}
        className="hidden sm:inline-flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-800 px-3 h-10 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50"
        title="Toggle theme"
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button> */}
          <div className="hidden md:block">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Profile"
            >
              <span className="sr-only">Open user menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-700 dark:text-gray-300">
                <path fillRule="evenodd" d="M12 2.25a4.5 4.5 0 0 0-4.5 4.5v.75a4.5 4.5 0 0 0 9 0V6.75a4.5 4.5 0 0 0-4.5-4.5Zm-8.25 17.25a8.25 8.25 0 1 1 16.5 0v.75a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75v-.75Z" clipRule="evenodd" />
              </svg>
            </button>

            {isOpen && (
              <div
                role="menu"
                aria-label="User menu"
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none p-3"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold">
                    {user.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="mt-3 w-full inline-flex items-center justify-center rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}


