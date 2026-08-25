/**
 * app/api/customers/[id]/route.ts
 *
 * PUT    /api/customers/:id  — update an existing customer's fields
 * DELETE /api/customers/:id  — permanently remove a customer
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { readCustomers, writeCustomers } from "@/lib/db";

// ─── Zod partial update schema ────────────────────────────────────────────────

const CustomerUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(50).optional(),
  company: z.string().max(200).optional(),
  status: z.enum(["active", "inactive", "lead", "churned"]).optional(),
  lastContact: z.string().optional(),
  dealValue: z.number().positive().optional(),
  dealCurrency: z.enum(["INR", "USD"]).optional(),
  notes: z.string().max(2000).optional(),
});

// ─── Route context type ───────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ id: string }> };

// ─── PUT /api/customers/:id ───────────────────────────────────────────────────

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const body: unknown = await request.json();
    const parsed = CustomerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const customers = readCustomers();
    const index = customers.findIndex((c) => c.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: `Customer '${id}' not found` },
        { status: 404 }
      );
    }

    // Merge only the provided fields (undefined fields are ignored by spread)
    const updatedCustomer = { ...customers[index], ...parsed.data };
    const updated = [...customers];
    updated[index] = updatedCustomer;

    writeCustomers(updated);

    return NextResponse.json(updatedCustomer, { status: 200 });

  } catch (err) {
    console.error("[PUT /api/customers/:id]", err);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/customers/:id ────────────────────────────────────────────────

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const customers = readCustomers();
    const exists = customers.some((c) => c.id === id);

    if (!exists) {
      return NextResponse.json(
        { error: `Customer '${id}' not found` },
        { status: 404 }
      );
    }

    const updated = customers.filter((c) => c.id !== id);
    writeCustomers(updated);

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/customers/:id]", err);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
