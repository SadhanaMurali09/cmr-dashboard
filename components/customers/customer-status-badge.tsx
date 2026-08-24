import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/types/customer";

const statusStyles: Record<
  CustomerStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  active: {
    label: "Active",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    dotClass: "bg-emerald-400",
  },
  inactive: {
    label: "Inactive",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/20",
    dotClass: "bg-slate-400",
  },
  lead: {
    label: "Lead",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/20",
    dotClass: "bg-sky-400",
  },
  churned: {
    label: "Archive",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/20",
    dotClass: "bg-rose-400",
  },
};

type CustomerStatusBadgeProps = {
  status: CustomerStatus;
  className?: string;
};

export function CustomerStatusBadge({
  status,
  className,
}: CustomerStatusBadgeProps) {
  const config = statusStyles[status];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", config.badgeClass, className)}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", config.dotClass)}
        aria-hidden
      />
      {config.label}
    </Badge>
  );
}
