import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardPage from '../../pages/DashboardPage'
import { fetchDashboard } from '../../services/abstracts'
import { listWebsites } from '../../services/sourcedb'

jest.mock('../../services/abstracts')
jest.mock('../../services/sourcedb')

describe('DashboardPage', () => {
    const mockDashboardData = {
        total: 10,
        statusCounts: [
            { status_id: 1, count: 5 },
            { status_id: 2, count: 5 }
        ],
        recentAbstracts: [
            { id: 1, name: 'John Doe', email: 'john@test.com', website_name: 'Web 1', now: '2023-01-01', status: { actionType: 'Accepted' } }
        ]
    }

    const mockWebsites = [
        { id: 1, name: 'Web 1' },
        { id: 2, name: 'Web 2' }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
            ; (fetchDashboard as jest.Mock).mockResolvedValue(mockDashboardData)
            ; (listWebsites as jest.Mock).mockResolvedValue(mockWebsites)
    })

    it('renders dashboard with stats and recent abstracts', async () => {
        render(<DashboardPage />)

        // Wait for dashboard data to load
        await screen.findByText('Total Abstracts')

        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Under Review/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Accepted/i })).toBeInTheDocument()
    })

    it('filters dashboard when a stat card is clicked', async () => {
        render(<DashboardPage />)
        // Wait for stats to load to avoid act warnings
        await screen.findByText('Total Abstracts')

        const acceptedCard = screen.getByRole('button', { name: /Accepted/i })
        fireEvent.click(acceptedCard)

        await waitFor(() => {
            expect(fetchDashboard).toHaveBeenCalledWith(expect.objectContaining({
                status_id: 2
            }))
        })
    })

    it('opens and closes filter drawer', async () => {
        render(<DashboardPage />)
        // Wait for initial load
        await screen.findByText('Total Abstracts')

        const filterButton = screen.getByRole('button', { name: /Filters/i })
        fireEvent.click(filterButton)

        const drawer = screen.getByRole('heading', { name: /Filters/i }).closest('div')!.parentElement!
        await within(drawer).findByText('Website')

        fireEvent.click(within(drawer).getByRole('button', { name: /close filters/i }))
    })

    it('applies filters from drawer', async () => {
        render(<DashboardPage />)
        // Wait for dashboard to load
        await screen.findByText('Total Abstracts')

        fireEvent.click(screen.getByRole('button', { name: /Filters/i }))

        const drawer = screen.getByRole('heading', { name: /Filters/i }).closest('div')!.parentElement!

        // Wait for websites list to load in the drawer
        await within(drawer).findByText('All Websites')

        fireEvent.change(within(drawer).getByRole('combobox'), { target: { value: '1' } })
        fireEvent.click(within(drawer).getByText('Apply'))

        await waitFor(() => {
            expect(fetchDashboard).toHaveBeenCalledWith(expect.objectContaining({
                website_id: 1
            }))
        })
    })

    it('resets filters', async () => {
        render(<DashboardPage />)
        // Wait for initial load
        await screen.findByText('Total Abstracts')

        fireEvent.click(screen.getByRole('button', { name: /Filters/i }))

        const drawer = screen.getByRole('heading', { name: /Filters/i }).closest('div')!.parentElement!
        // Wait for drawer content
        await within(drawer).findByRole('button', { name: /Reset/i })

        fireEvent.click(within(drawer).getByRole('button', { name: /Reset/i }))

        await waitFor(() => {
            expect(fetchDashboard).toHaveBeenCalledWith({})
        })
    })

    it('reloads dashboard data on reload button click', async () => {
        render(<DashboardPage />)
        await screen.findByRole('button', { name: /Reload/i })

        fireEvent.click(screen.getByRole('button', { name: /Reload/i }))

        await waitFor(() => {
            expect(fetchDashboard).toHaveBeenCalledTimes(2) // Initial + Reload
        })
    })

    it('shows error state on failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
            ; (fetchDashboard as jest.Mock).mockRejectedValue(new Error('Fail'))
        render(<DashboardPage />)

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
            expect(screen.getByText(/Unable to load dashboard data/i)).toBeInTheDocument()
        })

        // Wait for retry button and click
        const retryButton = await screen.findByRole('button', { name: /Retry/i })
            // Successful retry
            ; (fetchDashboard as jest.Mock).mockResolvedValue(mockDashboardData)
        fireEvent.click(retryButton)

        await waitFor(() => {
            expect(fetchDashboard).toHaveBeenCalledTimes(2)
            expect(screen.getByText('10')).toBeInTheDocument()
        })
        consoleSpy.mockRestore()
    })

    it('handles empty recent abstracts', async () => {
        ; (fetchDashboard as jest.Mock).mockResolvedValue({ ...mockDashboardData, recentAbstracts: [] })
        render(<DashboardPage />)

        await waitFor(() => {
            expect(screen.getByText('No recent records')).toBeInTheDocument()
        })
    })

    it('covers status styling branches and name fallback (lines 404, 428-434)', async () => {
        const variousAbstracts = [
            { id: 1, name: null, user: { firstname: 'John', lastname: 'Doe' }, website_name: 'W1', now: '2023', status: { actionType: 'Under Review' } },
            { id: 2, name: 'Exist', user: null, website_name: 'W2', now: '2023', status: { actionType: 'Accepted' } },
            { id: 3, name: 'Exist', user: null, website_name: 'W3', now: '2023', status: { actionType: 'Rejected' } },
            { id: 4, name: 'Exist', user: null, website_name: 'W4', now: '2023', status: { actionType: 'Out of Scope' } },
            { id: 5, name: 'Exist', user: null, website_name: 'W5', now: '2023', status: { actionType: 'Deleted' } },
            { id: 6, name: 'Exist', user: null, website_name: 'W6', now: '2023', status: { actionType: 'Other' } },
        ]
        ; (fetchDashboard as jest.Mock).mockResolvedValue({ ...mockDashboardData, recentAbstracts: variousAbstracts })
        
        render(<DashboardPage />)

        expect(await screen.findByText('John Doe')).toBeInTheDocument() // line 404 fallback
        
        // Use table container to find status spans (to avoid matching stat cards)
        const table = screen.getByRole('table')
        
        // Verify some classes (lines 428-434)
        const yellowSpan = within(table).getByText('Under Review')
        expect(yellowSpan.className).toContain('bg-yellow-50')
        
        const graySpan = within(table).getByText('Out of Scope')
        expect(graySpan.className).toContain('bg-gray-100')
        
        const redSpan = within(table).getByText('Deleted')
        expect(redSpan.className).toContain('text-red-700')
    })

    it('covers loading websites fallback (line 221)', async () => {
        ;(listWebsites as jest.Mock).mockReturnValue(new Promise(() => {})) // Never resolves
        render(<DashboardPage />)
        
        fireEvent.click(screen.getByRole('button', { name: /Filters/i }))
        expect(screen.getByText('Loading websites…')).toBeInTheDocument()
    })

    it('covers name and website fallbacks (lines 400, 404)', async () => {
        const fallbackAbstracts = [
            { id: 1, name: null, user: null, website_name: null, now: '2023', status: 'Accepted' },
            { id: 2, name: '', user: { useremail: 'test@email.com' }, website_name: 'W1', now: '2023', status: 'Accepted' },
        ]
        ;(fetchDashboard as jest.Mock).mockResolvedValue({ ...mockDashboardData, recentAbstracts: fallbackAbstracts })
        
        render(<DashboardPage />)
        
        
        expect(await screen.findByText('test@email.com')).toBeInTheDocument()
        expect(screen.getAllByText('—').length).toBeGreaterThan(0) // Website fallback
    })

    it('covers missing status counts and website ID reset (lines 80-93, 115-116, 217)', async () => {
        ;(fetchDashboard as jest.Mock).mockResolvedValue({ 
            ...mockDashboardData, 
            total: null,
            statusCounts: null,
            recentAbstracts: null
        })
        render(<DashboardPage />)
        
        // Wait for stats
        await screen.findAllByText('0') // Total Abstracts from mockDashboardData.total is null, so it falls back to 0
        // MapStatusCounts uses statusCounts. map[2] should be 0.
        
        fireEvent.click(screen.getByRole('button', { name: /Filters/i }))
        const select = screen.getByRole('combobox') as HTMLSelectElement
        fireEvent.change(select, { target: { value: '' } }) // Reset websiteId in select
        expect(select.value).toBe('')

        const reBtn = screen.getByRole('button', { name: /Reload/i })
        fireEvent.click(reBtn) // Covers line 331 fallback with recentAbstracts: null
    })

    it('covers recent abstracts fallbacks and date formatting (lines 331, 398-400, 418-419)', async () => {
        const minimalAbstracts = [
            { id: 1, name: 'Minimal', website_id: 10, website: { name: 'Ext Website' }, now: null, status: null },
            { uuid: '123', name: 'UUID Only' },
            { email: 'x@x.com', name: 'Email Only' },
            { website_id: 99, now: '2023', name: 'Website ID Only' },
            { now: '2024', name: 'No IDs at all' }
        ]
        ;(fetchDashboard as jest.Mock).mockResolvedValue({ ...mockDashboardData, recentAbstracts: minimalAbstracts })
        
        render(<DashboardPage />)
        const reBtn = await screen.findByRole('button', { name: /Reload/i })
        fireEvent.click(reBtn) // Covers line 331 reset

        expect(await screen.findByText('Ext Website')).toBeInTheDocument() // line 400
        expect(screen.getAllByText('—').length).toBeGreaterThan(0) // line 419
    })
})
