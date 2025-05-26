"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, X } from "lucide-react";
import {
  CreateCarStockSchema,
  createCarStockSchema,
} from "@/lib/stock/validation/stock-schema";
import { useCreateCarStock } from "@/lib/stock/hooks/use-stock";
import { carTypeEnum } from "@/db/schema";

function formatCarType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ManualCarStockForm() {
  const router = useRouter();
  const { createCarStock, isLoading } = useCreateCarStock();
  const [submitting, setSubmitting] = useState(false);
  const [urls, setUrls] = useState("");

  const form = useForm({
    resolver: zodResolver(createCarStockSchema),
    defaultValues: {
      // Identificación
      vin: undefined,
      // Información básica
      marca: undefined,
      modelo: undefined,
      version: undefined,
      motor: undefined,
      carroceria: undefined,
      puertas: undefined,
      transmision: undefined,
      etiqueta: undefined,
      fecha_version: undefined,
      color: undefined,
      kilometros: undefined,
      matricula: undefined,
      // Type and description
      type: "sedan",
      description: undefined,
      imageUrl: [],
      url: undefined,
      notes: undefined,
      // Precios y financiación
      precio_compra: undefined,
      precio_venta: undefined,
      precio_financiado: undefined,
      impuestos_incluidos: true,
      impuesto: undefined,
      // Estado
      vendido: false,
    },
  });

  const { imageUrl = [] } = form.watch();

  const addImageUrl = () => {
    if (!urls.trim()) return;

    try {
      new URL(urls);
      const updatedImageUrls = [...imageUrl, urls];
      form.setValue("imageUrl", updatedImageUrls);
      setUrls("");
    } catch {
      form.setError("imageUrl", {
        type: "manual",
        message: "Please enter a valid URL",
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

  const onSubmit = async (data: CreateCarStockSchema) => {
    try {
      setSubmitting(true);
      await createCarStock(data);
      router.push("/stock");
    } catch (error) {
      console.error("Error creating car stock:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Car Information</CardTitle>
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
                      <FormLabel>Matricula</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Matricula"
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
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Marca"
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
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Modelo"
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
                      <FormLabel>Tipo de Vehiculo</FormLabel>
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
                      <FormLabel>Motor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tipo de Motor"
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
                      <FormLabel>Transmision</FormLabel>
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
                      <FormLabel>Numero de Puertas</FormLabel>
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
                      <FormLabel>Kilometros</FormLabel>
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
                      <FormLabel>Carroceria</FormLabel>
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
                      <FormLabel>Etiqueta</FormLabel>
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
                      <FormLabel>Año del Modelo</FormLabel>
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
                      <FormLabel>Precio de Compra</FormLabel>
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
                      <FormLabel>Precio de Venta</FormLabel>
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
                      <FormLabel>Precio Financiado</FormLabel>
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
                      <FormLabel>Impuesto</FormLabel>
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
                        <FormLabel>Impuestos Incluidos</FormLabel>
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

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de la Web</FormLabel>
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

            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full"
            >
              {submitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Car Stock...
                </>
              ) : (
                "Create Car Stock"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
