import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

export const paymentRouter = createTRPCRouter({
  getAll: privateProcedure.query(async ({ ctx }) => {
    const payments = await ctx.db.payments.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true, order: true },
    });
    return payments.map((p) => ({
      ...p,
      amountPaid: Number(p.amountPaid),
    }));
  }),

  getByOrder: privateProcedure
    .input(z.object({ orderId: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.payments.findMany({
        where: { orderId: input.orderId },
        orderBy: { createdAt: "desc" },
        include: { customer: true },
      })
    ),

  getByCustomer: privateProcedure
    .input(z.object({ customerId: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.payments.findMany({
        where: { customerId: input.customerId },
        orderBy: { createdAt: "desc" },
        include: { order: true },
      })
    ),

  create: privateProcedure
    .input(
      z.object({
        customerId: z.number(),
        orderId: z.number().optional(),
        amountPaid: z.string(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.db.payments.create({ data: input })
    ),

  delete: privateProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.payments.delete({ where: { id: input.id } })
    ),
});
