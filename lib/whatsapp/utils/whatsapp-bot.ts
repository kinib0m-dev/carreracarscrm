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

    const payload: WhatsAppOutgoingMessage = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        body: message,
      },
    };

    return this.makeRequest("/messages", payload);
  }

  /**
   * Send a template message via WhatsApp (for business-initiated conversations)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "es",
    components?: Array<{
      type: "header" | "body" | "button";
      parameters?: Array<{
        type: "text";
        text: string;
      }>;
    }>
  ): Promise<WhatsAppAPIResponse> {
    const formattedPhone = this.formatPhoneNumber(to);

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: components || [],
      },
    };

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

    return this.makeRequest("/messages", payload);
  }

  /**
   * Format phone number to WhatsApp format (remove + and spaces)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    const formatted = phoneNumber.replace(/[^\d]/g, "");
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
