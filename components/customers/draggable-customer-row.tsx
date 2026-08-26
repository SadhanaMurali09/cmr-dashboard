"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCustomerDate, getCustomerInitials } from "@/lib/customer-utils";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/customer";

interface DraggableCustomerRowProps {
  customer: Customer;
  onClick: (customer: Customer) => void;
  isDragOverlay?: boolean;
}

export function DraggableCustomerRow({
  customer,
  onClick,
  isDragOverlay = false,
}: DraggableCustomerRowProps) {
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
    <TableRow
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={cn(
        "group cursor-pointer transition-colors hover:bg-primary/5",
        isDragging && "opacity-40 bg-muted/20",
        isDragOverlay &&
          "shadow-2xl ring-1 ring-primary/40 bg-card rounded-lg opacity-95 cursor-grabbing"
      )}
      onClick={() => {
        if (!isDragging) onClick(customer);
      }}
    >
      {/* Drag handle cell */}
      <TableCell className="w-8 pr-0 pl-3">
        <button
          {...attributes}
          {...listeners}
          type="button"
          aria-label={`Drag to reorder ${customer.name}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-md border border-border/60 bg-background/90 text-muted-foreground shadow-sm",
            "transition-all duration-150",
            "sm:h-8 sm:w-8 sm:border-transparent sm:bg-transparent sm:shadow-none",
            "group-hover:text-muted-foreground hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "cursor-grab active:cursor-grabbing touch-none select-none pointer-events-auto",
            isDragOverlay && "cursor-grabbing"
          )}
          style={{ touchAction: "none" }}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>

      {/* Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/15 text-primary">
              {getCustomerInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{customer.name}</span>
        </div>
      </TableCell>

      {/* Email */}
      <TableCell className="text-muted-foreground">{customer.email}</TableCell>

      {/* Phone */}
      <TableCell className="text-muted-foreground">{customer.phone}</TableCell>

      {/* Company */}
      <TableCell className="text-muted-foreground">{customer.company ?? ""}</TableCell>

      {/* Status */}
      <TableCell>
        <CustomerStatusBadge status={customer.status} />
      </TableCell>

      {/* Last Contact */}
      <TableCell className="text-muted-foreground">
        {formatCustomerDate(customer.lastContact)}
      </TableCell>
    </TableRow>
  );
}
