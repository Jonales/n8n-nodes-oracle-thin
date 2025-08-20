/**
 * Executor SQL Oracle - Refatorado
 * Localização: lib/core/operations/sql-executor.ts
 */

import oracledb, { Connection } from 'oracledb';
import { 
  SQLExecutor,
  SQLExecutionOptions,
  SQLExecutionResult,
  ParameterItem,
  QueryValidationResult,
  ORACLE_DATA_TYPES,
  BIND_DIRECTIONS,
  CONNECTION_DEFAULTS,
  DEFAULT_ERROR_CONFIG
} from '@shared';

export class OracleSQLExecutor implements SQLExecutor {
  private connection: Connection;
  private options: SQLExecutionOptions;

  constructor(connection: Connection, options: SQLExecutionOptions = {}) {
    this.connection = connection;
    this.options = {
      autoCommit: true,
      outFormat: CONNECTION_DEFAULTS.OUT_FORMAT,
      fetchArraySize: CONNECTION_DEFAULTS.FETCH_ARRAY_SIZE,
      maxRows: CONNECTION_DEFAULTS.MAX_ROWS,
      ...options
    };
  }

  /**
   * Executa query SQL com parâmetros
   */
  async execute(
    sql: string,
    parameters: ParameterItem[] = [],
    options: Partial<SQLExecutionOptions> = {}
  ): Promise<SQLExecutionResult> {
    const startTime = Date.now();

    try {
      // Validar query
      const validation = this.validateQuery(sql);
      if (!validation.isValid) {
        throw new Error(`Query inválida: ${validation.errors.join(', ')}`);
      }

      // Processar parâmetros
      const { bindParameters, processedQuery } = this.processParameters(parameters, sql);

      // Configurar opções de execução
      const execOptions = {
        ...this.options,
        ...options
      };

      // Executar query
      const result = await this.connection.execute(processedQuery, bindParameters, execOptions);

      return {
        success: true,
        executionTime: Date.now() - startTime,
        rows: result.rows || [],
        rowsAffected: result.rowsAffected || 0,
        outBinds: result.outBinds || {},
        metaData: result.metaData || [],
        query: processedQuery,
        parameters: bindParameters,
      };

    } catch (error: unknown) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        rows: [],
        rowsAffected: 0,
        outBinds: {},
        metaData: [],
        query: sql,
        parameters: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Executa múltiplas queries em sequência
   */
  async executeBatch(
    queries: Array<{
      sql: string;
      parameters?: ParameterItem[];
      name?: string;
    }>,
    options: {
      stopOnError?: boolean;
      useTransaction?: boolean;
    } = {}
  ): Promise<SQLExecutionResult[]> {
    const { stopOnError = true, useTransaction = false } = options;
    const results: SQLExecutionResult[] = [];

    if (useTransaction) {
      try {
        // Iniciar transação (autoCommit = false)
        for (let i = 0; i < queries.length; i++) {
          const query = queries[i];
          const result = await this.execute(query.sql, query.parameters, { autoCommit: false });
          
          results.push({
            ...result,
            queryIndex: i,
            queryName: query.name,
          });

          if (!result.success && stopOnError) {
            await this.connection.rollback();
            break;
          }
        }

        // Commit se todas as queries foram bem-sucedidas
        const allSuccessful = results.every(r => r.success);
        if (allSuccessful) {
          await this.connection.commit();
        } else {
          await this.connection.rollback();
        }

      } catch (error) {
        await this.connection.rollback();
        throw error;
      }
    } else {
      // Executar sem transação
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        const result = await this.execute(query.sql, query.parameters);
        
        results.push({
          ...result,
          queryIndex: i,
          queryName: query.name,
        });

        if (!result.success && stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Valida query SQL
   */
  validateQuery(sql: string): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações básicas
    if (!sql || sql.trim().length === 0) {
      errors.push('Query SQL não pode estar vazia');
    }

    const trimmedSql = sql.trim().toUpperCase();

    // Verificar comandos perigosos em produção
    const dangerousPatterns = [
      /DROP\s+(TABLE|DATABASE|SCHEMA|USER)/i,
      /TRUNCATE\s+TABLE/i,
      /DELETE\s+FROM\s+\w+\s*$/i, // DELETE sem WHERE
      /UPDATE\s+\w+\s+SET\s+.*\s*$/i, // UPDATE sem WHERE
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        warnings.push(`Query contém padrão potencialmente perigoso: ${pattern.source}`);
      }
    }

    // Verificar sintaxe básica para SELECT
    if (trimmedSql.startsWith('SELECT')) {
      if (!trimmedSql.includes('FROM') && !trimmedSql.includes('DUAL')) {
        warnings.push('Query SELECT sem cláusula FROM');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      queryType: this.detectQueryType(sql),
    };
  }

  /**
   * Processa parâmetros para bind
   */
  private processParameters(
    parameters: ParameterItem[],
    sql: string
  ): {
    bindParameters: { [key: string]: any };
    processedQuery: string;
  } {
    const bindParameters: { [key: string]: any } = {};
    let processedQuery = sql;

    for (const param of parameters) {
      if (param.parseInStatement) {
        // Processar parâmetros IN (lista de valores)
        const values = param.value.toString().split(',').map(v => v.trim());
        const placeholders: string[] = [];
        
        values.forEach((val, index) => {
          const paramName = `${param.name}_${index}_${Date.now()}`;
          placeholders.push(`:${paramName}`);
          bindParameters[paramName] = {
            type: this.getOracleDataType(param.datatype),
            val: this.convertValue(val, param.datatype),
          };
        });

        const inClause = `(${placeholders.join(',')})`;
        processedQuery = processedQuery.replace(new RegExp(`:${param.name}\\b`, 'g'), inClause);
      } else {
        // Parâmetro normal
        bindParameters[param.name] = {
          type: this.getOracleDataType(param.datatype),
          val: this.convertValue(param.value, param.datatype),
        };
      }
    }

    return { bindParameters, processedQuery };
  }

  /**
   * Converte tipo de dados para OracleDB
   */
  private getOracleDataType(datatype: string): any {
    const typeMap = {
      [ORACLE_DATA_TYPES.VARCHAR2]: oracledb.STRING,
      [ORACLE_DATA_TYPES.NUMBER]: oracledb.NUMBER,
      [ORACLE_DATA_TYPES.DATE]: oracledb.DATE,
      [ORACLE_DATA_TYPES.CLOB]: oracledb.CLOB,
      [ORACLE_DATA_TYPES.BLOB]: oracledb.BLOB,
      [ORACLE_DATA_TYPES.CURSOR]: oracledb.CURSOR,
    };

    return typeMap[datatype.toUpperCase()] || oracledb.STRING;
  }

  /**
   * Converte valor para tipo apropriado
   */
  private convertValue(value: string | number, datatype: string): any {
    switch (datatype.toLowerCase()) {
      case 'number':
        return Number(value);
      case 'date':
        return new Date(value);
      default:
        return String(value);
    }
  }

  /**
   * Detecta tipo da query
   */
  private detectQueryType(sql: string): string {
    const trimmed = sql.trim().toUpperCase();
    
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('MERGE')) return 'MERGE';
    if (trimmed.startsWith('CREATE')) return 'CREATE';
    if (trimmed.startsWith('DROP')) return 'DROP';
    if (trimmed.startsWith('ALTER')) return 'ALTER';
    if (trimmed.startsWith('CALL')) return 'CALL';
    
    return 'UNKNOWN';
  }

  /**
   * Fecha executor
   */
  async close(): Promise<void> {
    // O SQLExecutor não fecha a conexão, apenas libera recursos
    // A conexão deve ser gerenciada externamente
  }
}

/**
 * Factory para diferentes tipos de executores SQL
 */
export class SQLExecutorFactory {
  /**
   * Executor básico
   */
  static createStandard(connection: Connection): OracleSQLExecutor {
    return new OracleSQLExecutor(connection);
  }

  /**
   * Executor para operações em lote
   */
  static createBatch(connection: Connection): OracleSQLExecutor {
    return new OracleSQLExecutor(connection, {
      autoCommit: false,
      fetchArraySize: 10000,
    });
  }

  /**
   * Executor para analytics
   */
  static createAnalytics(connection: Connection): OracleSQLExecutor {
    return new OracleSQLExecutor(connection, {
      fetchArraySize: 1000,
      maxRows: 0, // Sem limite
    });
  }

  /**
   * Executor read-only
   */
  static createReadOnly(connection: Connection): OracleSQLExecutor {
    return new OracleSQLExecutor(connection, {
      autoCommit: false, // Read-only não precisa commit
    });
  }
}
