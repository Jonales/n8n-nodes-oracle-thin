/**
 * Índice principal da biblioteca Oracle Thin para n8n
 * Exporta todas as funcionalidades organizadas por categoria
 */

// ===== SHARED TYPES & INTERFACES =====
export * from './shared/types';
export * from './shared/interfaces';
export * from './shared/enums';
export * from './shared/utils/error-handler';
export * from './shared/utils/validation';

// ===== CORE - CONNECTION MANAGEMENT =====
export { OracleConnectionPool } from './core/connection/connection-pool';
export { DatabaseConnection } from './core/connection/database-connection';
export { CredentialsManager } from './core/connection/credentials-manager';

// ===== CORE - OPERATIONS =====
export { BulkOperations, BulkOperationsFactory } from './core/operations/bulk-operations';
export { PLSQLExecutor, PLSQLExecutorFactory } from './core/operations/plsql-executor';
export { TransactionManager, TransactionManagerFactory } from './core/operations/transaction-manager';
export { AQOperations, AQOperationsFactory } from './core/operations/aq-operations';

// ===== SERVICES =====
export { ChatMemoryService } from './services/chat-memory.service';
export { VectorStoreService } from './services/vector-store.service';
export { QueryService } from './services/query.service';

// ===== NODES - N8N INTEGRATION =====
export { OracleDatabaseAdvanced } from '../src/nodes/oracle-database-advanced.node';
export { OracleVectorStore } from '../src/nodes/oracle-vector-store.node';
export { ChatMemory } from '../src/nodes/chat-memory.node';

// ===== CREDENTIALS =====
export { Oracle as OracleCredentials } from './credentials/oracle.credentials';

// ===== FACTORY PRINCIPAL =====
export { OracleFactory } from './factory/oracle-factory';