// In components/app/stock/CarStockFilter.tsx - replace the entire component
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { carTypeEnum } from "@/db/schema";
import { FilterCarStockSchema } from "@/lib/stock/validation/stock-schema";

type CarStockFiltersProps = {
  filters: FilterCarStockSchema;
  updateFilters: (filters: Partial<FilterCarStockSchema>) => void;
  resetFilters: () => void;
};

export function CarStockFilters({
  filters,
  updateFilters,
  resetFilters,
}: CarStockFiltersProps) {
  // Local state for immediate UI updates before debouncing
  const [localFilters, setLocalFilters] = useState({
    search: filters.search || "",
    marca: filters.marca || "",
    modelo: filters.modelo || "",
    color: filters.color || "",
    precio_min: filters.precio_min || "",
    precio_max: filters.precio_max || "",
    kilometros_min: filters.kilometros_min?.toString() || "",
    kilometros_max: filters.kilometros_max?.toString() || "",
  });

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

  // Debounced values
  const debouncedSearch = useDebounce(localFilters.search, 500);
  const debouncedMarca = useDebounce(localFilters.marca, 500);
  const debouncedModelo = useDebounce(localFilters.modelo, 500);
  const debouncedColor = useDebounce(localFilters.color, 500);
  const debouncedPrecioMin = useDebounce(localFilters.precio_min, 500);
  const debouncedPrecioMax = useDebounce(localFilters.precio_max, 500);
  const debouncedKilometrosMin = useDebounce(localFilters.kilometros_min, 500);
  const debouncedKilometrosMax = useDebounce(localFilters.kilometros_max, 500);

  // Apply debounced filters
  useEffect(() => {
    const newFilters: Partial<FilterCarStockSchema> = {};

    if (debouncedSearch !== (filters.search || "")) {
      newFilters.search = debouncedSearch || undefined;
    }
    if (debouncedMarca !== (filters.marca || "")) {
      newFilters.marca = debouncedMarca || undefined;
    }
    if (debouncedModelo !== (filters.modelo || "")) {
      newFilters.modelo = debouncedModelo || undefined;
    }
    if (debouncedColor !== (filters.color || "")) {
      newFilters.color = debouncedColor || undefined;
    }
    if (debouncedPrecioMin !== (filters.precio_min || "")) {
      newFilters.precio_min = debouncedPrecioMin || undefined;
    }
    if (debouncedPrecioMax !== (filters.precio_max || "")) {
      newFilters.precio_max = debouncedPrecioMax || undefined;
    }
    if (debouncedKilometrosMin !== (filters.kilometros_min?.toString() || "")) {
      newFilters.kilometros_min = debouncedKilometrosMin
        ? parseInt(debouncedKilometrosMin)
        : undefined;
    }
    if (debouncedKilometrosMax !== (filters.kilometros_max?.toString() || "")) {
      newFilters.kilometros_max = debouncedKilometrosMax
        ? parseInt(debouncedKilometrosMax)
        : undefined;
    }

    if (Object.keys(newFilters).length > 0) {
      updateFilters(newFilters);
    }
  }, [
    debouncedSearch,
    debouncedMarca,
    debouncedModelo,
    debouncedColor,
    debouncedPrecioMin,
    debouncedPrecioMax,
    debouncedKilometrosMin,
    debouncedKilometrosMax,
    filters,
    updateFilters,
  ]);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalFilters({
      search: filters.search || "",
      marca: filters.marca || "",
      modelo: filters.modelo || "",
      color: filters.color || "",
      precio_min: filters.precio_min || "",
      precio_max: filters.precio_max || "",
      kilometros_min: filters.kilometros_min?.toString() || "",
      kilometros_max: filters.kilometros_max?.toString() || "",
    });
  }, [filters]);

  // Handle immediate UI changes
  const handleLocalChange = useCallback((field: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle non-debounced filters
  const handleTypeChange = (value: string) => {
    if (value === "all_types") {
      updateFilters({ type: undefined });
    } else {
      updateFilters({ type: value as (typeof carTypeEnum.enumValues)[number] });
    }
  };

  const handleVendidoChange = (checked: boolean) => {
    updateFilters({ vendido: checked });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split(":") as [
      "marca" | "modelo" | "type" | "precio_venta" | "kilometros" | "createdAt",
      "asc" | "desc",
    ];
    updateFilters({ sortBy, sortDirection });
  };

  // Clear all filters
  const handleResetFilters = () => {
    setLocalFilters({
      search: "",
      marca: "",
      modelo: "",
      color: "",
      precio_min: "",
      precio_max: "",
      kilometros_min: "",
      kilometros_max: "",
    });
    resetFilters();
  };

  const sortValue = `${filters.sortBy || "createdAt"}:${filters.sortDirection || "desc"}`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* First row: Search and quick filters */}
          <div className="flex flex-wrap gap-x-4 gap-y-3 items-start sm:items-center">
            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search cars..."
                value={localFilters.search}
                onChange={(e) => handleLocalChange("search", e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Type filter */}
            <Select
              value={filters.type || "all_types"}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Car Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">All Types</SelectItem>
                {carTypeEnum.enumValues.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Vendido filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vendido"
                checked={filters.vendido || false}
                onCheckedChange={handleVendidoChange}
              />
              <label htmlFor="vendido" className="text-sm font-medium">
                Show sold cars
              </label>
            </div>

            {/* Sort options */}
            <Select value={sortValue} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Newest first</SelectItem>
                <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                <SelectItem value="marca:asc">Marca A-Z</SelectItem>
                <SelectItem value="marca:desc">Marca Z-A</SelectItem>
                <SelectItem value="modelo:asc">Modelo A-Z</SelectItem>
                <SelectItem value="modelo:desc">Modelo Z-A</SelectItem>
                <SelectItem value="type:asc">Type A-Z</SelectItem>
                <SelectItem value="type:desc">Type Z-A</SelectItem>
                <SelectItem value="precio_venta:asc">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="precio_venta:desc">
                  Price: High to Low
                </SelectItem>
                <SelectItem value="kilometros:asc">
                  Kilometers: Low to High
                </SelectItem>
                <SelectItem value="kilometros:desc">
                  Kilometers: High to Low
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="w-full sm:w-auto sm:ml-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Second row: Detailed filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <Input
              placeholder="Marca"
              value={localFilters.marca}
              onChange={(e) => handleLocalChange("marca", e.target.value)}
            />
            <Input
              placeholder="Modelo"
              value={localFilters.modelo}
              onChange={(e) => handleLocalChange("modelo", e.target.value)}
            />
            <Input
              placeholder="Color"
              value={localFilters.color}
              onChange={(e) => handleLocalChange("color", e.target.value)}
            />
            <Input
              placeholder="Min Price"
              value={localFilters.precio_min}
              onChange={(e) => handleLocalChange("precio_min", e.target.value)}
              type="number"
            />
            <Input
              placeholder="Max Price"
              value={localFilters.precio_max}
              onChange={(e) => handleLocalChange("precio_max", e.target.value)}
              type="number"
            />
            <Input
              placeholder="Min Kilometers"
              value={localFilters.kilometros_min}
              onChange={(e) =>
                handleLocalChange("kilometros_min", e.target.value)
              }
              type="number"
            />
          </div>

          {/* Third row: Additional range filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Max Kilometers"
              value={localFilters.kilometros_max}
              onChange={(e) =>
                handleLocalChange("kilometros_max", e.target.value)
              }
              type="number"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
