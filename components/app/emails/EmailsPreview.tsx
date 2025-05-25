import React from "react";
import { Card } from "@/components/ui/card";

interface EmailPreviewProps {
  subject: string;
  content: string;
  previewData?: {
    name?: string;
    first_name?: string;
    email?: string;
    lead_id?: string;
  };
}

export function EmailPreview({
  subject,
  content,
  previewData = {
    name: "John Doe",
    first_name: "John",
    email: "john.doe@example.com",
    lead_id: "12345",
  },
}: EmailPreviewProps) {
  // Replace template variables with preview data
  const getPreviewContent = (text: string): string => {
    if (!text) return "";

    return text
      .replace(/{{name}}/g, previewData.name || "")
      .replace(/{{first_name}}/g, previewData.first_name || "")
      .replace(/{{email}}/g, previewData.email || "")
      .replace(/{{lead_id}}/g, previewData.lead_id || "");
  };

  const previewSubject = getPreviewContent(subject);
  const previewBody = getPreviewContent(content);

  return (
    <div className="space-y-4">
      <Card className="rounded-md overflow-hidden shadow-md border">
        {/* Email Header */}
        <div className="bg-slate-200 dark:bg-slate-800 p-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
        </div>

        {/* Email Content */}
        <div className="bg-white dark:bg-slate-900 p-6">
          {/* Email Header */}
          <div className="border-b pb-4 mb-4">
            <div className="mb-2">
              <span className="text-sm text-muted-foreground">From: </span>
              <span className="font-medium">
                Your Company &lt;noreply@yourcompany.com&gt;
              </span>
            </div>
            <div className="mb-2">
              <span className="text-sm text-muted-foreground">To: </span>
              <span className="font-medium">
                {previewData.name} &lt;{previewData.email}&gt;
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Subject: </span>
              <span className="font-medium">
                {previewSubject || (
                  <span className="italic text-muted-foreground">
                    No subject
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Email Body */}
          <div className="prose dark:prose-invert max-w-none">
            {previewBody ? (
              <div dangerouslySetInnerHTML={{ __html: previewBody }} />
            ) : (
              <p className="text-muted-foreground italic">No content</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
