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
import type { WhatsAppMessage, WhatsAppStatus } from "@/types/whatsapp";
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
        // We now only handle messages from existing leads

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

// Enhanced message handler with status check - only for existing active leads
async function handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
  try {
    const { from, id: messageId, text, timestamp } = message;
    const phone = `+${from}`;
    const messageText = text?.body;

    if (!messageText) {
      return;
    }

    // Find existing lead
    const lead = await db
      .select()
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1)
      .then((results) => results[0] as Lead | undefined);

    // If no lead exists, DO NOT REPLY
    if (!lead) {
      console.log(
        `🚫 No lead found for phone ${phone} - ignoring message: "${messageText}"`
      );
      return;
    }

    // Check if lead has been escalated to manager or other final statuses
    const managerStatuses = [
      "manager",
      "iniciado",
      "documentacion",
      "comprador",
      "descartado",
      "sin_interes",
      "inactivo",
      "perdido",
      "rechazado",
      "sin_opciones",
    ];

    if (managerStatuses.includes(lead.status)) {
      // Still save the incoming message for record keeping
      await saveWhatsAppMessage({
        leadId: lead.id,
        whatsappMessageId: messageId,
        direction: "inbound",
        content: messageText,
        phoneNumber: phone,
        whatsappTimestamp: new Date(parseInt(timestamp) * 1000),
        status: "received",
        metadata: {
          botStatus: "ignored_due_to_escalation",
          leadStatus: lead.status,
          timestamp: new Date().toISOString(),
        },
      });

      // Mark message as read but don't respond
      setTimeout(async () => {
        try {
          await whatsappBotAPI.markAsRead(messageId);
        } catch (error) {
          console.error(`Error marking message ${messageId} as read:`, error);
        }
      }, 1000);

      return; // Exit without processing or responding
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

    // Process the message with enhanced bot response (only for active leads)
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
        // Send manager escalation email in the background (don't wait for it)
        const { sendManagerEscalationEmail } = await import(
          "@/lib/utils/manager-emails"
        );
        sendManagerEscalationEmail(
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
    await new Promise((resolve) =>
      setTimeout(resolve, FOLLOW_UP_CONFIG.MESSAGE_DELAY)
    );

    // Send bot response
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
      }
    }

    // Mark original message as read AFTER sending the response
    setTimeout(async () => {
      try {
        await whatsappBotAPI.markAsRead(messageId);
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
