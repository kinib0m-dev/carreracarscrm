import {
  checkAndMarkInactiveLeads,
  processFollowUps,
} from "@/lib/whatsapp/followup/followup-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify the request is from a cron job (optional security measure)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Process follow-ups
    await processFollowUps();

    // Check and mark inactive leads
    await checkAndMarkInactiveLeads();

    return NextResponse.json({
      success: true,
      message: "Follow-ups processed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in follow-up cron job:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
