import React, { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalConfig";
import { validate } from "@/services/api";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight, Loader2, AlertCircle } from "lucide-react";
//import { getUserByEmail } from "@/services/api"; // updated import
const LoginPage: React.FC = () => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    instance
      .handleRedirectPromise()
      .then((response) => {
        if (response) {
          console.log("Login success:", response);
        } else {
          console.log("No redirect response found.");
        }
      })
      .catch((error) => {
        console.error("Error handling redirect:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [instance]);

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">TechAnts</h2>
            <p className="text-gray-600">Initializing secure connection...</p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  let account = instance.getActiveAccount() || instance.getAllAccounts()[0];
  if (account) {
    if (!validating) {
      setValidating(true);
      validate()
        .then((res) => {
          if (!res?.user?.id) {
            instance.loginRedirect(loginRequest);
          } else {
            // Normalize roles: always array, lowercased; role: string, lowercased ('admin' or 'user')
            let userObj = { ...res.user };
            if (Array.isArray(userObj.roles)) {
              userObj.roles = userObj.roles.map((r: string) => r.toLowerCase());
              userObj.role = userObj.roles.includes("admin") ? "admin" : "user";
            } else if (typeof userObj.role === "string") {
              userObj.role = userObj.role.toLowerCase();
              userObj.roles = [userObj.role];
            } else {
              userObj.role = "user";
              userObj.roles = ["user"];
            }
            localStorage.setItem("currentUser", JSON.stringify(userObj));
            toast.success(`Welcome back, ${userObj.name}!`);
            console.log("DEBUG: Normalized user object:", userObj);
            setLocation("/tickets");
            window.location.reload(); // Force reload so sidebar/layout update
          }
        })
        .catch((err) => {
          console.error("Validation error:", err);
          setValidating(false);
        });
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-800">TechAnts</h2>
            <p className="text-gray-600">Validating your credentials...</p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }
/*if (account) {
    if (!validating) {
      setValidating(true);
      // ✅ Check if user exists in backend
      getUserByEmail(account.username)
        .then((user) => {
          // Normalize roles: lowercase array
          const normalizedUser = {
            ...user,
            roles: Array.isArray(user.roles) ? user.roles.map(r => r.toLowerCase()) : ["user"],
            role: Array.isArray(user.roles)
              ? user.roles.map(r => r.toLowerCase()).includes("admin") ? "admin" : "user"
              : "user",
          };
          localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
          toast.success(`Welcome back, ${normalizedUser.name}!`);
          setLocation("/tickets");
          window.location.reload(); // Ensure sidebar/layout updates
        })
        .catch((err) => {
          console.error("User validation error:", err);
          toast.error("User not registered. Please contact support.");
          setValidating(false);
        });
    }
  }*/
  // If not authenticated or no account, show login interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="relative mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                TechAnts
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Secure access to your ticket management system
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {isAuthenticated ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Authentication Issue</span>
                </div>
                <p className="text-gray-600">
                  You are logged in, but no user info found. Please contact support.
                </p>
                <Button 
                  onClick={handleLogin} 
                  variant="outline" 
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  onClick={handleLogin} 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Sign in with Microsoft
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-500">
            Powered by TechAnts Technology Solutions
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>Secure</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>Reliable</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
