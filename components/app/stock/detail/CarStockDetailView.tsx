"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  Car,
  Calendar,
  CircleDollarSign,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Gauge,
  Palette,
  Settings,
  CheckCircle,
  XCircle,
  Euro,
  Wrench,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteCarStock } from "@/lib/stock/hooks/use-stock";

interface CarStockDetailViewProps {
  carStock: StockItemType;
}

export function CarStockDetailView({ carStock }: CarStockDetailViewProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteCarStock, isLoading: isDeleting } = useDeleteCarStock();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get car display name
  const getCarDisplayName = () => {
    const parts = [];
    if (carStock.marca) parts.push(carStock.marca);
    if (carStock.modelo) parts.push(carStock.modelo);
    if (carStock.version) parts.push(carStock.version);
    return parts.length > 0 ? parts.join(" ") : "Unnamed Car";
  };

  // Format dates for display
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "PPP");
  };

  // Format car type for display
  const formatCarType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format price for display
  const formatPrice = (price: string | null) => {
    if (!price) return "Not specified";
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Format kilometers
  const formatKilometers = (km: number | null) => {
    if (!km) return "Not specified";
    return new Intl.NumberFormat("es-ES").format(km) + " km";
  };

  // Get car type badge color
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

  const handleDelete = async () => {
    try {
      await deleteCarStock(carStock.id);
      router.push("/stock");
      toast.success("Car deleted successfully");
    } catch (error) {
      console.error("Error deleting car:", error);
      toast.error("Failed to delete car");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const nextImage = () => {
    const images = carStock.imageUrl;
    if (Array.isArray(images) && images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    const images = carStock.imageUrl;
    if (Array.isArray(images) && images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  // Define a reusable InfoItem component for display
  type InfoItemProps = {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
  };

  const InfoItem = ({ icon: Icon, label, value }: InfoItemProps) => (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/stock">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to car stock</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{getCarDisplayName()}</h1>
            {carStock.matricula && (
              <p className="text-muted-foreground">{carStock.matricula}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/stock/${carStock.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Car</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this car from your stock? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-semibold">
                    This will permanently delete &quot;{getCarDisplayName()}
                    &quot;
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Car"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Car Images Carousel (if available) */}
      {carStock.imageUrl && carStock.imageUrl.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="relative h-80 w-full">
            <Image
              src={carStock.imageUrl[currentImageIndex]}
              alt={`${getCarDisplayName()} - Image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
            />

            {/* Navigation buttons */}
            {carStock.imageUrl.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Image counter */}
          {carStock.imageUrl.length > 1 && (
            <div className="p-2 text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>
                  {currentImageIndex + 1} of {carStock.imageUrl.length} images
                </span>
              </div>

              {/* Thumbnail indicators */}
              <div className="flex justify-center gap-1 mt-2">
                {carStock.imageUrl.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      index === currentImageIndex ? "bg-primary" : "bg-muted"
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="relative h-64 w-full flex items-center justify-center bg-muted">
            <Car className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-muted-foreground mt-4">No images available</p>
          </div>
        </Card>
      )}

      {/* Status and Type Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              {carStock.vendido ? (
                <XCircle className="h-8 w-8 text-red-500" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
            </div>
            <p className="font-medium">
              {carStock.vendido ? "SOLD" : "AVAILABLE"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Badge
              variant="outline"
              className={`${getCarTypeColor(carStock.type)} text-lg px-4 py-2`}
            >
              {formatCarType(carStock.type)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CircleDollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="font-bold text-lg">
              {formatPrice(carStock.precio_venta)}
            </p>
            <p className="text-sm text-muted-foreground">Sale Price</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {carStock.vin && (
              <InfoItem icon={Hash} label="VIN" value={carStock.vin} />
            )}
            {carStock.color && (
              <InfoItem icon={Palette} label="Color" value={carStock.color} />
            )}
            {carStock.kilometros && (
              <InfoItem
                icon={Gauge}
                label="Kilometers"
                value={formatKilometers(carStock.kilometros)}
              />
            )}
            {carStock.motor && (
              <InfoItem icon={Wrench} label="Engine" value={carStock.motor} />
            )}
            {carStock.transmision && (
              <InfoItem
                icon={Settings}
                label="Transmission"
                value={carStock.transmision}
              />
            )}
            {carStock.puertas && (
              <InfoItem icon={Car} label="Doors" value={carStock.puertas} />
            )}
            {carStock.carroceria && (
              <InfoItem
                icon={Car}
                label="Body Type"
                value={carStock.carroceria}
              />
            )}
            {carStock.fecha_version && (
              <InfoItem
                icon={Calendar}
                label="Model Year"
                value={formatDate(carStock.fecha_version)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Pricing & Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {carStock.precio_compra && (
              <InfoItem
                icon={Euro}
                label="Purchase Price"
                value={formatPrice(carStock.precio_compra)}
              />
            )}
            {carStock.precio_venta && (
              <InfoItem
                icon={Euro}
                label="Sale Price"
                value={formatPrice(carStock.precio_venta)}
              />
            )}
            {carStock.precio_financiado && (
              <InfoItem
                icon={Euro}
                label="Financed Price"
                value={formatPrice(carStock.precio_financiado)}
              />
            )}
            {carStock.impuesto && (
              <InfoItem
                icon={Euro}
                label="Tax"
                value={formatPrice(carStock.impuesto)}
              />
            )}
            <InfoItem
              icon={CheckCircle}
              label="Taxes Included"
              value={carStock.impuestos_incluidos ? "Yes" : "No"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Description Card */}
      {carStock.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{carStock.description}</div>
          </CardContent>
        </Card>
      )}

      {/* Notes Card */}
      {carStock.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{carStock.notes}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
