import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, { message: "Tag name is required" }),
  color: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i, {
      message: "Color must be a valid hex code (e.g., #FF0000)",
    })
    .default("#cccccc"),
  description: z.string().optional(),
});

export type CreateLeadTagSchema = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, { message: "Tag name is required" }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, {
    message: "Color must be a valid hex code (e.g., #FF0000)",
  }),
  description: z.string().optional(),
});

export type UpdateLeadTagSchema = z.infer<typeof updateTagSchema>;

export const attachTagSchema = z.object({
  leadId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export type AttachLeadTagSchema = z.infer<typeof attachTagSchema>;

export const detachTagSchema = z.object({
  leadId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export type DetachLeadTagSchema = z.infer<typeof detachTagSchema>;
