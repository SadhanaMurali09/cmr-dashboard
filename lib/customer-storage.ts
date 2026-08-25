/**
 * customer-storage.ts — DEPRECATED
 *
 * This module previously backed the CRM with localStorage-only persistence,
 * which prevented multi-device synchronisation.
 *
 * Customer data is now stored in data/customers.json on the server and served
 * exclusively through the Next.js API route handlers in app/api/customers/.
 *
 * This file is kept as an empty stub so that any stale import in the codebase
 * does not cause a build error. Remove it once all imports are cleaned up.
 *
 * DO NOT USE these functions — they are no-ops and will be removed.
 */

import type { Customer } from "@/types/customer";

/** @deprecated Data is now stored server-side. This is a no-op. */
export function loadCustomers(): Customer[] {
  console.warn(
    "[customer-storage] loadCustomers() is deprecated. Use /api/customers instead."
  );
  return [];
}

/** @deprecated Data is now stored server-side. This is a no-op. */
export function saveCustomers(_customers: Customer[]): void {
  console.warn(
    "[customer-storage] saveCustomers() is deprecated. Use /api/customers instead."
  );
}
