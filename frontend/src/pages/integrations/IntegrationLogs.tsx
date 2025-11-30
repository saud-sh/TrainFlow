import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Log {
  id: string;
  status: "success" | "error";
  message: string;
  created_at: string;
}

export default function IntegrationLogs() {
  const [logs, setLogs] = useState<Log[]>([
    {
      id: "1",
      status: "success",
      message: "Sync completed successfully. 150 records imported.",
      created_at: "2024-11-30 10:30:00",
    },
    {
      id: "2",
      status: "error",
      message: "Connection timeout. Please check credentials.",
      created_at: "2024-11-30 09:15:00",
    },
  ]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Integration Logs</h1>

      <Card className="p-6">
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs available</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.status === "success" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Success
                          </Badge>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <Badge variant="destructive">Error</Badge>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{log.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
