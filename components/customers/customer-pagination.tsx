"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PageSize } from "@/types/customer";

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 25, 50];

type CustomerPaginationProps = {
  page: number;
  totalPages: number;
  pageSize: PageSize;
  filteredCount: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
};

export function CustomerPagination({
  page,
  totalPages,
  pageSize,
  filteredCount,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}: CustomerPaginationProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page</span>
        <div className="flex items-center gap-1">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Button
              key={size}
              type="button"
              size="sm"
              variant={pageSize === size ? "default" : "outline"}
              onClick={() => onPageSizeChange(size)}
              aria-pressed={pageSize === size}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-muted-foreground">
          {filteredCount === 0 ? (
            "No results"
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-foreground">{startIndex}</span>–
              <span className="font-medium text-foreground">{endIndex}</span> of{" "}
              <span className="font-medium text-foreground">{filteredCount}</span>
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft data-icon="inline-start" />
            Prev
          </Button>
          <span
            className={cn(
              "min-w-20 text-center text-sm tabular-nums text-muted-foreground"
            )}
          >
            Page{" "}
            <span className="font-medium text-foreground">{page}</span> /{" "}
            {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
