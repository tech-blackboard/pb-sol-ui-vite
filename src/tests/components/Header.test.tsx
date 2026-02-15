import { render, screen, fireEvent } from '@testing-library/react'
import Header, { type User } from '../../components/Header'

describe('Header Component', () => {
  const mockUser: User = {
    name: 'Prashant',
    role: 'Admin',
  }

  const mockLogout = jest.fn()
  const mockToggleSidebar = jest.fn()

  function renderHeader() {
    render(
      <Header
        user={mockUser}
        onLogout={mockLogout}
        onToggleSidebar={mockToggleSidebar}
      />
    )
  }

  // ✅ Test 1: Header renders correctly
  it('should render logo and app name', () => {
    renderHeader()

    expect(screen.getByAltText('Logo')).toBeInTheDocument()
    expect(screen.getByText('APT')).toBeInTheDocument()
  })

  // ✅ Test 2: User name and role visible
  it('should display user name and role', () => {
    renderHeader()

    expect(screen.getByText('Prashant')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  // ✅ Test 3: Sidebar toggle button click
  it('should call onToggleSidebar when sidebar button is clicked', () => {
    renderHeader()

    const sidebarButton = screen.getByLabelText('Open sidebar')
    fireEvent.click(sidebarButton)

    expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
  })

  // ✅ Test 4: Open user menu
  it('should open user menu when profile button is clicked', () => {
    renderHeader()

    const profileButton = screen.getByTitle('Profile')
    fireEvent.click(profileButton)

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  // ✅ Test 5: Logout button works
  it('should call onLogout when logout button is clicked', () => {
    renderHeader()

    fireEvent.click(screen.getByTitle('Profile'))
    fireEvent.click(screen.getByText('Logout'))

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  // ✅ Test 6: Menu closes when clicking outside
  it('should close menu when clicking outside', () => {
    renderHeader()

    fireEvent.click(screen.getByTitle('Profile'))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
