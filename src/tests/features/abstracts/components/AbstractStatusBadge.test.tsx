import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractStatusBadge from '../../../../features/abstracts/components/AbstractStatusBadge'
import type { AbstractStatus } from '../../../../features/abstracts/types'

describe('AbstractStatusBadge', () => {
  test.each([
    { status: 'Accepted' as AbstractStatus, expectedClass: 'bg-green-50' },
    { status: 'Under Review' as AbstractStatus, expectedClass: 'bg-yellow-50' },
    { status: 'Rejected' as AbstractStatus, expectedClass: 'bg-red-50' },
    { status: 'Out of Scope' as AbstractStatus, expectedClass: 'bg-gray-100 text-gray-700' },
    { status: 'Deleted' as AbstractStatus, expectedClass: 'bg-gray-100' },
    { status: 'Registered' as AbstractStatus, expectedClass: 'bg-blue-50' }, // default branch
  ])(
    'renders correct badge for status: $status',
    ({ status, expectedClass }) => {
      render(<AbstractStatusBadge status={status} />)

      const badge = screen.getByText(status)

      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain(expectedClass)
    }
  )
})
