/**
 * app/api/customers/reorder/route.ts
 *
 * POST /api/customers/reorder — persist a new full customer ordering.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { readCustomers, writeCustomers } from "@/lib/db";
import type { Customer } from "@/types/customer";

const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required").max(50),
  company: z.string().max(200).optional(),
  status: z.enum(["active", "inactive", "lead", "churned"]),
  lastContact: z.string().min(1, "Last contact date is required"),
  dealValue: z.number().nonnegative().optional(),
  dealCurrency: z.enum(["INR", "USD"]).optional(),
  notes: z.string().max(2000).optional(),
  createdAt: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = z.array(CustomerSchema).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const incoming = parsed.data;
    const current = await readCustomers();
    const currentById = new Map(current.map((customer) => [customer.id, customer]));

    const ordered: Customer[] = [];
    const seen = new Set<string>();

    for (const customer of incoming) {
      const existing = currentById.get(customer.id);
      if (!existing || seen.has(customer.id)) continue;

      ordered.push(existing);
      seen.add(customer.id);
    }

    const remaining = current.filter((customer) => !seen.has(customer.id));
    const updated = [...ordered, ...remaining];

    await writeCustomers(updated);
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to persist customer order";

    console.error("[POST /api/customers/reorder] Error:", message, err);

    if (message.includes("UPSTASH_REDIS_REST_URL") || message.includes("Database not configured")) {
      return NextResponse.json(
        {
          error:
            "Database not configured. Please set UPSTASH_REDIS_REST_URL and " +
            "UPSTASH_REDIS_REST_TOKEN in your Vercel environment variables.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
