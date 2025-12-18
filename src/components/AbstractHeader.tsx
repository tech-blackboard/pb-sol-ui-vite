import { useState } from 'react'
import AbstractFiltersDrawer from '../components/AbstractFiltersDrawer'
import AbstractForm from '../components/AbstractForm'

export default function AbstractHeader() {
  const [showForm, setShowForm] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between my-3">
        {/* Title */}
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-100">
          All Conferences — Abstracts
        </h2>

        {/* Actions */}
        <div className="flex w-full sm:w-auto items-center gap-2">
          {/* Add Abstract */}
          <button
            onClick={() => setShowForm(true)}
            className="
              inline-flex flex-1 sm:flex-none
              items-center justify-center gap-2
              rounded-md border border-purple-600
              bg-purple-600 text-white
              px-3 py-2 text-sm font-medium
              hover:bg-purple-700 transition-colors
            "
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>

            <span className="hidden sm:inline">Add Abstract</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Filters (old page style, responsive) */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="
              inline-flex flex-1 sm:flex-none
              items-center justify-center gap-2
              rounded-md border border-gray-300
              bg-white px-3 py-2
              text-sm font-medium text-gray-700
              hover:bg-gray-50 transition-colors
            "
            aria-label="Open filters"
            title="Filters"
          >
            {/* Funnel icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 6h18M6 12h12M10 18h4"
              />
            </svg>

            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Filters Drawer */}
      {filtersOpen && (
        <AbstractFiltersDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />
      )}

      {/* Add Abstract Modal */}
      {showForm && (
        <AbstractForm
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </>
  )
}
