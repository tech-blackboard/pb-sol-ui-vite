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
        ; (fetchDashboard as jest.Mock).mockRejectedValue(new Error('Fail'))
        render(<DashboardPage />)

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
            expect(screen.getByText(/Unable to load dashboard data/i)).toBeInTheDocument()
        })

        // Wait for retry button and click
        const retryButton = await screen.findByRole('button', { name: /Retry/i })
        fireEvent.click(retryButton)
        expect(fetchDashboard).toHaveBeenCalledTimes(2)
    })

    it('handles empty recent abstracts', async () => {
        ; (fetchDashboard as jest.Mock).mockResolvedValue({ ...mockDashboardData, recentAbstracts: [] })
        render(<DashboardPage />)

        await waitFor(() => {
            expect(screen.getByText('No recent records')).toBeInTheDocument()
        })
    })
})
