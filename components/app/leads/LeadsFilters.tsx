"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { leadStatusEnum, timeframeEnum } from "@/db/schema";
import { FilterLeadSchema } from "@/lib/leads/validation/leads-schema";

type LeadFiltersProps = {
  filters: Partial<FilterLeadSchema>;
  updateFilters: (filters: Partial<FilterLeadSchema>) => void;
  resetFilters: () => void;
};

export function LeadsFilters({
  filters,
  updateFilters,
  resetFilters,
}: LeadFiltersProps) {
  // Local state for filter inputs before applying them
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Set up the debounce effect - modified to prevent infinite loops
  useEffect(() => {
    // Create a timeout to update the debounced value after 500ms
    const timer = setTimeout(() => {
      // Only trigger search if the term has actually changed from the current filter
      if (searchInput !== filters.search) {
        updateFilters({ search: searchInput || undefined, page: 1 });
      }
    }, 500);

    // Clean up the timeout if searchInput changes before the delay has passed
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, updateFilters]);

  // Apply search filter when user presses Enter or clicks search button
  const handleSearch = () => {
    updateFilters({ search: searchInput || undefined, page: 1 });
  };

  // Handle key press event for search input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchInput("");
    resetFilters();
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    if (value === "all_statuses") {
      updateFilters({ status: undefined, page: 1 });
    } else {
      updateFilters({
        status: value as (typeof leadStatusEnum.enumValues)[number],
        page: 1,
      });
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    if (value === "all_timeframes") {
      updateFilters({ expectedPurchaseTimeframe: undefined, page: 1 });
    } else {
      updateFilters({
        expectedPurchaseTimeframe:
          value as (typeof timeframeEnum.enumValues)[number],
        page: 1,
      });
    }
  };

  // Handle sort option changes
  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split(":") as [
      "name" | "createdAt" | "status",
      "asc" | "desc",
    ];

    updateFilters({ sortBy, sortDirection, page: 1 });
  };

  // Create a stable sort value for the select
  const sortValue = `${filters.sortBy || "createdAt"}:${filters.sortDirection || "desc"}`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-x-4 gap-y-3 items-start sm:items-center">
          {/* Search input */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search leads..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-8"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button
              size="sm"
              onClick={handleSearch}
              className="w-full sm:w-auto"
            >
              Search
            </Button>
          </div>

          {/* Filters */}
          <Select
            value={filters.status || "all_statuses"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_statuses">All Statuses</SelectItem>
              {leadStatusEnum.enumValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.expectedPurchaseTimeframe || "all_timeframes"}
            onValueChange={handleTimeframeChange}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_timeframes">All Timeframes</SelectItem>
              {timeframeEnum.enumValues.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {tf
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Newest first</SelectItem>
              <SelectItem value="createdAt:asc">Oldest first</SelectItem>
              <SelectItem value="name:asc">Name A-Z</SelectItem>
              <SelectItem value="name:desc">Name Z-A</SelectItem>
              <SelectItem value="status:asc">Status A-Z</SelectItem>
              <SelectItem value="status:desc">Status Z-A</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          <div className="w-full sm:w-auto sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
