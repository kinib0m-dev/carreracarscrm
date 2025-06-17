import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { whatsappBotAPI } from "@/lib/whatsapp/utils/whatsapp-bot";
import { saveWhatsAppMessage } from "@/lib/whatsapp/message-storage";
import {
  FOLLOW_UP_CONFIG,
  getFollowUpMessage,
} from "@/lib/whatsapp/followup/followup-config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: leadId } = await params;

    // Get lead data
    const leadResult = await db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        status: leads.status,
        followUpCount: sql<number>`COALESCE(${leads.followUpCount}, 0)`.as(
          "followUpCount"
        ),
      })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    const lead = leadResult[0];

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.phone) {
      return NextResponse.json(
        { error: "Lead has no phone number" },
        { status: 400 }
      );
    }

    // Check if max follow-ups reached
    if (lead.followUpCount >= FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS) {
      return NextResponse.json(
        { error: "Maximum follow-ups reached" },
        { status: 400 }
      );
    }

    // Check if status allows follow-ups
    if (!FOLLOW_UP_CONFIG.ACTIVE_STATUSES.includes(lead.status)) {
      return NextResponse.json(
        { error: "Lead status doesn't allow follow-ups" },
        { status: 400 }
      );
    }

    // Get follow-up message
    const followUpMessage = getFollowUpMessage(lead.status, lead.followUpCount);

    // Send the message
    const sentMessage = await whatsappBotAPI.sendBotMessage(
      lead.phone,
      followUpMessage
    );

    // Save to database
    if (sentMessage?.messages?.[0]) {
      await saveWhatsAppMessage({
        leadId: lead.id,
        whatsappMessageId: sentMessage.messages[0].id,
        direction: "outbound",
        content: followUpMessage,
        phoneNumber: lead.phone,
        status: "sent",
        metadata: {
          isFollowUp: true,
          followUpCount: lead.followUpCount + 1,
          isManual: true, // Mark as manual follow-up
        },
      });
    }

    // Update follow-up count
    const newFollowUpCount = lead.followUpCount + 1;
    await db
      .update(leads)
      .set({
        followUpCount: newFollowUpCount,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    return NextResponse.json({
      success: true,
      message: "Follow-up sent successfully",
      followUpCount: newFollowUpCount,
    });
  } catch (error) {
    console.error("Error sending manual follow-up:", error);
    return NextResponse.json(
      { error: "Failed to send follow-up" },
      { status: 500 }
    );
  }
}
