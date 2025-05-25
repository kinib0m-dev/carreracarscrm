"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

import {
  ArrowLeft,
  Mail,
  Users,
  Clock,
  Search,
  Filter,
  User,
  MessageSquare,
  ExternalLink,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EmailHistoryDetails = {
  id: string;
  templateId: string;
  subject: string;
  sentAt: Date;
  sentCount: number;
  templateName: string | null;
  templateContent: string | null;
};

type EmailRecipient = {
  leadId: string;
  sentAt: Date;
  status: string;
  leadName: string | null;
  leadEmail: string | null;
  leadStatus: string | null;
};

interface EmailHistoryDetailsViewProps {
  history: EmailHistoryDetails;
  recipients: EmailRecipient[];
}

export function EmailHistoryDetailsView({
  history,
  recipients,
}: EmailHistoryDetailsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Format dates for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "PPP");
  };

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "PPP p");
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new_lead":
      case "initial_contact":
        return "bg-blue-100 text-blue-800";
      case "awaiting_response":
      case "engaged":
      case "information_gathering":
        return "bg-emerald-100 text-emerald-800";
      case "high_interest":
      case "qualified":
      case "appointment_scheduled":
        return "bg-purple-100 text-purple-800";
      case "proposal_sent":
      case "negotiation":
        return "bg-amber-100 text-amber-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "future_opportunity":
      case "periodic_nurture":
      case "reactivated":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get delivery status badge color
  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Sent
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Delivered
          </Badge>
        );
      case "opened":
        return <Badge className="bg-green-100 text-green-800">Opened</Badge>;
      case "clicked":
        return <Badge className="bg-purple-100 text-purple-800">Clicked</Badge>;
      case "bounced":
        return <Badge variant="destructive">Bounced</Badge>;
      case "unsubscribed":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Unsubscribed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter recipients by search query
  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch =
      !searchQuery ||
      (recipient.leadName?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
      (recipient.leadEmail?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      );

    const matchesStatus =
      !statusFilter || recipient.leadStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });
  // Get unique lead statuses for filter dropdown
  const uniqueStatuses = Array.from(
    new Set(recipients.map((recipient) => recipient.leadStatus).filter(Boolean))
  ) as string[];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/emails/history">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to email history</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Email Campaign Details</h1>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/emails/${history.templateId}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Template
          </Link>
        </Button>
      </div>

      {/* Overview Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>{history.templateName}</span>
            <Badge variant="secondary">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {formatDateTime(history.sentAt)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Campaign sent on {formatDate(history.sentAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Subject</div>
                <div className="font-medium">{history.subject}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Recipients</div>
                <div className="font-medium">
                  {history.sentCount} lead{history.sentCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Template</div>
                <div className="font-medium">
                  <Link
                    href={`/emails/${history.templateId}`}
                    className="text-primary hover:underline"
                  >
                    {history.templateName || "Unnamed Template"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Subject:</h3>
              <div className="p-3 bg-muted/30 rounded-md font-medium">
                {history.subject}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Content:</h3>
              <div
                className="prose max-w-none p-4 border rounded-md bg-muted/30"
                dangerouslySetInnerHTML={{
                  __html: history.templateContent || "",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipients List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Recipients</CardTitle>
            <CardDescription>
              {recipients.length} lead{recipients.length !== 1 ? "s" : ""}{" "}
              received this email
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search recipients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setStatusFilter(null)}
                  className={!statusFilter ? "bg-muted" : ""}
                >
                  All statuses
                </DropdownMenuItem>
                {uniqueStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={statusFilter === status ? "bg-muted" : ""}
                  >
                    {formatStatus(status)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecipients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No matching recipients
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter(null);
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Lead Status</TableHead>
                    <TableHead>Delivery Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.map((recipient) => (
                    <TableRow key={recipient.leadId}>
                      <TableCell className="font-medium">
                        {recipient.leadName || "Unknown"}
                      </TableCell>
                      <TableCell>{recipient.leadEmail || "No email"}</TableCell>
                      <TableCell>
                        {recipient.leadStatus ? (
                          <Badge
                            className={getStatusColor(recipient.leadStatus)}
                          >
                            {formatStatus(recipient.leadStatus)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Status</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getDeliveryStatusBadge(recipient.status)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/leads/${recipient.leadId}`}>
                            <User className="h-4 w-4 mr-2" />
                            View Lead
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="text-sm text-muted-foreground">
            {filteredRecipients.length} of {recipients.length} recipients
          </div>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
