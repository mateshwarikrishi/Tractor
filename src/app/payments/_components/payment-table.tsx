"use client";

import { api } from "@/trpc/react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function PaymentTable() {
  const utils = api.useUtils();
  const { data: payments = [] } = api.payment.getAll.useQuery();

  const remove = api.payment.delete.useMutation({
    onSuccess: () => utils.payment.getAll.invalidate(),
  });

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground text-sm">No payments yet</p>
        <p className="text-muted-foreground text-xs mt-1">Record your first payment above</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden sm:table-cell">Order #</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.customer.name}</TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {p.orderId ? `#${p.orderId}` : "—"}
              </TableCell>
              <TableCell className="font-medium">₹{Number(p.amountPaid).toFixed(2)}</TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {p.createdAt.toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => remove.mutate({ id: p.id })}
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
