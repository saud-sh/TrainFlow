import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Moon, Globe } from "lucide-react";
import type { Language } from "@/i18n";
import { languages } from "@/i18n";

export default function SettingsPage({ language = "en", onLanguageChange }: { language?: Language; onLanguageChange?: (lang: Language) => void }) {
  const t = languages[language];
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    expiry_alerts: true,
    approval_notifications: true,
  });
  const [theme, setTheme] = useState("light");

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
        Settings
      </h1>

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Notification Preferences
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Email Notifications
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Receive updates via email
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={() => handleNotificationChange("email")}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                SMS Alerts
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Receive SMS for urgent alerts
              </p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={() => handleNotificationChange("sms")}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Course Expiry Alerts
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get notified before courses expire
              </p>
            </div>
            <Switch
              checked={notifications.expiry_alerts}
              onCheckedChange={() =>
                handleNotificationChange("expiry_alerts")
              }
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Approval Notifications
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get notified of approval status changes
              </p>
            </div>
            <Switch
              checked={notifications.approval_notifications}
              onCheckedChange={() =>
                handleNotificationChange("approval_notifications")
              }
            />
          </div>
        </div>
      </Card>

      {/* Language Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Language
          </h2>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Current language: {language === "en" ? "English" : "العربية"}
          </p>
          <div className="flex gap-2">
            <Button
              variant={language === "en" ? "default" : "outline"}
              onClick={() => onLanguageChange?.("en")}
              data-testid="button-language-en"
            >
              English
            </Button>
            <Button
              variant={language === "ar" ? "default" : "outline"}
              onClick={() => onLanguageChange?.("ar")}
              data-testid="button-language-ar"
            >
              العربية
            </Button>
          </div>
        </div>
      </Card>

      {/* Theme Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Moon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Theme
          </h2>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Current theme: {theme}
          </p>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-settings">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
