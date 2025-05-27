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
  try {
    const searchParams = request.nextUrl.searchParams;

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("WhatsApp verification attempt:", {
      mode,
      token: token ? "***" : "missing",
      challenge,
    });

    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN && challenge) {
      console.log("WhatsApp webhook verified successfully");
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.log("WhatsApp webhook verification failed - invalid parameters");
    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    console.error("Error in WhatsApp webhook verification:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST - Handle incoming messages and status updates
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("WhatsApp webhook POST received");

    // Add request logging
    const body: WhatsAppIncomingMessage = await request.json();
    console.log("WhatsApp webhook body:", JSON.stringify(body, null, 2));

    // Log the webhook event first
    await logWebhookEvent("whatsapp_incoming", body);

    // Process the webhook
    await processWhatsAppWebhook(body);

    console.log("WhatsApp webhook processed successfully");
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);

    // Log the error in webhook logs
    try {
      await logWebhookEvent("whatsapp_error", {
        error: error instanceof Error ? error.message : String(error),
      });
    } catch (logError) {
      console.error("Failed to log webhook error:", logError);
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function logWebhookEvent(
  eventType: string,
  payload: WhatsAppIncomingMessage | Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(webhookLogs).values({
      eventType,
      payload: JSON.stringify(payload),
      status: "received",
    });
    console.log(`Logged webhook event: ${eventType}`);
  } catch (error) {
    console.error("Error logging webhook event:", error);
  }
}

async function processWhatsAppWebhook(
  body: WhatsAppIncomingMessage
): Promise<void> {
  console.log("Processing WhatsApp webhook...");

  if (body.object !== "whatsapp_business_account") {
    console.log("Not a WhatsApp business account webhook, skipping");
    return;
  }

  if (!body.entry || body.entry.length === 0) {
    console.log("No entries in webhook, skipping");
    return;
  }

  for (const entry of body.entry) {
    console.log("Processing entry:", entry.id);

    if (!entry.changes || entry.changes.length === 0) {
      console.log("No changes in entry, skipping");
      continue;
    }

    for (const change of entry.changes) {
      console.log("Processing change:", change.field);

      if (change.field === "messages") {
        const value = change.value;
        console.log(
          "Processing messages value:",
          JSON.stringify(value, null, 2)
        );

        // Process new contacts
        if (value.contacts && value.contacts.length > 0) {
          console.log("Processing contacts...");
          for (const contact of value.contacts) {
            await handleNewContact(contact);
          }
        }

        // Process incoming messages
        if (value.messages && value.messages.length > 0) {
          console.log("Processing messages...");
          for (const message of value.messages) {
            await handleIncomingMessage(message);
          }
        }

        // Process message status updates
        if (value.statuses && value.statuses.length > 0) {
          console.log("Processing status updates...");
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
    const name = profile?.name || "WhatsApp User";

    console.log(`Processing new contact: ${name} (${phone})`);

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
        })
        .returning();

      console.log(
        `Created new lead: ${name} (${phone}) with ID: ${newLead.id}`
      );
    } else {
      console.log(`Lead already exists for phone: ${phone}`);
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

    console.log(`Processing message from ${phone}: ${messageText}`);

    if (!messageText) {
      console.log("Received non-text message, skipping");
      return;
    }

    // Mark message as read first
    try {
      await whatsappBotAPI.markAsRead(messageId);
      console.log(`Marked message ${messageId} as read`);
    } catch (markError) {
      console.error("Error marking message as read:", markError);
      // Continue processing even if mark as read fails
    }

    // Find or create the lead
    let lead = await db
      .select()
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1)
      .then((results) => results[0] as Lead | undefined);

    if (!lead) {
      console.log(`Creating new lead for phone: ${phone}`);
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
      console.log(`Created new lead with ID: ${lead.id}`);
    }

    // Save incoming message to database
    console.log("Saving incoming message...");
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
    console.log("Generating bot response...");
    const {
      response: botResponse,
      leadUpdate,
      shouldEscalate,
    } = await generateWhatsAppBotResponse(messageText, lead.id);

    console.log(`Generated bot response: ${botResponse}`);

    // Update lead information if needed
    if (leadUpdate) {
      console.log("Updating lead with new information...");
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
      console.log("Lead updated successfully");
    }

    // Send bot response via WhatsApp
    console.log("Sending bot response via WhatsApp...");
    const sentMessage: WhatsAppAPIResponse =
      await whatsappBotAPI.sendBotMessage(phone, botResponse);

    console.log("WhatsApp response:", JSON.stringify(sentMessage, null, 2));

    // Save outbound message to database
    if (sentMessage && sentMessage.messages && sentMessage.messages[0]) {
      console.log("Saving outbound message...");
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
      console.log("Escalating to manager...");
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
      console.log("Updating lead status from 'nuevo' to 'contactado'...");
      await db
        .update(leads)
        .set({
          status: "contactado" as (typeof leadStatusEnum.enumValues)[number],
          lastContactedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));
    }

    console.log(`✅ Successfully processed message from ${phone}`);
  } catch (error) {
    console.error("Error handling incoming message:", error);

    // Send fallback message
    try {
      console.log("Sending fallback message...");
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

    console.log(`Updating message ${messageId} status to: ${messageStatus}`);

    // Update message status in database
    await updateMessageStatus(messageId, messageStatus);

    console.log(`✅ Updated message ${messageId} status to: ${messageStatus}`);
  } catch (error) {
    console.error("Error handling message status:", error);
  }
}
