import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { searchAbstracts, updateAbstractStatus, type AbstractSearchParams } from '../services/abstracts'
import { listWebsites, type SourceWebsite } from '../services/sourcedb'
import AbstractForm from '../components/AbstractForm';
import { formatDate } from '../utils/utils';
// adjust if your export name differs
export type AbstractRecord = {
  id: string
  name: string
  email: string
  altEmail?: string
  phone?: string
  whatsapp?: string
  city?: string
  title?: string
  message?: string
  country?: string
  university?: string
  presentationType?: 'Oral' | 'Poster' | 'Virtual' | 'Delegate'
  file?: string
  status: 'Under Review' | 'Accepted' | 'Out of Scope' | 'Rejected' | 'Registered'
  isEmailSent: boolean
}

type StatusAction = 'Under Review' | 'Accepted' | 'Out of Scope' | 'Rejected'

export default function AbstractsPage() {
  const [rows, setRows] = useState<AbstractRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawRows, setRawRows] = useState<any[]>([])
  const [viewItem, setViewItem] = useState<any | null>(null)
  const [modalStatus, setModalStatus] = useState<StatusAction>('Under Review')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [updating, setUpdating] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [serverTotal, setServerTotal] = useState<number>(0)
  const [serverTotalPages, setServerTotalPages] = useState<number>(1)
  const [websites, setWebsites] = useState<SourceWebsite[]>([])
  const [webLoading, setWebLoading] = useState(false)
  const [errKind, setErrKind] = useState<'none' | 'generic'>('none')

  const [filters, setFilters] = useState<AbstractSearchParams>({
    search: '',
    sortBy: 'now',
    sortOrder: 'DESC',
  })
  const [appliedFilters, setAppliedFilters] = useState<AbstractSearchParams>({
    search: '',
    sortBy: 'now',
    sortOrder: 'DESC',
  })
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false)
  // local toast state removed in favor of react-hot-toast
  const [showForm, setShowForm] = useState(false);
  const STATUS_TO_ID: Record<StatusAction, number> = {
    'Under Review': 1,
    Accepted: 2,
    'Out of Scope': 3,
    Rejected: 4,
  }

  const allowedStatuses: AbstractRecord['status'][] = [
    'Under Review',
    'Accepted',
    'Out of Scope',
    'Rejected',
    'Registered',
  ]

  function toPresentationType(v: any): AbstractRecord['presentationType'] {
    const map = String(v ?? '').toLowerCase()
    if (map.includes('oral')) return 'Oral'
    if (map.includes('poster')) return 'Poster'
    if (map.includes('virtual')) return 'Virtual'
    if (map.includes('delegate')) return 'Delegate'
    return undefined;
  }

  function normalize(item: any): AbstractRecord {
    const action = item?.status?.actionType
    const status = allowedStatuses.includes(action as any)
      ? (action as AbstractRecord['status'])
      : 'Under Review'

    return {
      id: String(item?.id ?? item?._id),
      name: item?.name ?? (([item?.user?.firstname, item?.user?.lastname].filter(Boolean).join(' ')) || 'Unnamed'),
      email: item?.email ?? item?.user?.useremail ?? '',
      altEmail: item?.aemail ?? undefined,
      phone: item?.phone ?? undefined,
      whatsapp: item?.wphone ?? undefined,
      country: item?.country ?? undefined,
      university: item?.organization ?? undefined,
      presentationType: toPresentationType(item?.intrested),
      file: item?.file ?? undefined,
      status,
      isEmailSent: item?.isEmailSent ?? false,
    }
  }

  async function fetchAll() {
    try {
      setLoading(true)
      setError(null)
      const { items, total, totalPages } = await searchAbstracts({ ...appliedFilters, page, limit: pageSize })
      setRawRows(items)
      let normalized = items.map(normalize)
      if (typeof appliedFilters.isEmailSent === 'boolean') {
        normalized = normalized.filter(r => !!r.isEmailSent === appliedFilters.isEmailSent)
      }
      setRows(normalized)
      setServerTotal(typeof total === 'number' ? total : items.length)
      setServerTotalPages(typeof totalPages === 'number' ? totalPages : Math.max(1, Math.ceil((total ?? items.length) / pageSize)))
    } catch (e: any) {
      setErrKind('none')
      setError(e?.message ?? 'Failed to load abstracts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
      ; (async () => {
        await fetchAll()
        if (!mounted) return
      })()
    return () => {
      mounted = false
    }
  }, [page, pageSize, appliedFilters])

  function applyFilters() {
    setPage(1)
    setAppliedFilters(filters)
  }

  function resetFilters() {
    const base: AbstractSearchParams = { search: '', sortBy: 'now', sortOrder: 'DESC' }
    setFilters(base)
    setAppliedFilters(base)
    setPage(1)
  }

  async function handleUpdateStatus() {
    if (!viewItem) return
    const norm = normalize(viewItem)
    if (modalStatus === (norm.status as StatusAction)) return
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) {
        setUpdateError('You are not signed in. Please sign in and try again.')
        return
      }
      setUpdating(true)
      setUpdateError(null)
      const statusId = STATUS_TO_ID[modalStatus]
      const updated = await updateAbstractStatus(norm.id, statusId)
      // Update raw rows
      setRawRows((prev) => {
        const idx = prev.findIndex((x) => String(x.id ?? x._id) === String(norm.id))
        if (idx === -1) return prev
        const next = prev.slice()
        next[idx] = updated
        return next
      })
      // Update normalized rows
      setRows((prev) => prev.map((r) => (r.id === norm.id ? normalize(updated) : r)))
      // Reflect in modal
      setViewItem(updated)
      // Success toast
      toast.success(`Status updated to ${modalStatus}`)
    } catch (e: any) {
      const code = e?.response?.status
      if (code === 401) setUpdateError('Unauthorized. Please sign in and try again.')
      else if (code === 403) setUpdateError('Forbidden. Your account lacks permission to update status.')
      else setUpdateError(e?.message ?? 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (viewItem) {
      setModalStatus(normalize(viewItem).status as StatusAction)
    }
  }, [viewItem])
  console.log(viewItem)
  const total = serverTotal || rows.length
  const totalPages = serverTotalPages || Math.max(1, Math.ceil(total / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + rows.length, total)



  function sendAcceptance(id: string) {
    // TODO: trigger backend to send acceptance letter PDF attachment
    alert(`Sent acceptance letter for ID ${id}`)
  }

  function sendInvoice(id: string) {
    // TODO: trigger backend invoice creation
    alert(`Invoice generated for ID ${id}`)
  }

  function remindPayment(id: string) {
    // TODO: trigger backend payment reminder email
    alert(`Payment reminder sent for ID ${id}`)
  }
  useEffect(() => {
    if (!filtersOpen) return
    let mounted = true
      ; (async () => {
        try {
          setWebLoading(true)
          const ws = await listWebsites()
          if (!mounted) return
          setWebsites(ws)
        } finally {
          setWebLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [filtersOpen])

  const modalFile = (() => {
    const f = typeof viewItem?.file === 'string' ? viewItem.file : ''
    if (!f) return null
    const isAbs = /^https?:\/\//i.test(f)
    const name = f.split('/').pop() || ''
    const base = (viewItem?.website?.link || '').replace(/\/$/, '/')
    const href = isAbs ? f : `${base}${f.startsWith('uploads') ? '' : 'uploads/'}${f}`
    return { href, name }
  })()

  // const  formatDate = (isoString: string) => {
  //   const date = new Date(isoString).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  //   return date;
  // }
  
  return (
    <div className="space-y-3 text-left h-full flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
  <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100">All Conferences — Abstracts</h2>
  
  {/* Button Group - Right Aligned */}
  <div className="flex items-center gap-2 w-full sm:w-auto">
    <button
      onClick={() => setShowForm(true)}
      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-md border border-purple-600 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 text-sm font-medium transition-colors"
      aria-label="Add abstract"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="hidden sm:inline">Add Abstract</span>
      <span className="sm:hidden">Add</span>
    </button>
    
    <button
      onClick={() => setFiltersOpen(true)}
      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
      aria-label="Open filters"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h14M3 12h10M3 18h6" />
      </svg>
      Filters
    </button>
  </div>
</div>

      <div className="relative flex-1 min-h-0 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin">

          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium min-w-[14rem]">Website</th>
                <th className="px-4 py-3 font-medium min-w-[14rem]">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Alternate Email</th>
                <th className="px-4 py-3 font-medium min-w-[10rem]">Phone</th>
                <th className="px-4 py-3 font-medium min-w-[10rem]">WhatsApp</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium min-w-[14rem]">University</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Presentation</th>
                <th className="px-4 py-3 font-medium">Abstract File</th>
                <th className="px-4 py-3 font-medium">Submitted On</th>
                <th className="px-4 py-3 font-medium">Email Sent</th>
                <th className="px-4 py-3 font-medium min-w-[10rem]">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
          
            <tbody className="align-top">
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={11}>
                    Loading...
                  </td>
                </tr>
              )}

            
              {!loading && error && errKind === 'generic' && (
                <tr>
                  <td className="px-4 py-6" colSpan={11}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-red-600">{error}</div>
                      <button
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                        onClick={fetchAll}
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && errKind === 'none' && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={11}>
                    No records found
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                rows.map((r: AbstractRecord) => {
                  const raw = rawRows.find((x) => String(x.id ?? x._id) === r.id)
                  const f: string | undefined = raw?.file
                  const isAbs = !!(f && /^https?:\/\//i.test(f))
                  const name = f ? (f.split('/').pop() || '') : ''
                  const base = (raw?.website?.link as string) || ''
                  const baseUrl = base.replace(/\/$/, '/')
                  const href = f ? (isAbs ? f : `${baseUrl}${f.startsWith('uploads') ? '' : 'uploads/'}${f}`) : undefined

                  return (
                    <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                       <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[16rem] truncate">{raw?.website?.name ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        <div className="max-w-[16rem] truncate">{r.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline">
                          {r.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[12rem] truncate">{r.altEmail ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[12rem] truncate">{r.phone ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[12rem] truncate">{raw?.wphone ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[12rem] truncate">{raw?.city ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[12rem] truncate">{raw?.country ?? '—'}</div>
                      </td>
                      
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[12rem] truncate">{raw?.organization ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[16rem] truncate">{raw?.title ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[16rem] truncate">{raw?.message ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[12rem] truncate">{raw?.intrested ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {href ? (
                          <a href={href} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                            {name}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="max-w-[12rem] truncate">{raw?.now ? formatDate(raw?.now) : '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                            r.isEmailSent ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700',
                          ].join(' ')}
                        >
                          {raw?.isEmailSent === true ? 'Yes' : raw?.isEmailSent === false ? 'No' : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            [
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                              r.status === 'Accepted'
                                ? 'bg-green-50 text-green-700'
                                : r.status === 'Under Review'
                                  ? 'bg-yellow-50 text-yellow-800'
                                  : r.status === 'Rejected'
                                    ? 'bg-red-50 text-red-700'
                                    : r.status === 'Out of Scope'
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-blue-50 text-blue-700',
                            ].join(' ')
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setViewItem(rawRows.find((x) => String(x.id ?? x._id) === r.id) ?? null)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs hover:bg-gray-50"
                            title="Edit"
                            aria-label="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L7.125 19.588l-3.682.409.409-3.682L16.862 3.487z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {!loading && !error && rows.length > 0 && (
          <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2 border-t border-gray-200 dark:border-gray-800 pointer-events-auto">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {total ? startIndex + 1 : 0}–{endIndex} of {total}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Rows</label>
              <select
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>

              </select>
              <div className="ml-2 flex items-center gap-1">
                <button
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  aria-label="First page"
                >
                  «
                </button>
                <button
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span className="px-2 text-sm text-gray-700 dark:text-gray-300">Page {page} / {totalPages}</span>
                <button
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
                <button
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  aria-label="Last page"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="text-base font-semibold">Filters</div>
              <button
                onClick={() => setFiltersOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6m0 12L6 6" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              <input
                type="search"
                value={filters.search ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Keyword search..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input type="text" value={filters.name ?? ''} onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))} placeholder="Name" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={filters.email ?? ''} onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={filters.organization ?? ''} onChange={(e) => setFilters((f) => ({ ...f, organization: e.target.value }))} placeholder="Organization" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={filters.country ?? ''} onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))} placeholder="Country" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {/* <input type="text" value={filters.city ?? ''} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} placeholder="City" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /> */}
              <input type="text" value={filters.title ?? ''} onChange={(e) => setFilters((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status_id ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, status_id: e.target.value ? Number(e.target.value) : undefined }))}
                >
                  <option value="">Status</option>
                  <option value={1}>Under Review</option>
                  <option value={2}>Accepted</option>
                  <option value={3}>Out of Scope</option>
                  <option value={4}>Rejected</option>
                </select>
                <div className="flex items-center gap-2">
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.website_id ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        website_id: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    disabled={webLoading}
                  >
                    <option value="">{webLoading ? 'Loading websites…' : 'Website'}</option>
                    {websites.map((w) => (
                      <option key={w.id} value={Number(w.id)}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select className="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.sortBy ?? 'now'} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}>
                  <option value="now">Sort by time</option>
                  <option value="name">Sort by name</option>
                </select>
                <select className="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.sortOrder ?? 'DESC'} onChange={(e) => setFilters((f) => ({ ...f, sortOrder: e.target.value as 'ASC' | 'DESC' }))}>
                  <option value="DESC">DESC</option>
                  <option value="ASC">ASC</option>
                </select>

                <select
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.isEmailSent === undefined ? '' : String(filters.isEmailSent)}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      isEmailSent:
                        e.target.value === ''
                          ? undefined
                          : e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined,
                    }))
                  }
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>

              </div>
            </div>
            <div className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
              <button onClick={resetFilters} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">Reset</button>
              <button onClick={() => { applyFilters(); setFiltersOpen(false) }} className="rounded-md border border-blue-600 bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700">Apply</button>
            </div>
          </aside>
        </div>
      )}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Abstract Details</h2>
              <button
                onClick={() => setViewItem(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6m0 12L6 6" />
                </svg>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-4 py-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">ID</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{String(viewItem.id ?? viewItem._id)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Website</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.website?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="text-blue-700 dark:text-blue-300">{viewItem.email ?? viewItem.user?.useremail}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Alternate Email</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.aemail ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Submitted On</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{formatDate(viewItem.now ?? '—')}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">WhatsApp</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.wphone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">City</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.city ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Country</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.country ?? '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 dark:text-gray-400">Organization</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.organization ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Title</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.title ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Message</dt>
                  <dd className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{viewItem.message ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Interested</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.intrested ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.status?.actionType ?? 'Under Review'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">isEmailSent</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.isEmailSent ?? false ? 'Yes' : 'No'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 dark:text-gray-400">Title</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.title ?? '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 dark:text-gray-400">Message</dt>
                  <dd className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{viewItem.message ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">File</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {modalFile ? (
                      <span>
                        <a href={modalFile.href} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                          {modalFile.name}
                        </a>
                      </span>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Website</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{viewItem.website?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Created By</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{[viewItem.user?.firstname, viewItem.user?.lastname].filter(Boolean).join(' ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">User Role</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {(viewItem?.user?.roles ?? [])
                      .map((r: any) => (typeof r === 'string' ? r : r?.name))
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Status</label>
                <select
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as StatusAction)}
                >
                  <option>Under Review</option>
                  <option>Accepted</option>
                  <option>Out of Scope</option>
                  <option>Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {updateError && <span className="text-xs text-red-600 mr-2">{updateError}</span>}
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || modalStatus === (normalize(viewItem).status as StatusAction)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs ${updating || modalStatus === (normalize(viewItem).status as StatusAction) ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-500-700'}`}
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => {
                    const norm = normalize(viewItem)
                    sendAcceptance(norm.id)
                  }}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs hover:bg-gray-50"
                >
                  Acceptance PDF
                </button>
                <button
                  onClick={() => {
                    const norm = normalize(viewItem)
                    sendInvoice(norm.id)
                  }}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs hover:bg-gray-50"
                >
                  Invoice
                </button>
                <button
                  onClick={() => {
                    const norm = normalize(viewItem)
                    remindPayment(norm.id)
                  }}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs hover:bg-gray-50"
                >
                  Payment Reminder
                </button>
                <button
                  onClick={() => setViewItem(null)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <p className="text-xs text-gray-500">
        Notes: Email alerts should trigger automatically for "Under Review" status; acceptance letters must include a PDF attachment. Add invoice and payment reminder integrations here. This UI is ready for wiring to backend APIs.
      </p>
      {showForm && <AbstractForm onClose={() => setShowForm(false)} onSuccess={fetchAll} />}
    </div>
  )
}