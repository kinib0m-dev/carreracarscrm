import { z } from "zod";

export const createLeadNoteSchema = z.object({
  leadId: z.string().uuid(),
  content: z.string().min(1, { message: "Note content is required" }),
});

export type CreateLeadNoteSchema = z.infer<typeof createLeadNoteSchema>;

export const updateLeadNoteSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, { message: "Note content is required" }),
});

export type UpdateLeadNoteSchema = z.infer<typeof updateLeadNoteSchema>;

export const getLeadNotesSchema = z.object({
  leadId: z.string().uuid(),
});

export type GetLeadNotesSchema = z.infer<typeof getLeadNotesSchema>;
