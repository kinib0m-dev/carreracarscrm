import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { leadTasks, leads } from "@/db/schema";

import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import {
  createLeadTaskSchema,
  getLeadTasksSchema,
  updateLeadTaskSchema,
  updateTaskStatusSchema,
} from "../validation/lead-tasks-schema";

export const leadTaskRouter = createTRPCRouter({
  // Create a new task for a lead
  create: protectedProcedure
    .input(createLeadTaskSchema)
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

        // Insert the new task
        const [newTask] = await db
          .insert(leadTasks)
          .values({
            leadId: input.leadId,
            userId,
            title: input.title,
            description: input.description,
            priority: input.priority,
            status: input.status,
            dueDate: input.dueDate,
          })
          .returning();

        return {
          success: true,
          task: newTask,
        };
      } catch (error) {
        console.error("Error creating lead task:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create lead task",
        });
      }
    }),

  // Get all tasks for a lead
  getByLeadId: protectedProcedure
    .input(getLeadTasksSchema)
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

        // Build query conditions
        let queryConditions = and(
          eq(leadTasks.leadId, input.leadId),
          eq(leadTasks.userId, userId)
        );

        // Add status filter if provided
        if (input.status) {
          queryConditions = and(
            queryConditions,
            eq(leadTasks.status, input.status)
          );
        }

        // Get the tasks for the lead
        const tasks = await db
          .select()
          .from(leadTasks)
          .where(queryConditions)
          .orderBy(
            // Sort by status (pending and in_progress first)
            sql`CASE 
              WHEN ${leadTasks.status} = 'pendiente' THEN 1 
              WHEN ${leadTasks.status} = 'progreso' THEN 2
              WHEN ${leadTasks.status} = 'completado' THEN 3
              WHEN ${leadTasks.status} = 'cancelado' THEN 4
              ELSE 5 
            END`,
            // Then by priority
            sql`CASE 
              WHEN ${leadTasks.priority} = 'urgente' THEN 1 
              WHEN ${leadTasks.priority} = 'alta' THEN 2
              WHEN ${leadTasks.priority} = 'media' THEN 3
              WHEN ${leadTasks.priority} = 'baja' THEN 4
              ELSE 5 
            END`,
            // Then by due date (null dates at the end)
            sql`CASE 
              WHEN ${leadTasks.dueDate} IS NULL THEN 1 
              ELSE 0 
            END`,
            asc(leadTasks.dueDate),
            // Finally by created date
            desc(leadTasks.createdAt)
          );

        // Group tasks by status for easier consumption
        const tasksByStatus = {
          pending: tasks.filter((task) => task.status === "pendiente"),
          in_progress: tasks.filter((task) => task.status === "progreso"),
          completed: tasks.filter((task) => task.status === "completado"),
          cancelled: tasks.filter((task) => task.status === "cancelado"),
        };

        return {
          success: true,
          tasks,
          tasksByStatus,
        };
      } catch (error) {
        console.error("Error fetching lead tasks:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lead tasks",
        });
      }
    }),

  // Get task by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Get the task
        const taskResult = await db
          .select()
          .from(leadTasks)
          .where(and(eq(leadTasks.id, input.id), eq(leadTasks.userId, userId)))
          .limit(1);

        const task = taskResult[0];

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        return {
          success: true,
          task,
        };
      } catch (error) {
        console.error("Error fetching task:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch task",
        });
      }
    }),

  // Update a task
  update: protectedProcedure
    .input(updateLeadTaskSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Check if task exists and belongs to the user
        const existingTaskResult = await db
          .select()
          .from(leadTasks)
          .where(and(eq(leadTasks.id, input.id), eq(leadTasks.userId, userId)))
          .limit(1);

        if (!existingTaskResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // Determine if the task is being marked as completed
        const wasCompleted =
          existingTaskResult[0].status !== "completado" &&
          input.status === "completado";

        // Update the task
        const [updatedTask] = await db
          .update(leadTasks)
          .set({
            title: input.title,
            description: input.description,
            priority: input.priority,
            status: input.status,
            dueDate: input.dueDate,
            // Set completedAt timestamp if task is being marked as completed
            completedAt: wasCompleted
              ? new Date()
              : existingTaskResult[0].completedAt,
            updatedAt: new Date(),
          })
          .where(and(eq(leadTasks.id, input.id), eq(leadTasks.userId, userId)))
          .returning();

        return {
          success: true,
          task: updatedTask,
        };
      } catch (error) {
        console.error("Error updating lead task:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update lead task",
        });
      }
    }),

  // Quick update task status only
  updateStatus: protectedProcedure
    .input(updateTaskStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Check if task exists and belongs to the user
        const existingTaskResult = await db
          .select()
          .from(leadTasks)
          .where(and(eq(leadTasks.id, input.id), eq(leadTasks.userId, userId)))
          .limit(1);

        if (!existingTaskResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // Determine if the task is being marked as completed
        const wasCompleted =
          existingTaskResult[0].status !== "completado" &&
          input.status === "completado";

        // Update the task status
        const [updatedTask] = await db
          .update(leadTasks)
          .set({
            status: input.status,
            // Set completedAt timestamp if task is being marked as completed
            completedAt: wasCompleted
              ? new Date()
              : existingTaskResult[0].completedAt,
            updatedAt: new Date(),
          })
          .where(and(eq(leadTasks.id, input.id), eq(leadTasks.userId, userId)))
          .returning();

        return {
          success: true,
          task: updatedTask,
        };
      } catch (error) {
        console.error("Error updating task status:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task status",
        });
      }
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Check if task exists and belongs to the user
        const existingTaskResult = await db
          .select()
          .from(leadTasks)
          .where(and(eq(leadTasks.id, input.id), eq(leadTasks.userId, userId)))
          .limit(1);

        if (!existingTaskResult[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // Delete the task
        await db
          .delete(leadTasks)
          .where(and(eq(leadTasks.id, input.id), eq(leadTasks.userId, userId)));

        return {
          success: true,
          message: "Task deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting lead task:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete lead task",
        });
      }
    }),

  // Get upcoming tasks across all leads
  getUpcomingTasks: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(5),
        includeCompleted: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { limit, includeCompleted } = input;

        // Build status condition
        let statusCondition;
        if (!includeCompleted) {
          statusCondition = and(
            eq(leadTasks.userId, userId),
            sql`${leadTasks.status} != 'completado'`,
            sql`${leadTasks.status} != 'cancelado'`
          );
        } else {
          statusCondition = eq(leadTasks.userId, userId);
        }

        // Get upcoming tasks across all leads
        const tasks = await db
          .select({
            task: leadTasks,
            leadName: leads.name,
          })
          .from(leadTasks)
          .innerJoin(leads, eq(leadTasks.leadId, leads.id))
          .where(statusCondition)
          .orderBy(
            // First by status
            sql`CASE 
              WHEN ${leadTasks.status} = 'pendiente' THEN 1 
              WHEN ${leadTasks.status} = 'progreso' THEN 2
              WHEN ${leadTasks.status} = 'completado' THEN 3
              WHEN ${leadTasks.status} = 'cancelado' THEN 4
              ELSE 5 
            END`,
            // Then by priority
            sql`CASE 
              WHEN ${leadTasks.priority} = 'urgente' THEN 1 
              WHEN ${leadTasks.priority} = 'alta' THEN 2
              WHEN ${leadTasks.priority} = 'media' THEN 3
              WHEN ${leadTasks.priority} = 'baja' THEN 4
              ELSE 5 
            END`,
            // Then by due date (null dates at the end)
            sql`CASE 
              WHEN ${leadTasks.dueDate} IS NULL THEN 1 
              ELSE 0 
            END`,
            asc(leadTasks.dueDate),
            // Finally by created date
            desc(leadTasks.createdAt)
          )
          .limit(limit);

        return {
          success: true,
          tasks,
        };
      } catch (error) {
        console.error("Error fetching upcoming tasks:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch upcoming tasks",
        });
      }
    }),
});
