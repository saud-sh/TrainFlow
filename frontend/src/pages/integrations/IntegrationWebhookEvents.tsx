import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Clock } from "lucide-react";

interface WebhookEvent {
  id: string;
  event_type: string;
  data: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export default function IntegrationWebhookEvents() {
  const [events, setEvents] = useState<WebhookEvent[]>([
    {
      id: "1",
      event_type: "user.created",
      data: { user_id: "123", email: "user@example.com" },
      processed: true,
      created_at: "2024-11-30 10:15:00",
    },
    {
      id: "2",
      event_type: "course.updated",
      data: { course_id: "456", name: "Advanced Training" },
      processed: false,
      created_at: "2024-11-30 09:45:00",
    },
  ]);

  const handleMarkProcessed = (id: string) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, processed: true } : e)));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Webhook Events</h1>

      <Card className="p-6">
        {events.length === 0 ? (
          <p className="text-gray-500">No webhook events</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.event_type}</TableCell>
                  <TableCell>
                    {event.processed ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">Processed</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(event.data).substring(0, 50)}...
                    </code>
                  </TableCell>
                  <TableCell>{event.created_at}</TableCell>
                  <TableCell>
                    {!event.processed && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkProcessed(event.id)}
                      >
                        Mark Processed
                      </Button>
                    )}
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
