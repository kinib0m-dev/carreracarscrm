"use client";

import { useState } from "react";
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
import { FilterEmailTemplateSchema } from "@/lib/email/validation/emails-schema";

type EmailTemplateFiltersProps = {
  filters: Partial<FilterEmailTemplateSchema>;
  updateFilters: (filters: Partial<FilterEmailTemplateSchema>) => void;
  resetFilters: () => void;
};

export function EmailTemplateFilters({
  filters,
  updateFilters,
  resetFilters,
}: EmailTemplateFiltersProps) {
  // Local state for filter inputs before applying them
  const [searchInput, setSearchInput] = useState(filters.search || "");

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

  // Handle sort option changes
  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split(":") as [
      "name" | "createdAt",
      "asc" | "desc",
    ];

    updateFilters({ sortBy, sortDirection, page: 1 });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-x-4 gap-y-3 items-start sm:items-center">
          {/* Search input */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search templates..."
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

          {/* Sort dropdown */}
          <Select
            value={`${filters.sortBy || "createdAt"}:${filters.sortDirection || "desc"}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Newest first</SelectItem>
              <SelectItem value="createdAt:asc">Oldest first</SelectItem>
              <SelectItem value="name:asc">Name A-Z</SelectItem>
              <SelectItem value="name:desc">Name Z-A</SelectItem>
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
