"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  Mail,
  Calendar,
  Send,
  Info,
  User,
  Loader2,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCountTargetLeads,
  useDeleteEmailTemplate,
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

interface EmailTemplateDetailViewProps {
  template: EmailTemplate;
}

export function EmailTemplateDetailView({
  template,
}: EmailTemplateDetailViewProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sendToAllLeads, setSendToAllLeads] = useState(false);
  const { deleteTemplate, isLoading: isDeleting } = useDeleteEmailTemplate();
  const { sendEmails, isLoading: isSending } = useSendEmails();
  const { count: targetLeadCount, isLoading: isCountLoading } =
    useCountTargetLeads(template.id);

  // Format dates for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return format(new Date(date), "PPP");
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

  const handleDelete = async () => {
    try {
      await deleteTemplate(template.id);
      setIsDeleteDialogOpen(false);
      router.push("/emails");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleSendEmails = async () => {
    try {
      const result = await sendEmails({
        templateId: template.id,
        sendToAll: sendToAllLeads, // FIXED: Use the checkbox state instead of hardcoded true
      });
      setIsSendDialogOpen(false);
      setSendToAllLeads(false); // Reset for next time
      console.log(result);
      toast.success(`Email sent to ${result.sentCount} recipients`);
      router.refresh();
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Failed to send emails");
    }
  };

  // Preview of email content with variables replaced
  const getContentPreview = (content: string) => {
    return content
      .replace(/{{name}}/g, "John Doe")
      .replace(/{{first_name}}/g, "John")
      .replace(/{{email}}/g, "john.doe@example.com")
      .replace(/{{lead_id}}/g, "12345");
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/emails">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to email templates</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Email Template Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/emails/${template.id}/edit`}>
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
                <DialogTitle>Delete Email Template</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this email template? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-semibold">
                    This will permanently delete &quot;{template.name}&quot;
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
                  {isDeleting ? "Deleting..." : "Delete Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Template Overview Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>{template.name}</span>
          </CardTitle>
          {template.description && (
            <CardDescription>{template.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {formatDate(template.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Target Audience
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {template.targetStatuses.length > 0 ? (
                    template.targetStatuses.map((status) => (
                      <Badge key={status} className={getStatusColor(status)}>
                        {formatStatus(status)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">
                      No target statuses defined
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Target Leads
                </div>
                <div className="font-medium">
                  {isCountLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Counting leads...</span>
                    </div>
                  ) : targetLeadCount === 0 ? (
                    <span className="text-amber-600">
                      No matching leads with email addresses found
                    </span>
                  ) : (
                    <span>
                      {targetLeadCount} lead{targetLeadCount !== 1 ? "s" : ""}{" "}
                      will receive this email
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Content Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Email Content</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  Variables
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p className="font-semibold mb-1">
                  Variables used in this template:
                </p>
                <ul className="text-sm">
                  <li>
                    <code>{"{{name}}"}</code> - Full name of the lead
                  </li>
                  <li>
                    <code>{"{{first_name}}"}</code> - First name of the lead
                  </li>
                  <li>
                    <code>{"{{email}}"}</code> - Email address of the lead
                  </li>
                  <li>
                    <code>{"{{lead_id}}"}</code> - Unique ID of the lead
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Subject:</h3>
              <div className="p-3 bg-muted/30 rounded-md font-medium">
                {getContentPreview(template.subject)}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Content:</h3>
              <div
                className="prose max-w-none p-4 border rounded-md bg-muted/30"
                dangerouslySetInnerHTML={{
                  __html: getContentPreview(template.content),
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Email Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Send Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                This email will be sent to{" "}
                <strong>
                  {isCountLoading
                    ? "..."
                    : `${targetLeadCount} lead${targetLeadCount !== 1 ? "s" : ""}`}
                </strong>{" "}
                matching the target statuses.
              </div>
            </div>

            <Dialog
              open={isSendDialogOpen}
              onOpenChange={(open) => {
                setIsSendDialogOpen(open);
                if (!open) setSendToAllLeads(false); // Reset when closing
              }}
            >
              <DialogTrigger asChild>
                <Button
                  disabled={
                    (targetLeadCount === 0 && !sendToAllLeads) ||
                    isCountLoading ||
                    isSending
                  }
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Email Now
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Email Send</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to send this email to the selected
                    recipients?
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Template:</h4>
                    <p className="text-sm">{template.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Subject:</h4>
                    <p className="text-sm">{template.subject}</p>
                  </div>

                  {/* Add checkbox for sendToAll option */}
                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <Checkbox
                      id="sendToAllLeads"
                      checked={sendToAllLeads}
                      onCheckedChange={(checked) =>
                        setSendToAllLeads(checked === true)
                      }
                    />
                    <div>
                      <label
                        htmlFor="sendToAllLeads"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Send to all leads
                      </label>
                      <p className="text-xs text-muted-foreground">
                        When checked, emails will be sent to all leads
                        regardless of template status filters
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Recipients:</h4>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {targetLeadCount === 0 && !sendToAllLeads ? (
                          <span className="text-amber-600">
                            No matching leads with email addresses found
                          </span>
                        ) : (
                          <span>
                            This email will be sent to{" "}
                            <strong>
                              {sendToAllLeads ? "all" : targetLeadCount}
                            </strong>{" "}
                            lead
                            {sendToAllLeads || targetLeadCount !== 1 ? "s" : ""}
                            {sendToAllLeads && " (ignoring status filters)"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSendDialogOpen(false);
                      setSendToAllLeads(false);
                    }}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendEmails}
                    disabled={
                      isSending || (targetLeadCount === 0 && !sendToAllLeads)
                    }
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Now"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
