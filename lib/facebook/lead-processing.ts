import { db } from "@/db";
import { leads, campaigns, webhookLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFacebookFormData } from "./facebook-api";

export async function processFacebookLead(leadData: FacebookLeadgenValue) {
  try {
    // Update the webhook log status
    await db
      .update(webhookLogs)
      .set({ status: "processing" })
      .where(eq(webhookLogs.payload, JSON.stringify(leadData)));

    const leadId = leadData.leadgen_id;
    const formId = leadData.form_id;

    // Fetch the detailed lead info from Facebook API
    const leadInfo = await getFacebookFormData(leadId);

    // Find the campaign by form ID
    const campaignResult = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.formId, formId))
      .limit(1);

    // Default user ID for now (you'll want to improve this logic later)
    const userId =
      campaignResult.length > 0
        ? campaignResult[0].userId
        : process.env.DEFAULT_USER_ID;

    if (!userId) {
      throw new Error("No user ID found for processing lead");
    }

    // Extract lead details from Facebook response
    let name = "";
    let email = "";
    let phone = "";

    for (const field of leadInfo.field_data) {
      if (field.name === "full_name") {
        name = field.values[0];
      } else if (field.name === "email") {
        email = field.values[0];
      } else if (field.name === "phone_number") {
        phone = field.values[0];
      }
    }

    // Create the lead in your database
    const [newLead] = await db
      .insert(leads)
      .values({
        name: name || "Unknown Name",
        email: email || null,
        phone: phone || null,
        status: "nuevo",
        campaignId: campaignResult.length > 0 ? campaignResult[0].id : null,
      })
      .returning();

    // Update the webhook log
    await db
      .update(webhookLogs)
      .set({
        status: "processed",
        processedAt: new Date(),
      })
      .where(eq(webhookLogs.payload, JSON.stringify(leadData)));

    return newLead;
  } catch (error) {
    console.error("Error processing Facebook lead:", error);

    // Update the webhook log with error
    await db
      .update(webhookLogs)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        processedAt: new Date(),
      })
      .where(eq(webhookLogs.payload, JSON.stringify(leadData)));

    throw error;
  }
}
