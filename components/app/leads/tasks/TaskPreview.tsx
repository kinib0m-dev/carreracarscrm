"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Loader2, CalendarIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { trpc } from "@/trpc/client";
import { useUpdateTaskStatus } from "@/lib/leads/hooks/use-lead-tasks";
import { ExtendedLeadTasks, LeadTaskStatus } from "@/types/leads";

interface TasksPreviewProps {
  leadId: string;
}

export function TasksPreview({ leadId }: TasksPreviewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading, refetch } = trpc.leadTask.getByLeadId.useQuery(
    { leadId },
    {
      enabled: isMounted,
      staleTime: 30 * 1000,
    }
  );

  const { updateTaskStatus } = useUpdateTaskStatus();

  const tasks = data?.tasks || [];
  const activeTasks = tasks.filter(
    (task) => task.status === "pendiente" || task.status === "progreso"
  );

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateTaskStatus({
        id,
        status: status as LeadTaskStatus,
      });
      refetch();
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const formatDueDate = (date: Date | null | undefined) => {
    if (!date) return "";

    if (isToday(new Date(date))) {
      return "Today";
    } else if (isTomorrow(new Date(date))) {
      return "Tomorrow";
    } else {
      return format(new Date(date), "MMM d");
    }
  };

  const isDueSoon = (date: Date | null | undefined) => {
    if (!date) return false;
    const dueDate = new Date(date);
    const threeDaysFromNow = addDays(new Date(), 3);
    return isPast(dueDate) || dueDate <= threeDaysFromNow;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgente":
        return (
          <Badge variant="destructive" className="text-xs">
            Urgente
          </Badge>
        );
      case "alta":
        return <Badge className="bg-orange-600 text-xs">Alta</Badge>;
      case "media":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-600 text-xs"
          >
            Media
          </Badge>
        );
      case "baja":
        return (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Baja
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClockIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks assigned</h3>
            <p className="text-muted-foreground max-w-md">
              Create tasks to track follow-ups, deadlines, and actions needed
              for this lead.
            </p>
            <Button className="mt-4" asChild>
              <Link
                href={`/leads/${leadId}/tasks`}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Task
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only show active tasks (pending and in_progress) in the preview
  const previewTasks = activeTasks.slice(0, 3);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {previewTasks.map((task: ExtendedLeadTasks) => (
            <div
              key={task.id}
              className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0"
            >
              <Checkbox
                checked={task.status === "completado"}
                onCheckedChange={(checked) => {
                  handleUpdateStatus(
                    task.id,
                    checked ? "completado" : "pendiente"
                  );
                }}
                className="mt-1"
              />

              <div className="space-y-1 flex-1">
                <h4 className="font-medium text-sm">{task.title}</h4>

                <div className="flex flex-wrap gap-2 mt-1">
                  {task.status === "progreso" && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                    >
                      In Progress
                    </Badge>
                  )}

                  {task.dueDate && (
                    <div
                      className={`flex items-center text-xs ${
                        isDueSoon(task.dueDate)
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      <span>{formatDueDate(task.dueDate)}</span>
                    </div>
                  )}

                  {getPriorityBadge(task.priority)}
                </div>
              </div>
            </div>
          ))}

          {tasks.length > 3 && (
            <div className="text-center pt-2">
              <Button variant="outline" asChild>
                <Link href={`/leads/${leadId}/tasks`}>
                  View All Tasks ({tasks.length})
                </Link>
              </Button>
            </div>
          )}

          <div className="text-center pt-2">
            <Button asChild>
              <Link href={`/leads/${leadId}/tasks`}>Manage Tasks</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
