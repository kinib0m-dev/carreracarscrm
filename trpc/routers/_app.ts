import { authRouter } from "@/lib/auth/server/procedures";
import { createTRPCRouter } from "../init";
import { leadRouter } from "@/lib/leads/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  lead: leadRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
