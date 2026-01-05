import { loginRequest, msalConfig } from "./msalConfig";
import { useMsal } from "@azure/msal-react";


export function useAccessToken() {
  const { instance } = useMsal();

  const getAccessToken = async (): Promise<string> => {
    const accounts = instance.getAllAccounts();
    if (accounts.length === 0) throw new Error("No user account found");

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return response.accessToken;
    } catch (error) {
      console.error("Token acquisition failed:", error);
      throw error;
    }
  };

  return getAccessToken;
}

