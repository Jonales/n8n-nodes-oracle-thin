import { IExecuteFunctions, INodeExecutionData, INodeType, NodeOperationError } from 'n8n-workflow';
import { Connection } from 'oracledb';
import { OracleConnectionPool } from '../core/connectionPool';
import { OracleCredentials } from '../types/oracle.credentials.type';

/**
 * Classe base para todos os handlers Oracle
 * Fornece funcionalidades comuns como gerenciamento de conexão e tratamento de erros
 */
export abstract class BaseOracleHandler {
  protected node: INodeType;
  protected functions: IExecuteFunctions;

  constructor(node: INodeType, functions: IExecuteFunctions) {
    this.node = node;
    this.functions = functions;
  }

  /**
   * Obter credenciais Oracle padronizadas
   */
  protected async getCredentials(): Promise<OracleCredentials> {
    const credentials = await this.functions.getCredentials('oracleCredentials');
    return {
      user: String(credentials.user),
      password: String(credentials.password),
      connectionString: String(credentials.connectionString),
    };
  }

  /**
   * Obter conexão Oracle usando connection pool
   */
  protected async getConnection(poolConfig?: any): Promise<Connection> {
    const credentials = await this.getCredentials();
    const pool = await OracleConnectionPool.getPool(credentials, poolConfig);
    return pool.getConnection();
  }

  /**
   * Executar operação com tratamento automático de conexão
   */
  protected async executeWithConnection<T>(
    operation: (connection: Connection) => Promise<T>,
    poolConfig?: any
  ): Promise<T> {
    let connection: Connection | undefined;
    
    try {
      connection = await this.getConnection(poolConfig);
      return await operation(connection);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new NodeOperationError(this.node, errorMessage);
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError: unknown) {
          console.error(
            `Erro ao fechar conexão: ${closeError instanceof Error ? closeError.message : String(closeError)}`
          );
        }
      }
    }
  }

  /**
   * Converter resultados para formato n8n
   */
  protected convertToN8nFormat(data: any[]): INodeExecutionData[] {
    return this.functions.helpers.returnJsonArray(data);
  }

  /**
   * Obter parâmetro do node com valor padrão
   */
  protected getParameter<T>(name: string, itemIndex = 0, defaultValue?: T): T {
    return this.functions.getNodeParameter(name, itemIndex, defaultValue) as T;
  }

  /**
   * Obter dados de entrada
   */
  protected getInputData(): INodeExecutionData[] {
    return this.functions.getInputData();
  }

  /**
   * Método abstrato que deve ser implementado por cada handler
   */
  abstract execute(): Promise<INodeExecutionData[]>;

  /**
   * Validar parâmetros obrigatórios
   */
  protected validateRequiredParameters(params: { [key: string]: any }): void {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        throw new NodeOperationError(this.node, `Parâmetro obrigatório '${key}' não fornecido`);
      }
    }
  }

  /**
   * Log de debug se habilitado
   */
  protected debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.node.description.name}] ${message}`, data || '');
    }
  }

  /**
   * Tratamento padrão de erros
   */
  protected handleError(error: unknown, context?: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    this.debug('Erro capturado', { error: fullMessage, context });
    throw new NodeOperationError(this.node, fullMessage);
  }
}