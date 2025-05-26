"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type PaginationProps = {
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  goToPage: (page: number) => void;
};

export function Pagination({ pagination, goToPage }: PaginationProps) {
  const { page, limit, totalCount, totalPages } = pagination;

  // Calculate the range of items being displayed
  const rangeStart = (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalCount);

  // Create array of visible page numbers to display
  const getPageNumbers = () => {
    const visiblePageNumbers = [];
    const maxVisiblePages = 5;

    // Always include current page
    visiblePageNumbers.push(page);

    // Add pages before current page
    for (let i = 1; i <= 2; i++) {
      if (page - i > 0) {
        visiblePageNumbers.unshift(page - i);
      }
    }

    // Add pages after current page
    for (let i = 1; i <= 2; i++) {
      if (page + i <= totalPages) {
        visiblePageNumbers.push(page + i);
      }
    }

    // Fill remaining slots with more pages if needed
    while (visiblePageNumbers.length < Math.min(maxVisiblePages, totalPages)) {
      if (visiblePageNumbers[0] > 1) {
        visiblePageNumbers.unshift(visiblePageNumbers[0] - 1);
      } else if (
        visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages
      ) {
        visiblePageNumbers.push(
          visiblePageNumbers[visiblePageNumbers.length - 1] + 1
        );
      } else {
        break;
      }
    }

    return visiblePageNumbers;
  };

  // If there's only one page, don't show pagination
  if (totalPages <= 1) {
    return (
      <div className="flex justify-between items-center p-4 rounded-md border">
        <div className="text-sm text-muted-foreground">
          {totalCount === 0
            ? "No results"
            : `Showing ${totalCount} result${totalCount !== 1 ? "s" : ""}`}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center border rounded-md p-4">
      <div className="text-sm text-muted-foreground">
        {totalCount === 0
          ? "No results"
          : `Showing ${rangeStart} to ${rangeEnd} of ${totalCount} result${
              totalCount !== 1 ? "s" : ""
            }`}
      </div>

      <div className="flex items-center space-x-2">
        {/* First page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(1)}
          disabled={page <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? "default" : "outline"}
              size="icon"
              onClick={() => goToPage(pageNumber)}
              className="h-8 w-8"
            >
              {pageNumber}
            </Button>
          ))}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  );
}
