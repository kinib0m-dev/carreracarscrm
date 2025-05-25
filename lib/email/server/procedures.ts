import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import {
  emailTemplates,
  emailTemplateStatuses,
  emailHistory,
  emailHistoryLeads,
  leads,
} from "@/db/schema";
import {
  createEmailTemplateSchema,
  filterEmailTemplateSchema,
  updateEmailTemplateSchema,
  sendEmailSchema,
} from "@/lib/email/validation/emails-schema";
import { TRPCError } from "@trpc/server";
import { eq, and, or, ilike, sql, asc, desc, inArray } from "drizzle-orm";
import { sendEmailToLeads } from "../email.actions";

export const emailRouter = createTRPCRouter({
  // Create a new email template
  create: protectedProcedure
    .input(createEmailTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // 1. Insert the new template
        const [newTemplate] = await db
          .insert(emailTemplates)
          .values({
            userId,
            name: input.name,
            subject: input.subject,
            content: input.content,
            description: input.description,
          })
          .returning();

        // 2. Insert the target statuses
        const statusValues = input.targetStatuses.map((status) => ({
          templateId: newTemplate.id,
          status,
        }));

        await db.insert(emailTemplateStatuses).values(statusValues);

        return {
          success: true,
          template: {
            ...newTemplate,
            targetStatuses: input.targetStatuses,
          },
        };
      } catch (error) {
        console.error("Error creating email template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create email template",
        });
      }
    }),

  // Get an email template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Get the template
        const templateResult = await db
          .select()
          .from(emailTemplates)
          .where(
            and(
              eq(emailTemplates.id, input.id),
              eq(emailTemplates.userId, userId)
            )
          )
          .limit(1);

        const template = templateResult[0];

        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email template not found",
          });
        }

        // Get associated target statuses
        const statusesResult = await db
          .select({
            status: emailTemplateStatuses.status,
          })
          .from(emailTemplateStatuses)
          .where(eq(emailTemplateStatuses.templateId, template.id));

        const targetStatuses = statusesResult.map((row) => row.status);

        return {
          success: true,
          template: {
            ...template,
            targetStatuses,
          },
        };
      } catch (error) {
        console.error("Error fetching email template:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch email template",
        });
      }
    }),

  // Update an email template
  update: protectedProcedure
    .input(updateEmailTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { id, targetStatuses, ...updateData } = input;

        const existing = await db
          .select()
          .from(emailTemplates)
          .where(
            and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId))
          )
          .limit(1);

        if (!existing[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email template not found",
          });
        }

        // 1. Update template
        const [updatedTemplate] = await db
          .update(emailTemplates)
          .set({ ...updateData, updatedAt: new Date() })
          .where(
            and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId))
          )
          .returning();

        // 2. Delete previous statuses
        await db
          .delete(emailTemplateStatuses)
          .where(eq(emailTemplateStatuses.templateId, id));

        // 3. Insert new ones
        const statusValues = targetStatuses.map((status) => ({
          templateId: id,
          status,
        }));

        await db.insert(emailTemplateStatuses).values(statusValues);

        return {
          success: true,
          template: {
            ...updatedTemplate,
            targetStatuses,
          },
        };
      } catch (error) {
        console.error("Error updating email template:", error);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update email template",
        });
      }
    }),

  // Delete an email template
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Check if template exists and belongs to the user
        const existingTemplateResult = await db
          .select()
          .from(emailTemplates)
          .where(
            and(
              eq(emailTemplates.id, input.id),
              eq(emailTemplates.userId, userId)
            )
          )
          .limit(1);

        if (!existingTemplateResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email template not found",
          });
        }

        // Delete the template (cascades to target statuses)
        await db
          .delete(emailTemplates)
          .where(
            and(
              eq(emailTemplates.id, input.id),
              eq(emailTemplates.userId, userId)
            )
          );

        return {
          success: true,
          message: "Email template deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting email template:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete email template",
        });
      }
    }),

  // List email templates with filters, pagination, and sorting
  list: protectedProcedure
    .input(filterEmailTemplateSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { search, page, limit, sortBy, sortDirection } = input;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Start building the base query conditions
        let queryConditions = and(eq(emailTemplates.userId, userId));

        // Apply search filter if provided
        if (search) {
          const likePattern = `%${search}%`;
          queryConditions = and(
            queryConditions,
            or(
              ilike(emailTemplates.name, likePattern),
              ilike(emailTemplates.subject, likePattern),
              ilike(emailTemplates.description, likePattern)
            )
          );
        }

        // Count total matching templates (for pagination)
        const totalCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(emailTemplates)
          .where(queryConditions);

        const totalCount = Number(totalCountResult[0]?.count) || 0;

        // Apply sorting
        let orderByClause;
        switch (sortBy) {
          case "name":
            orderByClause =
              sortDirection === "asc"
                ? asc(emailTemplates.name)
                : desc(emailTemplates.name);
            break;
          case "createdAt":
          default:
            orderByClause =
              sortDirection === "asc"
                ? asc(emailTemplates.createdAt)
                : desc(emailTemplates.createdAt);
            break;
        }

        // Get the templates with sorting and pagination
        const templatesResult = await db
          .select()
          .from(emailTemplates)
          .where(queryConditions)
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset);

        // Get target statuses for all templates
        const templateIds = templatesResult.map((template) => template.id);

        // Create a map of template ID to target statuses
        const templateStatusesMap: Record<string, string[]> = {};

        if (templateIds.length > 0) {
          const statusesResult = await db
            .select({
              templateId: emailTemplateStatuses.templateId,
              status: emailTemplateStatuses.status,
            })
            .from(emailTemplateStatuses)
            .where(inArray(emailTemplateStatuses.templateId, templateIds));

          // Group statuses by template ID
          statusesResult.forEach((row) => {
            if (!templateStatusesMap[row.templateId]) {
              templateStatusesMap[row.templateId] = [];
            }
            templateStatusesMap[row.templateId].push(row.status);
          });
        }

        // Combine templates with their target statuses
        const templates = templatesResult.map((template) => ({
          ...template,
          targetStatuses: templateStatusesMap[template.id] || [],
        }));

        return {
          success: true,
          templates,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Error listing email templates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list email templates",
        });
      }
    }),

  // Count leads matching template target statuses
  countTargetLeads: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Get the template's target statuses
        const statusesResult = await db
          .select({
            status: emailTemplateStatuses.status,
          })
          .from(emailTemplateStatuses)
          .innerJoin(
            emailTemplates,
            eq(emailTemplateStatuses.templateId, emailTemplates.id)
          )
          .where(
            and(
              eq(emailTemplateStatuses.templateId, input.id),
              eq(emailTemplates.userId, userId)
            )
          );

        if (statusesResult.length === 0) {
          return {
            success: true,
            count: 0,
          };
        }

        const targetStatuses = statusesResult.map((row) => row.status);

        // Count matching leads
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(
            and(
              inArray(leads.status, targetStatuses),
              // Only include leads with email addresses
              sql`${leads.email} IS NOT NULL AND ${leads.email} != ''`
            )
          );

        return {
          success: true,
          count: Number(countResult[0]?.count) || 0,
          targetStatuses,
        };
      } catch (error) {
        console.error("Error counting target leads:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to count target leads",
        });
      }
    }),

  // Send emails to leads
  sendEmails: protectedProcedure
    .input(sendEmailSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { templateId, sendToAll, specificLeadIds } = input;

        // Get the template
        const templateResult = await db
          .select()
          .from(emailTemplates)
          .where(
            and(
              eq(emailTemplates.id, templateId),
              eq(emailTemplates.userId, userId)
            )
          )
          .limit(1);

        const template = templateResult[0];

        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email template not found",
          });
        }

        // Get template's target statuses
        const statusesResult = await db
          .select({
            status: emailTemplateStatuses.status,
          })
          .from(emailTemplateStatuses)
          .where(eq(emailTemplateStatuses.templateId, templateId));

        const targetStatuses = statusesResult.map((row) => row.status);

        // We will process leads differently depending on whether specific leads were selected
        let leadIds: string[] = [];
        let leadsData = [];

        if (specificLeadIds && specificLeadIds.length > 0) {
          // Case 1: User selected specific leads
          // Basic conditions that always apply
          const specificLeadsConditions = [
            inArray(leads.id, specificLeadIds),
            sql`${leads.email} IS NOT NULL AND ${leads.email} != ''`,
          ];

          // Apply status filtering only if:
          // 1. User is NOT sending to all leads, AND
          // 2. The template has target statuses defined
          if (!sendToAll && targetStatuses.length > 0) {
            specificLeadsConditions.push(inArray(leads.status, targetStatuses));
          }

          const specificLeadsResult = await db
            .select({
              id: leads.id,
              email: leads.email,
              name: leads.name,
            })
            .from(leads)
            .where(and(...specificLeadsConditions));

          leadIds = specificLeadsResult.map((lead) => lead.id);
          leadsData = specificLeadsResult;
        } else {
          // Case 2: Sending based on template's target statuses or to all leads
          // Basic conditions that always apply
          const conditions = [
            sql`${leads.email} IS NOT NULL AND ${leads.email} != ''`,
          ];

          // Apply status filtering only if:
          // 1. Not sending to all leads AND we have target statuses defined
          if (!sendToAll && targetStatuses.length > 0) {
            conditions.push(inArray(leads.status, targetStatuses));
          }

          // Execute the query with the final conditions
          const targetLeads = await db
            .select({
              id: leads.id,
              email: leads.email,
              name: leads.name,
            })
            .from(leads)
            .where(and(...conditions));

          leadIds = targetLeads.map((lead) => lead.id);
          leadsData = targetLeads;
        }

        if (leadIds.length === 0) {
          return {
            success: true,
            message: "No matching leads found with valid email addresses",
            sentCount: 0,
          };
        }

        const sentCount = await sendEmailToLeads({
          userId,
          template,
          leadsData,
        });

        const [emailHistoryEntry] = await db
          .insert(emailHistory)
          .values({
            userId,
            templateId,
            subject: template.subject,
            sentCount,
          })
          .returning();

        if (leadIds.length > 0) {
          await db.insert(emailHistoryLeads).values(
            leadIds.map((leadId) => ({
              historyId: emailHistoryEntry.id,
              leadId,
            }))
          );
        }

        return {
          success: true,
          sentCount,
          message: `Successfully sent ${sentCount} emails`,
        };
      } catch (error) {
        console.error("Error sending emails:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send emails: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  // Get email history
  getEmailHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { page, limit } = input;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Count total history entries
        const totalCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(emailHistory)
          .where(eq(emailHistory.userId, userId));

        const totalCount = Number(totalCountResult[0]?.count) || 0;

        // Get history entries with template info
        const historyResult = await db
          .select({
            id: emailHistory.id,
            templateId: emailHistory.templateId,
            subject: emailHistory.subject,
            sentAt: emailHistory.sentAt,
            sentCount: emailHistory.sentCount,
            templateName: emailTemplates.name,
          })
          .from(emailHistory)
          .leftJoin(
            emailTemplates,
            eq(emailHistory.templateId, emailTemplates.id)
          )
          .where(eq(emailHistory.userId, userId))
          .orderBy(desc(emailHistory.sentAt))
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          history: historyResult,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Error fetching email history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch email history",
        });
      }
    }),

  // Get email history details
  getEmailHistoryDetails: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Get the history entry
        const historyResult = await db
          .select({
            id: emailHistory.id,
            templateId: emailHistory.templateId,
            subject: emailHistory.subject,
            sentAt: emailHistory.sentAt,
            sentCount: emailHistory.sentCount,
            templateName: emailTemplates.name,
            templateContent: emailTemplates.content,
          })
          .from(emailHistory)
          .leftJoin(
            emailTemplates,
            eq(emailHistory.templateId, emailTemplates.id)
          )
          .where(
            and(eq(emailHistory.id, input.id), eq(emailHistory.userId, userId))
          )
          .limit(1);

        const history = historyResult[0];

        if (!history) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email history entry not found",
          });
        }

        // Get leads that received the email
        const recipientsResult = await db
          .select({
            leadId: emailHistoryLeads.leadId,
            sentAt: emailHistoryLeads.sentAt,
            status: emailHistoryLeads.status,
            leadName: leads.name,
            leadEmail: leads.email,
            leadStatus: leads.status,
          })
          .from(emailHistoryLeads)
          .leftJoin(leads, eq(emailHistoryLeads.leadId, leads.id))
          .where(eq(emailHistoryLeads.historyId, input.id))
          .orderBy(desc(emailHistoryLeads.sentAt));

        return {
          success: true,
          history,
          recipients: recipientsResult,
        };
      } catch (error) {
        console.error("Error fetching email history details:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch email history details",
        });
      }
    }),
  // Get email history for a specific lead
  getEmailHistoryByLeadId: protectedProcedure
    .input(
      z.object({
        leadId: z.string().uuid(),
        limit: z.number().int().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { leadId, limit } = input;

        // Find email history entries that include this lead
        const historyResults = await db
          .select({
            id: emailHistory.id,
            templateId: emailHistory.templateId,
            subject: emailHistory.subject,
            sentAt: emailHistory.sentAt,
            sentCount: emailHistory.sentCount,
            templateName: emailTemplates.name,
          })
          .from(emailHistoryLeads)
          .innerJoin(
            emailHistory,
            eq(emailHistoryLeads.historyId, emailHistory.id)
          )
          .leftJoin(
            emailTemplates,
            eq(emailHistory.templateId, emailTemplates.id)
          )
          .where(
            and(
              eq(emailHistoryLeads.leadId, leadId),
              eq(emailHistory.userId, userId)
            )
          )
          .orderBy(desc(emailHistory.sentAt))
          .limit(limit);

        return {
          success: true,
          history: historyResults,
        };
      } catch (error) {
        console.error("Error fetching lead email history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lead email history",
        });
      }
    }),
});
