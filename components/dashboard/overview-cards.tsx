import type { LucideIcon } from "lucide-react";
import {
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCustomerStats } from "@/lib/customer-utils";
import type { Customer } from "@/types/customer";

type OverviewCardsProps = {
  customers: Customer[];
};

type StatCard = {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
};

export function OverviewCards({ customers }: OverviewCardsProps) {
  const stats = getCustomerStats(customers);

  const cards: StatCard[] = [
    {
      title: "Total Customers",
      value: stats.total,
      description: "All records in workspace",
      icon: Users,
    },
    {
      title: "Active",
      value: stats.active,
      description: "Currently engaged accounts",
      icon: UserCheck,
    },
    {
      title: "Leads",
      value: stats.lead,
      description: "Pipeline opportunities",
      icon: UserPlus,
    },
    {
      title: "Inactive / Churned",
      value: stats.inactive + stats.churned,
      description: "Needs follow-up attention",
      icon: UserX,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} className="bg-card/80">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {card.value}
                </CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
