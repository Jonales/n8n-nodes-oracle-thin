/**
 * Interfaces para operações Oracle (queries, PL/SQL, bulk operations, etc.)
 * Localização: src/shared/interfaces/operations.interface.ts
 */

import { Connection } from 'oracledb';
import { INodeExecutionData } from 'n8n-workflow';
import {
  QueryParameter,
  QueryOptions,
  BulkOperationResult,
  BulkOperationOptions,
  PLSQLExecutionResult,
  PLSQLExecutionOptions,
  TransactionOptions,
  AQMessage,
  AQOperationResult
} from '../types/operations.type';

/**
 * Interface para executor de queries SQL
 */
export interface QueryExecutor {
  /**
   * Executa uma query SQL simples
   */
  executeQuery(
    connection: Connection,
    sql: string,
    parameters?: QueryParameter[],
    options?: QueryOptions
  ): Promise<INodeExecutionData[]>;

  /**
   * Executa múltiplas queries em sequência
   */
  executeBatch(
    connection: Connection,
    queries: Array<{
      sql: string;
      parameters?: QueryParameter[];
      options?: QueryOptions;
    }>
  ): Promise<INodeExecutionData[]>;

  /**
   * Valida sintaxe SQL
   */
  validateSQL(sql: string): { isValid: boolean; errors: string[] };
}

/**
 * Interface para operações em massa (bulk operations)
 */
export interface BulkOperationsExecutor {
  /**
   * Inserção em massa
   */
  bulkInsert(
    connection: Connection,
    tableName: string,
    data: any[],
    options?: BulkOperationOptions
  ): Promise<BulkOperationResult>;

  /**
   * Atualização em massa
   */
  bulkUpdate(
    connection: Connection,
    tableName: string,
    data: any[],
    whereColumns: string[],
    options?: BulkOperationOptions
  ): Promise<BulkOperationResult>;

  /**
   * Exclusão em massa
   */
  bulkDelete(
    connection: Connection,
    tableName: string,
    data: any[],
    whereColumns: string[],
    options?: BulkOperationOptions
  ): Promise<BulkOperationResult>;

  /**
   * Upsert em massa (insert ou update)
   */
  bulkUpsert(
    connection: Connection,
    tableName: string,
    data: any[],
    keyColumns: string[],
    options?: BulkOperationOptions
  ): Promise<BulkOperationResult>;
}

/**
 * Interface para executor de PL/SQL
 */
export interface PLSQLExecutor {
  /**
   * Executa bloco PL/SQL anônimo
   */
  executeAnonymousBlock(
    connection: Connection,
    plsqlBlock: string,
    binds?: { [key: string]: any },
    options?: PLSQLExecutionOptions
  ): Promise<PLSQLExecutionResult>;

  /**
   * Executa stored procedure
   */
  executeProcedure(
    connection: Connection,
    procedureName: string,
    parameters?: { [key: string]: any },
    options?: PLSQLExecutionOptions
  ): Promise<PLSQLExecutionResult>;

  /**
   * Executa function
   */
  executeFunction(
    connection: Connection,
    functionName: string,
    parameters?: { [key: string]: any },
    returnType?: string,
    options?: PLSQLExecutionOptions
  ): Promise<PLSQLExecutionResult>;

  /**
   * Valida sintaxe PL/SQL
   */
  validatePLSQL(plsqlBlock: string): { isValid: boolean; errors: string[] };
}

/**
 * Interface para gerenciamento de transações
 */
export interface TransactionManager {
  /**
   * Inicia uma nova transação
   */
  beginTransaction(options?: TransactionOptions): Promise<void>;

  /**
   * Confirma (commit) a transação
   */
  commit(): Promise<void>;

  /**
   * Desfaz (rollback) a transação
   */
  rollback(): Promise<void>;

  /**
   * Cria um savepoint
   */
  createSavepoint(name: string, description?: string): Promise<void>;

  /**
   * Rollback para um savepoint específico
   */
  rollbackToSavepoint(name: string): Promise<void>;

  /**
   * Executa operação com retry automático
   */
  executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T>;

  /**
   * Verifica se transação está ativa
   */
  isTransactionActive(): boolean;
}

/**
 * Interface para Oracle Advanced Queuing
 */
export interface AQOperationsExecutor {
  /**
   * Envia mensagem para a fila
   */
  enqueueMessage(
    connection: Connection,
    queueName: string,
    message: AQMessage,
    options?: any
  ): Promise<AQOperationResult>;

  /**
   * Recebe mensagem da fila
   */
  dequeueMessage(
    connection: Connection,
    queueName: string,
    options?: any
  ): Promise<AQOperationResult>;

  /**
   * Obtém informações da fila
   */
  getQueueInfo(
    connection: Connection,
    queueName: string
  ): Promise<any>;

  /**
   * Lista filas disponíveis
   */
  listQueues(connection: Connection): Promise<string[]>;
}

/**
 * Interface para operações de streaming
 */
export interface StreamOperationsExecutor {
  /**
   * Processa dados em stream para grandes volumes
   */
  processDataStream<T>(
    connection: Connection,
    sql: string,
    processor: (row: T) => Promise<void>,
    options?: {
      batchSize?: number;
      maxRows?: number;
      timeout?: number;
    }
  ): Promise<{ processedRows: number; errors: string[] }>;

  /**
   * Exporta dados em stream
   */
  exportDataStream(
    connection: Connection,
    sql: string,
    outputFormat: 'csv' | 'json' | 'xml',
    options?: any
  ): Promise<NodeJS.ReadableStream>;
}
