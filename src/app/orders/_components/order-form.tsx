"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, type RouterOutputs } from "@/trpc/react";

type Customer = RouterOutputs["customer"]["getAll"][number];

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  hours: z.coerce.number().min(0).optional(),
  minutes: z.coerce.number().min(0).max(59).optional(),
  notes: z.string().optional(),
  orderDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function OrderForm() {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();
  const customers: Customer[] = api.customer.getAll.useQuery().data ?? [];

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discount: "0", type: OrderType.TRIP, hours: 0, minutes: 0 },
  });

  const watchType = watch("type");
  const watchHours = Number(watch("hours")) || 0;
  const watchMinutes = Number(watch("minutes")) || 0;
  const watchRate = Number(watch("rate")) || 0;
  const watchDiscount = Number(watch("discount")) || 0;
  const watchValue = Number(watch("value")) || 0;

  // Sync value from hours+minutes when HOURLY
  useEffect(() => {
    if (watchType === OrderType.HOURLY) {
      const decimal = watchHours + watchMinutes / 60;
      setValue("value", decimal);
      const amt = Math.max(0, watchRate * decimal - watchDiscount);
      setValue("amount", String(amt.toFixed(2)));
    }
  }, [watchType, watchHours, watchMinutes, watchRate, watchDiscount, setValue]);

  // Auto-calc amount for TRIP type when rate/value/discount changes
  useEffect(() => {
    if (watchType === OrderType.TRIP && watchRate > 0 && watchValue > 0) {
      const amt = Math.max(0, watchRate * watchValue - watchDiscount);
      setValue("amount", String(amt.toFixed(2)));
    }
  }, [watchType, watchRate, watchValue, watchDiscount, setValue]);

  const create = api.order.create.useMutation({
    onSuccess: async () => {
      await utils.order.getAll.invalidate();
      reset({ discount: "0", type: OrderType.TRIP, hours: 0, minutes: 0 });
      setOpen(false);
    },
  });

  function onSubmit(data: FormData) {
    const finalValue =
      data.type === OrderType.HOURLY
        ? (data.hours ?? 0) + (data.minutes ?? 0) / 60
        : data.value;
    create.mutate({
      ...data,
      value: finalValue,
      notes: data.notes ?? undefined,
      orderDate: data.orderDate ?? undefined,
    });
  }

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
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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

          <div className="space-y-1.5">
            <Label htmlFor="rate">Rate *</Label>
            <Input id="rate" type="number" step="0.01" {...register("rate")} placeholder="0.00" />
            {errors.rate && <p className="text-xs text-destructive">{errors.rate.message}</p>}
          </div>

          {watchType === OrderType.TRIP ? (
            <div className="space-y-1.5">
              <Label htmlFor="value">Trips *</Label>
              <Input id="value" type="number" step="1" min="0" {...register("value")} placeholder="0" />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Duration *</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="hours" className="text-xs text-muted-foreground">Hours</Label>
                  <Input id="hours" type="number" step="1" min="0" {...register("hours")} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="minutes" className="text-xs text-muted-foreground">Minutes</Label>
                  <Input id="minutes" type="number" step="1" min="0" max="59" {...register("minutes")} placeholder="0" />
                </div>
              </div>
              {(watchHours > 0 || watchMinutes > 0) && (
                <p className="text-xs text-muted-foreground">
                  = {(watchHours + watchMinutes / 60).toFixed(4).replace(/\.?0+$/, "")} hrs
                </p>
              )}
            </div>
          )}

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

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Notes <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional details…"
              className="resize-none"
              rows={3}
              {...register("notes")}
            />
          </div>

          <Button type="submit" disabled={create.isPending} className="w-full mt-2">
            {create.isPending ? "Saving…" : "Create Order"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
