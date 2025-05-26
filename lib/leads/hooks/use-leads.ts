"use client";

import { useState, useEffect } from "react";
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
  // Default filters
  const defaultFilters: FilterLeadSchema = {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
    ...initialFilters,
  };

  // State for filters
  const [filters, setFilters] = useState<FilterLeadSchema>(defaultFilters);

  // Keep track of the last successful pagination to avoid resets during loading
  const [lastPagination, setLastPagination] = useState({
    page: defaultFilters.page,
    limit: defaultFilters.limit,
    totalCount: 0,
    totalPages: 0,
  });

  // Fetch leads with trpc
  const { data, isLoading, isError, error, refetch } = trpc.lead.list.useQuery(
    filters,
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  // Computed properties - always use current data structure
  const leads = data?.leads || [];

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
  const updateFilters = (newFilters: Partial<FilterLeadSchema>) => {
    setFilters((prevFilters) => {
      // Check if the new filters would actually change anything
      // Treat undefined values as "no change" for comparison
      const wouldChange = Object.keys(newFilters).some((key) => {
        const typedKey = key as keyof FilterLeadSchema;
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
      ) as (keyof FilterLeadSchema)[];
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
