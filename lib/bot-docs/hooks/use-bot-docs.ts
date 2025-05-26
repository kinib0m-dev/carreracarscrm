import { useState, useEffect } from "react";
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
  // Default filters
  const defaultFilters: FilterBotDocumentSchema = {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
    ...initialFilters,
  };

  // State for filters
  const [filters, setFilters] =
    useState<FilterBotDocumentSchema>(defaultFilters);

  // Keep track of the last successful pagination to avoid resets during loading
  const [lastPagination, setLastPagination] = useState({
    page: defaultFilters.page,
    limit: defaultFilters.limit,
    totalCount: 0,
    totalPages: 0,
  });

  // Fetch documents with trpc
  const { data, isLoading, isError, error, refetch } =
    trpc.botDocs.list.useQuery(filters, {
      staleTime: 30 * 1000, // 30 seconds
    });

  // Computed properties
  const documents = data?.documents || [];

  // Update last pagination when we get new data using useEffect
  useEffect(() => {
    if (data?.pagination) {
      setLastPagination(data.pagination);
    }
  }, [data?.pagination]);

  // Use current data pagination if available, otherwise use last known pagination with current filter page
  const pagination = data?.pagination || {
    ...lastPagination,
    page: filters.page, // Always reflect the current filter page
  };

  // Update filters
  const updateFilters = (newFilters: Partial<FilterBotDocumentSchema>) => {
    setFilters((prevFilters) => {
      // Check if the new filters would actually change anything
      // Treat undefined values as "no change" for comparison
      const wouldChange = Object.keys(newFilters).some((key) => {
        const typedKey = key as keyof FilterBotDocumentSchema;
        const newValue = newFilters[typedKey];
        const currentValue = prevFilters[typedKey];

        // If new value is undefined, it's not a real change
        if (newValue === undefined) {
          return false;
        }

        return newValue !== currentValue;
      });

      // Special check: if this looks like a filters reset call (search: undefined + page: 1),
      // and we're not actually changing the search, ignore it completely
      const isFilterResetCall =
        Object.keys(newFilters).length === 2 &&
        newFilters.search === undefined &&
        newFilters.page === 1 &&
        (prevFilters.search === undefined || prevFilters.search === null);

      if (!wouldChange || isFilterResetCall) {
        return prevFilters; // No change, return the same object
      }

      // Only reset to page 1 if we're actually changing non-page filters
      const nonPageKeys = Object.keys(newFilters).filter(
        (key) => key !== "page"
      ) as (keyof FilterBotDocumentSchema)[];
      const hasRealFilterChanges = nonPageKeys.some(
        (key) =>
          newFilters[key] !== undefined && newFilters[key] !== prevFilters[key]
      );

      const shouldResetPage =
        hasRealFilterChanges && newFilters.page === undefined;

      const updated = {
        ...prevFilters,
        ...newFilters,
        page:
          newFilters.page !== undefined
            ? newFilters.page
            : shouldResetPage
              ? 1
              : prevFilters.page,
      };

      return updated;
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (page < 1 || (pagination.totalPages > 0 && page > pagination.totalPages))
      return;
    updateFilters({ page });
  };

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
