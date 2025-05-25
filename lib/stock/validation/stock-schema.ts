import { z } from "zod";

export const createCarStockSchema = z.object({
  // Identificación
  vin: z.string().optional(),

  // Información básica
  marca: z.string().optional(),
  modelo: z.string().optional(),
  version: z.string().optional(),
  motor: z.string().optional(),
  carroceria: z.string().optional(),
  puertas: z.number().int().optional(),
  transmision: z.string().optional(),
  etiqueta: z.string().optional(),
  fecha_version: z.string().optional(), // Date as string for form handling
  color: z.string().optional(),
  kilometros: z.number().int().optional(),
  matricula: z.string().optional(),

  // Existing fields
  type: z
    .enum([
      "sedan",
      "suv",
      "hatchback",
      "coupe",
      "descapotable",
      "monovolumen",
      "pickup",
      "electrico",
      "hibrido",
      "lujo",
      "deportivo",
      "furgoneta_carga",
      "furgoneta_pasajeros",
      "furgoneta_mixta",
      "otro",
    ])
    .default("sedan"),
  description: z.string().optional(),
  imageUrl: z.array(z.string()).default([]),
  url: z.string().optional(),
  notes: z.string().optional(),

  // Comerciante / procedencia
  comercial: z.string().optional(),
  sociedad: z.string().optional(),
  tienda: z.string().optional(),
  provincia: z.string().optional(),

  // Precios y financiación
  precio_compra: z.string().optional(), // Using string for decimal handling
  precio_venta: z.string().optional(),
  precio_financiado: z.string().optional(),
  impuestos_incluidos: z.boolean().default(true),
  impuesto: z.string().optional(), // Using string for decimal handling

  // Estado
  garantia: z.string().optional(),
  vendido: z.boolean().default(false),
  gastos_adicionales: z.string().optional(), // Using string for decimal handling
});

export type CreateCarStockSchema = z.infer<typeof createCarStockSchema>;

export const updateCarStockSchema = z.object({
  id: z.string().uuid(),

  // Identificación
  vin: z.string().optional(),

  // Información básica
  marca: z.string().optional(),
  modelo: z.string().optional(),
  version: z.string().optional(),
  motor: z.string().optional(),
  carroceria: z.string().optional(),
  puertas: z.number().int().optional(),
  transmision: z.string().optional(),
  etiqueta: z.string().optional(),
  fecha_version: z.string().optional(),
  color: z.string().optional(),
  kilometros: z.number().int().optional(),
  matricula: z.string().optional(),

  // Existing fields
  type: z.enum([
    "sedan",
    "suv",
    "hatchback",
    "coupe",
    "descapotable",
    "monovolumen",
    "pickup",
    "electrico",
    "hibrido",
    "lujo",
    "deportivo",
    "furgoneta_carga",
    "furgoneta_pasajeros",
    "furgoneta_mixta",
    "otro",
  ]),
  description: z.string().optional(),
  imageUrl: z.array(z.string()),
  url: z.string().optional(),
  notes: z.string().optional(),

  // Comerciante / procedencia
  comercial: z.string().optional(),
  sociedad: z.string().optional(),
  tienda: z.string().optional(),
  provincia: z.string().optional(),

  // Precios y financiación
  precio_compra: z.string().optional(),
  precio_venta: z.string().optional(),
  precio_financiado: z.string().optional(),
  impuestos_incluidos: z.boolean().default(true),
  impuesto: z.string().optional(),

  // Estado
  garantia: z.string().optional(),
  vendido: z.boolean().default(false),
  gastos_adicionales: z.string().optional(),
});

export type UpdateCarStockSchema = z.infer<typeof updateCarStockSchema>;

export const filterCarStockSchema = z.object({
  type: z
    .enum([
      "sedan",
      "suv",
      "hatchback",
      "coupe",
      "descapotable",
      "monovolumen",
      "pickup",
      "electrico",
      "hibrido",
      "lujo",
      "deportivo",
      "furgoneta_carga",
      "furgoneta_pasajeros",
      "furgoneta_mixta",
      "otro",
    ])
    .optional(),
  search: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  color: z.string().optional(),
  provincia: z.string().optional(),
  comercial: z.string().optional(),
  vendido: z.boolean().optional(),
  precio_min: z.string().optional(),
  precio_max: z.string().optional(),
  kilometros_min: z.number().int().optional(),
  kilometros_max: z.number().int().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "marca",
      "modelo",
      "type",
      "precio_venta",
      "kilometros",
      "createdAt",
    ])
    .default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type FilterCarStockSchema = z.infer<typeof filterCarStockSchema>;
