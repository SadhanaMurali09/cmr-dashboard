/**
 * lib/db.ts
 *
 * SERVER-SIDE ONLY — never import this in client components ("use client").
 *
 * Storage strategy (auto-detected at runtime):
 *
 *   PRODUCTION (Vercel / any host with UPSTASH_REDIS_REST_URL set)
 *   → Upstash Redis via REST API
 *   → Data is shared across all serverless function instances and all devices.
 *   → Env vars required: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 *   LOCAL DEVELOPMENT (no env vars)
 *   → Reads/writes data/customers.json on the filesystem
 *   → Works out of the box with no setup.
 */

import type { Customer } from "@/types/customer";
// Static import so the seed data is bundled at build time.
// On Vercel, fs.readFileSync() cannot access files outside the function bundle,
// so we must import the JSON directly — this is always available.
import seedData from "@/data/customers.json";


const REDIS_KEY = "crm:customers";

// ─── Upstash Redis helpers ────────────────────────────────────────────────────

// Vercel Upstash integration creates KV_REST_API_URL / KV_REST_API_TOKEN.
// Manual setup uses UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.
// We support both so the code works with either approach.
function getRedisUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}

function getRedisToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

function isRedisConfigured(): boolean {
  return !!getRedisUrl() && !!getRedisToken();
}

async function redisGet(): Promise<Customer[] | null> {
  const url = getRedisUrl()!;
  const token = getRedisToken()!;

  const res = await fetch(`${url}/get/${REDIS_KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[db/redis] GET failed:", res.status, await res.text());
    return null;
  }

  const json = (await res.json()) as { result: string | null };
  if (!json.result) return null;

  try {
    return JSON.parse(json.result) as Customer[];
  } catch {
    return null;
  }
}

async function redisSet(customers: Customer[]): Promise<void> {
  const url = getRedisUrl()!;
  const token = getRedisToken()!;

  // Upstash REST /set/{key} — POST body is the raw string VALUE to store.
  // We send a single JSON.stringify so the stored value is a valid JSON array
  // string that redisGet() can JSON.parse back to Customer[].
  // ⚠️ Do NOT double-stringify: JSON.stringify(JSON.stringify(...)) would store
  //    an extra layer of quotes and break the parse on GET.
  const serialised = JSON.stringify(customers);

  const res = await fetch(`${url}/set/${REDIS_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // text/plain tells Upstash to store the body as-is (a JSON string)
      "Content-Type": "text/plain",
    },
    body: serialised,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[db/redis] SET failed:", res.status, text);
    throw new Error(`Redis SET failed (${res.status}): ${text}`);
  }
}

// ─── Filesystem helpers (local dev only) ──────────────────────────────────────

function fsReadCustomers(): Customer[] {
  // Dynamic require so Next.js doesn't bundle 'fs' into client chunks
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");

  const DB_PATH = path.join(process.cwd(), "data", "customers.json");

  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Customer[]) : [];
  } catch {
    return [];
  }
}

function fsWriteCustomers(customers: Customer[]): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");

  const DB_PATH = path.join(process.cwd(), "data", "customers.json");
  const tmp = DB_PATH + ".tmp";

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(tmp, JSON.stringify(customers, null, 2), "utf-8");
  fs.renameSync(tmp, DB_PATH);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Read all customers from the configured storage backend.
 * Returns the seed data from customers.json if the store is empty.
 */
export async function readCustomers(): Promise<Customer[]> {
  if (isRedisConfigured()) {
    const data = await redisGet();

    if (data !== null) return data;

    // Redis is empty on first deploy — seed it from the bundled JSON.
    // We use the static import (not fsReadCustomers) so this works on Vercel
    // where the serverless function cannot access arbitrary filesystem paths.
    const seed = seedData as Customer[];
    if (seed.length > 0) {
      await redisSet(seed);
    }
    return seed;
  }

  // Local filesystem fallback (no Redis configured — development only)
  return fsReadCustomers();
}

/**
 * Persist the full customer list to the configured storage backend.
 */
export async function writeCustomers(customers: Customer[]): Promise<void> {
  if (isRedisConfigured()) {
    await redisSet(customers);
    return;
  }

  // On Vercel (and most serverless platforms) the filesystem is read-only.
  // If Redis is not configured, writes will throw EROFS which surfaces as a
  // confusing "Failed to create customer" 500 error.
  // Detect this case early and throw a descriptive error instead.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Database not configured: set UPSTASH_REDIS_REST_URL and " +
      "UPSTASH_REDIS_REST_TOKEN in your Vercel environment variables. " +
      "See .env.local.example for details."
    );
  }

  fsWriteCustomers(customers);
}
