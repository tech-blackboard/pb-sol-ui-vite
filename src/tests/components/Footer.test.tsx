import { render, screen } from '@testing-library/react'
import Footer from '../../components/Footer'

describe('Footer component', () => {
  test('renders footer text with current year', () => {
    render(<Footer />)

    const currentYear = new Date().getFullYear()

    expect(
      screen.getByText(`© ${currentYear} My Company. All rights reserved.`)
    ).toBeInTheDocument()
  })

  test('renders a footer element', () => {
    const { container } = render(<Footer />)

    const footer = container.querySelector('footer')
    expect(footer).toBeInTheDocument()
  })
})
