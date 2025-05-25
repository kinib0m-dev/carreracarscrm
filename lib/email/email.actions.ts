import { Resend } from "resend";
import { toast } from "sonner";

const resend = new Resend(process.env.RESEND_API_KEY);

type LeadData = {
  id: string;
  email: string | null;
  name: string | null;
};

type TemplateData = {
  id: string;
  name: string;
  subject: string;
  content: string;
  description?: string | null;
};

type SendEmailParams = {
  userId: string;
  template: TemplateData;
  leadsData: LeadData[];
};

function replaceVariables(text: string, lead: LeadData): string {
  if (!text) return "";

  // Create a map of variables and their values with fallbacks
  const variables: Record<string, string> = {
    name: lead.name || "there",
    email: lead.email || "",
    lead_id: lead.id || "",
    first_name: lead.name ? lead.name.split(" ")[0] : "there",
  };

  // Replace all variables in the text
  let result = text;
  for (const [variable, value] of Object.entries(variables)) {
    // Use regular expression to find variables with optional whitespace inside braces
    const regex = new RegExp(`{{\\s*${variable}\\s*}}`, "g");
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Checks if HTML content already has a complete structure
 * with html, body tags, or if it's just a fragment
 */
function isCompleteHtmlDocument(content: string): boolean {
  return (
    /<html[^>]*>/.test(content.toLowerCase()) &&
    /<body[^>]*>/.test(content.toLowerCase())
  );
}

/**
 * Prepares email content for sending - either using it as-is
 * if it's complete HTML, or wrapping it in a basic structure
 * if it's just a fragment
 */
function prepareEmailContent(content: string): string {
  // If it's already a complete HTML document, use it as is
  if (isCompleteHtmlDocument(content)) {
    return content;
  }

  // If content doesn't have a wrapping div, add minimum formatting
  if (!content.trim().startsWith("<div")) {
    content = `<div>${content}</div>`;
  }

  // Only add basic email wrapper with minimal styling
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Email</title>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}

/**
 * Main function to send emails to leads with proper variable replacement
 */
export async function sendEmailToLeads({
  template,
  leadsData,
}: SendEmailParams): Promise<number> {
  // Filter out leads without email addresses
  const validLeads = leadsData.filter(
    (lead): lead is LeadData & { email: string } =>
      Boolean(lead.email && lead.email.trim())
  );

  if (validLeads.length === 0) {
    toast.error("No valid leads with email addresses found");
    return 0;
  }

  // Track successful sends
  let successCount = 0;

  // Process each lead individually
  for (const lead of validLeads) {
    try {
      // Replace variables in the template
      const personalizedSubject = replaceVariables(template.subject, lead);
      const personalizedContent = replaceVariables(template.content, lead);

      // Prepare the email content, respecting existing HTML structure
      const htmlContent = prepareEmailContent(personalizedContent);

      // Send the email
      const result = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: lead.email,
        subject: personalizedSubject,
        html: htmlContent,
      });

      if (result) {
        successCount++;
      }
    } catch (error) {
      console.error(`Error sending email to ${lead.email}:`, error);
    }
  }
  return successCount;
}
