"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Info, Send, ChevronDown } from "lucide-react";
import { leadStatusEnum } from "@/db/schema";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailPreview } from "../EmailsPreview";
import { RichTextEditor } from "../RichTextEditor";
import { useUpdateEmailTemplate } from "@/lib/email/hooks/use-emails";
import {
  updateEmailTemplateSchema,
  UpdateEmailTemplateSchema,
} from "@/lib/email/validation/emails-schema";

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

interface EmailTemplateEditViewProps {
  template: EmailTemplate;
}

export function EmailTemplateEditView({
  template,
}: EmailTemplateEditViewProps) {
  const router = useRouter();
  const { updateTemplate, isLoading } = useUpdateEmailTemplate();
  const [submitting, setSubmitting] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    template.targetStatuses
  );
  const [activeTab, setActiveTab] = useState("edit");

  const customPreviewData = {
    name: "John Doe",
    first_name: "John",
    email: "john.doe@example.com",
    lead_id: "12345",
  };

  const form = useForm<UpdateEmailTemplateSchema>({
    resolver: zodResolver(updateEmailTemplateSchema),
    defaultValues: {
      id: template.id,
      name: template.name,
      subject: template.subject,
      content: template.content,
      targetStatuses:
        template.targetStatuses as typeof leadStatusEnum.enumValues,
      description: template.description || undefined,
    },
  });

  const onSubmit = async (data: UpdateEmailTemplateSchema) => {
    try {
      setSubmitting(true);
      await updateTemplate(data);
      router.push(`/emails/${template.id}`);
    } catch (error) {
      console.error("Error updating email template:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Update selected statuses in the form when they change
  const handleStatusSelect = (selectedStatus: string) => {
    const updatedStatuses = selectedStatuses.includes(selectedStatus)
      ? selectedStatuses.filter((status) => status !== selectedStatus)
      : [...selectedStatuses, selectedStatus];

    setSelectedStatuses(updatedStatuses);

    // Cast the string array to the enum array type that the form expects
    form.setValue(
      "targetStatuses",
      updatedStatuses as typeof leadStatusEnum.enumValues,
      { shouldValidate: true }
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/emails/${template.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to template details</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Email Template</h1>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          <CardDescription>
            Update your email template details and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Template Information */}
                <div className="space-y-8">
                  {/* Template Information */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium">
                        Template Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Template Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter template name"
                                className="mt-1.5"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Template Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Optional description of this template"
                                className="mt-1.5"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription className="mt-1.5">
                              Add a short description to help identify this
                              template
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Target Statuses */}
                      <FormField
                        control={form.control}
                        name="targetStatuses"
                        render={() => (
                          <FormItem className="space-y-3">
                            <FormLabel>Target Lead Statuses*</FormLabel>
                            <FormDescription>
                              Select which lead statuses this email template
                              will target
                            </FormDescription>
                            <div className="relative">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-between",
                                        !selectedStatuses.length &&
                                          "text-muted-foreground"
                                      )}
                                    >
                                      {selectedStatuses.length > 0 ? (
                                        <>
                                          {selectedStatuses.length} status
                                          {selectedStatuses.length !== 1
                                            ? "es"
                                            : ""}{" "}
                                          selected
                                        </>
                                      ) : (
                                        "Select statuses"
                                      )}
                                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-full p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput placeholder="Search statuses..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        No statuses found.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {leadStatusEnum.enumValues.map(
                                          (status) => {
                                            const isSelected =
                                              selectedStatuses.includes(status);
                                            return (
                                              <CommandItem
                                                key={status}
                                                value={status}
                                                onSelect={() =>
                                                  handleStatusSelect(status)
                                                }
                                              >
                                                <div
                                                  className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    isSelected
                                                      ? "bg-primary text-primary-foreground"
                                                      : "opacity-50 [&_svg]:invisible"
                                                  )}
                                                >
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    width="16"
                                                    height="16"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className={cn(
                                                      isSelected
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                    )}
                                                  >
                                                    <polyline points="20 6 9 17 4 12" />
                                                  </svg>
                                                </div>
                                                <span>
                                                  {formatStatus(status)}
                                                </span>
                                              </CommandItem>
                                            );
                                          }
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            {selectedStatuses.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {selectedStatuses.map((status) => (
                                  <Badge key={status} variant="secondary">
                                    {formatStatus(status)}
                                    <button
                                      type="button"
                                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                      onClick={() => handleStatusSelect(status)}
                                    >
                                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                      <span className="sr-only">
                                        Remove {formatStatus(status)}
                                      </span>
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Preview Settings */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-medium">
                          Preview Settings
                        </CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Info className="h-4 w-4 mr-2" />
                                Available Variables
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md p-4">
                              <p className="font-semibold mb-2">
                                You can use these variables in your template:
                              </p>
                              <ul className="text-sm space-y-1.5">
                                <li>
                                  <code className="px-1 py-0.5 rounded">
                                    {"{{name}}"}
                                  </code>{" "}
                                  - Full name of the lead
                                </li>
                                <li>
                                  <code className="px-1 py-0.5 rounded">
                                    {"{{first_name}}"}
                                  </code>{" "}
                                  - First name of the lead
                                </li>
                                <li>
                                  <code className="px-1 py-0.5 rounded">
                                    {"{{email}}"}
                                  </code>{" "}
                                  - Email address of the lead
                                </li>
                                <li>
                                  <code className="px-1 py-0.5 rounded">
                                    {"{{lead_id}}"}
                                  </code>{" "}
                                  - Unique ID of the lead
                                </li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                  </Card>
                </div>

                {/* Right Column - Email Content */}
                <div className="space-y-8">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium">
                        Email Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Email Subject */}
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Subject*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter email subject"
                                className="mt-1.5"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Tabs
                        defaultValue="edit"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                      >
                        <TabsList className="grid grid-cols-2 mb-6">
                          <TabsTrigger value="edit">Edit</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="space-y-4 mt-0">
                          {/* Email Content */}
                          <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Content*</FormLabel>
                                <FormControl>
                                  <RichTextEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Enter email content here..."
                                    className="min-h-[500px] mt-1.5"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>

                        <TabsContent value="preview" className="mt-0">
                          <div className="border rounded-md p-6 min-h-[500px]">
                            <EmailPreview
                              subject={form.watch("subject")}
                              content={form.watch("content")}
                              previewData={customPreviewData}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end pt-4 space-x-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/emails")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || isLoading}>
                  {submitting || isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Template...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Update Template
                    </>
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

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
