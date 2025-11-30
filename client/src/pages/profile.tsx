import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Briefcase, Building2 } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    setProfile({
      name: "Demo User",
      email: "demo@democorp.local",
      role: "Training Officer",
      department: "ERTMD",
      joinDate: "2024-01-15",
    });
  }, []);

  if (!profile) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
          {profile.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-slate-600 dark:text-slate-300">{profile.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Mail className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
              <p className="font-semibold">{profile.email}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Briefcase className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Role</p>
              <p className="font-semibold">{profile.role}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Building2 className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Department</p>
              <p className="font-semibold">{profile.department}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <User className="w-5 h-5 text-indigo-600 mt-1" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Join Date</p>
              <p className="font-semibold">{new Date(profile.joinDate).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
