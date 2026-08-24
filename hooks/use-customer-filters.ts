"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  EMPTY_FILTERS,
  type CustomerFilters,
  type CustomerStatus,
  type SavedFilter,
} from "@/types/customer";

const STORAGE_KEY = "crm-saved-filters";

/** Pre-built saved filter templates always available */
const DEFAULT_TEMPLATES: SavedFilter[] = [
  {
    id: "tpl-active",
    name: "Active Customers",
    createdAt: "2026-01-01T00:00:00.000Z",
    filters: { ...EMPTY_FILTERS, statuses: ["active"] as CustomerStatus[] },
  },
  {
    id: "tpl-recent",
    name: "Recent Contacts",
    createdAt: "2026-01-01T00:00:00.000Z",
    filters: {
      ...EMPTY_FILTERS,
      dateFrom: new Date(Date.now() - 30 * 86_400_000)
        .toISOString()
        .slice(0, 10),
    },
  },
  {
    id: "tpl-inactive-leads",
    name: "Inactive Leads",
    createdAt: "2026-01-01T00:00:00.000Z",
    filters: {
      ...EMPTY_FILTERS,
      statuses: ["inactive", "lead"] as CustomerStatus[],
    },
  },
];

function loadSavedFilters(): SavedFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedFilter[]) : [];
  } catch {
    return [];
  }
}

function persistSavedFilters(filters: SavedFilter[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // quota exceeded — silently ignore
  }
}

export function useCustomerFilters() {
  const [filters, setFilters] = useState<CustomerFilters>(EMPTY_FILTERS);
  const [userSaved, setUserSaved] = useState<SavedFilter[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load persisted user-saved filters on mount
  useEffect(() => {
    setUserSaved(loadSavedFilters());
  }, []);

  // Persist whenever user-saved list changes
  useEffect(() => {
    persistSavedFilters(userSaved);
  }, [userSaved]);

  /** All saved filters = templates + user-defined */
  const savedFilters = useMemo(
    () => [...DEFAULT_TEMPLATES, ...userSaved],
    [userSaved]
  );

  /** Count of active filter fields */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statuses.length > 0) count++;
    if (filters.companies.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.phoneSearch.trim()) count++;
    if (filters.emailSearch.trim()) count++;
    return count;
  }, [filters]);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const saveFilter = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const newEntry: SavedFilter = {
        id: `usr-${Date.now()}`,
        name: trimmed,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
      };
      setUserSaved((prev) => [...prev, newEntry]);
    },
    [filters]
  );

  const loadFilter = useCallback((saved: SavedFilter) => {
    setFilters({ ...saved.filters });
  }, []);

  const deleteFilter = useCallback((id: string) => {
    // Only user-defined filters can be deleted (templates are static)
    setUserSaved((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /**
   * Reorder user-saved filters after a drag-drop.
   * Templates (tpl-*) are excluded — only user filters move.
   */
  const reorderSavedFilters = useCallback(
    (activeId: string, overId: string) => {
      setUserSaved((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === activeId);
        const newIndex = prev.findIndex((f) => f.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
          return prev;
        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);
        return next;
      });
    },
    []
  );

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  return {
    filters,
    setFilters,
    savedFilters,
    activeFilterCount,
    isOpen,
    openPanel,
    closePanel,
    clearFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    reorderSavedFilters,
  };
}
