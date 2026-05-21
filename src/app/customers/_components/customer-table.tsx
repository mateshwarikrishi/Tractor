"use client";

import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";

type Customer = RouterOutputs["customer"]["getAll"][number];
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";


export function CustomerTable() {
  const router = useRouter();
  const utils = api.useUtils();
  const customers: Customer[] = api.customer.getAll.useQuery().data ?? [];

  const remove = api.customer.delete.useMutation({
    onSuccess: () => utils.customer.getAll.invalidate(),
  });

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground text-sm">No customers yet</p>
        <p className="text-muted-foreground text-xs mt-1">Add your first customer above</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="hidden md:table-cell">GST</TableHead>
            <TableHead className="w-10" />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c: Customer) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {c.email ?? "—"}
              </TableCell>
              <TableCell>{c.phoneNumber}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {c.gst ?? "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => router.push(`/customers/${c.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => remove.mutate({ id: c.id })}
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
