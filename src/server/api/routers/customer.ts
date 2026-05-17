import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

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

  create: privateProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phoneNumber: z.string().min(1),
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
