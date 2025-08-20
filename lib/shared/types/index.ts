/**
 * Tipos compartilhados consolidados
 */
export * from './oracle-types';
export * from './n8n-types';
export * from './service-types';
export * from './operation-types';

// Tipo principal para credenciais Oracle
export interface OracleCredentials {
  user: string;
  password: string;
  connectionString: string;
  thinMode?: boolean;
  connectTimeout?: number;
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
  enableAriaCompliant?: boolean;
}

// Configuração de serviços
export interface ServiceConfig {
  poolConfig?: any;
  debug?: boolean;
  timeout?: number;
}

// Padrão de resposta de serviços
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Opções do Factory
export interface FactoryOptions {
  environment?: 'development' | 'production';
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  maxConnections?: number;
}