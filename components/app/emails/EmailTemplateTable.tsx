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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Mail, MoreHorizontal, Send } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterEmailTemplateSchema } from "@/lib/email/validation/emails-schema";
import {
  useCountTargetLeads,
  useSendEmails,
} from "@/lib/email/hooks/use-emails";

type EmailTemplate = {
  id: string;
  userId: string;
  name: string;
  subject: string;
  content: string;
  description: string | null;
  targetStatuses: string[];
  createdAt: Date;
  updatedAt: Date;
};

interface EmailTemplateTableProps {
  templates: EmailTemplate[];
  isLoading: boolean;
  currentFilters: Partial<FilterEmailTemplateSchema>;
  updateFilters: (filters: Partial<FilterEmailTemplateSchema>) => void;
}

export function EmailTemplateTable({
  templates,
  isLoading,
  currentFilters,
  updateFilters,
}: EmailTemplateTableProps) {
  const [confirmSendTemplate, setConfirmSendTemplate] =
    useState<EmailTemplate | null>(null);
  const [sendToAllLeads, setSendToAllLeads] = useState(false);
  const { sendEmails, isLoading: isSending } = useSendEmails();

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new_lead":
        return "bg-blue-100 text-blue-800";
      case "initial_contact":
        return "bg-indigo-100 text-indigo-800";
      case "qualified":
        return "bg-purple-100 text-purple-800";
      case "high_interest":
        return "bg-violet-100 text-violet-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "proposal_sent":
        return "bg-amber-100 text-amber-800";
      case "periodic_nurture":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSort = (column: "name" | "createdAt") => {
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

  const handleSendEmails = async () => {
    if (!confirmSendTemplate) return;

    try {
      await sendEmails({
        templateId: confirmSendTemplate.id,
        sendToAll: sendToAllLeads,
      });
    } catch (error) {
      console.error("Failed to send emails:", error);
    } finally {
      setConfirmSendTemplate(null);
      setSendToAllLeads(false);
    }
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">No email templates found</h3>
        <p className="text-muted-foreground">
          {isLoading
            ? "Loading templates..."
            : "Try adjusting your filters or create a new template to get started."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/emails/new">Create Your First Template</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                onClick={() => handleSort("name")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Template <SortIndicator column="name" />
                </div>
              </TableHead>
              <TableHead>Target Segments</TableHead>
              <TableHead>Subject</TableHead>
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
            {templates.map((template) => (
              <TemplateRow
                key={template.id}
                template={template}
                onSendClick={setConfirmSendTemplate}
                getStatusColor={getStatusColor}
                formatStatus={formatStatus}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Send Dialog */}
      <Dialog
        open={!!confirmSendTemplate}
        onOpenChange={(open) => {
          if (!open && !isSending) {
            setConfirmSendTemplate(null);
            setSendToAllLeads(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Choose your email sending options below
            </DialogDescription>
          </DialogHeader>

          {confirmSendTemplate && (
            <div className="py-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Template:</h4>
                <p className="text-sm">{confirmSendTemplate.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Subject:</h4>
                <p className="text-sm">{confirmSendTemplate.subject}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Target segments:</h4>
                <div className="flex flex-wrap gap-2">
                  {confirmSendTemplate.targetStatuses.length > 0 ? (
                    confirmSendTemplate.targetStatuses.map((status) => (
                      <Badge key={status} className={getStatusColor(status)}>
                        {formatStatus(status)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No target segments defined
                    </span>
                  )}
                </div>
              </div>

              <TargetLeadsCount
                templateId={confirmSendTemplate.id}
                sendToAll={sendToAllLeads}
              />

              {/* Add checkbox for sendToAll option */}
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="sendToAllLeads"
                  checked={sendToAllLeads}
                  onCheckedChange={(checked) =>
                    setSendToAllLeads(checked === true)
                  }
                  disabled={isSending}
                />
                <div>
                  <label
                    htmlFor="sendToAllLeads"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Send to all leads
                  </label>
                  <p className="text-xs text-muted-foreground">
                    When checked, emails will be sent to all leads regardless of
                    template status filters
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!isSending) {
                  setConfirmSendTemplate(null);
                  setSendToAllLeads(false);
                }
              }}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button onClick={handleSendEmails} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Template Row Component
function TemplateRow({
  template,
  onSendClick,
  getStatusColor,
  formatStatus,
}: {
  template: EmailTemplate;
  onSendClick: (template: EmailTemplate) => void;
  getStatusColor: (status: string) => string;
  formatStatus: (status: string) => string;
}) {
  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell>
        <Link
          href={`/emails/${template.id}`}
          className="font-medium hover:underline"
        >
          {template.name}
        </Link>
        {template.description && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {template.description}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {template.targetStatuses.length > 0 ? (
            <>
              {template.targetStatuses.slice(0, 3).map((status) => (
                <Badge
                  key={status}
                  className={`text-xs ${getStatusColor(status)}`}
                  variant="outline"
                >
                  {formatStatus(status)}
                </Badge>
              ))}
              {template.targetStatuses.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.targetStatuses.length - 3}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              No segments defined
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="text-sm truncate" title={template.subject}>
          {template.subject}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(template.createdAt), "PPP")}
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
              <Link href={`/emails/${template.id}`}>View Template</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/emails/${template.id}/edit`}>Edit Template</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSendClick(template)}>
              <Send className="h-4 w-4 mr-2" />
              Send to Leads
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Component to show the count of leads that will receive the email
function TargetLeadsCount({
  templateId,
  sendToAll = false,
}: {
  templateId: string;
  sendToAll?: boolean;
}) {
  const { count, isLoading } = useCountTargetLeads(templateId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm">Counting target leads...</span>
      </div>
    );
  }

  return (
    <div className="py-2">
      <h4 className="text-sm font-medium mb-1">Recipients:</h4>
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {count === 0 && !sendToAll ? (
            <span className="text-amber-600">
              No matching leads with email addresses found
            </span>
          ) : (
            <span>
              This email will be sent to{" "}
              <strong>{sendToAll ? "all" : count}</strong> lead
              {sendToAll || count !== 1 ? "s" : ""}
              {sendToAll
                ? " (ignoring status filters)"
                : " matching the target segments"}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
