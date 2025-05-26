"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CreateCarStockSchema,
  FilterCarStockSchema,
  UpdateCarStockSchema,
} from "../validation/stock-schema";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook for car stock listing with filtering and pagination
 */
export function useCarStockList(
  initialFilters: Partial<FilterCarStockSchema> = {}
) {
  // Default filters
  const defaultFilters: FilterCarStockSchema = {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
    ...initialFilters,
  };

  // State for filters
  const [filters, setFilters] = useState<FilterCarStockSchema>(defaultFilters);

  // Keep track of the last successful pagination to avoid resets during loading
  const [lastPagination, setLastPagination] = useState({
    page: defaultFilters.page,
    limit: defaultFilters.limit,
    totalCount: 0,
    totalPages: 0,
  });

  // Fetch car stock items with trpc
  const { data, isLoading, isError, error, refetch } = trpc.stock.list.useQuery(
    filters,
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  // Computed properties
  const carStockItems = data?.carStock || [];

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
  const updateFilters = (newFilters: Partial<FilterCarStockSchema>) => {
    setFilters((prevFilters) => {
      // Check if the new filters would actually change anything
      // Treat undefined values as "no change" for comparison
      const wouldChange = Object.keys(newFilters).some((key) => {
        const typedKey = key as keyof FilterCarStockSchema;
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
      ) as (keyof FilterCarStockSchema)[];
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
    carStockItems,
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
 * Hook for car stock creation
 */
export function useCreateCarStock() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.stock.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch car stock list
      utils.stock.list.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error creating car stock item: ${error.message}`);
    },
  });

  const createCarStock = async (carStockItem: CreateCarStockSchema) => {
    try {
      return await mutation.mutateAsync(carStockItem);
    } catch (error) {
      console.error("Error creating car stock item:", error);
      throw error;
    }
  };

  return {
    createCarStock,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for fetching a single car stock item by ID
 */
export function useCarStock(id: string) {
  const enabled = !!id;

  const { data, isLoading, isError, error, refetch } =
    trpc.stock.getById.useQuery(
      { id },
      {
        enabled,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    carStock: data?.carStock,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for updating a car stock item
 */
export function useUpdateCarStock() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.stock.update.useMutation({
    onSuccess: (data) => {
      // Invalidate queries to refetch car stock items
      utils.stock.list.invalidate();
      utils.stock.getById.invalidate({ id: data.carStock.id });
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error updating car stock item: ${error.message}`);
    },
  });

  const updateCarStock = async (carStockItem: UpdateCarStockSchema) => {
    try {
      return await mutation.mutateAsync(carStockItem);
    } catch (error) {
      console.error("Error updating car stock item:", error);
      throw error;
    }
  };

  return {
    updateCarStock,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for deleting a car stock item
 */
export function useDeleteCarStock() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.stock.delete.useMutation({
    onSuccess: () => {
      utils.stock.list.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error deleting car stock item: ${error.message}`);
    },
  });

  const deleteCarStock = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting car stock item:", error);
      throw error;
    }
  };

  return {
    deleteCarStock,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useMarkCarAsSold() {
  const queryClient = useQueryClient();

  const markCarAsSoldMutation = trpc.stock.markAsSold.useMutation({
    onSuccess: () => {
      // Invalidate and refetch car stock queries
      queryClient.invalidateQueries({ queryKey: ["carStock"] });
    },
  });

  return {
    markAsSold: markCarAsSoldMutation.mutate,
    markAsSoldAsync: markCarAsSoldMutation.mutateAsync,
    isLoading: markCarAsSoldMutation.isPending,
    error: markCarAsSoldMutation.error,
    isError: markCarAsSoldMutation.isError,
    isSuccess: markCarAsSoldMutation.isSuccess,
  };
}
