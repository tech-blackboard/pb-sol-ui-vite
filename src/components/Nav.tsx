import { useState, type ReactNode } from 'react'

export type NavLink = {
  id: string
  label: string
  items?: NavLink[]
}

type NavProps = {
  links: NavLink[]
  activeId: string
  onNavigate: (id: string) => void
  headerSlot?: ReactNode
  isOpen: boolean
  onClose: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Nav({ links, activeId, onNavigate, headerSlot, isOpen, onClose, isCollapsed = false, onToggleCollapse }: NavProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    websiteFormEntries: true // Defaultly expand this as per common dashboard UX
  })
  // Icon mapping based on nav item ID
  const getIcon = (id: string) => {
    const iconClass = "h-5 w-5 flex-shrink-0"

    switch (id) {
      case 'dashboard':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
        )
      case 'websiteFormEntries':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'abstracts':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'registrations':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      case 'accRegistrations':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      case 'brochures':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'sponsorships':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )
      case 'contacts':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'mailbox':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 5-8-5" />
          </svg>
        )
      case 'deviceManagment':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )
    }
  }

  const renderNavItems = (items: NavLink[], isSubItem = false) => {
    return items.map((link) => {
      const hasChildren = link.items && link.items.length > 0
      const isExpanded = expandedIds[link.id]
      const isActive = link.id === activeId || (hasChildren && link.items?.some(i => i.id === activeId))

      return (
        <li key={link.id} className="w-full">
          <button
            onClick={() => {
              if (hasChildren) {
                setExpandedIds(prev => ({ ...prev, [link.id]: !prev[link.id] }))
              } else {
                onNavigate(link.id)
                onClose()
              }
            }}
            className={
              [
                'w-full text-left rounded-md transition-all flex items-center gap-3',
                isSubItem ? 'pl-9 pr-3 py-2 text-sm' : 'px-3 py-2.5',
                isActive && !hasChildren
                  ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-500/10 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                isActive && hasChildren ? 'text-blue-700 dark:text-blue-300 font-medium' : '',
                isCollapsed ? 'md:justify-center md:px-0' : '',
              ].join(' ')
            }
            title={isCollapsed ? link.label : undefined}
          >
            {!isSubItem && getIcon(link.id)}
            <span className={isCollapsed ? 'md:hidden' : 'flex-1 overflow-hidden text-ellipsis whitespace-nowrap'}>{link.label}</span>
            {hasChildren && !isCollapsed && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          {hasChildren && isExpanded && !isCollapsed && (
            <ul className="mt-1 space-y-1">
              {renderNavItems(link.items!, true)}
            </ul>
          )}
        </li>
      )
    })
  }

  return (
    <>
      <aside
        className={
          [
            'fixed top-16 bottom-12 left-0 z-30 transform border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-200 ease-in-out',
            'md:static md:top-auto md:bottom-auto md:h-auto md:translate-x-0 md:z-10',
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            isCollapsed ? 'md:w-16' : 'w-64',
          ].join(' ')
        }
        aria-label="Sidebar navigation"
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-100 md:hidden">
          <div className="text-base font-semibold">Navigation</div>
          <div className="ml-auto flex items-center gap-2">{headerSlot}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md "
              aria-label="Close sidebar"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5  ">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6m0 12L6 6" />
              </svg>
            </button>
          </div>
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex absolute top-6 right-3  h-7 w-7   items-center justify-center rounded-md transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`h-5 w-5 transition-transform   ${isCollapsed ? 'rotate-180 top-0 md:top-0.5   items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 p-1   left-5 absolute' : '  h-7 w-7   items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded-md '}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        <nav className="px-3 py-4 md:pt-4 md:pb-6 md:px-2 overflow-y-auto h-[calc(100%-4rem)] md:h-auto ">
          <ul className="space-y-1">
            {renderNavItems(links)}
          </ul>
        </nav>
      </aside>
    </>
  )
}


