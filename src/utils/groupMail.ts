import { openComposeModal } from '../store/slices/crm/crm.slice';

interface RecordWithWebsite {
    id?: number | string;
    email?: string;
    website_id?: number | string;
    website?: { id?: number | string; name?: string };
}

export function handleGroupMailClick<T extends RecordWithWebsite>({
    items,
    selectedIds,
    dispatch
}: {
    items: T[];
    selectedIds: (number | string)[];
    dispatch: any;
}) {
    if (selectedIds.length === 0) return;

    // Get selected records
    const selectedItems = items.filter(item => 
        item.id !== undefined && (selectedIds.includes(Number(item.id)) || selectedIds.includes(String(item.id)))
    );

    if (selectedItems.length === 0) return;

    // Helper to get website/conference ID as a consistent string
    const getConferenceId = (item: RecordWithWebsite) => {
        const id = item.website_id ?? item.website?.id;
        if (id === undefined || id === null || id === '') {
            return null;
        }
        return String(id);
    };

    // Helper to get website/conference Name as a consistent string
    const getConferenceName = (item: any) => {
        const name = item.website_name ?? item.website?.name;
        if (name === undefined || name === null || name === '') {
            return null;
        }
        return String(name).trim().toLowerCase();
    };

    // Check if the first record has a valid conference
    const firstWebsiteId = getConferenceId(selectedItems[0]);
    const firstWebsiteName = getConferenceName(selectedItems[0]);

    if (!firstWebsiteId && !firstWebsiteName) {
        const msg = "Selected records must belong to a valid conference.";
        if (typeof window !== 'undefined' && window.alert) {
            window.alert(msg);
        }
        return;
    }

    // Verify all selected records have the same website/conference
    const allSameConference = selectedItems.every(item => {
        const idMatches = !firstWebsiteId || getConferenceId(item) === firstWebsiteId;
        const nameMatches = !firstWebsiteName || getConferenceName(item) === firstWebsiteName;
        return idMatches && nameMatches;
    });

    if (!allSameConference) {
        const msg = "Please select records from the same conference only to send a group mail.";
        if (typeof window !== 'undefined' && window.alert) {
            window.alert(msg);
        }
        return;
    }

    // Extract unique email addresses
    const emails = selectedItems
        .map(item => item.email?.trim())
        .filter((email): email is string => !!email);

    if (emails.length === 0) {
        const msg = "No valid email addresses found in the selected records.";
        if (typeof window !== 'undefined' && window.alert) {
            window.alert(msg);
        }
        return;
    }

    const uniqueEmails = Array.from(new Set(emails));

    // Open Compose email modal with prefilled data
    dispatch(openComposeModal({
        to: uniqueEmails.join(', '),
        eventId: firstWebsiteId ? Number(firstWebsiteId) : null,
        disableDraft: true
    }));
}
