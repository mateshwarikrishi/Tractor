import { api, HydrateClient } from "@/trpc/server";
import { OrderTable } from "./_components/order-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function OrdersPage() {
  void api.order.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="p-4 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground text-sm">Manage your orders</p>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/orders/new">
              <Plus className="h-4 w-4" /> Add Order
            </Link>
          </Button>
        </div>
        <OrderTable />
      </div>
    </HydrateClient>
  );
}
