"use client";

import { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Eye, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Payment = RouterOutputs["payment"]["getAll"][number];
type CustomerOption = Pick<RouterOutputs["customer"]["getAll"][number], "id" | "name">;


export function PaymentTable() {
  const utils = api.useUtils();
  const payments: Payment[] = api.payment.getAll.useQuery().data ?? [];

  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const remove = api.payment.delete.useMutation({
    onSuccess: () => utils.payment.getAll.invalidate(),
  });

  const selectedPayment = payments.find((p) => p.id === selectedId) ?? null;

  const customers: CustomerOption[] = useMemo(() => {
    const map = new Map<number, string>();
    payments.forEach((p: Payment) => map.set(p.customer.id, p.customer.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [payments]);

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
    return payments.filter((p: Payment) => {
      if (customerFilter !== "all" && p.customer.id !== Number(customerFilter)) return false;
      const d = new Date(p.createdAt);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [payments, customerFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setCustomerFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = customerFilter !== "all" || dateFrom !== "" || dateTo !== "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map((c: CustomerOption) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full sm:w-auto"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full sm:w-auto"
        />
        {hasFilters && (
          <Button variant="outline" onClick={clearFilters}>Clear</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground text-sm">No payments found</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Order #</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: Payment) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{p.customer.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {p.orderId ? `#${p.orderId}` : "—"}
                  </TableCell>
                  <TableCell className="font-medium">₹{p.amountPaid.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedId(p.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => remove.mutate({ id: p.id })}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={selectedId !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Payment #{selectedPayment?.id}</SheetTitle>
          </SheetHeader>
          {selectedPayment && (
            <div className="mt-6 divide-y rounded-lg border">
              <DetailRow label="Customer" value={selectedPayment.customer.name} />
              <DetailRow label="Order" value={selectedPayment.orderId ? `#${selectedPayment.orderId}` : "—"} />
              <DetailRow label="Amount Paid" value={`₹${selectedPayment.amountPaid.toFixed(2)}`} />
              <DetailRow label="Date" value={new Date(selectedPayment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
              <DetailRow label="Notes" value={selectedPayment.notes ?? "—"} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
