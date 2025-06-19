import { NextResponse } from "next/server";
import { db } from "@/db";
import { webhookLogs } from "@/db/schema";
import { processFacebookLead } from "@/lib/facebook/lead-processing";

export async function GET(request: Request) {
  // Extract the URL and parse the search parameters
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  // Facebook webhook verification
  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    // Return ONLY the challenge string as plain text
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new Response("Verification failed", {
    status: 403,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log the webhook event
    await db.insert(webhookLogs).values({
      eventType: "facebook_lead",
      payload: JSON.stringify(body),
      status: "received",
    });

    // Check if it's a lead event
    if (body.object === "page" && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === "leadgen" && change.value) {
            console.log(change.value);
            await processFacebookLead(change.value);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Don't try to read request.body again since it's already been read
    await db.insert(webhookLogs).values({
      eventType: "facebook_lead_error",
      payload: "Error parsing body",
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
