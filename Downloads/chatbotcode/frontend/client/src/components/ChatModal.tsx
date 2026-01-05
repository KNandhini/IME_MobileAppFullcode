import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@shared/schema";

interface ChatModalProps {
  ticketId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModal({ ticketId, isOpen, onClose }: ChatModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/tickets", ticketId, "messages"],
    enabled: !!ticketId && isOpen,
    refetchInterval: 2000, // Poll for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest("POST", `/api/ai/chat`, {
        message: messageText,
        ticketId: ticketId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/tickets", ticketId, "messages"],
      });
      setMessage("");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && ticketId) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!ticketId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Assistant - Ticket #{ticketId}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 bg-gray-50 rounded-lg p-4 mb-4"
        >
          <div className="space-y-4">
            {isLoading && (
              <div className="text-center text-gray-500">Loading messages...</div>
            )}
            
            {messages.length === 0 && !isLoading && (
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white text-sm">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white p-3 rounded-lg shadow-sm max-w-md">
                  <p className="text-sm">
                    Hello! I'm here to help you resolve this ticket. How can I assist you today?
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  msg.isAiMessage ? "" : "justify-end"
                }`}
              >
                {msg.isAiMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white text-sm">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`p-3 rounded-lg shadow-sm max-w-md ${
                    msg.isAiMessage
                      ? "bg-white"
                      : "bg-primary text-white"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
                  </div>
                </div>
                
                {!msg.isAiMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-300 text-gray-700 text-sm">
                      {user?.firstName[0]}{user?.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white text-sm">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">AI is typing...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
