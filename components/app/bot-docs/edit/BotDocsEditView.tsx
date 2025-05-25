"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { documentCategoryEnum } from "@/db/schema";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUpdateBotDocument } from "@/lib/bot-docs/hooks/use-bot-docs";
import {
  updateBotDocumentSchema,
  UpdateBotDocumentSchema,
} from "@/lib/bot-docs/validation/bot-docs-schema";

type BotDocumentType = {
  id: string;
  userId: string;
  title: string;
  category: string;
  content: string;
  fileName: string | null;
  embedding: number[] | null;
  createdAt: Date;
  updatedAt: Date;
};

interface BotDocumentEditViewProps {
  document: BotDocumentType;
}

function formatCategory(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function BotDocumentEditView({ document }: BotDocumentEditViewProps) {
  const router = useRouter();
  const { updateDocument, isLoading } = useUpdateBotDocument();
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with document data
  const form = useForm<UpdateBotDocumentSchema>({
    resolver: zodResolver(updateBotDocumentSchema),
    defaultValues: {
      id: document.id,
      title: document.title,
      category:
        document.category as (typeof documentCategoryEnum.enumValues)[number],
      content: document.content,
      fileName: document.fileName || undefined,
    },
  });

  const onSubmit = async (data: UpdateBotDocumentSchema) => {
    try {
      setSubmitting(true);
      await updateDocument(data);
      toast.success("Document updated successfully");
      router.push(`/bot-docs/${document.id}`);
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
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
            <Link href={`/bot-docs/${document.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to document details</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Document</h1>
        </div>
      </div>

      {/* Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{document.title}</CardTitle>
          <CardDescription>
            Update document information and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Information</h3>

                {/* Title Field */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter document title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category Field */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentCategoryEnum.enumValues.map((category) => (
                            <SelectItem key={category} value={category}>
                              {formatCategory(category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content Field */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter document content here..."
                          className="min-h-[300px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Filename Field (Read Only) */}
                {document.fileName && (
                  <FormField
                    control={form.control}
                    name="fileName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Filename</FormLabel>
                        <FormControl>
                          <Input readOnly {...field} />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Source filename cannot be edited
                        </p>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting || isLoading}
                  onClick={() => router.push(`/bot-docs/${document.id}`)}
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
