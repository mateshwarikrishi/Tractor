"use client";

import { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

type Order = RouterOutputs["order"]["getAll"][number];

export function OrderTable() {
  const utils = api.useUtils();
  const { data: orders = [] } = api.order.getAll.useQuery();

  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const remove = api.order.delete.useMutation({
    onSuccess: () => utils.order.getAll.invalidate(),
  });

  const customers = useMemo(() => {
    const map = new Map<number, string>();
    orders.forEach((o: Order) => map.set(o.customer.id, o.customer.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
    return orders.filter((o: Order) => {
      if (customerFilter !== "all" && o.customer.id !== Number(customerFilter)) return false;
      const d = new Date(o.createdAt);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [orders, customerFilter, dateFrom, dateTo]);

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
            {customers.map((c) => (
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
          <p className="text-muted-foreground text-sm">No orders found</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden sm:table-cell">Value</TableHead>
                <TableHead className="hidden sm:table-cell">Rate</TableHead>
                <TableHead className="hidden md:table-cell">Discount</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o: Order) => (
                <TableRow key={o.id}>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{o.customer.name}</TableCell>
                  <TableCell>
                    <Badge variant={o.type === "TRIP" ? "default" : "secondary"}>
                      {o.type === "TRIP" ? "Trip" : "Hourly"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{o.value}</TableCell>
                  <TableCell className="hidden sm:table-cell">₹{o.rate.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">₹{o.discount.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">₹{o.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove.mutate({ id: o.id })}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
