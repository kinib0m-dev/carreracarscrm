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
import { useCreateLead } from "@/lib/leads/hooks/use-leads";
import { CreateLeadSchema } from "@/lib/leads/validation/leads-schema";
import { leadStatusEnum, timeframeEnum } from "@/db/schema";

type CSVLeadData = Record<string, string>;

type ProcessingStatus = "idle" | "processing" | "success" | "error";

// Define field types more strictly
type FieldType = "string" | "number" | "date" | "enum";

// Valid lead field mappings - field name to expected data type
const LEAD_FIELD_MAPPINGS: Record<string, FieldType> = {
  name: "string",
  email: "string",
  phone: "string",
  type: "enum",
  status: "enum",
  expectedPurchaseTimeframe: "enum",
  budget: "string",
  campaignId: "string",
  lastContactedAt: "date",
  lastMessageAt: "date",
  nextFollowUpDate: "date",
};

// Valid lead status values (for validation)
const VALID_LEAD_STATUSES = [
  "nuevo",
  "contactado",
  "activo",
  "calificado",
  "propuesta",
  "evaluando",
  "manager",
  "iniciado",
  "documentacion",
  "comprador",
  "descartado",
  "sin_interes",
  "inactivo",
  "perdido",
  "rechazado",
  "sin_opciones",
];

// Valid lead types (for validation)
const VALID_LEAD_TYPES = ["autonomo", "empresa", "particular", "pensionista"];

// Valid timeframe values (for validation)
const VALID_TIMEFRAMES = [
  "inmediato",
  "esta_semana",
  "proxima_semana",
  "dos_semanas",
  "un_mes",
  "1-3 meses",
  "3-6 meses",
  "6+ meses",
  "indefinido",
];

export function CSVLeadUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVLeadData[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {}
  );
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createLead } = useCreateLead();

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

  // Function to convert CSV values to appropriate types based on field name
  // Define a type for the possible field value types
  type FieldValue = string | number | Date | undefined;

  const convertValueToType = (value: string, fieldName: string): FieldValue => {
    if (!value || value.trim() === "") return undefined;

    const dataType = LEAD_FIELD_MAPPINGS[fieldName];
    switch (dataType) {
      case "number":
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
      case "date":
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
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
      case "status":
        return typeof value === "string" && VALID_LEAD_STATUSES.includes(value);
      case "type":
        return typeof value === "string" && VALID_LEAD_TYPES.includes(value);
      case "expectedPurchaseTimeframe":
        return typeof value === "string" && VALID_TIMEFRAMES.includes(value);
      default:
        return true;
    }
  };

  // Function to normalize column names (handles whitespace, case, common aliases)
  const normalizeColumnName = (header: string): string => {
    const normalized = header.toLowerCase().trim().replace(/\s+/g, "");

    // Common aliases/variations
    const mappings: Record<string, string> = {
      fullname: "name",
      emailaddress: "email",
      phonenumber: "phone",
      phonenum: "phone",
      cellphone: "phone",
      mobile: "phone",
      leadstatus: "status",
      estado: "status",
      leadtype: "type",
      tipo: "type",
      lastcontact: "lastContactedAt",
      lastcontacted: "lastContactedAt",
      ultimocontacto: "lastContactedAt",
      lastmessage: "lastMessageAt",
      ultimomensaje: "lastMessageAt",
      nextfollowup: "nextFollowUpDate",
      followupdate: "nextFollowUpDate",
      followup: "nextFollowUpDate",
      proximocontacto: "nextFollowUpDate",
      purchasetimeframe: "expectedPurchaseTimeframe",
      timeframe: "expectedPurchaseTimeframe",
      purchasetiming: "expectedPurchaseTimeframe",
      plazocompra: "expectedPurchaseTimeframe",
      pricerange: "budget",
      budgetrange: "budget",
      presupuesto: "budget",
      campaign: "campaignId",
      campaña: "campaignId",
      campaignaid: "campaignId",
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
        const validFields = Object.keys(LEAD_FIELD_MAPPINGS);

        normalizedHeaders.forEach((header, index) => {
          if (validFields.includes(header)) {
            mappings[header] = rawHeaders[index];
          }
        });

        setFieldMappings(mappings);

        // Check if name column exists
        if (!mappings.name) {
          setError("CSV must include a 'name' column");
          setPreviewData([]);
          return;
        }

        // Process data with field mappings
        const parsedData: CSVLeadData[] = [];
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

          // Skip if no name value
          const nameIndex = headerIndexes.name;
          if (
            nameIndex === undefined ||
            !values[nameIndex] ||
            !values[nameIndex].trim()
          ) {
            continue;
          }

          const leadData: CSVLeadData = {};

          // Extract values using field mappings
          Object.entries(headerIndexes).forEach(([field, index]) => {
            if (index < values.length) {
              leadData[field] = values[index];
            }
          });

          if (Object.keys(leadData).length > 0) {
            parsedData.push(leadData);
          }
        }

        // Check for valid records
        if (parsedData.length === 0) {
          setError("No valid leads found in CSV");
          setPreviewData([]);
          return;
        }

        // Check for missing recommended fields
        if (!mappings.email && !mappings.phone) {
          newWarnings.push(
            "Neither 'email' nor 'phone' columns found. Leads will be created with minimal contact info."
          );
        }

        // Check if status exists
        if (!mappings.status) {
          newWarnings.push(
            "No 'status' column found. Leads will be created with default status 'nuevo'."
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
        Object.keys(LEAD_FIELD_MAPPINGS).forEach((field) => {
          const headerIndex = normalizedHeaders.indexOf(field);
          if (headerIndex !== -1) {
            headerIndexes[field] = headerIndex;
          }
        });

        // Check if name column exists
        if (headerIndexes.name === undefined) {
          throw new Error("CSV must include a 'name' column");
        }

        // Process the CSV data
        const leadsData: CreateLeadSchema[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseCsvLine(line);

          // Skip if no name value
          const nameIndex = headerIndexes.name;
          if (
            nameIndex === undefined ||
            !values[nameIndex] ||
            !values[nameIndex].trim()
          ) {
            continue;
          }

          // Create lead data with default values
          const leadData: CreateLeadSchema = {
            name: values[nameIndex],
            status: "nuevo", // Default status based on new schema
          };

          // Add any additional fields
          Object.entries(headerIndexes).forEach(([field, index]) => {
            if (field === "name") return; // Skip name, already added

            if (index < values.length) {
              const value = convertValueToType(values[index], field);

              if (value !== undefined && validateField(field, value)) {
                // Use type-safe assignment for known fields
                if (field === "email" && typeof value === "string") {
                  leadData.email = value;
                } else if (field === "phone" && typeof value === "string") {
                  leadData.phone = value;
                } else if (
                  field === "type" &&
                  typeof value === "string" &&
                  VALID_LEAD_TYPES.includes(value)
                ) {
                  leadData.type = value as
                    | "autonomo"
                    | "empresa"
                    | "particular"
                    | "pensionista";
                } else if (
                  field === "status" &&
                  typeof value === "string" &&
                  VALID_LEAD_STATUSES.includes(value)
                ) {
                  leadData.status =
                    value as (typeof leadStatusEnum.enumValues)[number];
                } else if (
                  field === "lastContactedAt" &&
                  value instanceof Date
                ) {
                  leadData.lastContactedAt = value;
                } else if (field === "lastMessageAt" && value instanceof Date) {
                  leadData.lastMessageAt = value;
                } else if (
                  field === "nextFollowUpDate" &&
                  value instanceof Date
                ) {
                  leadData.nextFollowUpDate = value;
                } else if (
                  field === "expectedPurchaseTimeframe" &&
                  typeof value === "string" &&
                  VALID_TIMEFRAMES.includes(value)
                ) {
                  leadData.expectedPurchaseTimeframe =
                    value as (typeof timeframeEnum.enumValues)[number];
                } else if (field === "budget" && typeof value === "string") {
                  leadData.budget = value;
                } else if (
                  field === "campaignId" &&
                  typeof value === "string"
                ) {
                  leadData.campaignId = value;
                }
              }
            }
          });

          // Validate the lead data has minimal required fields
          if (leadData.name && leadData.name.trim() !== "") {
            leadsData.push(leadData);
          }
        }

        setProgress({ current: 0, total: leadsData.length });

        let successCount = 0;
        let failCount = 0;

        // Process leads sequentially to avoid overwhelming the server
        for (let i = 0; i < leadsData.length; i++) {
          try {
            await createLead(leadsData[i]);
            successCount++;
          } catch (error) {
            console.error(`Error creating lead ${i}:`, error);
            failCount++;

            // Don't overwhelm the server with failed requests
            if (failCount > 5) {
              toast.error("Too many errors. Stopping import.");
              break;
            }
          }

          setProgress({ current: i + 1, total: leadsData.length });
        }

        setStatus("success");

        // Summary toast at the end
        toast.success(`Successfully created ${successCount} leads`);

        if (failCount > 0) {
          toast.error(`Failed to create ${failCount} leads`);
        }

        // Redirect after a short delay to let the user see the success message
        setTimeout(() => {
          router.push("/leads");
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
          Upload a CSV file with lead information. The file must include a
          column named &quot;name&quot;. The system will auto-detect and map
          other lead fields like email, phone, status, type, etc.
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
                    {previewData.map((lead, index) => (
                      <tr key={index} className="border-b last:border-0">
                        {Object.keys(fieldMappings).map((field) => (
                          <td key={field} className="p-2">
                            {lead[field] || "-"}
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
                <span>Processing leads...</span>
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
              <span>Upload complete! Redirecting to leads list...</span>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span>Error uploading leads. Please try again.</span>
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
              Upload and Create Leads
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
