import { useState } from 'react'
import RegistrationFiltersDrawer from './RegistrationFiltersDrawer'
import RegistrationForm from './RegistrationForm'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchRegistrations } from '../../../store/slices/registrations/registrations.thunks'
import SectionHeader from '../../../components/SectionHeader'

export default function RegistrationHeader() {
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
