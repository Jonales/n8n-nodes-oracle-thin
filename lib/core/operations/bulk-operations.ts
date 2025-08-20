/**
 * BulkOperations - migração completa para lib/core/operations
 */
import { Connection } from 'oracledb';
import {
  BulkOperations as IBulkOperations,
  BulkInsertOptions,
  BulkUpdateOptions,
  BulkDeleteOptions,
  BulkUpsertOptions,
  BulkOperationResult,
  BulkError,
  ServiceResult
} from '@shared';

export class BulkOperations implements IBulkOperations {
  private connection: Connection;
  private defaultBatchSize: number;

  constructor(connection: Connection, defaultBatchSize = 1000) {
    this.connection = connection;
    this.defaultBatchSize = defaultBatchSize;
  }

  async bulkInsert(
    tableName: string,
    data: any[],
    options: BulkInsertOptions = {}
  ): Promise<ServiceResult<BulkOperationResult>> {
    const batchSize = options.batchSize ?? this.defaultBatchSize;
    const continueOnError = options.continueOnError ?? false;
    const autoCommit = options.autoCommit ?? true;
    const start = Date.now();
    const columns = Object.keys(data[0] || {});
    const placeholders = columns.map(_ => `:${_}`).join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    let successful = 0;
    let failed = 0;
    const errors: BulkError[] = [];
    let batchCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      batchCount++;
      const batch = data.slice(i, i + batchSize);
      const binds = batch.map(row => columns.reduce((acc, col) => ({ ...acc, [col]: row[col] }), {}));
      try {
        const result = await this.connection.executeMany(sql, binds, {
          autoCommit: false,
          batchErrors: continueOnError
        });
        if (result.batchErrors?.length) {
          for (const err of result.batchErrors) {
            errors.push({
              batchIndex: batchCount - 1,
              rowIndex: i + (err.offset ?? 0),
              error: (err as any).error?.message || 'Unknown'
            });
          }
          failed += result.batchErrors.length;
          successful += batch.length - result.batchErrors.length;
        } else {
          successful += batch.length;
        }
        if (autoCommit) await this.connection.commit();
      } catch (error: unknown) {
        failed += batch.length;
        if (!continueOnError) throw error;
        for (let idx = 0; idx < batch.length; idx++) {
          errors.push({ batchIndex: batchCount - 1, rowIndex: i + idx, error: (error as Error).message });
        }
      }
    }
    if (!options.autoCommit && successful > 0) await this.connection.commit();
    const duration = Date.now() - start;

    return {
      success: failed === 0,
      data: {
        operation: 'INSERT',
        totalRows: data.length,
        successfulRows: successful,
        failedRows: failed,
        batchCount,
        duration,
        errors
      },
      message: `Bulk insert completed: ${successful} succeeded, ${failed} failed in ${duration}ms`,
    };
  }

  // falta ajustar para efetuar o bulkDelete 
  async bulkUpdate(
    tableName: string,
    data: any[],
    options: BulkInsertOptions = {}
  ): Promise<ServiceResult<BulkOperationResult>> {
    const batchSize = options.batchSize ?? this.defaultBatchSize;
    const continueOnError = options.continueOnError ?? false;
    const autoCommit = options.autoCommit ?? true;
    const start = Date.now();
    const columns = Object.keys(data[0] || {});
    const placeholders = columns.map(_ => `:${_}`).join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    let successful = 0;
    let failed = 0;
    const errors: BulkError[] = [];
    let batchCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      batchCount++;
      const batch = data.slice(i, i + batchSize);
      const binds = batch.map(row => columns.reduce((acc, col) => ({ ...acc, [col]: row[col] }), {}));
      try {
        const result = await this.connection.executeMany(sql, binds, {
          autoCommit: false,
          batchErrors: continueOnError
        });
        if (result.batchErrors?.length) {
          for (const err of result.batchErrors) {
            errors.push({
              batchIndex: batchCount - 1,
              rowIndex: i + (err.offset ?? 0),
              error: (err as any).error?.message || 'Unknown'
            });
          }
          failed += result.batchErrors.length;
          successful += batch.length - result.batchErrors.length;
        } else {
          successful += batch.length;
        }
        if (autoCommit) await this.connection.commit();
      } catch (error: unknown) {
        failed += batch.length;
        if (!continueOnError) throw error;
        for (let idx = 0; idx < batch.length; idx++) {
          errors.push({ batchIndex: batchCount - 1, rowIndex: i + idx, error: (error as Error).message });
        }
      }
    }
    if (!options.autoCommit && successful > 0) await this.connection.commit();
    const duration = Date.now() - start;

    return {
      success: failed === 0,
      data: {
        operation: 'INSERT',
        totalRows: data.length,
        successfulRows: successful,
        failedRows: failed,
        batchCount,
        duration,
        errors
      },
      message: `Bulk insert completed: ${successful} succeeded, ${failed} failed in ${duration}ms`,
    };
  }

  // falta ajustar para efetuar o bulkDelete 
  async bulkDelete(
    tableName: string,
    data: any[],
    options: BulkInsertOptions = {}
  ): Promise<ServiceResult<BulkOperationResult>> {
    const batchSize = options.batchSize ?? this.defaultBatchSize;
    const continueOnError = options.continueOnError ?? false;
    const autoCommit = options.autoCommit ?? true;
    const start = Date.now();
    const columns = Object.keys(data[0] || {});
    const placeholders = columns.map(_ => `:${_}`).join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    let successful = 0;
    let failed = 0;
    const errors: BulkError[] = [];
    let batchCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      batchCount++;
      const batch = data.slice(i, i + batchSize);
      const binds = batch.map(row => columns.reduce((acc, col) => ({ ...acc, [col]: row[col] }), {}));
      try {
        const result = await this.connection.executeMany(sql, binds, {
          autoCommit: false,
          batchErrors: continueOnError
        });
        if (result.batchErrors?.length) {
          for (const err of result.batchErrors) {
            errors.push({
              batchIndex: batchCount - 1,
              rowIndex: i + (err.offset ?? 0),
              error: (err as any).error?.message || 'Unknown'
            });
          }
          failed += result.batchErrors.length;
          successful += batch.length - result.batchErrors.length;
        } else {
          successful += batch.length;
        }
        if (autoCommit) await this.connection.commit();
      } catch (error: unknown) {
        failed += batch.length;
        if (!continueOnError) throw error;
        for (let idx = 0; idx < batch.length; idx++) {
          errors.push({ batchIndex: batchCount - 1, rowIndex: i + idx, error: (error as Error).message });
        }
      }
    }
    if (!options.autoCommit && successful > 0) await this.connection.commit();
    const duration = Date.now() - start;

    return {
      success: failed === 0,
      data: {
        operation: 'INSERT',
        totalRows: data.length,
        successfulRows: successful,
        failedRows: failed,
        batchCount,
        duration,
        errors
      },
      message: `Bulk insert completed: ${successful} succeeded, ${failed} failed in ${duration}ms`,
    };
  }

  // falta ajustar para efetuar o bulkUpsert
  async bulkUpsert(
    tableName: string,
    data: any[],
    options: BulkInsertOptions = {}
  ): Promise<ServiceResult<BulkOperationResult>> {
    const batchSize = options.batchSize ?? this.defaultBatchSize;
    const continueOnError = options.continueOnError ?? false;
    const autoCommit = options.autoCommit ?? true;
    const start = Date.now();
    const columns = Object.keys(data[0] || {});
    const placeholders = columns.map(_ => `:${_}`).join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    let successful = 0;
    let failed = 0;
    const errors: BulkError[] = [];
    let batchCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      batchCount++;
      const batch = data.slice(i, i + batchSize);
      const binds = batch.map(row => columns.reduce((acc, col) => ({ ...acc, [col]: row[col] }), {}));
      try {
        const result = await this.connection.executeMany(sql, binds, {
          autoCommit: false,
          batchErrors: continueOnError
        });
        if (result.batchErrors?.length) {
          for (const err of result.batchErrors) {
            errors.push({
              batchIndex: batchCount - 1,
              rowIndex: i + (err.offset ?? 0),
              error: (err as any).error?.message || 'Unknown'
            });
          }
          failed += result.batchErrors.length;
          successful += batch.length - result.batchErrors.length;
        } else {
          successful += batch.length;
        }
        if (autoCommit) await this.connection.commit();
      } catch (error: unknown) {
        failed += batch.length;
        if (!continueOnError) throw error;
        for (let idx = 0; idx < batch.length; idx++) {
          errors.push({ batchIndex: batchCount - 1, rowIndex: i + idx, error: (error as Error).message });
        }
      }
    }
    if (!options.autoCommit && successful > 0) await this.connection.commit();
    const duration = Date.now() - start;

    return {
      success: failed === 0,
      data: {
        operation: 'INSERT',
        totalRows: data.length,
        successfulRows: successful,
        failedRows: failed,
        batchCount,
        duration,
        errors
      },
      message: `Bulk insert completed: ${successful} succeeded, ${failed} failed in ${duration}ms`,
    };
  }
}