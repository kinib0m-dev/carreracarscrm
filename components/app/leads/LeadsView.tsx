"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { LeadWithTagsAndCampaign } from "@/types/leads";
import { useLeadList } from "@/lib/leads/hooks/use-leads";
import { Pagination } from "../Pagination";
import { LeadsFilters } from "./LeadsFilters";
import { LeadsTable } from "./LeadsTable";

type LeadsViewProps = {
  leads: LeadWithTagsAndCampaign[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

export function LeadsView({
  leads: initialLeads,
  pagination: initialPagination,
}: LeadsViewProps) {
  // Use the custom hooks to manage data and filters
  const {
    leads,
    filters,
    pagination,
    isLoading,
    updateFilters,
    resetFilters,
    goToPage,
    refetch,
  } = useLeadList({
    page: initialPagination.page,
    limit: initialPagination.limit,
  });

  // Use hook data if we've loaded any data, otherwise use initial data
  const hasLoadedData = pagination.totalCount > 0;
  const displayLeads = hasLoadedData ? leads : initialLeads;
  const displayPagination = hasLoadedData ? pagination : initialPagination;

  // Handle refresh after follow-up is sent
  const handleLeadUpdate = () => {
    refetch(); // Refresh the leads data
  };

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lead Management</h1>
        <Button asChild>
          <Link href="/leads/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Lead
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <LeadsFilters
        filters={filters}
        updateFilters={updateFilters}
        resetFilters={resetFilters}
      />

      {/* Leads table with refresh callback */}
      <LeadsTable
        leads={displayLeads}
        isLoading={isLoading}
        onLeadUpdate={handleLeadUpdate}
      />

      {/* Pagination */}
      <Pagination pagination={displayPagination} goToPage={goToPage} />
    </div>
  );
}
