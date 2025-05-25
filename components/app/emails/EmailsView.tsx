"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { EmailTemplateFilters } from "./EmailTemplateFilters";
import { EmailTemplateTable } from "./EmailTemplateTable";
import { useEmailTemplateList } from "@/lib/email/hooks/use-emails";
import { Pagination } from "../Pagination";

type EmailTemplate = {
  id: string;
  userId: string;
  name: string;
  subject: string;
  content: string;
  description: string | null;
  targetStatuses: string[];
  createdAt: Date;
  updatedAt: Date;
};

type EmailsViewProps = {
  templates: EmailTemplate[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

export function EmailsView({
  templates: initialTemplates,
  pagination: initialPagination,
}: EmailsViewProps) {
  // Use the custom hooks to manage data and filters
  const {
    templates,
    filters,
    pagination,
    isLoading,
    updateFilters,
    resetFilters,
    goToPage,
  } = useEmailTemplateList();

  // Use the real data from the hooks if available, otherwise use the initial data
  const displayTemplates = isLoading ? initialTemplates : templates;
  const displayPagination = isLoading ? initialPagination : pagination;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button asChild>
          <Link href="/emails/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Template
          </Link>
        </Button>
      </div>
      {/* Filters */}
      <EmailTemplateFilters
        filters={filters}
        updateFilters={updateFilters}
        resetFilters={resetFilters}
      />

      {/* Templates table */}
      <EmailTemplateTable
        templates={displayTemplates}
        isLoading={isLoading}
        currentFilters={filters}
        updateFilters={updateFilters}
      />

      {/* Pagination */}
      <Pagination pagination={displayPagination} goToPage={goToPage} />
    </div>
  );
}
