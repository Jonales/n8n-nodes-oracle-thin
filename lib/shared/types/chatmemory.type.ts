/**
 * Tipos para Chat Memory Oracle
 * Localização: src/shared/types/chatmemory.type.ts
 */

import { INodeExecutionData } from 'n8n-workflow';

export interface ChatMessage {
  id: string;
  sessionId: string;
  memoryType: ChatMemoryType;
  message: string;
  role?: MessageRole;
  createdAt: Date;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  tokens?: number;
  model?: string;
  temperature?: number;
  nodeId?: string;
  executionId?: string;
  [key: string]: any;
}

export interface ChatSession {
  sessionId: string;
  userId?: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  totalTokens?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface ChatMemoryOptions {
  maxMessages?: number;
  maxTokens?: number;
  ttlHours?: number;
  enableCompression?: boolean;
  compressionThreshold?: number;
}

export interface ChatMemoryQuery {
  sessionId: string;
  limit?: number;
  offset?: number;
  fromDate?: Date;
  toDate?: Date;
  messageType?: ChatMemoryType;
  includeMetadata?: boolean;
}

export interface ChatMemoryResult {
  success: boolean;
  operation: ChatMemoryOperation;
  sessionId: string;
  messageId?: string;
  messagesAffected?: number;
  data?: ChatMessage[] | ChatSession | ChatMemorySummary;
  error?: string;
}

export interface ChatMemorySummary {
  sessionId: string;
  totalMessages: number;
  lastMessage?: Date;
  firstMessage?: Date;
  memoryTypes: ChatMemoryType[];
  totalTokens?: number;
}

export interface ChatMemoryConfig {
  tableName: string;
  sessionTableName?: string;
  enableEncryption?: boolean;
  enableAudit?: boolean;
  retentionDays?: number;
}

export interface ConversationContext {
  sessionId: string;
  messages: ChatMessage[];
  summary?: string;
  keywords?: string[];
  entities?: ConversationEntity[];
  sentiment?: ConversationSentiment;
}

export interface ConversationEntity {
  text: string;
  type: EntityType;
  confidence: number;
  startOffset: number;
  endOffset: number;
}

export interface ConversationSentiment {
  overall: SentimentScore;
  messages: SentimentScore[];
}

export interface SentimentScore {
  polarity: number; // -1 to 1
  subjectivity: number; // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
}

export type ChatMemoryType = 
  | 'human' 
  | 'ai' 
  | 'system' 
  | 'function' 
  | 'tool' 
  | 'summary' 
  | 'context';

export type MessageRole = 
  | 'user' 
  | 'assistant' 
  | 'system' 
  | 'function' 
  | 'tool';

export type ChatMemoryOperation = 
  | 'setup'
  | 'addMessage' 
  | 'getMessage'
  | 'getMessages' 
  | 'updateMessage'
  | 'deleteMessage'
  | 'clearMemory' 
  | 'getSummary'
  | 'compressMemory'
  | 'createSession'
  | 'getSession'
  | 'listSessions'
  | 'deleteSession';

export type EntityType = 
  | 'PERSON' 
  | 'ORGANIZATION' 
  | 'LOCATION' 
  | 'DATE' 
  | 'TIME' 
  | 'MONEY' 
  | 'PERCENT' 
  | 'CUSTOM';

export type CompressionStrategy = 
  | 'summarize' 
  | 'truncate' 
  | 'sliding_window' 
  | 'importance_based';
