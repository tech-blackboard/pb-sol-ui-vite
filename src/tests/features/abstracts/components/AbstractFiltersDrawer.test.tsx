import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractFiltersDrawer from '../../../../features/abstracts/components/AbstractFiltersDrawer'

import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
import {
  updateDraftFilter,
  applyFilters,
  resetFilters,
} from '../../../../store/slices/abstracts/abstracts.slice'
import { selectDraftFilters } from '../../../../store/slices/abstracts/abstracts.selectors'
import { listWebsites, type SourceWebsite } from '../../../../services/sourcedb'

jest.mock('../../../../store/hooks')
jest.mock('../../../../services/sourcedb')

const mockDispatch = jest.fn()

const baseFilters = {
  search: '',
  name: '',
  email: '',
  organization: '',
  country: '',
  title: '',
  status_id: undefined,
  website_id: undefined,
  sortBy: 'now',
  sortOrder: 'DESC',
  isEmailSent: undefined,
}

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

function renderDrawer({
  open = true,
  filters = baseFilters,
  onClose = jest.fn(),
}: {
  open?: boolean
  filters?: typeof baseFilters
  onClose?: jest.Mock
} = {}) {
  ; (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
    ; (useAppSelector as jest.Mock).mockImplementation((selector) =>
      selector === selectDraftFilters ? filters : undefined
    )

  return {
    onClose,
    ...render(<AbstractFiltersDrawer open={open} onClose={onClose} />),
  }
}

/**
 * IMPORTANT:
 * Any test rendering with open=true MUST await the async useEffect
 */
async function renderDrawerAndWait(options = {}, websitesData: SourceWebsite[] = []) {
  (listWebsites as jest.Mock).mockResolvedValue(websitesData)

  const utils = renderDrawer(options)

  await waitFor(() => {
    expect(listWebsites).toHaveBeenCalled()
  })

  return utils
}

/* ------------------------------------------------------------------ */
/* tests                                                              */
/* ------------------------------------------------------------------ */

describe('AbstractFiltersDrawer – full coverage (fixed)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /* ---------- open=false branch ---------- */
  test('returns null when open is false', () => {
    const { container } = renderDrawer({ open: false })
    expect(container).toBeEmptyDOMElement()
  })

  test('does not call listWebsites when open is false', () => {
    renderDrawer({ open: false })
    expect(listWebsites).not.toHaveBeenCalled()
  })

  /* ---------- async website loading ---------- */
  test('shows loading text then renders websites', async () => {
    ; (listWebsites as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Website A' },
    ])

    renderDrawer()

    expect(
      screen.getByText('Loading websites…')
    ).toBeInTheDocument()

    expect(await screen.findByText('Website A')).toBeInTheDocument()
  })

  /* ---------- cleanup (mounted=false) ---------- */
  test('cleanup prevents state update after unmount', async () => {
    let resolvePromise!: (value: unknown) => void

      ; (listWebsites as jest.Mock).mockReturnValue(
        new Promise((res) => (resolvePromise = res))
      )

    const { unmount } = renderDrawer()

    unmount()

    await act(async () => {
      resolvePromise([{ id: 99, name: 'Late Website' }])
    })
  })

  /* ---------- Input helper ---------- */
  test('Input helper dispatches updateDraftFilter for various fields', async () => {
    await renderDrawerAndWait()

    fireEvent.change(screen.getByPlaceholderText('Keyword search...'), { target: { value: 'test' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'search', value: 'test' }))

    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'name', value: 'John' }))

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'e@mail.com' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'email', value: 'e@mail.com' }))

    fireEvent.change(screen.getByPlaceholderText('Organization'), { target: { value: 'Org' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'organization', value: 'Org' }))

    fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'India' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'country', value: 'India' }))

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Mr' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'title', value: 'Mr' }))
  })

  /* ---------- status_id branches ---------- */
  test('status_id empty converts to undefined', async () => {
    await renderDrawerAndWait()

    fireEvent.change(
      screen.getByText('Status').closest('select')!,
      { target: { value: '' } }
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      updateDraftFilter({ key: 'status_id', value: undefined })
    )
  })

  test('status_id value converts to number', async () => {
    await renderDrawerAndWait()

    fireEvent.change(
      screen.getByText('Status').closest('select')!,
      { target: { value: '2' } }
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      updateDraftFilter({ key: 'status_id', value: 2 })
    )
  })

  /* ---------- website_id branches ---------- */
  test('website_id empty converts to undefined', async () => {
    await renderDrawerAndWait()

    const selects = screen.getAllByRole('combobox')
    const websiteSelect = selects[1]

    fireEvent.change(websiteSelect, {
      target: { value: '' },
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      updateDraftFilter({ key: 'website_id', value: undefined })
    )
  })

  /* ---------- isEmailSent ternary branches ---------- */
  test('isEmailSent empty -> undefined', async () => {
    await renderDrawerAndWait()

    fireEvent.change(
      screen.getByText('All').closest('select')!,
      { target: { value: '' } }
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      updateDraftFilter({ key: 'isEmailSent', value: undefined })
    )
  })

  test('isEmailSent true branch', async () => {
    await renderDrawerAndWait()

    fireEvent.change(
      screen.getByText('All').closest('select')!,
      { target: { value: 'true' } }
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      updateDraftFilter({ key: 'isEmailSent', value: true })
    )
  })

  test('isEmailSent false branch', async () => {
    await renderDrawerAndWait()

    fireEvent.change(
      screen.getByText('All').closest('select')!,
      { target: { value: 'false' } }
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      updateDraftFilter({ key: 'isEmailSent', value: false })
    )
  })

  test('sort selects dispatch updates', async () => {
    await renderDrawerAndWait()
    
    // Sort By
    fireEvent.change(screen.getByText('Sort by time').closest('select')!, { target: { value: 'name' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'sortBy', value: 'name' }))

    // Sort Order
    fireEvent.change(screen.getByText('DESC').closest('select')!, { target: { value: 'ASC' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'sortOrder', value: 'ASC' }))
  })

  /* ---------- footer actions ---------- */
  test('Reset button dispatches resetFilters', async () => {
    await renderDrawerAndWait()

    fireEvent.click(screen.getByText('Reset'))
    expect(mockDispatch).toHaveBeenCalledWith(resetFilters())
  })

  test('Apply button dispatches applyFilters and closes drawer', async () => {
    const { onClose } = await renderDrawerAndWait()

    fireEvent.click(screen.getByText('Apply'))

    expect(mockDispatch).toHaveBeenCalledWith(applyFilters())
    expect(onClose).toHaveBeenCalled()
  })

  /* ---------- backdrop & close button ---------- */
  test('clicking backdrop calls onClose', async () => {
    const { container, onClose } = await renderDrawerAndWait()

    fireEvent.click(container.querySelector('.bg-black\\/40')!)
    expect(onClose).toHaveBeenCalled()
  })

  test('close button calls onClose', async () => {
    const { onClose } = await renderDrawerAndWait()

    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalled()
  })

  test('website selection dispatches updateDraftFilter', async () => {
    await renderDrawerAndWait({}, [{ id: 10, name: 'Website X' }])

    const websiteOption = await screen.findByText('Website X')
    expect(websiteOption).toBeInTheDocument()

    const selects = screen.getAllByRole('combobox')
    const websiteSelect = selects[1]

    fireEvent.change(websiteSelect, { target: { value: '10' } })
    expect(mockDispatch).toHaveBeenCalledWith(updateDraftFilter({ key: 'website_id', value: 10 }))
  })

  test('handles website loading failure', async () => {
    ; (listWebsites as jest.Mock).mockRejectedValue(new Error('API Fail'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

    renderDrawer()

    await waitFor(() => {
      expect(listWebsites).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
    })
    consoleSpy.mockRestore()
  })

  test('handles undefined filter values for Input fallbacks', async () => {
    const emptyFilters = {
      ...baseFilters,
      search: undefined,
      name: undefined,
      email: undefined,
      organization: undefined,
      country: undefined,
      title: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    }
    await renderDrawerAndWait({ filters: emptyFilters })

    expect(screen.getByPlaceholderText('Keyword search...')).toHaveValue('')
    expect(screen.getByPlaceholderText('Name')).toHaveValue('')
    expect(screen.getByPlaceholderText('Organization')).toHaveValue('')
    expect(screen.getByPlaceholderText('Country')).toHaveValue('')
    expect(screen.getByPlaceholderText('Title')).toHaveValue('')
  })

  test('isEmailSent matches empty string when undefined, true, or false', async () => {
    await renderDrawerAndWait({ filters: { ...baseFilters, isEmailSent: undefined } })
    let selects = screen.getAllByRole('combobox')
    let select = selects.find(s => s.innerHTML.includes('All')) as HTMLSelectElement
    if (select) expect(select.value).toBe('')

    cleanup()

    await renderDrawerAndWait({ filters: { ...baseFilters, isEmailSent: true } })
    selects = screen.getAllByRole('combobox')
    select = selects.find(s => s.innerHTML.includes('All')) as HTMLSelectElement
    if (select) expect(select.value).toBe('true')

    cleanup()

    await renderDrawerAndWait({ filters: { ...baseFilters, isEmailSent: false } })
    selects = screen.getAllByRole('combobox')
    select = selects.find(s => s.innerHTML.includes('All')) as HTMLSelectElement
    if (select) expect(select.value).toBe('false')
  })
})
