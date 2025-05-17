"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import {
  useLeadTasks,
  useCreateLeadTask,
  useUpdateLeadTask,
  useUpdateTaskStatus,
  useDeleteLeadTask,
} from "@/lib/leads/hooks/use-lead-tasks";
import {
  Loader2,
  CheckCircle,
  ClockIcon,
  CalendarIcon,
  PlayCircle,
  XCircle,
  Plus,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExtendedLeadTasks,
  LeadTaskPriority,
  LeadTaskStatus,
} from "@/types/leads";

interface LeadTasksViewProps {
  leadId: string;
}

export function LeadTasksView({ leadId }: LeadTasksViewProps) {
  const [activeTab, setActiveTab] = useState<string>("active");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<ExtendedLeadTasks | null>(
    null
  );
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  // Filter for active tasks (pending and in_progress)
  const activeTasksFilter = activeTab === "active" ? undefined : activeTab;

  const { tasksByStatus, isLoading, refetch } = useLeadTasks(
    leadId,
    activeTasksFilter
  );
  const { createTask, isLoading: isCreating } = useCreateLeadTask();
  const { updateTask, isLoading: isUpdating } = useUpdateLeadTask();
  const { updateTaskStatus } = useUpdateTaskStatus();
  const { deleteTask, isLoading: isDeleting } = useDeleteLeadTask();

  const handleCreateTask = async () => {
    try {
      await createTask({
        leadId,
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority as LeadTaskPriority,
        dueDate: (newTask.dueDate as unknown as Date) || undefined,
        status: "pendiente",
      });

      // Reset form and close dialog
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
      setIsNewTaskOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editTaskData) return;

    try {
      await updateTask({
        id: editTaskData.id,
        title: editTaskData.title,
        description: editTaskData.description || undefined,
        priority: editTaskData.priority as LeadTaskPriority,
        status: editTaskData.status as LeadTaskStatus,
        dueDate: editTaskData.dueDate || undefined,
      });

      // Reset form and close dialog
      setEditTaskData(null);
      refetch();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: string) => {
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

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      await deleteTask(deleteTaskId);
      setDeleteTaskId(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const formatDueDate = (date: Date | null | undefined) => {
    if (!date) return "No due date";

    if (isToday(new Date(date))) {
      return "Today";
    } else if (isTomorrow(new Date(date))) {
      return "Tomorrow";
    } else {
      return format(new Date(date), "PPP");
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
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-600">High</Badge>;
      case "medium":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4 text-amber-500" />;
      case "in_progress":
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <TasksLoader />;
  }

  const { pending, in_progress, completed, cancelled } = tasksByStatus;
  const activeTasks = [...pending, ...in_progress];

  return (
    <div className="space-y-6">
      {/* Tabs for filtering tasks by status */}
      <Tabs
        defaultValue="active"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active" className="relative">
              Active
              {activeTasks.length > 0 && (
                <Badge className="ml-2 bg-primary text-xs h-5 min-w-5 px-1">
                  {activeTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <Button onClick={() => setIsNewTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Task Lists */}
        <TabsContent value="active" className="mt-0">
          {activeTasks.length === 0 ? (
            <EmptyTasksState onCreateNew={() => setIsNewTaskOpen(true)} />
          ) : (
            <div className="space-y-4">
              {activeTasks.map((task: ExtendedLeadTasks) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onEdit={() => setEditTaskData({ ...task })}
                  onDelete={() => setDeleteTaskId(task.id)}
                  formatDueDate={formatDueDate}
                  isDueSoon={isDueSoon}
                  getPriorityBadge={getPriorityBadge}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          {pending.length === 0 ? (
            <EmptyTasksState
              message="No pending tasks"
              onCreateNew={() => setIsNewTaskOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {pending.map((task: ExtendedLeadTasks) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onEdit={() => setEditTaskData({ ...task })}
                  onDelete={() => setDeleteTaskId(task.id)}
                  formatDueDate={formatDueDate}
                  isDueSoon={isDueSoon}
                  getPriorityBadge={getPriorityBadge}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="mt-0">
          {in_progress.length === 0 ? (
            <EmptyTasksState
              message="No tasks in progress"
              onCreateNew={() => setIsNewTaskOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {in_progress.map((task: ExtendedLeadTasks) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onEdit={() => setEditTaskData({ ...task })}
                  onDelete={() => setDeleteTaskId(task.id)}
                  formatDueDate={formatDueDate}
                  isDueSoon={isDueSoon}
                  getPriorityBadge={getPriorityBadge}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {completed.length === 0 ? (
            <EmptyTasksState
              message="No completed tasks"
              onCreateNew={() => setIsNewTaskOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {completed.map((task: ExtendedLeadTasks) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onEdit={() => setEditTaskData({ ...task })}
                  onDelete={() => setDeleteTaskId(task.id)}
                  formatDueDate={formatDueDate}
                  isDueSoon={isDueSoon}
                  getPriorityBadge={getPriorityBadge}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-0">
          {cancelled.length === 0 ? (
            <EmptyTasksState
              message="No cancelled tasks"
              onCreateNew={() => setIsNewTaskOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {cancelled.map((task: ExtendedLeadTasks) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onEdit={() => setEditTaskData({ ...task })}
                  onDelete={() => setDeleteTaskId(task.id)}
                  formatDueDate={formatDueDate}
                  isDueSoon={isDueSoon}
                  getPriorityBadge={getPriorityBadge}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create New Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task for this lead to track follow-ups and actions
              needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Task Title *
              </label>
              <Input
                id="title"
                placeholder="Follow up with client"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Details about the task..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Due Date
                </label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTaskOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={isCreating || !newTask.title.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={!!editTaskData}
        onOpenChange={(open) => !open && setEditTaskData(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and status.
            </DialogDescription>
          </DialogHeader>

          {editTaskData && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Task Title *
                </label>
                <Input
                  id="edit-title"
                  placeholder="Follow up with client"
                  value={editTaskData.title}
                  onChange={(e) =>
                    setEditTaskData({ ...editTaskData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Textarea
                  id="edit-description"
                  placeholder="Details about the task..."
                  value={editTaskData.description || ""}
                  onChange={(e) =>
                    setEditTaskData({
                      ...editTaskData,
                      description: e.target.value,
                    })
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label
                    htmlFor="edit-priority"
                    className="text-sm font-medium"
                  >
                    Priority
                  </label>
                  <Select
                    value={editTaskData.priority}
                    onValueChange={(value) =>
                      setEditTaskData({
                        ...editTaskData,
                        priority: value as LeadTaskPriority,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex-1">
                  <label htmlFor="edit-status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select
                    value={editTaskData.status}
                    onValueChange={(value) =>
                      setEditTaskData({
                        ...editTaskData,
                        status: value as LeadTaskStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-dueDate" className="text-sm font-medium">
                  Due Date
                </label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={
                    editTaskData.dueDate
                      ? new Date(editTaskData.dueDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setEditTaskData({
                      ...editTaskData,
                      dueDate: e.target.value as unknown as Date,
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTaskData(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTask}
              disabled={isUpdating || !editTaskData?.title.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onUpdateStatus,
  onEdit,
  onDelete,
  formatDueDate,
  isDueSoon,
  getPriorityBadge,
  getStatusIcon,
}: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";
  const isPending = task.status === "pending";
  const isInProgress = task.status === "in_progress";

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Checkbox for quick completion */}
            {!isCancelled && (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => {
                  onUpdateStatus(task.id, checked ? "completed" : "pending");
                }}
                className="mt-1"
              />
            )}

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3
                  className={`font-medium ${isCompleted || isCancelled ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </h3>
              </div>

              {task.description && (
                <p
                  className={`text-sm ${isCompleted || isCancelled ? "text-muted-foreground" : ""}`}
                >
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  {getStatusIcon(task.status)}
                  <span className="ml-1 capitalize">
                    {task.status.replace("_", " ")}
                  </span>
                </div>

                {task.dueDate && (
                  <div
                    className={`flex items-center text-xs ${
                      isDueSoon(task.dueDate) && !isCompleted && !isCancelled
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span>{formatDueDate(task.dueDate)}</span>
                  </div>
                )}

                <div>{getPriorityBadge(task.priority)}</div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPending && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(task.id, "in_progress")}
                >
                  Mark as In Progress
                </DropdownMenuItem>
              )}
              {isInProgress && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(task.id, "completed")}
                >
                  Mark as Completed
                </DropdownMenuItem>
              )}
              {(isPending || isInProgress) && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(task.id, "cancelled")}
                >
                  Mark as Cancelled
                </DropdownMenuItem>
              )}
              {(isCompleted || isCancelled) && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(task.id, "pending")}
                >
                  Reopen Task
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit}>Edit Task</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyTasksState({
  message = "No tasks yet",
  onCreateNew,
}: EmptyTasksStateProps) {
  return (
    <div className="text-center py-12 border rounded-lg">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ClockIcon className="h-8 w-8 text-primary/60" />
        </div>
        <h3 className="text-lg font-medium">{message}</h3>
        <p className="text-muted-foreground max-w-sm">
          Create tasks to keep track of follow-ups, deadlines, and actions
          needed for this lead.
        </p>
        <Button className="mt-2" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Task
        </Button>
      </div>
    </div>
  );
}

function TasksLoader() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 mt-1 rounded-sm" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
