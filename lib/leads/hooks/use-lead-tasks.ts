import { useState } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  CreateLeadTaskSchema,
  UpdateLeadTaskSchema,
  UpdateTaskStatusSchema,
} from "../validation/lead-tasks-schema";
import { taskStatusEnum } from "@/db/schema";
import { LeadTasks } from "@/types/leads";

/**
 * Hook for fetching tasks for a specific lead
 */
export function useLeadTasks(leadId: string, status?: string) {
  const { data, isLoading, isError, error, refetch } =
    trpc.leadTask.getByLeadId.useQuery(
      {
        leadId,
        status: status as (typeof taskStatusEnum.enumValues)[number],
      },
      {
        enabled: !!leadId,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    tasks: data?.tasks || [],
    tasksByStatus: data?.tasksByStatus || {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    },
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for creating a new task
 */
export function useCreateLeadTask() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadTask.create.useMutation({
    onSuccess: (data) => {
      // Invalidate queries to refetch tasks
      utils.leadTask.getByLeadId.invalidate({ leadId: data.task.leadId });
      utils.leadTask.getUpcomingTasks.invalidate();
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating task: ${error.message}`);
    },
  });

  const createTask = async (task: CreateLeadTaskSchema) => {
    try {
      return await mutation.mutateAsync(task as LeadTasks);
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  return {
    createTask,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for updating a task
 */
export function useUpdateLeadTask() {
  const utils = trpc.useUtils();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const mutation = trpc.leadTask.update.useMutation({
    onSuccess: (data) => {
      // Get the leadId from the response to invalidate the correct query
      const task = data.task;
      if (task.leadId) {
        utils.leadTask.getByLeadId.invalidate({ leadId: task.leadId });
      }
      utils.leadTask.getUpcomingTasks.invalidate();
      setEditingTaskId(null);
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating task: ${error.message}`);
    },
  });

  const updateTask = async (task: UpdateLeadTaskSchema) => {
    try {
      return await mutation.mutateAsync(task as LeadTasks);
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  return {
    updateTask,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    editingTaskId,
    setEditingTaskId,
  };
}

/**
 * Hook for quickly updating just the task status
 */
export function useUpdateTaskStatus() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadTask.updateStatus.useMutation({
    onSuccess: (data) => {
      // Get the leadId from the response to invalidate the correct query
      const task = data.task;
      if (task.leadId) {
        utils.leadTask.getByLeadId.invalidate({ leadId: task.leadId });
      }
      utils.leadTask.getUpcomingTasks.invalidate();

      // Show toast based on status change
      if (task.status === "completado") {
        toast.success("Task marked as completed");
      } else if (task.status === "progreso") {
        toast.success("Task marked as in progress");
      } else {
        toast.success("Task status updated");
      }
    },
    onError: (error) => {
      toast.error(`Error updating task status: ${error.message}`);
    },
  });

  const updateTaskStatus = async (taskUpdate: UpdateTaskStatusSchema) => {
    try {
      return await mutation.mutateAsync(taskUpdate);
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  };

  return {
    updateTaskStatus,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for deleting a task
 */
export function useDeleteLeadTask() {
  const utils = trpc.useUtils();

  const mutation = trpc.leadTask.delete.useMutation({
    onSuccess: () => {
      // We'll have to invalidate all tasks queries since we don't know the leadId
      utils.leadTask.getByLeadId.invalidate();
      utils.leadTask.getUpcomingTasks.invalidate();
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting task: ${error.message}`);
    },
  });

  const deleteTask = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  return {
    deleteTask,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for fetching upcoming tasks across all leads
 */
export function useUpcomingTasks(
  limit: number = 5,
  includeCompleted: boolean = false
) {
  const { data, isLoading, isError, error, refetch } =
    trpc.leadTask.getUpcomingTasks.useQuery(
      { limit, includeCompleted },
      {
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    tasks: data?.tasks || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
