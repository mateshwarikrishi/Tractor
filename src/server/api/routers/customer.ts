import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import type { Orders, Payments } from "@prisma/client";

export const customerRouter = createTRPCRouter({
  getAll: privateProcedure.query(({ ctx }) =>
    ctx.db.customers.findMany({ orderBy: { createdAt: "desc" } })
  ),

  getById: privateProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.customers.findUnique({
        where: { id: input.id },
        include: { orders: { orderBy: { createdAt: "desc" } } },
      })
    ),

  getActivity: privateProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [customer, orders, payments] = await Promise.all([
        ctx.db.customers.findUnique({ where: { id: input.id } }),
        ctx.db.orders.findMany({
          where: { customerId: input.id },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.payments.findMany({
          where: { customerId: input.id },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      return {
        customer,
        orders: orders.map((o: Orders) => ({
          ...o,
          amount: Number(o.amount),
          rate: Number(o.rate),
          discount: Number(o.discount),
        })),
        payments: payments.map((p: Payments) => ({
          ...p,
          amountPaid: Number(p.amountPaid),
        })),
      };
    }),

  create: privateProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
        email: z.string().email().optional().or(z.literal("")),
        gst: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.db.customers.create({
        data: {
          name: input.name,
          phoneNumber: input.phoneNumber,
          email: input.email ?? null,
          gst: input.gst ?? null,
        },
      })
    ),

  update: privateProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        phoneNumber: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        gst: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.customers.update({ where: { id }, data });
    }),

  delete: privateProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.customers.delete({ where: { id: input.id } })
    ),
});
