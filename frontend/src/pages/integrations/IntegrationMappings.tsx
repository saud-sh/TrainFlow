import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Mapping {
  id: string;
  source_field: string;
  target_field: string;
  transform_function?: string;
}

export default function IntegrationMappings() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [sourceField, setSourceField] = useState("");
  const [targetField, setTargetField] = useState("");
  const [transformFunction, setTransformFunction] = useState("");

  const handleAddMapping = () => {
    if (sourceField && targetField) {
      const newMapping: Mapping = {
        id: Date.now().toString(),
        source_field: sourceField,
        target_field: targetField,
        transform_function: transformFunction || undefined,
      };
      setMappings([...mappings, newMapping]);
      setSourceField("");
      setTargetField("");
      setTransformFunction("");
    }
  };

  const handleDelete = (id: string) => {
    setMappings(mappings.filter((m) => m.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Field Mappings</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Mapping</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Source Field"
            value={sourceField}
            onChange={(e) => setSourceField(e.target.value)}
          />
          <Input
            placeholder="Target Field"
            value={targetField}
            onChange={(e) => setTargetField(e.target.value)}
          />
          <Input
            placeholder="Transform (optional)"
            value={transformFunction}
            onChange={(e) => setTransformFunction(e.target.value)}
          />
        </div>
        <Button onClick={handleAddMapping} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Mapping
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Mappings</h2>
        {mappings.length === 0 ? (
          <p className="text-gray-500">No mappings configured yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Field</TableHead>
                <TableHead>Target Field</TableHead>
                <TableHead>Transform</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>{mapping.source_field}</TableCell>
                  <TableCell>{mapping.target_field}</TableCell>
                  <TableCell>{mapping.transform_function || "-"}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(mapping.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
