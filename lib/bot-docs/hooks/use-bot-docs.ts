import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CreateBotDocumentSchema,
  FilterBotDocumentSchema,
  UpdateBotDocumentSchema,
} from "../validation/bot-docs-schema";

/**
 * Hook for document listing with filtering and pagination
 */
export function useBotDocumentList(
  initialFilters: Partial<FilterBotDocumentSchema> = {}
) {
  // Create a stable default filters object
  const defaultFilters = useMemo<FilterBotDocumentSchema>(
    () => ({
      page: 1,
      limit: 10,
      sortBy: "createdAt" as const,
      sortDirection: "desc" as const,
      category: initialFilters.category,
      search: initialFilters.search,
    }),
    [initialFilters.category, initialFilters.search]
  );

  // State for filters
  const [filters, setFilters] =
    useState<FilterBotDocumentSchema>(defaultFilters);

  // Update filters when defaultFilters change
  useEffect(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  // Fetch documents with trpc
  const { data, isLoading, isError, error, refetch } =
    trpc.botDocs.list.useQuery(filters, {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    });

  // Computed properties
  const documents = data?.documents || [];
  // Update last pagination when we get new data using useEffect
  const pagination = data?.pagination || {
    page: filters.page,
    limit: filters.limit,
    totalCount: 0,
    totalPages: 0,
  };

  // Update filters function
  const updateFilters = useCallback(
    (newFilters: Partial<FilterBotDocumentSchema>) => {
      setFilters((prevFilters) => {
        const updated = { ...prevFilters, ...newFilters };

        const nonPageKeys = Object.keys(newFilters).filter(
          (key) => key !== "page"
        ) as (keyof FilterBotDocumentSchema)[];
        const hasRealFilterChanges = nonPageKeys.some(
          (key) =>
            newFilters[key] !== undefined &&
            newFilters[key] !== prevFilters[key]
        );

        const shouldResetPage =
          hasRealFilterChanges && newFilters.page === undefined;

        return {
          ...updated,
          page:
            newFilters.page !== undefined
              ? newFilters.page
              : shouldResetPage
                ? 1
                : prevFilters.page,
        };
      });
    },
    []
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  // Handle pagination
  const goToPage = useCallback(
    (page: number) => {
      if (
        page < 1 ||
        (pagination.totalPages > 0 && page > pagination.totalPages)
      )
        return;
      updateFilters({ page });
    },
    [pagination.totalPages, updateFilters]
  );

  return {
    documents,
    filters,
    pagination,
    isLoading,
    isError,
    error,
    updateFilters,
    resetFilters,
    refetch,
    goToPage,
  };
}

/**
 * Hook for document creation
 */
export function useCreateBotDocument() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.botDocs.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch document list
      utils.botDocs.list.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error creating document: ${error.message}`);
    },
  });

  const createDocument = async (document: CreateBotDocumentSchema) => {
    try {
      return await mutation.mutateAsync(document);
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  };

  return {
    createDocument,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for fetching a single document by ID
 */
export function useBotDocument(id: string) {
  const enabled = !!id;

  const { data, isLoading, isError, error, refetch } =
    trpc.botDocs.getById.useQuery(
      { id },
      {
        enabled,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    document: data?.document,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for updating a document
 */
export function useUpdateBotDocument() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.botDocs.update.useMutation({
    onSuccess: (data) => {
      // Invalidate queries to refetch documents
      utils.botDocs.list.invalidate();
      utils.botDocs.getById.invalidate({ id: data.document.id });
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error updating document: ${error.message}`);
    },
  });

  const updateDocument = async (document: UpdateBotDocumentSchema) => {
    try {
      return await mutation.mutateAsync(document);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  return {
    updateDocument,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for deleting a document
 */
export function useDeleteBotDocument() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.botDocs.delete.useMutation({
    onSuccess: () => {
      utils.botDocs.list.invalidate();
      router.push("/bot-docs");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error deleting document: ${error.message}`);
    },
  });

  const deleteDocument = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  };

  return {
    deleteDocument,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
