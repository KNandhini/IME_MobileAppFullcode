import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Ticket,
  Briefcase,
  BookOpen,
  BarChart3,
  FolderOpen,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
} from "lucide-react";

export function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const { user } = useAuth();
  const [location] = useLocation();
  console.log("Sidebar user:", user); 
  if (!user) return null;

  const userNavItems = [
    { name: "My Tickets", path: "/tickets", icon: Ticket },
    { name: "Jobs", path: "/devices", icon: Briefcase },
    { name: "SOPs", path: "/sops", icon: BookOpen },
  ];

  const adminNavItems = [
     
    { name: "All Tickets", path: "/tickets", icon: Ticket },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Document Management", path: "/documents", icon: FolderOpen },
   { name: "User Management", path: "/users", icon: Users },
  ];
  console.log(adminNavItems,"adminNavItems");

  const navItems = user.role === "admin" ? adminNavItems : userNavItems;
  const showAIAssistant = location === "/ChatBot";

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-primary transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center h-16 px-4">
        <div className="bg-white text-primary w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm">
          TA
        </div>
        {!collapsed && (
          <div className="ml-3">
            <div className="text-white font-medium">TechAnts</div>
            <div className="text-blue-200 text-sm">
              {user.role === "admin" ? "Admin Panel" : "User Panel"}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-4 py-2 mt-2 text-sm font-medium rounded-md mx-2",
                isActive
                  ? "text-blue-200 bg-primary-foreground/20 hover:text-white"
                  : "text-blue-200 hover:text-white hover:bg-primary-foreground/10"
              )}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}

        {/* AI Assistant */}
        {showAIAssistant && (
          <Link
            key="/ChatBot"
            href="/ChatBot"
            className={cn(
              "flex items-center px-4 py-2 mt-2 text-sm font-medium rounded-md mx-2",
              location === "/ChatBot"
                ? "text-blue-200 bg-primary-foreground/20 hover:text-white"
                : "text-blue-200 hover:text-white hover:bg-primary-foreground/10"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            {!collapsed && <span className="ml-3">AI Assistant</span>}
          </Link>
        )}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-primary-foreground text-primary rounded-full p-1 shadow-md hover:bg-blue-300 transition"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </div>
  );
}
