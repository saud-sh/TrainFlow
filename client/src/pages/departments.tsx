import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Plus, Pencil, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import type { Department } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Departments() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      const res = await apiRequest("POST", "/api/departments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Department created successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create department.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; code: string }) => {
      const res = await apiRequest("PATCH", `/api/departments/${data.id}`, {
        name: data.name,
        code: data.code,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Department updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update department.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Success", description: "Department deleted successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete department.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEditingDept(null);
    setFormData({ name: "", code: "" });
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, code: dept.code });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this department?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (editingDept) {
      updateMutation.mutate({ ...formData, id: editingDept.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage organizational structure and departments
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="btn-create-dept">
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments?.map((dept) => (
          <Card key={dept.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{dept.name}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-primary mb-4">{dept.code}</div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center">
                  <span className="text-xs">Created: {format(new Date(dept.createdAt || new Date()), "MMM d, yyyy")}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(dept)}
                    data-testid={`btn-edit-${dept.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(dept.id)}
                    data-testid={`btn-delete-${dept.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {departments?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No departments found. Create one to get started.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm() || setIsDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "New Department"}</DialogTitle>
            <DialogDescription>
              {editingDept ? "Update department details." : "Add a new department to the organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Human Resources"
                data-testid="input-dept-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Department Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. HR"
                data-testid="input-dept-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="btn-save-dept">
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
