/**
 * Gerenciador de conexões Oracle - Refatorado
 * Localização: lib/core/connection/connection-manager.ts
 */

import oracledb, { Connection, ConnectionAttributes } from 'oracledb';
import { 
  OracleCredentials, 
  DatabaseConnection, 
  ConnectionOptions,
  CONNECTION_DEFAULTS,
  ORACLE_ERROR_CODES,
  ORACLE_ERROR_MESSAGES
} from '@shared';

export class OracleConnectionManager implements DatabaseConnection {
  private databaseConfig: ConnectionAttributes;
  private options: ConnectionOptions;

  constructor(credentials: OracleCredentials, options: ConnectionOptions = {}) {
    const { user, password, connectionString } = credentials;

    this.databaseConfig = {
      user,
      password,
      connectionString,
      connectTimeout: options.connectTimeout ?? CONNECTION_DEFAULTS.CONNECT_TIMEOUT,
      fetchArraySize: options.fetchArraySize ?? CONNECTION_DEFAULTS.FETCH_ARRAY_SIZE,
      ...options
    } as ConnectionAttributes;

    this.options = {
      thinMode: CONNECTION_DEFAULTS.THIN_MODE,
      autoCommit: true,
      enableStatistics: true,
      ...options
    };

    // Configurar thin mode
    this.configureThinMode();
  }

  /**
   * Estabelece conexão com Oracle
   */
  async getConnection(): Promise<Connection> {
    try {
      return await oracledb.getConnection(this.databaseConfig);
    } catch (error: unknown) {
      throw this.createConnectionError(error);
    }
  }

  /**
   * Testa a conexão
   */
  async testConnection(): Promise<boolean> {
    let connection: Connection | undefined;
    try {
      connection = await this.getConnection();
      await connection.execute('SELECT 1 FROM DUAL');
      return true;
    } catch (error) {
      return false;
    } finally {
      if (connection) {
        await this.safeClose(connection);
      }
    }
  }

  /**
   * Obtém informações da conexão
   */
  async getConnectionInfo(): Promise<any> {
    let connection: Connection | undefined;
    try {
      connection = await this.getConnection();
      const result = await connection.execute(`
        SELECT 
          USER as current_user,
          SYS_CONTEXT('USERENV', 'DB_NAME') as db_name,
          (SELECT VERSION FROM V$INSTANCE) as db_version,
          SYSDATE as server_time
        FROM DUAL
      `, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      
      return result.rows?. || {};
    } finally {
      if (connection) {
        await this.safeClose(connection);
      }
    }
  }

  /**
   * Configura thin mode
   */
  private configureThinMode(): void {
    if (this.options.thinMode) {
      oracledb.fetchAsString = [oracledb.CLOB];
      // Thin mode é default no oracledb 6.x
    }
  }

  /**
   * Cria erro padronizado para conexão
   */
  private createConnectionError(error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Procurar por erros conhecidos
    for (const [code, message] of Object.entries(ORACLE_ERROR_MESSAGES)) {
      if (errorMessage.includes(code)) {
        return new Error(`[${code}] ${message}`);
      }
    }

    return new Error(`Failed to connect to Oracle Database: ${errorMessage}`);
  }

  /**
   * Fecha conexão de forma segura
   */
  private async safeClose(connection: Connection): Promise<void> {
    try {
      await connection.close();
    } catch (error) {
      console.warn('Warning: Failed to close Oracle connection:', error);
    }
  }
}

/**
 * Factory para criar diferentes tipos de connection managers
 */
export class ConnectionManagerFactory {
  /**
   * Connection manager básico
   */
  static createStandard(credentials: OracleCredentials): OracleConnectionManager {
    return new OracleConnectionManager(credentials);
  }

  /**
   * Connection manager para alta performance
   */
  static createHighPerformance(credentials: OracleCredentials): OracleConnectionManager {
    return new OracleConnectionManager(credentials, {
      fetchArraySize: 10000,
      stmtCacheSize: 100,
      enableStatistics: true,
    });
  }

  /**
   * Connection manager para operações analíticas
   */
  static createAnalytics(credentials: OracleCredentials): OracleConnectionManager {
    return new OracleConnectionManager(credentials, {
      fetchArraySize: 1000,
      connectTimeout: 300000, // 5 minutos
      enableStatistics: false,
    });
  }
}
