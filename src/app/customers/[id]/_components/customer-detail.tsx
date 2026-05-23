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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Printer } from "lucide-react";
import Link from "next/link";

type Activity = RouterOutputs["customer"]["getActivity"];
type Orders = Activity["orders"][number];
type Payments = Activity["payments"][number];

const PAGE_SIZE = 10;

function fmtHours(decimalHours: number): string {
  if (decimalHours === 0) return "0H";
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (m === 0) return `${h}H`;
  return `${h}H ${m}M`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function CustomerDetail({ customerId }: { customerId: number }) {
  const router = useRouter();
  const { data } = api.customer.getActivity.useQuery({ id: customerId });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "order" | "payment">("all");
  const [page, setPage] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

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

  const { items, totalOrders, totalPayments, totalHours, totalTrips, totalPages } = useMemo(() => {
    if (!data) return { items: [], totalOrders: 0, totalPayments: 0, totalHours: 0, totalTrips: 0, totalPages: 0 };

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
    const totalHours = filteredOrders
      .filter((o: Orders) => o.type === "HOURLY")
      .reduce((sum: number, o: Orders) => sum + o.value, 0);
    const totalTrips = filteredOrders
      .filter((o: Orders) => o.type === "TRIP")
      .reduce((sum: number, o: Orders) => sum + o.value, 0);

    const merged = [
      ...filteredOrders.map((o: Orders) => ({
        kind: "order" as const,
        date: new Date(o.createdAt),
        label: o.type === "TRIP" ? `Trip · ${o.value} units` : `Hourly · ${fmtHours(o.value)}`,
        badge: o.type === "TRIP" ? "Trip" : "Hourly",
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

    return { items, totalOrders, totalPayments, totalHours, totalTrips, totalPages };
  }, [data, dateFrom, dateTo, typeFilter, page, isPrinting]);

  const outstanding = totalOrders - totalPayments;
  const selectedPayment = data?.payments.find((p) => p.id === selectedPaymentId) ?? null;

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
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="truncate text-lg font-semibold">{data.customer?.name ?? "Customer"}</h1>
      </div>

      <div className="flex flex-wrap items-end gap-2 print:hidden">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="min-w-[140px] flex-1"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="min-w-[140px] flex-1"
        />
        {(dateFrom || dateTo) && (
          <Button variant="outline" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Outstanding full-width on mobile; 5-col on sm+ */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="col-span-2 rounded-lg border p-3 text-center sm:col-span-1">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-sm font-semibold">{fmt(outstanding)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Orders</p>
          <p className="text-sm font-semibold">{fmt(totalOrders)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Payments</p>
          <p className="text-sm font-semibold">{fmt(totalPayments)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Hours</p>
          <p className="text-sm font-semibold">{fmtHours(totalHours)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Trips</p>
          <p className="text-sm font-semibold">{Math.round(totalTrips)}</p>
        </div>
      </div>

      <div className="flex gap-2 print:hidden">
        {(["all", "order", "payment"] as const).map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            size="sm"
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
              <TableHead className="hidden sm:table-cell">Description</TableHead>
              <TableHead className="whitespace-nowrap text-right">Amount</TableHead>
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
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                    {fmtDate(item.date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.badgeVariant} className="text-xs">
                      {item.badge}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell sm:text-sm">
                    {item.label}
                  </TableCell>
                  <TableCell
                    className={`whitespace-nowrap text-right text-xs font-medium sm:text-sm ${
                      item.kind === "payment" ? "text-green-600" : ""
                    }`}
                  >
                    {fmt(item.amount)}
                  </TableCell>
                  <TableCell className="print:hidden">
                    {item.kind === "order" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        asChild
                      >
                        <Link href={`/orders/${item.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedPaymentId(item.id)}
                      >
                        <ExternalLink className="h-4 w-4" />
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
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <Sheet
        open={selectedPaymentId !== null}
        onOpenChange={(open) => { if (!open) setSelectedPaymentId(null); }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Payment #{selectedPayment?.id}</SheetTitle>
          </SheetHeader>
          {selectedPayment && (
            <div className="mt-6 divide-y rounded-lg border">
              <DetailRow label="Customer" value={data.customer?.name ?? "—"} />
              <DetailRow label="Order" value={selectedPayment.orderId ? `#${selectedPayment.orderId}` : "—"} />
              <DetailRow label="Amount Paid" value={`₹${selectedPayment.amountPaid.toFixed(2)}`} />
              <DetailRow
                label="Date"
                value={new Date(selectedPayment.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <DetailRow label="Notes" value={selectedPayment.notes ?? "—"} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
