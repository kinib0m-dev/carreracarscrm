import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export const campaignRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        externalId: z.string().optional(),
        formId: z.string().optional(),
        adId: z.string().optional(),
        description: z.string().optional(),
        type: z.string().default("facebook"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        const [newCampaign] = await db
          .insert(campaigns)
          .values({
            userId,
            name: input.name,
            externalId: input.externalId,
            formId: input.formId,
            adId: input.adId,
            description: input.description,
            type: input.type,
          })
          .returning();

        return {
          success: true,
          campaign: newCampaign,
        };
      } catch (error) {
        console.error("Error creating campaign:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create campaign",
        });
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.userId as string;

      const campaignsList = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, userId));

      return {
        success: true,
        campaigns: campaignsList,
      };
    } catch (error) {
      console.error("Error listing campaigns:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list campaigns",
      });
    }
  }),

  // Add other CRUD operations as needed
});
