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

    onSuccess: (newCustomer: Customer) => {
      // Append the new customer to the cached list immediately so the UI
      // updates without waiting for the next poll cycle.
      queryClient.setQueryData<Customer[]>(
        customersQueryKey,
        (prev) => (prev ? [...prev, newCustomer] : [newCustomer])
      );
      // Invalidate so the next background refetch pulls fresh server data,
      // ensuring Dashboard stats and all devices stay in sync.
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });

      toast.success("Customer added", {
        description: "The new customer has been saved to the shared database.",
      });
    },

    onError: (err: Error) => {
      toast.error("Failed to add customer", {
        description: err.message || "Something went wrong. Please try again.",
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

    onSuccess: (updatedCustomer: Customer) => {
      // Replace only the updated customer in the cache
      queryClient.setQueryData<Customer[]>(
        customersQueryKey,
        (prev) =>
          prev?.map((c) =>
            c.id === updatedCustomer.id ? updatedCustomer : c
          ) ?? []
      );
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });

      toast.success("Customer updated", {
        description: "The customer's details have been saved.",
      });
    },

    onError: (err: Error) => {
      toast.error("Failed to update customer", {
        description: err.message || "Something went wrong. Please try again.",
      });
    },
  });
}

// ─── Delete Customer ──────────────────────────────────────────────────────────

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),

    onSuccess: (_result, id: string) => {
      // Optimistically remove the deleted customer from the cache
      queryClient.setQueryData<Customer[]>(
        customersQueryKey,
        (prev) => prev?.filter((c) => c.id !== id) ?? []
      );
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });

      toast.success("Customer deleted", {
        description: "The customer has been removed from the shared database.",
      });
    },

    onError: (err: Error) => {
      toast.error("Failed to delete customer", {
        description: err.message || "Something went wrong. Please try again.",
      });
    },
  });
}

// ─── Reorder Customers (Drag & Drop) ─────────────────────────────────────────

export function useReorderCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ordered: Customer[]) => reorderCustomers(ordered),

    onSuccess: (ordered: Customer[]) => {
      // Update cache with the reordered list (cosmetic — not persisted to server)
      queryClient.setQueryData(customersQueryKey, ordered);
    },

    // Silent on error — drag order is cosmetic, don't distract user with toasts
    onError: () => {},
  });
}
