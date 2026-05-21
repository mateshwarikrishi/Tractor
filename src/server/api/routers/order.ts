import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { OrderType, Prisma } from "@prisma/client";

type OrderWithCustomer = Prisma.OrdersGetPayload<{ include: { customer: true } }>;

export const orderRouter = createTRPCRouter({
  getAll: privateProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.orders.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });
    return orders.map((o: OrderWithCustomer) => ({
      ...o,
      amount: Number(o.amount),
      rate: Number(o.rate),
      discount: Number(o.discount),
    }));
  }),

  getById: privateProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.orders.findUnique({
        where: { id: input.id },
        include: { customer: true, payments: { orderBy: { createdAt: "desc" } } },
      })
    ),

  getByCustomer: privateProcedure
    .input(z.object({ customerId: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.orders.findMany({
        where: { customerId: input.customerId },
        orderBy: { createdAt: "desc" },
        include: { payments: true },
      })
    ),

  create: privateProcedure
    .input(
      z.object({
        customerId: z.number(),
        amount: z.string(),
        rate: z.string(),
        discount: z.string().default("0"),
        type: z.nativeEnum(OrderType),
        value: z.number(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.db.orders.create({ data: input })
    ),

  update: privateProcedure
    .input(
      z.object({
        id: z.number(),
        customerId: z.number().optional(),
        amount: z.string().optional(),
        rate: z.string().optional(),
        discount: z.string().optional(),
        type: z.nativeEnum(OrderType).optional(),
        value: z.number().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.orders.update({ where: { id }, data });
    }),

  delete: privateProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.orders.delete({ where: { id: input.id } })
    ),
});
