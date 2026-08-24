import type {
  Customer,
  CustomerFilters,
  CustomerSortKey,
  CustomerStatus,
  PageSize,
  SortDirection,
} from "@/types/customer";


export function getCustomerInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatCustomerDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function filterCustomersBySearch(
  customers: Customer[],
  query: string
): Customer[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return customers;
  }

  return customers.filter((customer) => {
    const haystack = [customer.name, customer.email, customer.company]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function sortCustomers(
  customers: Customer[],
  sortKey: CustomerSortKey,
  sortDirection: SortDirection
): Customer[] {
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...customers].sort((a, b) => {
    const left = a[sortKey];
    const right = b[sortKey];

    if (sortKey === "lastContact") {
      return (
        (new Date(left).getTime() - new Date(right).getTime()) * direction
      );
    }

    return (
      String(left).localeCompare(String(right), undefined, {
        sensitivity: "base",
        numeric: true,
      }) * direction
    );
  });
}

export function paginateCustomers(
  customers: Customer[],
  page: number,
  pageSize: PageSize
) {
  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    pageItems: customers.slice(start, start + pageSize),
    totalPages,
    page: safePage,
    startIndex: customers.length === 0 ? 0 : start + 1,
    endIndex: Math.min(start + pageSize, customers.length),
  };
}

export function getCustomerStats(customers: Customer[]) {
  const byStatus = customers.reduce(
    (acc, customer) => {
      acc[customer.status] += 1;
      return acc;
    },
    {
      active: 0,
      inactive: 0,
      lead: 0,
      churned: 0,
    } satisfies Record<CustomerStatus, number>
  );

  return {
    total: customers.length,
    ...byStatus,
  };
}

/**
 * Applies advanced panel filters (status, company, date range, phone, email).
 * Returns all customers when every filter field is empty/unset.
 */
export function filterCustomersByAdvanced(
  customers: Customer[],
  filters: CustomerFilters
): Customer[] {
  const hasStatusFilter = filters.statuses.length > 0;
  const hasCompanyFilter = filters.companies.length > 0;
  const hasDateFrom = filters.dateFrom !== "";
  const hasDateTo = filters.dateTo !== "";
  const hasPhoneFilter = filters.phoneSearch.trim() !== "";
  const hasEmailFilter = filters.emailSearch.trim() !== "";

  // Short-circuit when nothing is filtered
  if (
    !hasStatusFilter &&
    !hasCompanyFilter &&
    !hasDateFrom &&
    !hasDateTo &&
    !hasPhoneFilter &&
    !hasEmailFilter
  ) {
    return customers;
  }

  const phoneLower = filters.phoneSearch.trim().toLowerCase();
  const emailLower = filters.emailSearch.trim().toLowerCase();
  const dateFrom = hasDateFrom ? new Date(filters.dateFrom) : null;
  // "To" date is inclusive — advance to end of that day
  const dateTo = hasDateTo
    ? new Date(new Date(filters.dateTo).getTime() + 86_400_000 - 1)
    : null;

  return customers.filter((c) => {
    if (hasStatusFilter && !filters.statuses.includes(c.status)) return false;
    if (hasCompanyFilter && !filters.companies.includes(c.company)) return false;

    const lastContact = new Date(c.lastContact);
    if (dateFrom && lastContact < dateFrom) return false;
    if (dateTo && lastContact > dateTo) return false;

    if (hasPhoneFilter && !c.phone.toLowerCase().includes(phoneLower))
      return false;
    if (hasEmailFilter && !c.email.toLowerCase().includes(emailLower))
      return false;

    return true;
  });
}
