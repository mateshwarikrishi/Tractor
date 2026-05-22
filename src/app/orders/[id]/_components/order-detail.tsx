"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

export function OrderDetail({ orderId }: { orderId: number }) {
  const router = useRouter();
  const { data: order } = api.order.getById.useQuery({ id: orderId });

  if (!order) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const totalPaid = order.payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const outstanding = order.amount - totalPaid;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Order #{order.id}</h1>
          <p className="text-sm text-muted-foreground">{order.customer.name}</p>
        </div>
        <Badge variant={order.type === "TRIP" ? "default" : "secondary"} className="ml-auto">
          {order.type === "TRIP" ? "Trip" : "Hourly"}
        </Badge>
      </div>

      <div className="rounded-lg border p-4 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium">{fmtDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{order.type === "TRIP" ? "Units" : "Hours"}</p>
            <p className="font-medium">{order.value}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="font-medium">{fmt(order.rate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Discount</p>
            <p className="font-medium">{fmt(order.discount)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Order Amount</p>
          <p className="font-semibold text-xs sm:text-sm">{fmt(order.amount)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Paid</p>
          <p className="font-semibold text-xs sm:text-sm text-green-600">{fmt(totalPaid)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="font-semibold text-xs sm:text-sm">{fmt(outstanding)}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">
          Payments {order.payments.length > 0 && <span className="text-muted-foreground font-normal">({order.payments.length})</span>}
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="text-right whitespace-nowrap">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-sm text-muted-foreground">
                    No payments recorded
                  </TableCell>
                </TableRow>
              ) : (
                order.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {fmtDate(p.createdAt)}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm font-medium text-green-600 whitespace-nowrap">
                      {fmt(p.amountPaid)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
