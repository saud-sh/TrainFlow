import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText,
  ArrowRight,
  User
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "pending" | "rejected" | "current";
  user?: {
    name: string;
    avatar?: string;
  };
  timestamp?: Date | string;
  comments?: string;
}

interface WorkflowTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

function getStepIcon(status: TimelineStep["status"]) {
  switch (status) {
    case "completed":
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
      );
    case "rejected":
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
      );
    case "current":
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center animate-pulse">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      );
  }
}

export function WorkflowTimeline({ steps, className = "" }: WorkflowTimelineProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex gap-4">
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="absolute left-4 top-10 w-0.5 h-full -translate-x-1/2 bg-border" />
          )}

          {/* Icon */}
          <div className="flex-shrink-0 z-10">{getStepIcon(step.status)}</div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{step.title}</h4>
              {step.status === "current" && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  Awaiting Action
                </span>
              )}
            </div>

            {step.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {step.description}
              </p>
            )}

            {step.user && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={step.user.avatar} className="object-cover" />
                  <AvatarFallback className="text-xs">
                    {step.user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {step.user.name}
                </span>
              </div>
            )}

            {step.comments && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                <p className="text-muted-foreground italic">"{step.comments}"</p>
              </div>
            )}

            {step.timestamp && (
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(step.timestamp), "MMM d, yyyy 'at' h:mm a")}
                {" · "}
                {formatDistanceToNow(new Date(step.timestamp), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Visual progress steps for approval workflow
interface ProgressStepsProps {
  currentStep: number;
  steps: string[];
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentStep
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-xs mt-1 text-center ${
              index <= currentStep ? "text-foreground" : "text-muted-foreground"
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-12 sm:w-20 mx-2 ${
                index < currentStep ? "bg-green-500" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
