import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns, webhookLogs, leads } from "@/db/schema";
import { createLeadWithWhatsApp } from "@/lib/whatsapp/lead-creation";
import { desc, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const {
      name = "Test Facebook User",
      email = "test@facebook.com",
      phone = "+34612345678",
      formId = "test_form_123",
      simulate = true,
    } = await request.json();

    console.log("📥 Processing test Facebook lead:", {
      name,
      email,
      phone,
      formId,
    });

    // Create or find a test campaign
    let campaign;
    const existingCampaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.formId, formId))
      .limit(1);

    campaign = existingCampaign[0];

    if (!campaign) {
      // Create test campaign
      const [newCampaign] = await db
        .insert(campaigns)
        .values({
          userId: process.env.DEFAULT_USER_ID || "cm3n4q7hs0000lbrif5v5zf99", // Use a real user ID
          name: "Facebook Test Campaign",
          type: "facebook",
          formId: formId,
          description: "Test campaign for Facebook lead generation",
        })
        .returning();

      campaign = newCampaign;
      console.log("✅ Created test campaign:", campaign);
    } else {
      console.log("✅ Using existing campaign:", campaign);
    }

    if (simulate) {
      // Simulate the entire Facebook webhook flow without API calls
      const mockLeadgenValue = {
        leadgen_id: `test_lead_${Date.now()}`,
        form_id: formId,
        page_id: "test_page_123",
        created_time: Math.floor(Date.now() / 1000),
        ad_id: "test_ad_123",
        ad_name: "Test Facebook Ad",
      };

      // Log the webhook event
      await db.insert(webhookLogs).values({
        eventType: "facebook_lead_test",
        payload: JSON.stringify({
          object: "page",
          entry: [
            {
              id: "test_page_123",
              time: Math.floor(Date.now() / 1000),
              changes: [
                {
                  field: "leadgen",
                  value: mockLeadgenValue,
                },
              ],
            },
          ],
        }),
        status: "received",
      });

      // Process the lead directly (bypass Facebook API call)
      console.log("🔄 Processing Facebook lead without API call...");

      // Format phone number for Spain if it doesn't have country code
      let formattedPhone = phone;
      if (phone && !phone.startsWith("+")) {
        if (
          phone.startsWith("6") ||
          phone.startsWith("7") ||
          phone.startsWith("9")
        ) {
          formattedPhone = `+34${phone}`;
        }
      }

      // Create the lead using the WhatsApp helper
      const newLead = await createLeadWithWhatsApp({
        name: name || "Facebook Lead",
        phone: formattedPhone,
        email: email || null,
        status: "nuevo",
        campaignId: campaign.id,
        sendWelcomeMessage: !!formattedPhone, // Only send if we have a phone number
      });

      // Update webhook log to processed
      await db
        .update(webhookLogs)
        .set({
          status: "processed",
          processedAt: new Date(),
        })
        .where(eq(webhookLogs.eventType, "facebook_lead_test"));

      console.log("✅ Facebook lead processed successfully:", newLead);

      return NextResponse.json({
        success: true,
        message: "Test Facebook lead processed successfully",
        leadData: newLead,
        campaign: campaign,
        mockData: {
          leadgenValue: mockLeadgenValue,
          formattedPhone,
          willSendWhatsApp: !!formattedPhone,
        },
      });
    } else {
      // Direct lead creation (bypass webhook simulation)
      console.log("🔄 Creating lead directly...");

      const newLead = await createLeadWithWhatsApp({
        name,
        phone,
        email,
        campaignId: campaign.id,
        sendWelcomeMessage: true,
      });

      console.log("✅ Lead created directly:", newLead);

      return NextResponse.json({
        success: true,
        message: "Test lead created directly (no webhook simulation)",
        leadData: newLead,
        campaign: campaign,
      });
    }
  } catch (error) {
    console.error("❌ Error in Facebook test endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const recentLeads = await db
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      phone: leads.phone,
      status: leads.status,
      createdAt: leads.createdAt,
      campaignName: campaigns.name,
    })
    .from(leads)
    .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .orderBy(desc(leads.createdAt))
    .limit(5);

  const recentLogs = await db
    .select()
    .from(webhookLogs)
    .orderBy(desc(webhookLogs.createdAt))
    .limit(5);

  const usage = {
    message: "Facebook Lead Test Endpoint",
    deployed_url: "https://carreracarscrm.vercel.app/api/test/facebook-lead",
    webhook_url: "https://carreracarscrm.vercel.app/api/webhooks/facebook",
    status: "Active and working",
    methods: {
      POST: {
        description:
          "Create test Facebook leads with optional webhook simulation",
        parameters: {
          name: "string - Lead name (default: 'Test Facebook User')",
          email: "string - Lead email (default: 'test@facebook.com')",
          phone:
            "string - Lead phone with country code (default: '+34612345678')",
          formId: "string - Facebook form ID (default: 'test_form_123')",
          simulate: "boolean - Simulate full webhook flow (default: true)",
        },
      },
      GET: {
        description: "Show recent leads and webhook logs for debugging",
      },
    },
    examples: {
      webhook_simulation: {
        name: "María García",
        email: "maria@example.com",
        phone: "+34687654321",
        formId: "your_real_form_id",
        simulate: true,
      },
      direct_creation: {
        name: "Carlos Ruiz",
        email: "carlos@example.com",
        phone: "+34612345678",
        simulate: false,
      },
    },
    recent_leads: recentLeads,
    recent_webhook_logs: recentLogs,
    notes: [
      "This endpoint creates REAL leads in your database",
      "WhatsApp welcome messages are sent to valid phone numbers",
      "Check the 'leads' and 'whatsapp_messages' tables after testing",
      "Webhook simulation bypasses Facebook API calls",
    ],
  };

  return NextResponse.json(usage);
}
