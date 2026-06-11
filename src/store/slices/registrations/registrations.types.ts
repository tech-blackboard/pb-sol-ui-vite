import type { RegistrationItem } from '../../../services/registrations';

export interface RegistrationFilters {
    search?: string;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    institution?: string;
    presentation?: string;
    website_id?: number | string;
    status_flag?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    onlyDeleted?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface RegistrationsState {
    items: RegistrationItem[];
    rawItems: RegistrationItem[];
    selected: RegistrationItem | null;
    loading: boolean;
    editLoading?: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    draftFilters: RegistrationFilters;
    appliedFilters: RegistrationFilters;
}
