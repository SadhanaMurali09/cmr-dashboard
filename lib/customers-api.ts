/**
 * lib/customers-api.ts
 *
 * Real HTTP client for the /api/customers route handlers.
 * All data is fetched from and persisted to the shared server-side JSON
 * database — not localStorage. This means all devices see the same data.
 *
 * The async interface is identical to the old mock version so the hooks
 * layer (use-customers.ts, use-customer-mutations.ts) requires no changes
 * to its call signatures.
 */

import type { Customer } from "@/types/customer";

export type CustomerInput = Omit<Customer, "id" | "createdAt">;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the API base URL correctly in both browser and server contexts.
 *
 * - In the browser: relative paths work fine ("/api/customers").
 * - During Next.js SSR/SSG: relative paths have no base, so we need an
 *   absolute URL. NEXT_PUBLIC_APP_URL must be set in production deployments.
 *   Falls back to http://localhost:3000 for local development.
 */
function apiBase(): string {
  if (typeof window !== "undefined") {
    // Client-side: use relative path — always resolves to the same origin
    return "";
  }
  // Server-side: must use absolute URL
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      // non-JSON error body — ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ─── GET /api/customers ───────────────────────────────────────────────────────

/** Fetch all customers from the shared server-side database. */
export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${apiBase()}/api/customers`, {
    // Always go to the server — never serve a stale cached response.
    cache: "no-store",
  });
  return handleResponse<Customer[]>(res);
}

// ─── POST /api/customers ──────────────────────────────────────────────────────

/**
 * Create a new customer.
 * Returns the newly created Customer object (with id + createdAt from server).
 */
export async function addCustomer(data: CustomerInput): Promise<Customer> {
  const res = await fetch(`${apiBase()}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Customer>(res);
}

// ─── PUT /api/customers/:id ───────────────────────────────────────────────────

/**
 * Update an existing customer by ID.
 * Returns the updated Customer object.
 */
export async function updateCustomer(
  id: string,
  data: Partial<CustomerInput>
): Promise<Customer> {
  const res = await fetch(`${apiBase()}/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Customer>(res);
}

// ─── DELETE /api/customers/:id ────────────────────────────────────────────────

/** Delete a customer by ID. Returns the deleted customer's id on success. */
export async function deleteCustomer(id: string): Promise<{ id: string }> {
  const res = await fetch(`${apiBase()}/api/customers/${id}`, {
    method: "DELETE",
  });
  return handleResponse<{ id: string }>(res);
}

// ─── Reorder (persist to shared server-side list order) ────────────────────

/**
 * Persist the new customer order to the shared server-side database so the
 * drag-and-drop reorder survives refreshes and other devices.
 */
export async function reorderCustomers(
  ordered: Customer[]
): Promise<Customer[]> {
  const res = await fetch(`${apiBase()}/api/customers/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ordered),
  });

  return handleResponse<Customer[]>(res);
}
