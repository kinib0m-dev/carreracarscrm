import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { carStock } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, or, ilike, sql, asc, desc, gte, lte } from "drizzle-orm";
import {
  createCarStockSchema,
  filterCarStockSchema,
  updateCarStockSchema,
} from "../validation/stock-schema";
import { generateEmbedding } from "@/lib/utils/embedding";

export const stockRouter = createTRPCRouter({
  // Create a new car stock item
  create: protectedProcedure
    .input(createCarStockSchema)
    .mutation(async ({ input }) => {
      try {
        // Generate embedding for the car information
        let embedding = null;
        try {
          // Create a comprehensive text to embed with all relevant car information
          const textToEmbed = `
            ${input.vin ? `VIN: ${input.vin}` : ""}
            ${input.marca ? `Marca: ${input.marca}` : ""}
            ${input.modelo ? `Modelo: ${input.modelo}` : ""}
            ${input.version ? `Version: ${input.version}` : ""}
            ${input.motor ? `Motor: ${input.motor}` : ""}
            ${input.carroceria ? `Carrocería: ${input.carroceria}` : ""}
            ${input.transmision ? `Transmisión: ${input.transmision}` : ""}
            ${input.color ? `Color: ${input.color}` : ""}
            ${input.kilometros ? `Kilómetros: ${input.kilometros}` : ""}
            ${input.matricula ? `Matrícula: ${input.matricula}` : ""}
            Type: ${input.type}
            ${input.precio_venta ? `Precio de Venta: ${input.precio_venta}` : ""}
            ${input.precio_compra ? `Precio de Compra: ${input.precio_compra}` : ""}
            ${input.description ? `Description: ${input.description}` : ""}
            ${input.notes ? `Notes: ${input.notes}` : ""}
            ${input.comercial ? `Comercial: ${input.comercial}` : ""}
            ${input.provincia ? `Provincia: ${input.provincia}` : ""}
            ${input.garantia ? `Garantía: ${input.garantia}` : ""}
          `.trim();

          if (textToEmbed) {
            embedding = await generateEmbedding(textToEmbed);
          }
        } catch (embeddingError) {
          console.error(
            "Error generating embedding, continuing without it:",
            embeddingError
          );
        }

        // Insert the new car stock item with embedding
        const [newCarStock] = await db
          .insert(carStock)
          .values({
            // Identificación
            vin: input.vin,
            // Información básica
            marca: input.marca,
            modelo: input.modelo,
            version: input.version,
            motor: input.motor,
            carroceria: input.carroceria,
            puertas: input.puertas,
            transmision: input.transmision,
            etiqueta: input.etiqueta,
            fecha_version: input.fecha_version,
            color: input.color,
            kilometros: input.kilometros,
            matricula: input.matricula,
            // Existing fields
            type: input.type,
            description: input.description,
            imageUrl: input.imageUrl,
            url: input.url,
            notes: input.notes,
            // Comerciante / procedencia
            comercial: input.comercial,
            sociedad: input.sociedad,
            tienda: input.tienda,
            provincia: input.provincia,
            // Precios y financiación
            precio_compra: input.precio_compra,
            precio_venta: input.precio_venta,
            precio_financiado: input.precio_financiado,
            impuestos_incluidos: input.impuestos_incluidos,
            impuesto: input.impuesto,
            // Estado
            garantia: input.garantia,
            vendido: input.vendido,
            gastos_adicionales: input.gastos_adicionales,
            // Embedding
            embedding: embedding,
          })
          .returning();

        return {
          success: true,
          carStock: newCarStock,
        };
      } catch (error) {
        console.error("Error creating car stock item:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create car stock item",
        });
      }
    }),

  // Get a car stock item by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const carStockResult = await db
          .select()
          .from(carStock)
          .where(eq(carStock.id, input.id))
          .limit(1);

        const carStockItem = carStockResult[0];

        if (!carStockItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Car stock item not found",
          });
        }

        return {
          success: true,
          carStock: carStockItem,
        };
      } catch (error) {
        console.error("Error fetching car stock item:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch car stock item",
        });
      }
    }),

  // Update a car stock item
  update: protectedProcedure
    .input(updateCarStockSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        // Check if car stock item exists
        const existingCarStockResult = await db
          .select()
          .from(carStock)
          .where(eq(carStock.id, id))
          .limit(1);

        const existingCarStock = existingCarStockResult[0];

        if (!existingCarStock) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Car stock item not found",
          });
        }

        // Check if key fields have changed to regenerate embedding
        let embeddingUpdate = {};

        const hasChanges =
          updateData.vin !== existingCarStock.vin ||
          updateData.marca !== existingCarStock.marca ||
          updateData.modelo !== existingCarStock.modelo ||
          updateData.version !== existingCarStock.version ||
          updateData.motor !== existingCarStock.motor ||
          updateData.carroceria !== existingCarStock.carroceria ||
          updateData.transmision !== existingCarStock.transmision ||
          updateData.color !== existingCarStock.color ||
          updateData.kilometros !== existingCarStock.kilometros ||
          updateData.matricula !== existingCarStock.matricula ||
          updateData.type !== existingCarStock.type ||
          updateData.precio_venta !== existingCarStock.precio_venta ||
          updateData.precio_compra !== existingCarStock.precio_compra ||
          updateData.description !== existingCarStock.description ||
          updateData.notes !== existingCarStock.notes ||
          updateData.comercial !== existingCarStock.comercial ||
          updateData.provincia !== existingCarStock.provincia ||
          updateData.garantia !== existingCarStock.garantia;

        if (hasChanges) {
          try {
            // Create a comprehensive text to embed
            const textToEmbed = `
              ${updateData.vin || existingCarStock.vin ? `VIN: ${updateData.vin || existingCarStock.vin}` : ""}
              ${updateData.marca || existingCarStock.marca ? `Marca: ${updateData.marca || existingCarStock.marca}` : ""}
              ${updateData.modelo || existingCarStock.modelo ? `Modelo: ${updateData.modelo || existingCarStock.modelo}` : ""}
              ${updateData.version || existingCarStock.version ? `Version: ${updateData.version || existingCarStock.version}` : ""}
              ${updateData.motor || existingCarStock.motor ? `Motor: ${updateData.motor || existingCarStock.motor}` : ""}
              ${updateData.carroceria || existingCarStock.carroceria ? `Carrocería: ${updateData.carroceria || existingCarStock.carroceria}` : ""}
              ${updateData.transmision || existingCarStock.transmision ? `Transmisión: ${updateData.transmision || existingCarStock.transmision}` : ""}
              ${updateData.color || existingCarStock.color ? `Color: ${updateData.color || existingCarStock.color}` : ""}
              ${updateData.kilometros || existingCarStock.kilometros ? `Kilómetros: ${updateData.kilometros || existingCarStock.kilometros}` : ""}
              ${updateData.matricula || existingCarStock.matricula ? `Matrícula: ${updateData.matricula || existingCarStock.matricula}` : ""}
              Type: ${updateData.type || existingCarStock.type}
              ${updateData.precio_venta || existingCarStock.precio_venta ? `Precio de Venta: ${updateData.precio_venta || existingCarStock.precio_venta}` : ""}
              ${updateData.precio_compra || existingCarStock.precio_compra ? `Precio de Compra: ${updateData.precio_compra || existingCarStock.precio_compra}` : ""}
              ${updateData.description || existingCarStock.description ? `Description: ${updateData.description || existingCarStock.description}` : ""}
              ${updateData.notes || existingCarStock.notes ? `Notes: ${updateData.notes || existingCarStock.notes}` : ""}
              ${updateData.comercial || existingCarStock.comercial ? `Comercial: ${updateData.comercial || existingCarStock.comercial}` : ""}
              ${updateData.provincia || existingCarStock.provincia ? `Provincia: ${updateData.provincia || existingCarStock.provincia}` : ""}
              ${updateData.garantia || existingCarStock.garantia ? `Garantía: ${updateData.garantia || existingCarStock.garantia}` : ""}
            `.trim();

            if (textToEmbed) {
              const newEmbedding = await generateEmbedding(textToEmbed);
              embeddingUpdate = { embedding: newEmbedding };
            }
          } catch (embeddingError) {
            console.error(
              "Error generating embedding, continuing without it:",
              embeddingError
            );
          }
        }

        // Prepare update data with proper date conversion
        const processedUpdateData = {
          ...updateData,
          fecha_version: updateData.fecha_version,
        };

        // Update the car stock item
        const [updatedCarStock] = await db
          .update(carStock)
          .set({
            ...processedUpdateData,
            ...embeddingUpdate,
            updatedAt: new Date(),
          })
          .where(eq(carStock.id, id))
          .returning();

        return {
          success: true,
          carStock: updatedCarStock,
        };
      } catch (error) {
        console.error("Error updating car stock item:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update car stock item",
        });
      }
    }),

  // Delete a car stock item (hard delete since no isDeleted field in new schema)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        // Check if car stock item exists
        const existingCarStockResult = await db
          .select()
          .from(carStock)
          .where(eq(carStock.id, input.id))
          .limit(1);

        const existingCarStock = existingCarStockResult[0];

        if (!existingCarStock) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Car stock item not found",
          });
        }

        // Hard delete the car stock item
        await db.delete(carStock).where(eq(carStock.id, input.id));

        return {
          success: true,
          message: "Car stock item deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting car stock item:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete car stock item",
        });
      }
    }),

  // List car stock items with filters, pagination, and sorting
  list: protectedProcedure
    .input(filterCarStockSchema)
    .query(async ({ input }) => {
      try {
        const {
          type,
          search,
          marca,
          modelo,
          color,
          provincia,
          comercial,
          vendido,
          precio_min,
          precio_max,
          kilometros_min,
          kilometros_max,
          page,
          limit,
          sortBy,
          sortDirection,
        } = input;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Start building the base query conditions
        const conditions = [];

        // Apply filters
        if (type) {
          conditions.push(eq(carStock.type, type));
        }

        if (marca) {
          conditions.push(ilike(carStock.marca, `%${marca}%`));
        }

        if (modelo) {
          conditions.push(ilike(carStock.modelo, `%${modelo}%`));
        }

        if (color) {
          conditions.push(ilike(carStock.color, `%${color}%`));
        }

        if (provincia) {
          conditions.push(ilike(carStock.provincia, `%${provincia}%`));
        }

        if (comercial) {
          conditions.push(ilike(carStock.comercial, `%${comercial}%`));
        }

        if (vendido !== undefined) {
          conditions.push(eq(carStock.vendido, vendido));
        }

        if (precio_min) {
          conditions.push(gte(carStock.precio_venta, precio_min));
        }

        if (precio_max) {
          conditions.push(lte(carStock.precio_venta, precio_max));
        }

        if (kilometros_min) {
          conditions.push(gte(carStock.kilometros, kilometros_min));
        }

        if (kilometros_max) {
          conditions.push(lte(carStock.kilometros, kilometros_max));
        }

        // Apply search filter if provided
        if (search) {
          const likePattern = `%${search}%`;
          conditions.push(
            or(
              ilike(carStock.marca, likePattern),
              ilike(carStock.modelo, likePattern),
              ilike(carStock.description || "", likePattern),
              ilike(carStock.vin || "", likePattern),
              ilike(carStock.matricula || "", likePattern)
            )
          );
        }

        // Combine all conditions
        const queryConditions =
          conditions.length > 0 ? and(...conditions) : undefined;

        // Count total matching car stock items (for pagination)
        const totalCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(carStock)
          .where(queryConditions);

        const totalCount = Number(totalCountResult[0]?.count) || 0;

        // Apply sorting
        let orderByClause;
        switch (sortBy) {
          case "marca":
            orderByClause =
              sortDirection === "asc"
                ? asc(carStock.marca)
                : desc(carStock.marca);
            break;
          case "modelo":
            orderByClause =
              sortDirection === "asc"
                ? asc(carStock.modelo)
                : desc(carStock.modelo);
            break;
          case "type":
            orderByClause =
              sortDirection === "asc"
                ? asc(carStock.type)
                : desc(carStock.type);
            break;
          case "precio_venta":
            orderByClause =
              sortDirection === "asc"
                ? asc(carStock.precio_venta)
                : desc(carStock.precio_venta);
            break;
          case "kilometros":
            orderByClause =
              sortDirection === "asc"
                ? asc(carStock.kilometros)
                : desc(carStock.kilometros);
            break;
          case "createdAt":
          default:
            orderByClause =
              sortDirection === "asc"
                ? asc(carStock.createdAt)
                : desc(carStock.createdAt);
            break;
        }

        // Get the car stock items with sorting and pagination
        const carStockList = await db
          .select()
          .from(carStock)
          .where(queryConditions)
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          carStock: carStockList,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Error listing car stock items:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list car stock items",
        });
      }
    }),
  // Mark car as sold
  markAsSold: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        // Check if car stock item exists
        const existingCarStockResult = await db
          .select()
          .from(carStock)
          .where(eq(carStock.id, input.id))
          .limit(1);

        const existingCarStock = existingCarStockResult[0];

        if (!existingCarStock) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Car stock item not found",
          });
        }

        // Update only the vendido status
        const [updatedCarStock] = await db
          .update(carStock)
          .set({
            vendido: true,
            updatedAt: new Date(),
          })
          .where(eq(carStock.id, input.id))
          .returning();

        return {
          success: true,
          carStock: updatedCarStock,
        };
      } catch (error) {
        console.error("Error marking car as sold:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark car as sold",
        });
      }
    }),
});
