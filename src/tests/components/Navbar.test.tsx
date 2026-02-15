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
})
