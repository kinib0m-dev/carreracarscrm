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
import {
  generateWhatsAppBotResponse,
  saveCarContextToMessage,
} from "@/lib/whatsapp/bot-response";
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
import type {
  WhatsAppContact,
  WhatsAppMessage,
  WhatsAppStatus,
  WhatsAppAPIResponse,
} from "@/types/whatsapp";
import type { Lead } from "@/types/database";
import type { RelevantCar } from "@/types/bot";

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// Define types for lead update data
interface LeadUpdateData {
  status?: (typeof leadStatusEnum.enumValues)[number];
  budget?: string;
  expectedPurchaseTimeframe?: (typeof timeframeEnum.enumValues)[number];
  type?: (typeof leadTypeEnum.enumValues)[number];
  lastContactedAt?: Date;
  lastMessageAt?: Date;
  nextFollowUpDate?: Date;
  followUpCount?: number;
  updatedAt?: Date;
}

// Define type for message metadata
interface MessageMetadata {
  respondingToMessage?: string;
  hasCarContext?: boolean;
  selectedCars?: string[];
  carCount?: number;
  timestamp?: string;
  isWelcomeMessage?: boolean;
  [key: string]: unknown; // Allow additional properties
}

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
      // Prepare welcome message metadata
      const welcomeMetadata: MessageMetadata = {
        isWelcomeMessage: true,
      };

      // Save the welcome message to database
      await saveWhatsAppMessage({
        leadId,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: welcomeMessage,
        phoneNumber: phone,
        status: "sent",
        metadata: welcomeMetadata,
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

// Enhanced message handler with car context support
async function handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
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

    // Process the message with enhanced bot response
    await processMessage(lead, messageText, messageId);
  } catch (error) {
    console.error("Error handling incoming message:", error);
  }
}

// Enhanced message processing with car context
async function processMessage(
  lead: Lead,
  messageText: string,
  messageId: string
): Promise<void> {
  try {
    console.log(`🔄 Processing message for ${lead.name}: "${messageText}"`);

    // Store the previous status to check for escalation
    const previousStatus = lead.status;

    // Reset follow-up count and set next follow-up since they responded
    await setNextFollowUpDate(lead.id);

    // Generate enhanced bot response with car context
    const {
      response: botResponse,
      leadUpdate,
      selectedCars,
    } = await generateWhatsAppBotResponse(messageText, lead.id);

    console.log(
      `📋 Bot response generated. Selected cars: ${selectedCars?.length || 0}`
    );

    // Apply lead updates to database
    if (leadUpdate && Object.keys(leadUpdate).length > 0) {
      const updateData: LeadUpdateData = {
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
      await db.update(leads).set(updateData).where(eq(leads.id, lead.id));

      // Check if lead was escalated to manager status and send email notification
      if (updateData.status === "manager" && previousStatus !== "manager") {
        console.log(
          `🚀 Lead ${lead.name} escalated to manager status - sending email notification`
        );

        // Send manager escalation email in the background (don't wait for it)
        const { sendEnhancedManagerEscalationEmail } = await import(
          "@/lib/utils/manager-emails"
        );
        sendEnhancedManagerEscalationEmail(
          lead.id,
          lead.name,
          lead.phone || "No phone provided",
          lead.email
        ).catch((emailError) => {
          console.error(
            "Error sending enhanced manager escalation email:",
            emailError
          );
        });
      }

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
        await updateLeadPreferences(lead.id, leadUpdate);
      }

      if (leadUpdate.budget) {
        const { updateLeadBudgetPreferences } = await import(
          "@/lib/whatsapp/lead-preferences"
        );
        await updateLeadBudgetPreferences(lead.id, leadUpdate.budget);
      }
    }

    // Add natural delay before responding
    console.log(
      `⏱️ Adding ${FOLLOW_UP_CONFIG.MESSAGE_DELAY / 1000}s delay before bot response...`
    );
    await new Promise((resolve) =>
      setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
    );

    // Send bot response
    console.log(`📤 Sending bot response to ${lead.phone}: "${botResponse}"`);
    const sentMessage = await whatsappBotAPI.sendBotMessage(
      lead.phone,
      botResponse
    );

    // Save outbound message to database with enhanced metadata
    if (sentMessage?.messages?.[0]) {
      const outboundMessageId = sentMessage.messages[0].id;

      // Prepare metadata with car context
      const messageMetadata: MessageMetadata = {
        respondingToMessage: messageId,
        hasCarContext: !!(selectedCars && selectedCars.length > 0),
        timestamp: new Date().toISOString(),
      };

      // Add selected car IDs to metadata if available
      if (selectedCars && selectedCars.length > 0) {
        messageMetadata.selectedCars = selectedCars.map(
          (car: RelevantCar) => car.id
        );
        messageMetadata.carCount = selectedCars.length;
      }

      await saveWhatsAppMessage({
        leadId: lead.id,
        whatsappMessageId: outboundMessageId,
        direction: "outbound",
        content: botResponse,
        phoneNumber: lead.phone,
        status: "sent",
        metadata: messageMetadata,
      });

      // Save car context for future reference if cars were selected
      if (selectedCars && selectedCars.length > 0) {
        await saveCarContextToMessage(lead.id, outboundMessageId, selectedCars);
        console.log(`📚 Saved context for ${selectedCars.length} cars`);
      }

      console.log(`✅ Bot response sent successfully`);
    }

    // Mark original message as read AFTER sending the response
    setTimeout(async () => {
      try {
        await whatsappBotAPI.markAsRead(messageId);
        console.log(`📖 Marked message ${messageId} as read`);
      } catch (error) {
        console.error(`Error marking message ${messageId} as read:`, error);
        // Don't fail the whole process if marking as read fails
      }
    }, 1000); // 1 second delay
  } catch (error) {
    console.error("Error processing message:", error);

    // Send fallback message
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
      );
      await whatsappBotAPI.sendBotMessage(
        lead.phone,
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
    await updateMessageStatus(messageId, messageStatus);
  } catch (error) {
    console.error("Error handling message status:", error);
  }
}
