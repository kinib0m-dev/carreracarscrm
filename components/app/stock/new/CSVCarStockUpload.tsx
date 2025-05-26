"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Check, AlertCircle, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateCarStock } from "@/lib/stock/hooks/use-stock";
import { CreateCarStockSchema } from "@/lib/stock/validation/stock-schema";
import { assignCarDataValue } from "@/lib/stock/utils/stock-utlis";

type CSVCarStockData = Record<string, string>;

type ProcessingStatus = "idle" | "processing" | "success" | "error";

// Define field types more strictly
type FieldType = "string" | "number" | "date" | "boolean" | "enum" | "array";

// Valid car stock field mappings - field name to expected data type
const CAR_STOCK_FIELD_MAPPINGS: Record<string, FieldType> = {
  // Identificación
  vin: "string",
  // Información básica
  marca: "string",
  modelo: "string",
  version: "string",
  motor: "string",
  carroceria: "string",
  puertas: "number",
  transmision: "string",
  etiqueta: "string",
  fecha_version: "date",
  color: "string",
  kilometros: "number",
  matricula: "string",
  // Type and description
  type: "enum",
  description: "string",
  imageUrl: "array",
  url: "string",
  notes: "string",
  // Comerciante / procedencia
  comercial: "string",
  sociedad: "string",
  tienda: "string",
  provincia: "string",
  // Precios y financiación
  precio_compra: "string",
  precio_venta: "string",
  precio_financiado: "string",
  impuestos_incluidos: "boolean",
  impuesto: "string",
  // Estado
  garantia: "string",
  vendido: "boolean",
  gastos_adicionales: "string",
};

// Valid car types
const VALID_CAR_TYPES = [
  "sedan",
  "suv",
  "hatchback",
  "coupe",
  "descapotable",
  "monovolumen",
  "pickup",
  "electrico",
  "hibrido",
  "lujo",
  "deportivo",
  "furgoneta_carga",
  "furgoneta_pasajeros",
  "furgoneta_mixta",
  "otro",
];

// Define a type for the possible field value types
type FieldValue = string | number | Date | boolean | string[] | undefined;

export function CSVCarStockUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVCarStockData[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {}
  );
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createCarStock } = useCreateCarStock();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (
      selectedFile.type !== "text/csv" &&
      !selectedFile.name.endsWith(".csv")
    ) {
      setError("Please upload a CSV file");
      setFile(null);
      setPreviewData([]);
      setWarnings([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
    setError(null);
    setWarnings([]);
    parseCSV(selectedFile);
  };

  const convertValueToType = (value: string, fieldName: string): FieldValue => {
    if (!value || value.trim() === "") return undefined;

    const dataType = CAR_STOCK_FIELD_MAPPINGS[fieldName];
    switch (dataType) {
      case "number":
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
      case "date":
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
      case "boolean":
        const lowerValue = value.toLowerCase().trim();
        return (
          lowerValue === "true" ||
          lowerValue === "1" ||
          lowerValue === "yes" ||
          lowerValue === "sí"
        );
      case "array":
        // For imageUrl, split by comma or semicolon
        return value
          .split(/[,;]/)
          .map((url) => url.trim())
          .filter((url) => url);
      case "enum":
      case "string":
      default:
        return value;
    }
  };

  // Validate a single field value
  const validateField = (fieldName: string, value: FieldValue): boolean => {
    // Return true for undefined/empty values (handled in final validation)
    if (value === undefined || value === null) return true;

    switch (fieldName) {
      case "type":
        return typeof value === "string" && VALID_CAR_TYPES.includes(value);
      default:
        return true;
    }
  };

  // Function to normalize column names (handles whitespace, case, common aliases)
  const normalizeColumnName = (header: string): string => {
    const normalized = header.toLowerCase().trim().replace(/\s+/g, "");

    // Common aliases/variations
    const mappings: Record<string, string> = {
      // Identificación
      vinumber: "vin",
      chassisnumber: "vin",
      numerovin: "vin",
      numerochasis: "vin",
      licenseplate: "matricula",
      plateumber: "matricula",
      matrícula: "matricula",
      placa: "matricula",

      // Información básica
      brand: "marca",
      make: "marca",
      model: "modelo",
      trim: "version",
      versión: "version",
      engine: "motor",
      bodytype: "carroceria",
      carrocería: "carroceria",
      doors: "puertas",
      transmission: "transmision",
      transmisión: "transmision",
      label: "etiqueta",
      modelyear: "fecha_version",
      añomodelo: "fecha_version",
      fechaversión: "fecha_version",
      kilometres: "kilometros",
      kilómetros: "kilometros",
      mileage: "kilometros",

      // Type
      vehicletype: "type",
      cartype: "type",
      tipovehiculo: "type",

      // Commercial
      commercial: "comercial",
      dealer: "comercial",
      vendedor: "comercial",
      company: "sociedad",
      empresa: "sociedad",
      store: "tienda",
      dealership: "tienda",
      concesionario: "tienda",
      province: "provincia",

      // Pricing
      purchaseprice: "precio_compra",
      preciocompra: "precio_compra",
      saleprice: "precio_venta",
      precioventa: "precio_venta",
      sellprice: "precio_venta",
      financeprice: "precio_financiado",
      preciofinanciado: "precio_financiado",
      tax: "impuesto",
      taxes: "impuesto",
      taxincluded: "impuestos_incluidos",
      impuestosincluidos: "impuestos_incluidos",
      additionalcosts: "gastos_adicionales",
      gastosadicionales: "gastos_adicionales",

      // Estado
      warranty: "garantia",
      garantía: "garantia",
      sold: "vendido",

      // Other
      images: "imageUrl",
      imageurls: "imageUrl",
      photos: "imageUrl",
      fotos: "imageUrl",
      listingurl: "url",
      website: "url",
      link: "url",
      enlace: "url",
      notas: "notes",
      observaciones: "notes",
      descripción: "description",
    };

    return mappings[normalized] || normalized;
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const newWarnings: string[] = [];

        // Parse CSV line handling quoted values and commas
        const parseCsvLine = (line: string) => {
          const values: string[] = [];
          let inQuotes = false;
          let currentValue = "";

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              inQuotes = !inQuotes;
              continue;
            }

            if (char === "," && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
              continue;
            }

            currentValue += char;
          }

          // Add the last value
          values.push(currentValue.trim());
          return values;
        };

        // Split by common newline characters and filter empty lines
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length === 0) {
          setError("CSV file is empty");
          setPreviewData([]);
          return;
        }

        // Get raw headers and normalize them
        const rawHeaders = parseCsvLine(lines[0]);
        const normalizedHeaders = rawHeaders.map(normalizeColumnName);

        // Create field mappings
        const mappings: Record<string, string> = {};
        const validFields = Object.keys(CAR_STOCK_FIELD_MAPPINGS);

        normalizedHeaders.forEach((header, index) => {
          if (validFields.includes(header)) {
            mappings[header] = rawHeaders[index];
          }
        });

        setFieldMappings(mappings);

        // Check for basic required fields
        const hasBasicInfo = mappings.marca || mappings.modelo;
        if (!hasBasicInfo) {
          setError(
            "CSV should include at least 'marca' (brand) or 'modelo' (model) column for meaningful car records"
          );
          setPreviewData([]);
          return;
        }

        // Process data with field mappings
        const parsedData: CSVCarStockData[] = [];
        const headerIndexes: Record<string, number> = {};

        // Map field names to column indexes
        Object.keys(mappings).forEach((field) => {
          const headerIndex = normalizedHeaders.indexOf(field);
          if (headerIndex !== -1) {
            headerIndexes[field] = headerIndex;
          }
        });

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseCsvLine(line);

          const carData: CSVCarStockData = {};

          // Extract values using field mappings
          Object.entries(headerIndexes).forEach(([field, index]) => {
            if (index < values.length) {
              carData[field] = values[index];
            }
          });

          if (Object.keys(carData).length > 0) {
            parsedData.push(carData);
          }
        }

        // Check for valid records
        if (parsedData.length === 0) {
          setError("No valid car records found in CSV");
          setPreviewData([]);
          return;
        }

        // Check for missing recommended fields
        if (!mappings.precio_venta) {
          newWarnings.push(
            "No 'precio_venta' (sale price) column found. Cars will be created without sale price."
          );
        }

        if (!mappings.type) {
          newWarnings.push(
            "No 'type' column found. Cars will be created with default type 'sedan'."
          );
        }

        if (!mappings.kilometros) {
          newWarnings.push(
            "No 'kilometros' (mileage) column found. This is important information for car listings."
          );
        }

        // Display warnings
        setWarnings(newWarnings);

        // Preview first 5 records
        setPreviewData(parsedData.slice(0, 5));
      } catch (err) {
        console.error("Error parsing CSV:", err);
        setError("Error parsing CSV file. Please check the format.");
        setPreviewData([]);
      }
    };

    reader.onerror = () => {
      setError("Error reading file");
    };

    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setStatus("processing");
      setProgress({ current: 0, total: 0 });

      const reader = new FileReader();

      reader.onload = async (e) => {
        const text = e.target?.result as string;

        // Parse CSV line handling quoted values and commas
        const parseCsvLine = (line: string) => {
          const values: string[] = [];
          let inQuotes = false;
          let currentValue = "";

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              inQuotes = !inQuotes;
              continue;
            }

            if (char === "," && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
              continue;
            }

            currentValue += char;
          }

          // Add the last value
          values.push(currentValue.trim());
          return values;
        };

        // Split by common newline characters and filter empty lines
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length === 0) {
          throw new Error("CSV file is empty");
        }

        // Get raw headers and normalize them
        const rawHeaders = parseCsvLine(lines[0]);
        const normalizedHeaders = rawHeaders.map(normalizeColumnName);

        // Create mapping of normalized field name to column index
        const headerIndexes: Record<string, number> = {};
        Object.keys(CAR_STOCK_FIELD_MAPPINGS).forEach((field) => {
          const headerIndex = normalizedHeaders.indexOf(field);
          if (headerIndex !== -1) {
            headerIndexes[field] = headerIndex;
          }
        });

        // Process the CSV data
        const carStockData: CreateCarStockSchema[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseCsvLine(line);

          // Create car stock data with default values
          const carData: CreateCarStockSchema = {
            type: "sedan", // Default type
            imageUrl: [],
            impuestos_incluidos: true,
            vendido: false,
          };

          // Use the helper function to assign values safely
          Object.entries(headerIndexes).forEach(([field, index]) => {
            if (index < values.length) {
              const value = convertValueToType(values[index], field);
              if (value !== undefined && validateField(field, value)) {
                assignCarDataValue(carData, field, value);
              }
            }
          });

          carStockData.push(carData);
        }

        setProgress({ current: 0, total: carStockData.length });

        let successCount = 0;
        let failCount = 0;

        // Process cars sequentially to avoid overwhelming the server
        for (let i = 0; i < carStockData.length; i++) {
          try {
            await createCarStock(carStockData[i]);
            successCount++;
          } catch (error) {
            console.error(`Error creating car stock ${i}:`, error);
            failCount++;

            // Don't overwhelm the server with failed requests
            if (failCount > 5) {
              toast.error("Too many errors. Stopping import.");
              break;
            }
          }

          setProgress({ current: i + 1, total: carStockData.length });
        }

        setStatus("success");

        // Summary toast at the end
        toast.success(`Successfully created ${successCount} car stock items`);

        if (failCount > 0) {
          toast.error(`Failed to create ${failCount} car stock items`);
        }

        // Redirect after a short delay to let the user see the success message
        setTimeout(() => {
          router.push("/stock");
        }, 1500);
      };

      reader.onerror = () => {
        throw new Error("Error reading file");
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error processing CSV:", error);
      setStatus("error");
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData([]);
    setStatus("idle");
    setError(null);
    setWarnings([]);
    setProgress({ current: 0, total: 0 });
    setFieldMappings({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <CardDescription>
          Upload a CSV file with car stock information. The system will
          auto-detect and map car fields like marca (brand), modelo (model),
          type, price, kilometers, etc. Common field variations and translations
          are supported.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* File Upload */}
          <div className="flex flex-col items-center justify-center gap-4">
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className={`cursor-pointer ${error ? "border-destructive" : ""}`}
              disabled={status === "processing"}
            />

            {error && (
              <div className="flex w-full items-center gap-2 text-destructive">
                <AlertCircle className="size-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="size-5 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warnings:</p>
                  <ul className="ml-5 list-disc">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* File Info */}
          {file && (
            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2">
                <File className="size-5 text-muted-foreground" />
                <span className="font-medium">{file.name}</span>
                <Badge variant="outline" className="ml-auto">
                  {formatFileSize(file.size)}
                </Badge>
              </div>
            </div>
          )}

          {/* Detected Fields */}
          {Object.keys(fieldMappings).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Detected Fields:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fieldMappings).map(
                  ([field, originalHeader]) => (
                    <Badge key={field} variant="secondary">
                      {originalHeader} → {field}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                Preview (first 5 records):
              </h4>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {Object.keys(fieldMappings).map((field) => (
                        <th key={field} className="p-2 text-left font-medium">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((car, index) => (
                      <tr key={index} className="border-b last:border-0">
                        {Object.keys(fieldMappings).map((field) => (
                          <td key={field} className="p-2">
                            {car[field] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {status === "processing" && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing car stock...</span>
                <span>
                  {progress.current} of {progress.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.round((progress.current / progress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Status Indicators */}
          {status === "success" && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="size-5" />
              <span>Upload complete! Redirecting to car stock list...</span>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span>Error uploading car stock. Please try again.</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={resetForm}
          disabled={status === "processing"}
        >
          Clear
        </Button>
        <Button
          onClick={handleUpload}
          disabled={
            !file || previewData.length === 0 || status === "processing"
          }
        >
          {status === "processing" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload and Create Car Stock
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
