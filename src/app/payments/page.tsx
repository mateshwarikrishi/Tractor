import { api, HydrateClient } from "@/trpc/server";
import { PaymentTable } from "./_components/payment-table";
import { PaymentForm } from "./_components/payment-form";

export default async function PaymentsPage() {
  void api.payment.getAll.prefetch();
  void api.order.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="p-4 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground text-sm">Track customer payments</p>
          </div>
          <PaymentForm />
        </div>
        <PaymentTable />
      </div>
    </HydrateClient>
  );
}
