/**
 * Base Service Class - Classe base para todos os services
 * Localização: lib/services/shared/service-base.ts
 */

import { Connection } from 'oracledb';
import { INodeExecutionData } from 'n8n-workflow';
import { ServiceResult, ORACLE_ERROR_MESSAGES } from '@shared';

export abstract class BaseOracleService {
  protected connection: Connection;
  protected serviceName: string;

  constructor(connection: Connection, serviceName: string) {
    this.connection = connection;
    this.serviceName = serviceName;
  }

  /**
   * Testa conectividade da conexão
   */
  async testConnection(): Promise<ServiceResult<boolean>> {
    try {
      await this.connection.execute('SELECT 1 FROM DUAL');
      return {
        success: true,
        data: true,
        message: `${this.serviceName} conectado com sucesso`
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Erro de conexão no ${this.serviceName}`
      };
    }
  }

  /**
   * Executa transação com rollback automático em caso de erro
   */
  protected async executeTransaction<T>(
    operation: () => Promise<T>
  ): Promise<ServiceResult<T>> {
    try {
      const result = await operation();
      await this.connection.commit();
      
      return {
        success: true,
        data: result,
        message: 'Transação executada com sucesso'
      };
    } catch (error: unknown) {
      await this.connection.rollback();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro na transação - rollback executado'
      };
    }
  }

  /**
   * Converte dados para formato n8n
   */
  protected async convertToN8nFormat<T>(
    data: T | T[]
  ): Promise<INodeExecutionData[]> {
    const items = Array.isArray(data) ? data : [data];
    
    return items.map(item => ({
      json: item as any
    }));
  }

  /**
   * Tratamento padronizado de erros Oracle
   */
  protected parseOracleError(error: unknown): string {
    if (!(error instanceof Error)) {
      return String(error);
    }

    const errorMessage = error.message;

    // Procurar por códigos de erro conhecidos
    for (const [pattern, message] of Object.entries(ORACLE_ERROR_MESSAGES)) {
      if (errorMessage.includes(pattern)) {
        return message;
      }
    }

    return errorMessage;
  }

  /**
   * Valida nome de tabela/objeto Oracle
   */
  protected validateOracleObjectName(name: string): boolean {
    // Oracle object names: 1-30 caracteres, começar com letra, alphanumeric + _ $ #
    const pattern = /^[A-Za-z][A-Za-z0-9_$#]{0,29}$/;
    return pattern.test(name);
  }

  /**
   * Escapa nome de objeto Oracle para prevenir SQL injection
   */
  protected escapeOracleObjectName(name: string): string {
    if (!this.validateOracleObjectName(name)) {
      throw new Error(`Nome de objeto Oracle inválido: ${name}`);
    }
    return name.toUpperCase();
  }

  /**
   * Cria bind parameters seguros
   */
  protected createBindParameters(params: Record<string, any>): Record<string, any> {
    const bindParams: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Validar nome do parâmetro
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
        throw new Error(`Nome de parâmetro inválido: ${key}`);
      }
      
      bindParams[key] = value;
    }
    
    return bindParams;
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  protected debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.serviceName}] ${message}`, data || '');
    }
  }

  /**
   * Métrica de performance simples
   */
  protected async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.debug(`${operation} executado em ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.debug(`${operation} falhou após ${duration}ms`, error);
      throw error;
    }
  }
}
