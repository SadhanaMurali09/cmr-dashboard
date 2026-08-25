/**
 * app/api/customers/route.ts
 *
 * GET  /api/customers  — return all customers from the shared JSON database
 * POST /api/customers  — validate, create, persist and return the new customer
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { readCustomers, writeCustomers } from "@/lib/db";
import type { Customer } from "@/types/customer";

// ─── Zod validation schema ────────────────────────────────────────────────────

const CustomerInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required").max(50),
  company: z.string().max(200).optional(),
  status: z.enum(["active", "inactive", "lead", "churned"]),
  lastContact: z.string().min(1, "Last contact date is required"),
  dealValue: z.number().positive().optional(),
  dealCurrency: z.enum(["INR", "USD"]).optional(),
  notes: z.string().max(2000).optional(),
});

// ─── GET /api/customers ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const customers = readCustomers();
    return NextResponse.json(customers, { status: 200 });
  } catch (err) {
    console.error("[GET /api/customers]", err);
    return NextResponse.json(
      { error: "Failed to load customers" },
      { status: 500 }
    );
  }
}

// ─── POST /api/customers ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    // Validate input
    const parsed = CustomerInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Generate a unique ID that won't collide even under concurrent requests
    const newCustomer: Customer = {
      ...data,
      id: `cus_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    // Read → append → write (server-side, atomic)
    const current = readCustomers();

    // Guard: do not allow duplicate emails
    const duplicate = current.find(
      (c) => c.email.toLowerCase() === newCustomer.email.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "A customer with this email already exists" },
        { status: 409 }
      );
    }

    const updated = [...current, newCustomer];
    writeCustomers(updated);

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (err) {
    console.error("[POST /api/customers]", err);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
