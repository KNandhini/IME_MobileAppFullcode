import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return null;
  }

  // Check if we're on the AI Assistant page
  const isAIAssistantPage = location === "/ChatBot";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header />

        <main
          className={cn(
            "px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-4rem)] min-h-0",
            isAIAssistantPage ? "w-full" : "max-w-7xl mx-auto"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
