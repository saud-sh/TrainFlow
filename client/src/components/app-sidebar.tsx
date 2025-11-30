import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  TrendingUp,
  History,
  Sparkles,
  Brain,
  BarChart3,
  ArrowRightLeft,
  ChevronUp,
  Building2,
  UserCircle,
} from "lucide-react";
import type { UserRole } from "@shared/schema";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["employee", "foreman", "manager", "training_officer", "administrator"],
  },
  {
    title: "My Courses",
    url: "/my-courses",
    icon: BookOpen,
    roles: ["employee", "foreman", "manager"],
  },
  {
    title: "My Renewals",
    url: "/my-renewals",
    icon: ClipboardCheck,
    roles: ["employee", "foreman", "manager"],
  },
  {
    title: "Progression Tasks",
    url: "/progression",
    icon: TrendingUp,
    roles: ["employee", "foreman", "manager"],
  },
  {
    title: "AI Recommendations",
    url: "/recommendations",
    icon: Sparkles,
    roles: ["employee", "foreman", "manager"],
  },
  {
    title: "Grade Readiness",
    url: "/grade-readiness",
    icon: Brain,
    roles: ["employee", "foreman", "manager"],
  },
  {
    title: "Team Approvals",
    url: "/approvals",
    icon: ClipboardCheck,
    roles: ["foreman", "manager"],
  },
  {
    title: "Team Overview",
    url: "/team",
    icon: Users,
    roles: ["foreman", "manager"],
  },
  {
    title: "Course Management",
    url: "/courses",
    icon: BookOpen,
    roles: ["training_officer", "administrator"],
  },
  {
    title: "Enrollments",
    url: "/enrollments",
    icon: FileText,
    roles: ["training_officer", "administrator"],
  },
  {
    title: "All Renewals",
    url: "/all-renewals",
    icon: ClipboardCheck,
    roles: ["training_officer", "administrator"],
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
    roles: ["administrator"],
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Building2,
    roles: ["administrator"],
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: History,
    roles: ["administrator"],
  },
  {
    title: "Integrations",
    url: "/integrations",
    icon: ArrowRightLeft,
    roles: ["administrator"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    roles: ["manager", "training_officer", "administrator"],
  },
  {
    title: "KPI Dashboard",
    url: "/kpi-dashboard",
    icon: BarChart3,
    roles: ["employee", "foreman", "manager", "training_officer", "administrator"],
  },
];

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    employee: "Employee",
    foreman: "Foreman",
    manager: "Manager",
    training_officer: "Training Officer",
    administrator: "Administrator",
  };
  return labels[role] || role;
}

function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    employee: "bg-chart-1/10 text-chart-1",
    foreman: "bg-chart-2/10 text-chart-2",
    manager: "bg-chart-3/10 text-chart-3",
    training_officer: "bg-chart-4/10 text-chart-4",
    administrator: "bg-chart-5/10 text-chart-5",
  };
  return colors[role] || "bg-muted text-muted-foreground";
}

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const userRole = (user?.role as UserRole) || "employee";

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const mainNavItems = filteredNavItems.filter(
    (item) =>
      !["Reports", "Audit Logs", "Settings"].includes(item.title)
  );

  const adminNavItems = filteredNavItems.filter((item) =>
    ["Audit Logs", "Reports"].includes(item.title)
  );

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || "User";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer" data-testid="link-logo">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">TrainFlow</h1>
              <p className="text-xs text-muted-foreground">Enterprise Training</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminNavItems.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        tooltip={item.title}
                      >
                        <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-2"
              data-testid="button-user-menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
                <AvatarFallback className="text-sm">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(userRole)}`}>
                  {getRoleLabel(userRole)}
                </span>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{getDisplayName()}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer" data-testid="link-profile">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="cursor-pointer" data-testid="link-notifications">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer" data-testid="link-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/api/logout" className="cursor-pointer text-destructive" data-testid="link-logout">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
