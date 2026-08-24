export type CustomerStatus = "active" | "inactive" | "lead" | "churned";

export type DealCurrency = "INR" | "USD";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  createdAt: string;
  lastContact: string;
  dealValue?: number;
  dealCurrency?: DealCurrency; // ₹ or $
  notes?: string;
}

export type CustomerSortKey =
  | "name"
  | "email"
  | "phone"
  | "company"
  | "status"
  | "lastContact";

export type SortDirection = "asc" | "desc";

export type PageSize = 10 | 25 | 50;

/** Shape of the advanced filter panel state */
export interface CustomerFilters {
  statuses: CustomerStatus[];
  companies: string[];
  dateFrom: string; // ISO date string "YYYY-MM-DD" or ""
  dateTo: string;   // ISO date string "YYYY-MM-DD" or ""
  phoneSearch: string;
  emailSearch: string;
}

export const EMPTY_FILTERS: CustomerFilters = {
  statuses: [],
  companies: [],
  dateFrom: "",
  dateTo: "",
  phoneSearch: "",
  emailSearch: "",
};

/** A named, persisted filter combination */
export interface SavedFilter {
  id: string;
  name: string;
  filters: CustomerFilters;
  createdAt: string;
}

