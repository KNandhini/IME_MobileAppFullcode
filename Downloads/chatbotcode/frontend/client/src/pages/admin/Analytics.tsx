import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  RefreshCw,
  Download,
  BarChart3,
  Clock,
  Target,
  Zap,
  Users,
  MessageSquare,
  Database,
  Activity,
  Shield,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useState } from "react";
import { 
  getAnalyticsSummary,
  getResolutionTime,
  getFirstResponseTime,
  getTicketMetrics,
  getPriorityDistribution,
  getAIPerformance,
  getScriptStats,
  getAuthStats,
  getOpenAIUsage,
  getUserEngagement,
  getChatInteractions,
  getDataAccess,
  getFeedbackData,
  getUptime,
  submitFeedback,
  startSession,
  endSession,
  logEvent
} from "@/services/api";

// Helper function to format uptime seconds to human readable
function formatUptime(seconds?: number): string {
  if (!seconds) return "N/A";
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default function Analytics() {
  const [selectedDays, setSelectedDays] = useState(7);

  // All analytics queries using the provided endpoints
  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/analytics/summary", selectedDays],
    queryFn: () => getAnalyticsSummary(selectedDays),
  });

  const { data: resolutionTime } = useQuery({
    queryKey: ["/analytics/resolution-time", selectedDays],
    queryFn: () => getResolutionTime(selectedDays),
  });

  const { data: firstResponseTime } = useQuery({
    queryKey: ["/analytics/first-response-time", selectedDays],
    queryFn: () => getFirstResponseTime(selectedDays),
  });

  const { data: ticketMetrics } = useQuery({
    queryKey: ["/analytics/ticket-metrics", selectedDays],
    queryFn: () => getTicketMetrics(selectedDays),
  });

  const { data: priorityDistribution, refetch: refetchPriority } = useQuery({
    queryKey: ["/analytics/priority-distribution", selectedDays],
    queryFn: () => getPriorityDistribution(),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const { data: aiPerformance } = useQuery({
    queryKey: ["/analytics/ai-performance", selectedDays],
    queryFn: () => getAIPerformance(selectedDays),
  });

  const { data: scriptStats } = useQuery({
    queryKey: ["/analytics/script-stats", selectedDays],
    queryFn: () => getScriptStats(selectedDays),
  });

  const { data: authStats } = useQuery({
    queryKey: ["/analytics/auth-stats", selectedDays],
    queryFn: () => getAuthStats(selectedDays),
  });

  const { data: openaiUsage } = useQuery({
    queryKey: ["/analytics/openai-usage", selectedDays],
    queryFn: () => getOpenAIUsage(selectedDays),
  });

  const { data: userEngagement } = useQuery({
    queryKey: ["/analytics/user-engagement", selectedDays],
    queryFn: () => getUserEngagement(selectedDays),
  });

  const { data: chatInteractions } = useQuery({
    queryKey: ["/analytics/chat-interactions", selectedDays],
    queryFn: () => getChatInteractions(selectedDays),
  });

  const { data: dataAccess } = useQuery({
    queryKey: ["/analytics/data-access", 7],
    queryFn: () => getDataAccess(7),
  });

  const { data: feedbackData } = useQuery({
    queryKey: ["/analytics/feedback", selectedDays],
    queryFn: () => getFeedbackData(selectedDays),
  });

  const { data: uptime } = useQuery({
    queryKey: ["/uptime"],
    queryFn: () => getUptime(),
  });

  // Feedback submission functions
  const handleSubmitFeedback = async (
    type: "positive" | "negative",
    sessionId?: string
  ) => {
    try {
      await submitFeedback({
        rating: type === "positive" ? "up" : "down",
        session_id: sessionId,
        timestamp: new Date().toISOString(),
      });
      // Refetch feedback data after submission
      refetch();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  // Session tracking functions
  // Helper to generate a random session_id (UUID v4 style)
  function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const handleStartSession = async () => {
    try {
      await startSession({
        session_id: generateSessionId(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };


  const handleEndSession = async (sessionId: string) => {
    try {
      await endSession({
        session_id: sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  // Generic event logging
  const handleLogEvent = async (eventType: string, eventData: any) => {
    try {
      await logEvent({
        type: eventType,
        event_data: eventData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log event:", error);
    }
  };

  const handleRefresh = () => {
    refetch();
    refetchPriority();
  };

  const handleExport = () => {
    handleLogEvent("export_analytics", { date_range: selectedDays });
    console.log("Exporting data...");
  };

  const handleDaySelection = (days: number) => {
    setSelectedDays(days);
    handleLogEvent("date_range_changed", { new_range: days });
  };

  // Normalize priority counts from different possible response shapes
  function getPriorityCounts(): { high: number; medium: number; low: number } {
    const counts: any = priorityDistribution?.counts || {};
    // Direct numeric key mapping ("1","2","3")
    const fromNumeric = {
      low: Number(counts?.["1"] ?? counts?.[1] ?? 0) || 0,
      medium: Number(counts?.["2"] ?? counts?.[2] ?? 0) || 0,
      high: Number(counts?.["3"] ?? counts?.[3] ?? 0) || 0,
    };
    // Named keys mapping ("low","medium","high") possibly nested {count}
    const fromNamed = {
      low:
        Number((counts?.low && counts?.low.count) ?? counts?.low ?? 0) ||
        fromNumeric.low,
      medium:
        Number((counts?.medium && counts?.medium.count) ?? counts?.medium ?? 0) ||
        fromNumeric.medium,
      high:
        Number((counts?.high && counts?.high.count) ?? counts?.high ?? 0) ||
        fromNumeric.high,
    };
    return fromNamed;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor ticket resolution and conversation analytics
        </p>
      </div>

      {/* Date Range and Export */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Date Range:
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant={selectedDays === 7 ? "default" : "outline"}
                  size="sm"
                  className={selectedDays === 7 ? "bg-primary" : ""}
                  onClick={() => handleDaySelection(7)}
                >
                  7d
                </Button>
                <Button
                  variant={selectedDays === 14 ? "default" : "outline"}
                  size="sm"
                  className={selectedDays === 14 ? "bg-primary" : ""}
                  onClick={() => handleDaySelection(14)}
                >
                  14d
                </Button>
                <Button
                  variant={selectedDays === 30 ? "default" : "outline"}
                  size="sm"
                  className={selectedDays === 30 ? "bg-primary" : ""}
                  onClick={() => handleDaySelection(30)}
                >
                  30d
                </Button>
                <Button
                  variant={selectedDays === 90 ? "default" : "outline"}
                  size="sm"
                  className={selectedDays === 90 ? "bg-primary" : ""}
                  onClick={() => handleDaySelection(90)}
                >
                  90d
                </Button>
              </div>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                className="bg-primary hover:bg-primary/90"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Uptime</p>
                <p className="text-2xl font-bold text-green-600">
                  {uptime ? formatUptime(uptime.uptime_seconds) : "Loading..."}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  SOP Retrieval Accuracy
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {/* {analytics?.rag?.sop_retrieval_accuracy || 0}% */}
                  {analytics?.rag?.sop_retrieval_accuracy !== undefined
                    ? `${Number(analytics.rag.sop_retrieval_accuracy).toFixed(
                        2
                      )}%`
                    : "0.00%"}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  SerpAPI Fallback Rate
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {/* {analytics?.rag?.serp_fallback_rate || 0}% */}
                  {analytics?.rag?.serp_fallback_rate !== undefined
                    ? `${Number(analytics.rag.serp_fallback_rate).toFixed(2)}%`
                    : "0.00%"}
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Script Success Rate
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {scriptStats?.success_rate || 0}%
                </p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Auth Success Rate
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {authStats?.success_rate !== undefined
                    ? `${Number(authStats.success_rate).toFixed(2)}%`
                    : "0.00%"}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Resolution Time</CardTitle>
            <p className="text-sm text-gray-600">
              Average time to resolve tickets
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
              <Clock className="h-14 w-14 text-blue-400 mb-4" />
              <div className="flex flex-col items-center space-y-2">
                <span className="text-4xl font-bold text-blue-700">
                  {resolutionTime?.average_resolution_hours !== undefined
                    ? `${resolutionTime.average_resolution_hours} hrs`
                    : "N/A"}
                </span>
                <span className="text-md text-gray-600">
                  Avg. Resolution Time
                </span>
              </div>
              <div className="flex flex-col items-center mt-6">
                <span className="text-2xl font-semibold text-green-700">
                  {resolutionTime?.closed_count !== undefined
                    ? resolutionTime.closed_count
                    : "N/A"}
                </span>
                <span className="text-sm text-gray-500">Tickets Closed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Closure Rate</CardTitle>
            <p className="text-sm text-gray-600">Closed vs open tickets</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center">
              {/* Donut Chart Visualization */}
              <div className="flex flex-col items-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="16"
                    strokeDasharray={`${Math.max(
                      0,
                      Math.min(
                        100,
                        ticketMetrics?.closure_rate
                          ? ticketMetrics.closure_rate
                          : 0
                      )
                    )} ${
                      100 -
                      Math.max(
                        0,
                        Math.min(
                          100,
                          ticketMetrics?.closure_rate
                            ? ticketMetrics.closure_rate
                            : 0
                        )
                      )
                    }`}
                    strokeDashoffset="25"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text
                    x="60"
                    y="68"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="bold"
                    fill="#22c55e"
                  >
                    {ticketMetrics?.closure_rate !== undefined
                      ? `${ticketMetrics.closure_rate.toFixed(0)}%`
                      : "N/A"}
                  </text>
                </svg>
                <div className="flex items-center justify-center mt-4 space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Closed: {ticketMetrics?.closed ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Processed:{" "}
                      {(ticketMetrics?.processed ?? 0) -
                        (ticketMetrics?.closed ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
            <p className="text-sm text-gray-600">
              Priority distribution breakdown
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center">
              {(() => {
                const normalized = getPriorityCounts();
                const hasData =
                  (normalized.high || 0) > 0 ||
                  (normalized.medium || 0) > 0 ||
                  (normalized.low || 0) > 0;
                if (!hasData) return null;
                const counts = {
                  "1": normalized.low,
                  "2": normalized.medium,
                  "3": normalized.high,
                } as Record<string, number>;
                return (
                <svg
                  width="100%"
                  height="120"
                  viewBox="0 0 600 120"
                  preserveAspectRatio="none"
                >
                  {/* Horizontal Bars */}
                  {(() => {
                    const maxCount = Math.max(counts["1"] || 0, counts["2"] || 0, counts["3"] || 0, 1);
                    const barMaxWidth = 400; // px
                    const getBarWidth = (count: number) => (count / maxCount) * barMaxWidth;
                    return (
                      <g>
                        {/* High */}
                        <rect
                          x="120"
                          y="20"
                          width={getBarWidth(counts["3"] || 0)}
                          height="30"
                          fill="#ef4444"
                          rx="4"
                        />
                        {/* Medium */}
                        <rect
                          x="120"
                          y="55"
                          width={getBarWidth(counts["2"] || 0)}
                          height="30"
                          fill="#facc15"
                          rx="4"
                        />
                        {/* Low */}
                        <rect
                          x="120"
                          y="90"
                          width={getBarWidth(counts["1"] || 0)}
                          height="30"
                          fill="#22c55e"
                          rx="4"
                        />
                        {/* Counts at end of bar */}
                        <text
                          x={120 + getBarWidth(counts["3"] || 0) + 10}
                          y="40"
                          fill="#ef4444"
                          fontSize="16"
                          fontWeight="bold"
                          alignmentBaseline="middle"
                        >
                          {counts["3"] || 0}
                        </text>
                        <text
                          x={120 + getBarWidth(counts["2"] || 0) + 10}
                          y="75"
                          fill="#facc15"
                          fontSize="16"
                          fontWeight="bold"
                          alignmentBaseline="middle"
                        >
                          {counts["2"] || 0}
                        </text>
                        <text
                          x={120 + getBarWidth(counts["1"] || 0) + 10}
                          y="110"
                          fill="#22c55e"
                          fontSize="16"
                          fontWeight="bold"
                          alignmentBaseline="middle"
                        >
                          {counts["1"] || 0}
                        </text>
                        {/* Labels */}
                        <text
                          x="20"
                          y="40"
                          fill="#ef4444"
                          fontSize="14"
                          alignmentBaseline="middle"
                        >
                          High
                        </text>
                        <text
                          x="20"
                          y="75"
                          fill="#facc15"
                          fontSize="14"
                          alignmentBaseline="middle"
                        >
                          Medium
                        </text>
                        <text
                          x="20"
                          y="110"
                          fill="#22c55e"
                          fontSize="14"
                          alignmentBaseline="middle"
                        >
                          Low
                        </text>
                      </g>
                    );
                  })()}
                </svg>
                );
              })() || (
                <div className="text-gray-400 text-lg">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>First Response Time</CardTitle>
            <p className="text-sm text-gray-600">Average first response time</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center">
              <Clock className="h-14 w-14 text-blue-400 mb-4" />
              <span className="text-4xl font-bold text-blue-700">
                {firstResponseTime?.average_first_response_seconds !== undefined
                  ? `${firstResponseTime.average_first_response_seconds.toFixed(
                      2
                    )} s`
                  : "N/A"}
              </span>
              <span className="text-md text-gray-600 mt-2">
                Avg. First Response
              </span>
              <span className="text-sm text-gray-500 mt-4">
                Samples: {firstResponseTime?.samples ?? "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Section - Merged */}
      <Card>
        <CardHeader>
          <CardTitle>AI Performance Metrics</CardTitle>
          <p className="text-sm text-gray-600">
            Latency and response time for AI and vector DB
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex flex-col justify-center">
            <div className="flex flex-col md:flex-row items-center justify-around h-full w-full">
              {/* AI Response Time */}
              <div className="flex flex-col items-center justify-center w-full md:w-1/2 mb-6 md:mb-0">
                <Zap className="h-14 w-14 text-blue-400 mb-4" />
                <span className="text-3xl font-bold text-blue-700">
                  {aiPerformance?.ai_response_time_ms !== undefined
                    ? `${Number(aiPerformance.ai_response_time_ms).toFixed(
                        2
                      )} ms`
                    : "N/A"}
                </span>
                <span className="text-md text-gray-600 mt-2">
                  AI Response Time
                </span>
              </div>
              {/* Pinecone Latency */}
              <div className="flex flex-col items-center justify-center w-full md:w-1/2">
                <Database className="h-14 w-14 text-green-400 mb-4" />
                <span className="text-3xl font-bold text-green-700">
                  {aiPerformance?.pinecone_latency_ms !== undefined
                    ? `${Number(aiPerformance.pinecone_latency_ms).toFixed(
                        2
                      )} ms`
                    : "N/A"}
                </span>
                <span className="text-md text-gray-600 mt-2">
                  Pinecone Latency
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Engagement Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <p className="text-sm text-gray-600">Daily active user count</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center">
              <Users className="h-14 w-14 text-blue-400 mb-4" />
              <span className="text-4xl font-bold text-blue-700">
                {userEngagement?.active_users !== undefined
                  ? userEngagement.active_users
                  : "N/A"}
              </span>
              <span className="text-md text-gray-600 mt-2">
                Active Users Today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Interaction Frequency</CardTitle>
            <p className="text-sm text-gray-600">Avg. follow-ups per ticket</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center">
              <MessageSquare className="h-14 w-14 text-blue-400 mb-4" />
              <span className="text-4xl font-bold text-blue-700">
                {chatInteractions?.avg_followups_per_ticket !== undefined
                  ? chatInteractions.avg_followups_per_ticket.toFixed(2)
                  : "N/A"}
              </span>
              <span className="text-md text-gray-600 mt-2">
                Avg. Follow-ups/Ticket
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback and Scripts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Answer Feedback</CardTitle>
            <p className="text-sm text-gray-600">
              User feedback on AI responses
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col flex-col items-center justify-center">
              {/* Donut Chart Visualization */}
              <div className="flex flex-col items-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {/* Background ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                  />
                  {/* Positive feedback arc (green) */}
                  {(() => {
                    const radius = 48;
                    const circumference = 2 * Math.PI * radius;
                    const positive = Math.max(
                      0,
                      Math.min(100, feedbackData?.positive_rate || 0)
                    );
                    const negative = 100 - positive;
                    const positiveLength = (positive / 100) * circumference;
                    const negativeLength = (negative / 100) * circumference;
                    return (
                      <>
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="16"
                          strokeDasharray={`${positiveLength} ${
                            circumference - positiveLength
                          }`}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                          style={{ transition: "stroke-dasharray 0.6s" }}
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="16"
                          strokeDasharray={`${negativeLength} ${
                            circumference - negativeLength
                          }`}
                          strokeDashoffset={-positiveLength}
                          strokeLinecap="butt"
                          transform="rotate(-90 60 60)"
                          style={{
                            transition:
                              "stroke-dasharray 0.6s, stroke-dashoffset 0.6s",
                          }}
                        />
                      </>
                    );
                  })()}
                  <text
                    x="60"
                    y="68"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="bold"
                    fill="#22c55e"
                  >
                    {feedbackData?.positive_rate !== undefined
                      ? `${feedbackData.positive_rate.toFixed(0)}%`
                      : "N/A"}
                  </text>
                </svg>
                <div className="flex items-center justify-center mt-4 space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Positive: {feedbackData?.positive || 0}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Negative:{" "}
                      {(feedbackData?.total || 0) -
                        (feedbackData?.positive || 0)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Feedback buttons for testing */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Executed Scripts</CardTitle>
            <p className="text-sm text-gray-600">
              Most frequently used scripts
            </p>
          </CardHeader>
          <CardContent>
            {/* Summary Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500">Success Rate</span>
                <span className="text-lg font-semibold text-purple-700">
                  {scriptStats?.success_rate !== undefined
                    ? `${Number(scriptStats.success_rate).toFixed(2)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500">Success</span>
                <span className="text-lg font-semibold text-green-600">
                  {scriptStats?.success !== undefined
                    ? scriptStats.success
                    : "N/A"}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500">Failure</span>
                <span className="text-lg font-semibold text-red-600">
                  {scriptStats?.failure !== undefined
                    ? scriptStats.failure
                    : "N/A"}
                </span>
              </div>
            </div>
            {/* Horizontal Bar Chart */}
            <div className="w-full max-w-md mx-auto">
              {scriptStats?.top_scripts &&
              scriptStats.top_scripts.length > 0 ? (
                <div className="space-y-4">
                  {scriptStats.top_scripts.map(
                    (
                      script: { component_uid: string; count: number },
                      idx: number
                    ) => {
                      // Find the max count for bar scaling
                      const maxCount = Math.max(
                        ...scriptStats.top_scripts.map((s: any) => s.count),
                        1
                      );
                      const percent = (script.count / maxCount) * 100;
                      return (
                        <div
                          key={script.component_uid}
                          className="flex items-center space-x-2"
                        >
                          <span className="w-32 truncate text-sm text-gray-700">
                            {script.component_uid}
                          </span>
                          <div className="flex-1 h-6 bg-gray-200 rounded-full relative">
                            <div
                              className="h-6 rounded-full bg-blue-500 flex items-center justify-end pr-2 text-white text-xs font-bold transition-all duration-300"
                              style={{ width: `${percent}%`, minWidth: "2rem" }}
                            >
                              {script.count}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  No script execution data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authentication Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Statistics</CardTitle>
          <p className="text-sm text-gray-600">
            Login attempts and success rates
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {authStats?.success !== undefined ? authStats.success : "N/A"}
              </p>
              <p className="text-sm text-gray-600">Success</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {authStats?.failure !== undefined ? authStats.failure : "N/A"}
              </p>
              <p className="text-sm text-gray-600">Failure</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {authStats?.success_rate !== undefined
                  ? `${Number(authStats.success_rate).toFixed(2)}%`
                  : "0.00%"}
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI Usage */}
      <Card>
        <CardHeader>
          <CardTitle>OpenAI Usage</CardTitle>
          <p className="text-sm text-gray-600">API usage (calls to OpenAI)</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-3xl font-bold text-blue-700">
              {openaiUsage?.openai_calls !== undefined
                ? openaiUsage.openai_calls
                : "N/A"}
            </p>
            <p className="text-md text-gray-600 mt-2">OpenAI Calls</p>
          </div>
        </CardContent>
      </Card>

      {/* Data Access Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Access (Last 7 Days)</CardTitle>
          <p className="text-sm text-gray-600">Recent data access patterns</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource / Endpoint</TableHead>
                  <TableHead>Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataAccess?.resources && dataAccess.resources.length > 0 ? (
                  dataAccess.resources.map(
                    (resource: { _id: string; count: number }) => {
                      const id = resource._id;
                      return (
                        <TableRow key={id}>
                          <TableCell className="font-mono break-all text-blue-900">
                            {id}
                          </TableCell>
                          <TableCell>{resource.count}</TableCell>
                        </TableRow>
                      );
                    }
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-gray-400"
                    >
                      No data access records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Original Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <p className="text-sm text-gray-600">Detailed metrics breakdown</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>Total Conversations</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead>Resolution Rate</TableHead>
                    <TableHead>Abandon Rate</TableHead>
                    <TableHead>Avg. Response Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">System-1</TableCell>
                    <TableCell>{analytics?.tickets?.total || 0}</TableCell>
                    <TableCell>{analytics?.tickets?.inProgress || 0}</TableCell>
                    <TableCell>
                      {analytics?.tickets?.total > 0
                        ? Math.round(
                            (analytics.tickets.inProgress /
                              analytics.tickets.total) *
                              100
                          )
                        : 0}
                      %
                    </TableCell>
                    <TableCell>
                      {analytics?.tickets?.total > 0
                        ? Math.round(
                            ((analytics.tickets.total -
                              analytics.tickets.inProgress) /
                              analytics.tickets.total) *
                              100
                          )
                        : 0}
                      %
                    </TableCell>
                    <TableCell>2.4 minutes</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Good
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
