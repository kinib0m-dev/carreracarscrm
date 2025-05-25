"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { useUpdateCarStock } from "@/lib/stock/hooks/use-stock";
import {
  UpdateCarStockSchema,
  updateCarStockSchema,
} from "@/lib/stock/validation/stock-schema";
import { carTypeEnum } from "@/db/schema";

interface CarStockEditViewProps {
  carStock: StockItemType;
}

function formatCarType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CarStockEditView({ carStock }: CarStockEditViewProps) {
  const router = useRouter();
  const { updateCarStock, isLoading } = useUpdateCarStock();
  const [submitting, setSubmitting] = useState(false);
  const [urls, setUrls] = useState("");

  // Get car display name
  const getCarDisplayName = () => {
    const parts = [];
    if (carStock.marca) parts.push(carStock.marca);
    if (carStock.modelo) parts.push(carStock.modelo);
    if (carStock.version) parts.push(carStock.version);
    return parts.length > 0 ? parts.join(" ") : "Unnamed Car";
  };

  // Initialize form with car stock data
  const form = useForm({
    resolver: zodResolver(updateCarStockSchema),
    defaultValues: {
      id: carStock.id,
      // Identificación
      vin: carStock.vin || undefined,
      // Información básica
      marca: carStock.marca || undefined,
      modelo: carStock.modelo || undefined,
      version: carStock.version || undefined,
      motor: carStock.motor || undefined,
      carroceria: carStock.carroceria || undefined,
      puertas: carStock.puertas || undefined,
      transmision: carStock.transmision || undefined,
      etiqueta: carStock.etiqueta || undefined,
      fecha_version: carStock.fecha_version || undefined,
      color: carStock.color || undefined,
      kilometros: carStock.kilometros || undefined,
      matricula: carStock.matricula || undefined,
      // Type and description
      type: carStock.type,
      description: carStock.description || undefined,
      imageUrl: carStock.imageUrl || [],
      url: carStock.url || undefined,
      notes: carStock.notes || undefined,
      // Comerciante / procedencia
      comercial: carStock.comercial || undefined,
      sociedad: carStock.sociedad || undefined,
      tienda: carStock.tienda || undefined,
      provincia: carStock.provincia || undefined,
      // Precios y financiación
      precio_compra: carStock.precio_compra || undefined,
      precio_venta: carStock.precio_venta || undefined,
      precio_financiado: carStock.precio_financiado || undefined,
      impuestos_incluidos: carStock.impuestos_incluidos ?? true,
      impuesto: carStock.impuesto || undefined,
      // Estado
      garantia: carStock.garantia || undefined,
      vendido: carStock.vendido ?? false,
      gastos_adicionales: carStock.gastos_adicionales || undefined,
    },
  });

  const { imageUrl = [] } = form.watch();

  const addImageUrl = () => {
    if (!urls.trim()) return;

    // Validate URL format
    try {
      new URL(urls);
      const updatedImageUrls = [...imageUrl, urls];
      form.setValue("imageUrl", updatedImageUrls);
      setUrls("");
    } catch {
      // Handle invalid URL format
      form.setError("imageUrl", {
        type: "manual",
        message: `Please enter a valid URL`,
      });
    }
  };

  const removeImageUrl = (index: number) => {
    const updatedImageUrls = [...imageUrl];
    updatedImageUrls.splice(index, 1);
    form.setValue("imageUrl", updatedImageUrls);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addImageUrl();
    }
  };

  const onSubmit = async (data: UpdateCarStockSchema) => {
    try {
      setSubmitting(true);
      await updateCarStock(data);
      toast.success("Car updated successfully");
      router.push(`/stock/${carStock.id}`);
    } catch (error) {
      console.error("Error updating car:", error);
      toast.error("Failed to update car");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/stock/${carStock.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to car details</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Car</h1>
        </div>
      </div>

      {/* Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{getCarDisplayName()}</CardTitle>
          <CardDescription>Update car information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Vehicle Identification Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Vehicle Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VIN</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vehicle Identification Number"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="matricula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="License plate number"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Basic Vehicle Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Vehicle Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vehicle brand"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vehicle model"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Version/trim level"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carTypeEnum.enumValues.map((type) => (
                              <SelectItem key={type} value={type}>
                                {formatCarType(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vehicle color"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="motor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engine</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Engine type"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transmision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Transmission type"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="puertas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doors</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Number of doors"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kilometros"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilometers</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Kilometers"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="carroceria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Type</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Body type"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="etiqueta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Environmental label"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fecha_version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Year</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Commercial Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Commercial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="comercial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commercial Contact</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Commercial contact name"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="provincia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Province</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Province/region"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sociedad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Company/society name"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tienda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Store/dealership name"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Pricing & Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="precio_compra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Purchase price"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="precio_venta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Sale price"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="precio_financiado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financed Price</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Financed price"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="impuesto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tax amount"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gastos_adicionales"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Costs</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Additional costs"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="impuestos_incluidos"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Taxes included in price</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Status and Additional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Status & Additional Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="garantia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Warranty information"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="vendido"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Mark as sold</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter car description..."
                          className="min-h-[120px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* URL Field */}
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter car listing URL"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes Field */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter additional notes..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image URLs Field */}
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={() => (
                    <FormItem>
                      <FormLabel>Image URLs</FormLabel>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter image URL"
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            onKeyDown={handleKeyPress}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addImageUrl}
                            className="shrink-0"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                        <FormMessage />

                        {/* Display added image URLs */}
                        {imageUrl.length > 0 && (
                          <div className="space-y-2 mt-2">
                            <p className="text-sm font-medium">Car Images:</p>
                            <div className="space-y-2">
                              {imageUrl.map((url, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
                                >
                                  <span className="truncate flex-1">{url}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => removeImageUrl(index)}
                                  >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Remove</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting || isLoading}
                  onClick={() => router.push(`/stock/${carStock.id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || isLoading}>
                  {submitting || isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
