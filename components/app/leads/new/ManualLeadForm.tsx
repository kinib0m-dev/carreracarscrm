"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { leadStatusEnum, timeframeEnum } from "@/db/schema";
import { Loader2 } from "lucide-react";
import { useCreateLead } from "@/lib/leads/hooks/use-leads";
import {
  createLeadSchema,
  CreateLeadSchema,
} from "@/lib/leads/validation/leads-schema";

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTimeframe(timeframe: string) {
  return timeframe
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ManualLeadForm() {
  const router = useRouter();
  const { createLead, isLoading } = useCreateLead();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateLeadSchema>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: "nuevo",
      campaignId: undefined,
      lastContactedAt: undefined,
      nextFollowUpDate: undefined,
      expectedPurchaseTimeframe: undefined,
      budget: undefined,
    },
  });

  const onSubmit = async (data: CreateLeadSchema) => {
    try {
      setSubmitting(true);

      const formattedData = {
        ...data,
        expectedPurchaseTimeframe:
          data.expectedPurchaseTimeframe === undefined
            ? undefined
            : data.expectedPurchaseTimeframe,
      };

      await createLead(formattedData);
      router.push("/leads");
    } catch (error) {
      console.error("Error creating lead:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lead name" {...field} />
                    </FormControl>
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lead Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Lead Details</h3>

              {/* Status Field */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatusEnum.enumValues.map((status) => (
                          <SelectItem key={status} value={status}>
                            {formatStatus(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 10000" {...field} />
                    </FormControl>
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
                    <FormLabel>Expected Purchase Timeframe</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "unspecified"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unspecified">
                          Not specified
                        </SelectItem>
                        {timeframeEnum.enumValues.map((timeframe) => (
                          <SelectItem key={timeframe} value={timeframe}>
                            {formatTimeframe(timeframe)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={submitting || isLoading}>
              {submitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Create Lead"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
