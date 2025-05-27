import { db } from "@/db";
import { leads, leadStatusEnum } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { FOLLOW_UP_CONFIG, getFollowUpMessage } from "./followup-config";
import { whatsappBotAPI } from "../utils/whatsapp-bot";
import { saveWhatsAppMessage } from "../message-storage";

interface LeadForFollowUp {
  id: string;
  name: string;
  phone: string;
  status: string;
  lastMessageAt: Date | null;
  nextFollowUpDate: Date | null;
  followUpCount: number;
}

/**
 * Check for leads that need follow-up and send messages
 */
export async function processFollowUps(): Promise<void> {
  try {
    const now = new Date();

    // Find leads that need follow-up
    const leadsNeedingFollowUp = (await db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        status: leads.status,
        lastMessageAt: leads.lastMessageAt,
        nextFollowUpDate: leads.nextFollowUpDate,
        followUpCount: sql<number>`COALESCE(${leads.followUpCount}, 0)`.as(
          "followUpCount"
        ),
      })
      .from(leads)
      .where(
        and(
          // Lead has a phone number
          sql`${leads.phone} IS NOT NULL AND ${leads.phone} != ''`,
          // Lead is in an active status
          sql`${leads.status} = ANY(${FOLLOW_UP_CONFIG.ACTIVE_STATUSES})`,
          // Next follow-up date has passed
          lt(leads.nextFollowUpDate, now),
          // Haven't exceeded max follow-ups
          sql`COALESCE(${leads.followUpCount}, 0) < ${FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS}`
        )
      )) as LeadForFollowUp[];

    for (const lead of leadsNeedingFollowUp) {
      try {
        await sendFollowUpMessage(lead);
        // Add delay between follow-ups to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error sending follow-up to lead ${lead.id}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Error in processFollowUps:", error);
  }
}

/**
 * Send a follow-up message to a specific lead
 */
async function sendFollowUpMessage(lead: LeadForFollowUp): Promise<void> {
  try {
    // Check if we've already sent too many follow-ups
    if (lead.followUpCount >= FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS) {
      // Mark as inactive
      await updateLeadFollowUpStatus(
        lead.id,
        "inactivo",
        null,
        lead.followUpCount
      );
      return;
    }
    // Get the appropriate follow-up message
    const followUpMessage = getFollowUpMessage(lead.status, lead.followUpCount);

    // Send the message with delay
    await new Promise((resolve) =>
      setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
    );

    const sentMessage = await whatsappBotAPI.sendBotMessage(
      lead.phone,
      followUpMessage
    );

    // Save the follow-up message to database
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
        },
      });
    }

    // Calculate next follow-up date
    const nextFollowUpDate = new Date(
      Date.now() + FOLLOW_UP_CONFIG.FOLLOW_UP_THRESHOLD
    );

    // Update lead with new follow-up info
    await updateLeadFollowUpStatus(
      lead.id,
      lead.status,
      nextFollowUpDate,
      lead.followUpCount + 1
    );
  } catch (error) {
    console.error(
      `❌ Error sending follow-up message to lead ${lead.id}:`,
      error
    );
  }
}

/**
 * Update lead's follow-up status and next follow-up date
 */
async function updateLeadFollowUpStatus(
  leadId: string,
  status: string,
  nextFollowUpDate: Date | null,
  followUpCount: number
): Promise<void> {
  try {
    await db
      .update(leads)
      .set({
        status: status as (typeof leadStatusEnum.enumValues)[number],
        nextFollowUpDate,
        followUpCount,
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));
  } catch (error) {
    console.error(`Error updating lead follow-up status for ${leadId}:`, error);
  }
}

/**
 * Set next follow-up date for a lead when they receive a message
 */
export async function setNextFollowUpDate(leadId: string): Promise<void> {
  try {
    const nextFollowUpDate = new Date(
      Date.now() + FOLLOW_UP_CONFIG.FOLLOW_UP_THRESHOLD
    );

    await db
      .update(leads)
      .set({
        nextFollowUpDate,
        // Reset follow-up count when they respond
        followUpCount: 0,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));
  } catch (error) {
    console.error(
      `❌ Error setting next follow-up date for lead ${leadId}:`,
      error
    );
  }
}

/**
 * Check if a lead has been inactive for too long and update status
 */
export async function checkAndMarkInactiveLeads(): Promise<void> {
  try {
    const cutoffDate = new Date(
      Date.now() -
        FOLLOW_UP_CONFIG.FOLLOW_UP_THRESHOLD *
          FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS *
          2
    );

    // Find leads that haven't responded after max follow-ups and sufficient time
    const inactiveLeads = await db
      .select({ id: leads.id, name: leads.name })
      .from(leads)
      .where(
        and(
          sql`${leads.status} = ANY(${FOLLOW_UP_CONFIG.ACTIVE_STATUSES})`,
          sql`COALESCE(${leads.followUpCount}, 0) >= ${FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS}`,
          lt(leads.lastMessageAt, cutoffDate)
        )
      );

    for (const lead of inactiveLeads) {
      await db
        .update(leads)
        .set({
          status: "inactivo" as (typeof leadStatusEnum.enumValues)[number],
          nextFollowUpDate: null,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));
    }
  } catch (error) {
    console.error("❌ Error checking for inactive leads:", error);
  }
}
