import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTicketSchema, insertDeviceSchema, insertSopSchema, insertChatMessageSchema, insertDocumentFolderSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";

const FASTAPI_BASE_URL = "http://localhost:8000";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// AI response generator function (mock implementation)
function generateAIResponse(userMessage: string): string {
  const responses = [
    "I understand your issue. Let me help you with that. Based on our SOPs, here's what I recommend...",
    "I can see you're experiencing a technical issue. Let me guide you through some troubleshooting steps...",
    "Thank you for your message. I'm analyzing your request and will provide a solution shortly...",
    "I've reviewed your issue and found some relevant documentation. Here's what you should try...",
    "Let me help you resolve this. This appears to be a common issue with these steps to resolve it...",
  ];
  
  // Simple keyword-based response (in production, this would be the RAG system)
  if (userMessage.toLowerCase().includes('password')) {
    return "I can help you with password-related issues. Please follow these steps: 1) Try resetting your password, 2) Check if caps lock is on, 3) Clear your browser cache. If these don't work, I can escalate to IT support.";
  }
  
  if (userMessage.toLowerCase().includes('internet') || userMessage.toLowerCase().includes('connection')) {
    return "For internet connectivity issues, please try: 1) Restart your router, 2) Check your ethernet cable, 3) Run network diagnostics, 4) Contact your ISP if the problem persists.";
  }
  
  // Default response with random variation
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user info in session for integration with FastAPI
      (req as any).session = (req as any).session || {};
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // User routes
  app.get('/api/users/me', async (req, res) => {
    // Mock authentication - in real app you'd verify session/token
    const userId = parseInt(req.headers['x-user-id'] as string) || 1;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  });

  // FastAPI Integration Routes
  // This route proxies requests to the FastAPI backend to fetch tickets for a specific resource.
  // It aligns with the API design specified in FASTAPI_INTEGRATION.md.
  app.get('/api/fastapi/tickets/:resourceId', async (req, res) => {
    try {
      const { resourceId } = req.params;

      if (!resourceId) {
        return res.status(400).json({ message: "Resource ID is required" });
      }
  
      const fastapiResponse = await axios.get(`${FASTAPI_BASE_URL}/tickets_by_resource`, {
        params: { resourceId }
      });
  
      res.json({
        tickets: fastapiResponse.data,
        source: "fastapi_integration"
      });
    } catch (error) {
      console.error("Error fetching from FastAPI:", (error as any).response?.data || (error as any).message);
      res.status(500).json({ message: "Failed to fetch tickets from FastAPI" });
    }
  });

  app.get('/api/fastapi/analytics/ticket-counts', async (req, res) => {
    try {
      // This will integrate with FastAPI analytics endpoints
      const allTickets = await storage.getAllTickets();
      const completed = allTickets.filter(t => t.status === 'resolved').length;
      const active = allTickets.filter(t => t.status !== 'resolved').length;
      
      res.json({
        total: allTickets.length,
        completed,
        active,
        new: allTickets.filter(t => t.status === 'new').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolutionRate: Math.round((completed / allTickets.length) * 100)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post('/api/fastapi/sops/upload', async (req, res) => {
    try {
      // This will integrate with FastAPI SOP upload endpoint
      const { folderName, fileName, content } = req.body;
      
      // Create a new SOP in our system
      const sop = await storage.createSop({
        title: fileName,
        description: `Uploaded document: ${fileName}`,
        category: folderName,
        difficulty: "intermediate",
        content: content,
        estimatedTime: 15,
        authorId: 1, // Current user ID
      });
      
      res.json({ message: "SOP uploaded successfully", sop });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload SOP" });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, ticketId } = req.body;
      
      // Create user message
      await storage.createChatMessage({
        message,
        ticketId,
        senderId: 1, // Current user ID
        isAiMessage: false,
      });
      
      // Simulate AI response (in real app, this would call FastAPI RAG system)
      const aiResponse = `I understand your query about "${message}". Let me help you with that. This would normally be processed by the RAG system with SOP knowledge base.`;
      
      await storage.createChatMessage({
        message: aiResponse,
        ticketId,
        senderId: null,
        isAiMessage: true,
      });
      
      res.json({ response: aiResponse });
    } catch (error) {
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });

  // Ticket routes
  app.get('/api/tickets', async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let tickets;
      if (user.role === 'admin') {
        tickets = await storage.getAllTickets();
      } else {
        tickets = await storage.getTicketsByUser(userId);
      }
      
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post('/api/tickets', async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Invalid ticket data" });
    }
  });

  app.patch('/api/tickets/:id', async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updates = req.body;
      const ticket = await storage.updateTicket(ticketId, updates);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Device routes
  app.get('/api/devices', async (req, res) => {
    try {
      const devices = await storage.getAllDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.post('/api/devices', async (req, res) => {
    try {
      const deviceData = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice(deviceData);
      res.status(201).json(device);
    } catch (error) {
      res.status(400).json({ message: "Invalid device data" });
    }
  });

  app.delete('/api/devices/:id', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const deleted = await storage.deleteDevice(deviceId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      res.json({ message: "Device deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // SOP routes
  app.get('/api/sops', async (req, res) => {
    try {
      const sops = await storage.getAllSops();
      res.json(sops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SOPs" });
    }
  });

  app.get('/api/sops/:id', async (req, res) => {
    try {
      const sopId = parseInt(req.params.id);
      const sop = await storage.getSop(sopId);
      
      if (!sop) {
        return res.status(404).json({ message: "SOP not found" });
      }
      
      res.json(sop);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SOP" });
    }
  });

  // Chat routes
  app.get('/api/tickets/:ticketId/messages', async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const messages = await storage.getChatMessages(ticketId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/tickets/:ticketId/messages', async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const { message, isAiMessage = false } = req.body;
      const senderId = parseInt(req.headers['x-user-id'] as string) || 1;

      const messageData = insertChatMessageSchema.parse({
        ticketId,
        senderId,
        message,
        isAiMessage,
      });

      const chatMessage = await storage.createChatMessage(messageData);
      
      // If this is a user message, generate an AI response
      if (!isAiMessage) {
        setTimeout(async () => {
          const aiResponse = generateAIResponse(message);
          await storage.createChatMessage({
            ticketId,
            senderId: 1, // AI user ID
            message: aiResponse,
            isAiMessage: true,
          });
        }, 1000); // Simulate AI thinking time
      }

      res.status(201).json(chatMessage);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  // Document management routes
  app.get('/api/document-folders', async (req, res) => {
    try {
      const folders = await storage.getAllDocumentFolders();
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post('/api/document-folders', async (req, res) => {
    try {
      const { name } = req.body;
      const createdBy = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const folderData = insertDocumentFolderSchema.parse({
        name,
        createdBy,
      });

      const folder = await storage.createDocumentFolder(folderData);
      res.status(201).json(folder);
    } catch (error) {
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  app.get('/api/document-folders/:folderId/documents', async (req, res) => {
    try {
      const folderId = parseInt(req.params.folderId);
      const documents = await storage.getDocumentsByFolder(folderId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/summary', async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      const devices = await storage.getAllDevices();
      
      const totalTickets = tickets.length;
      const newTickets = tickets.filter(t => t.status === 'new').length;
      const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
      const criticalTickets = tickets.filter(t => t.priority === 'critical').length;
      
      const onlineDevices = devices.filter(d => d.status === 'online').length;
      const offlineDevices = devices.filter(d => d.status === 'offline').length;
      const warningDevices = devices.filter(d => d.status === 'warning').length;

      res.json({
        tickets: {
          total: totalTickets,
          new: newTickets,
          inProgress: inProgressTickets,
          critical: criticalTickets,
        },
        devices: {
          online: onlineDevices,
          offline: offlineDevices,
          warning: warningDevices,
          total: devices.length,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
// --- Add user CRUD routes here ---
  app.post('/api/users', async (req, res) => { 
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) return res.status(404).json({ message: "User not found" });
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const deleted = await storage.deleteUser(userId);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}