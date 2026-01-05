import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
//import { postFeedback } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Ticket as TicketType,
  Message,
  ChatHistory as ChatHistoryType,
} from "@/types/ticket";
import ChatRightSidebar from "./ChatRightSidebar";
import { apiFetch } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { getTicketDetails } from "@/services/api"; // Unified API method using apiFetch
import { index } from "drizzle-orm/mysql-core";
import {
  submitFeedback,
  startSession,
  endSession,
  logEvent,
  markTicketAsCompleted,
  markTicketAsOnHold,
} from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Format AI answer for readable HTML (basic markdown and lists)
function formatAIMessage(text: string): string {
  if (!text) return "";
  // Convert markdown-like bold/italic
  let html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Convert numbered lists (e.g. 1. ... 2. ...)
  html = html.replace(/\n?(\d+)\. /g, "<br/><b>$1.</b> ");

  // Convert bullet points (- or *)
  html = html.replace(/\n?[-*] (.*)/g, "<br/>• $1");

  // Convert double newlines to paragraph breaks
  html = html.replace(/(<br\/>)+/g, "<br/>"); // collapse multiple <br/>
  html = html.replace(/(<br\/>){2,}/g, "<br/>"); // never more than one <br/>
  html = html.replace(/\n\n+/g, "</p><p>");
  html = html.replace(/\n/g, "<br/>");
  html = `<p>${html}</p>`;
  // Remove <br/> right after <p> and before </p>
  html = html.replace(/<p><br\/>/g, "<p>");
  html = html.replace(/<br\/><\/p>/g, "</p>");
  return html;
}

interface ChatViewProps {
  chatTicket: TicketType | null;
  chatMessages: Message[];
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  isLoading: boolean;
  onSendMessage: (message?: string) => void;
  chatHistory: ChatHistoryType[];
  currentChatId: string | null;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  onLoadChatHistory: (historyItem: ChatHistoryType) => void;
  onDeleteChatHistory: (historyId: string) => void;
  onNewChat: () => void;
  onSaveAndNewChat: () => void;
  topSOPs: string[];
}

function formatTimestamp(timestamp: string) {
  // --- FEEDBACK SUBMISSION HANDLER ---
  async function submitFeedback(type: "positive" | "negative") {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        alert("Thank you for your feedback!");
      } else {
        alert("Failed to submit feedback.");
      }
    } catch (e) {
      alert("Failed to submit feedback.");
    }
  }

  if (!timestamp) return "";
  // Try to parse as Date, fallback to string
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

const ChatView: React.FC<ChatViewProps> = ({
  chatTicket,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  isLoading,
  onSendMessage,
  chatHistory,
  currentChatId,
  showHistory,
  setShowHistory,
  onLoadChatHistory,
  onDeleteChatHistory,
  onNewChat,
  onSaveAndNewChat,
  topSOPs,
}) => {
  const { user } = useAuth();
  // Extract initials from user name (e.g., "John Doe" -> "JD")
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"; // fallback to 'U' if no user

  // --- FEEDBACK SUBMISSION LOGIC ---
  // Add feedback logic using submitFeedback and handleFeedback, matching the user's request
  // and keeping the feedback UI unchanged.
  // Feedback logic
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

  const handleFeedback = async (
    type: "positive" | "negative",
    sessionId?: string
  ) => {
    try {
      await submitFeedback({
        rating: type === "positive" ? "up" : "down",
        session_id:
          sessionId || localStorage.getItem("session_id") || undefined,
        timestamp: new Date().toISOString(),
      });
      setShowFeedbackSuccess(true);
      // Optionally refetch feedback data here if you use useQuery
      // refetch && refetch();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  type FeedbackType = "positive" | "negative";

  const [ticketDetails, setTicketDetails] = useState<TicketType | null>(null);
  const [showDummyScripts, setShowDummyScripts] = useState(true);

  const [jobId, setJobId] = useState<string>("");
  // State to store fetched component names
  // Store both names and uids for mapping
  const [componentList, setComponentList] = useState<
    { name: string; uid: string; source?: string }[]
  >([]);
  const [componentNames, setComponentNames] = useState<string[]>([]); // for backward compatibility, can be removed later
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [isEndChatLoading, setIsEndChatLoading] = useState(false);
  // New: End Chat notes modal and confirmation flow
  const [showEndChatNotesModal, setShowEndChatNotesModal] = useState(false);
  const [endChatNotes, setEndChatNotes] = useState("");
  const [showConfirmEndChat, setShowConfirmEndChat] = useState(false);
  const closeTicketAndRedirect = async () => {
    if (isEndChatLoading) return;
    try {
      setIsEndChatLoading(true);
      const idToClose = Number(ticketDetails?.id ?? chatTicket?.id);
      if (!idToClose || isNaN(idToClose)) {
        throw new Error("Missing ticket id");
      }
      // Append optional closing notes as the last user message so API can serialize with timestamps
      const messagesWithNotes =
        endChatNotes && endChatNotes.trim().length > 0
          ? [
              ...chatMessages,
              {
                role: "user",
                content: endChatNotes.trim(),
                timestamp: new Date().toISOString(),
              },
            ]
          : chatMessages;

      await markTicketAsCompleted(idToClose, messagesWithNotes);
      window.location.href = "/tickets";
    } catch (e) {
      console.error(e);
      alert("Failed to mark ticket as completed.");
    } finally {
      setIsEndChatLoading(false);
    }
  };

  // Show action buttons after every bot response

  const handleExecuteScript = async () => {
    setIsScriptLoading(true);
    setComponentList([]);
    try {
      // Try to get the script description from the selected script or ticket details
      let scriptDescription = "";
      // Example: use ticketDetails.description or another field if available
      if (ticketDetails && ticketDetails.description) {
        scriptDescription = ticketDetails.description;
      }
      // Defensive fallback: if no description, show error and abort
      if (!scriptDescription || scriptDescription.trim() === "") {
        setIsScriptLoading(false);
        setComponentList([]);
        setSuccessMsg(
          "No script description available to fetch relevant scripts."
        );
        return;
      }
      const query = encodeURIComponent(scriptDescription);
      const response = await apiFetch(`/component/fetch?query=${query}`);
      if (!response.ok) throw new Error("Failed to fetch components");
      const data = await response.json();
      // Extract both name and uid
      const list = Array.isArray(data)
        ? data
            .filter((c: any) => c.component_name && c.component_uid)
            .map((c: any) => ({ name: c.component_name, uid: c.component_uid }))
        : [];
      setComponentList(list);
    } catch (err) {
      setComponentList([]);
      setSuccessMsg("Failed to fetch relevant scripts.");
    } finally {
      setIsScriptLoading(false);
    }
  };

  // Modal state and variable form state
  const [showVarModal, setShowVarModal] = useState(false);
  const [varFields, setVarFields] = useState<any[]>([]); // array of {name, description, ...}
  const [varValues, setVarValues] = useState<{ [key: string]: any }>({});
  const [modalTitle, setModalTitle] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentComponentUid, setCurrentComponentUid] = useState<string>("");
  const [currentComponentName, setCurrentComponentName] = useState<string>("");

  // Handle clicking a script pill
  const handleScriptClick = async (name: string, uid: string) => {
    setSuccessMsg("");
    setModalTitle(name);
    setCurrentComponentUid(uid);
    setCurrentComponentName(name);
    setShowVarModal(false);
    setVarFields([]);
    setVarValues({});
    try {
      const response = await apiFetch(
        `/component/variables?component_uid=${uid}`
      );
      const data = await response.json();
      let backendVars =
        data && Array.isArray(data.variables) ? data.variables : [];
      // Filter out device_id if backend accidentally includes it
      backendVars = backendVars.filter((v: any) => v.name !== "device_id");
      setVarFields(backendVars);
      // Set up default values for all backend variables (if any) and device_id
      const defaults: any = { device_id: "" };
      backendVars.forEach((v: any) => {
        if (!v.is_required && v.default_value !== undefined)
          defaults[v.name] = v.default_value;
        else defaults[v.name] = "";
      });
      setVarValues(defaults);
      setShowVarModal(true);
    } catch (err) {
      setShowVarModal(false);
      setSuccessMsg("The script is scheduled successfully");
    }
  };

  const handleVarChange = (name: string, value: any) => {
    setVarValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleVarFormSave = async () => {
    try {
      // Require device_id
      const deviceId = varValues.device_id?.trim();
      if (!deviceId) {
        alert("Device ID is required.");
        return;
      }
      // Convert varValues object to the required format (excluding device_id)
      const variables = Object.entries(varValues)
        .filter(([name]) => name !== "device_id")
        .map(([name, value]) => ({
          name,
          value: value.toString(),
        }));

      const requestBody = {
        uid: currentComponentUid,
        name: currentComponentName,
        device_id: deviceId,
        variables: variables,
      };

      const response = await apiFetch(`/component/execute`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      console.log(response, "response");
      const data = await response.json();
      if (response.ok) {
        setShowVarModal(false);
        setSuccessMsg(
          `The Script is Scheduled Successfully and the job is created with the below Job Id. ${data.uid}`
        );
        setJobId(data.uid);
      } else {
        setSuccessMsg("Failed to execute script");
      }
    } catch (error) {
      console.error("Error executing script:", error);
      setSuccessMsg("Failed to execute script");
    }
  };
  const handleVarFormCancel = () => {
    setShowVarModal(false);
  };

  // Fetch ticket details when chatTicket.id changes
  useEffect(() => {
    if (!chatTicket?.id) return;

    const fetchDetails = async () => {
      try {
        if (!chatTicket?.id) throw new Error("No ticket ID");
        const details = await getTicketDetails(chatTicket.id);
        setTicketDetails(details);
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes("unauthorized")) {
          setTicketDetails(null);
          // Optionally trigger a login redirect or show a message
        } else {
          setTicketDetails(null);
        }
        console.error("Error fetching ticket details:", err);
      }
    };

    fetchDetails();
  }, [chatTicket?.id]);

  return (
    <>
      {ticketDetails ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-6 py-3 mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-blue-700 font-semibold">Ticket Context:</span>
            <a
              href={`/tickets/${ticketDetails.id}`}
              className="text-blue-900 font-bold underline hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              {ticketDetails.ticketNumber}
            </a>
            <span className="text-blue-700 font-medium ml-2">
              - {ticketDetails.title}
            </span>
          </div>
          <div>
            <span className="text-blue-600 text-sm font-medium">
              Currently discussing: {ticketDetails.title}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-6 py-3 mb-6 flex flex-col gap-1">
          <span className="text-blue-700">Loading ticket details...</span>
        </div>
      )}
      <div className="flex w-full min-h-screen h-screen gap-4">
        <div className="flex-1 flex flex-col h-full min-h-screen">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* This section now uses live API data */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                AI Assistant Chat
              </h1>
              {ticketDetails ? (
                <p className="text-gray-700 font-medium">
                  Ticket ID: {ticketDetails.ticketNumber} —{" "}
                  {ticketDetails.title}
                </p>
              ) : (
                <p className="text-gray-600">
                  Ask technical questions or request help with troubleshooting
                </p>
              )}
            </div>
          </div>

          {/* FEEDBACK SUCCESS POPUP */}
          {showFeedbackSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-green-100 p-3 mb-4">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    Thank you for your feedback!
                  </h2>
                  <p className="mb-6 text-gray-600">
                    We appreciate your input and will use it to improve our
                    service.
                  </p>
                  <button
                    className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      setShowFeedbackSuccess(false);
                      window.location.href = "/tickets";
                    }}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat UI remains the same */}
          <Card className="flex-1 flex flex-col min-h-0 h-full w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="border-b px-6 py-4">
              <CardTitle className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-white font-medium">
                    AI
                  </AvatarFallback>
                </Avatar>
                <span>AI Assistant</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6 w-full">
                {chatMessages.map((msg, index) => {
                  // After the first AI message, show the dummy scripts
                  const isFirstAI =
                    index === 0 &&
                    msg.role === "assistant" &&
                    msg.content
                      .toLowerCase()
                      .includes("hello! i'm your techants ai assistant");
                  return (
                    <React.Fragment key={index}>
                      <div
                        className={cn(
                          "flex gap-4 group",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-white font-medium">
                              AI
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 max-w-[75%] break-words relative",
                            msg.role === "user"
                              ? "bg-primary text-white ml-auto"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          {msg.role === "assistant" ? (
                            <div
                              className="text-sm leading-relaxed prose prose-blue max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: formatAIMessage(msg.content),
                              }}
                            />
                          ) : (
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          )}
                          <div
                            className={cn(
                              "block text-[10px] leading-none mt-2 px-1",
                              msg.role === "user"
                                ? "text-blue-200 text-right w-full"
                                : "text-gray-400 text-left w-full"
                            )}
                          >
                            {formatTimestamp(msg.timestamp)}
                          </div>
                        </div>

                        {msg.role === "user" && (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-gray-500 text-white">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}

                {isLoading && (
                  <div className="flex justify-start gap-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-white font-medium">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <div className="border-t p-6">
              {/* Show component names as pill buttons if any */}
              {componentList.length > 0 && (
                <div className="flex flex-col items-center gap-2 mb-4">
                  {componentList.map((item, idx) => {
                    // Support for future: item.source (e.g., 'Datto RMM', 'Other RMM')
                    const source = item.source || "Datto RMM";
                    return (
                      <button
                        key={idx}
                        className="bg-white border border-blue-600 text-blue-600 px-3 py-1 rounded-full text-sm font-normal min-w-[180px] text-center shadow-sm hover:bg-blue-50 focus:outline-none transition-colors flex items-center gap-2"
                        style={{ boxShadow: "none" }}
                        onClick={() => handleScriptClick(item.name, item.uid)}
                      >
                        <span>{item.name}</span>
                        <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                          {source}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {successMsg && !showFeedbackSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative text-center">
                    {/* Success Icon */}
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Success!
                    </h2>

                    {/* Message */}
                    <p className="text-gray-600 mb-4">
                      The Script is Scheduled Successfully and the job is
                      created with the below Job Id.
                    </p>

                    {/* Job ID Box */}
                    {jobId && (
                      <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm text-gray-700 mb-6 break-all">
                        {jobId}
                      </div>
                    )}

                    {/* Back to Home -> comments first, then confirmation */}
                    <button
                      className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                      onClick={() => setShowEndChatNotesModal(true)}
                    >
                      Back to Home
                    </button>
                    {showConfirmEndChat && (
                      <AlertDialog open={showConfirmEndChat} onOpenChange={(open) => setShowConfirmEndChat(open)}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Do you want to close Autotask ticket?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                            Clicking Yes will mark the ticket as Completed. Clicking No will mark the ticket as On Hold
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => {
                                try {
                                  const id = Number(ticketDetails?.id ?? chatTicket?.id);
                                  if (!id || isNaN(id)) throw new Error("Missing ticket id");
                                  void markTicketAsOnHold(id);
                                  window.location.href = "/tickets";
                                } catch (err) {
                                  console.error(err);
                                  alert("Failed to set ticket on hold.");
                                }
                              }}
                            >
                              No
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={closeTicketAndRedirect}>
                              {isEndChatLoading ? "Please wait..." : "Yes"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        className="w-full px-6 py-3 rounded-lg border border-green-600 text-green-600 hover:bg-green-50 font-medium transition-colors flex items-center justify-center"
                        onClick={() => handleFeedback("positive")}
                      >
                        <svg
                          className="h-5 w-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 9V5a3 3 0 00-6 0v4M5 15h14l-1.405 5.618A2 2 0 0115.638 22H8.362a2 2 0 01-1.957-1.382L5 15zm4-6h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2z"
                          />
                        </svg>
                        Submit Positive
                      </button>
                      <button
                        className="w-full px-6 py-3 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center justify-center"
                        onClick={() => handleFeedback("negative")}
                      >
                        <svg
                          className="h-5 w-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 15V19a3 3 0 006 0v-4M19 9H5l1.405-5.618A2 2 0 018.362 2h7.276a2 2 0 011.957 1.382L19 9zm-4 6H9a2 2 0 01-2-2v-6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2z"
                          />
                        </svg>
                        Submit Negative
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal for variable form */}
              {showVarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 relative">
                    <div className="p-6 pb-0 border-b">
                      <h3 className="text-lg font-semibold mb-2 text-blue-700">
                        {modalTitle} - Script Variables
                      </h3>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleVarFormSave();
                      }}
                      className="flex flex-col"
                      style={{ maxHeight: "70vh" }}
                    >
                      <div
                        className="overflow-y-auto px-6 pt-2 pb-0"
                        style={{ maxHeight: "48vh", minHeight: "120px" }}
                      >
                        {/* Device ID Field */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Device ID{" "}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="text-xs text-gray-500 mb-1">
                            Enter the device ID for this script execution.
                          </div>
                          <input
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-200"
                            type="text"
                            required
                            value={varValues.device_id ?? ""}
                            onChange={(e) =>
                              handleVarChange("device_id", e.target.value)
                            }
                            placeholder="Enter device ID"
                          />
                        </div>
                        {varFields.map((field, idx) => (
                          <div className="mb-4" key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.name}
                              {field.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            <div className="text-xs text-gray-500 mb-1">
                              {field.description}
                            </div>
                            {field.type === "string" ? (
                              <input
                                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-200"
                                type="text"
                                required={!!field.is_required}
                                value={varValues[field.name] ?? ""}
                                onChange={(e) =>
                                  handleVarChange(field.name, e.target.value)
                                }
                              />
                            ) : field.type === "boolean" ? (
                              <select
                                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-200"
                                value={varValues[field.name] ?? ""}
                                onChange={(e) =>
                                  handleVarChange(
                                    field.name,
                                    e.target.value === "true"
                                  )
                                }
                                required={!!field.is_required}
                              >
                                <option value="">Select...</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            ) : (
                              <input
                                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-200"
                                type="text"
                                required={!!field.is_required}
                                value={varValues[field.name] ?? ""}
                                onChange={(e) =>
                                  handleVarChange(field.name, e.target.value)
                                }
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 p-6 pt-2 border-t bg-white">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                          onClick={handleVarFormCancel}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="w-full">
                <div className="flex items-center gap-3 justify-end">
                  <Input
                    placeholder="Type your message..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !isLoading && onSendMessage()
                    }
                    className="flex-1 h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => onSendMessage()}
                    disabled={!currentMessage.trim() || isLoading}
                    className="flex-shrink-0 h-12 px-6 rounded-xl"
                  >
                    <Send size={16} className="mr-2" />
                    Send
                  </Button>
                  <div className="flex flex-col gap-3 w-1/5">
                    <Button
                      onClick={handleExecuteScript}
                      variant="outline"
                      disabled={isScriptLoading}
                      className="h-8 px-4 rounded-lg w-full text-sm"
                    >
                      {isScriptLoading ? "Loading..." : "Execute the Script"}
                    </Button>

                    {/* First step: open notes modal */}
                    <Button
                      variant="outline"
                      className="h-8 px-4 rounded-lg w-full text-sm"
                      onClick={() => setShowEndChatNotesModal(true)}
                    >
                      End Chat
                    </Button>
                    {/* Second step: show confirmation dialog after notes submit */}
                    {showConfirmEndChat && (
                      <AlertDialog open={showConfirmEndChat} onOpenChange={(open) => setShowConfirmEndChat(open)}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Do you want to close Autotask ticket?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                            Clicking Yes will mark the ticket as Completed. Clicking No will mark the ticket as On Hold.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => {
                                try {
                                  const id = Number(ticketDetails?.id ?? chatTicket?.id);
                                  if (!id || isNaN(id)) throw new Error("Missing ticket id");
                                  void markTicketAsOnHold(id);
                                  window.location.href = "/tickets";
                                } catch (err) {
                                  console.error(err);
                                  alert("Failed to set ticket on hold.");
                                }
                              }}
                            >
                              No
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={closeTicketAndRedirect}>
                              {isEndChatLoading ? "Please wait..." : "Yes"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <ChatRightSidebar
          ticketTitle={ticketDetails?.title}
          ticketId={ticketDetails?.id}
          ticketDescription={ticketDetails?.description}
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onLoadChatHistory={onLoadChatHistory}
          onDeleteChatHistory={onDeleteChatHistory}
          onNewChat={onNewChat}
          topSOPs={topSOPs}
        />
      </div>
      {/* Notes modal shown before confirmation */}
      {showEndChatNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Add closing comments</h3>
            <p className="text-sm text-gray-600 mb-4">Optional: add any notes you want recorded on the ticket along with the chat transcript.</p>
            <textarea
              className="w-full h-48 border rounded-md p-3 focus:ring focus:ring-blue-200 outline-none"
              placeholder="Write your comments here..."
              value={endChatNotes}
              onChange={(e) => setEndChatNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => {
                  setShowEndChatNotesModal(false);
                  setEndChatNotes("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setShowEndChatNotesModal(false);
                  setShowConfirmEndChat(true);
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatView;
