"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const OrderType = { TRIP: "TRIP", HOURLY: "HOURLY" } as const;
type OrderType = (typeof OrderType)[keyof typeof OrderType];

const schema = z.object({
  customerId: z.coerce.number().min(1, "Select a customer"),
  rate: z.coerce.number().positive("Rate must be greater than 0"),
  type: z.enum(["TRIP", "HOURLY"]),
  value: z.coerce.number().positive("Must be greater than 0"),
  discount: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

export function CreateOrderForm() {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: customers = [] } = api.customer.getAll.useQuery();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: OrderType.TRIP, discount: 0 },
  });

  const watchRate = Number(watch("rate")) || 0;
  const watchValue = Number(watch("value")) || 0;
  const watchDiscount = Number(watch("discount")) || 0;
  const watchType = watch("type");
  const subtotal = watchRate * watchValue;
  const total = Math.max(0, subtotal - watchDiscount);

  const create = api.order.create.useMutation({
    onSuccess: async () => {
      await utils.order.getAll.invalidate();
      router.push("/orders");
    },
  });

  function onSubmit(data: FormData) {
    const amount = Math.max(0, data.rate * data.value - data.discount);
    create.mutate({
      customerId: data.customerId,
      rate: String(data.rate),
      type: data.type,
      value: data.value,
      discount: String(data.discount),
      amount: String(amount),
    });
  }

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-2 px-4">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Orders
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm font-medium">New Order</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in the details below to create an order.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer */}
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select
              onValueChange={(v) =>
                setValue("customerId", Number(v), { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <p className="text-xs text-destructive">{errors.customerId.message}</p>
            )}
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <Label htmlFor="rate">Rate *</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ₹
              </span>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                className="h-12 pl-7"
                placeholder="0.00"
                {...register("rate")}
              />
            </div>
            {errors.rate && (
              <p className="text-xs text-destructive">{errors.rate.message}</p>
            )}
          </div>

          {/* Type toggle */}
          <div className="space-y-2">
            <Label>Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setValue("type", OrderType.TRIP, { shouldValidate: true })
                }
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-4 text-sm font-medium transition-all",
                  watchType === OrderType.TRIP
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                <MapPin className="h-4 w-4" />
                Trip
              </button>
              <button
                type="button"
                onClick={() =>
                  setValue("type", OrderType.HOURLY, { shouldValidate: true })
                }
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-4 text-sm font-medium transition-all",
                  watchType === OrderType.HOURLY
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                <Clock className="h-4 w-4" />
                Hourly
              </button>
            </div>
          </div>

          {/* Value (trips or hours) */}
          <div className="space-y-2">
            <Label htmlFor="value">
              {watchType === OrderType.HOURLY ? "Hours *" : "Trips *"}
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              className="h-12"
              placeholder={watchType === OrderType.HOURLY ? "e.g. 8" : "e.g. 3"}
              {...register("value")}
            />
            {errors.value && (
              <p className="text-xs text-destructive">{errors.value.message}</p>
            )}
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <Label htmlFor="discount">Discount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ₹
              </span>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                className="h-12 pl-7"
                placeholder="0.00"
                {...register("discount")}
              />
            </div>
            <p className="text-xs text-muted-foreground">Fixed amount discount</p>
          </div>

          {/* Live summary */}
          <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Receipt className="h-4 w-4" />
              Summary
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>
                  ₹{watchRate.toFixed(2)} &times;{" "}
                  {watchValue}{" "}
                  {watchType === OrderType.HOURLY ? "hrs" : "trips"}
                </span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {watchDiscount > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span className="text-destructive">
                    −₹{watchDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2 font-semibold text-base">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {create.error && (
            <p className="text-sm text-destructive text-center">
              {create.error.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={create.isPending}
            className="w-full h-12 text-base"
          >
            {create.isPending ? "Saving…" : "Create Order"}
          </Button>
        </form>
      </div>
    </div>
  );
}
