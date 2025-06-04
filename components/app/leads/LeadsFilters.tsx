"use client";

import { useState, useEffect, useCallback } from "react";
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
  filters: FilterLeadSchema;
  updateFilters: (filters: Partial<FilterLeadSchema>) => void;
  resetFilters: () => void;
};

export function LeadsFilters({
  filters,
  updateFilters,
  resetFilters,
}: LeadFiltersProps) {
  // Local state for immediate UI updates before debouncing
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  // Debounce helper
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Debounced search value
  const debouncedSearch = useDebounce(localSearch, 500);

  // Apply debounced search
  useEffect(() => {
    if (debouncedSearch !== (filters.search || "")) {
      updateFilters({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, filters.search, updateFilters]);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSearch(filters.search || "");
  }, [filters.search]);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
  }, []);

  // Handle status change
  const handleStatusChange = (value: string) => {
    if (value === "all_statuses") {
      updateFilters({ status: undefined });
    } else {
      updateFilters({
        status: value as (typeof leadStatusEnum.enumValues)[number],
      });
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    if (value === "all_timeframes") {
      updateFilters({ expectedPurchaseTimeframe: undefined });
    } else {
      updateFilters({
        expectedPurchaseTimeframe:
          value as (typeof timeframeEnum.enumValues)[number],
      });
    }
  };

  // Handle sort option changes
  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split(":") as [
      "name" | "createdAt" | "status",
      "asc" | "desc",
    ];

    updateFilters({ sortBy, sortDirection });
  };

  // Clear all filters
  const handleResetFilters = () => {
    setLocalSearch("");
    resetFilters();
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
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Status Filter */}
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

          {/* Timeframe Filter */}
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

          {/* Sort Options */}
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
