/**
 * Tipos de credenciais Oracle para conexão com banco de dados
 * Localização: src/shared/types/oracle.credentials.type.ts
 */

export interface OracleCredentials {
  user: string;
  password: string;
  connectionString: string;
  thinMode?: boolean;
  connectTimeout?: number;
}

export interface OraclePoolCredentials extends OracleCredentials {
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
  enableAriaCompliant?: boolean;
}

export interface OracleConnectionConfig {
  credentials: OracleCredentials;
  poolConfig?: OraclePoolConfig;
  retryConfig?: OracleRetryConfig;
}

export interface OraclePoolConfig {
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
  poolTimeout?: number;
  stmtCacheSize?: number;
  queueMax?: number;
  queueTimeout?: number;
  poolPingInterval?: number;
  enableStatistics?: boolean;
  homogeneous?: boolean;
}

export interface OracleRetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  maxRetryDelay?: number;
}

export type ConnectionPoolType = 'standard' | 'highvolume' | 'oltp' | 'analytics' | 'single';

export type OracleDataType = 'string' | 'number' | 'date' | 'clob' | 'blob' | 'cursor' | 'out';
