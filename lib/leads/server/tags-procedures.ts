import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { tags, leadTags } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, sql, asc, desc, or, ilike } from "drizzle-orm";
import {
  attachTagSchema,
  createTagSchema,
  detachTagSchema,
  updateTagSchema,
} from "../validation/lead-tags-schema";

export const leadTagsRouter = createTRPCRouter({
  // Create a new tag
  create: protectedProcedure
    .input(createTagSchema)
    .mutation(async ({ input }) => {
      try {
        // Check if a tag with the same name already exists
        const existingTag = await db
          .select()
          .from(tags)
          .where(eq(tags.name, input.name))
          .limit(1);

        if (existingTag.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A tag with this name already exists",
          });
        }

        // Insert the new tag
        const [newTag] = await db
          .insert(tags)
          .values({
            name: input.name,
            color: input.color,
            description: input.description,
          })
          .returning();

        return {
          success: true,
          tag: newTag,
        };
      } catch (error) {
        console.error("Error creating tag:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create tag",
        });
      }
    }),

  // Get a tag by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const tagResult = await db
          .select()
          .from(tags)
          .where(eq(tags.id, input.id))
          .limit(1);

        const tag = tagResult[0];

        if (!tag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        return {
          success: true,
          tag,
        };
      } catch (error) {
        console.error("Error fetching tag:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tag",
        });
      }
    }),

  // Update a tag
  update: protectedProcedure
    .input(updateTagSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        // Check if tag exists
        const existingTagResult = await db
          .select()
          .from(tags)
          .where(eq(tags.id, id))
          .limit(1);

        if (!existingTagResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        // Check for name uniqueness if name is being updated
        if (updateData.name && updateData.name !== existingTagResult[0].name) {
          const nameCheck = await db
            .select()
            .from(tags)
            .where(
              and(eq(tags.name, updateData.name), sql`${tags.id} != ${id}`)
            )
            .limit(1);

          if (nameCheck.length > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A tag with this name already exists",
            });
          }
        }

        // Update the tag
        const [updatedTag] = await db
          .update(tags)
          .set(updateData)
          .where(eq(tags.id, id))
          .returning();

        return {
          success: true,
          tag: updatedTag,
        };
      } catch (error) {
        console.error("Error updating tag:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tag",
        });
      }
    }),

  // Delete a tag
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        // Check if tag exists
        const existingTagResult = await db
          .select()
          .from(tags)
          .where(eq(tags.id, input.id))
          .limit(1);

        if (!existingTagResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        // Delete the tag - this will cascade to the junction table
        await db.delete(tags).where(eq(tags.id, input.id));

        return {
          success: true,
          message: "Tag deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting tag:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete tag",
        });
      }
    }),

  // Attach a tag to a lead
  attachTagToLead: protectedProcedure
    .input(attachTagSchema)
    .mutation(async ({ input }) => {
      try {
        const { leadId, tagId } = input;

        // Check if the tag attachment already exists
        const existingAttachment = await db
          .select()
          .from(leadTags)
          .where(and(eq(leadTags.leadId, leadId), eq(leadTags.tagId, tagId)))
          .limit(1);

        if (existingAttachment.length > 0) {
          // Tag is already attached, no need to insert
          return {
            success: true,
            message: "Tag is already attached to this lead",
          };
        }

        // Insert the tag attachment
        await db.insert(leadTags).values({
          leadId,
          tagId,
        });

        return {
          success: true,
          message: "Tag attached to lead successfully",
        };
      } catch (error) {
        console.error("Error attaching tag to lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to attach tag to lead",
        });
      }
    }),

  // Detach a tag from a lead
  detachTagFromLead: protectedProcedure
    .input(detachTagSchema)
    .mutation(async ({ input }) => {
      try {
        const { leadId, tagId } = input;

        // Delete the tag assignment
        await db
          .delete(leadTags)
          .where(and(eq(leadTags.leadId, leadId), eq(leadTags.tagId, tagId)));

        return {
          success: true,
          message: "Tag detachd from lead successfully",
        };
      } catch (error) {
        console.error("Error removing tag from lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to detach tag from lead",
        });
      }
    }),

  // Get tags for a specific lead
  getTagsByLeadId: protectedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const { leadId } = input;

        // Get tags for the lead
        const tagResults = await db
          .select({
            tag: tags,
          })
          .from(leadTags)
          .innerJoin(tags, eq(leadTags.tagId, tags.id))
          .where(eq(leadTags.leadId, leadId));

        return {
          success: true,
          tags: tagResults.map((result) => result.tag),
        };
      } catch (error) {
        console.error("Error fetching tags for lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tags for lead",
        });
      }
    }),

  // Get leads for a specific tag
  getLeadsByTagId: protectedProcedure
    .input(
      z.object({
        tagId: z.string().uuid(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const { tagId, page, limit } = input;

        // Calculate offset
        const offset = (page - 1) * limit;

        // Count total leads with this tag
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(leadTags)
          .where(eq(leadTags.tagId, tagId));

        const totalCount = Number(countResult[0]?.count) || 0;

        // Get tagged leads
        const leadResults = await db
          .select({
            id: leadTags.leadId,
          })
          .from(leadTags)
          .where(eq(leadTags.tagId, tagId))
          .limit(limit)
          .offset(offset);

        const leadIds = leadResults.map((result) => result.id);

        return {
          success: true,
          leadIds,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Error fetching leads for tag:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch leads for tag",
        });
      }
    }),
  getAllTags: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
          sortBy: z.enum(["name", "createdAt"]).default("name"),
          sortDirection: z.enum(["asc", "desc"]).default("asc"),
        })
        .optional()
    )
    .query(async ({ input = {} }) => {
      try {
        const {
          search,
          page = 1,
          limit = 50,
          sortBy = "name",
          sortDirection = "asc",
        } = input;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Build the base query conditions
        let queryConditions = undefined;

        // Apply search filter if provided
        if (search) {
          const likePattern = `%${search}%`;
          queryConditions = or(
            ilike(tags.name, likePattern),
            ilike(tags.description || "", likePattern)
          );
        }

        // Count total matching tags (for pagination)
        const totalCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tags)
          .where(queryConditions);

        const totalCount = Number(totalCountResult[0]?.count) || 0;

        // Apply sorting
        let orderByClause;
        switch (sortBy) {
          case "name":
            orderByClause =
              sortDirection === "asc" ? asc(tags.name) : desc(tags.name);
            break;
          case "createdAt":
          default:
            orderByClause =
              sortDirection === "asc"
                ? asc(tags.createdAt)
                : desc(tags.createdAt);
            break;
        }

        // Get the tags with sorting and pagination
        const tagsList = await db
          .select()
          .from(tags)
          .where(queryConditions)
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          tags: tagsList,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Error listing tags:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list tags",
        });
      }
    }),
});
