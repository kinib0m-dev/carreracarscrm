import { db } from "@/db";
import { leads, leadStatusEnum } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { whatsappBotAPI } from "../utils/whatsapp-bot";
import { saveWhatsAppMessage } from "../message-storage";
import { FOLLOW_UP_CONFIG, getFollowUpMessage } from "./followup-config";

interface LeadForFollowUp {
  id: string;
  name: string;
  phone: string;
  status: string;
  lastMessageAt: Date | null;
  nextFollowUpDate: Date | null;
  followUpCount: number;
}

// Define which statuses should have follow-up dates set
const BOT_MANAGED_STATUSES = [
  "nuevo",
  "contactado",
  "activo",
  "calificado",
  "propuesta",
  "evaluando",
];

/**
 * Check if a status should have follow-up dates
 */
function shouldHaveFollowUpDate(status: string): boolean {
  return BOT_MANAGED_STATUSES.includes(status);
}

/**
 * Check for leads that need follow-up and send messages
 */
export async function processFollowUps(): Promise<void> {
  try {
    console.log("🔄 Starting follow-up processing...");

    const now = new Date();

    // Find leads that need follow-up with proper SQL - only for bot-managed statuses
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
          // Lead is in a bot-managed status
          sql`${leads.status} IN ('nuevo', 'contactado', 'activo', 'calificado', 'propuesta', 'evaluando')`,
          // Next follow-up date has passed
          sql`${leads.nextFollowUpDate} IS NOT NULL AND ${leads.nextFollowUpDate} < ${now}`,
          // Haven't exceeded max follow-ups
          sql`COALESCE(${leads.followUpCount}, 0) < ${FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS}`
        )
      )) as LeadForFollowUp[];

    console.log(
      `📋 Found ${leadsNeedingFollowUp.length} leads needing follow-up`
    );

    for (const lead of leadsNeedingFollowUp) {
      try {
        await sendFollowUpMessage(lead);

        // Add delay between follow-ups to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error sending follow-up to lead ${lead.id}:`, error);
      }
    }

    console.log("✅ Follow-up processing completed");
  } catch (error) {
    console.error("❌ Error in processFollowUps:", error);
  }
}

/**
 * Send a follow-up message to a specific lead
 */
async function sendFollowUpMessage(lead: LeadForFollowUp): Promise<void> {
  try {
    console.log(`📤 Sending follow-up to ${lead.name} (${lead.phone})`);

    // Check if we've already sent too many follow-ups
    if (lead.followUpCount >= FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS) {
      console.log(`⏭️ Skipping lead ${lead.id} - max follow-ups reached`);

      // Mark as inactive with NO follow-up date
      await updateLeadFollowUpStatus(
        lead.id,
        "inactivo",
        null, // No follow-up date for inactive leads
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

    // Calculate next follow-up date ONLY if the lead is still in a bot-managed status
    const nextFollowUpDate = shouldHaveFollowUpDate(lead.status)
      ? new Date(Date.now() + FOLLOW_UP_CONFIG.FOLLOW_UP_THRESHOLD)
      : null;

    // Update lead with new follow-up info
    await updateLeadFollowUpStatus(
      lead.id,
      lead.status,
      nextFollowUpDate,
      lead.followUpCount + 1
    );

    console.log(
      `✅ Follow-up sent to ${lead.name} (count: ${lead.followUpCount + 1})`
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
 * Now respects status-based follow-up logic
 */
async function updateLeadFollowUpStatus(
  leadId: string,
  status: string,
  nextFollowUpDate: Date | null,
  followUpCount: number
): Promise<void> {
  try {
    // Only set follow-up date if status allows it
    const finalNextFollowUpDate = shouldHaveFollowUpDate(status)
      ? nextFollowUpDate
      : null;

    await db
      .update(leads)
      .set({
        status: status as (typeof leadStatusEnum.enumValues)[number],
        nextFollowUpDate: finalNextFollowUpDate,
        followUpCount,
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    if (finalNextFollowUpDate) {
      console.log(
        `📅 Next follow-up set for lead ${leadId}: ${finalNextFollowUpDate.toISOString()}`
      );
    } else {
      console.log(
        `🚫 No follow-up date set for lead ${leadId} (status: ${status})`
      );
    }
  } catch (error) {
    console.error(
      `❌ Error updating lead follow-up status for ${leadId}:`,
      error
    );
  }
}

/**
 * Set next follow-up date for a lead when they receive a message
 * Now respects status-based follow-up logic
 */
export async function setNextFollowUpDate(leadId: string): Promise<void> {
  try {
    // First, get the current lead to check its status
    const lead = await db
      .select({ status: leads.status })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1)
      .then((results) => results[0]);

    if (!lead) {
      console.error(`❌ Lead ${leadId} not found`);
      return;
    }

    // Only set follow-up date if the lead is in a bot-managed status
    const nextFollowUpDate = shouldHaveFollowUpDate(lead.status)
      ? new Date(Date.now() + FOLLOW_UP_CONFIG.FOLLOW_UP_THRESHOLD)
      : null;

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

    if (nextFollowUpDate) {
      console.log(
        `📅 Next follow-up set for lead ${leadId}: ${nextFollowUpDate.toISOString()}`
      );
    } else {
      console.log(
        `🚫 No follow-up date set for lead ${leadId} (status: ${lead.status})`
      );
    }
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
    // Only check bot-managed statuses
    const inactiveLeads = await db
      .select({ id: leads.id, name: leads.name })
      .from(leads)
      .where(
        and(
          sql`${leads.status} IN ('nuevo', 'contactado', 'activo', 'calificado', 'propuesta', 'evaluando')`,
          sql`COALESCE(${leads.followUpCount}, 0) >= ${FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS}`,
          sql`${leads.lastMessageAt} IS NOT NULL AND ${leads.lastMessageAt} < ${cutoffDate}`
        )
      );

    for (const lead of inactiveLeads) {
      await db
        .update(leads)
        .set({
          status: "inactivo" as (typeof leadStatusEnum.enumValues)[number],
          nextFollowUpDate: null, // Remove follow-up date when marking as inactive
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      console.log(`😴 Marked lead ${lead.name} (${lead.id}) as inactive`);
    }

    if (inactiveLeads.length > 0) {
      console.log(`😴 Marked ${inactiveLeads.length} leads as inactive`);
    }
  } catch (error) {
    console.error("❌ Error checking for inactive leads:", error);
  }
}

/**
 * Clear follow-up dates for leads that are no longer in bot-managed statuses
 * This is a utility function to clean up existing data
 */
export async function clearFollowUpDatesForNonBotStatuses(): Promise<void> {
  try {
    console.log(
      "🧹 Cleaning up follow-up dates for non-bot-managed statuses..."
    );

    await db
      .update(leads)
      .set({
        nextFollowUpDate: null,
        updatedAt: new Date(),
      })
      .where(
        sql`${leads.status} NOT IN ('nuevo', 'contactado', 'activo', 'calificado', 'propuesta', 'evaluando')`
      );

    console.log(`✅ Cleared follow-up dates for leads in non-bot statuses`);
  } catch (error) {
    console.error("❌ Error clearing follow-up dates:", error);
  }
}
