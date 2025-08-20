/**
 * Interfaces para Oracle Chat Memory operations
 * Localização: src/shared/interfaces/chatmemory.interface.ts
 */

import { Connection } from 'oracledb';
import { INodeExecutionData } from 'n8n-workflow';
import {
  ChatMessage,
  ChatSession,
  ChatMemoryOptions,
  ChatMemoryQuery,
  ChatMemoryResult,
  ChatMemorySummary,
  ChatMemoryConfig,
  ConversationContext,
  ChatMemoryOperation,
  CompressionStrategy
} from '../types/chatmemory.type';

/**
 * Interface principal para serviços de Chat Memory
 */
export interface ChatMemoryService {
  /**
   * Configura tabelas de chat memory
   */
  setupTable(
    connection: Connection,
    tableName: string,
    config?: ChatMemoryConfig
  ): Promise<INodeExecutionData[]>;

  /**
   * Adiciona uma mensagem ao histórico
   */
  addMessage(
    connection: Connection,
    sessionId: string,
    message: string,
    memoryType: string,
    tableName: string,
    metadata?: any
  ): Promise<INodeExecutionData[]>;

  /**
   * Obtém mensagens de uma sessão
   */
  getMessages(
    connection: Connection,
    query: ChatMemoryQuery,
    tableName: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Obtém uma mensagem específica
   */
  getMessage(
    connection: Connection,
    messageId: string,
    tableName: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Atualiza uma mensagem existente
   */
  updateMessage(
    connection: Connection,
    messageId: string,
    updateData: Partial<ChatMessage>,
    tableName: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Remove uma mensagem
   */
  deleteMessage(
    connection: Connection,
    messageId: string,
    tableName: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Limpa histórico de uma sessão
   */
  clearMemory(
    connection: Connection,
    sessionId: string,
    tableName: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Obtém resumo de uma sessão
   */
  getSummary(
    connection: Connection,
    sessionId: string,
    tableName: string
  ): Promise<INodeExecutionData[]>;
}

/**
 * Interface para gerenciamento de sessões de chat
 */
export interface ChatSessionManager {
  /**
   * Cria uma nova sessão
   */
  createSession(
    connection: Connection,
    sessionData: Partial<ChatSession>
  ): Promise<ChatSession>;

  /**
   * Obtém informações de uma sessão
   */
  getSession(
    connection: Connection,
    sessionId: string
  ): Promise<ChatSession | null>;

  /**
   * Lista sessões do usuário
   */
  listSessions(
    connection: Connection,
    userId?: string,
    options?: {
      limit?: number;
      offset?: number;
      includeInactive?: boolean;
    }
  ): Promise<ChatSession[]>;

  /**
   * Atualiza uma sessão
   */
  updateSession(
    connection: Connection,
    sessionId: string,
    updateData: Partial<ChatSession>
  ): Promise<ChatSession>;

  /**
   * Remove uma sessão
   */
  deleteSession(
    connection: Connection,
    sessionId: string
  ): Promise<boolean>;

  /**
   * Marca sessão como inativa
   */
  deactivateSession(
    connection: Connection,
    sessionId: string
  ): Promise<boolean>;
}

/**
 * Interface para compressão de memória
 */
export interface MemoryCompressor {
  /**
   * Comprime histórico de mensagens
   */
  compressMemory(
    connection: Connection,
    sessionId: string,
    strategy: CompressionStrategy,
    options?: {
      targetSize?: number;
      preserveRecent?: number;
      compressionRatio?: number;
    }
  ): Promise<{
    originalCount: number;
    compressedCount: number;
    compressionRatio: number;
    summary?: string;
  }>;

  /**
   * Gera resumo do histórico
   */
  generateSummary(
    messages: ChatMessage[],
    options?: {
      maxLength?: number;
      includeMetadata?: boolean;
      language?: string;
    }
  ): Promise<string>;

  /**
   * Identifica mensagens menos importantes
   */
  identifyLessImportantMessages(
    messages: ChatMessage[],
    criteria?: {
      timeWeight?: number;
      lengthWeight?: number;
      roleWeight?: Record<string, number>;
    }
  ): Promise<string[]>;
}

/**
 * Interface para análise de contexto
 */
export interface ConversationAnalyzer {
  /**
   * Analisa contexto da conversa
   */
  analyzeConversation(
    messages: ChatMessage[]
  ): Promise<ConversationContext>;

  /**
   * Extrai entidades da conversa
   */
  extractEntities(
    messages: ChatMessage[]
  ): Promise<any[]>;

  /**
   * Analisa sentimento da conversa
   */
  analyzeSentiment(
    messages: ChatMessage[]
  ): Promise<any>;

  /**
   * Identifica tópicos principais
   */
  identifyTopics(
    messages: ChatMessage[]
  ): Promise<string[]>;

  /**
   * Gera palavras-chave
   */
  generateKeywords(
    messages: ChatMessage[]
  ): Promise<string[]>;
}

/**
 * Interface para gerenciamento de privacidade
 */
export interface PrivacyManager {
  /**
   * Criptografa dados sensíveis
   */
  encryptSensitiveData(data: string): Promise<string>;

  /**
   * Descriptografa dados
   */
  decryptSensitiveData(encryptedData: string): Promise<string>;

  /**
   * Remove informações pessoais
   */
  anonymizeMessage(message: string): Promise<string>;

  /**
   * Valida conformidade com LGPD/GDPR
   */
  validatePrivacyCompliance(
    sessionData: ChatSession
  ): Promise<{
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  }>;

  /**
   * Remove dados pessoais (direito ao esquecimento)
   */
  purgePersonalData(
    connection: Connection,
    userId: string
  ): Promise<{
    sessionsRemoved: number;
    messagesRemoved: number;
  }>;
}

/**
 * Interface para validação de chat memory
 */
export interface ChatMemoryValidator {
  /**
   * Valida estrutura da mensagem
   */
  validateMessage(message: Partial<ChatMessage>): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * Valida configuração de sessão
   */
  validateSession(session: Partial<ChatSession>): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * Valida parâmetros de query
   */
  validateQuery(query: ChatMemoryQuery): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * Valida configuração de memória
   */
  validateMemoryConfig(config: ChatMemoryConfig): {
    isValid: boolean;
    errors: string[];
  };
}
