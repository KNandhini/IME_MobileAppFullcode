import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner"; // ✅ Added Sonner
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import LoginPage from "./pages/LoginPage"; // ✅ Added LoginPage
import { ProtectedRoute } from "./lib/ProtectedRoute"; // ✅ Added ProtectedRoute
import AllTickets from "@/pages/admin/AllTickets"; // ✅ Added DashboardLayout
import { getUserByEmail } from "@/services/api";
//import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

// User pages
import MyTickets from "@/pages/user/MyTickets";
import DeviceManagement from "@/pages/user/DeviceManagement";
import SOPs from "@/pages/user/SOPs";

// Admin pages
import Analytics from "@/pages/admin/Analytics";
import DocumentManagement from "@/pages/admin/DocumentManagement";
import AdminAIAssistantPage from "@/components/chat/AdminAIAssistantPage";
//import UserTable from "@/pages/admin/usermanagement/userTable";
import { useEffect, useState } from "react";
import { validate } from "@/services/api";
import UserTable from "@/pages/admin/usermanagement/userTable";

function Router() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const [validating, setValidating] = useState(false);
  console.log(
    "[Router] isAuthenticated:",
    isAuthenticated,
    "isLoading:",
    isLoading,
    "user:",
    user
  );

  useEffect(() => {
    
    if (isAuthenticated && !user && !validating) {
      setValidating(true);
      validate()
        .then((res) => {
          
          console.log("[validate()] response:", res);
          if (res?.user?.id) {
            login(res.user); // update user state immediately
          } else {
            console.warn("[validate()] No valid user returned", res);
          }
        })
        .catch((err) => {
          console.error("[validate()] error:", err);
        })
        .finally(() => setValidating(false));
    }
  }, [isAuthenticated, user, validating]);
/*useEffect(() => {
  if (isAuthenticated && user &&!validating) {
    console.log("[useEffect] user:", user);
    setValidating(true);

    validate()
      .then(async () => {
        const email = user?.email;
        if (!email) {
          console.warn("[validate()] No email in token response", user);
          return;
        }

        try {
          const dbUser = await getUserByEmail(email);
          console.log("dbuser:", dbUser);

          if (dbUser?.id) {
            
            console.log("[validate()] DB user found:", dbUser);

            // ✅ Normalize before login
            login(dbUser);

          } else {
            console.log("[validate()] Invalid user:", email);
            // Optional: logout();
          }
        } catch (err: any) {
          console.error("[validate()] getUserByEmail error:", err);

          if (err?.message?.includes("User not found")) {
            console.warn("[validate()] User not found, logging out");
            // logout();
          }
        }
      })
      .catch((err) => {
        console.error("[validate()] validate() error:", err);
      })
      .finally(() => setValidating(false));
  }
}, [isAuthenticated, user, validating]);*/

{/*useEffect(() => {
  const validateUser = async () => {
    // prevent double calls
    if (!isAuthenticated || !user || validating) return;

    setValidating(true);

    try {
      console.log("[validateUser()] Starting validation...");

      // 1. Run validate() to confirm token/session is good
      await validate();

      const email = user?.email;
      if (!email) {
        console.warn("[validateUser()] No email in token response", user);
        return;
      }

      console.log("[validateUser()] Checking user in database...");

      // 2. Call API to fetch user by email
      const response = await getUserByEmail(email);

      console.log("[validateUser()] API Response:", response);

      if (response?.id) {
        // ✅ User exists, update state
        login(response);
        console.log("[validateUser()] User exists in DB, proceeding...");
      } else {
        // ❌ User not found
        toast.error("No account found for this email. Please contact support.");
        console.log("[validateUser()] No valid user found in database.");
        logout();
      }
    } catch (error) {
      console.error("[validateUser()] Error:", error);
      toast.error("Something went wrong while validating your account.");
    } finally {
      setValidating(false);
    }
  };

  validateUser();
}, [isAuthenticated, user, validating]);*/}



  if ((isLoading || validating) && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl mx-auto mb-4">
            TA
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/admin" component={AllTickets} />

        {/* ✅ /home route using ProtectedRoute and DashboardLayout */}
        <Route
          path="/home"
          component={() => (
            <ProtectedRoute>
              <AllTickets />
            </ProtectedRoute>
          )}
        />

        {user?.role === "admin" ? (
          <>
            <Route path="/" component={AllTickets} />
            <Route path="/tickets" component={AllTickets} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/documents" component={DocumentManagement} />
            <Route path="/users" component={UserTable} />
          </>
        ) : (
          <>
            <Route path="/" component={MyTickets} />
            <Route path="/tickets" component={MyTickets} />
            <Route path="/devices" component={DeviceManagement} />
            <Route path="/sops" component={SOPs} />
            
          </>
        )}

        <Route path="/ChatBot" component={AdminAIAssistantPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner /> {/* ✅ Added Sonner here */}
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
