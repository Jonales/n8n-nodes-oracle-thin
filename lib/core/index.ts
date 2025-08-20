/**
 * Index central para Core Modules - Refatorado
 * Localização: lib/core/index.ts
 */

// ============================================================================
// CONNECTION EXPORTS
// ============================================================================

// Connection Management
export { 
  OracleConnectionManager,
  ConnectionManagerFactory 
} from './connection/connection-manager';

// Pool Management
export { 
  OraclePoolManager, 
  PoolFactory 
} from './connection/pool-manager';

// ============================================================================
// OPERATIONS EXPORTS
// ============================================================================

// SQL Executor
export { 
  OracleSQLExecutor,
  SQLExecutorFactory 
} from './operations/sql-executor';

// PL/SQL Executor
export { 
  OraclePLSQLExecutor,
  PLSQLExecutorFactory 
} from './operations/plsql-executor';

// Bulk Operations
export { 
  OracleBulkOperations,
  BulkOperationsFactory 
} from './operations/bulk-operations';

// Transaction Manager
export { 
  OracleTransactionManager,
  TransactionManagerFactory 
} from './operations/transaction-manager';

// Advanced Queue Operations
export { 
  OracleAQOperations,
  AQOperationsFactory 
} from './operations/aq-operations';

// ============================================================================
// TYPE ALIASES E RE-EXPORTS
// ============================================================================

// Re-export tipos importantes do shared para facilitar uso
export type {
  // Connection types
  OracleCredentials,
  ConnectionOptions,
  PoolConfig,
  PoolStatistics,
  
  // Operations types
  SQLExecutionOptions,
  SQLExecutionResult,
  PLSQLExecutionOptions,
  PLSQLExecutionResult,
  BulkOperationResult,
  TransactionOptions,
  
  // AQ types
  AQMessage,
  AQEnqueueOptions,
  AQDequeueOptions,
  AQOperationResult,
} from '@shared';

// ============================================================================
// FACTORY PRINCIPAL
// ============================================================================

import { Connection } from 'oracledb';
import { OracleCredentials } from '@shared';

/**
 * Factory principal para criar todos os componentes core
 */
export class OracleCoreFactory {
  /**
   * Cria connection manager
   */
  static createConnectionManager(credentials: OracleCredentials): OracleConnectionManager {
    return ConnectionManagerFactory.createStandard(credentials);
  }

  /**
   * Cria pool manager
   */
  static async createPoolManager(credentials: OracleCredentials): Promise<oracledb.Pool> {
    return PoolFactory.createStandardPool(credentials);
  }

  /**
   * Cria executor SQL
   */
  static createSQLExecutor(connection: Connection): OracleSQLExecutor {
    return SQLExecutorFactory.createStandard(connection);
  }

  /**
   * Cria executor PL/SQL
   */
  static createPLSQLExecutor(connection: Connection): OraclePLSQLExecutor {
    return PLSQLExecutorFactory.createProduction(connection);
  }

  /**
   * Cria operações bulk
   */
  static createBulkOperations(connection: Connection): OracleBulkOperations {
    return BulkOperationsFactory.createHighVolumeOperations(connection);
  }

  /**
   * Cria transaction manager
   */
  static createTransactionManager(connection: Connection): OracleTransactionManager {
    return TransactionManagerFactory.createOLTPManager(connection);
  }

  /**
   * Cria operações AQ
   */
  static createAQOperations(connection: Connection): OracleAQOperations {
    return AQOperationsFactory.createHighFrequencyOperator(connection);
  }

  /**
   * Cria suite completa de operações para uma conexão
   */
  static createOperationsSuite(connection: Connection): {
    sql: OracleSQLExecutor;
    plsql: OraclePLSQLExecutor;
    bulk: OracleBulkOperations;
    transaction: OracleTransactionManager;
    aq: OracleAQOperations;
  } {
    return {
      sql: this.createSQLExecutor(connection),
      plsql: this.createPLSQLExecutor(connection),
      bulk: this.createBulkOperations(connection),
      transaction: this.createTransactionManager(connection),
      aq: this.createAQOperations(connection),
    };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Utilitários para core operations
 */
export const CoreUtils = {
  /**
   * Testa conectividade geral
   */
  async testConnectivity(credentials: OracleCredentials): Promise<{
    success: boolean;
    connectionManager: boolean;
    poolManager: boolean;
    error?: string;
  }> {
    try {
      // Testar connection manager
      const connManager = OracleCoreFactory.createConnectionManager(credentials);
      const connTest = await connManager.testConnection();

      // Testar pool manager
      let poolTest = false;
      try {
        const pool = await OracleCoreFactory.createPoolManager(credentials);
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1 FROM DUAL');
        await connection.close();
        await pool.close(0);
        poolTest = true;
      } catch (error) {
        console.warn('Pool test failed:', error);
      }

      return {
        success: connTest && poolTest,
        connectionManager: connTest,
        poolManager: poolTest,
      };
    } catch (error: unknown) {
      return {
        success: false,
        connectionManager: false,
        poolManager: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Cria configuração otimizada baseada no tipo de workload
   */
  createOptimizedConfig(workloadType: 'OLTP' | 'ANALYTICS' | 'BATCH' | 'MIXED'): {
    connectionOptions: any;
    poolConfig: any;
    executorOptions: any;
  } {
    switch (workloadType) {
      case 'OLTP':
        return {
          connectionOptions: { fetchArraySize: 100 },
          poolConfig: { poolMin: 10, poolMax: 100, poolIncrement: 10 },
          executorOptions: { autoCommit: true, timeout: 30 },
        };
      
      case 'ANALYTICS':
        return {
          connectionOptions: { fetchArraySize: 1000 },
          poolConfig: { poolMin: 2, poolMax: 10, poolIncrement: 1 },
          executorOptions: { autoCommit: false, timeout: 3600 },
        };
      
      case 'BATCH':
        return {
          connectionOptions: { fetchArraySize: 10000 },
          poolConfig: { poolMin: 5, poolMax: 50, poolIncrement: 5 },
          executorOptions: { autoCommit: false, timeout: 1800 },
        };
      
      case 'MIXED':
      default:
        return {
          connectionOptions: { fetchArraySize: 500 },
          poolConfig: { poolMin: 5, poolMax: 25, poolIncrement: 3 },
          executorOptions: { autoCommit: true, timeout: 300 },
        };
    }
  },
};

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default OracleCoreFactory;
