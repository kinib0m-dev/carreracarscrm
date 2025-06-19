import { db } from "@/db";
import { whatsappMessages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { WhatsAppMessageRecord } from "@/types/database";

interface SaveMessageParams {
  leadId: string;
  whatsappMessageId?: string;
  direction: "inbound" | "outbound";
  messageType?: string; // Added this field to match the database schema
  content: string;
  phoneNumber: string;
  whatsappTimestamp?: Date;
  status?: string;
  errorMessage?: string; // Added this field to match the database schema
  metadata?: Record<string, unknown>;
}

/**
 * Save a WhatsApp message to the database
 */
export async function saveWhatsAppMessage(
  params: SaveMessageParams
): Promise<WhatsAppMessageRecord> {
  try {
    const [savedMessage] = await db
      .insert(whatsappMessages)
      .values({
        leadId: params.leadId,
        whatsappMessageId: params.whatsappMessageId,
        direction: params.direction,
        messageType: params.messageType || "text", // Default to "text" if not provided
        content: params.content,
        phoneNumber: params.phoneNumber,
        whatsappTimestamp: params.whatsappTimestamp || new Date(),
        status: params.status || "sent",
        errorMessage: params.errorMessage,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      })
      .returning();

    return savedMessage as WhatsAppMessageRecord;
  } catch (error) {
    console.error("Error saving WhatsApp message:", error);
    throw error;
  }
}

/**
 * Get conversation history for a lead
 */
export async function getConversationHistory(
  leadId: string,
  limit: number = 10
): Promise<WhatsAppMessageRecord[]> {
  try {
    const messages = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.leadId, leadId))
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(limit);

    // Return in chronological order (oldest first)
    return (messages as WhatsAppMessageRecord[]).reverse();
  } catch (error) {
    console.error("Error getting conversation history:", error);
    return [];
  }
}

/**
 * Update message status (for delivery receipts)
 */
export async function updateMessageStatus(
  whatsappMessageId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    await db
      .update(whatsappMessages)
      .set({
        status,
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(whatsappMessages.whatsappMessageId, whatsappMessageId));
  } catch (error) {
    console.error("Error updating message status:", error);
  }
}

/**
 * Get the last message sent to a lead (for follow-up logic)
 */
export async function getLastMessageForLead(
  leadId: string
): Promise<WhatsAppMessageRecord | null> {
  try {
    const messages = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.leadId, leadId))
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(1);

    return messages.length > 0 ? (messages[0] as WhatsAppMessageRecord) : null;
  } catch (error) {
    console.error("Error getting last message for lead:", error);
    return null;
  }
}

/**
 * Get total message count for a lead
 */
export async function getMessageCountForLead(leadId: string): Promise<number> {
  try {
    const result = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.leadId, leadId));

    return result.length;
  } catch (error) {
    console.error("Error getting message count for lead:", error);
    return 0;
  }
}

/**
 * Get messages by status (useful for retry logic)
 */
export async function getMessagesByStatus(
  status: string,
  limit: number = 50
): Promise<WhatsAppMessageRecord[]> {
  try {
    const messages = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.status, status))
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(limit);

    return messages as WhatsAppMessageRecord[];
  } catch (error) {
    console.error("Error getting messages by status:", error);
    return [];
  }
}

/**
 * Save a template message with specific metadata
 */
export async function saveTemplateMessage(params: {
  leadId: string;
  whatsappMessageId: string;
  templateName: string;
  templateLanguage: string;
  templateComponents?: Array<{
    type: "header" | "body" | "button";
    parameters?: Array<{ type: "text"; text: string }>;
  }>;
  content: string;
  phoneNumber: string;
  status?: string;
  sentByUser?: string;
}): Promise<WhatsAppMessageRecord> {
  const metadata = {
    templateName: params.templateName,
    templateLanguage: params.templateLanguage,
    templateComponents: params.templateComponents,
    sentByUser: params.sentByUser,
    isTemplateMessage: true,
    timestamp: new Date().toISOString(),
  };

  return saveWhatsAppMessage({
    leadId: params.leadId,
    whatsappMessageId: params.whatsappMessageId,
    direction: "outbound",
    messageType: "template",
    content: params.content,
    phoneNumber: params.phoneNumber,
    status: params.status || "sent",
    metadata,
  });
}
