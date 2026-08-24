"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BookmarkIcon,
  CalendarIcon,
  ChevronDownIcon,
  GripVertical,
  MailIcon,
  PhoneIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UserCheckIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCustomerFilters } from "@/hooks/use-customer-filters";
import { cn } from "@/lib/utils";
import type { Customer, CustomerStatus, SavedFilter } from "@/types/customer";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: CustomerStatus; label: string; color: string }[] =
  [
    { value: "active",   label: "Active Customer",   color: "bg-emerald-500" },
    { value: "lead",     label: "Lead",               color: "bg-sky-500"     },
    { value: "inactive", label: "Inactive Customer",  color: "bg-slate-400"  },
    { value: "churned",  label: "Archive",             color: "bg-rose-500"   },
  ];

// ─── Props ──────────────────────────────────────────────────────────────────────

type AdvancedFilterPanelProps = {
  customers: Customer[];
  hook: ReturnType<typeof useCustomerFilters>;
};

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

// ─── Sortable filter pill (user-saved only) ────────────────────────────────────

interface SortableFilterPillProps {
  sf: SavedFilter;
  onLoad: (sf: SavedFilter) => void;
  onDelete: (id: string) => void;
}

function SortableFilterPill({ sf, onLoad, onDelete }: SortableFilterPillProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: sf.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-full border pl-2 pr-2 py-1 text-xs font-medium text-foreground",
        "transition-all duration-150",
        isDragging
          ? "opacity-40 border-primary/30 bg-primary/5 shadow-none"
          : isOver
            ? "border-primary/60 bg-primary/15 shadow-md"
            : "border-border/70 bg-muted/40 hover:border-primary/50 hover:bg-primary/10"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder filter"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex items-center justify-center rounded p-0.5 -ml-0.5 shrink-0",
          "text-muted-foreground/0 transition-all duration-150",
          "group-hover:text-muted-foreground hover:text-foreground",
          "cursor-grab active:cursor-grabbing touch-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <GripVertical className="size-3" />
      </button>

      {/* Load button */}
      <button
        type="button"
        onClick={() => onLoad(sf)}
        className="leading-none focus:outline-none"
      >
        {sf.name}
      </button>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(sf.id)}
        className="ml-0.5 rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100 focus:outline-none"
        aria-label={`Delete saved filter "${sf.name}"`}
      >
        <XIcon className="size-2.5" />
      </button>
    </div>
  );
}

// ─── Static template pill (non-draggable) ─────────────────────────────────────

interface TemplatePillProps {
  sf: SavedFilter;
  onLoad: (sf: SavedFilter) => void;
}

function TemplatePill({ sf, onLoad }: TemplatePillProps) {
  return (
    <div className="group flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 pl-3 pr-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10">
      <button
        type="button"
        onClick={() => onLoad(sf)}
        className="leading-none focus:outline-none"
      >
        {sf.name}
      </button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function AdvancedFilterPanel({ customers, hook }: AdvancedFilterPanelProps) {
  const {
    filters,
    setFilters,
    savedFilters,
    activeFilterCount,
    isOpen,
    closePanel,
    clearFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    reorderSavedFilters,
  } = hook;

  const [saveNameInput, setSaveNameInput] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);

  // Unique company list derived from all customers
  const allCompanies = useMemo(
    () => [...new Set(customers.map((c) => c.company))].sort(),
    [customers]
  );

  // Separate templates (static) from user-defined (draggable)
  const templateFilters = useMemo(
    () => savedFilters.filter((sf) => sf.id.startsWith("tpl-")),
    [savedFilters]
  );
  const userFilters = useMemo(
    () => savedFilters.filter((sf) => !sf.id.startsWith("tpl-")),
    [savedFilters]
  );
  const userFilterIds = useMemo(() => userFilters.map((sf) => sf.id), [userFilters]);

  // dnd-kit sensors — pointer (desktop), touch (mobile), keyboard (a11y)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function toggleStatus(status: CustomerStatus) {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  }

  function toggleCompany(company: string) {
    setFilters((prev) => ({
      ...prev,
      companies: prev.companies.includes(company)
        ? prev.companies.filter((c) => c !== company)
        : [...prev.companies, company],
    }));
  }

  function handleSave() {
    if (!saveNameInput.trim()) return;
    saveFilter(saveNameInput);
    setSaveNameInput("");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderSavedFilters(String(active.id), String(over.id));
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closePanel()}>
      <SheetContent
        showCloseButton={false}
        side="right"
        className="flex w-full max-w-sm flex-col gap-0 border-l border-border/60 bg-card p-0 shadow-2xl sm:max-w-sm"
      >
        {/* ── Header ── */}
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontalIcon className="size-4 text-primary" />
              <SheetTitle className="text-base font-semibold">
                Advanced Filters
              </SheetTitle>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Filters apply in real-time and combine with search.
          </SheetDescription>
        </SheetHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">

          {/* ── Saved filters ── */}
          <div>
            <SectionLabel icon={BookmarkIcon}>Saved Filters</SectionLabel>

            <div className="flex flex-wrap gap-1.5">
              {/* Template pills — static, not draggable */}
              {templateFilters.map((sf) => (
                <TemplatePill key={sf.id} sf={sf} onLoad={loadFilter} />
              ))}

              {/* User-saved pills — draggable */}
              {userFilters.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={userFilterIds}
                    strategy={horizontalListSortingStrategy}
                  >
                    {userFilters.map((sf) => (
                      <SortableFilterPill
                        key={sf.id}
                        sf={sf}
                        onLoad={loadFilter}
                        onDelete={deleteFilter}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}

              {userFilters.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Save a filter below to see it here.
                </p>
              )}
            </div>
          </div>

          {/* ── Save current filter ── */}
          <div>
            <SectionLabel icon={BookmarkIcon}>Save Current Filter</SectionLabel>
            <div className="flex gap-2">
              <Input
                value={saveNameInput}
                onChange={(e) => setSaveNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="Filter name…"
                className="h-8 flex-1 bg-background/50 text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={!saveNameInput.trim()}
                className="h-8 shrink-0"
              >
                Save
              </Button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-border/50" />

          {/* ── Status filter ── */}
          <div>
            <SectionLabel icon={UserCheckIcon}>Status</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const checked = filters.statuses.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                      checked
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStatus(opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "size-2.5 rounded-full shrink-0",
                        opt.color
                      )}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Company filter ── */}
          <div>
            <SectionLabel icon={BookmarkIcon}>Company</SectionLabel>
            <button
              type="button"
              onClick={() => setCompanyOpen((p) => !p)}
              className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border"
            >
              <span>
                {filters.companies.length === 0
                  ? "Select companies…"
                  : `${filters.companies.length} selected`}
              </span>
              <ChevronDownIcon
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  companyOpen && "rotate-180"
                )}
              />
            </button>

            {companyOpen && (
              <div className="mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-border/60 bg-background/80 p-1 shadow-lg">
                {allCompanies.map((company) => {
                  const checked = filters.companies.includes(company);
                  return (
                    <label
                      key={company}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                        checked
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCompany(company)}
                        className="size-3.5 shrink-0 accent-primary"
                      />
                      <span className="truncate">{company}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Date range filter ── */}
          <div>
            <SectionLabel icon={CalendarIcon}>Last Contact Date</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                  }
                  className="h-8 bg-background/50 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  }
                  className="h-8 bg-background/50 text-sm"
                />
              </div>
            </div>
          </div>

          {/* ── Phone filter ── */}
          <div>
            <SectionLabel icon={PhoneIcon}>Phone Number</SectionLabel>
            <Input
              value={filters.phoneSearch}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, phoneSearch: e.target.value }))
              }
              placeholder="Partial match, e.g. +9179"
              className="h-8 bg-background/50 text-sm"
            />
          </div>

          {/* ── Email filter ── */}
          <div>
            <SectionLabel icon={MailIcon}>Email Address</SectionLabel>
            <Input
              value={filters.emailSearch}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, emailSearch: e.target.value }))
              }
              placeholder="Partial match, e.g. @gmail"
              className="h-8 bg-background/50 text-sm"
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border/60 bg-card px-5 py-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              <Trash2Icon className="size-3.5" />
              Clear All
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={closePanel}
            >
              Done
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
