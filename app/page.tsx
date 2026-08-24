"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { OverviewCards } from "@/components/dashboard/overview-cards";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCustomers } from "@/hooks/use-customers";
import {
  formatCustomerDate,
  getCustomerInitials,
} from "@/lib/customer-utils";

export default function DashboardPage() {
  // Single source of truth — same TanStack Query cache used by the Customers page.
  // When a customer is added/edited/deleted, the query cache is updated and this
  // component automatically re-renders with the fresh data.
  const { data: customers = [] } = useCustomers();

  const recentCustomers = [...customers]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <DashboardShell
      title="Dashboard"
      description="Overview of your customer relationships"
    >
      <div className="space-y-6">
        {/* OverviewCards now receives live data from TanStack Query */}
        <OverviewCards customers={customers} />

        <Card className="bg-card/80">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>
                Newest accounts added to your workspace.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/customers">
                View all
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/30 px-3 py-3 sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {getCustomerInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {customer.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {customer.company} · {formatCustomerDate(customer.createdAt)}
                    </p>
                  </div>
                </div>
                <CustomerStatusBadge status={customer.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
