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
    console.log("WhatsApp webhook POST received");

    // Log the webhook event
    await logWebhookEvent("whatsapp_incoming", body);

    // Process the webhook
    await processWhatsAppWebhook(body);

    console.log("WhatsApp webhook processed successfully");
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
    console.log("Logged webhook event:", eventType);
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
    console.log("Processing entry:", entry.id);
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
          console.log("Processing messages...");
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

      console.log(`Created new lead: ${name} (${phone})`);

      // Send welcome message to new lead
      await sendWelcomeMessage(phone, name, newLead.id);
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
    console.log(`Sending welcome message to ${phone}`);

    // Send welcome message
    const welcomeMessage = `¡Hola ${name}! Soy Pedro de Carrera Cars 👋 ¿Estás buscando algún vehículo en especial o solo estás viendo opciones?`;

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
      });

      // Update lead status to "contactado"
      await db
        .update(leads)
        .set({
          status: "contactado" as (typeof leadStatusEnum.enumValues)[number],
          lastContactedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      console.log(`✅ Welcome message sent to ${phone}`);
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
      console.log("Received non-text message, skipping");
      return;
    }

    console.log(`Received message from ${phone}: ${messageText}`);

    // Mark message as read
    const readResponse = await whatsappBotAPI.markAsRead(messageId);
    console.log(
      "WhatsApp API response status:",
      readResponse ? "200" : "error"
    );
    console.log("WhatsApp API response data:", readResponse);

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
      console.log(`Created new lead for existing conversation: ${phone}`);
    } else {
      console.log(`Lead already exists for phone: ${phone}`);
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

    console.log("Generated bot response:", botResponse);

    // Apply lead updates to database with enhanced fields
    if (leadUpdate && Object.keys(leadUpdate).length > 0) {
      console.log("Applying lead updates:", leadUpdate);

      // Create properly typed update data for leads table
      const updateData: Partial<{
        status: (typeof leadStatusEnum.enumValues)[number];
        budget: string;
        expectedPurchaseTimeframe: (typeof timeframeEnum.enumValues)[number];
        type: (typeof leadTypeEnum.enumValues)[number];
        lastContactedAt: Date;
        lastMessageAt: Date;
        nextFollowUpDate: Date;
        updatedAt: Date;
      }> = { updatedAt: new Date() };

      // Core lead fields - only add fields that exist in the leads table
      if (leadUpdate.status) {
        updateData.status =
          leadUpdate.status as (typeof leadStatusEnum.enumValues)[number];
        console.log(`Updating status to: ${leadUpdate.status}`);
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
      if (leadUpdate.lastContactedAt)
        updateData.lastContactedAt = leadUpdate.lastContactedAt;
      if (leadUpdate.lastMessageAt)
        updateData.lastMessageAt = leadUpdate.lastMessageAt;
      if (leadUpdate.nextFollowUpDate)
        updateData.nextFollowUpDate = leadUpdate.nextFollowUpDate;

      // Update lead in database only if we have fields to update
      if (Object.keys(updateData).length > 1) {
        // More than just updatedAt
        await db.update(leads).set(updateData).where(eq(leads.id, lead.id));
        console.log("✅ Lead updated successfully");
      }

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
        console.log("Additional preferences detected:", {
          preferredVehicleType: leadUpdate.preferredVehicleType,
          preferredBrand: leadUpdate.preferredBrand,
          preferredFuelType: leadUpdate.preferredFuelType,
          maxKilometers: leadUpdate.maxKilometers,
          minYear: leadUpdate.minYear,
          maxYear: leadUpdate.maxYear,
          needsFinancing: leadUpdate.needsFinancing,
          minBudget: leadUpdate.minBudget,
          maxBudget: leadUpdate.maxBudget,
        });

        // Import and use the preferences helper
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

    // Send bot response via WhatsApp
    console.log(`Sending WhatsApp message to ${from}: ${botResponse}`);
    const sentMessage: WhatsAppAPIResponse =
      await whatsappBotAPI.sendBotMessage(phone, botResponse);

    console.log("WhatsApp API response status:", sentMessage ? "200" : "error");
    console.log("WhatsApp API response data:", sentMessage);

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

    console.log(`✅ Successfully processed message from ${phone}`);
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

    console.log(`✅ Updated message ${messageId} status to: ${messageStatus}`);
  } catch (error) {
    console.error("Error handling message status:", error);
  }
}
