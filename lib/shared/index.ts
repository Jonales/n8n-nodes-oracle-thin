/**
 * Index central para todos os tipos, interfaces e constantes compartilhados
 * Localização: src/shared/index.ts
 */

// ============================================================================
// TYPES EXPORTS
// ============================================================================

// Credenciais Oracle
export * from './types/oracle.credentials.type';

// Conexões
export * from './types/connection.type';

// Operações
export * from './types/operations.type';

// Vector Store
export * from './types/vector.type';

// Chat Memory
export * from './types/chatmemory.type';

// ============================================================================
// INTERFACES EXPORTS
// ============================================================================

// Database
export * from './interfaces/database.interface';

// Operações
export * from './interfaces/operations.interface';

// Vector Store
export * from './interfaces/vector.interface';

// Chat Memory
export * from './interfaces/chatmemory.interface';

// ============================================================================
// CONSTANTS EXPORTS
// ============================================================================

// Erros
export * from './constants/errors.constants';

// Database
export * from './constants/database.constants';

// Nodes
export * from './constants/node.constants';

// ============================================================================
// TYPE GUARDS E UTILITIES
// ============================================================================

import { OracleCredentials } from './types/oracle.credentials.type';
import { VectorDocument } from './types/vector.type';
import { ChatMessage } from './types/chatmemory.type';

/**
 * Type guards para validação de tipos em runtime
 */
export const TypeGuards = {
  /**
   * Verifica se objeto é uma credencial Oracle válida
   */
  isOracleCredentials(obj: unknown): obj is OracleCredentials {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as OracleCredentials).user === 'string' &&
      typeof (obj as OracleCredentials).password === 'string' &&
      typeof (obj as OracleCredentials).connectionString === 'string'
    );
  },

  /**
   * Verifica se objeto é um documento vetorial válido
   */
  isVectorDocument(obj: unknown): obj is VectorDocument {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as VectorDocument).id === 'string' &&
      typeof (obj as VectorDocument).content === 'string' &&
      Array.isArray((obj as VectorDocument).embedding) &&
      (obj as VectorDocument).embedding.every((item: unknown) => typeof item === 'number')
    );
  },

  /**
   * Verifica se objeto é uma mensagem de chat válida
   */
  isChatMessage(obj: unknown): obj is ChatMessage {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as ChatMessage).id === 'string' &&
      typeof (obj as ChatMessage).sessionId === 'string' &&
      typeof (obj as ChatMessage).message === 'string' &&
      (obj as ChatMessage).createdAt instanceof Date
    );
  },

  /**
   * Verifica se array contém apenas números (para embeddings)
   */
  isNumberArray(arr: unknown): arr is number[] {
    return Array.isArray(arr) && arr.every(item => typeof item === 'number');
  },
};

/**
 * Utilitários helper para validação e conversão
 */
export const ValidationUtils = {
  /**
   * Valida string de conexão Oracle
   */
  validateConnectionString(connectionString: string): {
    isValid: boolean;
    format: 'service_name' | 'sid' | 'tns_name' | 'unknown';
    error?: string;
  } {
    if (!connectionString || connectionString.trim().length === 0) {
      return { isValid: false, format: 'unknown', error: 'Connection string cannot be empty' };
    }

    // Formato: host:port/service_name
    if (/^[\w\-\.]+:\d+\/[\w\-]+$/i.test(connectionString)) {
      return { isValid: true, format: 'service_name' };
    }

    // Formato: host:port:sid
    if (/^[\w\-\.]+:\d+:[\w\-]+$/i.test(connectionString)) {
      return { isValid: true, format: 'sid' };
    }

    // Formato: TNS_NAME (apenas letras, números e underscore)
    if (/^[A-Z][A-Z0-9_]*$/i.test(connectionString)) {
      return { isValid: true, format: 'tns_name' };
    }

    return {
      isValid: false,
      format: 'unknown',
      error: 'Invalid connection string format. Use: host:port/service_name, host:port:sid, or TNS_NAME'
    };
  },

  /**
   * Valida dimensões de embedding
   */
  validateEmbeddingDimensions(embedding: number[], expectedDimension?: number): {
    isValid: boolean;
    actualDimension: number;
    error?: string;
  } {
    if (!Array.isArray(embedding)) {
      return { isValid: false, actualDimension: 0, error: 'Embedding must be an array' };
    }

    if (embedding.length === 0) {
      return { isValid: false, actualDimension: 0, error: 'Embedding cannot be empty' };
    }

    if (!embedding.every(val => typeof val === 'number' && !isNaN(val))) {
      return { isValid: false, actualDimension: embedding.length, error: 'All embedding values must be valid numbers' };
    }

    if (expectedDimension && embedding.length !== expectedDimension) {
      return {
        isValid: false,
        actualDimension: embedding.length,
        error: `Expected ${expectedDimension} dimensions, got ${embedding.length}`
      };
    }

    return { isValid: true, actualDimension: embedding.length };
  },

  /**
   * Sanitiza nome de tabela/coleção
   */
  sanitizeIdentifier(identifier: string): {
    sanitized: string;
    isValid: boolean;
    error?: string;
  } {
    if (!identifier || identifier.trim().length === 0) {
      return { sanitized: '', isValid: false, error: 'Identifier cannot be empty' };
    }

    // Remove espaços e caracteres especiais, mantém apenas letras, números e underscore
    const sanitized = identifier.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    // Deve começar com letra
    if (!/^[A-Z]/.test(sanitized)) {
      return { sanitized, isValid: false, error: 'Identifier must start with a letter' };
    }

    // Não deve exceder 128 caracteres (limite Oracle)
    if (sanitized.length > 128) {
      return { sanitized: sanitized.substring(0, 128), isValid: false, error: 'Identifier too long (max 128 characters)' };
    }

    return { sanitized, isValid: true };
  },
};

/**
 * Constantes agregadas para facilitar importação
 */
export const OracleConstants = {
  // Re-export das constantes mais usadas
  CREDENTIALS_NAME: 'oracleCredentials',
  DEFAULT_POOL_CONFIG: {
    poolMin: 2,
    poolMax: 20,
    poolIncrement: 2,
    poolTimeout: 60,
  },
  DEFAULT_VECTOR_DIMENSION: 1536,
  DEFAULT_SIMILARITY_THRESHOLD: 0.7,
  DEFAULT_SEARCH_LIMIT: 10,
  DEFAULT_CHAT_TABLE: 'CHAT_MEMORY',
} as const;
