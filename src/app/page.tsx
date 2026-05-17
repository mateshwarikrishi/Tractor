import { api, HydrateClient } from "@/trpc/server";
import { Users, ShoppingCart, CreditCard, UserCog } from "lucide-react";

async function StatCard({
  label,
  count,
  icon: Icon,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 flex items-center gap-4 shadow-sm">
      <div className="rounded-full bg-primary/10 p-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [customers, orders, payments, users] = await Promise.all([
    api.customer.getAll(),
    api.order.getAll(),
    api.payment.getAll(),
    api.user.getAll(),
  ]);

  return (
    <HydrateClient>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your data</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard label="Customers" count={customers.length} icon={Users} />
          <StatCard label="Orders" count={orders.length} icon={ShoppingCart} />
          <StatCard label="Payments" count={payments.length} icon={CreditCard} />
          <StatCard label="Users" count={users.length} icon={UserCog} />
        </div>
      </div>
    </HydrateClient>
  );
}
