import { z } from "zod";

// Helper function to handle dates from string inputs
const dateStringToDate = (val: string | undefined) => {
  if (!val) return undefined;
  const date = new Date(val);
  return isNaN(date.getTime()) ? undefined : date;
};

export const createLeadTaskSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().min(1, { message: "Task title is required" }),
  description: z.string().optional(),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  status: z
    .enum(["pendiente", "progreso", "completado", "cancelado"])
    .default("pendiente"),
  dueDate: z.union([
    z.string().transform((str) => dateStringToDate(str)),
    z.date().optional(),
    z.undefined(),
  ]),
});

export type CreateLeadTaskSchema = z.infer<typeof createLeadTaskSchema>;

export const updateLeadTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Task title is required" }),
  description: z.string().optional(),
  priority: z.enum(["baja", "media", "alta", "urgente"]),
  status: z.enum(["pendiente", "progreso", "completado", "cancelado"]),
  dueDate: z.union([
    z.string().transform((str) => dateStringToDate(str)),
    z.date().optional(),
    z.undefined(),
  ]),
});

export type UpdateLeadTaskSchema = z.infer<typeof updateLeadTaskSchema>;

export const updateTaskStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pendiente", "progreso", "completado", "cancelado"]),
});

export type UpdateTaskStatusSchema = z.infer<typeof updateTaskStatusSchema>;

export const getLeadTasksSchema = z.object({
  leadId: z.string().uuid(),
  status: z
    .enum(["pendiente", "progreso", "completado", "cancelado"])
    .optional(),
});

export type GetLeadTasksSchema = z.infer<typeof getLeadTasksSchema>;
