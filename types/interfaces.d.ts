interface TaskCardProps {
  task: LeadTask;
  onUpdateStatus: (id: string, status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  formatDueDate: (date: Date | null | undefined) => string;
  isDueSoon: (date: Date | null | undefined) => boolean;
  getPriorityBadge: (priority: string) => React.ReactNode;
  getStatusIcon: (status: string) => React.ReactNode;
}

interface EmptyTasksStateProps {
  message?: string;
  onCreateNew: () => void;
}
