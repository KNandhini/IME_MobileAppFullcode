# FastAPI Backend Integration Guide

## Overview
This document outlines the integration between the React/TypeScript frontend and the FastAPI backend for the TechAnts AI Assistant Chatbot Application.

## Backend Integration Endpoints

### 1. Ticket Management Integration
- **Frontend Route**: `/api/fastapi/tickets/:resourceId`
- **FastAPI Equivalent**: `/tickets_by_resource?resourceId={id}`
- **Purpose**: Fetch tickets assigned to a specific resource/user
- **Integration**: Ready for direct FastAPI proxy

### 2. Analytics Integration
- **Frontend Route**: `/api/fastapi/analytics/ticket-counts`
- **FastAPI Equivalent**: `/ticketCounts`
- **Purpose**: Get ticket analytics (total, completed, resolution rates)
- **Integration**: Matches FastAPI response structure

### 3. SOP Management Integration
- **Frontend Route**: `/api/fastapi/sops/upload`
- **FastAPI Equivalent**: `/create-folder-and-upload`
- **Purpose**: Upload SOPs with folder organization
- **Integration**: Supports form-data with folder_name and file

### 4. AI Chat Integration
- **Frontend Route**: `/api/ai/chat`
- **FastAPI Equivalent**: RAG system with LangGraph workflow
- **Purpose**: Process user messages through AI assistant
- **Integration**: Ready for FastAPI RAG system integration

## FastAPI Backend Files Analysis

### File 1: Main FastAPI Application (`fastapi_main.py`)
- **Vector Store**: Pinecone integration for SOP knowledge base
- **Document Processing**: PDF loading and text splitting
- **Ticket Management**: Autotask API integration
- **File Management**: SOP folder structure and PDF serving

### File 2: Analytics Backend (`analytics.py`)
- **Database**: MongoDB for logs and analytics
- **Ticket Counting**: Autotask API status-based queries
- **LLM Tracking**: Token usage and call statistics
- **Chart Data**: Donut charts and bar charts for visualization

### File 3: Simple Analytics (`simple_analytics.py`)
- **Lightweight**: Basic ticket counting without MongoDB
- **Core Metrics**: Total, RMM, normal ticket categorization
- **Status Tracking**: Progress and completion statistics

### File 4: RAG System (`rag_system.py`)
- **LangGraph**: Agentic workflow for ticket resolution
- **Multi-step Process**: Clarification → SOP Search → Web Search
- **Interactive**: Step-by-step confirmation system
- **Context Aware**: Maintains conversation context

## Integration Points

### 1. Authentication Flow
- **Current**: Local storage-based session management
- **Integration**: Add FastAPI auth middleware compatibility
- **Session**: Shared session between Express and FastAPI

### 2. Database Schema Alignment
- **Frontend Types**: TypeScript interfaces for all entities
- **Backend Models**: Pydantic models for FastAPI validation
- **Consistency**: Ensured field naming and type compatibility

### 3. File Structure Mapping
```
Frontend Structure:
├── client/src/pages/
│   ├── admin/
│   │   ├── AllTickets.tsx (→ FastAPI tickets endpoint)
│   │   ├── Analytics.tsx (→ FastAPI analytics endpoints)
│   │   └── DocumentManagement.tsx (→ FastAPI SOP endpoints)
│   └── user/
│       ├── MyTickets.tsx (→ FastAPI user tickets)
│       ├── DeviceManagement.tsx (→ FastAPI device endpoints)
│       └── SOPs.tsx (→ FastAPI SOP browsing)
└── server/routes.ts (→ FastAPI proxy layer)
```

### 4. API Endpoint Mapping
```
Express Route → FastAPI Route
/api/tickets → /tickets_by_resource
/api/analytics → /ticketCounts
/api/sops → /list-folders, /list-files
/api/ai/chat → RAG system integration
/api/fastapi/* → Direct FastAPI proxy
```

## Deployment Integration

### 1. Environment Variables
```env
# FastAPI Backend
FASTAPI_BASE_URL=http://localhost:8000
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
MONGO_URI=mongodb://...
AUTOTASK_BASE_URL=...
AUTOTASK_SECRET=...
```

### 2. Proxy Configuration
- **Development**: Express proxy to FastAPI
- **Production**: Nginx or similar reverse proxy
- **CORS**: Configured for cross-origin requests

### 3. Database Integration
- **MongoDB**: Analytics and chat history
- **Pinecone**: Vector store for SOP knowledge base
- **Autotask**: External ticket management system

## Testing Integration

### 1. Mock Data Compatibility
- All mock data matches FastAPI response structures
- Type safety maintained throughout integration
- Seamless switch between mock and real data

### 2. Error Handling
- Consistent error responses between systems
- Proper HTTP status codes
- User-friendly error messages

### 3. Performance Considerations
- Efficient data fetching patterns
- Proper caching strategies
- Optimized query structures

## Next Steps for Full Integration

1. **Replace Express Routes**: Gradually replace Express routes with FastAPI proxies
2. **Add Authentication Middleware**: Integrate FastAPI authentication
3. **Database Migration**: Move from in-memory storage to MongoDB/PostgreSQL
4. **Real-time Updates**: Add WebSocket support for live chat
5. **File Upload**: Implement proper file upload handling
6. **Error Monitoring**: Add comprehensive error tracking
7. **Performance Monitoring**: Add metrics and monitoring

## Development Workflow

1. **Frontend Development**: Continue using Express for rapid prototyping
2. **Backend Integration**: Gradually integrate FastAPI endpoints
3. **Testing**: Comprehensive testing of integrated features
4. **Deployment**: Containerized deployment with Docker
5. **Monitoring**: Production monitoring and alerting

This integration guide ensures smooth transition from the current Express-based backend to the full FastAPI backend while maintaining all existing functionality and user experience.