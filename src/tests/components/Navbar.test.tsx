import { render, screen, fireEvent } from '@testing-library/react'
import Nav, { type NavLink } from '../../components/Nav'

const mockLinks: NavLink[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
]

describe('Nav component', () => {
  test('renders navigation links', () => {
    render(
      <Nav
        links={mockLinks}
        activeId="home"
        isOpen={true}
        onNavigate={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  test('covers all icon renderings', () => {
    const iconLinks: NavLink[] = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'websiteFormEntries', label: 'Website Form' },
      { id: 'abstracts', label: 'Abstracts' },
      { id: 'registrations', label: 'Registrations' },
      { id: 'accRegistrations', label: 'Acc Registrations' },
      { id: 'brochures', label: 'Brochures' },
      { id: 'sponsorships', label: 'Sponsorships' },
      { id: 'contacts', label: 'Contacts' },
      { id: 'mailbox', label: 'Mailbox' },
      { id: 'deviceManagment', label: 'Device Management' },
      { id: 'unknown-id', label: 'Unknown' },
    ]

    render(
      <Nav
        links={iconLinks}
        activeId="dashboard"
        isOpen={true}
        onNavigate={jest.fn()}
        onClose={jest.fn()}
      />
    )

    iconLinks.forEach(link => {
      expect(screen.getByText(link.label)).toBeInTheDocument()
    })
  })

  test('calls onNavigate and onClose when a link is clicked', () => {
    const onNavigate = jest.fn()
    const onClose = jest.fn()

    render(
      <Nav
        links={mockLinks}
        activeId="home"
        isOpen={true}
        onNavigate={onNavigate}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByText('About'))

    expect(onNavigate).toHaveBeenCalledWith('about')
    expect(onClose).toHaveBeenCalled()
  })

  test('renders close button and calls onClose when clicked', () => {
    const onClose = jest.fn()

    render(
      <Nav
        links={mockLinks}
        activeId="home"
        isOpen={true}
        onNavigate={jest.fn()}
        onClose={onClose}
      />
    )

    const closeButton = screen.getByLabelText('Close sidebar')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  test('sidebar is hidden when isOpen is false', () => {
    const { container } = render(
      <Nav
        links={mockLinks}
        activeId="home"
        isOpen={false}
        onNavigate={jest.fn()}
        onClose={jest.fn()}
      />
    )

    const aside = container.querySelector('aside')
    expect(aside).toHaveClass('-translate-x-full')
  })

  test('expands sub-menus when clicked', () => {
    const linksWithChildren: NavLink[] = [
      {
        id: 'parent', label: 'Parent Link', items: [
          { id: 'child', label: 'Child Link' }
        ]
      }
    ]

    render(
      <Nav
        links={linksWithChildren}
        activeId="child"
        isOpen={true}
        onNavigate={jest.fn()}
        onClose={jest.fn()}
      />
    )

    // Child should not be visible initially (except if it was default expanded, but our mock id is 'parent')
    expect(screen.queryByText('Child Link')).not.toBeInTheDocument()

    // Click parent
    fireEvent.click(screen.getByText('Parent Link'))

    // Child should now be visible
    expect(screen.getByText('Child Link')).toBeInTheDocument()

    // Click parent again to collapse
    fireEvent.click(screen.getByText('Parent Link'))

    // Child should be hidden again
    expect(screen.queryByText('Child Link')).not.toBeInTheDocument()
  })

  test('renders collapsed state and toggle button correctly', () => {
    const onToggleCollapse = jest.fn()
    const { container } = render(
      <Nav
        links={mockLinks}
        activeId="home"
        isOpen={true}
        isCollapsed={true}
        onToggleCollapse={onToggleCollapse}
        onNavigate={jest.fn()}
        onClose={jest.fn()}
      />
    )

    const aside = container.querySelector('aside')
    expect(aside).toHaveClass('md:w-16')

    const toggleBtn = screen.getByTitle('Expand sidebar')
    expect(toggleBtn).toBeInTheDocument()
    
    fireEvent.click(toggleBtn)
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
  })
})
