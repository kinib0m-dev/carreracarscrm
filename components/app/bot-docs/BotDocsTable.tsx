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
import { FileText, MoreHorizontal, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { FilterBotDocumentSchema } from "@/lib/bot-docs/validation/bot-docs-schema";

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

interface BotDocumentTableProps {
  documents: BotDocumentType[];
  isLoading: boolean;
  currentFilters: Partial<FilterBotDocumentSchema>;
  updateFilters: (filters: Partial<FilterBotDocumentSchema>) => void;
}

export function BotDocumentTable({
  documents,
  isLoading,
  currentFilters,
  updateFilters,
}: BotDocumentTableProps) {
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

  const formatCategory = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleSort = (column: "title" | "category" | "createdAt") => {
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

  // Get a preview of document content (first 100 characters)
  const getContentPreview = (content: string) => {
    const maxLength = 100;
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">No documents found</h3>
        <p className="text-muted-foreground">
          {isLoading
            ? "Loading documents..."
            : "Try adjusting your filters or add a new document to get started."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/bot-docs/new">Add Your First Document</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead
              onClick={() => handleSort("title")}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                Title <SortIndicator column="title" />
              </div>
            </TableHead>
            <TableHead
              onClick={() => handleSort("category")}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                Category <SortIndicator column="category" />
              </div>
            </TableHead>
            <TableHead>Content Preview</TableHead>
            <TableHead
              onClick={() => handleSort("createdAt")}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                Created <SortIndicator column="createdAt" />
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow
              key={doc.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <Link
                  href={`/bot-docs/${doc.id}`}
                  className="font-medium hover:underline flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {doc.title}
                </Link>
                {doc.fileName && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Filename: {doc.fileName}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  className={`${getCategoryColor(doc.category)} border-none font-normal`}
                >
                  {formatCategory(doc.category)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md">
                <div className="text-sm text-muted-foreground truncate">
                  {getContentPreview(doc.content)}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(doc.createdAt), "PPP")}
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
                      <Link href={`/bot-docs/${doc.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/bot-docs/${doc.id}/edit`}>
                        Edit Document
                      </Link>
                    </DropdownMenuItem>
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
