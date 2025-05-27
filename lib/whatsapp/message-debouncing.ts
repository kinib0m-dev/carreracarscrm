interface PendingMessage {
  leadId: string;
  messages: Array<{
    id: string;
    content: string;
    timestamp: Date;
  }>;
  timeoutId: NodeJS.Timeout;
  phone: string;
}

// Store pending messages in memory
const pendingMessages = new Map<string, PendingMessage>();

// Wait time before processing accumulated messages
const MESSAGE_ACCUMULATION_DELAY = 3000; // 3 seconds

/**
 * Add a message to the pending queue and handle debouncing
 */
export async function addMessageToQueue(
  leadId: string,
  messageId: string,
  content: string,
  phone: string,
  timestamp: Date,
  processFunction: (
    leadId: string,
    combinedMessage: string,
    messageIds: string[]
  ) => Promise<void>
): Promise<void> {
  // Clear existing timeout if there's one
  if (pendingMessages.has(leadId)) {
    const existing = pendingMessages.get(leadId)!;
    clearTimeout(existing.timeoutId);
  }

  // Get existing messages or create new array
  const existingMessages = pendingMessages.get(leadId)?.messages || [];

  // Add the new message
  const newMessage = {
    id: messageId,
    content,
    timestamp,
  };

  const allMessages = [...existingMessages, newMessage];

  // Create new timeout
  const timeoutId = setTimeout(async () => {
    try {
      console.log(
        `📦 Processing ${allMessages.length} accumulated messages for lead ${leadId}`
      );

      // Combine all messages into one
      const combinedContent = allMessages
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map((msg) => msg.content)
        .join("\n");

      const messageIds = allMessages.map((msg) => msg.id);

      // Remove from pending
      pendingMessages.delete(leadId);

      // Process the combined message
      await processFunction(leadId, combinedContent, messageIds);
    } catch (error) {
      console.error(
        `Error processing accumulated messages for lead ${leadId}:`,
        error
      );
      pendingMessages.delete(leadId);
    }
  }, MESSAGE_ACCUMULATION_DELAY);

  // Store the updated pending message
  pendingMessages.set(leadId, {
    leadId,
    messages: allMessages,
    timeoutId,
    phone,
  });

  console.log(
    `⏳ Message queued for lead ${leadId}. Total pending: ${allMessages.length}`
  );
}

/**
 * Clear pending messages for a lead (use when lead responds or in case of errors)
 */
export function clearPendingMessages(leadId: string): void {
  const pending = pendingMessages.get(leadId);
  if (pending) {
    clearTimeout(pending.timeoutId);
    pendingMessages.delete(leadId);
    console.log(`🗑️ Cleared pending messages for lead ${leadId}`);
  }
}

/**
 * Get current pending message count for debugging
 */
export function getPendingMessageCount(): number {
  return pendingMessages.size;
}

/**
 * Get pending messages for a specific lead (for debugging)
 */
export function getPendingMessagesForLead(leadId: string): string[] | null {
  const pending = pendingMessages.get(leadId);
  return pending ? pending.messages.map((m) => m.content) : null;
}
