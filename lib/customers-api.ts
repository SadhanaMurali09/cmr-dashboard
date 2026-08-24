/**
 * customers-api.ts
 *
 * Simulated customer API backed by localStorage (via customer-storage.ts).
 * Data now survives page refreshes. The in-memory mock store in
 * data/mock-customers.ts is only used as the seed for the first visit.
 *
 * All functions are async to keep the same interface expected by TanStack
 * Query and the mutation hooks — allowing a real HTTP backend to be swapped
 * in later with zero changes to the hooks layer.
 */

import type { Customer } from "@/types/customer";
import { loadCustomers, saveCustomers } from "@/lib/customer-storage";

const FETCH_DELAY_MS = 350;
const MUTATE_DELAY_MS = 200;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simulated customer API — localStorage-backed, no backend. */
export async function fetchCustomers(): Promise<Customer[]> {
  await delay(FETCH_DELAY_MS);
  return structuredClone(loadCustomers());
}

export type CustomerInput = Omit<Customer, "id" | "createdAt">;

/** Add a new customer. Persists to localStorage. Returns the full updated list. */
export async function addCustomer(data: CustomerInput): Promise<Customer[]> {
  await delay(MUTATE_DELAY_MS);

  const current = loadCustomers();
  const newCustomer: Customer = {
    ...data,
    id: `cus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [...current, newCustomer];
  saveCustomers(updated);
  return structuredClone(updated);
}

/** Update an existing customer. Persists to localStorage. Returns the full updated list. */
export async function updateCustomer(
  id: string,
  data: Partial<CustomerInput>
): Promise<Customer[]> {
  await delay(MUTATE_DELAY_MS);

  const updated = loadCustomers().map((c) =>
    c.id === id ? { ...c, ...data } : c
  );
  saveCustomers(updated);
  return structuredClone(updated);
}

/** Delete a customer by id. Persists to localStorage. Returns the full updated list. */
export async function deleteCustomer(id: string): Promise<Customer[]> {
  await delay(MUTATE_DELAY_MS);

  const updated = loadCustomers().filter((c) => c.id !== id);
  saveCustomers(updated);
  return structuredClone(updated);
}

/**
 * Persist a reordered customer list (e.g. after drag-and-drop).
 * Returns the persisted list.
 */
export async function reorderCustomers(
  ordered: Customer[]
): Promise<Customer[]> {
  await delay(MUTATE_DELAY_MS);
  saveCustomers(ordered);
  return structuredClone(ordered);
}
