import { useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import type { UserInfo } from "@/types/userinfo";

interface AuthState {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}


export function useAuth() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  /*const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });*/
  
  const storedUser = localStorage.getItem("currentUser");
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  const [authState, setAuthState] = useState<AuthState>({
    user: initialUser,
    isLoading: false, // only show loading if we don’t have a user yet
    isAuthenticated: !!initialUser,
  });

  useEffect(() => {
    if (isAuthenticated) {
      
      const account =
        instance.getActiveAccount() || instance.getAllAccounts()[0];
      if (account) {
        // Try to get user from localStorage first
        let user = null;
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          try {
            user = JSON.parse(storedUser);
          } catch {
            localStorage.removeItem("currentUser");
          }
        }
        setAuthState({ user, isLoading: false, isAuthenticated: true });
       
      } else {
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setAuthState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, [isAuthenticated, instance]);

  console.log(
  "isLoading:", authState.isLoading,
  "isAuthenticated:", authState.isAuthenticated,
  "user:", authState.user
);
  const login = (user: UserInfo) => {
    
    localStorage.setItem("currentUser", JSON.stringify(user));
    setAuthState({ user, isLoading: false, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setAuthState({ user: null, isLoading: false, isAuthenticated: false });
    instance.logoutRedirect();
  };

  return { ...authState, login, logout };
}
