import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const authRouter = createTRPCRouter({
  // Get current user session information
  getSession: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    return { user };
  }),
});
