"use client";

import { useState } from "react";
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

  // Fetch leads with trpc
  const { data, isLoading, isError, error, refetch } = trpc.lead.list.useQuery(
    filters,
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  // Computed properties
  const leads = data?.leads || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  };

  // Update filters
  const updateFilters = (newFilters: Partial<FilterLeadSchema>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
      // Reset to page 1 when filters change (unless page is explicitly specified)
      page: newFilters.page || 1,
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
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
