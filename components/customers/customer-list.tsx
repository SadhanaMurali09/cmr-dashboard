"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LoaderCircle, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";

import { AdvancedFilterPanel } from "@/components/customers/advanced-filter-panel";
import { CustomerDetailsSheet } from "@/components/customers/customer-details-sheet";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { CustomerPagination } from "@/components/customers/customer-pagination";
import { CustomerSearch } from "@/components/customers/customer-search";
import { DeleteConfirmDialog } from "@/components/customers/delete-confirm-dialog";
import { DraggableCustomerCard } from "@/components/customers/draggable-customer-card";
import { DraggableCustomerRow } from "@/components/customers/draggable-customer-row";
import { SortableColumnHeader } from "@/components/customers/sortable-column-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomerFilters } from "@/hooks/use-customer-filters";
import {
  useAddCustomer,
  useDeleteCustomer,
  useReorderCustomers,
  useUpdateCustomer,
} from "@/hooks/use-customer-mutations";
import { useCustomers } from "@/hooks/use-customers";
import { processCustomerList } from "@/lib/customer-list";
import {
  formatCustomerDate,
  getCustomerInitials,
} from "@/lib/customer-utils";
import { cn } from "@/lib/utils";
import type {
  Customer,
  CustomerSortKey,
  PageSize,
  SortDirection,
} from "@/types/customer";
import type { CustomerFormOutput } from "@/components/customers/customer-form-modal";

const SORTABLE_COLUMNS: { key: CustomerSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "company", label: "Company" },
  { key: "status", label: "Status" },
  { key: "lastContact", label: "Last Contact" },
];

export function CustomerList() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useCustomers();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<CustomerSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  const filterHook = useCustomerFilters();
  const { filters, activeFilterCount, openPanel } = filterHook;

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ── Drag state ───────────────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null);
  // Local manual order: array of IDs for the current page — overrides sort order display
  const [pageOrder, setPageOrder] = useState<string[]>([]);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const addMutation = useAddCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const reorderMutation = useReorderCustomers();

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // prevent accidental drag on click
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Customer list processing ─────────────────────────────────────────────────
  const customers = data ?? [];

  const listResult = useMemo(
    () =>
      processCustomerList(customers, {
        search,
        sortKey,
        sortDirection,
        page,
        pageSize,
        filters,
      }),
    [customers, search, sortKey, sortDirection, page, pageSize, filters]
  );

  // Sync pageOrder when the processed page items change (reset on filter/sort/search/page)
  useEffect(() => {
    setPageOrder(listResult.pageItems.map((c) => c.id));
  }, [listResult.pageItems]);

  // Derive displayed items — apply manual order on top of processed result
  const displayedItems = useMemo(() => {
    if (pageOrder.length === 0) return listResult.pageItems;
    const byId = Object.fromEntries(listResult.pageItems.map((c) => [c.id, c]));
    return pageOrder
      .filter((id) => id in byId)
      .map((id) => byId[id]);
  }, [pageOrder, listResult.pageItems]);

  // Reset page to 1 on search/pageSize/filter change
  useEffect(() => {
    setPage(1);
  }, [search, pageSize, filters]);

  useEffect(() => {
    if (page !== listResult.page) {
      setPage(listResult.page);
    }
  }, [listResult.page, page]);

  // The dragged customer (for DragOverlay)
  const activeCustomer = useMemo(
    () => displayedItems.find((c) => c.id === activeId) ?? null,
    [activeId, displayedItems]
  );

  // ── DnD handlers ────────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setPageOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Build the new full customer list with this page's order applied,
      // then persist it so the drag order survives a browser refresh.
      const byId = Object.fromEntries(customers.map((c) => [c.id, c]));
      const pageCustomers = reordered
        .filter((id) => id in byId)
        .map((id) => byId[id]);
      // Customers not on this page keep their relative order at the end.
      const otherCustomers = customers.filter(
        (c) => !reordered.includes(c.id)
      );
      reorderMutation.mutate([...pageCustomers, ...otherCustomers]);

      return reordered;
    });
  }

  // ── Sort handler ────────────────────────────────────────────────────────────
  function handleSort(column: CustomerSortKey) {
    if (sortKey === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDirection("asc");
    }
    setPage(1);
  }

  // ── Row click ───────────────────────────────────────────────────────────────
  function handleRowClick(customer: Customer) {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  function handleEditOpen(customer: Customer) {
    setSelectedCustomer(customer);
    setIsDetailsOpen(false);
    setIsEditOpen(true);
  }

  function handleEditSubmit(values: CustomerFormOutput) {
    if (!selectedCustomer) return;
    updateMutation.mutate(
      {
        id: selectedCustomer.id,
        data: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          company: values.company,
          status: values.status,
          lastContact: new Date(values.lastContact).toISOString(),
          dealValue: values.dealValue,
          dealCurrency: values.dealCurrency,
          notes: values.notes,
        },
      },
      { onSuccess: () => setIsEditOpen(false) }
    );
  }

  // ── Add ─────────────────────────────────────────────────────────────────────
  function handleAddSubmit(values: CustomerFormOutput) {
    addMutation.mutate(
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        company: values.company,
        status: values.status,
        lastContact: new Date(values.lastContact).toISOString(),
        dealValue: values.dealValue,
        dealCurrency: values.dealCurrency,
        notes: values.notes,
      },
      { onSuccess: () => setIsAddOpen(false) }
    );
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  function handleDeleteOpen(customer: Customer) {
    setSelectedCustomer(customer);
    setIsDetailsOpen(false);
    setIsDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!selectedCustomer) return;
    deleteMutation.mutate(selectedCustomer.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedCustomer(null);
      },
    });
  }

  const isDraggable = !isLoading && !isError && displayedItems.length > 1;
  const isFiltered = !!search || activeFilterCount > 0;

  return (
    <>
      <AdvancedFilterPanel customers={customers} hook={filterHook} />

      {/* ── Modals ── */}
      <CustomerDetailsSheet
        customer={selectedCustomer}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onEdit={handleEditOpen}
        onDelete={handleDeleteOpen}
      />

      <CustomerFormModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        mode="add"
        isPending={addMutation.isPending}
        onSubmit={handleAddSubmit}
      />

      <CustomerFormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        customer={selectedCustomer ?? undefined}
        isPending={updateMutation.isPending}
        onSubmit={handleEditSubmit}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        customerName={selectedCustomer?.name ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {/* ── Main card ── */}
      <Card className="bg-card/80">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>
                Search, sort, and paginate your customer records in real time.
                {!isFiltered && isDraggable && (
                  <span className="ml-1 text-primary/70">
                    · Drag rows to reorder.
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <LoaderCircle className="animate-spin" data-icon="inline-start" />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                Refresh
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsAddOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <CustomerSearch value={search} onChange={setSearch} />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openPanel}
                className={cn(
                  "relative h-10 shrink-0 gap-1.5 transition-colors",
                  activeFilterCount > 0 &&
                    "border-primary/60 bg-primary/10 text-primary hover:bg-primary/15"
                )}
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            <p className="shrink-0 text-sm text-muted-foreground">
              {isLoading ? (
                "Loading customers…"
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {listResult.filteredCount}
                  </span>{" "}
                  match{listResult.filteredCount === 1 ? "" : "es"} ·{" "}
                  <span className="font-medium text-foreground">
                    {listResult.totalCount}
                  </span>{" "}
                  total
                </>
              )}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              {/* ── Desktop skeleton table ── */}
              <div className="hidden overflow-hidden rounded-xl border border-border/70 lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-8 px-3" />
                      {SORTABLE_COLUMNS.map((col) => (
                        <TableHead key={col.key}>
                          <div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="w-8 pr-0 pl-3">
                          <div className="h-4 w-4 animate-pulse rounded bg-muted/60" />
                        </TableCell>
                        {/* Name */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted/60" />
                            <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
                          </div>
                        </TableCell>
                        {/* Email */}
                        <TableCell>
                          <div className="h-3 w-36 animate-pulse rounded bg-muted/60" />
                        </TableCell>
                        {/* Phone */}
                        <TableCell>
                          <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
                        </TableCell>
                        {/* Company */}
                        <TableCell>
                          <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          <div className="h-5 w-16 animate-pulse rounded-full bg-muted/60" />
                        </TableCell>
                        {/* Last Contact */}
                        <TableCell>
                          <div className="h-3 w-20 animate-pulse rounded bg-muted/60" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile skeleton cards ── */}
              <div className="space-y-3 lg:hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/80 bg-background/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted/60" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
                          <div className="h-2.5 w-20 animate-pulse rounded bg-muted/60" />
                        </div>
                      </div>
                      <div className="h-5 w-14 animate-pulse rounded-full bg-muted/60" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 w-40 animate-pulse rounded bg-muted/60" />
                      <div className="h-2.5 w-28 animate-pulse rounded bg-muted/60" />
                      <div className="h-2.5 w-32 animate-pulse rounded bg-muted/60" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : isError ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 text-center">
              <p className="text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load customers."}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              {/* ── Desktop + Mobile — single shared DndContext ── */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-xl border border-border/70 lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        {/* Extra th for drag handle column */}
                        <TableHead className="w-8 px-3" />
                        {SORTABLE_COLUMNS.map((column) => (
                          <TableHead key={column.key}>
                            <SortableColumnHeader
                              label={column.label}
                              column={column.key}
                              activeColumn={sortKey}
                              direction={sortDirection}
                              onSort={handleSort}
                            />
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-28 text-center text-muted-foreground"
                          >
                            No customers match your filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <SortableContext
                          items={pageOrder}
                          strategy={verticalListSortingStrategy}
                        >
                          {displayedItems.map((customer) => (
                            <DraggableCustomerRow
                              key={customer.id}
                              customer={customer}
                              onClick={handleRowClick}
                            />
                          ))}
                        </SortableContext>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {displayedItems.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      No customers match your filters.
                    </p>
                  ) : (
                    <SortableContext
                      items={pageOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      {displayedItems.map((customer) => (
                        <DraggableCustomerCard
                          key={customer.id}
                          customer={customer}
                          onClick={handleRowClick}
                        />
                      ))}
                    </SortableContext>
                  )}
                </div>

                {/* Unified DragOverlay — shows row ghost on desktop, card ghost on mobile */}
                <DragOverlay dropAnimation={{
                  duration: 200,
                  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                }}>
                  {activeCustomer ? (
                    <>
                      {/* Desktop ghost — table row wrapper */}
                      <div className="hidden lg:block">
                        <table className="w-full border-collapse">
                          <tbody>
                            <DraggableCustomerRow
                              customer={activeCustomer}
                              onClick={() => {}}
                              isDragOverlay
                            />
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile ghost — card */}
                      <div className="lg:hidden">
                        <DraggableCustomerCard
                          customer={activeCustomer}
                          onClick={() => {}}
                          isDragOverlay
                        />
                      </div>
                    </>
                  ) : null}
                </DragOverlay>
              </DndContext>

              <CustomerPagination
                page={listResult.page}
                totalPages={listResult.totalPages}
                pageSize={pageSize}
                filteredCount={listResult.filteredCount}
                startIndex={listResult.startIndex}
                endIndex={listResult.endIndex}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
