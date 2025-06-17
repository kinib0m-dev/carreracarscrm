import { db } from "@/db";
import { leads, leadStatusEnum } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { FOLLOW_UP_CONFIG } from "./followup-config";

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
