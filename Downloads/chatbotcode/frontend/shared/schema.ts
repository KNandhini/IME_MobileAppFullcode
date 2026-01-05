import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("user"), // "user" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  // User-facing ticket number (e.g. '201750'), unique and non-null
  ticketNumber: varchar("ticket_number", { length: 32 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("new"), // "new", "in_progress", "waiting_response", "resolved", "closed"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "critical"
  clientId: integer("client_id").references(() => users.id),
  assigneeId: integer("assignee_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Devices table
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "server", "laptop", "desktop"
  ipAddress: text("ip_address"),
  operatingSystem: text("operating_system"),
  lastSeen: timestamp("last_seen"),
  status: text("status").notNull().default("offline"), // "online", "offline", "warning"
  owner: text("owner"),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
});

// SOPs (Standard Operating Procedures) table
export const sops = pgTable("sops", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(), // "beginner", "intermediate", "advanced"
  estimatedTime: integer("estimated_time"), // in minutes
  authorId: integer("author_id").references(() => users.id),
  content: text("content"), // markdown content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id),
  senderId: integer("sender_id").references(() => users.id),
  message: text("message").notNull(),
  isAiMessage: boolean("is_ai_message").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document folders table
export const documentFolders = pgTable("document_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  folderId: integer("folder_id").references(() => documentFolders.id),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  clientId: true,
  assigneeId: true,
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  name: true,
  type: true,
  ipAddress: true,
  operatingSystem: true,
  status: true,
  owner: true,
  department: true,
});

export const insertSopSchema = createInsertSchema(sops).pick({
  title: true,
  description: true,
  category: true,
  difficulty: true,
  estimatedTime: true,
  authorId: true,
  content: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  ticketId: true,
  senderId: true,
  message: true,
  isAiMessage: true,
});

export const insertDocumentFolderSchema = createInsertSchema(documentFolders).pick({
  name: true,
  createdBy: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  fileName: true,
  folderId: true,
  uploadedBy: true,
  fileSize: true,
  mimeType: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
// Add frontend-only property for ticket link
export type TicketWithLink = Ticket & { link?: string };

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

export type InsertSop = z.infer<typeof insertSopSchema>;
export type Sop = typeof sops.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertDocumentFolder = z.infer<typeof insertDocumentFolderSchema>;
export type DocumentFolder = typeof documentFolders.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
