"use client";

import { useState, useEffect } from "react";
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
  filters: Partial<FilterCarStockSchema>;
  updateFilters: (filters: Partial<FilterCarStockSchema>) => void;
  resetFilters: () => void;
};

export function CarStockFilters({
  filters,
  updateFilters,
  resetFilters,
}: CarStockFiltersProps) {
  // Local state for filter inputs before applying them
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [marcaInput, setMarcaInput] = useState(filters.marca || "");
  const [modeloInput, setModeloInput] = useState(filters.modelo || "");
  const [colorInput, setColorInput] = useState(filters.color || "");
  const [provinciaInput, setProvinciaInput] = useState(filters.provincia || "");
  const [comercialInput, setComercialInput] = useState(filters.comercial || "");
  const [precioMinInput, setPrecioMinInput] = useState(
    filters.precio_min || ""
  );
  const [precioMaxInput, setPrecioMaxInput] = useState(
    filters.precio_max || ""
  );
  const [kilometrosMinInput, setKilometrosMinInput] = useState(
    filters.kilometros_min?.toString() || ""
  );
  const [kilometrosMaxInput, setKilometrosMaxInput] = useState(
    filters.kilometros_max?.toString() || ""
  );

  // Set up the debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilters({ search: searchInput || undefined, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, updateFilters]);

  // Set up the debounce effect for marca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (marcaInput !== filters.marca) {
        updateFilters({ marca: marcaInput || undefined, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [marcaInput, filters.marca, updateFilters]);

  // Set up the debounce effect for modelo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (modeloInput !== filters.modelo) {
        updateFilters({ modelo: modeloInput || undefined, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [modeloInput, filters.modelo, updateFilters]);

  // Set up the debounce effect for color
  useEffect(() => {
    const timer = setTimeout(() => {
      if (colorInput !== filters.color) {
        updateFilters({ color: colorInput || undefined, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [colorInput, filters.color, updateFilters]);

  // Set up the debounce effect for provincia
  useEffect(() => {
    const timer = setTimeout(() => {
      if (provinciaInput !== filters.provincia) {
        updateFilters({ provincia: provinciaInput || undefined, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [provinciaInput, filters.provincia, updateFilters]);

  // Set up the debounce effect for comercial
  useEffect(() => {
    const timer = setTimeout(() => {
      if (comercialInput !== filters.comercial) {
        updateFilters({ comercial: comercialInput || undefined, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [comercialInput, filters.comercial, updateFilters]);

  // Set up the debounce effect for price filters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (precioMinInput !== filters.precio_min) {
        updateFilters({ precio_min: precioMinInput || undefined, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [precioMinInput, filters.precio_min, updateFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (precioMaxInput !== filters.precio_max) {
        updateFilters({ precio_max: precioMaxInput || undefined, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [precioMaxInput, filters.precio_max, updateFilters]);

  // Set up the debounce effect for kilometers filters
  useEffect(() => {
    const timer = setTimeout(() => {
      const newValue = kilometrosMinInput
        ? parseInt(kilometrosMinInput)
        : undefined;
      if (newValue !== filters.kilometros_min) {
        updateFilters({ kilometros_min: newValue, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [kilometrosMinInput, filters.kilometros_min, updateFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newValue = kilometrosMaxInput
        ? parseInt(kilometrosMaxInput)
        : undefined;
      if (newValue !== filters.kilometros_max) {
        updateFilters({ kilometros_max: newValue, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [kilometrosMaxInput, filters.kilometros_max, updateFilters]);

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
    setMarcaInput("");
    setModeloInput("");
    setColorInput("");
    setProvinciaInput("");
    setComercialInput("");
    setPrecioMinInput("");
    setPrecioMaxInput("");
    setKilometrosMinInput("");
    setKilometrosMaxInput("");
    resetFilters();
  };

  // Handle car type change
  const handleTypeChange = (value: string) => {
    if (value === "all_types") {
      updateFilters({ type: undefined, page: 1 });
    } else {
      updateFilters({
        type: value as (typeof carTypeEnum.enumValues)[number],
        page: 1,
      });
    }
  };

  // Handle vendido status change
  const handleVendidoChange = (checked: boolean) => {
    updateFilters({ vendido: checked, page: 1 });
  };

  // Handle sort option changes
  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split(":") as [
      "marca" | "modelo" | "type" | "precio_venta" | "kilometros" | "createdAt",
      "asc" | "desc",
    ];

    updateFilters({ sortBy, sortDirection, page: 1 });
  };

  // Create a stable sort value for the select
  const sortValue = `${filters.sortBy || "createdAt"}:${filters.sortDirection || "desc"}`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* First row: Search and quick filters */}
          <div className="flex flex-wrap gap-x-4 gap-y-3 items-start sm:items-center">
            {/* Search input */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder="Search cars..."
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

          {/* Second row: Detailed filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Marca filter */}
            <Input
              placeholder="Marca"
              value={marcaInput}
              onChange={(e) => setMarcaInput(e.target.value)}
              className="w-full"
            />

            {/* Modelo filter */}
            <Input
              placeholder="Modelo"
              value={modeloInput}
              onChange={(e) => setModeloInput(e.target.value)}
              className="w-full"
            />

            {/* Color filter */}
            <Input
              placeholder="Color"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              className="w-full"
            />

            {/* Provincia filter */}
            <Input
              placeholder="Provincia"
              value={provinciaInput}
              onChange={(e) => setProvinciaInput(e.target.value)}
              className="w-full"
            />

            {/* Comercial filter */}
            <Input
              placeholder="Comercial"
              value={comercialInput}
              onChange={(e) => setComercialInput(e.target.value)}
              className="w-full"
            />

            {/* Price range filters */}
            <div className="flex gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
              <Input
                placeholder="Min Price"
                value={precioMinInput}
                onChange={(e) => setPrecioMinInput(e.target.value)}
                type="number"
                className="w-full"
              />
            </div>
          </div>

          {/* Third row: Additional range filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Max price */}
            <Input
              placeholder="Max Price"
              value={precioMaxInput}
              onChange={(e) => setPrecioMaxInput(e.target.value)}
              type="number"
              className="w-full"
            />

            {/* Kilometers range filters */}
            <Input
              placeholder="Min Kilometers"
              value={kilometrosMinInput}
              onChange={(e) => setKilometrosMinInput(e.target.value)}
              type="number"
              className="w-full"
            />

            <Input
              placeholder="Max Kilometers"
              value={kilometrosMaxInput}
              onChange={(e) => setKilometrosMaxInput(e.target.value)}
              type="number"
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
