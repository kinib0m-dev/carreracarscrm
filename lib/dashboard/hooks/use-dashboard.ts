"use client";

import { trpc } from "@/trpc/client";

/**
 * Hook for fetching dashboard overview metrics
 */
export function useDashboardOverview() {
  const { data, isLoading, isError, error, refetch } =
    trpc.dashboard.getOverview.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    });

  return {
    overview: data?.overview || {
      leads: {
        total: 0,
        newThisMonth: 0,
        active: 0,
        closed: 0,
        conversionRate: 0,
        monthlyGrowth: 0,
      },
      stock: {
        total: 0,
        available: 0,
        sold: 0,
        soldThisMonth: 0,
        soldPercentage: 0,
      },
      tasks: {
        pending: 0,
        overdue: 0,
      },
      emails: {
        sentThisMonth: 0,
      },
    },
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for fetching leads distribution by status
 */
export function useLeadsDistribution() {
  const { data, isLoading, isError, error, refetch } =
    trpc.dashboard.getLeadsDistribution.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

  return {
    distribution: data?.distribution || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for fetching stock distribution by type
 */
export function useStockDistribution() {
  const { data, isLoading, isError, error, refetch } =
    trpc.dashboard.getStockDistribution.useQuery(undefined, {
      staleTime: 15 * 60 * 1000, // 15 minutes
    });

  return {
    distribution: data?.distribution || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for fetching monthly trends
 */
export function useMonthlyTrends() {
  const { data, isLoading, isError, error, refetch } =
    trpc.dashboard.getMonthlyTrends.useQuery(undefined, {
      staleTime: 30 * 60 * 1000, // 30 minutes
    });

  return {
    trends: data?.trends || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
