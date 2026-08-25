"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCustomers } from "@/lib/customers-api";

export const customersQueryKey = ["customers"] as const;

export function useCustomers() {
  return useQuery({
    queryKey: customersQueryKey,
    queryFn: fetchCustomers,
    staleTime: 0, // always read fresh — mutations use setQueryData to push updates instantly
  });
}
