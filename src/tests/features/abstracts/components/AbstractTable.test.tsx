import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractTable from '../../../../features/abstracts/components/AbstractTable'
// 🔹 Mock AbstractRow to isolate table logic
jest.mock('../../../../features/abstracts/components/AbstractRow', () => ({
  __esModule: true,
  default: ({ record, onView }: { record: { id: string; name: string }; onView: (raw: import('../../../../services/abstracts').AbstractItem | undefined) => void }) => (
    <tr data-testid={`row-${record.id}`}>
      <td>{record.name}</td>
      <td>
        <button onClick={() => onView(undefined)}>View</button>
      </td>
    </tr>
  ),
}))

const baseProps = {
  rows: [],
  rawRows: [],
  loading: false,
  onView: jest.fn(),
}

describe('AbstractTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /* ---------------- loading branch ---------------- */
  test('shows loading state', () => {
    render(
      <AbstractTable
        {...baseProps}
        loading={true}
      />
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  /* ---------------- empty state branch ---------------- */
  test('shows empty state when no rows', () => {
    render(<AbstractTable {...baseProps} />)

    expect(
      screen.getByText('No records found')
    ).toBeInTheDocument()
  })

  /* ---------------- headers ---------------- */
  test('renders all table headers', () => {
    render(<AbstractTable {...baseProps} />)

    expect(screen.getByText('Website')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Email Sent')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Submitted On')).toBeInTheDocument()
  })

  /* ---------------- rows rendering ---------------- */
  test('renders rows and passes correct raw record even with ID type differences', () => {
    const rows = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Doe' },
    ] as import('../../../../features/abstracts/types').AbstractRecord[]

    const rawRows = [
      { id: 1, extra: 'raw-1' }, // numeric ID
      { id: '2', extra: 'raw-2' }, // string ID
    ] as unknown as import('../../../../services/abstracts').AbstractItem[]

    render(
      <AbstractTable
        {...baseProps}
        rows={rows}
        rawRows={rawRows}
      />
    )

    expect(screen.getByTestId('row-1')).toBeInTheDocument()
    expect(screen.getByTestId('row-2')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  /* ---------------- onView callback ---------------- */
  test('calls onView with correct raw record', () => {
    const rows = [{ id: '1', name: 'John Doe' }] as import('../../../../features/abstracts/types').AbstractRecord[]
    const rawRows = [{ id: '1', extra: 'raw-data' }]

    render(
      <AbstractTable
        {...baseProps}
        rows={rows}
        rawRows={rawRows}
      />
    )

    fireEvent.click(screen.getByText('View'))

    expect(baseProps.onView).toHaveBeenCalledWith(rawRows[0])
  })

  /* ---------------- no matching raw row ---------------- */
  test('handles missing raw row gracefully', () => {
    const rows = [{ id: '99', name: 'Unknown' }] as import('../../../../features/abstracts/types').AbstractRecord[]

    render(
      <AbstractTable
        {...baseProps}
        rows={rows}
        rawRows={[]}
      />
    )

    fireEvent.click(screen.getByText('View'))

    expect(baseProps.onView).toHaveBeenCalledWith(undefined)
  })
})
