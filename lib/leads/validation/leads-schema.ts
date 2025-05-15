import { z } from "zod";

export const createLeadSchema = z.object({
  // Lead Info
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(["autonomo", "empresa", "particular", "pensionista"]).optional(),
  // Lead Advanced Info
  status: z.enum([
    "nuevo",
    "contactado",
    "activo",
    "calificado",
    "propuesta",
    "evaluando",
    "manager",
    "iniciado",
    "documentacion",
    "comprador",
    "descartado",
    "sin_interes",
    "inactivo",
    "perdido",
    "rechazado",
    "sin_opciones",
  ]),
  expectedPurchaseTimeframe: z
    .enum([
      "inmediato",
      "esta_semana",
      "proxima_semana",
      "dos_semanas",
      "un_mes",
      "1-3 meses",
      "3-6 meses",
      "6+ meses",
      "indefinido",
    ])
    .optional(),
  budget: z.string().optional(),
  // Campaign id for when the webhook creates it
  campaignId: z.string().optional(),
  // Lead messages/interactions
  lastContactedAt: z.coerce.date().optional(),
  lastMessageAt: z.coerce.date().optional(),
  nextFollowUpDate: z.coerce.date().optional(),
});

export type CreateLeadSchema = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  id: z.string().uuid(),
  // Lead Info
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(["autonomo", "empresa", "particular", "pensionista"]).optional(),
  // Lead Advanced Info
  status: z.enum([
    "nuevo",
    "contactado",
    "activo",
    "calificado",
    "propuesta",
    "evaluando",
    "manager",
    "iniciado",
    "documentacion",
    "comprador",
    "descartado",
    "sin_interes",
    "inactivo",
    "perdido",
    "rechazado",
    "sin_opciones",
  ]),
  expectedPurchaseTimeframe: z
    .enum([
      "inmediato",
      "esta_semana",
      "proxima_semana",
      "dos_semanas",
      "un_mes",
      "1-3 meses",
      "3-6 meses",
      "6+ meses",
      "indefinido",
    ])
    .optional(),
  budget: z.string().optional(),
  // Lead messages/interactions
  lastContactedAt: z.coerce.date().optional(),
  lastMessageAt: z.coerce.date().optional(),
  nextFollowUpDate: z.coerce.date().optional(),
});

export type UpdateLeadSchema = z.infer<typeof updateLeadSchema>;

export const filterLeadSchema = z.object({
  status: z
    .enum([
      "nuevo",
      "contactado",
      "activo",
      "calificado",
      "propuesta",
      "evaluando",
      "manager",
      "iniciado",
      "documentacion",
      "comprador",
      "descartado",
      "sin_interes",
      "inactivo",
      "perdido",
      "rechazado",
      "sin_opciones",
    ])
    .optional(),
  search: z.string().optional(),
  expectedPurchaseTimeframe: z
    .enum([
      "inmediato",
      "esta_semana",
      "proxima_semana",
      "dos_semanas",
      "un_mes",
      "1-3 meses",
      "3-6 meses",
      "6+ meses",
      "indefinido",
    ])
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(["name", "createdAt", "status", "priority"])
    .default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type FilterLeadSchema = z.infer<typeof filterLeadSchema>;
