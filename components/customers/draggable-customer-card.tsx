"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { formatCustomerDate, getCustomerInitials } from "@/lib/customer-utils";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/customer";

interface DraggableCustomerCardProps {
  customer: Customer;
  onClick: (customer: Customer) => void;
  isDragOverlay?: boolean;
}

export function DraggableCustomerCard({
  customer,
  onClick,
  isDragOverlay = false,
}: DraggableCustomerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: customer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={cn(
        "group relative rounded-xl border border-border/80 bg-background/40 p-4",
        "transition-colors hover:border-primary/40 hover:bg-primary/5",
        isDragging && "opacity-40",
        isDragOverlay &&
          "shadow-2xl ring-1 ring-primary/40 bg-card opacity-95 cursor-grabbing"
      )}
    >
      {/* Drag handle — top right corner */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute right-3 top-3 rounded p-1",
          "text-muted-foreground/0 transition-all duration-150",
          "group-hover:text-muted-foreground hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "cursor-grab active:cursor-grabbing touch-none",
          isDragOverlay && "text-muted-foreground cursor-grabbing"
        )}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Clickable body */}
      <div
        className="cursor-pointer"
        onClick={() => {
          if (!isDragging) onClick(customer);
        }}
      >
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/15 text-primary">
                {getCustomerInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{customer.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {customer.company}
              </p>
            </div>
          </div>
          <CustomerStatusBadge status={customer.status} />
        </div>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          <p className="truncate">{customer.email}</p>
          <p>{customer.phone}</p>
          <p>Last contact {formatCustomerDate(customer.lastContact)}</p>
        </div>
      </div>
    </div>
  );
}
