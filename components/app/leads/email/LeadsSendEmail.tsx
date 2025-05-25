"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Mail,
  Send,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  useEmailTemplateList,
  useLeadEmailHistory,
  useSendEmails,
} from "@/lib/email/hooks/use-emails";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  description?: string;
  targetStatuses?: string[];
}

interface LeadSendEmailProps {
  leadId: string;
  leadName: string;
  leadEmail: string | null;
}

export function LeadSendEmail({
  leadId,
  leadName,
  leadEmail,
}: LeadSendEmailProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null
  );

  const { templates, isLoading: isLoadingTemplates } = useEmailTemplateList();
  const { sendEmails, isLoading: isSending } = useSendEmails();
  const { history, isLoading: isLoadingHistory } = useLeadEmailHistory(
    leadId,
    5
  );

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  const handleShowPreview = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    setPreviewTemplate(template as EmailTemplate);
  };

  const handleSendEmail = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select an email template");
      return;
    }

    try {
      await sendEmails({
        templateId: selectedTemplateId,
        sendToAll: false,
        specificLeadIds: [leadId],
      });

      setOpen(false);
      setSelectedTemplateId("");
      setPreviewTemplate(null);
      toast.success(`Email sent to ${leadName}`);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    }
  };

  if (!leadEmail) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Send Email</span>
            </CardTitle>
            <CardDescription>
              Send personalized emails using templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-medium mb-1">No Email Address</h3>
                <p className="text-muted-foreground max-w-md">
                  This lead doesn&apos;t have an email address. Add an email
                  address to enable sending emails.
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href={`/leads/${leadId}/edit`}>Add Email Address</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Send Email Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Send Email</span>
          </CardTitle>
          <CardDescription>
            Send personalized emails using templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{leadName}</p>
                <p className="text-sm text-muted-foreground">{leadEmail}</p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Send className="mr-2 h-4 w-4" />
                    Compose Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Send Email to {leadName}</DialogTitle>
                    <DialogDescription>
                      Choose an email template to send to {leadEmail}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    {isLoadingTemplates ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2">Loading templates...</span>
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="text-center p-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          No email templates found.
                        </p>
                        <Button variant="link" className="mt-2" asChild>
                          <a
                            href="/emails/new"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Create a template
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Select
                          value={selectedTemplateId}
                          onValueChange={(value) => {
                            setSelectedTemplateId(value);
                            handleShowPreview(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {previewTemplate && (
                          <div className="mt-4 border rounded-md p-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Email Preview</h4>
                              <Badge variant="outline">
                                {previewTemplate.name}
                              </Badge>
                            </div>
                            <Separator />
                            <div>
                              <p className="font-medium text-sm">
                                Subject: {previewTemplate.subject}
                              </p>
                            </div>
                            <div className="pt-2">
                              <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 text-sm bg-muted/30">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: previewTemplate.content.replace(
                                      /\n/g,
                                      "<br />"
                                    ),
                                  }}
                                />
                              </div>
                            </div>
                            <div className="pt-1 text-xs text-muted-foreground">
                              <p>
                                * Variables like <code>{"{{name}}"}</code> will
                                be replaced with the lead&apos;s information
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        setPreviewTemplate(null);
                        setSelectedTemplateId("");
                      }}
                      disabled={isSending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={
                        !selectedTemplateId || isSending || isLoadingTemplates
                      }
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email History Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Email History</CardTitle>
          <CardDescription>Recent emails sent to this lead</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No emails yet</h3>
              <p className="text-muted-foreground max-w-md">
                You haven&apos;t sent any emails to this lead yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border rounded-md p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {entry.templateName || "Email"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Subject: {entry.subject}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Sent
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(entry.sentAt)}</span>
                  </div>
                  <div className="text-right">
                    <Button variant="link" size="sm" asChild>
                      <Link href={`/emails/history/${entry.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
