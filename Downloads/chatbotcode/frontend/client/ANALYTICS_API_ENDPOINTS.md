# Analytics Dashboard API Endpoints

This document outlines the exact API endpoints implemented for the analytics dashboard functionality.

## POST Endpoints

### 1. Feedback Submission
- **Endpoint**: `POST /analytics/feedback`
- **Purpose**: Submit user feedback (thumbs up/down) on AI responses
- **Request Body**:
  ```typescript
  {
    rating: "up" | "down";
    session_id?: string;
    timestamp: string;
  }
  ```
- **Function**: `submitFeedback(request: FeedbackRequest)`

### 2. Session Management

#### Start Session
- **Endpoint**: `POST /analytics/session/start`
- **Purpose**: Start a new user session
- **Request Body**:
  ```typescript
  {
    session_id: string;
    timestamp: string;
  }
  ```
- **Function**: `startSession(request: SessionStartRequest)`

#### End Session
- **Endpoint**: `POST /analytics/session/end`
- **Purpose**: End an existing user session
- **Request Body**:
  ```typescript
  {
    session_id: string;
    timestamp: string;
  }
  ```
- **Function**: `endSession(request: { session_id: string; timestamp: string })`

### 3. Generic Event Logging
- **Endpoint**: `POST /analytics/events/log`
- **Purpose**: Log generic events for analytics tracking
- **Request Body**:
  ```typescript
  {
    type: string;
    event_data: any;
    timestamp: string;
  }
  ```
- **Function**: `logEvent(request: EventLogRequest)`

## Implementation Details

### API Service Functions
All functions are implemented in `frontend/client/src/services/api.ts` and follow the same pattern:

```typescript
export async function functionName(request: RequestType): Promise<void> {
  try {
    await apiRequest("POST", "/endpoint/path", request);
  } catch (error) {
    console.error("Error message:", error);
    throw error;
  }
}
```

### TypeScript Interfaces
All request types are defined in `frontend/client/src/types/ticket.ts`:

```typescript
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
```

### Usage in Analytics Dashboard
The functions are integrated into the Analytics component (`frontend/client/src/pages/admin/Analytics.tsx`) and provide:

- **Feedback buttons**: Thumbs up/down for AI responses
- **Session tracking**: Start/end session buttons for testing
- **Event logging**: Automatic logging of user actions (date range changes, exports, etc.)

### Example Usage
```typescript
import { submitFeedback, startSession, endSession, logEvent } from "@/services/api";

// Submit feedback
await submitFeedback({
  rating: "up",
  session_id: "session-123",
  timestamp: new Date().toISOString()
});

// Start session
await startSession({
  session_id: "session-456",
  timestamp: new Date().toISOString()
});

// End session
await endSession({
  session_id: "session-123",
  timestamp: new Date().toISOString()
});

// Log event
await logEvent({
  type: "export_analytics",
  event_data: { date_range: 7 },
  timestamp: new Date().toISOString()
});
```

## Error Handling
All functions include proper error handling with:
- Try-catch blocks
- Console error logging
- Error re-throwing for upstream handling

## Authentication
All endpoints use the `apiRequest` function which handles authentication through the existing auth system.
