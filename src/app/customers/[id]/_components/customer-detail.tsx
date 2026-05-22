"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Printer } from "lucide-react";
import Link from "next/link";

type Activity = RouterOutputs["customer"]["getActivity"];
type Orders = Activity["orders"][number];
type Payments = Activity["payments"][number];

const PAGE_SIZE = 10;

export function CustomerDetail({ customerId }: { customerId: number }) {
  const router = useRouter();
  const { data } = api.customer.getActivity.useQuery({ id: customerId });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "order" | "payment">("all");
  const [page, setPage] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const before = () => setIsPrinting(true);
    const after = () => setIsPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const { items, totalOrders, totalPayments, totalPages } = useMemo(() => {
    if (!data) return { items: [], totalOrders: 0, totalPayments: 0, totalPages: 0 };

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;

    const passesDate = (date: Date) => {
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    };

    const filteredOrders = data.orders.filter((o: Orders) => passesDate(new Date(o.createdAt)));
    const filteredPayments = data.payments.filter((p: Payments) => passesDate(new Date(p.createdAt)));

    const totalOrders = filteredOrders.reduce((sum: number, o: Orders) => sum + o.amount, 0);
    const totalPayments = filteredPayments.reduce((sum: number, p: Payments) => sum + p.amountPaid, 0);

    const merged = [
      ...filteredOrders.map((o: Orders) => ({
        kind: "order" as const,
        date: new Date(o.createdAt),
        label: o.type === "TRIP" ? `Trip (${o.value} units)` : `Hourly (${o.value} hrs)`,
        badge: o.type,
        badgeVariant: (o.type === "TRIP" ? "default" : "secondary") as "default" | "secondary" | "outline",
        amount: o.amount,
        id: o.id,
      })),
      ...filteredPayments.map((p: Payments) => ({
        kind: "payment" as const,
        date: new Date(p.createdAt),
        label: "Payment received",
        badge: "Payment",
        badgeVariant: "outline" as const,
        amount: p.amountPaid,
        id: p.id,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const filtered = typeFilter === "all" ? merged : merged.filter((i) => i.kind === typeFilter);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const items = isPrinting ? filtered : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return { items, totalOrders, totalPayments, totalPages };
  }, [data, dateFrom, dateTo, typeFilter, page, isPrinting]);

  const outstanding = totalOrders - totalPayments;

  if (!data) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{data.customer?.name ?? "Customer"}</h1>
      </div>

      <div className="flex flex-wrap items-end gap-2 print:hidden">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="w-full sm:w-auto"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="w-full sm:w-auto"
        />
        <Button
          variant="outline"
          onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
        >
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">Total Orders</p>
          <p className="font-semibold text-xs sm:text-sm">{fmt(totalOrders)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">Total Payments</p>
          <p className="font-semibold text-xs sm:text-sm">{fmt(totalPayments)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">Outstanding</p>
          <p className="font-semibold text-xs sm:text-sm">{fmt(outstanding)}</p>
        </div>
      </div>

      <div className="flex gap-2 print:hidden">
        {(["all", "order", "payment"] as const).map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            className="flex-1"
            onClick={() => { setTypeFilter(t); setPage(1); }}
          >
            {t === "all" ? "All" : t === "order" ? "Orders" : "Payments"}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
              <TableHead className="w-10 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No activity found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={`${item.kind}-${item.id}`}>
                  <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                    {fmtDate(item.date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.badgeVariant} className="text-xs">
                      {item.badge}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                    {item.label}
                  </TableCell>
                  <TableCell className={`text-right text-xs sm:text-sm font-medium whitespace-nowrap ${item.kind === "payment" ? "text-green-600" : ""}`}>
                    {fmt(item.amount)}
                  </TableCell>
                  <TableCell className="print:hidden">
                    {item.kind === "order" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
                        <Link href={`/orders/${item.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print / Save PDF
        </Button>
      </div>
    </div>
  );
}
