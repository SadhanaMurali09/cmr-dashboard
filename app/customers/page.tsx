import { CustomerList } from "@/components/customers/customer-list";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CustomersPage() {
  return (
    <DashboardShell
      title="Customers"
      description="Search, sort, and browse your customer directory"
    >
      <CustomerList />
    </DashboardShell>
  );
}
