import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";
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
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  RefreshCw,
  Eye,
} from "lucide-react";
import type { TicketWithLink } from "@shared/schema";

export default function AllTickets() {
  const [selectedTicket, setSelectedTicket] = useState<TicketWithLink | null>(
    null
  );
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatTicketId, setChatTicketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const resourceId = "29682973"; // TODO: Replace with dynamic user ID if available

  const {
    data: tickets = [],
    isLoading,
    refetch,
  } = useQuery<TicketWithLink[]>({
    queryKey: ["tickets", resourceId],
    queryFn: async () => {
      const response = await apiFetch(
        `/ticket/fetch?resource_id=${resourceId}`
      );
      const data = await response.json();
      // Map createDate to createdAt for UI compatibility
      return Array.isArray(data)
        ? data.map((ticket) => ({ ...ticket, createdAt: ticket.createDate }))
        : data;
    },
  });

  const handleViewTicket = (ticket: TicketWithLink) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleOpenChat = (ticketId: number) => {
    setChatTicketId(ticketId);
    setIsTicketModalOpen(false);
    setIsChatModalOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

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

  // Calculate statistics
  const ticketList: TicketWithLink[] = Array.isArray(tickets)
    ? (tickets as TicketWithLink[])
    : [];
  const totalTickets = ticketList.length;
  const newTickets = ticketList.filter((t) => ticketHasStatus(t, "new")).length;
  const inProgressTickets = ticketList.filter((t) => ticketHasStatus(t, "in_progress")).length;
  const criticalTickets = ticketList.filter(
    (t) => ticketHasPriority(t, "emergency") || ticketHasPriority(t, "urgent")
  ).length;
  const criticalPercentage =
    totalTickets > 0 ? Math.round((criticalTickets / totalTickets) * 100) : 0;

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

  

  const formatStatus = (status: string | number) => {
    const label = typeof status === "number" ? STATUS_LABEL_FROM_CODE[status] || `${status}` : status;
    if (!label) return "";
    if (typeof label !== "string") return `${label}`;
    return label
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  };

  const getPriorityColor = (priority: string | number) => {
    const label = typeof priority === "number" ? PRIORITY_LABEL_FROM_CODE[priority] : priority;
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

  const formatPriority = (priority: string | number) => {
    const label = typeof priority === "number" ? PRIORITY_LABEL_FROM_CODE[priority] || `${priority}` : priority;
    if (!label) return "";
    if (typeof label !== "string") return `${label}`;
    return label
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  };

  

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter((ticket: TicketWithLink) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.ticketNumber || ticket.id).toString().includes(searchQuery);
    const matchesStatus = statusFilter === "all" ? true : ticketHasStatus(ticket, statusFilter);
    const matchesPriority = priorityFilter === "all" ? true : ticketHasPriority(ticket, priorityFilter);

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
          <p className="text-gray-600">
            Manage and monitor all organization tickets
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 text-white p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-800">
                    Total Tickets
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {totalTickets}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-500 text-white p-3 rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-800">
                    New Tickets
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {newTickets}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-500 text-white p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-800">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {inProgressTickets}
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
                    Critical Issues
                  </p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-red-900">
                      {criticalTickets}
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

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tickets by title, client, or description..."
                    className="w-80 pl-10"
                  />
                </div>

                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  All Time
                </Button>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
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
                    <SelectValue placeholder="All Priority" />
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

              <Button
                onClick={handleRefresh}
                className="bg-primary hover:bg-primary/90"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Organization Tickets ({filteredTickets.length})
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-32">Client</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-32">Priority</TableHead>
                    <TableHead className="w-32">Assignee</TableHead>
                    <TableHead className="w-32">Created</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Loading tickets...
                      </TableCell>
                    </TableRow>
                  ) : filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-gray-500"
                      >
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket: TicketWithLink) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          #{ticket.ticketNumber || ticket.id}
                        </TableCell>
                        <TableCell className="max-w-[420px] truncate">
                          {ticket.title}
                        </TableCell>
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
                          {ticket.assigneeId
                            ? `User #${ticket.assigneeId}`
                            : "Unassigned"}
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
