import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { Prisma } from "@prisma/client";

type PaymentWithRelations = Prisma.PaymentsGetPayload<{ include: { customer: true; order: true } }>;

export const paymentRouter = createTRPCRouter({
  getAll: privateProcedure.query(async ({ ctx }) => {
    const payments = await ctx.db.payments.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true, order: true },
    });
    return payments.map((p: PaymentWithRelations) => ({
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
        notes: z.string().optional(),
        paymentDate: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { paymentDate, ...rest } = input;
      return ctx.db.payments.create({
        data: {
          ...rest,
          ...(paymentDate ? { createdAt: new Date(paymentDate) } : {}),
        },
      });
    }),

  delete: privateProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.payments.delete({ where: { id: input.id } })
    ),
});
