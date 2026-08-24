import { getMockCustomers, setMockCustomers } from "@/data/mock-customers";
import type { Customer } from "@/types/customer";

const FETCH_DELAY_MS = 350;
const MUTATE_DELAY_MS = 200;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simulated customer API — mock data only, no backend. */
export async function fetchCustomers(): Promise<Customer[]> {
  await delay(FETCH_DELAY_MS);
  return structuredClone(getMockCustomers());
}

export type CustomerInput = Omit<Customer, "id" | "createdAt">;

/** Add a new customer to the in-memory store. Returns the full updated list. */
export async function addCustomer(data: CustomerInput): Promise<Customer[]> {
  await delay(MUTATE_DELAY_MS);
  const newCustomer: Customer = {
    ...data,
    id: `cus_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  setMockCustomers([...getMockCustomers(), newCustomer]);
  return structuredClone(getMockCustomers());
}

/** Update an existing customer. Returns the full updated list. */
export async function updateCustomer(
  id: string,
  data: Partial<CustomerInput>
): Promise<Customer[]> {
  await delay(MUTATE_DELAY_MS);
  setMockCustomers(
    getMockCustomers().map((c) => (c.id === id ? { ...c, ...data } : c))
  );
  return structuredClone(getMockCustomers());
}

/** Delete a customer by id. Returns the full updated list. */
export async function deleteCustomer(id: string): Promise<Customer[]> {
  await delay(MUTATE_DELAY_MS);
  setMockCustomers(getMockCustomers().filter((c) => c.id !== id));
  return structuredClone(getMockCustomers());
}
