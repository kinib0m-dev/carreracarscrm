import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, leadStatusEnum, timeframeEnum, webhookLogs } from "@/db/schema";
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
import type { Lead, LeadUpdateData } from "@/types/database";

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// GET - Webhook verification
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("WhatsApp webhook verification failed");
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
      await db.insert(leads).values({
        name,
        phone,
        status: "nuevo" as (typeof leadStatusEnum.enumValues)[number],
        lastContactedAt: new Date(),
      });

      console.log(`Created new lead: ${name} (${phone})`);
    }
  } catch (error) {
    console.error("Error handling new contact:", error);
  }
}

async function handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
  try {
    const { from, id: messageId, text, timestamp } = message;
    const phone = `+${from}`;
    const messageText = text?.body;

    if (!messageText) {
      console.log("Received non-text message, skipping");
      return;
    }

    console.log(`Received message from ${phone}: ${messageText}`);

    // Mark message as read
    await whatsappBotAPI.markAsRead(messageId);

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

    // Generate bot response
    const {
      response: botResponse,
      leadUpdate,
      shouldEscalate,
    } = await generateWhatsAppBotResponse(messageText, lead.id);

    // Update lead information
    if (leadUpdate) {
      const updateData: LeadUpdateData = { updatedAt: new Date() };

      if (leadUpdate.status) updateData.status = leadUpdate.status;
      if (leadUpdate.budget) updateData.budget = leadUpdate.budget;
      if (leadUpdate.expectedPurchaseTimeframe) {
        updateData.expectedPurchaseTimeframe =
          leadUpdate.expectedPurchaseTimeframe as (typeof timeframeEnum.enumValues)[number];
      }
      if (leadUpdate.type) updateData.type = leadUpdate.type;
      if (leadUpdate.lastContactedAt)
        updateData.lastContactedAt = leadUpdate.lastContactedAt;
      if (leadUpdate.lastMessageAt)
        updateData.lastMessageAt = leadUpdate.lastMessageAt;
      if (leadUpdate.nextFollowUpDate)
        updateData.nextFollowUpDate = leadUpdate.nextFollowUpDate;

      await db.update(leads).set(updateData).where(eq(leads.id, lead.id));
    }

    // Send bot response via WhatsApp
    const sentMessage: WhatsAppAPIResponse =
      await whatsappBotAPI.sendBotMessage(phone, botResponse);

    // Save outbound message to database
    if (sentMessage && sentMessage.messages && sentMessage.messages[0]) {
      await saveWhatsAppMessage({
        leadId: lead.id,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: botResponse,
        phoneNumber: phone,
        status: "sent",
      });
    }

    // Handle escalation to manager
    if (shouldEscalate) {
      await db
        .update(leads)
        .set({
          status: "manager" as (typeof leadStatusEnum.enumValues)[number],
          nextFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .where(eq(leads.id, lead.id));

      console.log(`🚨 Lead ${lead.name} (${phone}) escalated to manager`);
      // TODO: Send notification to sales team
    }

    // Update lead status if it was nuevo
    if (lead.status === "nuevo") {
      await db
        .update(leads)
        .set({
          status: "contactado" as (typeof leadStatusEnum.enumValues)[number],
          lastContactedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));
    }

    console.log(`✅ Sent response to ${phone}: ${botResponse}`);
  } catch (error) {
    console.error("Error handling incoming message:", error);

    // Send fallback message
    try {
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

    console.log(`Updated message ${messageId} status to: ${messageStatus}`);
  } catch (error) {
    console.error("Error handling message status:", error);
  }
}
