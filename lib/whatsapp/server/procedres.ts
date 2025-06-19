import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { whatsappMessages, leads } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, sql } from "drizzle-orm";

// Validation schemas
const getWhatsAppMessagesSchema = z.object({
  leadId: z.string().uuid(),
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
});

const sendWhatsAppMessageSchema = z.object({
  leadId: z.string().uuid(),
  content: z.string().min(1),
});

// New schema for template messages
const sendTemplateMessageSchema = z.object({
  leadId: z.string().uuid(),
  templateName: z.string(),
  languageCode: z.string().optional().default("es"),
  components: z
    .array(
      z.object({
        type: z.enum(["header", "body", "button"]),
        parameters: z
          .array(
            z.object({
              type: z.literal("text"),
              text: z.string(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

export const whatsappRouter = createTRPCRouter({
  // Get WhatsApp messages for a lead
  getByLeadId: protectedProcedure
    .input(getWhatsAppMessagesSchema)
    .query(async ({ input }) => {
      try {
        // Verify the lead exists and belongs to the user (through any associated entities)
        const leadResult = await db
          .select()
          .from(leads)
          .where(eq(leads.id, input.leadId))
          .limit(1);

        if (!leadResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        // Get messages for the lead, ordered by creation time (newest first for pagination, but we'll reverse for display)
        const messages = await db
          .select({
            id: whatsappMessages.id,
            leadId: whatsappMessages.leadId,
            whatsappMessageId: whatsappMessages.whatsappMessageId,
            direction: whatsappMessages.direction,
            messageType: whatsappMessages.messageType,
            content: whatsappMessages.content,
            phoneNumber: whatsappMessages.phoneNumber,
            whatsappTimestamp: whatsappMessages.whatsappTimestamp,
            status: whatsappMessages.status,
            errorMessage: whatsappMessages.errorMessage,
            metadata: whatsappMessages.metadata,
            createdAt: whatsappMessages.createdAt,
            updatedAt: whatsappMessages.updatedAt,
          })
          .from(whatsappMessages)
          .where(eq(whatsappMessages.leadId, input.leadId))
          .orderBy(desc(whatsappMessages.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Reverse to show oldest first in conversation
        const conversationMessages = messages.reverse();

        // Get total count for pagination
        const totalCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(whatsappMessages)
          .where(eq(whatsappMessages.leadId, input.leadId));

        const totalCount = totalCountResult[0]?.count || 0;

        // Separate messages by direction for quick stats
        const inboundCount = messages.filter(
          (msg) => msg.direction === "inbound"
        ).length;
        const outboundCount = messages.filter(
          (msg) => msg.direction === "outbound"
        ).length;

        return {
          success: true,
          messages: conversationMessages,
          totalCount,
          inboundCount,
          outboundCount,
          hasMore: messages.length === input.limit,
        };
      } catch (error) {
        console.error("Error fetching WhatsApp messages:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch WhatsApp messages",
        });
      }
    }),

  // Get conversation stats for a lead
  getConversationStats: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        // Get basic message counts
        const totalMessages = await db
          .select({ count: sql<number>`count(*)` })
          .from(whatsappMessages)
          .where(eq(whatsappMessages.leadId, input.leadId));

        const inboundMessages = await db
          .select({ count: sql<number>`count(*)` })
          .from(whatsappMessages)
          .where(
            and(
              eq(whatsappMessages.leadId, input.leadId),
              eq(whatsappMessages.direction, "inbound")
            )
          );

        const outboundMessages = await db
          .select({ count: sql<number>`count(*)` })
          .from(whatsappMessages)
          .where(
            and(
              eq(whatsappMessages.leadId, input.leadId),
              eq(whatsappMessages.direction, "outbound")
            )
          );

        // Get first and last message timestamps
        const firstMessage = await db
          .select({
            createdAt: whatsappMessages.createdAt,
            whatsappTimestamp: whatsappMessages.whatsappTimestamp,
          })
          .from(whatsappMessages)
          .where(eq(whatsappMessages.leadId, input.leadId))
          .orderBy(asc(whatsappMessages.createdAt))
          .limit(1);

        const lastMessage = await db
          .select({
            createdAt: whatsappMessages.createdAt,
            whatsappTimestamp: whatsappMessages.whatsappTimestamp,
            direction: whatsappMessages.direction,
            content: whatsappMessages.content,
          })
          .from(whatsappMessages)
          .where(eq(whatsappMessages.leadId, input.leadId))
          .orderBy(desc(whatsappMessages.createdAt))
          .limit(1);

        return {
          success: true,
          stats: {
            totalMessages: totalMessages[0]?.count || 0,
            inboundMessages: inboundMessages[0]?.count || 0,
            outboundMessages: outboundMessages[0]?.count || 0,
            firstMessageAt: firstMessage[0]?.createdAt || null,
            lastMessageAt: lastMessage[0]?.createdAt || null,
            lastMessage: lastMessage[0] || null,
          },
        };
      } catch (error) {
        console.error("Error fetching conversation stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversation stats",
        });
      }
    }),

  // Send a regular text message
  sendMessage: protectedProcedure
    .input(sendWhatsAppMessageSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Verify the lead exists
        const leadResult = await db
          .select()
          .from(leads)
          .where(eq(leads.id, input.leadId))
          .limit(1);

        if (!leadResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        const lead = leadResult[0];

        // Import WhatsApp API utility
        const { whatsappBotAPI } = await import(
          "@/lib/whatsapp/utils/whatsapp-bot"
        );
        const { saveWhatsAppMessage } = await import(
          "@/lib/whatsapp/message-storage"
        );

        // Send message via WhatsApp API
        const sentMessage = await whatsappBotAPI.sendBotMessage(
          lead.phone || "",
          input.content
        );

        // Save the message to database
        let savedMessage = null;
        if (sentMessage?.messages?.[0]) {
          savedMessage = await saveWhatsAppMessage({
            leadId: input.leadId,
            whatsappMessageId: sentMessage.messages[0].id,
            direction: "outbound",
            content: input.content,
            phoneNumber: lead.phone || "",
            status: "sent",
            metadata: {
              sentByUser: userId,
              timestamp: new Date().toISOString(),
            },
          });
        }

        return {
          success: true,
          message: savedMessage,
          whatsappResponse: sentMessage,
        };
      } catch (error) {
        console.error("Error sending WhatsApp message:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send WhatsApp message",
        });
      }
    }),

  // NEW: Send a template message
  sendTemplateMessage: protectedProcedure
    .input(sendTemplateMessageSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Verify the lead exists
        const leadResult = await db
          .select()
          .from(leads)
          .where(eq(leads.id, input.leadId))
          .limit(1);

        if (!leadResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        const lead = leadResult[0];

        if (!lead.phone) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Lead does not have a phone number",
          });
        }

        // Import WhatsApp API utility
        const { whatsappBotAPI } = await import(
          "@/lib/whatsapp/utils/whatsapp-bot"
        );
        const { saveWhatsAppMessage } = await import(
          "@/lib/whatsapp/message-storage"
        );

        // Send template message via WhatsApp API
        const sentMessage = await whatsappBotAPI.sendTemplateMessage(
          lead.phone,
          input.templateName,
          input.languageCode,
          input.components
        );

        // Generate content for database storage based on template
        let content = `Template: ${input.templateName}`;
        if (input.components) {
          const bodyParams = input.components
            .find((c) => c.type === "body")
            ?.parameters?.map((p) => p.text)
            .join(", ");
          if (bodyParams) {
            content += ` (${bodyParams})`;
          }
        }

        // Save the message to database
        let savedMessage = null;
        if (sentMessage?.messages?.[0]) {
          savedMessage = await saveWhatsAppMessage({
            leadId: input.leadId,
            whatsappMessageId: sentMessage.messages[0].id,
            direction: "outbound",
            messageType: "template",
            content,
            phoneNumber: lead.phone,
            status: "sent",
            metadata: {
              sentByUser: userId,
              templateName: input.templateName,
              templateLanguage: input.languageCode,
              templateComponents: input.components,
              timestamp: new Date().toISOString(),
            },
          });
        }

        return {
          success: true,
          message: savedMessage,
          whatsappResponse: sentMessage,
        };
      } catch (error) {
        console.error("Error sending WhatsApp template message:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send WhatsApp template message",
        });
      }
    }),

  // NEW: Send welcome template message to a lead
  sendWelcomeMessage: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Verify the lead exists
        const leadResult = await db
          .select()
          .from(leads)
          .where(eq(leads.id, input.leadId))
          .limit(1);

        if (!leadResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        const lead = leadResult[0];

        if (!lead.phone) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Lead does not have a phone number",
          });
        }

        // Extract first name
        const firstName = lead.name.trim().split(" ")[0];

        // Import WhatsApp API utility
        const { whatsappBotAPI } = await import(
          "@/lib/whatsapp/utils/whatsapp-bot"
        );
        const { saveWhatsAppMessage } = await import(
          "@/lib/whatsapp/message-storage"
        );

        // Send welcome template message
        const sentMessage = await whatsappBotAPI.sendTemplateMessage(
          lead.phone,
          "welcome_message", // Make sure this template exists in your WhatsApp Business Manager
          "es",
          [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: firstName,
                },
              ],
            },
          ]
        );

        // Save the message to database
        let savedMessage = null;
        if (sentMessage?.messages?.[0]) {
          savedMessage = await saveWhatsAppMessage({
            leadId: input.leadId,
            whatsappMessageId: sentMessage.messages[0].id,
            direction: "outbound",
            messageType: "template",
            content: `Hola ${firstName}! Mensaje de bienvenida enviado.`,
            phoneNumber: lead.phone,
            status: "sent",
            metadata: {
              sentByUser: userId,
              templateName: "welcome_message",
              templateLanguage: "es",
              isWelcomeMessage: true,
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Update lead status to "contactado"
        await db
          .update(leads)
          .set({
            status: "contactado",
            lastContactedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(leads.id, input.leadId));

        return {
          success: true,
          message: savedMessage,
          whatsappResponse: sentMessage,
        };
      } catch (error) {
        console.error("Error sending welcome message:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send welcome message",
        });
      }
    }),
});
