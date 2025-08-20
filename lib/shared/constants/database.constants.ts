/**
 * Constantes relacionadas ao banco de dados Oracle
 * Localização: src/shared/constants/database.constants.ts
 */

export const ORACLE_VERSIONS = {
  ORACLE_11G: '11.2.0',
  ORACLE_12C: '12.1.0',
  ORACLE_18C: '18.0.0',
  ORACLE_19C: '19.0.0',
  ORACLE_21C: '21.0.0',
  ORACLE_23C: '23.0.0'
} as const;

export const CONNECTION_DEFAULTS = {
  THIN_MODE: true,
  CONNECT_TIMEOUT: 60000, // 60 segundos
  FETCH_ARRAY_SIZE: 1000,
  MAX_ROWS: 0, // Sem limite
  STATEMENT_CACHE_SIZE: 50,
  OUT_FORMAT: 4002, // OBJECT format
} as const;

export const POOL_DEFAULTS = {
  POOL_MIN: 2,
  POOL_MAX: 20,
  POOL_INCREMENT: 2,
  POOL_TIMEOUT: 60,
  QUEUE_MAX: 500,
  QUEUE_TIMEOUT: 60000,
  POOL_PING_INTERVAL: 60,
  ENABLE_STATISTICS: true,
  HOMOGENEOUS: true,
} as const;

export const POOL_CONFIGURATIONS = {
  STANDARD: {
    poolMin: 2,
    poolMax: 20,
    poolIncrement: 2,
    poolTimeout: 60,
    stmtCacheSize: 50,
    queueMax: 500,
    queueTimeout: 60000,
  },
  HIGH_VOLUME: {
    poolMin: 5,
    poolMax: 50,
    poolIncrement: 5,
    poolTimeout: 120,
    stmtCacheSize: 100,
    queueMax: 1000,
    queueTimeout: 120000,
  },
  OLTP: {
    poolMin: 10,
    poolMax: 100,
    poolIncrement: 10,
    poolTimeout: 30,
    stmtCacheSize: 200,
    queueMax: 2000,
    queueTimeout: 30000,
  },
  ANALYTICS: {
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 300,
    stmtCacheSize: 30,
    queueMax: 100,
    queueTimeout: 300000,
  },
} as const;

export const ORACLE_DATA_TYPES = {
  VARCHAR2: 'VARCHAR2',
  CHAR: 'CHAR',
  NVARCHAR2: 'NVARCHAR2',
  NCHAR: 'NCHAR',
  NUMBER: 'NUMBER',
  BINARY_INTEGER: 'BINARY_INTEGER',
  PLS_INTEGER: 'PLS_INTEGER',
  DATE: 'DATE',
  TIMESTAMP: 'TIMESTAMP',
  CLOB: 'CLOB',
  NCLOB: 'NCLOB',
  BLOB: 'BLOB',
  CURSOR: 'CURSOR',
  VECTOR: 'VECTOR',
  JSON: 'JSON',
} as const;

export const BIND_DIRECTIONS = {
  IN: 2001,
  OUT: 3001,
  INOUT: 3002,
} as const;

export const TRANSACTION_ISOLATION_LEVELS = {
  READ_COMMITTED: 'READ COMMITTED',
  SERIALIZABLE: 'SERIALIZABLE',
  READ_ONLY: 'READ ONLY',
} as const;

export const BULK_OPERATION_DEFAULTS = {
  BATCH_SIZE: 1000,
  CONTINUE_ON_ERROR: false,
  AUTO_COMMIT: true,
  DML_ROW_COUNTS: true,
} as const;

export const PLSQL_DEFAULTS = {
  FETCH_ARRAY_SIZE: 100,
  MAX_SIZE: 4000,
  TIMEOUT: 30000, // 30 segundos
  ENABLE_DEBUG: false,
} as const;

export const AQ_DEFAULTS = {
  VISIBILITY: 'ON_COMMIT',
  DELIVERY_MODE: 'PERSISTENT',
  DEQUEUE_MODE: 'REMOVE',
  NAVIGATION: 'FIRST_MESSAGE',
  WAIT_TIME: 5,
} as const;

export const VECTOR_DEFAULTS = {
  DIMENSION: 1536,
  DISTANCE_METRIC: 'COSINE',
  TARGET_ACCURACY: 95,
  INDEX_TYPE: 'NEIGHBOR_PARTITIONS',
  SIMILARITY_THRESHOLD: 0.7,
  SEARCH_LIMIT: 10,
} as const;

export const CHAT_MEMORY_DEFAULTS = {
  TABLE_NAME: 'CHAT_MEMORY',
  SESSION_TABLE_NAME: 'CHAT_SESSIONS',
  MAX_MESSAGES: 1000,
  MAX_TOKENS: 100000,
  TTL_HOURS: 24 * 7, // 7 dias
  COMPRESSION_THRESHOLD: 500,
  ENABLE_ENCRYPTION: false,
  ENABLE_AUDIT: true,
  RETENTION_DAYS: 90,
} as const;

export const SYSTEM_TABLES = {
  USER_TABLES: 'USER_TABLES',
  USER_VIEWS: 'USER_VIEWS',
  USER_SEQUENCES: 'USER_SEQUENCES',
  USER_INDEXES: 'USER_INDEXES',
  USER_CONSTRAINTS: 'USER_CONSTRAINTS',
  USER_ERRORS: 'USER_ERRORS',
  USER_ARGUMENTS: 'USER_ARGUMENTS',
  USER_DEPENDENCIES: 'USER_DEPENDENCIES',
  USER_QUEUES: 'USER_QUEUES',
  USER_QUEUE_TABLES: 'USER_QUEUE_TABLES',
  V$SESSION: 'V$SESSION',
  V$INSTANCE: 'V$INSTANCE',
  V$VERSION: 'V$VERSION',
} as const;

export const PERFORMANCE_LIMITS = {
  MAX_QUERY_TIME: 300000, // 5 minutos
  MAX_BULK_ROWS: 50000,
  MAX_CLOB_SIZE: 4000000000, // 4GB
  MAX_VARCHAR2_SIZE: 32767,
  MAX_IDENTIFIER_LENGTH: 128,
  MAX_SQL_LENGTH: 1000000,
} as const;

export const HEALTH_CHECK_QUERIES = {
  SIMPLE: 'SELECT 1 FROM DUAL',
  DETAILED: `
    SELECT 
      'Connection Test Success' AS STATUS,
      USER AS CURRENT_USER,
      SYSDATE AS SERVER_TIME,
      (SELECT VERSION FROM V$INSTANCE) AS DB_VERSION,
      SYS_CONTEXT('USERENV', 'DB_NAME') AS DB_NAME
    FROM DUAL
  `,
  PERFORMANCE: `
    SELECT 
      VALUE AS SESSIONS_CURRENT
    FROM V$SYSSTAT 
    WHERE NAME = 'logons current'
  `
} as const;
