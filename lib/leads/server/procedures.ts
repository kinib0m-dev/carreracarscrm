import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import {
  campaigns,
  leadNotes,
  leads,
  leadTags,
  leadTasks,
  tags,
  leadPreferences,
} from "@/db/schema";
import { TRPCError } from "@trpc/server";
import {
  eq,
  and,
  or,
  ilike,
  sql,
  asc,
  desc,
  inArray,
  not,
  exists,
} from "drizzle-orm";
import {
  createLeadSchema,
  filterLeadSchema,
  updateLeadSchema,
} from "@/lib/leads/validation/leads-schema";
import { sendManagerEscalationEmail } from "@/lib/utils/manager-emails";

export const leadRouter = createTRPCRouter({
  // Create a new lead
  create: protectedProcedure
    .input(createLeadSchema)
    .mutation(async ({ input }) => {
      try {
        // Check if a lead with the same email already exists (if email provided)
        if (input.email) {
          const existingByEmail = await db
            .select()
            .from(leads)
            .where(and(eq(leads.email, input.email)))
            .limit(1);

          if (existingByEmail.length > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A lead with this email already exists",
            });
          }
        }

        // Check if a lead with the same phone already exists (if phone provided)
        if (input.phone) {
          const existingByPhone = await db
            .select()
            .from(leads)
            .where(and(eq(leads.phone, input.phone)))
            .limit(1);

          if (existingByPhone.length > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A lead with this phone number already exists",
            });
          }
        }

        // If phone number is provided, use the WhatsApp-enabled creation
        if (input.phone) {
          const { createLeadWithWhatsApp } = await import(
            "@/lib/whatsapp/lead-creation"
          );

          const newLead = await createLeadWithWhatsApp({
            name: input.name,
            phone: input.phone,
            email: input.email || undefined,
            campaignId: input.campaignId || undefined,
          });

          return {
            success: true,
            lead: newLead,
          };
        } else {
          // Regular lead creation without WhatsApp (no phone number)
          const [newLead] = await db.insert(leads).values(input).returning();

          return {
            success: true,
            lead: newLead,
          };
        }
      } catch (error) {
        console.error("Error creating lead:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle database-level unique violations
        if (
          error instanceof Error &&
          error.message.includes("unique constraint")
        ) {
          if (error.message.toLowerCase().includes("email")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A lead with this email already exists",
            });
          } else if (error.message.toLowerCase().includes("phone")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A lead with this phone number already exists",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create lead",
        });
      }
    }),
  // Get a lead by ID with preferences
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        // Get the lead with campaign name
        const leadResult = await db
          .select({
            id: leads.id,
            name: leads.name,
            email: leads.email,
            phone: leads.phone,
            type: leads.type,
            status: leads.status,
            expectedPurchaseTimeframe: leads.expectedPurchaseTimeframe,
            budget: leads.budget,
            campaignId: leads.campaignId,
            campaignName: campaigns.name,
            lastContactedAt: leads.lastContactedAt,
            lastMessageAt: leads.lastMessageAt,
            nextFollowUpDate: leads.nextFollowUpDate,
            followUpCount: leads.followUpCount,
            createdAt: leads.createdAt,
            updatedAt: leads.updatedAt,
          })
          .from(leads)
          .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
          .where(eq(leads.id, input.id))
          .limit(1);

        const lead = leadResult[0];

        if (!lead) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        // Get associated tags in a separate query
        const leadTagsList = await db
          .select({
            tag: tags,
          })
          .from(leadTags)
          .innerJoin(tags, eq(leadTags.tagId, tags.id))
          .where(eq(leadTags.leadId, input.id));

        // Get lead preferences
        const preferencesResult = await db
          .select()
          .from(leadPreferences)
          .where(eq(leadPreferences.leadId, input.id))
          .limit(1);

        const preferences = preferencesResult[0] || null;

        // Format the lead with tags and preferences
        const leadWithTagsAndPreferences = {
          ...lead,
          tags: leadTagsList.map((item) => item.tag),
          preferences,
        };

        return {
          success: true,
          lead: leadWithTagsAndPreferences,
        };
      } catch (error) {
        console.error("Error fetching lead:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lead",
        });
      }
    }),
  // Update lead procedure
  update: protectedProcedure
    .input(updateLeadSchema)
    .mutation(async ({ input }) => {
      try {
        // First, check if the lead exists and get current status
        const existingLead = await db
          .select({
            id: leads.id,
            status: leads.status,
            name: leads.name,
            phone: leads.phone,
            email: leads.email,
          })
          .from(leads)
          .where(eq(leads.id, input.id))
          .limit(1);

        if (existingLead.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        const currentLead = existingLead[0];
        const previousStatus = currentLead.status;

        // Check for unique constraints (email and phone) if they are being updated
        if (input.email) {
          const existingEmail = await db
            .select({ id: leads.id })
            .from(leads)
            .where(
              and(
                eq(leads.email, input.email),
                not(eq(leads.id, input.id)) // Exclude the current lead
              )
            )
            .limit(1);

          if (existingEmail.length > 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email already in use by another lead",
            });
          }
        }

        if (input.phone) {
          const existingPhone = await db
            .select({ id: leads.id })
            .from(leads)
            .where(
              and(
                eq(leads.phone, input.phone),
                not(eq(leads.id, input.id)) // Exclude the current lead
              )
            )
            .limit(1);

          if (existingPhone.length > 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Phone number already in use by another lead",
            });
          }
        }

        // Proper typing for the updated data
        type LeadUpdateData = Omit<
          typeof leads.$inferInsert,
          "id" | "createdAt" | "campaignId"
        >;

        // Create a properly typed update object
        const updateData: Partial<LeadUpdateData> = {
          name: input.name,
          email: input.email,
          phone: input.phone,
          type: input.type,
          status: input.status,
          expectedPurchaseTimeframe: input.expectedPurchaseTimeframe,
          budget: input.budget,
          lastContactedAt: input.lastContactedAt,
          lastMessageAt: input.lastMessageAt,
          nextFollowUpDate: input.nextFollowUpDate,
          updatedAt: new Date(),
        };

        // Remove the id from the update data
        const { id } = input;

        // Update the lead
        await db.update(leads).set(updateData).where(eq(leads.id, id));

        // Check if lead was escalated to manager status and send email notification
        if (input.status === "manager" && previousStatus !== "manager") {
          console.log(
            `🚀 Lead ${currentLead.name} manually escalated to manager status - sending email notification`
          );

          // Send manager escalation email in the background (don't wait for it)
          sendManagerEscalationEmail(
            id, // Pass the lead ID, not the name
            input.name, // Lead name
            input.phone || currentLead.phone || "No phone provided", // Ensure string
            input.email || currentLead.email // Email can be null
          ).catch((emailError) => {
            console.error(
              "Error sending manager escalation email:",
              emailError
            );
          });
        }

        // Get the updated lead with the same format as getById
        const updatedLeadResult = await db
          .select({
            id: leads.id,
            name: leads.name,
            email: leads.email,
            phone: leads.phone,
            type: leads.type,
            status: leads.status,
            expectedPurchaseTimeframe: leads.expectedPurchaseTimeframe,
            budget: leads.budget,
            campaignName: campaigns.name,
            lastContactedAt: leads.lastContactedAt,
            lastMessageAt: leads.lastMessageAt,
            nextFollowUpDate: leads.nextFollowUpDate,
            followUpCount: leads.followUpCount,
            createdAt: leads.createdAt,
            updatedAt: leads.updatedAt,
          })
          .from(leads)
          .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
          .where(eq(leads.id, id))
          .limit(1);

        const updatedLead = updatedLeadResult[0];

        // Get associated tags
        const leadTagsList = await db
          .select({
            tag: tags,
          })
          .from(leadTags)
          .innerJoin(tags, eq(leadTags.tagId, tags.id))
          .where(eq(leadTags.leadId, id));

        // Get lead preferences
        const preferencesResult = await db
          .select()
          .from(leadPreferences)
          .where(eq(leadPreferences.leadId, id))
          .limit(1);

        const preferences = preferencesResult[0] || null;

        // Format the lead with tags and preferences
        const leadWithTagsAndPreferences = {
          ...updatedLead,
          tags: leadTagsList.map((item) => item.tag),
          preferences,
        };

        return {
          success: true,
          lead: leadWithTagsAndPreferences,
        };
      } catch (error) {
        console.error("Error updating lead:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update lead",
        });
      }
    }),
  // Delete lead procedure
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        // First, check if the lead exists
        const existingLead = await db
          .select({ id: leads.id })
          .from(leads)
          .where(eq(leads.id, input.id))
          .limit(1);

        if (existingLead.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }
        // 1. Delete lead preferences
        await db
          .delete(leadPreferences)
          .where(eq(leadPreferences.leadId, input.id));

        // 2. Delete lead tags
        await db.delete(leadTags).where(eq(leadTags.leadId, input.id));

        // 3. Delete lead notes
        await db.delete(leadNotes).where(eq(leadNotes.leadId, input.id));

        // 4. Delete lead tasks
        await db.delete(leadTasks).where(eq(leadTasks.leadId, input.id));

        // 5. Finally, delete the lead itself
        await db.delete(leads).where(eq(leads.id, input.id));

        return {
          success: true,
          message: "Lead deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting lead:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete lead",
        });
      }
    }),
  // List leads with filters, pagination, and sorting
  list: protectedProcedure.input(filterLeadSchema).query(async ({ input }) => {
    try {
      const {
        status,
        search,
        expectedPurchaseTimeframe,
        page,
        limit,
        sortBy,
        sortDirection,
      } = input;

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Start building the base query conditions array
      const conditions = [];

      // Apply filters
      if (status) {
        conditions.push(eq(leads.status, status));
      }

      if (expectedPurchaseTimeframe) {
        conditions.push(
          eq(leads.expectedPurchaseTimeframe, expectedPurchaseTimeframe)
        );
      }

      // Apply search filter if provided
      if (search && search.trim()) {
        const likePattern = `%${search.trim()}%`;

        // Create a subquery to handle campaign name search
        const campaignNameSearchCondition = exists(
          db
            .select({ one: sql`1` })
            .from(campaigns)
            .where(
              and(
                eq(campaigns.id, leads.campaignId),
                ilike(campaigns.name, likePattern)
              )
            )
        );

        conditions.push(
          or(
            ilike(leads.name, likePattern),
            ilike(leads.email || "", likePattern),
            ilike(leads.phone || "", likePattern),
            campaignNameSearchCondition
          )
        );
      }

      // Combine all conditions
      const queryConditions =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Count total matching leads (for pagination)
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(queryConditions);

      const totalCount = Number(totalCountResult[0]?.count) || 0;

      // Apply sorting
      let orderByClause;
      switch (sortBy) {
        case "name":
          orderByClause =
            sortDirection === "asc" ? asc(leads.name) : desc(leads.name);
          break;
        case "status":
          orderByClause =
            sortDirection === "asc" ? asc(leads.status) : desc(leads.status);
          break;
        case "createdAt":
        default:
          orderByClause =
            sortDirection === "asc"
              ? asc(leads.createdAt)
              : desc(leads.createdAt);
          break;
      }

      // Get the leads with sorting and pagination
      const leadsList = await db
        .select({
          id: leads.id,
          name: leads.name,
          email: leads.email,
          phone: leads.phone,
          type: leads.type,
          status: leads.status,
          expectedPurchaseTimeframe: leads.expectedPurchaseTimeframe,
          budget: leads.budget,
          campaignId: leads.campaignId,
          campaignName: campaigns.name,
          lastContactedAt: leads.lastContactedAt,
          lastMessageAt: leads.lastMessageAt,
          nextFollowUpDate: leads.nextFollowUpDate,
          followUpCount: leads.followUpCount,
          createdAt: leads.createdAt,
          updatedAt: leads.updatedAt,
        })
        .from(leads)
        .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
        .where(queryConditions)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      // Fetch tags for all retrieved leads if there are any leads
      const leadIds = leadsList.map((lead) => lead.id);

      // Type for tags
      type TagType = {
        id: string;
        name: string;
        color: string;
        description: string | null;
        createdAt: Date;
      };

      // Map to store tags by lead ID
      const leadTagsMap: Record<string, TagType[]> = {};

      if (leadIds.length > 0) {
        const leadTagsJoin = await db
          .select({
            leadId: leadTags.leadId,
            tagId: tags.id,
            tagName: tags.name,
            tagColor: tags.color,
            tagDescription: tags.description,
            tagCreatedAt: tags.createdAt,
          })
          .from(leadTags)
          .innerJoin(tags, eq(leadTags.tagId, tags.id))
          .where(inArray(leadTags.leadId, leadIds));

        // Parse the results and organize by lead ID
        for (const row of leadTagsJoin) {
          const leadId = row.leadId;

          if (!leadTagsMap[leadId]) {
            leadTagsMap[leadId] = [];
          }

          // Create a tag object from the row
          const tag: TagType = {
            id: row.tagId,
            name: row.tagName,
            color: row.tagColor as string,
            description: row.tagDescription,
            createdAt: row.tagCreatedAt,
          };

          leadTagsMap[leadId].push(tag);
        }
      }

      // Combine leads with their tags
      const leadsWithTags = leadsList.map((lead) => ({
        ...lead,
        tags: leadTagsMap[lead.id] || [],
      }));

      return {
        success: true,
        leads: leadsWithTags,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error("Error listing leads:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list leads",
      });
    }
  }),
});
