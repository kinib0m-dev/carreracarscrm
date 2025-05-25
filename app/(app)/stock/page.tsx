import { CarStockLayout } from "@/components/app/stock/CarStockLayout";
import { HydrateClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Car Stock Management",
  description: "Manage your car stock and inventory",
};

export default async function CarStockPage() {
  // Pre-fetch initial car stock data
  await trpc.stock.list.prefetch({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  return (
    <HydrateClient>
      <CarStockLayout />
    </HydrateClient>
  );
}
