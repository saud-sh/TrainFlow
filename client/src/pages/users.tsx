import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  Users,
  Search,
  Edit,
  Clock,
  Shield,
  Plus,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import type { User, UserRole, InsertUser } from "@shared/schema";

const roleOptions: { value: UserRole; label: string; color: string }[] = [
  { value: "employee", label: "Employee", color: "bg-chart-1/10 text-chart-1" },
  { value: "foreman", label: "Foreman", color: "bg-chart-2/10 text-chart-2" },
  { value: "manager", label: "Manager", color: "bg-chart-3/10 text-chart-3" },
  { value: "training_officer", label: "Training Officer", color: "bg-chart-4/10 text-chart-4" },
  { value: "administrator", label: "Administrator", color: "bg-chart-5/10 text-chart-5" },
];

function getRoleBadge(role: UserRole) {
  const option = roleOptions.find((r) => r.value === role);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${option?.color || ""}`}>
      {option?.label || role}
    </span>
  );
}

export default function UserManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");

  // Create User State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<InsertUser>>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: string; role: UserRole }) => {
      return apiRequest("PATCH", `/api/users/${data.id}/role`, { role: data.role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      setSelectedRole("");
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: Partial<InsertUser>) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateOpen(false);
      setNewUser({ firstName: "", lastName: "", email: "", password: "", role: "employee" });
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    employees: users.filter((u) => u.role === "employee").length,
    supervisors: users.filter((u) => u.role === "foreman" || u.role === "manager").length,
    admins: users.filter((u) => u.role === "training_officer" || u.role === "administrator").length,
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleCreateSave = () => {
    createUserMutation.mutate(newUser);
  };

  const handleSave = () => {
    if (editingUser && selectedRole) {
      updateRoleMutation.mutate({ id: editingUser.id, role: selectedRole });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user accounts and role assignments
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="btn-add-user">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-1">{stats.employees}</div>
            <p className="text-sm text-muted-foreground">Employees</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-2">{stats.supervisors}</div>
            <p className="text-sm text-muted-foreground">Supervisors</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-4">{stats.admins}</div>
            <p className="text-sm text-muted-foreground">Admin Staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-users"
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "user",
              header: "User",
              cell: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={row.profileImageUrl || undefined}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {row.firstName?.[0]}
                      {row.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {row.email}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "role",
              header: "Role",
              cell: (row) => getRoleBadge(row.role),
            },
            {
              key: "jobTitle",
              header: "Job Title",
              cell: (row) => row.jobTitle || "-",
            },
            {
              key: "grade",
              header: "Grade",
              cell: (row) => row.currentGrade || "-",
            },
            {
              key: "joined",
              header: "Joined",
              cell: (row) =>
                row.createdAt
                  ? format(new Date(row.createdAt), "MMM d, yyyy")
                  : "-",
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => (
                <Badge variant={row.isActive ? "secondary" : "outline"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              cell: (row) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(row);
                    }}
                    data-testid={`button-edit-${row.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row.id);
                    }}
                    data-testid={`button-delete-${row.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
              className: "text-right",
            },
          ]}
          data={filteredUsers}
          emptyMessage="No users found"
        />
      )}

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName || ""}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName || ""}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email || ""}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password || ""}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSave}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role for {editingUser?.firstName} {editingUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={editingUser?.profileImageUrl || undefined}
                  className="object-cover"
                />
                <AvatarFallback>
                  {editingUser?.firstName?.[0]}
                  {editingUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {editingUser?.firstName} {editingUser?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {editingUser?.email}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as UserRole)}
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedRole || updateRoleMutation.isPending}
              data-testid="button-save-role"
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
