import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import {
  botConversations,
  botMessages,
  leadStatusEnum,
  leadTypeEnum,
  testLeads,
  timeframeEnum,
} from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { generateEmbedding } from "@/lib/utils/embedding";
import { generateBotResponse } from "../bot.actions";
import { sendPlaygroundCompletionEmail } from "@/lib/utils/manager-emails";

export const playgroundRouter = createTRPCRouter({
  // Create a new conversation with test lead
  createConversation: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Create test lead first
        const [newTestLead] = await db
          .insert(testLeads)
          .values({
            name: input.name,
            email: `test-${Date.now()}@carreracars.com`, // Placeholder email
            phone: `+34-TEST-${Date.now().toString().slice(-6)}`, // Placeholder phone
            testUserId: userId,
            status: "nuevo",
          })
          .returning();

        // Create conversation linked to test lead
        const [newConversation] = await db
          .insert(botConversations)
          .values({
            userId,
            name: input.name,
            testLeadId: newTestLead.id,
          })
          .returning();

        // After creating the conversation, add an initial bot message
        const [initialMessage] = await db
          .insert(botMessages)
          .values({
            conversationId: newConversation.id,
            role: "assistant",
            content:
              "¡Hola! Soy Pedro de Carrera Cars ¿Estás buscando algún vehículo en especial o solo estás viendo opciones?",
          })
          .returning();

        return {
          success: true,
          conversation: newConversation,
          testLead: newTestLead,
          initialMessage,
        };
      } catch (error) {
        console.error("Error creating conversation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });
      }
    }),

  // List conversations with test lead info
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.userId as string;

      const conversations = await db
        .select({
          id: botConversations.id,
          userId: botConversations.userId,
          name: botConversations.name,
          testLeadId: botConversations.testLeadId,
          isCompleted: botConversations.isCompleted,
          createdAt: botConversations.createdAt,
          updatedAt: botConversations.updatedAt,
          // Test lead info
          testLeadName: testLeads.name,
          testLeadStatus: testLeads.status,
          testLeadBudget: testLeads.budget,
        })
        .from(botConversations)
        .leftJoin(testLeads, eq(botConversations.testLeadId, testLeads.id))
        .where(eq(botConversations.userId, userId))
        .orderBy(desc(botConversations.updatedAt));

      return {
        success: true,
        conversations,
      };
    } catch (error) {
      console.error("Error listing conversations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list conversations",
      });
    }
  }),

  // Get conversation by ID with messages and test lead info
  getConversation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        const conversation = await db
          .select({
            id: botConversations.id,
            userId: botConversations.userId,
            name: botConversations.name,
            testLeadId: botConversations.testLeadId,
            isCompleted: botConversations.isCompleted,
            createdAt: botConversations.createdAt,
            updatedAt: botConversations.updatedAt,
          })
          .from(botConversations)
          .where(
            and(
              eq(botConversations.id, input.id),
              eq(botConversations.userId, userId)
            )
          )
          .limit(1);

        if (!conversation[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Get test lead info
        let testLead = null;
        if (conversation[0].testLeadId) {
          const testLeadResult = await db
            .select()
            .from(testLeads)
            .where(eq(testLeads.id, conversation[0].testLeadId))
            .limit(1);
          testLead = testLeadResult[0] || null;
        }

        const messages = await db
          .select()
          .from(botMessages)
          .where(eq(botMessages.conversationId, input.id))
          .orderBy(desc(botMessages.createdAt));

        return {
          success: true,
          conversation: conversation[0],
          testLead,
          messages,
        };
      } catch (error) {
        console.error("Error getting conversation:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get conversation",
        });
      }
    }),

  // Add message to conversation and get bot response with lead update
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Verify the conversation exists and belongs to the user
        const conversationCheck = await db
          .select({
            id: botConversations.id,
            name: botConversations.name,
            testLeadId: botConversations.testLeadId,
            isCompleted: botConversations.isCompleted,
          })
          .from(botConversations)
          .where(
            and(
              eq(botConversations.id, input.conversationId),
              eq(botConversations.userId, userId)
            )
          )
          .limit(1);

        if (!conversationCheck[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        const conversation = conversationCheck[0];

        // Check if conversation is completed
        if (conversation.isCompleted) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "This conversation has been completed. The test lead has been escalated to manager status.",
          });
        }

        // Get previous messages for context
        const previousMessages = await db
          .select()
          .from(botMessages)
          .where(eq(botMessages.conversationId, input.conversationId))
          .orderBy(desc(botMessages.createdAt))
          .limit(10);

        // Create message embedding for the user message
        try {
          const embedding = await generateEmbedding(input.content);

          // Store user message with embedding
          await db.insert(botMessages).values({
            conversationId: input.conversationId,
            role: "user",
            content: input.content,
            embedding,
          });
        } catch (embeddingError) {
          console.error(
            "Error generating embedding for user message:",
            embeddingError
          );

          // Still store the message even if embedding fails
          await db.insert(botMessages).values({
            conversationId: input.conversationId,
            role: "user",
            content: input.content,
          });
        }

        // Update conversation updatedAt
        await db
          .update(botConversations)
          .set({ updatedAt: new Date() })
          .where(eq(botConversations.id, input.conversationId));

        // Get current test lead status before generating response
        let previousTestLeadStatus = null;
        if (conversation.testLeadId) {
          const currentTestLeadResult = await db
            .select({ status: testLeads.status })
            .from(testLeads)
            .where(eq(testLeads.id, conversation.testLeadId))
            .limit(1);

          previousTestLeadStatus = currentTestLeadResult[0]?.status || null;
        }

        // Generate bot response using RAG with test lead management
        const {
          response: botResponse,
          leadUpdate,
          shouldComplete,
        } = await generateBotResponse(
          input.content,
          previousMessages.reverse().map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          userId,
          conversation.testLeadId || undefined
        );

        // Update test lead if there are updates
        if (leadUpdate && conversation.testLeadId) {
          // Type-safe update object
          const updateData: Partial<typeof testLeads.$inferInsert> = {
            updatedAt: new Date(),
          };

          // Only add fields that exist and match the expected types
          if (leadUpdate.status)
            updateData.status =
              leadUpdate.status as (typeof leadStatusEnum.enumValues)[number];
          if (leadUpdate.budget) updateData.budget = leadUpdate.budget;
          if (leadUpdate.expectedPurchaseTimeframe)
            updateData.expectedPurchaseTimeframe =
              leadUpdate.expectedPurchaseTimeframe as (typeof timeframeEnum.enumValues)[number];
          if (leadUpdate.type)
            updateData.type =
              leadUpdate.type as (typeof leadTypeEnum.enumValues)[number];
          if (leadUpdate.preferredVehicleType)
            updateData.preferredVehicleType = leadUpdate.preferredVehicleType;
          if (leadUpdate.preferredBrand)
            updateData.preferredBrand = leadUpdate.preferredBrand;
          if (leadUpdate.preferredFuelType)
            updateData.preferredFuelType = leadUpdate.preferredFuelType;
          if (leadUpdate.maxKilometers)
            updateData.maxKilometers = leadUpdate.maxKilometers;
          if (leadUpdate.minYear) updateData.minYear = leadUpdate.minYear;
          if (leadUpdate.maxYear) updateData.maxYear = leadUpdate.maxYear;
          if (leadUpdate.hasTradeIn !== undefined)
            updateData.hasTradeIn = leadUpdate.hasTradeIn;
          if (leadUpdate.needsFinancing !== undefined)
            updateData.needsFinancing = leadUpdate.needsFinancing;
          if (leadUpdate.isFirstTimeBuyer !== undefined)
            updateData.isFirstTimeBuyer = leadUpdate.isFirstTimeBuyer;
          if (leadUpdate.urgencyLevel)
            updateData.urgencyLevel = leadUpdate.urgencyLevel;
          if (leadUpdate.lastContactedAt)
            updateData.lastContactedAt = leadUpdate.lastContactedAt;
          if (leadUpdate.lastMessageAt)
            updateData.lastMessageAt = leadUpdate.lastMessageAt;

          await db
            .update(testLeads)
            .set(updateData)
            .where(eq(testLeads.id, conversation.testLeadId));

          // Check if test lead was escalated to manager status and send email notification
          if (
            updateData.status === "manager" &&
            previousTestLeadStatus !== "manager"
          ) {
            console.log(
              `🧪 Test lead escalated to manager status - sending email notification`
            );

            // Get the updated test lead info for the email
            const updatedTestLeadResult = await db
              .select()
              .from(testLeads)
              .where(eq(testLeads.id, conversation.testLeadId))
              .limit(1);

            const updatedTestLead = updatedTestLeadResult[0];

            if (updatedTestLead) {
              // Send playground completion email in the background
              sendPlaygroundCompletionEmail(
                updatedTestLead.name,
                conversation.name
              ).catch((emailError) => {
                console.error(
                  "Error sending playground completion email:",
                  emailError
                );
              });
            }
          }
        }

        // Mark conversation as completed if shouldComplete is true
        if (shouldComplete) {
          await db
            .update(botConversations)
            .set({ isCompleted: true })
            .where(eq(botConversations.id, input.conversationId));
        }

        // Add a natural delay before "sending" the response
        const responseDelay = Math.min(
          Math.max(1000, botResponse.length * 20),
          6000
        );

        await new Promise((resolve) => setTimeout(resolve, responseDelay));

        // Store bot response
        const [assistantMessage] = await db
          .insert(botMessages)
          .values({
            conversationId: input.conversationId,
            role: "assistant",
            content: botResponse,
          })
          .returning();

        return {
          success: true,
          assistantMessage,
          leadUpdate,
          isCompleted: shouldComplete,
        };
      } catch (error) {
        console.error("Error sending message:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),

  // Delete conversation and associated test lead
  deleteConversation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Verify the conversation exists and belongs to the user
        const conversationCheck = await db
          .select({
            id: botConversations.id,
            testLeadId: botConversations.testLeadId,
          })
          .from(botConversations)
          .where(
            and(
              eq(botConversations.id, input.id),
              eq(botConversations.userId, userId)
            )
          )
          .limit(1);

        if (!conversationCheck[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Delete all messages in the conversation
        await db
          .delete(botMessages)
          .where(eq(botMessages.conversationId, input.id));

        // Delete the associated test lead if it exists
        if (conversationCheck[0].testLeadId) {
          await db
            .delete(testLeads)
            .where(eq(testLeads.id, conversationCheck[0].testLeadId));
        }

        // Delete the conversation
        await db
          .delete(botConversations)
          .where(eq(botConversations.id, input.id));

        return {
          success: true,
          message: "Conversation and test lead deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting conversation:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete conversation",
        });
      }
    }),

  // Get test lead details
  getTestLead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        const testLead = await db
          .select()
          .from(testLeads)
          .where(
            and(eq(testLeads.id, input.id), eq(testLeads.testUserId, userId))
          )
          .limit(1);

        if (!testLead[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Test lead not found",
          });
        }

        return {
          success: true,
          testLead: testLead[0],
        };
      } catch (error) {
        console.error("Error getting test lead:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get test lead",
        });
      }
    }),
});
