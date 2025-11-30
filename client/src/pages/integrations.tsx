import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database, 
  ArrowRightLeft,
  RefreshCw,
  Server,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

export default function Integrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: integrationStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{
    status: string;
    supportedFormats: {
      sap: { employees: { export: boolean; import: boolean }; training: { export: boolean; import: boolean } };
      oracle: { certifications: { export: boolean; import: boolean }; training: { export: boolean; import: boolean } };
    };
    recentActivity: {
      exports: Array<{ type: string; timestamp: string; recordCount: number }>;
      imports: Array<{ type: string; timestamp: string; results: Record<string, number> }>;
    };
    lastChecked: string;
  }>({
    queryKey: ["/api/integration/status"],
    enabled: user?.role === "administrator",
  });
  
  const exportSAPEmployees = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/integration/sap/employees", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      return response.json();
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sap_employees_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Exported ${data.recordCount} employee records in SAP format.`,
      });
      refetchStatus();
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export employees in SAP format.",
        variant: "destructive",
      });
    },
  });
  
  const exportSAPTraining = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/integration/sap/training", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      return response.json();
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sap_training_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Exported ${data.recordCount} training records in SAP format.`,
      });
      refetchStatus();
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export training records in SAP format.",
        variant: "destructive",
      });
    },
  });
  
  const exportOracleCertifications = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/integration/oracle/certifications", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      return response.json();
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `oracle_certifications_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Exported ${data.recordCount} certification records in Oracle HCM format.`,
      });
      refetchStatus();
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export certifications in Oracle format.",
        variant: "destructive",
      });
    },
  });
  
  if (user?.role !== "administrator") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Integration management is only available to administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (statusLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Enterprise Integrations
          </h1>
          <p className="text-muted-foreground">
            SAP and Oracle HCM data synchronization
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetchStatus()}
          data-testid="button-refresh-status"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {integrationStatus?.status === "healthy" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">Healthy</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-lg font-semibold text-red-600">Degraded</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last checked: {integrationStatus?.lastChecked 
                ? format(new Date(integrationStatus.lastChecked), "MMM dd, yyyy h:mm a")
                : "Never"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Recent Exports</CardTitle>
            <Download className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-export-count">
              {integrationStatus?.recentActivity?.exports?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Exports in the last session
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Recent Imports</CardTitle>
            <Upload className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-import-count">
              {integrationStatus?.recentActivity?.imports?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Imports in the last session
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="sap" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sap" data-testid="tab-sap">SAP Integration</TabsTrigger>
          <TabsTrigger value="oracle" data-testid="tab-oracle">Oracle HCM</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sap" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Employee Master Data
                </CardTitle>
                <CardDescription>
                  SAP HR Infotype 0001 format for employee records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    <ArrowRightLeft className="w-3 h-3 mr-1" />
                    Bidirectional
                  </Badge>
                  <Badge variant="secondary">JSON/XML</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => exportSAPEmployees.mutate()}
                    disabled={exportSAPEmployees.isPending}
                    data-testid="button-export-sap-employees"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportSAPEmployees.isPending ? "Exporting..." : "Export Employees"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Training Records
                </CardTitle>
                <CardDescription>
                  SAP Training & Event Management (TEM) format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    <Download className="w-3 h-3 mr-1" />
                    Export Only
                  </Badge>
                  <Badge variant="secondary">JSON/XML</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => exportSAPTraining.mutate()}
                    disabled={exportSAPTraining.isPending}
                    data-testid="button-export-sap-training"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportSAPTraining.isPending ? "Exporting..." : "Export Training"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="oracle" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Certifications
                </CardTitle>
                <CardDescription>
                  Oracle HCM Cloud Certifications format (v22A)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    <Download className="w-3 h-3 mr-1" />
                    Export Only
                  </Badge>
                  <Badge variant="secondary">JSON</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => exportOracleCertifications.mutate()}
                    disabled={exportOracleCertifications.isPending}
                    data-testid="button-export-oracle-certs"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportOracleCertifications.isPending ? "Exporting..." : "Export Certifications"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Training Import
                </CardTitle>
                <CardDescription>
                  Import training completions from Oracle HCM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    <Upload className="w-3 h-3 mr-1" />
                    Import Only
                  </Badge>
                  <Badge variant="secondary">JSON</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use the API endpoint to import training records programmatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Integration Activity</CardTitle>
              <CardDescription>
                Last 5 export and import operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrationStatus?.recentActivity?.exports?.length === 0 &&
                 integrationStatus?.recentActivity?.imports?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No recent integration activity
                  </p>
                ) : (
                  <>
                    {integrationStatus?.recentActivity?.exports?.map((exp, idx) => (
                      <div 
                        key={`export-${idx}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{exp.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {exp.timestamp 
                                ? format(new Date(exp.timestamp), "MMM dd, yyyy h:mm a")
                                : "Unknown time"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{exp.recordCount} records</Badge>
                      </div>
                    ))}
                    {integrationStatus?.recentActivity?.imports?.map((imp, idx) => (
                      <div 
                        key={`import-${idx}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Upload className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="font-medium text-sm">{imp.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {imp.timestamp 
                                ? format(new Date(imp.timestamp), "MMM dd, yyyy h:mm a")
                                : "Unknown time"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {Object.entries(imp.results || {}).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
