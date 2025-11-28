import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  CheckCheck
} from "lucide-react";

type StatusType = 
  | "pending" 
  | "foreman_approved" 
  | "manager_approved" 
  | "rejected" 
  | "completed"
  | "active"
  | "expired"
  | "expiring_soon"
  | "not_started"
  | "in_progress"
  | "blocked";

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  size?: "sm" | "default";
}

const statusConfig: Record<StatusType, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
  },
  foreman_approved: {
    label: "Foreman Approved",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: CheckCircle2,
  },
  manager_approved: {
    label: "Manager Approved",
    variant: "secondary",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCheck,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    className: "",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    variant: "secondary",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  active: {
    label: "Active",
    variant: "secondary",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    variant: "destructive",
    className: "",
    icon: XCircle,
  },
  expiring_soon: {
    label: "Expiring Soon",
    variant: "secondary",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: AlertTriangle,
  },
  not_started: {
    label: "Not Started",
    variant: "outline",
    className: "",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Loader2,
  },
  blocked: {
    label: "Blocked",
    variant: "destructive",
    className: "",
    icon: AlertTriangle,
  },
};

export function StatusBadge({ status, showIcon = true, size = "default" }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "";

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClass} gap-1`}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      {config.label}
    </Badge>
  );
}
