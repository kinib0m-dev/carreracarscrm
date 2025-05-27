import { db } from "@/db";
import { whatsappMessages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { WhatsAppMessageRecord } from "@/types/database";

interface SaveMessageParams {
  leadId: string;
  whatsappMessageId?: string;
  direction: "inbound" | "outbound";
  content: string;
  phoneNumber: string;
  whatsappTimestamp?: Date;
  status?: string;
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
        content: params.content,
        phoneNumber: params.phoneNumber,
        whatsappTimestamp: params.whatsappTimestamp || new Date(),
        status: params.status || "sent",
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
  status: string
): Promise<void> {
  try {
    await db
      .update(whatsappMessages)
      .set({
        status,
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
 * Get follow-up messages sent to a lead
 */
export async function getFollowUpMessagesForLead(
  leadId: string
): Promise<WhatsAppMessageRecord[]> {
  try {
    const messages = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.leadId, leadId))
      .orderBy(desc(whatsappMessages.createdAt));

    // Filter messages that have follow-up metadata
    return (messages as WhatsAppMessageRecord[]).filter((msg) => {
      try {
        const metadata = msg.metadata ? JSON.parse(msg.metadata) : {};
        return metadata.isFollowUp === true;
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.error("Error getting follow-up messages for lead:", error);
    return [];
  }
}
