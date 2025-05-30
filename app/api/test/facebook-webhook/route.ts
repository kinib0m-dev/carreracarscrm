import { NextRequest, NextResponse } from "next/server";
import { processFacebookLead } from "@/lib/facebook/lead-processing";
import { setMockFacebookResponse } from "@/lib/facebook/facebook-api";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const {
      name = "Test Webhook User",
      email = "test.webhook@example.com",
      phone = "+34612345678",
      formId = "test_form_webhook_123",
    } = await request.json();

    console.log("🧪 Testing webhook processing with mock data");

    // Ensure we have a campaign for the form
    const existingCampaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.formId, formId))
      .limit(1);

    if (existingCampaign.length === 0) {
      await db.insert(campaigns).values({
        userId: process.env.DEFAULT_USER_ID || "cm3n4q7hs0000lbrif5v5zf99",
        name: "Webhook Test Campaign",
        type: "facebook",
        formId: formId,
        description: "Test campaign for webhook testing",
      });
      console.log("✅ Created test campaign for form:", formId);
    }

    // Create test lead data
    const leadId = `webhook_test_${Date.now()}`;

    // Set up mock Facebook API response
    setMockFacebookResponse(leadId, {
      id: leadId,
      form_id: formId,
      field_data: [
        { name: "full_name", values: [name] },
        { name: "email", values: [email] },
        { name: "phone_number", values: [phone] },
      ],
      created_time: new Date().toISOString(),
      page_id: "test_page_webhook",
    });

    // Create the leadgen value that would come from Facebook webhook
    const leadgenValue = {
      leadgen_id: leadId,
      form_id: formId,
      page_id: "test_page_webhook",
      created_time: Math.floor(Date.now() / 1000),
      ad_id: "test_ad_webhook",
      ad_name: "Test Webhook Ad",
    };

    console.log("🔄 Processing through actual webhook logic...");

    // Process using the real webhook logic
    const result = await processFacebookLead(leadgenValue);

    console.log("✅ Webhook processing completed:", result);

    return NextResponse.json({
      success: true,
      message: "Webhook processing test completed successfully",
      leadData: result,
      testData: {
        leadgenValue,
        formId,
        mockApiResponse: "Set and consumed",
      },
    });
  } catch (error) {
    console.error("❌ Error in webhook test:", error);
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
  return NextResponse.json({
    message: "Facebook Webhook Processing Test",
    description:
      "This endpoint tests the actual webhook processing logic with mocked Facebook API responses",
    url: "https://carreracarscrm.vercel.app/api/test/facebook-webhook",
    method: "POST",
    example: {
      name: "Pedro Test",
      email: "pedro.test@example.com",
      phone: "+34612345678",
      formId: "real_facebook_form_id",
    },
    note: "This uses your actual processFacebookLead function with mocked API responses",
  });
}
