import { useState } from 'react'
import AbstractFiltersDrawer from './AbstractFiltersDrawer'
import AbstractForm from '../../../components/AbstractForm'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchAbstracts } from '../../../store/slices/abstracts/abstracts.thunks'
import SectionHeader from '../../../components/SectionHeader'

interface AbstractHeaderProps {
  error?: string | null
  onClearError?: () => void
  onlyDeleted?: boolean
  onToggleDeleted?: () => void
  onExportClick?: () => void
  isExporting?: boolean
}

export default function AbstractHeader({ error, onClearError, onlyDeleted, onToggleDeleted, onExportClick, isExporting }: AbstractHeaderProps) {
  const [showForm, setShowForm] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const dispatch = useAppDispatch()

  const { page, pageSize } = useAppSelector((s) => s.abstracts)
  const appliedFilters = useAppSelector((s) => s.abstracts.appliedFilters)

  return (
    <>
      <SectionHeader
        title="All Conferences — Abstracts"
        onAddClick={() => setShowForm(true)}
        onFilterClick={() => setFiltersOpen(true)}
        addButtonText="Add Abstract"
        error={error}
        onClearError={onClearError}
        onlyDeleted={onlyDeleted}
        onToggleDeleted={onToggleDeleted}
        onExportClick={onExportClick}
        isExporting={isExporting}
      />

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
          onSuccess={() => {
            setShowForm(false)
            dispatch(fetchAbstracts({ filters: appliedFilters, page, limit: pageSize }))
          }}
        />
      )}
    </>
  )
}
