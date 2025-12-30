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

  type StatusKey = keyof typeof STATUS_MAP

  const onStatusClick = (statusId: number | null) => {
    setSelectedStatus(statusId)

    fetchDashboard({
      website_id: websiteId ?? undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      status_id: statusId ?? undefined, // ✅ key line
    }).then((res) => {
      setDashboardData(res)
      setRecent(res.recentAbstracts ?? [])
    })
  }

  useEffect(() => {
    setStatsLoading(true)
    setTableLoading(true)
    setError(null)

    fetchDashboard({
      website_id: websiteId ?? undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,

    })
      .then((res) => {
        setDashboardData(res)

        const counts = mapStatusCounts(res.statusCounts ?? [])
        console.log('counts', counts)

        setStats({
          all: { label: 'Total Abstracts', value: res.total, color: 'text-blue-600' },
          under: { label: 'Under Review', value: counts.under_review, color: 'text-orange-600' },
          accepted: { label: 'Accepted', value: counts.accepted, color: 'text-green-600' },
          oos: { label: 'Out of Scope', value: counts.out_of_scope, color: 'text-gray-600' },
          rejected: { label: 'Rejected', value: counts.rejected, color: 'text-red-600' },
          invoice: { label: 'Invoiced', value: counts.invoiced, color: 'text-purple-600' },
          registered: { label: 'Registered', value: counts.registered, color: 'text-green-600' },
        })

        // default table
        setRecent(res.recentAbstracts ?? [])
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => {
        setStatsLoading(false)
        setTableLoading(false)
      })
  }, [websiteId, fromDate, toDate])


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

  useEffect(() => {
    if (!dashboardData) return

    if (selectedStatus === null) {
      setRecent(dashboardData.recentAbstracts ?? [])
    } else {
      setRecent(
        (dashboardData.recentAbstracts ?? []).filter(
          (r: any) => r.status?.id === selectedStatus
        )
      )
    }
  }, [selectedStatus, dashboardData])

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-auto space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setWebsiteId(null)
            setFromDate('')
            setToDate('')
            setSelectedStatus(null)
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
        >
          Refresh
        </a>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {/* Website */}
        <select
          className="
      w-full
      sm:max-w-xs
      rounded-md border border-gray-300 bg-white
      px-3 py-2 text-sm shadow-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500
    "
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

        {/* From date */}
        <input
          type="date"
          className="
      w-full
      rounded-md border border-gray-300 bg-white
      px-3 py-2 text-sm shadow-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500
    "
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        {/* To date */}
        <input
          type="date"
          className="
      w-full
      rounded-md border border-gray-300 bg-white
      px-3 py-2 text-sm shadow-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500
    "
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        {(Object.keys(STATUS_MAP) as StatusKey[]).map((k) => {
          const card = stats[k]
          const statusId = STATUS_MAP[k]
          const isActive = selectedStatus === statusId

          let activeColor = ''
          if (statusId === null) {
            activeColor = 'bg-blue-200'
          } else if (statusId === 1) {
            activeColor = 'bg-orange-200'
          }
          else if (statusId === 2) {
            activeColor = 'bg-green-200'
          } else if (statusId === 3) {
            activeColor = 'bg-gray-200'
          } else if (statusId === 4) {
            activeColor = 'bg-red-200'
          } else if (statusId === 5) {
            activeColor = 'bg-purple-200'
          } else if (statusId === 6) {
            activeColor = 'bg-green-200'
          }

          return (
            <button
              key={k}
              onClick={() => onStatusClick(statusId)}
              className={`rounded-lg  p-4 shadow-sm text-left transition cursor-pointer
              ${isActive
                  ? activeColor
                  : 'bg-white hover:bg-gray-50 border-gray-200'
                }
              
            `}
            >
              <div className="text-xs text-gray-700 font-semibold">
                {card?.label}
              </div>

              <div className={`mt-1 text-2xl font-semibold ${card?.color}`}>
                {statsLoading ? '—' : card?.value ?? 0}
              </div>
            </button>

          )
        })}
      </div>

      {/* Recent abstracts */}
      <div className="flex-1 min-h-[12rem] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="font-medium text-gray-900 dark:text-gray-100">Recent Abstracts</div>
          <button
            onClick={() => {
              setSelectedStatus(null)
              setRecent(dashboardData?.recentAbstracts ?? [])
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer"
          >
            Reload
          </button>

        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Submitted On</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>Loading...</td>
                </tr>
              )}
              {!tableLoading && error && (
                <tr>
                  <td className="px-4 py-6" colSpan={4}>
                    <div className="flex items-center justify-between">
                      <div className="text-red-600">{error}</div>
                      <button onClick={() => {
                        setError(null)
                        setRecent(dashboardData?.recentAbstracts ?? [])
                      }} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer">Retry</button>
                    </div>
                  </td>
                </tr>
              )}
              {!tableLoading && !error && recent.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>No recent records</td>
                </tr>
              )}
              {!tableLoading && !error && recent.map((r: any, idx: number) => (

                <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {r.website_name ?? r.website?.name ?? '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{r.name ?? (([r.user?.firstname, r.user?.lastname].filter(Boolean).join(' ')) || '—')}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${r.email ?? r.user?.useremail ?? ''}`} className="text-blue-600 hover:underline">
                      {r.email ?? r.user?.useremail ?? '—'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{r.country ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{r.now ? formatDate(r.now ?? '') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      r.status?.actionType === 'Accepted'
                        ? 'bg-green-50 text-green-700'
                        : r.status?.actionType === 'Under Review'
                          ? 'bg-yellow-50 text-yellow-800'
                          : r.status?.actionType === 'Rejected'
                            ? 'bg-red-50 text-red-700'
                            : r.status?.actionType === 'Out of Scope'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-blue-50 text-blue-700',
                    ].join(' ')}>
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


