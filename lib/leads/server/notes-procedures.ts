import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { leadNotes, leads } from "@/db/schema";

import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import {
  createLeadNoteSchema,
  getLeadNotesSchema,
  updateLeadNoteSchema,
} from "../validation/lead-notes-schema";

export const leadNoteRouter = createTRPCRouter({
  // Create a new note for a lead
  create: protectedProcedure
    .input(createLeadNoteSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Verify the lead exists and belongs to the user
        const leadResult = await db
          .select()
          .from(leads)
          .where(and(eq(leads.id, input.leadId)))
          .limit(1);

        if (!leadResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        // Insert the new note
        const [newNote] = await db
          .insert(leadNotes)
          .values({
            leadId: input.leadId,
            userId,
            content: input.content,
          })
          .returning();

        return {
          success: true,
          note: newNote,
        };
      } catch (error) {
        console.error("Error creating lead note:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create lead note",
        });
      }
    }),

  // Get all notes for a lead
  getByLeadId: protectedProcedure
    .input(getLeadNotesSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Verify the lead exists and belongs to the user
        const leadResult = await db
          .select()
          .from(leads)
          .where(and(eq(leads.id, input.leadId)))
          .limit(1);

        if (!leadResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        // Get the notes for the lead
        const notes = await db
          .select()
          .from(leadNotes)
          .where(
            and(
              eq(leadNotes.leadId, input.leadId),
              eq(leadNotes.userId, userId)
            )
          )
          .orderBy(desc(leadNotes.createdAt));

        return {
          success: true,
          notes,
        };
      } catch (error) {
        console.error("Error fetching lead notes:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lead notes",
        });
      }
    }),

  // Update a note
  update: protectedProcedure
    .input(updateLeadNoteSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Check if note exists and belongs to the user
        const existingNoteResult = await db
          .select()
          .from(leadNotes)
          .where(and(eq(leadNotes.id, input.id), eq(leadNotes.userId, userId)))
          .limit(1);

        if (!existingNoteResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Note not found",
          });
        }

        // Update the note
        const [updatedNote] = await db
          .update(leadNotes)
          .set({
            content: input.content,
            updatedAt: new Date(),
          })
          .where(and(eq(leadNotes.id, input.id), eq(leadNotes.userId, userId)))
          .returning();

        return {
          success: true,
          note: updatedNote,
        };
      } catch (error) {
        console.error("Error updating lead note:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update lead note",
        });
      }
    }),

  // Delete a note
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Check if note exists and belongs to the user
        const existingNoteResult = await db
          .select()
          .from(leadNotes)
          .where(and(eq(leadNotes.id, input.id), eq(leadNotes.userId, userId)))
          .limit(1);

        if (!existingNoteResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Note not found",
          });
        }

        // Delete the note
        await db
          .delete(leadNotes)
          .where(and(eq(leadNotes.id, input.id), eq(leadNotes.userId, userId)));

        return {
          success: true,
          message: "Note deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting lead note:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete lead note",
        });
      }
    }),
});
