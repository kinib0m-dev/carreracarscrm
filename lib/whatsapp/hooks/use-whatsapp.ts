import { useState } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

/**
 * Hook for fetching WhatsApp messages for a specific lead
 */
export function useWhatsAppMessages(leadId: string, limit = 50) {
  const { data, isLoading, isError, error, refetch } =
    trpc.whatsapp.getByLeadId.useQuery(
      { leadId, limit },
      {
        enabled: !!leadId,
        staleTime: 10 * 1000, // 10 seconds - messages change frequently
      }
    );

  const messages = data?.messages || [];
  const totalCount = data?.totalCount || 0;
  const inboundCount = data?.inboundCount || 0;
  const outboundCount = data?.outboundCount || 0;
  const hasMore = data?.hasMore || false;

  return {
    messages,
    totalCount,
    inboundCount,
    outboundCount,
    hasMore,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for fetching conversation statistics
 */
export function useConversationStats(leadId: string) {
  const { data, isLoading, isError, error, refetch } =
    trpc.whatsapp.getConversationStats.useQuery(
      { leadId },
      {
        enabled: !!leadId,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    stats: data?.stats || null,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for sending WhatsApp messages
 */
export function useSendWhatsAppMessage() {
  const utils = trpc.useUtils();
  const [isSending, setIsSending] = useState(false);

  const mutation = trpc.whatsapp.sendMessage.useMutation({
    onMutate: () => {
      setIsSending(true);
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch messages
      utils.whatsapp.getByLeadId.invalidate({ leadId: variables.leadId });
      utils.whatsapp.getConversationStats.invalidate({
        leadId: variables.leadId,
      });
      toast.success("Message sent successfully");
      setIsSending(false);
    },
    onError: (error) => {
      toast.error(`Error sending message: ${error.message}`);
      setIsSending(false);
    },
  });

  const sendMessage = async (leadId: string, content: string) => {
    try {
      return await mutation.mutateAsync({ leadId, content });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  };

  return {
    sendMessage,
    isSending: isSending || mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for managing conversation state
 */
export function useConversationState(leadId: string) {
  const [newMessage, setNewMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const { messages, isLoading, refetch } = useWhatsAppMessages(leadId);
  const { stats } = useConversationStats(leadId);
  const { sendMessage, isSending } = useSendWhatsAppMessage();

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      await sendMessage(leadId, newMessage.trim());
      setNewMessage("");
      setIsComposing(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleMessageChange = (value: string) => {
    setNewMessage(value);
    setIsComposing(value.trim().length > 0);
  };

  return {
    messages,
    stats,
    newMessage,
    isComposing,
    isLoading,
    isSending,
    handleSendMessage,
    handleMessageChange,
    refetch,
  };
}
