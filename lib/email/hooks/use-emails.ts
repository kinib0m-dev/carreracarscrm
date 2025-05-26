import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CreateEmailTemplateSchema,
  FilterEmailTemplateSchema,
  SendEmailSchema,
  UpdateEmailTemplateSchema,
} from "@/lib/email/validation/emails-schema";

/**
 * Hook for email template listing with filtering and pagination
 */
export function useEmailTemplateList(
  initialFilters: Partial<FilterEmailTemplateSchema> = {}
) {
  // Default filters
  const defaultFilters: FilterEmailTemplateSchema = {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
    ...initialFilters,
  };

  // State for filters
  const [filters, setFilters] =
    useState<FilterEmailTemplateSchema>(defaultFilters);

  // Keep track of the last successful pagination to avoid resets during loading
  const [lastPagination, setLastPagination] = useState({
    page: defaultFilters.page,
    limit: defaultFilters.limit,
    totalCount: 0,
    totalPages: 0,
  });

  // Fetch templates with trpc
  const { data, isLoading, isError, error, refetch } =
    trpc.emails.list.useQuery(filters, {
      staleTime: 30 * 1000, // 30 seconds
    });

  // Computed properties
  const templates = data?.templates || [];

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
  const updateFilters = (newFilters: Partial<FilterEmailTemplateSchema>) => {
    setFilters((prevFilters) => {
      // Check if the new filters would actually change anything
      // Treat undefined values as "no change" for comparison
      const wouldChange = Object.keys(newFilters).some((key) => {
        const typedKey = key as keyof FilterEmailTemplateSchema;
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
      ) as (keyof FilterEmailTemplateSchema)[];
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
    templates,
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
 * Hook for creating a new email template
 */
export function useCreateEmailTemplate() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.emails.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch email template list
      utils.emails.list.invalidate();
      router.refresh();
      toast.success("Email template created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating email template: ${error.message}`);
    },
  });

  const createTemplate = async (template: CreateEmailTemplateSchema) => {
    try {
      return await mutation.mutateAsync(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      throw error;
    }
  };

  return {
    createTemplate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for fetching a single email template by ID
 */
export function useEmailTemplate(id: string) {
  const enabled = !!id;

  const { data, isLoading, isError, error, refetch } =
    trpc.emails.getById.useQuery(
      { id },
      {
        enabled,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    template: data?.template,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for updating an email template
 */
export function useUpdateEmailTemplate() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.emails.update.useMutation({
    onSuccess: (data) => {
      // Invalidate queries to refetch templates
      utils.emails.list.invalidate();
      utils.emails.getById.invalidate({ id: data.template.id });
      router.refresh();
      toast.success("Email template updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating email template: ${error.message}`);
    },
  });

  const updateTemplate = async (template: UpdateEmailTemplateSchema) => {
    try {
      return await mutation.mutateAsync(template);
    } catch (error) {
      console.error("Error updating email template:", error);
      throw error;
    }
  };

  return {
    updateTemplate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for deleting an email template
 */
export function useDeleteEmailTemplate() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.emails.delete.useMutation({
    onSuccess: () => {
      utils.emails.list.invalidate();
      router.push("/emails");
      router.refresh();
      toast.success("Email template deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting email template: ${error.message}`);
    },
  });

  const deleteTemplate = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting email template:", error);
      throw error;
    }
  };

  return {
    deleteTemplate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for counting target leads
 */
export function useCountTargetLeads(id: string) {
  const enabled = !!id;

  const { data, isLoading, isError, error, refetch } =
    trpc.emails.countTargetLeads.useQuery(
      { id },
      {
        enabled,
        staleTime: 10 * 1000, // 10 seconds
      }
    );

  return {
    count: data?.count || 0,
    targetStatuses: data?.targetStatuses || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for sending emails
 */
export function useSendEmails() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.emails.sendEmails.useMutation({
    onSuccess: (data) => {
      utils.emails.getEmailHistory.invalidate();
      toast.success(`Successfully sent emails to ${data.sentCount} lead(s)`);

      // Small delay to let the toast show, then refresh
      setTimeout(() => {
        router.refresh();
      }, 1000);
    },
    onError: (error) => {
      toast.error(`Error sending emails: ${error.message}`);
      // Also refresh on error in case that fixes the blocking
      setTimeout(() => {
        router.refresh();
      }, 1000);
    },
  });

  const sendEmails = async (params: SendEmailSchema) => {
    try {
      return await mutation.mutateAsync(params);
    } catch (error) {
      console.error("Error sending emails:", error);
      throw error;
    }
  };

  return {
    sendEmails,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for fetching email history
 */
export function useEmailHistory(page = 1, limit = 10) {
  const { data, isLoading, isError, error, refetch } =
    trpc.emails.getEmailHistory.useQuery(
      { page, limit },
      {
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    history: data?.history || [],
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

/**
 * Hook for fetching email history details
 */
export function useEmailHistoryDetails(id: string) {
  const enabled = !!id;

  const { data, isLoading, isError, error, refetch } =
    trpc.emails.getEmailHistoryDetails.useQuery(
      { id },
      {
        enabled,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    historyDetails: data?.history,
    recipients: data?.recipients || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for fetching email history for a specific lead
 */
export function useLeadEmailHistory(leadId: string, limit = 5) {
  const enabled = !!leadId;

  const { data, isLoading, isError, error, refetch } =
    trpc.emails.getEmailHistoryByLeadId.useQuery(
      { leadId, limit },
      {
        enabled,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    history: data?.history || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
