import { z } from "zod";

export const createBotDocumentSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  category: z.enum([
    "company_profile",
    "pricing",
    "financing",
    "faq",
    "service",
    "maintenance",
    "legal",
    "product_info",
    "other",
  ]),
  content: z.string().min(1, { message: "Content is required" }),
  fileName: z.string().optional(),
});

export type CreateBotDocumentSchema = z.infer<typeof createBotDocumentSchema>;

export const updateBotDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  category: z.enum([
    "company_profile",
    "pricing",
    "financing",
    "faq",
    "service",
    "maintenance",
    "legal",
    "product_info",
    "other",
  ]),
  content: z.string().min(1, { message: "Content is required" }),
  fileName: z.string().optional(),
});

export type UpdateBotDocumentSchema = z.infer<typeof updateBotDocumentSchema>;

export const filterBotDocumentSchema = z.object({
  category: z
    .enum([
      "company_profile",
      "pricing",
      "financing",
      "faq",
      "service",
      "maintenance",
      "legal",
      "product_info",
      "other",
    ])
    .optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["title", "category", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type FilterBotDocumentSchema = z.infer<typeof filterBotDocumentSchema>;
