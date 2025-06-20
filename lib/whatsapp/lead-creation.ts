import { db } from "@/db";
import { leads, leadStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { whatsappBotAPI } from "./utils/whatsapp-bot";
import { saveWhatsAppMessage } from "./message-storage";

export interface CreateLeadParams {
  name: string;
  phone: string;
  email?: string | null;
  status?: (typeof leadStatusEnum.enumValues)[number];
  campaignId?: string | null;
  sendWelcomeMessage?: boolean;
}

/**
 * Creates a lead and optionally sends a WhatsApp welcome message
 * Unified function for both manual and automated lead creation
 */
export async function createLeadWithWhatsApp({
  name,
  phone,
  email,
  status = "nuevo",
  campaignId,
  sendWelcomeMessage = true,
}: CreateLeadParams) {
  try {
    // Check if lead already exists
    const existingLead = await db
      .select()
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1);

    if (existingLead.length > 0) {
      return existingLead[0];
    }

    // Create new lead
    const [newLead] = await db
      .insert(leads)
      .values({
        name,
        phone,
        email,
        status,
        campaignId,
        lastContactedAt: sendWelcomeMessage ? new Date() : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Send welcome message if requested and phone is provided
    if (sendWelcomeMessage && phone) {
      await sendWelcomeMessageToLead(newLead.id, phone, name);
    }

    return newLead;
  } catch (error) {
    console.error("Error creating lead with WhatsApp:", error);
    throw error;
  }
}

/**
 * Sends a welcome message to a lead and updates their status
 * Uses fallback strategy: Template first, then regular text message
 */
export async function sendWelcomeMessageToLead(
  leadId: string,
  phone: string,
  name: string
): Promise<void> {
  try {
    // Format phone number (ensure it starts with +)
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    // Extract first name
    const firstName = name.trim().split(" ")[0];

    let sentMessage = null;
    let messageContent = "";
    let messageType = "text";
    const metadata: Record<string, unknown> = {
      isWelcomeMessage: true,
      timestamp: new Date().toISOString(),
    };

    // Try template message first
    try {
      console.log(`Attempting to send template message to ${formattedPhone}`);

      sentMessage = await whatsappBotAPI.sendTemplateMessage(
        formattedPhone,
        "welcome_message", // Your template name
        "es_ES",
        []
      );

      messageContent = `Hola! Soy Pedro de Carrera Cars. ¿Estás buscando algún vehículo en especial o solo estás viendo opciones?`;
      messageType = "template";
      metadata.templateName = "welcome_message";
      metadata.templateLanguage = "es";

      console.log("Template message sent successfully");
    } catch (templateError) {
      console.warn(
        "Template message failed, falling back to text message:",
        templateError
      );

      // Fallback to regular text message
      messageContent = `Hola ${firstName}! Soy Pedro de Carrera Cars. ¿Estás buscando algún vehículo en especial o solo estás viendo opciones?`;

      sentMessage = await whatsappBotAPI.sendBotMessage(
        formattedPhone,
        messageContent
      );

      messageType = "text";
      metadata.fallbackFromTemplate = true;
      metadata.templateError =
        templateError instanceof Error
          ? templateError.message
          : String(templateError);

      console.log("Fallback text message sent successfully");
    }

    // Save the message to database
    if (sentMessage?.messages?.[0]) {
      await saveWhatsAppMessage({
        leadId,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: messageContent,
        phoneNumber: formattedPhone,
        status: "sent",
        messageType,
        metadata,
      });
    }

    // Update lead status to "contactado"
    await db
      .update(leads)
      .set({
        status: "contactado" as (typeof leadStatusEnum.enumValues)[number],
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    console.log(`Welcome message sent successfully to lead ${leadId}`);
  } catch (error) {
    console.error(`Error sending welcome message to lead ${leadId}:`, error);
    // Don't throw here to avoid breaking lead creation
    // But we should log this for monitoring
  }
}

/**
 * Sends welcome message to existing leads that haven't been contacted
 */
export async function sendWelcomeToUncontactedLeads(): Promise<void> {
  try {
    // Find leads with status "nuevo" that have phone numbers
    const uncontactedLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.status, "nuevo"));

    for (const lead of uncontactedLeads) {
      if (lead.phone) {
        await sendWelcomeMessageToLead(lead.id, lead.phone, lead.name);
        // Add small delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error(
      "Error sending welcome messages to uncontacted leads:",
      error
    );
  }
}
