"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCustomers } from "@/lib/customers-api";

export const customersQueryKey = ["customers"] as const;

export function useCustomers() {
  return useQuery({
    queryKey: customersQueryKey,
    queryFn: fetchCustomers,
    // Always consider data stale so mutations immediately trigger a refetch
    staleTime: 0,
    // Poll every 30 seconds — any customer added from another device
    // will appear within 30 seconds without a manual browser refresh.
    refetchInterval: 30_000,
    // Continue polling even when the browser tab is not focused
    refetchIntervalInBackground: false,
  });
}
