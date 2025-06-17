import { sendFollowUpMessage } from "@/lib/whatsapp/followup/manual-followup";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const leadId = params.id;

    const result = await sendFollowUpMessage(leadId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up sent successfully",
      followUpCount: result.followUpCount,
    });
  } catch (error) {
    console.error("Error sending manual follow-up:", error);
    return NextResponse.json(
      { error: "Failed to send follow-up" },
      { status: 500 }
    );
  }
}
