"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Customer, CustomerStatus, DealCurrency } from "@/types/customer";

// ─── Zod schema (all fields stay as strings for react-hook-form) ──────────────

// Accepts: +91 XXXXXXXXXX or +91 XXXXX XXXXX (India) or +1 (XXX) XXX-XXXX (US)
const phoneRegex = /^(\+91\s\d{10}|\+91\s\d{5}\s\d{5}|\+1\s\(\d{3}\)\s\d{3}-\d{4})$/;

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(phoneRegex, "Format: +91 XXXXX XXXXX or +1 (XXX) XXX-XXXX"),
  company: z.string().max(100).optional().default(""),
  status: z.enum(["active", "inactive", "lead", "churned"] as const),
  lastContact: z.string().min(1, "Last contact date is required"),
  // keep as string; caller converts to number when submitting
  dealValue: z.string().optional().default(""),
  dealCurrency: z.enum(["INR", "USD"] as const).default("INR"),
  notes: z.string().max(1000).optional().default(""),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

// Parsed output type — dealValue converted to number for API calls
export type CustomerFormOutput = Omit<CustomerFormValues, "dealValue"> & {
  dealValue?: number;
  dealCurrency: DealCurrency;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateInputValue(isoString: string) {
  return isoString ? isoString.slice(0, 10) : "";
}

function toDefaultValues(customer?: Customer): CustomerFormValues {
  if (!customer) {
    return {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "lead",
      lastContact: toDateInputValue(new Date().toISOString()),
      dealValue: "",
      dealCurrency: "INR",
      notes: "",
    };
  }
  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company ?? "",
    status: customer.status,
    lastContact: toDateInputValue(customer.lastContact),
    dealValue: customer.dealValue != null ? String(customer.dealValue) : "",
    dealCurrency: customer.dealCurrency ?? "INR",
    notes: customer.notes ?? "",
  };
}

function toOutput(values: CustomerFormValues): CustomerFormOutput {
  const { dealValue, ...rest } = values;
  const numericDeal =
    dealValue && dealValue.trim() !== "" ? parseFloat(dealValue) : undefined;
  return {
    ...rest,
    dealValue: numericDeal && !isNaN(numericDeal) ? numericDeal : undefined,
    dealCurrency: values.dealCurrency,
  };
}

// ─── FieldWrapper ─────────────────────────────────────────────────────────────

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  isValid?: boolean;
  required?: boolean;
  children: React.ReactNode;
}

function FieldWrapper({
  label,
  htmlFor,
  error,
  isValid,
  required,
  children,
}: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {isValid && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  customer?: Customer;
  isPending: boolean;
  onSubmit: (values: CustomerFormOutput) => void;
}

export function CustomerFormModal({
  open,
  onOpenChange,
  mode,
  customer,
  isPending,
  onSubmit,
}: CustomerFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, dirtyFields, isValid },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    mode: "onChange",
    defaultValues: toDefaultValues(customer),
  });

  // Re-populate when customer or open state changes
  useEffect(() => {
    if (open) {
      reset(toDefaultValues(customer));
    }
  }, [open, customer, reset]);

  const statusValue = watch("status");

  function handleFormSubmit(values: CustomerFormValues) {
    onSubmit(toOutput(values));
  }

  const statusOptions: { value: CustomerStatus; label: string }[] = [
    { value: "active",   label: "Active Customer"   },
    { value: "inactive", label: "Inactive Customer" },
    { value: "lead",     label: "Lead"              },
    { value: "churned",  label: "Archive"           },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Customer" : "Edit Customer"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details below to add a new customer to your directory."
              : "Update the customer's information below."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="customer-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 py-2"
        >
          {/* Name */}
          <FieldWrapper
            label="Name"
            htmlFor="cf-name"
            error={errors.name?.message}
            isValid={!errors.name && !!dirtyFields.name}
            required
          >
            <Input
              id="cf-name"
              placeholder="Jane Smith"
              autoComplete="off"
              className={cn(errors.name && "border-destructive")}
              {...register("name")}
            />
          </FieldWrapper>

          {/* Email */}
          <FieldWrapper
            label="Email"
            htmlFor="cf-email"
            error={errors.email?.message}
            isValid={!errors.email && !!dirtyFields.email}
            required
          >
            <Input
              id="cf-email"
              type="email"
              placeholder="jane@company.com"
              autoComplete="off"
              className={cn(errors.email && "border-destructive")}
              {...register("email")}
            />
          </FieldWrapper>

          {/* Phone */}
          <FieldWrapper
            label="Phone"
            htmlFor="cf-phone"
            error={errors.phone?.message}
            isValid={!errors.phone && !!dirtyFields.phone}
            required
          >
            <Input
              id="cf-phone"
              type="tel"
              placeholder="+91 98765 43210"
              autoComplete="off"
              className={cn(errors.phone && "border-destructive")}
              {...register("phone")}
            />
          </FieldWrapper>

          {/* Company + Status row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldWrapper
              label="Company"
              htmlFor="cf-company"
              error={errors.company?.message}
              isValid={!errors.company && !!dirtyFields.company}
            >
              <Input
                id="cf-company"
                placeholder="Acme Corp"
                autoComplete="off"
                {...register("company")}
              />
            </FieldWrapper>

            <FieldWrapper label="Status" htmlFor="cf-status">
              <Select
                value={statusValue}
                onValueChange={(val) =>
                  setValue("status", val as CustomerStatus, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="cf-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrapper>
          </div>

          {/* Last Contact + Deal Value row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldWrapper
              label="Last Contact"
              htmlFor="cf-lastContact"
              error={errors.lastContact?.message}
              isValid={!errors.lastContact && !!dirtyFields.lastContact}
              required
            >
              <Input
                id="cf-lastContact"
                type="date"
                className={cn(errors.lastContact && "border-destructive")}
                {...register("lastContact")}
              />
            </FieldWrapper>

            <FieldWrapper
              label="Deal Value"
              htmlFor="cf-dealValue"
              error={errors.dealValue?.message}
              isValid={!errors.dealValue && !!dirtyFields.dealValue}
            >
              <div className="flex gap-1.5">
                {/* Currency toggle ₹ / $ */}
                <div className="flex rounded-md border border-input overflow-hidden shrink-0">
                  {(["INR", "USD"] as DealCurrency[]).map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setValue("dealCurrency", cur, { shouldDirty: true })}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold transition-colors",
                        watch("dealCurrency") === cur
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {cur === "INR" ? "₹" : "$"}
                    </button>
                  ))}
                </div>
                <Input
                  id="cf-dealValue"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  className={cn("flex-1", errors.dealValue && "border-destructive")}
                  {...register("dealValue")}
                />
              </div>
            </FieldWrapper>
          </div>

          {/* Notes */}
          <FieldWrapper
            label="Notes"
            htmlFor="cf-notes"
            error={errors.notes?.message}
          >
            <Textarea
              id="cf-notes"
              placeholder="Add any relevant notes about this customer…"
              rows={3}
              className="resize-none"
              {...register("notes")}
            />
          </FieldWrapper>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="customer-form"
            disabled={!isValid || isPending}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending
              ? mode === "add"
                ? "Adding…"
                : "Saving…"
              : mode === "add"
                ? "Add Customer"
                : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
