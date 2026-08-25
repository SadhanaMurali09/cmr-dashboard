/**
 * customer-storage.ts
 *
 * localStorage-backed persistence layer for customer data.
 * All reads and writes go through this module so that data survives
 * page refreshes. Safe to import in Next.js App Router client components —
 * every access is guarded by a `typeof window !== "undefined"` check so
 * it never runs during SSR.
 */

import type { Customer } from "@/types/customer";
import { getMockCustomers } from "@/data/mock-customers";

const STORAGE_KEY = "crm_customers_v1";

/**
 * Returns true only when we are running inside a real browser environment.
 * This prevents any localStorage access during Next.js server-side rendering.
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Load the customer list from localStorage.
 * - On first visit (key not present) → seeds localStorage with the 36 mock
 *   customers and returns them.
 * - If the stored value is present but cannot be parsed (corrupted JSON) →
 *   falls back to the 36 mock customers so the app never breaks.
 * - During SSR (no window) → returns the 36 mock customers as a safe fallback;
 *   the client will hydrate with real localStorage data after mount.
 */
export function loadCustomers(): Customer[] {
  if (!isBrowser()) {
    // Server render — return seed data; client will re-fetch from localStorage.
    return getMockCustomers();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      // First visit — seed storage with the original 36 customers.
      const seed = getMockCustomers();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed as Customer[];
    }

    // Stored value is not a valid array — re-seed.
    const seed = getMockCustomers();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    // JSON.parse failed or localStorage is unavailable — fall back to seed.
    try {
      const seed = getMockCustomers();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    } catch {
      return getMockCustomers();
    }
  }

  // TypeScript control flow safety — unreachable in practice.
  return getMockCustomers();
}

/**
 * Persist the full customer list to localStorage.
 * Silently no-ops during SSR or if storage is full / unavailable.
 */
export function saveCustomers(customers: Customer[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch {
    // QuotaExceededError or similar — ignore; app still works in-memory.
  }
}
