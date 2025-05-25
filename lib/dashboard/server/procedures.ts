import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { leads, carStock, emailHistory, leadTasks } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { sql, eq, and, gte, lt } from "drizzle-orm";
import { getCarTypeLabel, getStatusLabel } from "../utils/dashboard-utils";

export const dashboardRouter = createTRPCRouter({
  // Get dashboard overview metrics
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.userId as string;

      // Get current date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // 1. Leads Overview
      const [totalLeads] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads);

      const [newLeadsThisMonth] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(gte(leads.createdAt, startOfMonth));

      const [newLeadsLastMonth] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(
          and(
            gte(leads.createdAt, startOfLastMonth),
            lt(leads.createdAt, endOfLastMonth)
          )
        );

      // 2. Conversion Metrics
      const [closedDeals] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(eq(leads.status, "comprador"));

      const [activeLeads] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(
          sql`${leads.status} IN ('activo', 'calificado', 'propuesta', 'evaluando', 'manager', 'iniciado', 'documentacion')`
        );

      // 3. Stock Overview
      const [totalStock] = await db
        .select({ count: sql<number>`count(*)` })
        .from(carStock);

      const [soldCars] = await db
        .select({ count: sql<number>`count(*)` })
        .from(carStock)
        .where(eq(carStock.vendido, true));

      const [availableCars] = await db
        .select({ count: sql<number>`count(*)` })
        .from(carStock)
        .where(eq(carStock.vendido, false));

      const [soldCarsThisMonth] = await db
        .select({ count: sql<number>`count(*)` })
        .from(carStock)
        .where(
          and(eq(carStock.vendido, true), gte(carStock.updatedAt, startOfMonth))
        );

      // 4. Task Overview
      const [pendingTasks] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leadTasks)
        .where(
          and(
            eq(leadTasks.userId, userId),
            sql`${leadTasks.status} IN ('pendiente', 'progreso')`
          )
        );

      const [overdueTasks] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leadTasks)
        .where(
          and(
            eq(leadTasks.userId, userId),
            eq(leadTasks.status, "pendiente"),
            lt(leadTasks.dueDate, now)
          )
        );

      // 5. Email Campaign Overview
      const [emailsSentThisMonth] = await db
        .select({
          count: sql<number>`COALESCE(SUM(${emailHistory.sentCount}), 0)`,
        })
        .from(emailHistory)
        .where(
          and(
            eq(emailHistory.userId, userId),
            gte(emailHistory.sentAt, startOfMonth)
          )
        );

      // Calculate metrics
      const totalLeadsCount = Number(totalLeads.count) || 0;
      const newLeadsThisMonthCount = Number(newLeadsThisMonth.count) || 0;
      const newLeadsLastMonthCount = Number(newLeadsLastMonth.count) || 0;
      const closedDealsCount = Number(closedDeals.count) || 0;
      const activeLeadsCount = Number(activeLeads.count) || 0;
      const totalStockCount = Number(totalStock.count) || 0;
      const soldCarsCount = Number(soldCars.count) || 0;
      const availableCarsCount = Number(availableCars.count) || 0;
      const soldCarsThisMonthCount = Number(soldCarsThisMonth.count) || 0;
      const pendingTasksCount = Number(pendingTasks.count) || 0;
      const overdueTasksCount = Number(overdueTasks.count) || 0;
      const emailsSentThisMonthCount = Number(emailsSentThisMonth.count) || 0;

      // Calculate conversion rate
      const conversionRate =
        totalLeadsCount > 0 ? (closedDealsCount / totalLeadsCount) * 100 : 0;

      // Calculate stock sold percentage
      const stockSoldPercentage =
        totalStockCount > 0 ? (soldCarsCount / totalStockCount) * 100 : 0;

      // Calculate month-over-month growth
      const leadsGrowth =
        newLeadsLastMonthCount > 0
          ? ((newLeadsThisMonthCount - newLeadsLastMonthCount) /
              newLeadsLastMonthCount) *
            100
          : newLeadsThisMonthCount > 0
            ? 100
            : 0;

      return {
        success: true,
        overview: {
          leads: {
            total: totalLeadsCount,
            newThisMonth: newLeadsThisMonthCount,
            active: activeLeadsCount,
            closed: closedDealsCount,
            conversionRate: Math.round(conversionRate * 100) / 100,
            monthlyGrowth: Math.round(leadsGrowth * 100) / 100,
          },
          stock: {
            total: totalStockCount,
            available: availableCarsCount,
            sold: soldCarsCount,
            soldThisMonth: soldCarsThisMonthCount,
            soldPercentage: Math.round(stockSoldPercentage * 100) / 100,
          },
          tasks: {
            pending: pendingTasksCount,
            overdue: overdueTasksCount,
          },
          emails: {
            sentThisMonth: emailsSentThisMonthCount,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard overview",
      });
    }
  }),

  // Get leads by status distribution
  getLeadsDistribution: protectedProcedure.query(async () => {
    try {
      const leadsDistribution = await db
        .select({
          status: leads.status,
          count: sql<number>`count(*)`,
        })
        .from(leads)
        .groupBy(leads.status);

      // Format for chart consumption
      const formattedDistribution = leadsDistribution.map((item) => ({
        status: item.status,
        count: Number(item.count),
        // Add Spanish labels for better UX
        label: getStatusLabel(item.status),
      }));

      return {
        success: true,
        distribution: formattedDistribution,
      };
    } catch (error) {
      console.error("Error fetching leads distribution:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch leads distribution",
      });
    }
  }),

  // Get stock by type distribution
  getStockDistribution: protectedProcedure.query(async () => {
    try {
      const stockDistribution = await db
        .select({
          type: carStock.type,
          total: sql<number>`count(*)`,
          available: sql<number>`count(*) FILTER (WHERE ${carStock.vendido} = false)`,
          sold: sql<number>`count(*) FILTER (WHERE ${carStock.vendido} = true)`,
        })
        .from(carStock)
        .groupBy(carStock.type);

      const formattedDistribution = stockDistribution.map((item) => ({
        type: item.type,
        total: Number(item.total),
        available: Number(item.available),
        sold: Number(item.sold),
        label: getCarTypeLabel(item.type),
      }));

      return {
        success: true,
        distribution: formattedDistribution,
      };
    } catch (error) {
      console.error("Error fetching stock distribution:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch stock distribution",
      });
    }
  }),

  // Get monthly trends for leads and sales
  getMonthlyTrends: protectedProcedure.query(async () => {
    try {
      // Get last 6 months of data
      const monthsData = [];
      const currentDate = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const nextMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i + 1,
          1
        );

        const [newLeads] = await db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(
            and(gte(leads.createdAt, date), lt(leads.createdAt, nextMonth))
          );

        const [closedDeals] = await db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(
            and(
              eq(leads.status, "comprador"),
              gte(leads.updatedAt, date),
              lt(leads.updatedAt, nextMonth)
            )
          );

        const [soldCars] = await db
          .select({ count: sql<number>`count(*)` })
          .from(carStock)
          .where(
            and(
              eq(carStock.vendido, true),
              gte(carStock.updatedAt, date),
              lt(carStock.updatedAt, nextMonth)
            )
          );

        monthsData.push({
          month: date.toLocaleDateString("es-ES", {
            month: "short",
            year: "numeric",
          }),
          newLeads: Number(newLeads.count),
          closedDeals: Number(closedDeals.count),
          soldCars: Number(soldCars.count),
        });
      }

      return {
        success: true,
        trends: monthsData,
      };
    } catch (error) {
      console.error("Error fetching monthly trends:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch monthly trends",
      });
    }
  }),
});
