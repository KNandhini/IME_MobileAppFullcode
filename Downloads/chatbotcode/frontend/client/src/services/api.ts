import { apiFetch } from "@/lib/apiClient";
import { apiRequest } from "@/lib/queryClient";
import type {
  RAGRequest,
  RAGResponse,
  SaveChatRequest,
  APIMessage,
  //StartWorkRequest,
  FeedbackRequest,
  SessionStartRequest,
  EventLogRequest,
} from "@/types/ticket";
import { UserInfo, ValidateUserResponse } from "@/types/userinfo";
import { Ticket } from "@shared/schema";

// Health check
export const healthCheck = async (): Promise<{ message: string }> => {
  try {
    const response = await apiFetch(`/`);
    if (!response.ok) throw new Error("Health check failed (root endpoint)");
    return response.json();
  } catch (error) {
    throw new Error("Error in healthCheck: " + (error instanceof Error ? error.message : String(error)));
  }
};

// Analytics API functions
export const getAnalyticsSummary = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/summary?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch analytics summary");
    return res.json();
  } catch (error) {
    throw new Error("Error in getAnalyticsSummary: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getResolutionTime = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/resolution-time?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch resolution time");
    return res.json();
  } catch (error) {
    throw new Error("Error in getResolutionTime: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getFirstResponseTime = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/first-response-time?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch first response time");
    return res.json();
  } catch (error) {
    throw new Error("Error in getFirstResponseTime: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getTicketMetrics = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/ticket-metrics?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch ticket metrics");
    return res.json();
  } catch (error) {
    throw new Error("Error in getTicketMetrics: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getPriorityDistribution = async () => {
  try {
    const res = await apiFetch(`/analytics/priority-distribution`);
    if (!res.ok) throw new Error("Failed to fetch priority distribution");
    return res.json();
  } catch (error) {
    throw new Error("Error in getPriorityDistribution: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getAIPerformance = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/ai-performance?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch AI performance");
    return res.json();
  } catch (error) {
    throw new Error("Error in getAIPerformance: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getScriptStats = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/script-stats?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch script stats");
    return res.json();
  } catch (error) {
    throw new Error("Error in getScriptStats: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getAuthStats = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/auth-stats?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch auth stats");
    return res.json();
  } catch (error) {
    throw new Error("Error in getAuthStats: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getOpenAIUsage = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/openai-usage?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch OpenAI usage");
    return res.json();
  } catch (error) {
    throw new Error("Error in getOpenAIUsage: " + (error instanceof Error ? error.message : String(error)));
  }
};
export const getUserEngagement = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/user-engagement?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch user engagement");
    return res.json();
  } catch (error) {
    throw new Error("Error in getUserEngagement: " + (error instanceof Error ? error.message : String(error)));
  }
};

export const getChatInteractions = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/chat-interactions?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch chat interactions");
    return res.json();
  } catch (error) {
    throw new Error("Error in getChatInteractions: " + (error instanceof Error ? error.message : String(error)));
  }
};

export const getDataAccess = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/data-access?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch data access");
    return res.json();
  } catch (error) {
    throw new Error("Error in getDataAccess: " + (error instanceof Error ? error.message : String(error)));
  }
};

export const getFeedbackData = async (days: number) => {
  try {
    const res = await apiFetch(`/analytics/feedback?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch feedback data");
    return res.json();
  } catch (error) {
    throw new Error("Error in getFeedbackData: " + (error instanceof Error ? error.message : String(error)));
  }
};

export const getUptime = async () => {
  try {
    const res = await apiFetch(`/uptime`);
    if (!res.ok) throw new Error("Failed to fetch uptime");
    return res.json();
  } catch (error) {
    throw new Error("Error in getUptime: " + (error instanceof Error ? error.message : String(error)));
  }
};


export const startWorkOnTicket = async (ticketId: number): Promise<any> => {
  try {
    const response = await apiRequest(
      "POST",
      `/ticket/start_work?ticket_id=${ticketId}`
    );
    if (!response.ok) throw new Error("Failed to start work on ticket");
    return response.json();
  } catch (error) {
    throw new Error("Error in startWorkOnTicket: " + (error instanceof Error ? error.message : String(error)));
  }
};

// SOP/PDF endpoints
export const uploadPDF = async (
  file: File
): Promise<{ filename: string; message: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch("/docs/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload PDF");
  return response.json();
};

export const getPDF = async (
  filename: string,
  folderName: string
): Promise<Blob> => {
  const url = `/docs/download?file_name=${encodeURIComponent(
    filename
  )}&folder_name=${encodeURIComponent(folderName)}`;
  const response = await apiFetch(url);
  if (!response.ok)
    throw new Error(
      `Failed to fetch PDF: ${response.status} ${response.statusText}`
    );
  return response.blob();
};

// Document Management endpoints
export const createFolderAndUpload = async (
  folderName: string | undefined,
  file: File
): Promise<{ message: string; folder: string; filename: string }> => {
  const formData = new FormData();
  if (folderName) {
    formData.append("folder_name", folderName);
  }
  formData.append("file", file);

  const response = await apiFetch("/docs/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to create folder and upload file");
  return response.json();
};

export const deleteFile = async (
  folderName: string,
  fileName: string
): Promise<{ status: string; message: string }> => {
  const url = `/docs/delete?file_name=${encodeURIComponent(
    fileName
  )}&folder_name=${encodeURIComponent(folderName)}`;

  const response = await apiFetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to delete file");
  }

  return response.json();
};

export const listFolders = async (): Promise<string[]> => {
  const response = await apiFetch("/docs/list-folders");
  if (!response.ok) throw new Error("Failed to list folders");
  const data = await response.json();
  console.log("listFolders API raw response:", data);
  return data;
};

export const listFiles = async (folder?: string): Promise<string[]> => {
  const url = folder
    ? `/docs/list-files?folder=${encodeURIComponent(folder)}`
    : `/docs/list-files`;

  const response = await apiFetch(url);
  if (!response.ok) throw new Error("Failed to list files");
  return response.json();
};

export const getPDFInFolder = async (
  folder: string,
  filename: string
): Promise<Blob> => {
  const response = await apiFetch(`/pdfs/${folder}/${filename}`);
  if (!response.ok) throw new Error("Failed to fetch PDF");
  return response.blob();
};

export const validate = async (): Promise<ValidateUserResponse> => {
  
  const response = await apiFetch("/auth/secure");
  if (!response.ok) throw new Error("Token validation failed");
  return response.json();
};

export async function sendRAGQuery(request: RAGRequest): Promise<RAGResponse> {
  try {
    const response = await apiRequest("POST", "/api/ai/rag", request);
    return await response.json();
  } catch (error) {
    console.error("Error sending RAG query:", error);
    throw error;
  }
}

export async function getAllTickets(resourceId: string): Promise<Ticket[]> {
  const response = await apiFetch(`/ticket/fetch?resource_id=${resourceId}`);
  if (!response.ok) throw new Error("Failed to fetch tickets");
  return await response.json();
}

export async function getTicket(ticketId: string): Promise<Ticket> {
  const response = await apiRequest("GET", `/api/tickets/${ticketId}`);
  return response.json();
}

export async function getTopSOPs(
  ticketId: number,
  description: string
): Promise<string[]> {
  try {
    const response = await apiRequest("POST", "/api/ai/sops", {
      ticketId,
      description,
    });
    const data = await response.json();
    return data.sops || [];
  } catch (error) {
    console.error("Error fetching SOPs:", error);
    return [];
  }
}

// Send a message to the AI chatbot backend and get the answer
export async function aiChatQuery(
  query: string,
  chatHistory: { role: string; content: string }[] = []
): Promise<{ answer: string; top_sops?: string[] }> {
  const response = await apiFetch("/chat/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, chat_history: chatHistory }),
  });
  const data = await response.json();
  return { answer: data.answer, top_sops: data.top_sops };
}

// Fetch ticket details (used by ChatView, AdminAIAssistantPage, etc.)
export async function getTicketDetails(ticketId: string | number) {
  const response = await apiFetch(`/ticket/details?ticket_id=${ticketId}`);
  if (!response.ok) throw new Error("Failed to fetch ticket details");
  return response.json();
}

// Mark a ticket as completed in Autotask
// Utility to serialize chat messages into a plain string transcript
function serializeChatTranscript(
  messages: { role: string; content: string; timestamp?: string }[]
): string {
  return messages
    .map((msg) => {
      const speaker = msg.role === "user" ? "User" : "AI";
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : "";
      return time
        ? `[${time}] ${speaker}: ${msg.content}`
        : `${speaker}: ${msg.content}`;
    })
    .join("\n\n");
}

export async function markTicketAsCompleted(
  ticketId: number,
  chatOrMessages:
    | string
    | { role: string; content: string; timestamp?: string }[] = "Completed"
): Promise<void> {
  const chat = Array.isArray(chatOrMessages)
    ? serializeChatTranscript(chatOrMessages)
    : chatOrMessages;

  const response = await apiFetch(`/ticket/mark_as_completed`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket_id: ticketId, chat }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to mark ticket as completed: ${response.status} ${text}`
    );
  }
}

// Mark a ticket as on-hold (no body; ticket id passed as query param)
export async function markTicketAsOnHold(ticketId: number): Promise<void> {
  const response = await apiFetch(
    `/ticket/mark_as_onhold?ticket_id=${encodeURIComponent(ticketId)}`,
    { method: "PUT" }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to mark ticket as on-hold: ${response.status} ${text}`
    );
  }
}

export async function submitFeedback(request: FeedbackRequest): Promise<void> {
  try {
    await apiRequest("POST", "/analytics/feedback", request);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
}

export async function startSession(
  request: SessionStartRequest
): Promise<void> {
  try {
    const response = await apiRequest("POST", "/analytics/session/start", request);
    if (response && response.ok === false) throw new Error("Failed to start session");
  } catch (error) {
    throw new Error("Error in startSession: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function endSession(request: {
  session_id: string;
  timestamp: string;
}): Promise<void> {
  try {
    await apiRequest("POST", "/analytics/session/end", request);
  } catch (error) {
    console.error("Error ending session:", error);
    throw error;
  }
}

export async function logEvent(request: EventLogRequest): Promise<void> {
  try {
    await apiRequest("POST", "/analytics/events/log", request);
  } catch (error) {
    console.error("Error logging event:", error);
    throw error;
  }
}
// Define types here or import from another file
export type User = {
  id: string;
  name: string;
  email: string;
  roles: string[]; 
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
};

export type InsertUser = {
  name: string;
  email: string;
  roles: string[];
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string; 
};
const mapUser = (u: any): User => ({
  id: u._id,
  name: u.name,
  email: u.email,
  roles: u.roles,
  createdBy: u.createdBy,
  createdDate: u.createdDate,
  modifiedBy: u.modifiedBy,
  modifiedDate: u.modifiedDate,
});
export const listUsers = async (): Promise<User[]> => {
  const res = await apiFetch("/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.map(mapUser);  // ✅ map each user
};

export const createUser = async (user: InsertUser): Promise<User> => {
  const res = await apiFetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return mapUser(await res.json());  // ✅ map response
};

export const updateUser = async (id: string, user: Partial<InsertUser>): Promise<User> => {
  const res = await apiFetch(`/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return mapUser(await res.json());  // ✅ map response
};

export const deleteUser = async (id: string): Promise<void> => {
  const res = await apiFetch(`/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
};
export const getUserByEmail = async (email: string): Promise<UserInfo> => {
  
  const response = await apiFetch(`/users/email/${email}`);
  if (!response.ok) throw new Error("User not found");
  //return response.json();
    const raw = await response.json();
  return {
    id: raw._id,
    name: raw.name,
    email: raw.email,
    roles: raw.roles,
    role: raw.roles?.[0] ?? "",
  };
};
// Re-export types for convenience
export type {
  APIMessage,
  RAGRequest,
  RAGResponse,
  SaveChatRequest,
  FeedbackRequest,
  SessionStartRequest,
  EventLogRequest,
};
