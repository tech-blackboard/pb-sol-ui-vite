import { useState } from 'react'
import RegistrationFiltersDrawer from './RegistrationFiltersDrawer'
import RegistrationForm from './RegistrationForm'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchRegistrations } from '../../../store/slices/registrations/registrations.thunks'
import SectionHeader from '../../../components/SectionHeader'

interface RegistrationHeaderProps {
    error?: string | null
    onClearError?: () => void
    onlyDeleted?: boolean
    onToggleDeleted?: () => void
    onExportClick?: () => void
    isExporting?: boolean
    selectedCount?: number
    onDeleteSelected?: () => void
    onGroupMailClick?: () => void
}

export default function RegistrationHeader({ error, onClearError, onlyDeleted, onToggleDeleted, onExportClick, isExporting, selectedCount, onDeleteSelected, onGroupMailClick }: RegistrationHeaderProps) {
    const [showForm, setShowForm] = useState(false)
    const [filtersOpen, setFiltersOpen] = useState(false)

    const dispatch = useAppDispatch()

    const { page, pageSize, appliedFilters } = useAppSelector((s) => s.registrations)

    return (
        <>
            <SectionHeader
                title="All Conferences — Registrations"
                onAddClick={() => setShowForm(true)}
                onFilterClick={() => setFiltersOpen(true)}
                addButtonText="Add Registration"
                error={error}
                onClearError={onClearError}
                onlyDeleted={onlyDeleted}
                onToggleDeleted={onToggleDeleted}
                onExportClick={onExportClick}
                isExporting={isExporting}
                selectedCount={selectedCount}
                onDeleteSelected={onDeleteSelected}
                onGroupMailClick={onGroupMailClick}
            />

            {/* Filters Drawer */}
            {filtersOpen && (
                <RegistrationFiltersDrawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />
            )}

            {/* Add Registration Modal */}
            {showForm && (
                <RegistrationForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false)
                        dispatch(fetchRegistrations({ filters: appliedFilters, page, limit: pageSize }))
                    }}
                />
            )}
        </>
    )
}
