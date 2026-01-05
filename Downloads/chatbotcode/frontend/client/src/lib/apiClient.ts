import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useAccessToken } from "./auth";
import { loginRequest } from "./msalConfig";
import { msalInstance } from "./msalInstance";


//const API_BASE_URL = "https://chatbot.techants.au/api";
const API_BASE_URL = "http://127.0.0.1:8000";
interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}
export async function getAccessToken(): Promise<string> {
  await msalInstance.initialize();
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) throw new Error("No user account found");
try {
  const response = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account: accounts[0],
  });
return response.accessToken;
} catch (error) {
  if (error instanceof InteractionRequiredAuthError) {
    msalInstance.loginRedirect(loginRequest);
  } else {
    console.error("Token error:", error);
  }
}
}

export async function apiFetch(url: string, options: FetchOptions = {}): Promise<any> {
  const accessToken = await getAccessToken(); // ✅ Valid — no React hooks

  options.headers = options.headers || {};
  if (accessToken) {
    (options.headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API request failed");
  }

  return response;
}
