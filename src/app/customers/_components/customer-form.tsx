"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gst: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CustomerForm() {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const create = api.customer.create.useMutation({
    onSuccess: async () => {
      await utils.customer.getAll.invalidate();
      reset();
      setOpen(false);
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Customer</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit((data) => create.mutate(data))}
          className="mt-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} placeholder="John Doe" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Phone *</Label>
            <Input id="phoneNumber" type="tel" maxLength={10} inputMode="numeric" {...register("phoneNumber")} placeholder="9876543210" />
            {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gst">GST Number</Label>
            <Input id="gst" {...register("gst")} placeholder="22AAAAA0000A1Z5" />
          </div>
          <Button type="submit" disabled={create.isPending} className="w-full mt-2">
            {create.isPending ? "Saving…" : "Create Customer"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
