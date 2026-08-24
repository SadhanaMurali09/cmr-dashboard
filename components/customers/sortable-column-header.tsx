"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerSortKey, SortDirection } from "@/types/customer";

type SortableColumnHeaderProps = {
  label: string;
  column: CustomerSortKey;
  activeColumn: CustomerSortKey;
  direction: SortDirection;
  onSort: (column: CustomerSortKey) => void;
  className?: string;
};

export function SortableColumnHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  className,
}: SortableColumnHeaderProps) {
  const isActive = activeColumn === column;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onSort(column)}
      className={cn(
        "-ml-2 h-8 gap-1.5 px-2 font-medium text-foreground hover:bg-muted/60",
        className
      )}
    >
      {label}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="size-3.5 text-primary" />
        ) : (
          <ArrowDown className="size-3.5 text-primary" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 text-muted-foreground/70" />
      )}
    </Button>
  );
}
