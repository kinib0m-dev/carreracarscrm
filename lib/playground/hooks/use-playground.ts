import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export function useBotConversations() {
  const { data, isLoading, error, refetch } =
    trpc.playground.listConversations.useQuery();

  return {
    conversations: data?.conversations || [],
    isLoading,
    error,
    refetch,
  };
}

export function useConversation(id: string) {
  const { data, isLoading, error, refetch } =
    trpc.playground.getConversation.useQuery(
      { id },
      {
        enabled: !!id,
        refetchInterval: false,
      }
    );

  return {
    conversation: data?.conversation,
    testLead: data?.testLead,
    messages: data?.messages || [],
    isLoading,
    error,
    refetch,
  };
}

export function useCreateConversation() {
  const utils = trpc.useUtils();
  const mutation = trpc.playground.createConversation.useMutation({
    onSuccess: () => {
      utils.playground.listConversations.invalidate();
      toast.success(
        "Test conversation created! A new test lead has been generated."
      );
    },
    onError: (error) => {
      toast.error(`Error creating conversation: ${error.message}`);
    },
  });

  const createConversation = async (name: string) => {
    try {
      return await mutation.mutateAsync({ name });
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  };

  return {
    createConversation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useSendMessage() {
  const utils = trpc.useUtils();
  const mutation = trpc.playground.sendMessage.useMutation({
    onSuccess: (data, variables) => {
      utils.playground.getConversation.invalidate({
        id: variables.conversationId,
      });
      utils.playground.listConversations.invalidate();

      if (data.isCompleted) {
        toast.success(
          "🎉 Test completed! Lead has been escalated to manager status."
        );
      } else if (data.leadUpdate) {
        toast.info("Test lead information updated");
      }
    },
    onError: (error) => {
      toast.error(`Error sending message: ${error.message}`);
    },
  });

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      return await mutation.mutateAsync({ conversationId, content });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  return {
    sendMessage,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteConversation() {
  const utils = trpc.useUtils();
  const mutation = trpc.playground.deleteConversation.useMutation({
    onSuccess: () => {
      utils.playground.listConversations.invalidate();
      toast.success("Test conversation and lead deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting conversation: ${error.message}`);
    },
  });

  const deleteConversation = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  };

  return {
    deleteConversation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useTestLead(id: string) {
  const { data, isLoading, error, refetch } =
    trpc.playground.getTestLead.useQuery(
      { id },
      {
        enabled: !!id,
        refetchInterval: false,
      }
    );

  return {
    testLead: data?.testLead,
    isLoading,
    error,
    refetch,
  };
}
