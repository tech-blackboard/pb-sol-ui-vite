import { useEffect, useState } from 'react'
import { fetchDashboard } from '../services/abstracts'
import { formatDate } from '../utils/utils'
import { listWebsites, type SourceWebsite } from '../services/sourcedb'

type StatCard = {
  label: string
  value: number | null
  color: string
}

const STATUS_MAP: Record<string, number | null> = {
  all: null,
  under: 1,
  accepted: 2,
  oos: 3,
  rejected: 4,
  invoice: 5,
  registered: 6,
  deleted: 7,
}

type LoadDashboardParams = {
  websiteId?: number | null
  fromDate?: string
  toDate?: string
  statusId?: number | null
}

export default function DashboardPage() {
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, StatCard>>({})
  const [recent, setRecent] = useState<any[]>([])
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(true)
  const [websiteId, setWebsiteId] = useState<number | null>(null)
  const [websites, setWebsites] = useState<SourceWebsite[]>([])
  const [loadingWebsites, setLoadingWebsites] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [dashboardData, setDashboardData] = useState<any | null>(null)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const [appliedFilters, setAppliedFilters] = useState<LoadDashboardParams>({
    websiteId: null,
    fromDate: '',
    toDate: '',
    statusId: null,
  })

  type StatusKey = keyof typeof STATUS_MAP

  const onStatusClick = (statusId: number | null) => {
    setSelectedStatus(statusId)

    const newFilters = {
      ...appliedFilters,
      statusId,
    }
    console.log('newFilters onStatusClick', newFilters)
    setAppliedFilters(newFilters)
    loadDashboard(newFilters)
  }

  const loadDashboard = async (filters: LoadDashboardParams) => {
    try {
      setStatsLoading(true)
      setTableLoading(true)
      setError(null)

      const res = await fetchDashboard({
        website_id: filters.websiteId ?? undefined,
        from_date: filters.fromDate || undefined,
        to_date: filters.toDate || undefined,
        status_id: filters.statusId ?? undefined,
      })

      setDashboardData(res)

      const counts = mapStatusCounts(res.statusCounts ?? [])

      setStats({
        all: { label: 'Total Abstracts', value: res.total ?? 0, color: 'text-blue-600' },
        under: { label: 'Under Review', value: counts.under_review, color: 'text-orange-600' },
        accepted: { label: 'Accepted', value: counts.accepted, color: 'text-green-600' },
        oos: { label: 'Out of Scope', value: counts.out_of_scope, color: 'text-gray-600' },
        rejected: { label: 'Rejected', value: counts.rejected, color: 'text-red-600' },
        invoice: { label: 'Invoiced', value: counts.invoiced, color: 'text-purple-600' },
        registered: { label: 'Registered', value: counts.registered, color: 'text-green-600' },
        deleted: { label: 'Deleted', value: counts.deleted, color: 'text-red-600' },
      })

      setRecent(res.recentAbstracts ?? [])
    } catch (err) {
      console.error(err)
      setError('Unable to load dashboard data. Please try again.')
    } finally {
      setStatsLoading(false)
      setTableLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard(appliedFilters)
  }, [])

  function mapStatusCounts(statusCounts: any[]) {
    const map: Record<number, number> = {}

    statusCounts.forEach((s) => {
      map[s.status_id] = Number(s.count)
    })

    return {
      under_review: map[1] ?? 0,
      accepted: map[2] ?? 0,
      out_of_scope: map[3] ?? 0,
      rejected: map[4] ?? 0,
      invoiced: map[5] ?? 0,
      registered: map[6] ?? 0,
      deleted: map[7] ?? 0,
    }
  }

  useEffect(() => {
    let mounted = true

      ; (async () => {
        try {
          setLoadingWebsites(true)
          const data = await listWebsites()
          if (mounted) setWebsites(data)
        } finally {
          if (mounted) setLoadingWebsites(false)
        }
      })()

    return () => {
      mounted = false
    }
  }, [])

  const handleApplyFilters = () => {
    const newFilters = { websiteId, fromDate, toDate, statusId: null }
    setSelectedStatus(null)
    setAppliedFilters(newFilters)
    loadDashboard(newFilters)
    setIsFilterDrawerOpen(false)
  }

  const handleResetFilters = () => {
    const reset = { websiteId: null, fromDate: '', toDate: '', statusId: null }
    setWebsiteId(null)
    setFromDate('')
    setToDate('')
    setSelectedStatus(null)
    setAppliedFilters(reset)
    loadDashboard(reset)
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden space-y-4 text-left my-2">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </div>

      {/* Filter Drawer - Slide from Right */}
      {isFilterDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          {/* Drawer - Full Height */}
          <div className="fixed top-0 right-0 h-screen w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col animate-slide-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Filters
              </h2>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Website Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingWebsites}
                  value={websiteId ?? ''}
                  onChange={(e) =>
                    setWebsiteId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">
                    {loadingWebsites ? 'Loading websites…' : 'All Websites'}
                  </option>
                  {websites.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            {/* Drawer Footer - Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
        {(Object.keys(STATUS_MAP) as StatusKey[]).map((k) => {
          const card = stats[k]
          const statusId = STATUS_MAP[k]
          const isActive = selectedStatus === statusId

          let activeColor = ''
          if (statusId === null) {
            activeColor = 'bg-blue-200'
          } else if (statusId === 1) {
            activeColor = 'bg-orange-200'
          } else if (statusId === 2) {
            activeColor = 'bg-green-200'
          } else if (statusId === 3) {
            activeColor = 'bg-gray-200'
          } else if (statusId === 4) {
            activeColor = 'bg-red-200'
          } else if (statusId === 5) {
            activeColor = 'bg-purple-200'
          } else if (statusId === 6) {
            activeColor = 'bg-green-200'
          } else if (statusId === 7) {
            activeColor = 'bg-red-200'
          }

          return (
            <button
              key={k}
              onClick={() => onStatusClick(statusId)}
              className={`rounded-lg p-2 shadow-sm text-left transition cursor-pointer
                ${isActive ? activeColor : 'bg-white hover:bg-gray-50 border-gray-200'}
              `}
            >
              <div className="text-xs text-gray-700 text-center font-semibold">
                {card?.label}
              </div>
              <div className={`text-xl text-center font-semibold ${card?.color}`}>
                {statsLoading ? '—' : card?.value ?? 0}
              </div>
            </button>
          )
        })}
      </div>

      {/* Recent abstracts */}
      <div className="flex-1 min-h-[12rem] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 dark:border-gray-800">
          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Recent Abstracts  [{dashboardData?.recentAbstracts?.length}]</div>
          <button
            onClick={() => {
              setSelectedStatus(null)
              setRecent(dashboardData?.recentAbstracts ?? [])
              loadDashboard({
                websiteId,
                fromDate,
                toDate,
                statusId: null,
              })
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs hover:bg-gray-50 cursor-pointer"
          >
            Reload
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-1 font-bold text-gray-900">Website</th>
                <th className="px-4 py-1 font-bold text-gray-900 ">Name</th>
                <th className="px-0 py-1 font-bold text-gray-900 ">Email</th>
                <th className="px-1 py-1 font-bold text-gray-900 ">Country</th>
                <th className="px-2 py-1 font-bold text-gray-900">Submitted On</th>
                <th className="px-4 py-1 font-bold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              )}
              {!tableLoading && error && (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>
                    <div className="flex items-center justify-between">
                      <div className="text-red-600">{error}</div>
                      <button
                        onClick={() => {
                          setError(null)
                          loadDashboard({
                            websiteId,
                            fromDate,
                            toDate,
                            statusId: null,
                          })
                        }}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!tableLoading && !error && recent.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={6}>
                    No recent records
                  </td>
                </tr>
              )}
              {!tableLoading &&
                !error &&
                recent.map((r: any) => (

                  <tr key={r.id ?? r.uuid ?? r.email ?? `${r.website_id}-${r.now}`} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-1 text-gray-900 dark:text-gray-100 truncate max-w-[150px]" title={r.website_name ?? r.website?.name ?? '—'}>
                      {r.website_name ?? r.website?.name ?? '—'}
                    </td>
                    <td className="px-4 py-1 text-gray-900 truncate max-w-[150px]" title={r.name ?? ([r.user?.firstname, r.user?.lastname].filter(Boolean).join(' ') || '—')}>
                      {r.name ??
                        ([r.user?.firstname, r.user?.lastname].filter(Boolean).join(' ') ||
                          '—')}
                    </td>
                    <td className=" py-1 px-0 max-w-[150px] truncate" title={r.email ?? r.user?.useremail ?? '—'}>

                      <a href={`mailto:${r.email ?? r.user?.useremail ?? ''}`}
                        className="text-blue-600 hover:underline py-1 px-0"
                      >
                        {r.email ?? r.user?.useremail ?? '—'}
                      </a>
                    </td>
                    <td className="px-1 py-1 text-gray-900 dark:text-gray-100 truncate max-w-[100px]" title={r.country ?? '—'}>
                      {r.country ?? '—'}
                    </td>
                    <td className="px-2 py-1 text-gray-900 dark:text-gray-100 truncate max-w-[160px]" title={r.now ? formatDate(r.now ?? '') : '—'}>
                      {r.now ? formatDate(r.now ?? '') : '—'}
                    </td>
                    <td className="px-2 py-1" title={r.status?.actionType ?? 'Under Review'}>
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                          r.status?.actionType === 'Accepted'
                            ? 'bg-green-50 text-green-700'
                            : r.status?.actionType === 'Under Review'
                              ? 'bg-yellow-50 text-yellow-800 w-[6rem]'
                              : r.status?.actionType === 'Rejected'
                                ? 'bg-red-50 text-red-700'
                                : r.status?.actionType === 'Out of Scope'
                                  ? 'bg-gray-100 text-gray-700 w-[6rem]'
                                  : r.status?.actionType === 'Deleted'
                                    ? 'bg-gray-100 text-red-700'
                                    : 'bg-blue-50 text-blue-700',
                        ].join(' ')}
                      >
                        {r.status?.actionType ?? 'Under Review'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}