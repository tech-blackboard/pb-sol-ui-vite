interface Props {
  page: number
  pageSize: number
  total: number
  totalPages: number
  rowsOnPage: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export default function AbstractPagination({
  page,
  pageSize,
  total,
  totalPages,
  rowsOnPage,
  onPageChange,
  onPageSizeChange,
}: Props) {
  if (total === 0) return null

  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + rowsOnPage, total)

  return (
    <div className="sticky bottom-0 bg-white/90 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2 border-t border-gray-200">
      {/* LEFT: Showing X–Y of Z */}
      <div className="text-sm text-gray-600">
        Showing {total ? startIndex + 1 : 0}–{endIndex} of {total}
      </div>

      {/* RIGHT: Controls */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">Rows</label>

        <select
          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <div className="ml-2 flex items-center gap-1">
          <button
            className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            «
          </button>

          <button
            className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Prev
          </button>

          <span className="px-2 text-sm text-gray-700">
            Page {page} / {totalPages}
          </span>

          <button
            className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>

          <button
            className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            »
          </button>
        </div>
      </div>
    </div>
  )
}
