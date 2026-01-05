import type { Ticket as DBTicket } from "@shared/schema";

export interface Ticket extends Omit<DBTicket, "id"> {
  /**
   * Internal database ID. Use ONLY for backend lookups, not for display.
   */
  id: string;
  /**
   * Human-friendly ticket number (e.g. '201750'). Use this for all UI display instead of id.
   */
  ticketNumber: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
  ticketId?: string;
  messages: Message[];
}

export interface APIMessage {
  role: string;
  content: string;
}

export interface RAGRequest {
  id: number;
  creatorResourceID: number;
  query: string;
  history: APIMessage[];
}

export interface RAGResponse {
  answer: string;
  sources?: string[];
}

export interface SaveChatRequest {
  ticket_id: number;
  creator_resource_id: number;
  messages: {
    role: string;
    content: string;
  }[];
  title: string;
}

export interface FeedbackRequest {
  rating: "up" | "down";
  session_id?: string;
  timestamp: string;
}

export interface SessionStartRequest {
  session_id: string;
  timestamp: string;
}

export interface EventLogRequest {
  type: string;
  event_data: any;
  timestamp: string;
}
