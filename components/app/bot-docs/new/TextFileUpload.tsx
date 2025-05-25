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
import { Upload, File, Check, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { documentCategoryEnum } from "@/db/schema";
import { useCreateBotDocument } from "@/lib/bot-docs/hooks/use-bot-docs";
import { CreateBotDocumentSchema } from "@/lib/bot-docs/validation/bot-docs-schema";

type ProcessingStatus = "idle" | "processing" | "success" | "error";

function formatCategory(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function TextFileUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("other");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createDocument, isLoading } = useCreateBotDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check if the file is a text file
    if (!selectedFile.name.endsWith(".txt")) {
      setError("Please upload a .txt file");
      setFile(null);
      setFileContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Extract filename to use as default title (without extension)
    const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
    if (!title) {
      setTitle(fileName);
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setFileContent(text);
      } catch (err) {
        console.error("Error reading file:", err);
        setError("Error reading file content");
        setFileContent("");
      }
    };

    reader.onerror = () => {
      setError("Error reading file");
      setFileContent("");
    };

    reader.readAsText(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file || !fileContent || !title) {
      setError("Please provide a file and title");
      return;
    }

    try {
      setStatus("processing");

      const documentData: CreateBotDocumentSchema = {
        title,
        category: category as (typeof documentCategoryEnum.enumValues)[number],
        content: fileContent,
        fileName: file.name,
      };

      await createDocument(documentData);
      setStatus("success");
      toast.success("Document created successfully");

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/bot-docs");
      }, 1500);
    } catch (error) {
      console.error("Error creating document:", error);
      setStatus("error");
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      toast.error("Failed to create document");
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileContent("");
    setTitle("");
    setCategory("other");
    setStatus("idle");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isValidForm = !!file && !!fileContent && !!title;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Text File</CardTitle>
        <CardDescription>
          Upload a text (.txt) file with document content for your bot. The
          system will use this information to provide context for the bot&apos;s
          responses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* File Upload */}
          <div className="flex flex-col gap-4">
            <Input
              ref={fileInputRef}
              id="text-file"
              type="file"
              accept=".txt"
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

          {/* Document Title */}
          {file && (
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Document Title*
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                disabled={status === "processing"}
              />
            </div>
          )}

          {/* Document Category */}
          {file && (
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={status === "processing"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {documentCategoryEnum.enumValues.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {formatCategory(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Content Preview */}
          {fileContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Content Preview:</h4>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(new Blob([fileContent]).size)}
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-md border p-3 text-sm">
                <pre className="whitespace-pre-wrap font-mono">
                  {fileContent.length > 1000
                    ? fileContent.substring(0, 1000) + "..."
                    : fileContent}
                </pre>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          {status === "success" && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="size-5" />
              <span>Upload complete! Redirecting to documents list...</span>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span>Error uploading document. Please try again.</span>
            </div>
          )}

          {status === "processing" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing document...</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: "100%",
                    animationName: "indeterminateProgress",
                    animationDuration: "1.5s",
                    animationIterationCount: "infinite",
                    animationTimingFunction: "linear",
                  }}
                />
              </div>
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
          onClick={handleSubmit}
          disabled={!isValidForm || status === "processing" || isLoading}
        >
          {status === "processing" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload and Create Document
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
