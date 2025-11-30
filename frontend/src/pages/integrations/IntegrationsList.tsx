import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Edit2, Trash2, TestTube } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  provider: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

export default function IntegrationsList() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      // Placeholder - would call /api/v1/integrations/configs
      setIntegrations([
        {
          id: "1",
          name: "SAP HR Sync",
          provider: "sap",
          type: "sync",
          is_active: true,
          created_at: "2024-11-30",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch integrations", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Placeholder - would call DELETE /api/v1/integrations/configs/{id}
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Integration
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration) => (
            <Card key={integration.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{integration.name}</h3>
                  <p className="text-sm text-gray-600">
                    {integration.provider.toUpperCase()} ({integration.type})
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost">
                    <TestTube className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(integration.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
