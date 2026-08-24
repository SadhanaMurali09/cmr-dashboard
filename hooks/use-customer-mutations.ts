"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addCustomer,
  deleteCustomer,
  reorderCustomers,
  updateCustomer,
  type CustomerInput,
} from "@/lib/customers-api";
import type { Customer } from "@/types/customer";
import { customersQueryKey } from "@/hooks/use-customers";

// ─── Add Customer ─────────────────────────────────────────────────────────────

export function useAddCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerInput) => addCustomer(data),
    onSuccess: (updatedList: Customer[]) => {
      queryClient.setQueryData(customersQueryKey, updatedList);
      toast.success("Customer added", {
        description: "The new customer has been added to your directory.",
      });
    },
    onError: () => {
      toast.error("Failed to add customer", {
        description: "Something went wrong. Please try again.",
      });
    },
  });
}

// ─── Update Customer ──────────────────────────────────────────────────────────

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerInput> }) =>
      updateCustomer(id, data),
    onSuccess: (updatedList: Customer[]) => {
      queryClient.setQueryData(customersQueryKey, updatedList);
      toast.success("Customer updated", {
        description: "The customer's details have been saved.",
      });
    },
    onError: () => {
      toast.error("Failed to update customer", {
        description: "Something went wrong. Please try again.",
      });
    },
  });
}

// ─── Delete Customer ──────────────────────────────────────────────────────────

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (updatedList: Customer[]) => {
      queryClient.setQueryData(customersQueryKey, updatedList);
      toast.success("Customer deleted", {
        description: "The customer has been removed from your directory.",
      });
    },
    onError: () => {
      toast.error("Failed to delete customer", {
        description: "Something went wrong. Please try again.",
      });
    },
  });
}

// ─── Reorder Customers (Drag & Drop) ─────────────────────────────────────────

export function useReorderCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ordered: Customer[]) => reorderCustomers(ordered),
    onSuccess: (updatedList: Customer[]) => {
      queryClient.setQueryData(customersQueryKey, updatedList);
    },
    // Silent on error — drag order is cosmetic, don't distract user with toasts
    onError: () => {},
  });
}
