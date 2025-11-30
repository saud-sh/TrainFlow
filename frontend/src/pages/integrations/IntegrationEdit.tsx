import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TestTube, Save } from "lucide-react";

export default function IntegrationEdit() {
  const [name, setName] = useState("SAP HR Sync");
  const [description, setDescription] = useState("Sync user data from SAP HR");
  const [isActive, setIsActive] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  const handleTestConnection = async () => {
    setTestingConnection(true);
    // Placeholder - would call POST /api/v1/integrations/{id}/test-connection
    setTimeout(() => {
      setConnectionStatus("success");
      setTestingConnection(false);
    }, 2000);
  };

  const handleSave = async () => {
    // Placeholder - would call PATCH /api/v1/integrations/{id}
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Integration</h1>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active</label>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connection</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">API Endpoint</label>
              <Input
                placeholder="https://api.sap.com/v1"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Credentials</label>
              <Input
                type="password"
                placeholder="••••••••"
                disabled
              />
            </div>

            <Button
              onClick={handleTestConnection}
              disabled={testingConnection}
              variant="outline"
              className="gap-2"
            >
              <TestTube className="w-4 h-4" />
              {testingConnection ? "Testing..." : "Test Connection"}
            </Button>

            {connectionStatus === "success" && (
              <p className="text-green-600 text-sm">✓ Connection successful</p>
            )}
            {connectionStatus === "error" && (
              <p className="text-red-600 text-sm">✗ Connection failed</p>
            )}
          </div>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleSave} className="flex-1 gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
          <Button variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
