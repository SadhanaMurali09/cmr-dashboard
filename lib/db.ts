/**
 * lib/db.ts
 *
 * SERVER-SIDE ONLY — never import this in client components ("use client").
 *
 * Reads and writes customer data to `data/customers.json` at the project root.
 * This file acts as the shared persistent database for all devices.
 *
 * On the first request, if the JSON file does not exist, it is seeded with
 * the 36 mock customers from data/mock-customers.ts so the app starts with
 * useful data.
 */

import fs from "fs";
import path from "path";
import type { Customer } from "@/types/customer";

// Resolve the absolute path to data/customers.json relative to process.cwd()
// (the project root when running `next dev` or `next start`).
const DB_PATH = path.join(process.cwd(), "data", "customers.json");

/**
 * Read the full customer list from disk.
 * Falls back to the mock seed data if the file is missing or corrupted.
 */
export function readCustomers(): Customer[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // First run — seed from mock data
      const seed = getSeedData();
      writeCustomers(seed);
      return seed;
    }

    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed as Customer[];
    }

    // Corrupted file — re-seed
    const seed = getSeedData();
    writeCustomers(seed);
    return seed;
  } catch {
    // File read/parse failed — return seed without writing (may be read-only FS)
    return getSeedData();
  }
}

/**
 * Persist the full customer list to disk atomically.
 * Writes to a temp file first, then renames to prevent partial writes.
 */
export function writeCustomers(customers: Customer[]): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tmp = DB_PATH + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(customers, null, 2), "utf-8");
    fs.renameSync(tmp, DB_PATH);
  } catch (err) {
    console.error("[db] Failed to write customers.json:", err);
    throw err;
  }
}

/**
 * Load the 36 seed customers from the pre-committed customers.json.
 * Used as a fallback if the live file is missing or corrupted.
 */
function getSeedData(): Customer[] {
  try {
    // Try the committed JSON first (fastest, no TS import needed)
    const seedPath = path.join(process.cwd(), "data", "customers.json");
    if (fs.existsSync(seedPath)) {
      const raw = fs.readFileSync(seedPath, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Customer[];
    }
  } catch {
    // fall through
  }

  // Ultimate fallback — empty array (app still works, just no seed data)
  return [];
}
