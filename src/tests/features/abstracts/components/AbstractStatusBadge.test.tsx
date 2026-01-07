import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractStatusBadge from '../../../../features/abstracts/components/AbstractStatusBadge'

describe('AbstractStatusBadge', () => {
  test.each([
    { status: 'Accepted', expectedClass: 'bg-green-50' },
    { status: 'Under Review', expectedClass: 'bg-yellow-50' },
    { status: 'Rejected', expectedClass: 'bg-red-50' },
    { status: 'Out of Scope', expectedClass: 'bg-gray-100' },
    { status: 'Registered', expectedClass: 'bg-blue-50' }, // default branch
  ])(
    'renders correct badge for status: $status',
    ({ status, expectedClass }) => {
      render(<AbstractStatusBadge status={status as any} />)

      const badge = screen.getByText(status)

      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain(expectedClass)
    }
  )
})
