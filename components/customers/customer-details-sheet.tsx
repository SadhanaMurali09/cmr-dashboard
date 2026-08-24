"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  CheckCheck,
  Copy,
  IndianRupee,
  FileText,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { formatCustomerDate, getCustomerInitials } from "@/lib/customer-utils";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/customer";

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      className="ml-1 inline-flex items-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? (
        <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  copyable,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 flex items-center gap-1 font-medium text-foreground break-all">
          {value}
          {copyable && <CopyButton value={value} />}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CustomerDetailsSheetProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerDetailsSheet({
  customer,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CustomerDetailsSheetProps) {
  if (!customer) return null;

  const initials = getCustomerInitials(customer.name);
  const lastContactFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(customer.lastContact));

  const createdFormatted = formatCustomerDate(customer.createdAt);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border/60 px-6 py-5 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="text-lg leading-tight">
                  {customer.name}
                </SheetTitle>
                <p className="mt-0.5 text-sm text-muted-foreground truncate">
                  {customer.company || "—"}
                </p>
                <div className="mt-2">
                  <CustomerStatusBadge status={customer.status} />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Contact Information */}
          <SectionCard title="Contact Information" icon={User}>
            <InfoRow
              icon={User}
              label="Full Name"
              value={customer.name}
              copyable
            />
            <InfoRow
              icon={Mail}
              label="Email Address"
              value={customer.email}
              copyable
            />
            <InfoRow
              icon={Phone}
              label="Phone Number"
              value={customer.phone}
              copyable
            />
          </SectionCard>

          {/* Company & Status */}
          <SectionCard title="Company & Status" icon={Building2}>
            <InfoRow
              icon={Building2}
              label="Company"
              value={customer.company || "—"}
            />
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Badge className="h-3 w-3 rounded-full border-0 p-0 bg-transparent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <div className="mt-1">
                  <CustomerStatusBadge status={customer.status} />
                </div>
              </div>
            </div>
            {customer.dealValue != null && (
              <InfoRow
                icon={IndianRupee}
                label="Deal Value"
                value={new Intl.NumberFormat(
                  customer.dealCurrency === "USD" ? "en-US" : "en-IN",
                  {
                    style: "currency",
                    currency: customer.dealCurrency ?? "INR",
                    maximumFractionDigits: 0,
                  }
                ).format(customer.dealValue)}
              />
            )}
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Timeline" icon={Calendar}>
            <InfoRow
              icon={Calendar}
              label="Last Contact"
              value={lastContactFormatted}
            />
            <InfoRow
              icon={Calendar}
              label="Customer Since"
              value={createdFormatted}
            />
          </SectionCard>

          {/* Notes & Interactions */}
          <SectionCard title="Notes & Interactions" icon={FileText}>
            {customer.notes ? (
              <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-foreground/80">
                {customer.notes}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No notes recorded for this customer.
              </p>
            )}
          </SectionCard>
        </div>

        {/* Footer actions */}
        <div
          className={cn(
            "shrink-0 border-t border-border/60 bg-background/80 px-6 py-4",
            "flex items-center justify-between gap-3"
          )}
        >
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => onDelete(customer)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => onEdit(customer)}
          >
            <Pencil className="h-4 w-4" />
            Edit Customer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
