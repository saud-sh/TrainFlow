import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Moon, Globe } from "lucide-react";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    expiry_alerts: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Receive updates via email</p>
            </div>
            <Switch checked={notifications.email} onCheckedChange={() => handleNotificationChange("email")} />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">SMS Alerts</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Receive SMS for urgent alerts</p>
            </div>
            <Switch checked={notifications.sms} onCheckedChange={() => handleNotificationChange("sms")} />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Course Expiry Alerts</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Get notified before courses expire</p>
            </div>
            <Switch checked={notifications.expiry_alerts} onCheckedChange={() => handleNotificationChange("expiry_alerts")} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold">Language</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Language preference is managed from the top navigation</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Moon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-semibold">Theme</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Theme preference is managed from the top navigation</p>
      </Card>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
      </div>
    </div>
  );
}
