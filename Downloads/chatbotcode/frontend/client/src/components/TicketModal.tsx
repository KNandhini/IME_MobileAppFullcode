import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Eye } from "lucide-react";
import type { Ticket } from "@shared/schema";
import { useLocation } from "wouter";
import { startWorkOnTicket } from "@/services/api";

interface TicketWithOptionalLink extends Ticket {
  link?: string;
}

interface TicketModalProps {
  ticket: TicketWithOptionalLink | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (ticketId: number) => void;
}

export function TicketModal({
  ticket,
  isOpen,
  onClose,
  onOpenChat,
}: TicketModalProps) {
  console.log("TicketModal ticket:", ticket);
  if (!ticket) return null;
  const [_, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "waiting_response":
        return "bg-orange-100 text-orange-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status; //.replace("_", " ").toUpperCase();
  };

  const formatPriority = (priority: string) => {
    return priority; //.charAt(0).toUpperCase() + priority.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ticket Number
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {ticket.ticketNumber || ticket.id}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <p className="mt-1 text-sm text-gray-900">{ticket.title}</p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <Badge className={getStatusColor(ticket.status)}>
                {formatStatus(ticket.status)}
              </Badge>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <Badge className={getPriorityColor(ticket.priority)}>
                {formatPriority(ticket.priority)}
              </Badge>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {(ticket.description || "").split(/\r\n|\n|\r/)[0]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Created
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(ticket.createdAt || "").toLocaleDateString()}
            </p>
          </div>

          <Separator />

          <div className="flex space-x-3">
            <Button
              onClick={async () => {
                try {
                  await startWorkOnTicket(Number(ticket.id));
                  setLocation(`/ChatBot?ticketId=${ticket.id}`);
                } catch (err) {
                  alert(
                    "Failed to start work on this ticket. Please try again."
                  );
                }
              }}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat About This Ticket
            </Button>
            {ticket.link ? (
              <a
                href={ticket.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                style={{ textDecoration: "none" }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </a>
            ) : (
              <Button variant="outline" className="flex-1" disabled>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
