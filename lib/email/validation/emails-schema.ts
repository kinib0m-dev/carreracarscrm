import { z } from "zod";
import { leadStatusEnum } from "@/db/schema";

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, { message: "Template name is required" }),
  subject: z.string().min(1, { message: "Email subject is required" }),
  content: z.string().min(1, { message: "Email content is required" }),
  targetStatuses: z.array(z.enum(leadStatusEnum.enumValues)).min(1, {
    message: "At least one target lead status is required",
  }),
  description: z.string().optional(),
});

export type CreateEmailTemplateSchema = z.infer<
  typeof createEmailTemplateSchema
>;

export const updateEmailTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, { message: "Template name is required" }),
  subject: z.string().min(1, { message: "Email subject is required" }),
  content: z.string().min(1, { message: "Email content is required" }),
  targetStatuses: z.array(z.enum(leadStatusEnum.enumValues)).min(1, {
    message: "At least one target lead status is required",
  }),
  description: z.string().optional(),
});

export type UpdateEmailTemplateSchema = z.infer<
  typeof updateEmailTemplateSchema
>;

export const filterEmailTemplateSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["name", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type FilterEmailTemplateSchema = z.infer<
  typeof filterEmailTemplateSchema
>;

// Schema for sending emails
export const sendEmailSchema = z.object({
  templateId: z.string().uuid(),
  sendToAll: z.boolean().default(false),
  specificLeadIds: z.array(z.string().uuid()).optional(),
});

export type SendEmailSchema = z.infer<typeof sendEmailSchema>;

// Schema for tracking sent emails
export const emailHistorySchema = z.object({
  templateId: z.string().uuid(),
  leadIds: z.array(z.string().uuid()),
  sentAt: z.date(),
  sentCount: z.number().int(),
});

export type EmailHistorySchema = z.infer<typeof emailHistorySchema>;
