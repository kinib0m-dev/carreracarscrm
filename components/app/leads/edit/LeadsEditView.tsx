"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadStatusEnum, leadTypeEnum, timeframeEnum } from "@/db/schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Tag,
  Clock,
  Calendar,
  DollarSign,
  Info,
  Save,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadWithTagsAndCampaign } from "@/types/leads";
import { useUpdateLead } from "@/lib/leads/hooks/use-leads";
import {
  updateLeadSchema,
  UpdateLeadSchema,
} from "@/lib/leads/validation/leads-schema";

type LeadsEditViewProps = {
  lead: LeadWithTagsAndCampaign;
};

export function LeadsEditView({ lead }: LeadsEditViewProps) {
  const router = useRouter();
  const { updateLead, isLoading } = useUpdateLead();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Initialize form with lead data
  const form = useForm<UpdateLeadSchema>({
    resolver: zodResolver(updateLeadSchema),
    defaultValues: {
      id: lead.id,
      name: lead.name,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      type: lead.type || undefined,
      status: lead.status,
      expectedPurchaseTimeframe: lead.expectedPurchaseTimeframe || undefined,
      budget: lead.budget || undefined,
      lastContactedAt: lead.lastContactedAt || undefined,
      lastMessageAt: lead.lastMessageAt || undefined,
      nextFollowUpDate: lead.nextFollowUpDate || undefined,
    },
  });

  const onSubmit = async (data: UpdateLeadSchema) => {
    try {
      setSubmitting(true);

      const formattedData = {
        ...data,
        expectedPurchaseTimeframe:
          data.expectedPurchaseTimeframe === undefined
            ? undefined
            : data.expectedPurchaseTimeframe,
      };

      await updateLead(formattedData);
      toast.success("Lead updated successfully");
      router.push(`/leads/${lead.id}`);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    } finally {
      setSubmitting(false);
    }
  };

  function formatSelect(c: string) {
    return c.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // Get form status
  const isDirty = form.formState.isDirty;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Lead</h1>
            <p className="text-muted-foreground text-sm">
              Updating information for {lead.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={submitting || isLoading || !isDirty}
            onClick={() => form.reset()}
            className="gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            disabled={submitting || isLoading || !isDirty}
            onClick={form.handleSubmit(onSubmit)}
            className="gap-1"
          >
            {submitting || isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Edit Form Card */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{lead.name}</CardTitle>
                  <TabsList className="grid grid-cols-2 w-[300px]">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="details">Lead Details</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Complete the form below to update this lead&apos;s information
                </CardDescription>
              </CardHeader>

              <CardContent>
                <TabsContent value="basic" className="mt-0 space-y-5">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Name*
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter lead name"
                            {...field}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormDescription>
                          The full name of this lead or contact
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@example.com"
                            {...field}
                            value={field.value || ""}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormDescription>
                          Primary contact email for communications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone Field */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          Phone
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1 (555) 123-4567"
                            {...field}
                            value={field.value || ""}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormDescription>
                          Phone number with country code if applicable
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Type Field */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          Lead Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "unspecified"}
                        >
                          <FormControl>
                            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unspecified">
                              Not specified
                            </SelectItem>
                            {leadTypeEnum.enumValues.map((type) => (
                              <SelectItem key={type} value={type}>
                                {formatSelect(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Categorization of this lead
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="details" className="mt-0 space-y-5">
                  {/* Status Field */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadStatusEnum.enumValues.map((status) => (
                              <SelectItem key={status} value={status}>
                                {formatSelect(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Current stage in the sales pipeline
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Timeframe Field */}
                  <FormField
                    control={form.control}
                    name="expectedPurchaseTimeframe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Purchase Timeframe
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "unspecified"}
                        >
                          <FormControl>
                            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unspecified">
                              Not specified
                            </SelectItem>
                            {timeframeEnum.enumValues.map((timeframe) => (
                              <SelectItem key={timeframe} value={timeframe}>
                                {formatSelect(timeframe)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          When the lead expects to make a purchase
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Field */}
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Budget
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 10000"
                            {...field}
                            value={field.value || ""}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormDescription>
                          Approximate budget in your local currency
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Next Follow-up Date */}
                  <FormField
                    control={form.control}
                    name="nextFollowUpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Next Follow-up Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              field.value
                                ? new Date(field.value)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormDescription>
                          When to next contact this lead
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </CardContent>

              <CardFooter className="flex justify-end border-t pt-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting || isLoading}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || isLoading || !isDirty}
                    className="gap-2"
                  >
                    {submitting || isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
