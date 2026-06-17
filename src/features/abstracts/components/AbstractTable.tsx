import type { AbstractItem } from '../../../services/abstracts'
import type { AbstractRecord } from '../types'
import AbstractRow from './AbstractRow'

interface Props {
  rows: AbstractRecord[]
  rawRows: AbstractItem[]
  loading: boolean
  onView: (item: AbstractItem | undefined) => void
  onRestore?: (item: AbstractItem) => void
  selectedIds?: number[]
  onSelect?: (id: number) => void
  onSelectAll?: (checked: boolean) => void
  hideCheckboxes?: boolean
}

export default function AbstractTable({
  rows,
  rawRows,
  loading,
  onView,
  onRestore,
  selectedIds = [],
  onSelect,
  onSelectAll,
  hideCheckboxes = false
}: Props) {
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  return (
    <div className="relative flex-1 min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 sticky top-0 ">
            <tr>
              <th className="px-3 py-2 w-10">
                  {!hideCheckboxes && (
                      <div className="flex items-center justify-center">
                          <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={(e) => onSelectAll?.(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                      </div>
                  )}
              </th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm min-w-[6.5rem] ">Actions</th>
              <th className="px-3 py-2 text-gray-700 font-semibold text-sm min-w-[14rem]">Website</th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm min-w-[14rem]">Name</th>
              <th className="px-1 py-2  text-gray-700 font-semibold text-sm">Email</th>
              <th className="px-4 py-2  text-gray-700 font-semibold text-sm min-w-[8rem] ">Status</th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm min-w-[8rem] ">Email Sent</th>
              <th className="px-1 py-2  text-gray-700 font-semibold text-sm">Alternate Email</th>
              <th className="px-4 py-2  text-gray-700 font-semibold text-sm min-w-[10rem]">Phone</th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm min-w-[10rem]">WhatsApp</th>
              <th className="px-1 py-2 text-gray-700 font-semibold text-sm">City</th>
              <th className="px-6 py-2  text-gray-700 font-semibold text-sm">Country</th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm min-w-[14rem]">University</th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm  min-w-[14rem] overflow-hidden">Title</th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm min-w-[14rem] overflow-hidden">Message</th>
              <th className="px-3 py-2   text-gray-700 font-semibold text-sm  min-w-[14rem] ">Presentation</th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm  min-w-[18rem] ">Abstract File</th>
              <th className="px-3 py-2  text-gray-700 font-semibold text-sm ">Submitted On</th>
            </tr>
          </thead>

          <tbody className="align-top">
            {loading && (
              <tr>
                <td colSpan={18} className="px-4 py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            )}



            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={18} className="px-4 py-6 text-gray-500">
                  No records found
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((r) => {
                const raw = rawRows.find(
                  (x) => String(x.id) === r.id
                )

                return (
                  <AbstractRow
                    key={r.id}
                    record={r}
                    raw={raw ?? null}
                    onView={() => onView(raw)}
                    onRestore={onRestore && raw ? () => onRestore(raw) : undefined}
                    isSelected={selectedIds.includes(Number(r.id))}
                    onToggleSelect={() => onSelect?.(Number(r.id))}
                    hideCheckboxes={hideCheckboxes}
                  />
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
