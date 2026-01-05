import React, { useState, useEffect } from "react";
import { FileText, Eye, History, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { ChatHistory as ChatHistoryType } from "@/types/ticket";

interface SOP {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
}

interface ChatRightSidebarProps {
  ticketTitle?: string;
  ticketId?: string;
  ticketDescription?: string;
  chatHistory: ChatHistoryType[];
  currentChatId: string | null;
  onLoadChatHistory: (historyItem: ChatHistoryType) => void;
  onDeleteChatHistory: (historyId: string) => void;
  onNewChat: () => void;
  topSOPs: string[];
}
const ChatRightSidebar: React.FC<ChatRightSidebarProps> = ({
  ticketTitle,
  ticketId,
  ticketDescription,
  chatHistory,
  currentChatId,
  onLoadChatHistory,
  onDeleteChatHistory,
  onNewChat,
  topSOPs,
}) => {
  const [activeTab, setActiveTab] = useState<"sops" | "history">("sops");
  const [backendChatHistory, setBackendChatHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Mock chat history for demo
  useEffect(() => {
    if (ticketId) {
      fetchChatHistory();
    }
  }, [ticketId]);

  const fetchChatHistory = async () => {
    if (!ticketId) return;

    setLoadingHistory(true);
    try {
      // Mock chat history for demo
      await new Promise((resolve) => setTimeout(resolve, 300));
      setBackendChatHistory([]);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      setBackendChatHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="w-80 h-full flex flex-col overflow-hidden">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex border-b overflow-y-auto">
            <button
              onClick={() => setActiveTab("sops")}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "sops"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Top 5 SOPs
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 overflow-y-auto flex-1">
          {activeTab === "sops" && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Top 5 SOPs
                </h3>
                {ticketTitle && (
                  <p className="text-sm text-gray-600">
                    Related to:{" "}
                    <span className="font-medium">{ticketTitle}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {topSOPs.length > 0 ? (
                  topSOPs.map((sopFileName: string, index: number) => (
                    <div
                      key={sopFileName}
                      className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="text-blue-600" size={18} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                            {index + 1}.{" "}
                            {sopFileName
                              .replace(".pdf", "")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF Document
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Relevant SOP
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() =>
                            (async () => {
                              const response = await apiFetch(
                                `/docs/download?file_name=${encodeURIComponent(
                                  sopFileName
                                )}`
                              );
                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, "_blank");
                                setTimeout(
                                  () => window.URL.revokeObjectURL(url),
                                  10000
                                );
                              } else {
                                alert("Failed to download document.");
                              }
                            })()
                          }
                        >
                          <Eye size={12} className="mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText
                      size={32}
                      className="text-gray-400 mx-auto mb-2"
                    />
                    <p className="text-sm text-gray-500">
                      No relevant SOPs found
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chat History
                </h3>
                <Button variant="outline" size="sm" onClick={onNewChat}>
                  New Chat
                </Button>
              </div>

              <div className="space-y-2">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No chat history yet</p>
                  </div>
                ) : (
                  chatHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                        currentChatId === item.id
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white"
                      }`}
                      onClick={() => onLoadChatHistory(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.timestamp}
                          </p>
                          {item.ticketId && (
                            <p className="text-xs text-blue-600">
                              {item.ticketId}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChatHistory(item.id);
                          }}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <Trash2 size={12} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatRightSidebar;
