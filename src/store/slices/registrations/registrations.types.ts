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
    [key: string]: any;
}

export interface RegistrationsState {
    items: any[];
    rawItems: any[];
    selected: any | null;
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    draftFilters: RegistrationFilters;
    appliedFilters: RegistrationFilters;
}
