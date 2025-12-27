import { useEffect, useState } from 'react'
import { searchAbstracts, type AbstractSearchParams } from '../services/abstracts'
import { formatDate } from '../utils/utils'

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

  type StatusKey = keyof typeof STATUS_MAP

  async function loadStats() {
    try {
      setStatsLoading(true)
      setError(null)
      const base: AbstractSearchParams = { page: 1, limit: 1}

      const [
        allRes,
        underRes,
        accRes,
        rejRes,
        oosRes,
        invoiceRes,
        registeredRes,
      ] = await Promise.all([
        searchAbstracts({ ...base }),
        searchAbstracts({ ...base, status_id: 1 }),
        searchAbstracts({ ...base, status_id: 2 }),
        searchAbstracts({ ...base, status_id: 4 }),
        searchAbstracts({ ...base, status_id: 3 }),
        searchAbstracts({ ...base, status_id: 5 }),
        searchAbstracts({ ...base, status_id: 6 }),
      ])

      setStats({
        all: { label: 'Total Abstracts', value: allRes.total ?? 0, color: 'text-blue-600' },
        under: { label: 'Under Review', value: underRes.total ?? 0, color: 'text-yellow-600' },
        accepted: { label: 'Accepted', value: accRes.total ?? 0, color: 'text-green-600' },
        rejected: { label: 'Rejected', value: rejRes.total ?? 0, color: 'text-red-600' },
        oos: { label: 'Out of Scope', value: oosRes.total ?? 0, color: 'text-gray-600' },
        invoice: { label: 'Invoiced', value: invoiceRes.total ?? 0, color: 'text-purple-600' },
        registered: { label: 'Registered', value: registeredRes.total ?? 0, color: 'text-green-600' },
      })
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load stats')
    } finally {
      setStatsLoading(false)
    }
  }

  async function loadTable() {
    try {
      setTableLoading(true)
      setError(null)

      const res = await searchAbstracts({
        page: 1,
        limit: 5,
        sortBy: 'now',
        sortOrder: 'DESC',
        status_id: selectedStatus ?? undefined,
      })

      setRecent(res.items ?? [])
      setTableLoading(false)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load recent abstracts')
    } finally {
      setTableLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadTable()
  }, [selectedStatus])

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-auto space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            // Let the parent navigation handle switching; as a simple fallback, navigate by hash
            window.scrollTo({ top: 0 })
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          Refresh
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
      {(Object.keys(STATUS_MAP) as StatusKey[]).map((k) => {
          const card = stats[k]
          const statusId = STATUS_MAP[k]
          const isActive = selectedStatus === statusId
       
          return (
            <button
              key={k}
              onClick={() => setSelectedStatus(statusId)}
              className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm text-left transition cursor-pointer
        ${isActive ? 'ring-1 ring-blue-500' : 'hover:bg-gray-50'}
      `}
            >
              <div className="text-xs text-gray-500">{card?.label}</div>
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
          <button onClick={loadTable} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50">Reload</button>
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
                      <button onClick={loadTable} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50">Retry</button>
                    </div>
                  </td>
                </tr>
              )}
              {!tableLoading && !error && recent.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>No recent records</td>
                </tr>
              )}
              {!tableLoading && !error && recent.map((r, idx) => (
                <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{r.website?.name ?? '—'}</td>
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


