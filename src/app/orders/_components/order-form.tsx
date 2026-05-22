"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, type RouterOutputs } from "@/trpc/react";

type Customer = RouterOutputs["customer"]["getAll"][number];

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";

const OrderType = { TRIP: "TRIP", HOURLY: "HOURLY" } as const;
type OrderType = (typeof OrderType)[keyof typeof OrderType];

const schema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  amount: z.string().min(1, "Amount is required"),
  rate: z.string().min(1, "Rate is required"),
  discount: z.string(),
  type: z.enum(["TRIP", "HOURLY"]),
  value: z.coerce.number().min(0, "Value must be >= 0"),
  orderDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function OrderForm() {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();
  const customers: Customer[] = api.customer.getAll.useQuery().data ?? [];

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discount: "0", type: OrderType.TRIP },
  });

  const create = api.order.create.useMutation({
    onSuccess: async () => {
      await utils.order.getAll.invalidate();
      reset({ discount: "0", type: OrderType.TRIP });
      setOpen(false);
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Order
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Order</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Customer *</Label>
            <Select onValueChange={(v) => setValue("customerId", Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c: Customer) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Select defaultValue={OrderType.TRIP} onValueChange={(v) => setValue("type", v as OrderType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OrderType.TRIP}>Trip</SelectItem>
                <SelectItem value={OrderType.HOURLY}>Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rate">Rate *</Label>
              <Input id="rate" type="number" step="0.01" {...register("rate")} placeholder="0.00" />
              {errors.rate && <p className="text-xs text-destructive">{errors.rate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">Value *</Label>
              <Input id="value" type="number" step="0.01" {...register("value")} placeholder="0" />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (Total) *</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} placeholder="0.00" />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" type="number" step="0.01" {...register("discount")} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orderDate">
              Date <span className="text-muted-foreground text-xs">(optional, defaults to today)</span>
            </Label>
            <Input id="orderDate" type="date" {...register("orderDate")} />
          </div>
          <Button type="submit" disabled={create.isPending} className="w-full mt-2">
            {create.isPending ? "Saving…" : "Create Order"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
