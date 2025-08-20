/**
 * Tipos para operações de banco de dados Oracle
 * Localização: src/shared/types/operations.type.ts
 */

import { INodeExecutionData } from 'n8n-workflow';
import { Connection } from 'oracledb';

export interface QueryParameter {
  name: string;
  value: string | number | Date | boolean;
  datatype: 'string' | 'number' | 'date' | 'clob' | 'blob' | 'cursor' | 'out';
  parseInStatement?: boolean;
}

export interface QueryOptions {
  autoCommit?: boolean;
  fetchArraySize?: number;
  maxRows?: number;
  outFormat?: number;
  enableDebug?: boolean;
  timeout?: number;
}

export interface BulkOperationOptions {
  batchSize?: number;
  continueOnError?: boolean;
  autoCommit?: boolean;
  bindDefs?: any;
  dmlRowCounts?: boolean;
}

export interface BulkOperationResult {
  operation: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  batchCount: number;
  duration: number;
  errors: BulkError[];
}

export interface BulkError {
  batchIndex: number;
  rowIndex: number;
  error: string;
  data?: any;
}

export interface TransactionOptions {
  isolation?: 'READ_COMMITTED' | 'SERIALIZABLE' | 'READ_ONLY';
  timeout?: number;
  autoRollbackOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SavepointInfo {
  name: string;
  timestamp: Date;
  description?: string;
}

export interface PLSQLExecutionResult {
  success: boolean;
  executionTime: number;
  outBinds: { [key: string]: any };
  implicitResults: any[][];
  rowsAffected?: number;
  warnings: string[];
  compilationErrors: PLSQLCompilationError[];
}

export interface PLSQLCompilationError {
  line: number;
  position: number;
  text: string;
  attribute: string;
  messageNumber: number;
}

export interface PLSQLExecutionOptions {
  autoCommit?: boolean;
  fetchArraySize?: number;
  maxRows?: number;
  outFormat?: number;
  enableDebug?: boolean;
  timeout?: number;
}

export interface AQMessage {
  payload: any;
  messageId?: string;
  correlationId?: string;
  delay?: number;
  expiration?: number;
  priority?: number;
  properties?: { [key: string]: any };
}

export interface AQOperationResult {
  success: boolean;
  messageId?: string;
  correlationId?: string;
  enqueueTime?: Date;
  dequeueTime?: Date;
  attemptCount?: number;
  payload?: any;
  error?: string;
}

export type OperationType = 'query' | 'plsql' | 'procedure' | 'function' | 'bulk' | 'transaction' | 'queue';

export type BulkOperationType = 'insert' | 'update' | 'delete' | 'upsert';
