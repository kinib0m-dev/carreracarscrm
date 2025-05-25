"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MailOpen, Calendar, Users, ExternalLink, Search } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEmailHistory } from "@/lib/email/hooks/use-emails";
import { Pagination } from "../../Pagination";

type EmailHistoryEntry = {
  id: string;
  templateId: string;
  subject: string;
  sentAt: Date;
  sentCount: number;
  templateName: string | null;
};

type EmailHistoryViewProps = {
  history: EmailHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

export function EmailHistoryView({
  history: initialHistory,
  pagination: initialPagination,
}: EmailHistoryViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Use the custom hook for email history with pagination
  const { history, pagination, isLoading } = useEmailHistory(currentPage, 10);

  // Use the real data from the hook if available, otherwise use the initial data
  const displayHistory = isLoading ? initialHistory : history;
  const displayPagination = isLoading ? initialPagination : pagination;

  // Filter history by search query (client-side filtering)
  const filteredHistory = searchQuery
    ? displayHistory.filter(
        (entry) =>
          entry.templateName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          entry.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayHistory;

  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > displayPagination.totalPages) return;
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Email History</h1>
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-8"
          />
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Campaigns</CardTitle>
          <CardDescription>
            View details of all emails sent to leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <MailOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No email history found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No results match your search query. Try a different term."
                  : "You haven't sent any emails yet. Create a template and send emails to see history here."}
              </p>
              {searchQuery ? (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              ) : (
                <Button asChild className="mt-4">
                  <Link href="/emails/new">Create Template</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/emails/${entry.templateId}`}
                            className="hover:underline text-primary"
                          >
                            {entry.templateName || "Unnamed Template"}
                          </Link>
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate"
                          title={entry.subject}
                        >
                          {entry.subject}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {format(new Date(entry.sentAt), "PPP p")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Users className="h-3 w-3" />
                            {entry.sentCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/emails/history/${entry.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!searchQuery && (
                <Pagination
                  pagination={displayPagination}
                  goToPage={goToPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
