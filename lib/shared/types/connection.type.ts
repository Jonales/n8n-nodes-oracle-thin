/**
 * Tipos para gerenciamento de conexões Oracle
 * Localização: src/shared/types/connection.type.ts
 */

import { Connection, Pool } from 'oracledb';
import { OracleCredentials, OraclePoolConfig } from './oracle.credentials.type';

export interface ConnectionManagerConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  connectionTimeout: number;
}

export interface ConnectionInfo {
  id: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
  database: string;
  user: string;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  error?: string;
}

export interface PoolInfo {
  poolKey: string;
  isActive: boolean;
  createdAt: Date;
  connectionsOpen: number;
  connectionsInUse: number;
  queueLength: number;
  statistics: PoolStatistics;
}

export interface PoolStatistics {
  poolMin: number;
  poolMax: number;
  poolIncrement: number;
  poolTimeout: number;
  stmtCacheSize: number;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'idle';

export type PoolType = 'standard' | 'high-volume' | 'oltp' | 'analytics' | 'batch';
