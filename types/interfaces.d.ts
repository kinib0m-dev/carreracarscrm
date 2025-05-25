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

interface FacebookWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: string;
      value: FacebookLeadgenValue;
    }>;
  }>;
}

// Lead Generation Event Value
interface FacebookLeadgenValue {
  leadgen_id: string;
  form_id: string;
  page_id: string;
  created_time: number;
  ad_id?: string;
  ad_name?: string;
  adgroup_id?: string;
  adgroup_name?: string;
}

// Lead Form Field Data
interface FacebookLeadField {
  name: string;
  values: string[];
}

// Facebook Lead Structure
interface FacebookLead {
  id: string;
  form_id: string;
  field_data: FacebookLeadField[];
  created_time: string;
  page_id: string;
  adgroup_id?: string;
  ad_id?: string;
}

// Lead Processing Result
interface LeadProcessingResult {
  success: boolean;
  leadId?: string;
  message?: string;
  error?: string;
}
