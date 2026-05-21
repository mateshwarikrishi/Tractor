"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, type RouterOutputs } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";

const schema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  orderId: z.coerce.number().optional(),
  amountPaid: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof schema>;
type Customer = RouterOutputs["customer"]["getAll"][number];
type Order = RouterOutputs["order"]["getAll"][number];


export function PaymentForm() {
  const [open, setOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const utils = api.useUtils();

  const customers: Customer[] = api.customer.getAll.useQuery().data ?? [];
  const allOrders: Order[] = api.order.getAll.useQuery().data ?? [];

  const customerOrders = selectedCustomerId
    ? allOrders.filter((o) => o.customerId === selectedCustomerId)
    : [];

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const create = api.payment.create.useMutation({
    onSuccess: async () => {
      await utils.payment.getAll.invalidate();
      reset();
      setSelectedCustomerId(null);
      setOpen(false);
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Payment
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Payment</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Customer *</Label>
            <Select
              onValueChange={(v) => {
                const id = Number(v);
                setValue("customerId", id);
                setValue("orderId", undefined);
                setSelectedCustomerId(id);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c: Customer) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Order <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select
              onValueChange={(v) => setValue("orderId", v === "none" ? undefined : Number(v))}
              disabled={!selectedCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCustomerId ? "Select order (optional)" : "Select a customer first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific order</SelectItem>
                {customerOrders.map((o: Order) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    #{o.id} — ₹{Number(o.amount).toFixed(2)} ({o.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amountPaid">Amount Paid *</Label>
            <Input id="amountPaid" type="number" step="0.01" {...register("amountPaid")} placeholder="0.00" />
            {errors.amountPaid && <p className="text-xs text-destructive">{errors.amountPaid.message}</p>}
          </div>

          <Button type="submit" disabled={create.isPending} className="w-full mt-2">
            {create.isPending ? "Saving…" : "Record Payment"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
