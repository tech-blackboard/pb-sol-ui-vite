import { useState } from 'react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchContacts, setPage, setPageSize, setSelected, clearSelected } from '../../../store/slices/contacts/contacts.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import ContactTable from '../components/ContactTable'
import ContactDetailsModal from '../components/ContactDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import ContactFiltersDrawer from '../components/ContactFiltersDrawer'
import ContactForm from '../components/ContactForm'

export default function ContactsPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.contacts)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [contactFormOpen, setContactFormOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchContacts({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <SectionHeader
                title="All Conferences — Contact Requests"
                onFilterClick={() => setFiltersOpen(true)}
                onAddClick={() => setContactFormOpen(true)}
                addButtonText="Add Contact"
            />

            {filtersOpen && (
                <ContactFiltersDrawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />
            )}

            {contactFormOpen && (
                <ContactForm
                    onClose={() => setContactFormOpen(false)}
                    onSuccess={() => dispatch(fetchContacts({ filters: appliedFilters, page, limit: pageSize }))}
                />
            )}

            <ContactTable
                rows={items}
                loading={loading}
                error={error}
                onRetry={() => dispatch(fetchContacts({ filters: appliedFilters, page, limit: pageSize }))}
                onView={(item) => dispatch(setSelected(item))}
            />

            <AbstractPagination
                totalPages={Math.ceil(total / pageSize)}
                rowsOnPage={pageSize}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => dispatch(setPage(p))}
                onPageSizeChange={(s) => dispatch(setPageSize(s))}
            />

            {selected && (
                <ContactDetailsModal
                    item={selected}
                    onClose={() => dispatch(clearSelected())}
                />
            )}
        </div>
    )
}
