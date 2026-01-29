export interface RegistrationFilters {
    search?: string;
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
