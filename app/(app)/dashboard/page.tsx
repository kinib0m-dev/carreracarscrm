import { DashboardLayout } from "@/components/app/dashboard/DashboardLayout";
import { HydrateClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your CRM performance and key metrics",
};

export default async function DashboardPage() {
  // Pre-fetch dashboard data for better performance
  try {
    await Promise.all([
      trpc.dashboard.getOverview.prefetch(),
      trpc.dashboard.getLeadsDistribution.prefetch(),
      trpc.dashboard.getStockDistribution.prefetch(),
      trpc.dashboard.getMonthlyTrends.prefetch(),
    ]);
  } catch (error) {
    console.error("Error prefetching dashboard data:", error);
  }

  return (
    <HydrateClient>
      <DashboardLayout />
    </HydrateClient>
  );
}
