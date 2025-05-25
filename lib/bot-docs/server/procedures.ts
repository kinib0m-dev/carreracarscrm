import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { botDocuments } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, or, ilike, sql, asc, desc } from "drizzle-orm";
import {
  createBotDocumentSchema,
  filterBotDocumentSchema,
  updateBotDocumentSchema,
} from "../validation/bot-docs-schema";
import { generateEmbedding } from "@/lib/utils/embedding";

export const botDocsRouter = createTRPCRouter({
  // Create a new bot document
  create: protectedProcedure
    .input(createBotDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Generate embedding for the document content
        let embedding = null;
        try {
          embedding = await generateEmbedding(input.content);
        } catch (embeddingError) {
          console.error(
            "Error generating embedding, continuing without it:",
            embeddingError
          );
        }

        // Insert the new document with embedding
        const [newDocument] = await db
          .insert(botDocuments)
          .values({
            userId,
            title: input.title,
            category: input.category,
            content: input.content,
            fileName: input.fileName,
            embedding: embedding,
          })
          .returning();

        return {
          success: true,
          document: newDocument,
        };
      } catch (error) {
        console.error("Error creating bot document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create bot document",
        });
      }
    }),

  // Get a bot document by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Get the document
        const documentResult = await db
          .select()
          .from(botDocuments)
          .where(
            and(eq(botDocuments.id, input.id), eq(botDocuments.userId, userId))
          )
          .limit(1);

        const document = documentResult[0];

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        return {
          success: true,
          document,
        };
      } catch (error) {
        console.error("Error fetching bot document:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch bot document",
        });
      }
    }),

  // Update a bot document
  update: protectedProcedure
    .input(updateBotDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { id, ...updateData } = input;

        // Check if document exists and belongs to the user
        const existingDocResult = await db
          .select()
          .from(botDocuments)
          .where(and(eq(botDocuments.id, id), eq(botDocuments.userId, userId)))
          .limit(1);

        const existingDoc = existingDocResult[0];

        if (!existingDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        // If content has changed, regenerate the embedding
        let embeddingUpdate = {};

        if (updateData.content !== existingDoc.content) {
          try {
            const newEmbedding = await generateEmbedding(updateData.content);
            embeddingUpdate = { embedding: newEmbedding };
          } catch (embeddingError) {
            console.error(
              "Error generating embedding, continuing without it:",
              embeddingError
            );
            // We'll continue with embedding as null
          }
        }

        // Update the document with possibly new embedding
        const [updatedDoc] = await db
          .update(botDocuments)
          .set({
            ...updateData,
            ...embeddingUpdate,
            updatedAt: new Date(),
          })
          .where(and(eq(botDocuments.id, id), eq(botDocuments.userId, userId)))
          .returning();

        return {
          success: true,
          document: updatedDoc,
        };
      } catch (error) {
        console.error("Error updating bot document:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update bot document",
        });
      }
    }),

  // Delete a bot document
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Check if document exists and belongs to the user
        const existingDocResult = await db
          .select()
          .from(botDocuments)
          .where(
            and(eq(botDocuments.id, input.id), eq(botDocuments.userId, userId))
          )
          .limit(1);

        const existingDoc = existingDocResult[0];

        if (!existingDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        // Delete the document
        await db
          .delete(botDocuments)
          .where(
            and(eq(botDocuments.id, input.id), eq(botDocuments.userId, userId))
          );

        return {
          success: true,
          message: "Document deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting bot document:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete bot document",
        });
      }
    }),

  // List bot documents with filters, pagination, and sorting
  list: protectedProcedure
    .input(filterBotDocumentSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { category, search, page, limit, sortBy, sortDirection } = input;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Start building the base query conditions
        let queryConditions = eq(botDocuments.userId, userId);

        // Apply additional filters
        if (category) {
          queryConditions = and(
            queryConditions,
            eq(botDocuments.category, category)
          )!;
        }

        // Apply search filter if provided
        if (search) {
          const likePattern = `%${search}%`;
          queryConditions = and(
            queryConditions,
            or(
              ilike(botDocuments.title, likePattern),
              ilike(botDocuments.content, likePattern)
            )!
          )!;
        }

        // Count total matching documents (for pagination)
        const totalCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(botDocuments)
          .where(queryConditions);

        const totalCount = Number(totalCountResult[0]?.count) || 0;

        // Apply sorting
        let orderByClause;
        switch (sortBy) {
          case "title":
            orderByClause =
              sortDirection === "asc"
                ? asc(botDocuments.title)
                : desc(botDocuments.title);
            break;
          case "category":
            orderByClause =
              sortDirection === "asc"
                ? asc(botDocuments.category)
                : desc(botDocuments.category);
            break;
          case "createdAt":
          default:
            orderByClause =
              sortDirection === "asc"
                ? asc(botDocuments.createdAt)
                : desc(botDocuments.createdAt);
            break;
        }

        // Get the documents with sorting and pagination
        const documentsList = await db
          .select()
          .from(botDocuments)
          .where(queryConditions)
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          documents: documentsList,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Error listing bot documents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list bot documents",
        });
      }
    }),
});
