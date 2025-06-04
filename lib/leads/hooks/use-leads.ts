"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  CreateLeadSchema,
  FilterLeadSchema,
  UpdateLeadSchema,
} from "@/lib/leads/validation/leads-schema";
import { useRouter } from "next/navigation";

/**
 * Hook for lead listing with filtering and pagination
 */
export function useLeadList(initialFilters: Partial<FilterLeadSchema> = {}) {
  // Create a stable default filters object
  const defaultFilters = useMemo<FilterLeadSchema>(
    () => ({
      page: 1,
      limit: 10,
      sortBy: "createdAt" as const,
      sortDirection: "desc" as const,
      status: initialFilters.status,
      search: initialFilters.search,
      expectedPurchaseTimeframe: initialFilters.expectedPurchaseTimeframe,
    }),
    [
      initialFilters.status,
      initialFilters.search,
      initialFilters.expectedPurchaseTimeframe,
    ]
  );

  // State for filters
  const [filters, setFilters] = useState<FilterLeadSchema>(defaultFilters);

  // Update filters when defaultFilters change
  useEffect(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  // Fetch leads with trpc
  const { data, isLoading, isError, error, refetch } = trpc.lead.list.useQuery(
    filters,
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    }
  );

  // Computed properties
  const leads = data?.leads || [];
  const pagination = data?.pagination || {
    page: filters.page,
    limit: filters.limit,
    totalCount: 0,
    totalPages: 0,
  };

  // Update filters function
  const updateFilters = useCallback((newFilters: Partial<FilterLeadSchema>) => {
    setFilters((prevFilters) => {
      const updated = { ...prevFilters, ...newFilters };

      const nonPageKeys = Object.keys(newFilters).filter(
        (key) => key !== "page"
      ) as (keyof FilterLeadSchema)[];
      const hasRealFilterChanges = nonPageKeys.some(
        (key) =>
          newFilters[key] !== undefined && newFilters[key] !== prevFilters[key]
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
  }, []);

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
    leads,
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
 * Hook for creating a new lead
 */
export function useCreateLead() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.lead.create.useMutation({
    onSuccess: () => {
      utils.lead.list.invalidate();
      toast.success("Lead created successfully");
      router.refresh();
    },
    onError: (error) => {
      if (error.message.includes("email already exists")) {
        toast.error("A lead with this email address already exists");
      } else if (error.message.includes("phone number already exists")) {
        toast.error("A lead with this phone number already exists");
      } else {
        toast.error(`Error creating lead: ${error.message}`);
      }
    },
  });

  const createLead = async (lead: CreateLeadSchema) => {
    try {
      return await mutation.mutateAsync(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      throw error;
    }
  };

  return {
    createLead,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for fetching a single lead by ID
 */
export function useLead(id: string) {
  const enabled = !!id;

  const { data, isLoading, isError, error, refetch } =
    trpc.lead.getById.useQuery(
      { id },
      {
        enabled,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    lead: data?.lead,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for updating a lead
 */
export function useUpdateLead() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.lead.update.useMutation({
    onSuccess: (data) => {
      utils.lead.list.invalidate();
      utils.lead.getById.invalidate({ id: data.lead.id });
      toast.success("Lead updated successfully");
      router.refresh();
    },
    onError: (error) => {
      if (error.message.includes("email already in use")) {
        toast.error("Email already in use by another lead");
      } else if (error.message.includes("phone number already in use")) {
        toast.error("Phone number already in use by another lead");
      } else {
        toast.error(`Error updating lead: ${error.message}`);
      }
    },
  });

  const updateLead = async (lead: UpdateLeadSchema) => {
    try {
      return await mutation.mutateAsync(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      throw error;
    }
  };

  return {
    updateLead,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for deleting a lead
 */
export function useDeleteLead() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.lead.delete.useMutation({
    onSuccess: () => {
      utils.lead.list.invalidate();
      toast.success("Lead deleted successfully");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error deleting lead: ${error.message}`);
    },
  });

  const deleteLead = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting lead:", error);
      throw error;
    }
  };

  return {
    deleteLead,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
