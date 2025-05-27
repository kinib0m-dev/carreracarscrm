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
import { setNextFollowUpDate } from "@/lib/whatsapp/followup/followup-service";
import { FOLLOW_UP_CONFIG } from "@/lib/whatsapp/followup/followup-config";
import { addMessageToQueue } from "@/lib/whatsapp/message-debouncing";
import type {
  WhatsAppContact,
  WhatsAppMessage,
  WhatsAppStatus,
  WhatsAppAPIResponse,
} from "@/types/whatsapp";
import type { Lead } from "@/types/database";

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

        // Process incoming messages with debouncing
        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessageWithDebouncing(message);
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
          followUpCount: 0,
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

    // Add natural delay before sending welcome message
    console.log(
      `⏱️ Adding ${FOLLOW_UP_CONFIG.MESSAGE_DELAY / 1000}s delay before sending welcome message...`
    );
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

// New debounced message handler
async function handleIncomingMessageWithDebouncing(
  message: WhatsAppMessage
): Promise<void> {
  try {
    const { from, id: messageId, text, timestamp } = message;
    const phone = `+${from}`;
    const messageText = text?.body;

    if (!messageText) {
      return;
    }

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

    // Save incoming message to database immediately
    await saveWhatsAppMessage({
      leadId: lead.id,
      whatsappMessageId: messageId,
      direction: "inbound",
      content: messageText,
      phoneNumber: phone,
      whatsappTimestamp: new Date(parseInt(timestamp) * 1000),
      status: "received",
    });

    // Add message to debouncing queue
    await addMessageToQueue(
      lead.id,
      messageId,
      messageText,
      phone,
      new Date(parseInt(timestamp) * 1000),
      processAccumulatedMessages
    );
  } catch (error) {
    console.error("Error handling incoming message:", error);
  }
}

// Process accumulated messages as one conversation
async function processAccumulatedMessages(
  leadId: string,
  combinedMessage: string,
  messageIds: string[]
): Promise<void> {
  try {
    // Get lead info
    const lead = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1)
      .then((results) => results[0] as Lead | undefined);

    if (!lead) {
      console.error(
        `Lead ${leadId} not found when processing accumulated messages`
      );
      return;
    }

    console.log(
      `🔄 Processing combined message for ${lead.name}: "${combinedMessage}"`
    );

    // Reset follow-up count and set next follow-up since they responded
    await setNextFollowUpDate(leadId);

    // Generate bot response for the combined message
    const { response: botResponse, leadUpdate } =
      await generateWhatsAppBotResponse(combinedMessage, leadId);

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
        followUpCount: 0,
      };

      // Validate and apply status update
      if (leadUpdate.status) {
        const validStatuses = leadStatusEnum.enumValues;
        if (
          validStatuses.includes(
            leadUpdate.status as (typeof leadStatusEnum.enumValues)[number]
          )
        ) {
          updateData.status =
            leadUpdate.status as (typeof leadStatusEnum.enumValues)[number];
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

      // Update lead in database
      await db.update(leads).set(updateData).where(eq(leads.id, leadId));

      // Handle additional preference fields
      if (
        leadUpdate.preferredVehicleType ||
        leadUpdate.preferredBrand ||
        leadUpdate.preferredFuelType ||
        leadUpdate.maxKilometers ||
        leadUpdate.minYear ||
        leadUpdate.maxYear ||
        leadUpdate.needsFinancing !== undefined
      ) {
        const { updateLeadPreferences } = await import(
          "@/lib/whatsapp/lead-preferences"
        );
        await updateLeadPreferences(leadId, leadUpdate);
      }

      if (leadUpdate.budget) {
        const { updateLeadBudgetPreferences } = await import(
          "@/lib/whatsapp/lead-preferences"
        );
        await updateLeadBudgetPreferences(leadId, leadUpdate.budget);
      }
    }

    // Add natural delay before responding
    console.log(
      `⏱️ Adding ${FOLLOW_UP_CONFIG.MESSAGE_DELAY / 1000}s delay before bot response...`
    );
    await new Promise((resolve) =>
      setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
    );

    // Mark all accumulated messages as read just before responding
    for (const messageId of messageIds) {
      await whatsappBotAPI.markAsRead(messageId);
    }

    // Send single bot response for all accumulated messages
    const sentMessage = await whatsappBotAPI.sendBotMessage(
      lead.phone,
      botResponse
    );

    // Save outbound message to database
    if (sentMessage?.messages?.[0]) {
      await saveWhatsAppMessage({
        leadId,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: botResponse,
        phoneNumber: lead.phone,
        status: "sent",
        metadata: {
          respondingToMessages: messageIds.length,
          combinedMessage: true,
        },
      });
    }
  } catch (error) {
    console.error("Error processing accumulated messages:", error);

    // Send fallback message
    try {
      const lead = await db
        .select()
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1)
        .then((results) => results[0] as Lead | undefined);

      if (lead) {
        await new Promise((resolve) =>
          setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
        );
        await whatsappBotAPI.sendBotMessage(
          lead.phone,
          "Perdón, ha habido un problema técnico. Un momento por favor..."
        );
      }
    } catch (fallbackError) {
      console.error("Error sending fallback message:", fallbackError);
    }
  }
}

async function handleMessageStatus(status: WhatsAppStatus): Promise<void> {
  try {
    const { id: messageId, status: messageStatus } = status;
    await updateMessageStatus(messageId, messageStatus);
  } catch (error) {
    console.error("Error handling message status:", error);
  }
}
