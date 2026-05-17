"use client";

import { api } from "@/trpc/react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function OrderTable() {
  const utils = api.useUtils();
  const { data: orders = [] } = api.order.getAll.useQuery();

  const remove = api.order.delete.useMutation({
    onSuccess: () => utils.order.getAll.invalidate(),
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground text-sm">No orders yet</p>
        <p className="text-muted-foreground text-xs mt-1">Create your first order above</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
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
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.customer.name}</TableCell>
              <TableCell>
                <Badge variant={o.type === "TRIP" ? "default" : "secondary"}>
                  {o.type === "TRIP" ? "Trip" : "Hourly"}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{o.value}</TableCell>
              <TableCell className="hidden sm:table-cell">₹{Number(o.rate).toFixed(2)}</TableCell>
              <TableCell className="hidden md:table-cell">₹{Number(o.discount).toFixed(2)}</TableCell>
              <TableCell className="font-medium">₹{Number(o.amount).toFixed(2)}</TableCell>
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
  );
}
