import type {
  WhatsAppOutgoingMessage,
  WhatsAppAPIResponse,
  WhatsAppAPIError,
} from "@/types/whatsapp";

class WhatsAppBotAPI {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string = "v21.0";
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;

    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error(
        "WhatsApp API credentials are missing from environment variables"
      );
    }

    console.log("WhatsApp API initialized:", {
      phoneNumberId: this.phoneNumberId,
      baseUrl: this.baseUrl,
      hasToken: !!this.accessToken,
    });
  }

  /**
   * Send a text message via WhatsApp (Bot only)
   */
  async sendBotMessage(
    to: string,
    message: string
  ): Promise<WhatsAppAPIResponse> {
    const formattedPhone = this.formatPhoneNumber(to);

    console.log(`Sending WhatsApp message to ${formattedPhone}: ${message}`);

    const payload: WhatsAppOutgoingMessage = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        body: message,
      },
    };

    console.log("WhatsApp message payload:", JSON.stringify(payload, null, 2));

    return this.makeRequest("/messages", payload);
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<WhatsAppAPIResponse> {
    console.log(`Marking WhatsApp message as read: ${messageId}`);

    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };

    console.log("Mark as read payload:", JSON.stringify(payload, null, 2));

    return this.makeRequest("/messages", payload);
  }

  /**
   * Format phone number to WhatsApp format (remove + and spaces)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    const formatted = phoneNumber.replace(/[^\d]/g, "");
    console.log(`Formatted phone number: ${phoneNumber} -> ${formatted}`);
    return formatted;
  }

  /**
   * Make HTTP request to WhatsApp API
   */
  private async makeRequest(
    endpoint: string,
    payload: WhatsAppOutgoingMessage | Record<string, unknown>
  ): Promise<WhatsAppAPIResponse> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(`Making WhatsApp API request to: ${url}`);
    console.log("Request payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(`WhatsApp API response status: ${response.status}`);

      const data = (await response.json()) as WhatsAppAPIResponse &
        WhatsAppAPIError;

      console.log("WhatsApp API response data:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error("WhatsApp API Error:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });

        const errorMessage =
          data.error?.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`WhatsApp API Error: ${errorMessage}`);
      }

      console.log("WhatsApp API request successful");
      return data;
    } catch (error) {
      console.error("Error making WhatsApp API request:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(`WhatsApp API request failed: ${String(error)}`);
    }
  }
}

// Export singleton instance
export const whatsappBotAPI = new WhatsAppBotAPI();

// Export types
export type { WhatsAppIncomingMessage } from "@/types/whatsapp";
