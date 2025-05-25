import { useState } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  AttachLeadTagSchema,
  CreateLeadTagSchema,
  DetachLeadTagSchema,
  UpdateLeadTagSchema,
} from "../validation/lead-tags-schema";

/**
 * Hook for fetching tags for a specific lead
 */
export function useLeadTags(leadId: string) {
  const { data, isLoading, isError, error, refetch } =
    trpc.leadTags.getTagsByLeadId.useQuery(
      { leadId },
      {
        enabled: !!leadId,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    tags: data?.tags || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for creating a new tag
 */
export function useCreateTag() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadTags.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to potentially refetch tags
      utils.leadTags.getTagsByLeadId.invalidate();
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      if (error.message.includes("name already exists")) {
        toast.error("A tag with this name already exists");
      } else {
        toast.error(`Error creating tag: ${error.message}`);
      }
    },
  });

  const createTag = async (tag: CreateLeadTagSchema) => {
    try {
      return await mutation.mutateAsync(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  };

  return {
    createTag,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for updating a tag
 */
export function useUpdateTag() {
  const utils = trpc.useUtils();
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const mutation = trpc.leadTags.update.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch updated tag data
      utils.leadTags.getTagsByLeadId.invalidate();
      setEditingTagId(null);
      toast.success("Tag updated successfully");
    },
    onError: (error) => {
      if (error.message.includes("name already exists")) {
        toast.error("A tag with this name already exists");
      } else {
        toast.error(`Error updating tag: ${error.message}`);
      }
    },
  });

  const updateTag = async (tag: UpdateLeadTagSchema) => {
    try {
      return await mutation.mutateAsync(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      throw error;
    }
  };

  return {
    updateTag,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    editingTagId,
    setEditingTagId,
  };
}

/**
 * Hook for deleting a tag
 */
export function useDeleteTag() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadTags.delete.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch tag data
      utils.leadTags.getTagsByLeadId.invalidate();
      toast.success("Tag deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting tag: ${error.message}`);
    },
  });

  const deleteTag = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting tag:", error);
      throw error;
    }
  };

  return {
    deleteTag,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for attaching a tag to a lead
 */
export function useAttachTag() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadTags.attachTagToLead.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate the specific lead's tags
      utils.leadTags.getTagsByLeadId.invalidate({ leadId: variables.leadId });
      toast.success("Tag attached successfully");
    },
    onError: (error) => {
      toast.error(`Error attaching tag: ${error.message}`);
    },
  });

  const attachTag = async (data: AttachLeadTagSchema) => {
    try {
      return await mutation.mutateAsync(data);
    } catch (error) {
      console.error("Error attaching tag:", error);
      throw error;
    }
  };

  return {
    attachTag,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for detaching a tag from a lead
 */
export function useDetachTag() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadTags.detachTagFromLead.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate the specific lead's tags
      utils.leadTags.getTagsByLeadId.invalidate({ leadId: variables.leadId });
      toast.success("Tag removed successfully");
    },
    onError: (error) => {
      toast.error(`Error removing tag: ${error.message}`);
    },
  });

  const detachTag = async (data: DetachLeadTagSchema) => {
    try {
      return await mutation.mutateAsync(data);
    } catch (error) {
      console.error("Error detaching tag:", error);
      throw error;
    }
  };

  return {
    detachTag,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for fetching all available tags with optional filtering and pagination
 */
export function useAllTags(
  options: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "createdAt";
    sortDirection?: "asc" | "desc";
  } = {}
) {
  const {
    search,
    page = 1,
    limit = 50,
    sortBy = "name",
    sortDirection = "asc",
  } = options;

  const [filters, setFilters] = useState({
    search,
    page,
    limit,
    sortBy,
    sortDirection,
  });

  const { data, isLoading, isError, error, refetch } =
    trpc.leadTags.getAllTags.useQuery(filters, {
      staleTime: 30 * 1000, // 30 seconds
    });

  // Helper to update filters
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (unless page is explicitly specified)
      page:
        newFilters.page || (newFilters.search !== undefined ? 1 : prev.page),
    }));
  };

  return {
    tags: data?.tags || [],
    pagination: data?.pagination || {
      page: filters.page,
      limit: filters.limit,
      totalCount: 0,
      totalPages: 0,
    },
    filters,
    updateFilters,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for fetching leads by tag ID with pagination
 */
export function useLeadsByTag(tagId: string, page = 1, limit = 10) {
  const { data, isLoading, isError, error, refetch } =
    trpc.leadTags.getLeadsByTagId.useQuery(
      { tagId, page, limit },
      {
        enabled: !!tagId,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    leadIds: data?.leadIds || [],
    pagination: data?.pagination || {
      page,
      limit,
      totalCount: 0,
      totalPages: 0,
    },
    isLoading,
    isError,
    error,
    refetch,
  };
}
