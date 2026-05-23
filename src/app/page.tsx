import { api, HydrateClient } from "@/trpc/server";
import { Users, ShoppingCart, CreditCard, UserCog, Receipt, Banknote, TrendingDown } from "lucide-react";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

async function StatCard({
  label,
  display,
  icon: Icon,
}: {
  label: string;
  display: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 flex items-center gap-4 shadow-sm">
      <div className="rounded-full bg-primary/10 p-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{display}</p>
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

  const totalOrderAmount = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalOutstanding = totalOrderAmount - totalPayments;

  return (
    <HydrateClient>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your data</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard label="Customers" display={customers.length} icon={Users} />
          <StatCard label="Orders" display={orders.length} icon={ShoppingCart} />
          <StatCard label="Payments" display={payments.length} icon={CreditCard} />
          <StatCard label="Users" display={users.length} icon={UserCog} />
          <StatCard label="Total Order Amount" display={formatMoney(totalOrderAmount)} icon={Receipt} />
          <StatCard label="Total Payments" display={formatMoney(totalPayments)} icon={Banknote} />
          <StatCard label="Outstanding" display={formatMoney(totalOutstanding)} icon={TrendingDown} />
        </div>
      </div>
    </HydrateClient>
  );
}
