/**
 * Interfaces padronizadas para operações de banco de dados Oracle
 * Localização: src/shared/interfaces/database.interface.ts
 */

import { Connection, Pool } from 'oracledb';
import { OracleCredentials } from '../types/oracle.credentials.type';
import { ConnectionInfo, PoolInfo } from '../types/connection.type';

/**
 * Interface principal para gerenciamento de conexões com banco Oracle
 */
export interface DatabaseConnection {
  /**
   * Obtém uma conexão com o banco de dados
   */
  getConnection(): Promise<Connection>;
  
  /**
   * Testa se a conexão está funcional
   */
  testConnection?(): Promise<boolean>;
  
  /**
   * Fecha a conexão
   */
  close?(): Promise<void>;
}

/**
 * Interface para gerenciamento de pool de conexões
 */
export interface DatabaseConnectionPool {
  /**
   * Obtém ou cria um pool de conexões
   */
  getPool(credentials: OracleCredentials, config?: any): Promise<Pool>;
  
  /**
   * Obtém uma conexão do pool
   */
  getConnection(credentials: OracleCredentials): Promise<Connection>;
  
  /**
   * Obtém estatísticas do pool
   */
  getPoolStatistics(credentials: OracleCredentials): Promise<PoolInfo>;
  
  /**
   * Verifica se existe um pool ativo
   */
  hasActivePool(credentials: OracleCredentials): boolean;
  
  /**
   * Fecha um pool específico
   */
  closePool(credentials: OracleCredentials): Promise<void>;
  
  /**
   * Fecha todos os pools
   */
  closeAllPools(): Promise<void>;
}

/**
 * Interface para monitoramento de saúde das conexões
 */
export interface ConnectionHealthMonitor {
  /**
   * Verifica saúde de uma conexão específica
   */
  checkConnectionHealth(connection: Connection): Promise<boolean>;
  
  /**
   * Inicia monitoramento contínuo
   */
  startMonitoring(intervalMs: number): void;
  
  /**
   * Para monitoramento
   */
  stopMonitoring(): void;
  
  /**
   * Obtém informações de saúde
   */
  getHealthInfo(): ConnectionInfo[];
}

/**
 * Interface para validação de conexões
 */
export interface ConnectionValidator {
  /**
   * Valida credenciais de conexão
   */
  validateCredentials(credentials: OracleCredentials): Promise<boolean>;
  
  /**
   * Valida configuração de pool
   */
  validatePoolConfig(config: any): boolean;
  
  /**
   * Executa validação completa
   */
  validateConnection(credentials: OracleCredentials): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}
