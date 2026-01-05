import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiFetch } from "../../lib/apiClient";
import { Ticket, Message, ChatHistory } from "@/types/ticket";
import ChatView from "./ChatView";
import { MessageCircle } from "lucide-react";

export default function AdminAIAssistantPage() {
  const [topSOPs, setTopSOPs] = useState<string[]>([]);
  const [location] = useLocation();

  // Extract ticketId from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const ticketIdFromUrl = urlParams.get("ticketId");

  // Try to get ticket from history state first, then check URL params
  const ticket = window.history.state?.usr?.ticket || null;

  const [chatTicket, setChatTicket] = useState<Ticket | null>(ticket || null);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your TechAnts AI Assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (ticket) {
      setChatTicket(ticket);
    }
  }, [ticket]);

  // Handle ticket context from URL params
  useEffect(() => {
    if (ticketIdFromUrl && !chatTicket) {
      // First create a minimal ticket with just the ID to show loading state
      const loadingTicket: Ticket = {
        id: ticketIdFromUrl,
        ticketNumber: ticketIdFromUrl, // fallback to id if not available
        title: `Loading ticket ${ticketIdFromUrl}...`,
        description: "",
        status: "new",
        priority: "medium",
        clientId: null,
        assigneeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChatTicket(loadingTicket);

      // Then fetch the actual ticket details from the API
      const fetchTicket = async () => {
        try {
          // Fetch ticket details from backend
          const response = await apiFetch(`/ticket/details?ticket_id=${ticketIdFromUrl}`);
          const ticketData = await response.json();
          setChatTicket({
            ...ticketData,
            id: ticketIdFromUrl.toString(),
            ticketNumber: ticketData.ticketNumber || ticketIdFromUrl.toString(),
          });
          // If description exists, auto-send it as user query AND trigger AI response
          if (ticketData.description) {
            // Format ticket title and description for initial query
            const { formatTicketForChat } = await import("./ticketDescriptionUtils");
            const formattedQuery = formatTicketForChat(ticketData.title, ticketData.description);
            const initialMsg: Message = {
              role: "user",
              content: formattedQuery,
              timestamp: new Date().toISOString(),
            };
            setChatMessages([initialMsg]);
            // Immediately trigger AI response
            setIsLoading(true);
            import("@/services/api").then(async ({ aiChatQuery }) => {
              try {
                const result = await aiChatQuery(formattedQuery, [
                  { role: "user", content: formattedQuery },
                ]);
                setChatMessages([
                  initialMsg,
                  {
                    role: "assistant",
                    content: result.answer,
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setTopSOPs(result.top_sops || []);
              } catch (error) {
                setChatMessages([
                  initialMsg,
                  {
                    role: "assistant",
                    content:
                      "Sorry, I couldn't get a response from the AI. Please try again.",
                    timestamp: new Date().toISOString(),
                  },
                ]);
              } finally {
                setIsLoading(false);
              }
            });
          } else {
            // fallback to welcome message
            setChatMessages([
              {
                role: "assistant",
                content:
                  "Hello! I'm your TechAnts AI Assistant. How can I help you today?",
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        } catch (error) {
          console.error("Error fetching ticket:", error);
          setChatTicket((prev) => ({
            ...prev!,
            title: `Error loading ticket ${ticketIdFromUrl}`,
          }));
          setChatMessages([
            {
              role: "assistant",
              content: `Sorry, I couldn't load the ticket details. Please try again later.`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      };

      fetchTicket();
    }
  }, [ticketIdFromUrl, chatTicket]);

  const handleInitialTicketMessage = async (message: string) => {
    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send initial user message to backend AI chat
      const chatHistory = [
        ...chatMessages.map(({ role, content }) => ({ role, content })),
        { role: "user", content: message },
      ];
      const { aiChatQuery } = await import("@/services/api");
      const result = await aiChatQuery(message, chatHistory);
      const aiMessage: Message = {
        role: "assistant",
        content: result.answer,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
      setTopSOPs(result.top_sops || []);
    } catch (error) {
      console.error("Error sending initial message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I couldn't get a response from the AI. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message?: string) => {
    const userQuery = typeof message === "string" ? message : currentMessage;
    if (!userQuery.trim() || isLoading) return;
    const userMessage: Message = {
      role: "user",
      content: userQuery,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      // Send user message to backend AI chat
      const chatHistory = [
        ...chatMessages.map(({ role, content }) => ({ role, content })),
        { role: "user", content: userQuery },
      ];
      const { aiChatQuery } = await import("@/services/api");
      const result = await aiChatQuery(userQuery, chatHistory);
      const aiMessage: Message = {
        role: "assistant",
        content: result.answer,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
      setTopSOPs(result.top_sops || []);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I couldn't get a response from the AI. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadChatHistory = (historyItem: ChatHistory) => {
    setChatMessages(historyItem.messages);
    setCurrentChatId(historyItem.id);
  };

  const handleDeleteChatHistory = (historyId: string) => {
    setChatHistory((prev) => prev.filter((item) => item.id !== historyId));
  };

  const handleNewChat = () => {
    setChatMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm your TechAnts AI Assistant. How can I help you today?",
        timestamp: new Date().toISOString(),
      },
    ]);
    setCurrentChatId(null);
    setChatTicket(null);
  };

  const handleSaveAndNewChat = async () => {
    if (chatMessages.length > 1) {
      // Don't save if only welcome message
      try {
        // Mock save functionality
        const newHistory: ChatHistory = {
          id: Date.now().toString(),
          title: chatTicket ? `Chat about ${chatTicket.ticketNumber}` : "General Chat",
          timestamp: new Date().toLocaleString(),
          ticketId: chatTicket?.id,
          messages: chatMessages,
        };
        setChatHistory((prev) => [newHistory, ...prev]);
      } catch (error) {
        console.error("Failed to save chat history:", error);
      }
    }
    handleNewChat();
  };

  return (
    <div className="flex flex-col w-full h-full">
      <ChatView
        chatTicket={chatTicket}
        chatMessages={chatMessages}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        onLoadChatHistory={handleLoadChatHistory}
        onDeleteChatHistory={handleDeleteChatHistory}
        onNewChat={handleNewChat}
        onSaveAndNewChat={handleSaveAndNewChat}
        topSOPs={topSOPs}
      />
    </div>
  );
}
