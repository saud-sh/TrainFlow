import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2 } from "lucide-react";

interface Department {
  id: string;
  code: string;
  name: string;
  memberCount: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    setDepartments([
      { id: "1", code: "ERTMD", name: "Emergency Response Training & Maintenance", memberCount: 6, },
      { id: "2", code: "TMSD", name: "Technical Maintenance & Support", memberCount: 5, },
      { id: "3", code: "JTMD", name: "Job Training & Development", memberCount: 4, },
    ]);

    setTeamMembers([
      { id: "1", name: "Training Officer", email: "training.officer@democorp.local", role: "Training Officer", department: "ERTMD", },
      { id: "2", name: "Manager One", email: "manager1@democorp.local", role: "Manager", department: "ERTMD", },
      { id: "3", name: "Foreman One", email: "foreman1@democorp.local", role: "Foreman", department: "ERTMD", },
      { id: "4", name: "Employee One", email: "employee1@democorp.local", role: "Employee", department: "ERTMD", },
    ]);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Departments & Teams</h1>
        <p className="text-slate-600 dark:text-slate-300">Manage organizational structure and team members</p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          Departments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map(dept => (
            <Card key={dept.id} className="p-6 hover:shadow-lg transition-shadow">
              <p className="text-sm font-semibold text-blue-600 uppercase">{dept.code}</p>
              <h3 className="text-lg font-bold mt-2 mb-4">{dept.name}</h3>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4" />
                <span>{dept.memberCount} members</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-green-600" />
          Team Members
        </h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teamMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 text-sm font-medium">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{member.email}</td>
                    <td className="px-6 py-4 text-sm"><Badge variant="secondary">{member.role}</Badge></td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{member.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
