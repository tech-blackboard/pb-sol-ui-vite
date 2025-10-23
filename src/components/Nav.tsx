import type { ReactNode } from 'react'

export type NavLink = {
  id: string
  label: string
}

type NavProps = {
  links: NavLink[]
  activeId: string
  onNavigate: (id: string) => void
  headerSlot?: ReactNode
  isOpen: boolean
  onClose: () => void
}

export default function Nav({ links, activeId, onNavigate, headerSlot, isOpen, onClose }: NavProps) {
  return (
    <>
      {/* Sidebar panel */}
      <aside
        className={
          [
            'fixed top-16 bottom-12 left-0 z-30 w-64 transform border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-200 ease-in-out',
            'md:static md:top-auto md:bottom-auto md:h-auto md:translate-x-0 md:z-10',
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          ].join(' ')
        }
        aria-label="Sidebar navigation"
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-100 md:hidden">
          <div className="text-base font-semibold">Navigation</div>
          <div className="ml-auto flex items-center gap-2">{headerSlot}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
              aria-label="Close sidebar"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6m0 12L6 6" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="px-3 py-4 md:pt-4 md:pb-6 md:px-4 overflow-y-auto h-[calc(100%-4rem)] md:h-auto">
          <ul className="space-y-1">
            {links.map((link) => {
              const isActive = link.id === activeId
              return (
                <li key={link.id}>
                  <button
                    onClick={() => {
                      onNavigate(link.id)
                      onClose()
                    }}
                    className={
                      [
                        'w-full text-left px-3 py-2.5 rounded-md',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-500/10 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                      ].join(' ')
                    }
                  >
                    {link.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}


