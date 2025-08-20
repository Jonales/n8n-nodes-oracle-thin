/**
 * Constantes específicas dos nodes n8n Oracle
 * Localização: src/shared/constants/node.constants.ts
 */

export const NODE_NAMES = {
  ORACLE: 'oracle',
  ORACLE_ADVANCED: 'oracleAdvanced',
  ORACLE_VECTOR_STORE: 'oracleVectorStore',
  ORACLE_CHAT_MEMORY: 'oracleChatMemory',
} as const;

export const NODE_DISPLAY_NAMES = {
  ORACLE: 'Oracle Database',
  ORACLE_ADVANCED: 'Oracle Database Advanced',
  ORACLE_VECTOR_STORE: 'Oracle Vector Store',
  ORACLE_CHAT_MEMORY: 'Oracle Chat Memory',
} as const;

export const NODE_DESCRIPTIONS = {
  ORACLE: 'Execute SQL queries on Oracle database with parameter support - embedded thin client',
  ORACLE_ADVANCED: 'Oracle Database com recursos avançados para cargas pesadas e Oracle 19c+',
  ORACLE_VECTOR_STORE: 'Gerenciamento de vector store usando Oracle Database com Oracle Vector compatibilidade',
  ORACLE_CHAT_MEMORY: 'Gerencia sessões de memória de chat em Oracle',
} as const;

export const NODE_GROUPS = {
  INPUT: 'input',
  OUTPUT: 'output',
  TRANSFORM: 'transform',
  TRIGGER: 'trigger',
} as const;

export const CREDENTIALS_NAME = 'oracleCredentials';

export const OPERATION_TYPES = {
  // Oracle básico
  QUERY: 'query',
  
  // Oracle avançado
  PLSQL: 'plsql',
  PROCEDURE: 'procedure',
  FUNCTION: 'function',
  BULK: 'bulk',
  TRANSACTION: 'transaction',
  QUEUE: 'queue',
  
  // Vector Store
  SETUP_COLLECTION: 'setup',
  ADD_DOCUMENT: 'addDocument',
  SEARCH_SIMILARITY: 'searchSimilarity',
  DELETE_DOCUMENT: 'deleteDocument',
  UPDATE_DOCUMENT: 'updateDocument',
  GET_DOCUMENT: 'getDocument',
  LIST_COLLECTIONS: 'listCollections',
  DROP_COLLECTION: 'dropCollection',
  
  // Chat Memory
  SETUP_TABLE: 'setup',
  ADD_MESSAGE: 'addMessage',
  GET_MESSAGES: 'getMessages',
  GET_MESSAGE: 'getMessage',
  UPDATE_MESSAGE: 'updateMessage',
  DELETE_MESSAGE: 'deleteMessage',
  CLEAR_MEMORY: 'clearMemory',
  GET_SUMMARY: 'getSummary',
  COMPRESS_MEMORY: 'compressMemory',
  CREATE_SESSION: 'createSession',
  GET_SESSION: 'getSession',
  LIST_SESSIONS: 'listSessions',
  DELETE_SESSION: 'deleteSession',
} as const;

export const CONNECTION_POOL_TYPES = {
  STANDARD: 'standard',
  HIGH_VOLUME: 'highvolume',
  OLTP: 'oltp',
  ANALYTICS: 'analytics',
  SINGLE: 'single',
} as const;

export const PARAMETER_DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  DATE: 'date',
  CLOB: 'clob',
  BLOB: 'blob',
  CURSOR: 'cursor',
  OUT: 'out',
} as const;

export const VECTOR_OPERATIONS = {
  SETUP: 'Setup Collection',
  ADD_DOCUMENT: 'Add Document',
  SEARCH_SIMILARITY: 'Search Similarity',
  DELETE_DOCUMENT: 'Delete Document',
  UPDATE_DOCUMENT: 'Update Document',
  GET_DOCUMENT: 'Get Document',
  LIST_COLLECTIONS: 'List Collections',
  DROP_COLLECTION: 'Drop Collection',
} as const;

export const CHAT_MEMORY_OPERATIONS = {
  SETUP_TABLE: 'Setup Table',
  ADD_MESSAGE: 'Add Message',
  GET_MESSAGES: 'Get Messages',
  GET_MESSAGE: 'Get Message',
  UPDATE_MESSAGE: 'Update Message',
  DELETE_MESSAGE: 'Delete Message',
  CLEAR_MEMORY: 'Clear Memory',
  GET_SUMMARY: 'Get Summary',
  COMPRESS_MEMORY: 'Compress Memory',
  CREATE_SESSION: 'Create Session',
  GET_SESSION: 'Get Session',
  LIST_SESSIONS: 'List Sessions',
  DELETE_SESSION: 'Delete Session',
} as const;

export const ADVANCED_OPERATIONS = {
  SQL_QUERY: 'SQL Query',
  PLSQL_BLOCK: 'PL/SQL Block',
  STORED_PROCEDURE: 'Stored Procedure',
  FUNCTION: 'Function',
  BULK_OPERATIONS: 'Bulk Operations',
  TRANSACTION_BLOCK: 'Transaction Block',
  ORACLE_AQ: 'Oracle AQ',
} as const;

export const NODE_ICONS = {
  ORACLE: 'file:oracle.svg',
  ORACLE_VECTOR: 'file:oracle-vector.svg',
  ORACLE_CHAT: 'file:oracle-chat.svg',
} as const;

export const FIELD_DISPLAY_OPTIONS = {
  HIDE_ON_LIST_COLLECTIONS: {
    hide: {
      operation: ['listCollections'],
    },
  },
  SHOW_ON_SETUP: {
    show: {
      operation: ['setup'],
    },
  },
  SHOW_ON_DOCUMENT_OPERATIONS: {
    show: {
      operation: ['deleteDocument', 'updateDocument', 'getDocument'],
    },
  },
  SHOW_ON_SEARCH: {
    show: {
      operation: ['searchSimilarity'],
    },
  },
  SHOW_ON_MESSAGE_OPERATIONS: {
    show: {
      operation: ['addMessage', 'getMessages', 'clearMemory', 'getSummary'],
    },
  },
  SHOW_ON_ADD_MESSAGE: {
    show: {
      operation: ['addMessage'],
    },
  },
} as const;

export const VALIDATION_RULES = {
  REQUIRED_FIELDS: ['user', 'password', 'connectionString'],
  MAX_POOL_SIZE: 1000,
  MIN_POOL_SIZE: 1,
  MAX_VECTOR_DIMENSION: 65536,
  MIN_VECTOR_DIMENSION: 1,
  MAX_SIMILARITY_THRESHOLD: 1.0,
  MIN_SIMILARITY_THRESHOLD: 0.0,
  MAX_SEARCH_LIMIT: 1000,
  MIN_SEARCH_LIMIT: 1,
} as const;

export const DEFAULT_VALUES = {
  CONNECTION_STRING: 'localhost:1521/XEPDB1',
  VECTOR_DIMENSION: 1536,
  SEARCH_LIMIT: 10,
  SIMILARITY_THRESHOLD: 0.7,
  CHAT_TABLE_NAME: 'CHAT_MEMORY',
  VECTOR_COLLECTION_NAME: 'vector_documents',
  MEMORY_TYPE: 'chat',
  CONNECTION_POOL: 'standard',
} as const;

export const PLACEHOLDER_TEXTS = {
  SQL_QUERY: 'SELECT id, name FROM product WHERE id < :param_name',
  CONNECTION_STRING: 'host:port/service_name ou TNS_NAME',
  PARAMETER_NAME: 'e.g. param_name',
  PARAMETER_VALUE: 'Example: 12345',
  SEARCH_VECTOR: 'JSON array of numbers: [0.1, 0.2, ...]',
} as const;

export const HINT_TEXTS = {
  PARAMETER_NAME: 'Parameter name (do not include ":")',
  PARSE_IN_STATEMENT: 'If "Yes", the "Value" field should be comma-separated values (e.g., 1,2,3 or str1,str2,str3)',
  CONNECTION_STRING: 'Formatos aceitos: • host:port/service_name (Ex: localhost:1521/XEPDB1) • host:port:sid (Ex: localhost:1521:XE) • TNS_NAME (Ex: PROD_DB)',
} as const;
