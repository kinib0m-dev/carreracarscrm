"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Info, ChevronDown, Eye } from "lucide-react";
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
import { EmailTemplateGallery } from "@/components/app/emails/EmailTemplateGallery";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { EmailPreview } from "../EmailsPreview";
import { RichTextEditor } from "../RichTextEditor";
import { useCreateEmailTemplate } from "@/lib/email/hooks/use-emails";
import {
  createEmailTemplateSchema,
  CreateEmailTemplateSchema,
} from "@/lib/email/validation/emails-schema";

export function EmailTemplateForm() {
  const router = useRouter();
  const { createTemplate, isLoading } = useCreateEmailTemplate();
  const [submitting, setSubmitting] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("edit");
  const [customPreviewData, setCustomPreviewData] = useState({
    name: "John Doe",
    first_name: "John",
    email: "john.doe@example.com",
    lead_id: "12345",
  });

  const form = useForm<CreateEmailTemplateSchema>({
    resolver: zodResolver(createEmailTemplateSchema),
    defaultValues: {
      name: "",
      subject: "",
      content: "",
      targetStatuses: [],
      description: "",
    },
  });

  const onSubmit = async (data: CreateEmailTemplateSchema) => {
    try {
      setSubmitting(true);
      await createTemplate(data);
      router.push("/emails");
    } catch (error) {
      console.error("Error creating email template:", error);
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

  const handleApplyTemplate = (template: {
    subject: string;
    content: string;
  }) => {
    form.setValue("subject", template.subject, { shouldValidate: true });
    form.setValue("content", template.content, { shouldValidate: true });
    setActiveTab("edit");
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <CardTitle className="text-2xl font-bold">
              Create Email Template
            </CardTitle>
            <div className="flex items-center gap-4">
              <EmailTemplateGallery onSelectTemplate={handleApplyTemplate} />

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Mobile Preview
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                      <DrawerTitle>Mobile Preview</DrawerTitle>
                      <DrawerDescription>
                        See how your email will look on a mobile device
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6 pb-8">
                      <div
                        className="mx-auto border rounded-xl overflow-hidden shadow-lg"
                        style={{ maxWidth: "375px", height: "667px" }}
                      >
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex justify-between items-center border-b">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Mobile Preview
                          </div>
                          <div className="w-4" />
                        </div>
                        <div className="h-full overflow-auto bg-white dark:bg-gray-900">
                          <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              From: Your Company
                            </p>
                            <p className="text-sm mb-1">
                              To: {customPreviewData.email}
                            </p>
                            <p className="text-sm font-medium mb-3">
                              Subject:{" "}
                              {form.watch("subject")
                                ? form
                                    .watch("subject")
                                    .replace(
                                      /{{name}}/g,
                                      customPreviewData.name
                                    )
                                    .replace(
                                      /{{first_name}}/g,
                                      customPreviewData.first_name
                                    )
                                    .replace(
                                      /{{email}}/g,
                                      customPreviewData.email
                                    )
                                    .replace(
                                      /{{lead_id}}/g,
                                      customPreviewData.lead_id
                                    )
                                : "No subject"}
                            </p>
                            <div className="border-t pt-3">
                              <div
                                className="prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{
                                  __html: form.watch("content")
                                    ? form
                                        .watch("content")
                                        .replace(
                                          /{{name}}/g,
                                          customPreviewData.name
                                        )
                                        .replace(
                                          /{{first_name}}/g,
                                          customPreviewData.first_name
                                        )
                                        .replace(
                                          /{{email}}/g,
                                          customPreviewData.email
                                        )
                                        .replace(
                                          /{{lead_id}}/g,
                                          customPreviewData.lead_id
                                        )
                                    : "<p>No content</p>",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
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
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <FormLabel htmlFor="preview-name">
                            Full Name
                          </FormLabel>
                          <Input
                            id="preview-name"
                            value={customPreviewData.name}
                            onChange={(e) =>
                              setCustomPreviewData({
                                ...customPreviewData,
                                name: e.target.value,
                              })
                            }
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="preview-first-name">
                            First Name
                          </FormLabel>
                          <Input
                            id="preview-first-name"
                            value={customPreviewData.first_name}
                            onChange={(e) =>
                              setCustomPreviewData({
                                ...customPreviewData,
                                first_name: e.target.value,
                              })
                            }
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="preview-email">Email</FormLabel>
                          <Input
                            id="preview-email"
                            value={customPreviewData.email}
                            onChange={(e) =>
                              setCustomPreviewData({
                                ...customPreviewData,
                                email: e.target.value,
                              })
                            }
                            placeholder="john.doe@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="preview-lead-id">
                            Lead ID
                          </FormLabel>
                          <Input
                            id="preview-lead-id"
                            value={customPreviewData.lead_id}
                            onChange={(e) =>
                              setCustomPreviewData({
                                ...customPreviewData,
                                lead_id: e.target.value,
                              })
                            }
                            placeholder="12345"
                          />
                        </div>
                      </div>
                    </CardContent>
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

              <div className="flex justify-end pt-6 space-x-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/emails")}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="px-6"
                >
                  {submitting || isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Template...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Create Template
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
