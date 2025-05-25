"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { BotDocumentTable } from "./BotDocsTable";
import { BotDocumentFilters } from "./BotDocsFilter";
import { useBotDocumentList } from "@/lib/bot-docs/hooks/use-bot-docs";
import { Pagination } from "../Pagination";

type BotDocumentType = {
  id: string;
  userId: string;
  title: string;
  category: string;
  content: string;
  fileName: string | null;
  embedding: number[] | null;
  createdAt: Date;
  updatedAt: Date;
};

type BotDocsViewProps = {
  documents: BotDocumentType[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

export function BotDocsView({
  documents: initialDocuments,
  pagination: initialPagination,
}: BotDocsViewProps) {
  // Use the custom hooks to manage data and filters
  const {
    documents,
    filters,
    pagination,
    isLoading,
    updateFilters,
    resetFilters,
    goToPage,
  } = useBotDocumentList();

  // Use the real data from the hooks if available, otherwise use the initial data
  const displayDocuments = isLoading ? initialDocuments : documents;
  const displayPagination = isLoading ? initialPagination : pagination;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bot Documentation</h1>
        <Button asChild>
          <Link href="/bot-docs/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Document
          </Link>
        </Button>
      </div>
      {/* Filters */}
      <BotDocumentFilters
        filters={filters}
        updateFilters={updateFilters}
        resetFilters={resetFilters}
      />

      {/* Documents table */}
      <BotDocumentTable
        documents={displayDocuments}
        isLoading={isLoading}
        currentFilters={filters}
        updateFilters={updateFilters}
      />

      {/* Pagination */}
      <Pagination pagination={displayPagination} goToPage={goToPage} />
    </div>
  );
}
