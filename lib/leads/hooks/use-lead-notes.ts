// hooks/use-lead-notes.ts
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  CreateLeadNoteSchema,
  UpdateLeadNoteSchema,
} from "../validation/lead-notes-schema";

/**
 * Hook for fetching notes for a specific lead
 */
export function useLeadNotes(leadId: string) {
  const { data, isLoading, isError, error, refetch } =
    trpc.leadNote.getByLeadId.useQuery(
      { leadId },
      {
        enabled: !!leadId,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    notes: data?.notes || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for creating a new note
 */
export function useCreateLeadNote() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadNote.create.useMutation({
    onSuccess: (data) => {
      // Invalidate queries to refetch notes
      utils.leadNote.getByLeadId.invalidate({ leadId: data.note.leadId });
      toast.success("Note added successfully");
    },
    onError: (error) => {
      toast.error(`Error creating note: ${error.message}`);
    },
  });

  const createNote = async (note: CreateLeadNoteSchema) => {
    try {
      return await mutation.mutateAsync(note);
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  };

  return {
    createNote,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for updating a note
 */
export function useUpdateLeadNote() {
  const utils = trpc.useUtils();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const mutation = trpc.leadNote.update.useMutation({
    onSuccess: (data) => {
      // Get the leadId from the response to invalidate the correct query
      const note = data.note;
      if (note.leadId) {
        utils.leadNote.getByLeadId.invalidate({ leadId: note.leadId });
      }
      setEditingNoteId(null);
      toast.success("Note updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating note: ${error.message}`);
    },
  });

  const updateNote = async (note: UpdateLeadNoteSchema) => {
    try {
      return await mutation.mutateAsync(note);
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  return {
    updateNote,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    editingNoteId,
    setEditingNoteId,
  };
}

/**
 * Hook for deleting a note
 */
export function useDeleteLeadNote() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadNote.delete.useMutation({
    onSuccess: () => {
      // We'll have to invalidate all notes queries since we don't know the leadId
      utils.leadNote.getByLeadId.invalidate();
      toast.success("Note deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting note: ${error.message}`);
    },
  });

  const deleteNote = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  return {
    deleteNote,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
