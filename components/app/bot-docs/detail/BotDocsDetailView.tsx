"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  FileText,
  Calendar,
  Tag,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useDeleteBotDocument } from "@/lib/bot-docs/hooks/use-bot-docs";

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

interface BotDocumentDetailViewProps {
  document: BotDocumentType;
}

export function BotDocumentDetailView({
  document,
}: BotDocumentDetailViewProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteDocument, isLoading: isDeleting } = useDeleteBotDocument();

  // Format dates for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "PPP");
  };

  // Format category for display
  const formatCategory = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "company_profile":
        return "bg-blue-100 text-blue-800";
      case "pricing":
        return "bg-green-100 text-green-800";
      case "financing":
        return "bg-emerald-100 text-emerald-800";
      case "faq":
        return "bg-purple-100 text-purple-800";
      case "service":
        return "bg-amber-100 text-amber-800";
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      case "legal":
        return "bg-red-100 text-red-800";
      case "product_info":
        return "bg-indigo-100 text-indigo-800";
      case "other":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument(document.id);
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/bot-docs">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to documents</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Document Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/bot-docs/${document.id}/edit`}>
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
                <DialogTitle>Delete Document</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this document? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-semibold">
                    This will permanently delete &quot;{document.title}&quot;
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
                  {isDeleting ? "Deleting..." : "Delete Document"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Document Overview Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>{document.title}</span>
            <Badge
              variant="outline"
              className={getCategoryColor(document.category)}
            >
              {formatCategory(document.category)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Added on {formatDate(document.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Last Updated
                </div>
                <div className="font-medium">
                  {formatDate(document.updatedAt)}
                </div>
              </div>
            </div>

            {document.fileName && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Source File
                  </div>
                  <div className="font-medium">{document.fileName}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <div className="font-medium">
                  {formatCategory(document.category)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Embedding Status
                </div>
                <div className="font-medium">
                  {document.embedding ? (
                    <span className="text-green-600">
                      Generated successfully
                    </span>
                  ) : (
                    <span className="text-amber-600">Not generated</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-md font-mono text-sm">
            {document.content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
