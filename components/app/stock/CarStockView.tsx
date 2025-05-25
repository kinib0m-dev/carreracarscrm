"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { CarStockTable } from "./CarStockTable";
import { CarStockFilters } from "./CarStockFilter";
import { useCarStockList } from "@/lib/stock/hooks/use-stock";
import { Pagination } from "../Pagination";

type CarStockViewProps = {
  carStockItems: StockItemType[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

export function CarStockView({
  carStockItems: initialItems,
  pagination: initialPagination,
}: CarStockViewProps) {
  // Use the custom hooks to manage data and filters
  const {
    carStockItems,
    filters,
    pagination,
    isLoading,
    updateFilters,
    resetFilters,
    goToPage,
  } = useCarStockList();

  // Use the real data from the hooks if available, otherwise use the initial data
  const displayItems = isLoading ? initialItems : carStockItems;
  const displayPagination = isLoading ? initialPagination : pagination;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Car Stock Management</h1>
        <Button asChild>
          <Link href="/stock/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Car
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <CarStockFilters
        filters={filters}
        updateFilters={updateFilters}
        resetFilters={resetFilters}
      />

      {/* Car stock table */}
      <CarStockTable
        carStockItems={displayItems}
        isLoading={isLoading}
        currentFilters={filters}
        updateFilters={updateFilters}
      />

      {/* Pagination */}
      <Pagination pagination={displayPagination} goToPage={goToPage} />
    </div>
  );
}
