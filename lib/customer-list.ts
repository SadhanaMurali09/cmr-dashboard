import {
  filterCustomersByAdvanced,
  filterCustomersBySearch,
  paginateCustomers,
  sortCustomers,
} from "@/lib/customer-utils";
import type {
  Customer,
  CustomerFilters,
  CustomerSortKey,
  PageSize,
  SortDirection,
} from "@/types/customer";

export type CustomerListState = {
  search: string;
  sortKey: CustomerSortKey;
  sortDirection: SortDirection;
  page: number;
  pageSize: PageSize;
  filters: CustomerFilters;
};

export function processCustomerList(
  customers: Customer[],
  state: CustomerListState
) {
  // 1. Advanced panel filters first
  const advanced = filterCustomersByAdvanced(customers, state.filters);
  // 2. Text search on top of advanced results
  const filtered = filterCustomersBySearch(advanced, state.search);
  const sorted = sortCustomers(filtered, state.sortKey, state.sortDirection);
  const { pageItems, totalPages, page, startIndex, endIndex } =
    paginateCustomers(sorted, state.page, state.pageSize);

  return {
    filteredCount: filtered.length,
    totalCount: customers.length,
    pageItems,
    totalPages,
    page,
    startIndex,
    endIndex,
  };
}
