import { api, HydrateClient } from "@/trpc/server";
import { CustomerTable } from "./_components/customer-table";
import { CustomerForm } from "./_components/customer-form";

export default async function CustomersPage() {
  void api.customer.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="p-4 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground text-sm">Manage your customers</p>
          </div>
          <CustomerForm />
        </div>
        <CustomerTable />
      </div>
    </HydrateClient>
  );
}
