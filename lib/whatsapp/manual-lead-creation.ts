import { db } from "@/db";
import { leads, leadStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { whatsappBotAPI } from "./utils/whatsapp-bot";
import { saveWhatsAppMessage } from "./message-storage";

/**
 * Creates a lead manually and sends WhatsApp welcome message
 * Use this when creating leads through your CRM interface
 */
export async function createLeadWithWelcomeMessage({
  name,
  phone,
  email,
  campaignId,
}: {
  name: string;
  phone: string;
  email?: string;
  campaignId?: string;
}) {
  try {
    console.log(`Creating lead manually: ${name} (${phone})`);

    // Check if lead already exists
    const existingLead = await db
      .select()
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1);

    if (existingLead.length > 0) {
      console.log(`Lead already exists for phone: ${phone}`);
      return existingLead[0];
    }

    // Create new lead with "nuevo" status
    const [newLead] = await db
      .insert(leads)
      .values({
        name,
        phone,
        email,
        status: "nuevo" as (typeof leadStatusEnum.enumValues)[number],
        campaignId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`✅ Created new lead: ${name} (${phone})`);

    // Send welcome message via WhatsApp
    await sendWelcomeMessageToNewLead(newLead.id, phone, name);

    return newLead;
  } catch (error) {
    console.error("Error creating lead with welcome message:", error);
    throw error;
  }
}

/**
 * Sends welcome message to a newly created lead
 */
async function sendWelcomeMessageToNewLead(
  leadId: string,
  phone: string,
  name: string
): Promise<void> {
  try {
    // Format phone number (ensure it starts with +)
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    console.log(
      `Sending welcome message to new lead ${leadId} at ${formattedPhone}`
    );

    // Send welcome message
    const welcomeMessage = `¡Hola ${name}! Soy Pedro de Carrera Cars 👋 ¿Estás buscando algún vehículo en especial o solo estás viendo opciones?`;

    const sentMessage = await whatsappBotAPI.sendBotMessage(
      formattedPhone,
      welcomeMessage
    );

    if (sentMessage?.messages?.[0]) {
      // Save the message to database
      await saveWhatsAppMessage({
        leadId,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: welcomeMessage,
        phoneNumber: formattedPhone,
        status: "sent",
      });

      // Update lead status to "contactado"
      await db
        .update(leads)
        .set({
          status: "contactado" as (typeof leadStatusEnum.enumValues)[number],
          lastContactedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      console.log(`✅ Welcome message sent to lead ${leadId}`);
    } else {
      console.error(`Failed to send WhatsApp message to ${formattedPhone}`);
    }
  } catch (error) {
    console.error(`Error sending welcome message to lead ${leadId}:`, error);

    // Log the specific error for debugging
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

/**
 * Send welcome message to existing lead with "nuevo" status
 * Use this to send messages to leads that were created but haven't been contacted
 */
export async function sendWelcomeToUncontactedLeads(): Promise<void> {
  try {
    // Find leads with status "nuevo" that have phone numbers
    const uncontactedLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.status, "nuevo"));

    console.log(`Found ${uncontactedLeads.length} uncontacted leads`);

    for (const lead of uncontactedLeads) {
      if (lead.phone) {
        await sendWelcomeMessageToNewLead(lead.id, lead.phone, lead.name);

        // Add delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    console.log(`✅ Processed ${uncontactedLeads.length} uncontacted leads`);
  } catch (error) {
    console.error(
      "Error sending welcome messages to uncontacted leads:",
      error
    );
  }
}

/**
 * Test function to send a single welcome message
 * Use this for debugging
 */
export async function testWelcomeMessage(
  phone: string,
  name: string
): Promise<void> {
  try {
    console.log(`Testing welcome message to ${phone}`);

    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    const welcomeMessage = `Hola ${name}! Soy Pedro de Carrera Cars ¿Estás buscando algún vehículo en especial o solo estás viendo opciones?`;

    const result = await whatsappBotAPI.sendBotMessage(
      formattedPhone,
      welcomeMessage
    );

    console.log("Test message result:", result);
  } catch (error) {
    console.error("Error in test message:", error);
  }
}
