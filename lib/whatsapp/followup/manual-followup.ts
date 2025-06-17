import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { whatsappBotAPI } from "../utils/whatsapp-bot";
import { saveWhatsAppMessage } from "../message-storage";
import { FOLLOW_UP_CONFIG, getFollowUpMessage } from "./followup-config";

export async function sendFollowUpMessage(leadId: string) {
  try {
    // Get lead data
    const leadResult = await db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        status: leads.status,
        followUpCount: sql<number>`COALESCE(${leads.followUpCount}, 0)`.as(
          "followUpCount"
        ),
      })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    const lead = leadResult[0];

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    if (!lead.phone) {
      return { success: false, error: "Lead has no phone number" };
    }

    // Check if max follow-ups reached
    if (lead.followUpCount >= FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS) {
      return { success: false, error: "Maximum follow-ups reached" };
    }

    // Check if status allows follow-ups
    if (!FOLLOW_UP_CONFIG.ACTIVE_STATUSES.includes(lead.status)) {
      return { success: false, error: "Lead status doesn't allow follow-ups" };
    }

    // Get follow-up message
    const followUpMessage = getFollowUpMessage(lead.status, lead.followUpCount);

    // Send the message
    const sentMessage = await whatsappBotAPI.sendBotMessage(
      lead.phone,
      followUpMessage
    );

    // Save to database
    if (sentMessage?.messages?.[0]) {
      await saveWhatsAppMessage({
        leadId: lead.id,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: followUpMessage,
        phoneNumber: lead.phone,
        status: "sent",
        metadata: {
          isFollowUp: true,
          followUpCount: lead.followUpCount + 1,
          isManual: true, // Mark as manual follow-up
        },
      });
    }

    // Update follow-up count
    const newFollowUpCount = lead.followUpCount + 1;
    await db
      .update(leads)
      .set({
        followUpCount: newFollowUpCount,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    return {
      success: true,
      followUpCount: newFollowUpCount,
    };
  } catch (error) {
    console.error("Error sending manual follow-up:", error);
    return { success: false, error: "Failed to send follow-up" };
  }
}
