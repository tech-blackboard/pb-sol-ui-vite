import { useEffect, useState } from 'react'
import { searchAbstracts, type AbstractSearchParams } from '../services/abstracts'
import { formatDate } from '../utils/utils'

type StatCard = {
  label: string
  value: number | null
  color: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, StatCard>>({})
  const [recent, setRecent] = useState<any[]>([])

  async function load() {
    try {
      setLoading(true)
      setError(null)

      // Fetch totals by status in parallel
      const base: AbstractSearchParams = { page: 1, limit: 1 }
      const [allRes, underRes, accRes, rejRes, oosRes, recentRes] = await Promise.all([
        searchAbstracts({ ...base }),
        searchAbstracts({ ...base, status_id: 1 }),
        searchAbstracts({ ...base, status_id: 2 }),
        searchAbstracts({ ...base, status_id: 4 }),
        searchAbstracts({ ...base, status_id: 3 }),
        searchAbstracts({ page: 1, limit: 5, sortBy: 'now', sortOrder: 'DESC' }),
      ])

      const totalAll = allRes.total ?? allRes.items.length
      const totalUnder = underRes.total ?? underRes.items.length
      const totalAcc = accRes.total ?? accRes.items.length
      const totalRej = rejRes.total ?? rejRes.items.length
      const totalOos = oosRes.total ?? oosRes.items.length

      setStats({
        all: { label: 'Total Abstracts', value: totalAll, color: 'text-blue-600' },
        under: { label: 'Under Review', value: totalUnder, color: 'text-yellow-600' },
        accepted: { label: 'Accepted', value: totalAcc, color: 'text-green-600' },
        rejected: { label: 'Rejected', value: totalRej, color: 'text-red-600' },
        oos: { label: 'Out of Scope', value: totalOos, color: 'text-gray-600' },
      })

      setRecent(recentRes.items ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await load()
      if (!mounted) return
    })()
    return () => {
      mounted = false
    }
  }, [])

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {['all', 'under', 'accepted', 'rejected', 'oos'].map((k) => {
          const card = stats[k]
          return (
            <div key={k} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="text-xs text-gray-500">{card?.label ?? '—'}</div>
              <div className={`mt-1 text-2xl font-semibold ${card?.color ?? 'text-gray-900 dark:text-gray-100'}`}>
                {loading ? '—' : card?.value ?? 0}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent abstracts */}
      <div className="flex-1 min-h-[12rem] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="font-medium text-gray-900 dark:text-gray-100">Recent Abstracts</div>
          <button onClick={load} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50">Reload</button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted On</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>Loading...</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td className="px-4 py-6" colSpan={4}>
                    <div className="flex items-center justify-between">
                      <div className="text-red-600">{error}</div>
                      <button onClick={load} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50">Retry</button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && recent.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>No recent records</td>
                </tr>
              )}
              {!loading && !error && recent.map((r, idx) => (
                <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{r.name ?? (([r.user?.firstname, r.user?.lastname].filter(Boolean).join(' ')) || '—')}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${r.email ?? r.user?.useremail ?? ''}`} className="text-blue-600 hover:underline">
                      {r.email ?? r.user?.useremail ?? '—'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.organization ?? '—'}</td>
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
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{r.now ? formatDate(r.now ?? '') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


