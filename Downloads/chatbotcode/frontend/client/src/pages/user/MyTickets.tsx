import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketModal } from "@/components/TicketModal";
//import { ChatModal } from "@/components/ChatModal";
import {
  AlertTriangle,
  Clock,
  HourglassIcon,
  AlertCircle,
  Search,
  Eye,
} from "lucide-react";
import type { Ticket } from "@shared/schema";
import { apiFetch } from "@/lib/apiClient";
import { useLocation } from "wouter";

export default function MyTickets() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatTicketId, setChatTicketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => {

      // now the resource id would be fetched dynamically based on the current user, not hardcoded anymore :) 
      // and btw there is getalltickets func in services/api aswell
      const response = await apiFetch(
        `/ticket/fetch`
      );
      if (!response.ok) throw new Error("Failed to fetch tickets");
      // Optionally map createDate to createdAt if needed
      const rawTickets = await response.json();
      return rawTickets.map((ticket: any) => ({
        ...ticket,
        createdAt: ticket.createDate,
        description: ticket.description,
      }));
    },
  });

  const [_, setLocation] = useLocation();

  // Map dropdown values to numeric status codes coming from Autotask
  // Known: 8 => In Progress. Others are placeholders for now.
  const STATUS_CODE_MAP: Record<string, number> = {
    new: 1,
    in_progress: 8,
    waiting_response: 2,
    resolved: 3,
    closed: 4,
  };

  const STATUS_LABEL_FROM_CODE: Record<number, string> = Object.fromEntries(
    Object.entries(STATUS_CODE_MAP).map(([k, v]) => [v, k])
  );

  const ticketHasStatus = (ticket: any, statusKey: string) => {
    if (statusKey === "all") return true;
    const expected = STATUS_CODE_MAP[statusKey];
    const value = ticket.status;
    if (typeof value === "number") return value === expected;
    if (typeof value === "string") return value === statusKey;
    return false;
  };

  // Priority mapping: codes provided by user
  const PRIORITY_CODE_MAP: Record<string, number> = {
    low: 3,
    normal: 2,
    high: 1,
    emergency: 4,
    urgent: 5,
  };

  const PRIORITY_LABEL_FROM_CODE: Record<number, string> = Object.fromEntries(
    Object.entries(PRIORITY_CODE_MAP).map(([k, v]) => [v, k])
  );

  const ticketHasPriority = (ticket: any, priorityKey: string) => {
    if (priorityKey === "all") return true;
    const expected = PRIORITY_CODE_MAP[priorityKey];
    const value = ticket.priority;
    if (typeof value === "number") return value === expected;
    if (typeof value === "string") return value === priorityKey;
    return false;
  };

  const handleViewTicket = async (ticket: Ticket) => {
    try {
      const response = await apiFetch(`/ticket/details?ticket_id=${ticket.id}`);
      const data = await response.json();
      // Map createDate to createdAt for consistency
      const ticketDetails = {
        ...ticket,
        ...data,
        createdAt: data.createDate || ticket.createdAt,
      };
      setSelectedTicket(ticketDetails);
    } catch (error) {
      // Optionally handle error (show notification, etc.)
      setSelectedTicket(ticket); // fallback to basic info
    }
    setIsTicketModalOpen(true);
  };

  const handleOpenChat = (ticketId: number) => {
    const ticket = tickets.find((t: Ticket) => t.id === ticketId);
    if (ticket) {
      setLocation("/ChatBot", { state: { ticket } });
    }
    setIsTicketModalOpen(false);
  };

  // Calculate statistics
  const needAttention = tickets.filter((t: Ticket) =>
    ticketHasStatus(t, "new")
  ).length;
  const inProgress = tickets.filter((t: Ticket) =>
    ticketHasStatus(t, "in_progress")
  ).length;
  const waitingResponse = tickets.filter((t: Ticket) =>
    ticketHasStatus(t, "waiting_response")
  ).length;
  const critical = tickets.filter((t: any) =>
    ticketHasPriority(t, "emergency") || ticketHasPriority(t, "urgent")
  ).length;
  const criticalPercentage =
    tickets.length > 0 ? Math.round((critical / tickets.length) * 100) : 0;

  const getStatusColor = (status: string | number) => {
    const label = typeof status === "number" ? STATUS_LABEL_FROM_CODE[status] : status;
    switch (label) {
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

  const getPriorityColor = (priority: string | number) => {
    const label =
      typeof priority === "number"
        ? PRIORITY_LABEL_FROM_CODE[priority]
        : priority;
    switch (label) {
      case "low":
        return "bg-green-100 text-green-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "emergency":
        return "bg-red-100 text-red-800";
      case "urgent":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string | number) => {
    const label = typeof status === "number" ? STATUS_LABEL_FROM_CODE[status] || `${status}` : status;
    if (!label) return "";
    if (typeof label !== "string") return `${label}`;
    return label
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  };

  const formatPriority = (priority: string | number) => {
    const label =
      typeof priority === "number"
        ? PRIORITY_LABEL_FROM_CODE[priority] || `${priority}`
        : priority;
    if (!label) return "";
    if (typeof label !== "string") return `${label}`;
    return label
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Ticket Queue</h1>
          <p className="text-gray-600">
            Manage and track your assigned tickets
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-500 text-white p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-800">
                    Need Attention
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {needAttention}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 text-white p-3 rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-800">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {inProgress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-orange-500 text-white p-3 rounded-lg">
                  <HourglassIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-800">
                    Waiting Response
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {waitingResponse}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-red-500 text-white p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-800">
                    Critical Priority
                  </p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-red-900">
                      {critical}
                    </p>
                    <span className="text-sm text-red-600 ml-2">
                      {criticalPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Management Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Ticket Management
              </CardTitle>
              <p className="text-sm text-gray-500">
                {tickets.length} of {tickets.length} tickets shown
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Filter, search, and manage your assigned tickets
            </p>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, client, or ID..."
                    className="w-64 pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_response">
                      Waiting Response
                    </SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-32">Client</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-32">Priority</TableHead>
                    <TableHead className="w-32">Created</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading tickets...
                      </TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-gray-500"
                      >
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Apply client-side filters
                    tickets
                      .filter((ticket: any) =>
                        (statusFilter === "all" ? true : ticketHasStatus(ticket, statusFilter)) &&
                        (priorityFilter === "all" ? true : ticketHasPriority(ticket, priorityFilter)) &&
                        (
                          (ticket.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ticket.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ((ticket.ticketNumber || ticket.id)?.toString() || "").includes(searchQuery)
                        )
                      )
                      .map((ticket: Ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          #{ticket.ticketNumber}
                        </TableCell>
                        <TableCell className="max-w-[420px] truncate">{ticket.title}</TableCell>
                        <TableCell className="whitespace-nowrap w-32">Client #{ticket.clientId}</TableCell>
                        <TableCell className="whitespace-nowrap w-32">
                          <Badge className={getStatusColor(ticket.status)}>
                            {formatStatus(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-32">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {formatPriority(ticket.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-32">
                          {ticket.createdAt
                            ? new Date(ticket.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="w-32">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TicketModal
        ticket={selectedTicket}
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onOpenChat={handleOpenChat}
      />
    </>
  );
}
