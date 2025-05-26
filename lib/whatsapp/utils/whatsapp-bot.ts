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
      throw new Error("WhatsApp API credentials are missing");
    }
  }

  /**
   * Send a text message via WhatsApp (Bot only)
   */
  async sendBotMessage(
    to: string,
    message: string
  ): Promise<WhatsAppAPIResponse> {
    const payload: WhatsAppOutgoingMessage = {
      messaging_product: "whatsapp",
      to: this.formatPhoneNumber(to),
      type: "text",
      text: {
        body: message,
      },
    };

    return this.makeRequest("/messages", payload);
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<WhatsAppAPIResponse> {
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };

    return this.makeRequest("/messages", payload);
  }

  /**
   * Format phone number to WhatsApp format (remove + and spaces)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^\d]/g, "");
  }

  /**
   * Make HTTP request to WhatsApp API
   */
  private async makeRequest(
    endpoint: string,
    payload: WhatsAppOutgoingMessage | Record<string, unknown>
  ): Promise<WhatsAppAPIResponse> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as WhatsAppAPIResponse &
        WhatsAppAPIError;

      if (!response.ok) {
        console.error("WhatsApp API Error:", data);
        throw new Error(
          `WhatsApp API Error: ${data.error?.message || "Unknown error"}`
        );
      }

      return data;
    } catch (error) {
      console.error("Error making WhatsApp API request:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const whatsappBotAPI = new WhatsAppBotAPI();

// Export types
export type { WhatsAppIncomingMessage } from "@/types/whatsapp";
