import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { customerRouter } from "@/server/api/routers/customer";
import { orderRouter } from "@/server/api/routers/order";
import { paymentRouter } from "@/server/api/routers/payment";
import { userRouter } from "@/server/api/routers/user";

export const appRouter = createTRPCRouter({
  customer: customerRouter,
  order: orderRouter,
  payment: paymentRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
