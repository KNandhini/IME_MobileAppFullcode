import {
  users,
  tickets,
  devices,
  sops,
  chatMessages,
  documentFolders,
  documents,
  type User,
  type InsertUser,
  type Ticket,
  type InsertTicket,
  type Device,
  type InsertDevice,
  type Sop,
  type InsertSop,
  type ChatMessage,
  type InsertChatMessage,
  type DocumentFolder,
  type InsertDocumentFolder,
  type Document,
  type InsertDocument,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
    updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Ticket operations
  getAllTickets(): Promise<Ticket[]>;
  getTicketsByUser(userId: number): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket | undefined>;
  
  // Device operations
  getAllDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, updates: Partial<InsertDevice>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;
  
  // SOP operations
  getAllSops(): Promise<Sop[]>;
  getSop(id: number): Promise<Sop | undefined>;
  createSop(sop: InsertSop): Promise<Sop>;
  updateSop(id: number, updates: Partial<InsertSop>): Promise<Sop | undefined>;
  
  // Chat message operations
  getChatMessages(ticketId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Document folder operations
  getAllDocumentFolders(): Promise<DocumentFolder[]>;
  createDocumentFolder(folder: InsertDocumentFolder): Promise<DocumentFolder>;
  
  // Document operations
  getDocumentsByFolder(folderId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private devices: Map<number, Device>;
  private sops: Map<number, Sop>;
  private chatMessages: Map<number, ChatMessage>;
  private documentFolders: Map<number, DocumentFolder>;
  private documents: Map<number, Document>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.devices = new Map();
    this.sops = new Map();
    this.chatMessages = new Map();
    this.documentFolders = new Map();
    this.documents = new Map();
    this.currentId = 1;
    this.seedData();
  }

  private seedData() {
    // Create demo users
    const adminUser: User = {
      id: this.currentId++,
      email: "admin@techants.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    const regularUser: User = {
      id: this.currentId++,
      email: "john.doe@techants.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "user",
      createdAt: new Date(),
    };
    this.users.set(regularUser.id, regularUser);

    // Create demo devices
    const device1: Device = {
      id: this.currentId++,
      name: "EXCH-PROD-01",
      type: "server",
      ipAddress: "10.0.1.15",
      operatingSystem: "Windows Server 2019",
      lastSeen: new Date(),
      status: "online",
      owner: "IT Department",
      department: "IT",
      createdAt: new Date(),
    };
    this.devices.set(device1.id, device1);

    const device2: Device = {
      id: this.currentId++,
      name: "FILE-SRV-02",
      type: "server",
      ipAddress: "10.0.1.16",
      operatingSystem: "Windows Server 2022",
      lastSeen: new Date(),
      status: "online",
      owner: "IT Department",
      department: "IT",
      createdAt: new Date(),
    };
    this.devices.set(device2.id, device2);

    const device3: Device = {
      id: this.currentId++,
      name: "CEO-LAPTOP",
      type: "laptop",
      ipAddress: "10.0.2.45",
      operatingSystem: "Windows 11 Pro",
      lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      status: "warning",
      owner: "Robert Johnson (CEO)",
      department: "Executive",
      createdAt: new Date(),
    };
    this.devices.set(device3.id, device3);

    // Create demo SOPs
    const sop1: Sop = {
      id: this.currentId++,
      title: "Password Reset Procedure",
      description: "Step-by-step guide for resetting user passwords in Active Directory",
      category: "Identity Management",
      difficulty: "beginner",
      estimatedTime: 5,
      authorId: adminUser.id,
      content: "# Password Reset Procedure\n\n1. Open Active Directory Users and Computers...",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sops.set(sop1.id, sop1);

    const sop2: Sop = {
      id: this.currentId++,
      title: "Outlook Configuration Setup",
      description: "Complete guide for setting up Outlook with Exchange Online",
      category: "Email Management",
      difficulty: "intermediate",
      estimatedTime: 15,
      authorId: regularUser.id,
      content: "# Outlook Configuration Setup\n\n1. Open Outlook...",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sops.set(sop2.id, sop2);

    const sop3: Sop = {
      id: this.currentId++,
      title: "VPN Connection Troubleshooting",
      description: "Comprehensive troubleshooting guide for VPN connection issues",
      category: "Network",
      difficulty: "advanced",
      estimatedTime: 30,
      authorId: adminUser.id,
      content: "# VPN Connection Troubleshooting\n\n1. Check network connectivity...",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sops.set(sop3.id, sop3);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role ?? "user",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      role: updates.role ?? user.role,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Ticket operations
  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async getTicketsByUser(userId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      ticket => ticket.clientId === userId || ticket.assigneeId === userId
    );
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.currentId++;
    const ticket: Ticket = {
      ...insertTicket,
      id,
      status: insertTicket.status ?? "new",
      priority: insertTicket.priority ?? "medium",
      clientId: insertTicket.clientId ?? null,
      assigneeId: insertTicket.assigneeId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    
    const updatedTicket: Ticket = {
      ...ticket,
      ...updates,
      updatedAt: new Date(),
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  // Device operations
  async getAllDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = this.currentId++;
    const device: Device = {
      ...insertDevice,
      id,
      status: insertDevice.status ?? "online",
      ipAddress: insertDevice.ipAddress ?? null,
      operatingSystem: insertDevice.operatingSystem ?? null,
      lastSeen: new Date(),
      owner: insertDevice.owner ?? null,
      department: insertDevice.department ?? null,
      createdAt: new Date(),
    };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: number, updates: Partial<InsertDevice>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice: Device = {
      ...device,
      ...updates,
    };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteDevice(id: number): Promise<boolean> {
    return this.devices.delete(id);
  }

  // SOP operations
  async getAllSops(): Promise<Sop[]> {
    return Array.from(this.sops.values());
  }

  async getSop(id: number): Promise<Sop | undefined> {
    return this.sops.get(id);
  }

  async createSop(insertSop: InsertSop): Promise<Sop> {
    const id = this.currentId++;
    const sop: Sop = {
      ...insertSop,
      id,
      estimatedTime: insertSop.estimatedTime ?? null,
      authorId: insertSop.authorId ?? null,
      content: insertSop.content ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sops.set(id, sop);
    return sop;
  }

  async updateSop(id: number, updates: Partial<InsertSop>): Promise<Sop | undefined> {
    const sop = this.sops.get(id);
    if (!sop) return undefined;
    
    const updatedSop: Sop = {
      ...sop,
      ...updates,
      updatedAt: new Date(),
    };
    this.sops.set(id, updatedSop);
    return updatedSop;
  }

  // Chat message operations
  async getChatMessages(ticketId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      message => message.ticketId === ticketId
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      ticketId: insertMessage.ticketId ?? null,
      senderId: insertMessage.senderId ?? null,
      isAiMessage: insertMessage.isAiMessage ?? null,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Document folder operations
  async getAllDocumentFolders(): Promise<DocumentFolder[]> {
    return Array.from(this.documentFolders.values());
  }

  async createDocumentFolder(insertFolder: InsertDocumentFolder): Promise<DocumentFolder> {
    const id = this.currentId++;
    const folder: DocumentFolder = {
      ...insertFolder,
      id,
      createdBy: insertFolder.createdBy ?? null,
      createdAt: new Date(),
    };
    this.documentFolders.set(id, folder);
    return folder;
  }

  // Document operations
  async getDocumentsByFolder(folderId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      doc => doc.folderId === folderId
    );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const document: Document = {
      ...insertDocument,
      id,
      folderId: insertDocument.folderId ?? null,
      uploadedBy: insertDocument.uploadedBy ?? null,
      fileSize: insertDocument.fileSize ?? null,
      mimeType: insertDocument.mimeType ?? null,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }
}

export const storage = new MemStorage();
