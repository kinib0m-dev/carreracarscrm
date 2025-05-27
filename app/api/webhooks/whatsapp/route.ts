import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  leads,
  leadStatusEnum,
  timeframeEnum,
  leadTypeEnum,
  webhookLogs,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateWhatsAppBotResponse } from "@/lib/whatsapp/bot-response";
import {
  saveWhatsAppMessage,
  updateMessageStatus,
} from "@/lib/whatsapp/message-storage";
import {
  whatsappBotAPI,
  WhatsAppIncomingMessage,
} from "@/lib/whatsapp/utils/whatsapp-bot";
import type {
  WhatsAppContact,
  WhatsAppMessage,
  WhatsAppStatus,
  WhatsAppAPIResponse,
} from "@/types/whatsapp";
import type { Lead } from "@/types/database";
import { setNextFollowUpDate } from "@/lib/whatsapp/followup/followup-service";
import { FOLLOW_UP_CONFIG } from "@/lib/whatsapp/followup/followup-config";

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// GET - Webhook verification
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST - Handle incoming messages and status updates
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: WhatsAppIncomingMessage = await request.json();

    // Log the webhook event
    await logWebhookEvent("whatsapp_incoming", body);

    // Process the webhook
    await processWhatsAppWebhook(body);

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function logWebhookEvent(
  eventType: string,
  payload: WhatsAppIncomingMessage
): Promise<void> {
  try {
    await db.insert(webhookLogs).values({
      eventType,
      payload: JSON.stringify(payload),
      status: "received",
    });
  } catch (error) {
    console.error("Error logging webhook event:", error);
  }
}

async function processWhatsAppWebhook(
  body: WhatsAppIncomingMessage
): Promise<void> {
  if (body.object !== "whatsapp_business_account") {
    return;
  }

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field === "messages") {
        const value = change.value;

        // Process new contacts
        if (value.contacts) {
          for (const contact of value.contacts) {
            await handleNewContact(contact);
          }
        }

        // Process incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessage(message);
          }
        }

        // Process message status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await handleMessageStatus(status);
          }
        }
      }
    }
  }
}

async function handleNewContact(contact: WhatsAppContact): Promise<void> {
  try {
    const { wa_id, profile } = contact;
    const phone = `+${wa_id}`;
    const name = profile.name || "WhatsApp User";

    // Check if lead already exists
    const existingLead = await db
      .select()
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1);

    if (existingLead.length === 0) {
      // Create new lead
      const [newLead] = await db
        .insert(leads)
        .values({
          name,
          phone,
          status: "nuevo" as (typeof leadStatusEnum.enumValues)[number],
          lastContactedAt: new Date(),
          followUpCount: 0, // Initialize follow-up count
        })
        .returning();

      // Send welcome message to new lead with delay
      await sendWelcomeMessage(phone, name, newLead.id);

      // Set initial follow-up date
      await setNextFollowUpDate(newLead.id);
    } else {
      console.log(`Lead already exists for phone: ${phone}`);
    }
  } catch (error) {
    console.error("Error handling new contact:", error);
  }
}

async function sendWelcomeMessage(
  phone: string,
  name: string,
  leadId: string
): Promise<void> {
  try {
    // Extract first name
    const firstName = name.trim().split(" ")[0];

    await new Promise((resolve) =>
      setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
    );

    // Send welcome message
    const welcomeMessage = `Hola ${firstName}! Soy Pedro de Carrera Cars. ¿Estás buscando algún vehículo en especial o solo estás viendo opciones?`;

    const sentMessage: WhatsAppAPIResponse =
      await whatsappBotAPI.sendBotMessage(phone, welcomeMessage);

    if (sentMessage?.messages?.[0]) {
      // Save the welcome message to database
      await saveWhatsAppMessage({
        leadId,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: welcomeMessage,
        phoneNumber: phone,
        status: "sent",
        metadata: {
          isWelcomeMessage: true,
        },
      });

      // Update lead status to "contactado"
      await db
        .update(leads)
        .set({
          status: "contactado" as (typeof leadStatusEnum.enumValues)[number],
          lastContactedAt: new Date(),
        })
        .where(eq(leads.id, leadId));
    }
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }
}

async function handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
  try {
    const { from, id: messageId, text, timestamp } = message;
    const phone = `+${from}`;
    const messageText = text?.body;

    if (!messageText) {
      return;
    }

    // Don't mark as read immediately - we'll do it before responding

    // Find or create the lead
    let lead = await db
      .select()
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1)
      .then((results) => results[0] as Lead | undefined);

    if (!lead) {
      // Create new lead if doesn't exist
      const [newLead] = await db
        .insert(leads)
        .values({
          name: "WhatsApp User",
          phone,
          status: "nuevo" as (typeof leadStatusEnum.enumValues)[number],
          lastContactedAt: new Date(),
          lastMessageAt: new Date(),
          followUpCount: 0,
        })
        .returning();

      lead = newLead as Lead;
    }

    // Save incoming message to database
    await saveWhatsAppMessage({
      leadId: lead.id,
      whatsappMessageId: messageId,
      direction: "inbound",
      content: messageText,
      phoneNumber: phone,
      whatsappTimestamp: new Date(parseInt(timestamp) * 1000),
      status: "received",
    });

    // Reset follow-up count and set next follow-up since they responded
    await setNextFollowUpDate(lead.id);

    // Generate bot response
    const { response: botResponse, leadUpdate } =
      await generateWhatsAppBotResponse(messageText, lead.id);

    // Apply lead updates to database
    if (leadUpdate && Object.keys(leadUpdate).length > 0) {
      const updateData: Partial<{
        status: (typeof leadStatusEnum.enumValues)[number];
        budget: string;
        expectedPurchaseTimeframe: (typeof timeframeEnum.enumValues)[number];
        type: (typeof leadTypeEnum.enumValues)[number];
        lastContactedAt: Date;
        lastMessageAt: Date;
        nextFollowUpDate: Date;
        followUpCount: number;
        updatedAt: Date;
      }> = {
        updatedAt: new Date(),
        lastContactedAt: new Date(),
        lastMessageAt: new Date(),
        followUpCount: 0, // Reset follow-up count when they respond
      };

      // Validate status against the enum before updating
      if (leadUpdate.status) {
        const validStatuses = leadStatusEnum.enumValues;

        if (
          validStatuses.includes(
            leadUpdate.status as (typeof leadStatusEnum.enumValues)[number]
          )
        ) {
          updateData.status =
            leadUpdate.status as (typeof leadStatusEnum.enumValues)[number];
        } else {
          console.error(`❌ Invalid status: ${leadUpdate.status}`);
        }
      }

      if (leadUpdate.budget) updateData.budget = leadUpdate.budget;
      if (leadUpdate.expectedPurchaseTimeframe) {
        updateData.expectedPurchaseTimeframe =
          leadUpdate.expectedPurchaseTimeframe as (typeof timeframeEnum.enumValues)[number];
      }
      if (leadUpdate.type) {
        updateData.type =
          leadUpdate.type as (typeof leadTypeEnum.enumValues)[number];
      }
      if (leadUpdate.nextFollowUpDate)
        updateData.nextFollowUpDate = leadUpdate.nextFollowUpDate;

      // Update lead in database
      await db
        .update(leads)
        .set(updateData)
        .where(eq(leads.id, lead.id))
        .returning();

      // Handle additional preference fields in separate table
      if (
        leadUpdate.preferredVehicleType ||
        leadUpdate.preferredBrand ||
        leadUpdate.preferredFuelType ||
        leadUpdate.maxKilometers ||
        leadUpdate.minYear ||
        leadUpdate.maxYear ||
        leadUpdate.needsFinancing !== undefined ||
        leadUpdate.minBudget ||
        leadUpdate.maxBudget
      ) {
        const { updateLeadPreferences } = await import(
          "@/lib/whatsapp/lead-preferences"
        );
        await updateLeadPreferences(lead.id, leadUpdate);
      }

      // Parse and update budget preferences if budget string is provided
      if (leadUpdate.budget) {
        const { updateLeadBudgetPreferences } = await import(
          "@/lib/whatsapp/lead-preferences"
        );
        await updateLeadBudgetPreferences(lead.id, leadUpdate.budget);
      }
    }
    await new Promise((resolve) =>
      setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
    );

    // Mark message as read just before responding (more natural behavior)
    await whatsappBotAPI.markAsRead(messageId);

    // Send bot response via WhatsApp
    const sentMessage = await whatsappBotAPI.sendBotMessage(phone, botResponse);

    // Save outbound message to database
    if (sentMessage?.messages?.[0]) {
      await saveWhatsAppMessage({
        leadId: lead.id,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: botResponse,
        phoneNumber: phone,
        status: "sent",
      });
    }
  } catch (error) {
    console.error("Error handling incoming message:", error);

    // Send fallback message with delay and mark as read before responding
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
      );
      await whatsappBotAPI.markAsRead(message.id);
      await whatsappBotAPI.sendBotMessage(
        `+${message.from}`,
        "Perdón, ha habido un problema técnico. Un momento por favor..."
      );
    } catch (fallbackError) {
      console.error("Error sending fallback message:", fallbackError);
    }
  }
}

async function handleMessageStatus(status: WhatsAppStatus): Promise<void> {
  try {
    const { id: messageId, status: messageStatus } = status;

    // Update message status in database
    await updateMessageStatus(messageId, messageStatus);
  } catch (error) {
    console.error("Error handling message status:", error);
  }
}
