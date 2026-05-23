"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Order = RouterOutputs["order"]["getAll"][number];
type Customer = RouterOutputs["customer"]["getAll"][number];

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

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderEditForm({ order, open, onOpenChange }: Props) {
  const utils = api.useUtils();
  const customers: Customer[] = api.customer.getAll.useQuery().data ?? [];

  const initHours = order.type === "HOURLY" ? Math.floor(order.value) : 0;
  const initMinutes = order.type === "HOURLY" ? Math.round((order.value % 1) * 60) : 0;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: order.customer.id,
      amount: String(order.amount),
      rate: String(order.rate),
      discount: String(order.discount),
      type: order.type as OrderType,
      value: order.type === "TRIP" ? order.value : 0,
      hours: initHours,
      minutes: initMinutes,
      notes: order.notes ?? "",
      orderDate: new Date(order.createdAt).toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    const h = order.type === "HOURLY" ? Math.floor(order.value) : 0;
    const m = order.type === "HOURLY" ? Math.round((order.value % 1) * 60) : 0;
    reset({
      customerId: order.customer.id,
      amount: String(order.amount),
      rate: String(order.rate),
      discount: String(order.discount),
      type: order.type as OrderType,
      value: order.type === "TRIP" ? order.value : 0,
      hours: h,
      minutes: m,
      notes: order.notes ?? "",
      orderDate: new Date(order.createdAt).toISOString().split("T")[0],
    });
  }, [order, reset]);

  const watchType = watch("type");
  const watchCustomerId = watch("customerId");
  const watchHours = Number(watch("hours")) || 0;
  const watchMinutes = Number(watch("minutes")) || 0;
  const watchRate = Number(watch("rate")) || 0;
  const watchDiscount = Number(watch("discount")) || 0;
  const watchValue = Number(watch("value")) || 0;

  useEffect(() => {
    if (watchType === OrderType.HOURLY) {
      const decimal = watchHours + watchMinutes / 60;
      setValue("value", decimal);
      const amt = Math.max(0, watchRate * decimal - watchDiscount);
      setValue("amount", String(amt.toFixed(2)));
    }
  }, [watchType, watchHours, watchMinutes, watchRate, watchDiscount, setValue]);

  useEffect(() => {
    if (watchType === OrderType.TRIP && watchRate > 0 && watchValue > 0) {
      const amt = Math.max(0, watchRate * watchValue - watchDiscount);
      setValue("amount", String(amt.toFixed(2)));
    }
  }, [watchType, watchRate, watchValue, watchDiscount, setValue]);

  const update = api.order.update.useMutation({
    onSuccess: async () => {
      await utils.order.getAll.invalidate();
      onOpenChange(false);
    },
  });

  function onSubmit(data: FormData) {
    const finalValue =
      data.type === OrderType.HOURLY
        ? (data.hours ?? 0) + (data.minutes ?? 0) / 60
        : data.value;
    update.mutate({
      id: order.id,
      customerId: data.customerId,
      amount: data.amount,
      rate: data.rate,
      discount: data.discount,
      type: data.type,
      value: finalValue,
      notes: data.notes,
      orderDate: data.orderDate,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Order</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Customer *</Label>
            <Select
              value={watchCustomerId ? String(watchCustomerId) : undefined}
              onValueChange={(v) => setValue("customerId", Number(v))}
            >
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
            <Select value={watchType} onValueChange={(v) => setValue("type", v as OrderType)}>
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
            <Label htmlFor="orderDate">Date</Label>
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

          <Button type="submit" disabled={update.isPending} className="w-full mt-2">
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
