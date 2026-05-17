import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { UserRole } from "@prisma/client";

export const userRouter = createTRPCRouter({
  getAll: privateProcedure.query(({ ctx }) =>
    ctx.db.user.findMany({ orderBy: { createdAt: "desc" } })
  ),

  getById: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.user.findUnique({ where: { id: input.id } })
    ),

  update: privateProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.nativeEnum(UserRole).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.user.update({ where: { id }, data });
    }),

  delete: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.user.delete({ where: { id: input.id } })
    ),
});
