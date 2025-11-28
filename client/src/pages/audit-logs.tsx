import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { 
  History, 
  Search, 
  Filter,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Send
} from "lucide-react";
import { format } from "date-fns";
import type { AuditLog, User } from "@shared/schema";

interface AuditLogWithUser extends AuditLog {
  user?: User;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-chart-2" />,
  update: <Edit className="h-4 w-4 text-chart-1" />,
  delete: <Trash2 className="h-4 w-4 text-destructive" />,
  login: <LogIn className="h-4 w-4 text-chart-4" />,
  logout: <LogOut className="h-4 w-4 text-muted-foreground" />,
  approve: <CheckCircle2 className="h-4 w-4 text-chart-2" />,
  reject: <XCircle className="h-4 w-4 text-destructive" />,
  submit: <Send className="h-4 w-4 text-chart-3" />,
};

const actionLabels: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  login: "Logged In",
  logout: "Logged Out",
  approve: "Approved",
  reject: "Rejected",
  submit: "Submitted",
};

const entityLabels: Record<string, string> = {
  user: "User",
  course: "Course",
  enrollment: "Enrollment",
  renewal_request: "Renewal Request",
  notification: "Notification",
  progression_task: "Progression Task",
  department: "Department",
};

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery<AuditLogWithUser[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueEntities = [...new Set(logs.map((l) => l.entityType))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="h-6 w-6" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          View all system activity and changes
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-logs"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40" data-testid="filter-action">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {actionLabels[action] || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40" data-testid="filter-entity">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {uniqueEntities.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {entityLabels[entity] || entity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-sm text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-2">
              {logs.filter((l) => l.action === "create").length}
            </div>
            <p className="text-sm text-muted-foreground">Creates</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-1">
              {logs.filter((l) => l.action === "update").length}
            </div>
            <p className="text-sm text-muted-foreground">Updates</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-4">
              {logs.filter((l) => l.action === "login").length}
            </div>
            <p className="text-sm text-muted-foreground">Logins</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "timestamp",
              header: "Timestamp",
              cell: (row) => (
                <div className="text-sm">
                  <p>{row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "-"}</p>
                  <p className="text-muted-foreground">
                    {row.createdAt ? format(new Date(row.createdAt), "h:mm:ss a") : ""}
                  </p>
                </div>
              ),
            },
            {
              key: "user",
              header: "User",
              cell: (row) =>
                row.user ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={row.user.profileImageUrl || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs">
                        {row.user.firstName?.[0]}
                        {row.user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {row.user.firstName} {row.user.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">System</span>
                ),
            },
            {
              key: "action",
              header: "Action",
              cell: (row) => (
                <div className="flex items-center gap-2">
                  {actionIcons[row.action]}
                  <span className="text-sm font-medium">
                    {actionLabels[row.action] || row.action}
                  </span>
                </div>
              ),
            },
            {
              key: "entity",
              header: "Entity",
              cell: (row) => (
                <div className="text-sm">
                  <p>{entityLabels[row.entityType] || row.entityType}</p>
                  {row.entityId && (
                    <p className="text-muted-foreground font-mono text-xs">
                      ID: {row.entityId}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "ip",
              header: "IP Address",
              cell: (row) => (
                <span className="text-sm font-mono text-muted-foreground">
                  {row.ipAddress || "-"}
                </span>
              ),
            },
          ]}
          data={filteredLogs}
          emptyMessage="No audit logs found"
        />
      )}
    </div>
  );
}
