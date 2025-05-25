"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Car,
  MoreHorizontal,
  Calendar,
  ExternalLink,
  ImageIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { FilterCarStockSchema } from "@/lib/stock/validation/stock-schema";
import { useMarkCarAsSold } from "@/lib/stock/hooks/use-stock";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CarStockTableProps {
  carStockItems: StockItemType[];
  isLoading: boolean;
  currentFilters: Partial<FilterCarStockSchema>;
  updateFilters: (filters: Partial<FilterCarStockSchema>) => void;
}

export function CarStockTable({
  carStockItems,
  isLoading,
  currentFilters,
  updateFilters,
}: CarStockTableProps) {
  const router = useRouter();
  const { markAsSold, isLoading: isMarkingAsSold } = useMarkCarAsSold();

  // Handle marking car as sold
  const handleMarkAsSold = async (carId: string) => {
    try {
      markAsSold({ id: carId });
      toast.success("Car marked as sold successfully");
      router.refresh();
    } catch (error) {
      console.error("Error marking car as sold:", error);
      toast.error("Failed to mark car as sold");
    }
  };

  const getCarTypeColor = (type: string) => {
    switch (type) {
      case "sedan":
        return "bg-blue-100 text-blue-800";
      case "suv":
        return "bg-green-100 text-green-800";
      case "hatchback":
        return "bg-emerald-100 text-emerald-800";
      case "coupe":
        return "bg-purple-100 text-purple-800";
      case "descapotable":
        return "bg-amber-100 text-amber-800";
      case "monovolumen":
        return "bg-orange-100 text-orange-800";
      case "pickup":
        return "bg-indigo-100 text-indigo-800";
      case "electrico":
        return "bg-teal-100 text-teal-800";
      case "hibrido":
        return "bg-lime-100 text-lime-800";
      case "lujo":
        return "bg-rose-100 text-rose-800";
      case "deportivo":
        return "bg-pink-100 text-pink-800";
      case "furgoneta_carga":
      case "furgoneta_pasajeros":
      case "furgoneta_mixta":
        return "bg-gray-100 text-gray-800";
      case "otro":
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatCarType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleSort = (
    column:
      | "marca"
      | "modelo"
      | "type"
      | "precio_venta"
      | "kilometros"
      | "createdAt"
  ) => {
    const direction =
      currentFilters.sortBy === column && currentFilters.sortDirection === "asc"
        ? "desc"
        : "asc";
    updateFilters({ sortBy: column, sortDirection: direction });
  };

  const SortIndicator = ({ column }: { column: string }) =>
    currentFilters.sortBy === column ? (
      <span className="ml-1 inline-block w-3">
        {currentFilters.sortDirection === "asc" ? "↑" : "↓"}
      </span>
    ) : null;

  // Format price for display
  const formatPrice = (price: string | null) => {
    if (!price) return "No price";
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Format kilometers for display
  const formatKilometers = (km: number | null) => {
    if (!km) return "N/A";
    return new Intl.NumberFormat("es-ES").format(km) + " km";
  };

  // Get car display name
  const getCarDisplayName = (car: StockItemType) => {
    const parts = [];
    if (car.marca) parts.push(car.marca);
    if (car.modelo) parts.push(car.modelo);
    if (car.version) parts.push(car.version);

    return parts.length > 0 ? parts.join(" ") : "Unnamed Car";
  };

  if (carStockItems.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">No car stock items found</h3>
        <p className="text-muted-foreground">
          {isLoading
            ? "Loading car stock items..."
            : "Try adjusting your filters or add a new car to get started."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/stock/new">Add Your First Car</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12"></TableHead> {/* For image */}
            <TableHead
              onClick={() => handleSort("marca")}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                Vehicle <SortIndicator column="marca" />
              </div>
            </TableHead>
            <TableHead
              onClick={() => handleSort("type")}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                Type <SortIndicator column="type" />
              </div>
            </TableHead>
            <TableHead>Details</TableHead>
            <TableHead
              onClick={() => handleSort("kilometros")}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                Kilometers <SortIndicator column="kilometros" />
              </div>
            </TableHead>
            <TableHead
              onClick={() => handleSort("precio_venta")}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                Price <SortIndicator column="precio_venta" />
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead
              onClick={() => handleSort("createdAt")}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                Added <SortIndicator column="createdAt" />
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {carStockItems.map((car) => (
            <TableRow
              key={car.id}
              className={`hover:bg-muted/50 transition-colors ${car.vendido ? "opacity-60" : ""}`}
            >
              <TableCell>
                {car.imageUrl && car.imageUrl.length > 0 ? (
                  <div className="relative w-10 h-10 rounded-md overflow-hidden">
                    <Image
                      src={car.imageUrl[0]} // Show the first image as thumbnail
                      alt={getCarDisplayName(car)}
                      fill
                      className="object-cover"
                    />
                    {car.imageUrl.length > 1 && (
                      <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl-md flex items-center">
                        <ImageIcon className="h-3 w-3 mr-0.5" />
                        {car.imageUrl.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-md">
                    <Car className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/stock/${car.id}`}
                  className="font-medium hover:underline flex flex-col gap-1"
                >
                  <span>{getCarDisplayName(car)}</span>
                  {car.matricula && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {car.matricula}
                    </span>
                  )}
                </Link>
                {car.url && (
                  <a
                    href={car.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground flex items-center gap-1 mt-1 hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" /> View listing
                  </a>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  className={`${getCarTypeColor(car.type)} border-none font-normal`}
                >
                  {formatCarType(car.type)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="text-sm space-y-1">
                  {car.color && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Color:</span> {car.color}
                    </div>
                  )}
                  {car.motor && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Motor:</span> {car.motor}
                    </div>
                  )}
                  {car.transmision && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Trans:</span>{" "}
                      {car.transmision}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatKilometers(car.kilometros)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatPrice(car.precio_venta)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {car.vendido ? (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-800"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Sold
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(car.createdAt), "MMM dd, yyyy")}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/stock/${car.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/stock/${car.id}/edit`}>Edit Car</Link>
                    </DropdownMenuItem>
                    {!car.vendido && (
                      <DropdownMenuItem
                        onClick={() => handleMarkAsSold(car.id)}
                        disabled={isMarkingAsSold}
                      >
                        {isMarkingAsSold
                          ? "Marking as sold..."
                          : "Mark as Sold"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
