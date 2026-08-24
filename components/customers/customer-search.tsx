"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

type CustomerSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CustomerSearch({ value, onChange }: CustomerSearchProps) {
  // Local state for instant visual feedback — debounced value goes to parent
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, 300);

  // Propagate debounced value up
  useEffect(() => {
    onChange(debouncedValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Sync if parent clears the value externally (e.g. filter reset)
  useEffect(() => {
    if (value === "" && inputValue !== "") {
      setInputValue("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search by name, email, or company..."
        className="h-10 bg-background/50 pl-9 pr-8"
        aria-label="Search customers"
      />
      {inputValue && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setInputValue("");
            onChange("");
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
