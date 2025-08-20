/**
 * Executor PL/SQL Oracle - Refatorado
 * Localização: lib/core/operations/plsql-executor.ts
 */

import oracledb, { Connection } from 'oracledb';
import { 
  PLSQLExecutor,
  PLSQLExecutionOptions,
  PLSQLExecutionResult,
  PLSQLBlock,
  PLSQLCompilationError,
  PLSQL_DEFAULTS,
  ORACLE_DATA_TYPES
} from '@shared';

export class OraclePLSQLExecutor implements PLSQLExecutor {
  private connection: Connection;
  private debugMode: boolean;

  constructor(connection: Connection, debugMode = false) {
    this.connection = connection;
    this.debugMode = debugMode;
  }

  /**
   * Executa bloco PL/SQL anônimo
   */
  async executeAnonymousBlock(
    plsqlBlock: string,
    binds: { [key: string]: any } = {},
    options: PLSQLExecutionOptions = {}
  ): Promise<PLSQLExecutionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Validar sintaxe do bloco
      this.validatePLSQLBlock(plsqlBlock);

      // Configurar opções
      const execOptions = {
        autoCommit: options.autoCommit ?? true,
        outFormat: options.outFormat || oracledb.OUT_FORMAT_OBJECT,
        fetchArraySize: options.fetchArraySize || PLSQL_DEFAULTS.FETCH_ARRAY_SIZE,
        maxRows: options.maxRows || 0,
        ...options,
      };

      // Detectar e configurar parâmetros de saída
      const detectedOutParams = this.detectOutputParameters(plsqlBlock);
      const finalBinds = { ...binds };

      for (const param of detectedOutParams) {
        if (!(param in finalBinds)) {
          finalBinds[param] = {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: PLSQL_DEFAULTS.MAX_SIZE,
          };
        }
      }

      if (this.debugMode) {
        console.log('Executando PL/SQL:', plsqlBlock.substring(0, 200) + '...');
        console.log('Parâmetros:', Object.keys(finalBinds));
      }

      // Configurar timeout se especificado
      if (options.timeout) {
        this.setExecutionTimeout(options.timeout);
      }

      // Executar bloco
      const result = await this.connection.execute(plsqlBlock, finalBinds, execOptions);
      const executionTime = Date.now() - startTime;

      // Processar resultados implícitos
      const implicitResults = await this.processImplicitResults(result.implicitResults);

      return {
        success: true,
        executionTime,
        outBinds: result.outBinds || {},
        implicitResults,
        rowsAffected: result.rowsAffected,
        warnings,
        compilationErrors: [],
      };

    } catch (error: unknown) {
      const executionTime = Date.now() - startTime;
      const compilationErrors = await this.checkCompilationErrors();

      return {
        success: false,
        executionTime,
        outBinds: {},
        implicitResults: [],
        warnings: [error instanceof Error ? error.message : String(error)],
        compilationErrors,
      };
    }
  }

  /**
   * Executa stored procedure
   */
  async executeProcedure(
    procedureName: string,
    parameters: { [key: string]: any } = {},
    options: PLSQLExecutionOptions = {}
  ): Promise<PLSQLExecutionResult> {
    try {
      // Obter metadados da procedure
      const procMetadata = await this.getProcedureMetadata(procedureName);
      
      // Construir chamada
      const paramList = Object.keys(parameters)
        .map(param => `:${param}`)
        .join(', ');
      
      const plsqlCall = `BEGIN ${procedureName}(${paramList}); END;`;

      // Configurar binds baseado nos metadados
      const configuredBinds = this.configureBindsFromMetadata(parameters, procMetadata);

      return this.executeAnonymousBlock(plsqlCall, configuredBinds, options);
    } catch (error: unknown) {
      throw new Error(
        `Erro ao executar procedure '${procedureName}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Executa function
   */
  async executeFunction(
    functionName: string,
    parameters: { [key: string]: any } = {},
    returnType = 'VARCHAR2',
    options: PLSQLExecutionOptions = {}
  ): Promise<PLSQLExecutionResult> {
    try {
      // Construir chamada da function
      const paramList = Object.keys(parameters)
        .map(param => `:${param}`)
        .join(', ');
      
      const plsqlCall = `BEGIN :result := ${functionName}(${paramList}); END;`;

      // Configurar bind para valor de retorno
      const configuredBinds = {
        result: {
          dir: oracledb.BIND_OUT,
          type: this.getOracleType(returnType),
          maxSize: PLSQL_DEFAULTS.MAX_SIZE,
        },
        ...parameters,
      };

      return this.executeAnonymousBlock(plsqlCall, configuredBinds, options);
    } catch (error: unknown) {
      throw new Error(
        `Erro ao executar function '${functionName}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Executa múltiplos blocos em batch
   */
  async executeBatch(
    blocks: PLSQLBlock[],
    options: PLSQLExecutionOptions & { stopOnError?: boolean } = {}
  ): Promise<PLSQLExecutionResult[]> {
    const results: PLSQLExecutionResult[] = [];
    const { stopOnError = true } = options;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      try {
        let result: PLSQLExecutionResult;

        switch (block.type) {
          case 'anonymous':
            result = await this.executeAnonymousBlock(block.sql, block.inputParams, options);
            break;
          case 'procedure':
            result = await this.executeProcedure(block.name!, block.inputParams, options);
            break;
          case 'function':
            result = await this.executeFunction(
              block.name!,
              block.inputParams,
              block.returnType,
              options
            );
            break;
          default:
            throw new Error(`Tipo de bloco não suportado: ${block.type}`);
        }

        results.push(result);

        if (!result.success && stopOnError) {
          console.error(`Erro no bloco ${i + 1}, parando execução`);
          break;
        }
      } catch (error: unknown) {
        const errorResult: PLSQLExecutionResult = {
          success: false,
          executionTime: 0,
          outBinds: {},
          implicitResults: [],
          warnings: [error instanceof Error ? error.message : String(error)],
          compilationErrors: [],
        };

        results.push(errorResult);

        if (stopOnError) {
          console.error(`Erro no bloco ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
          break;
        }
      }
    }

    return results;
  }

  /**
   * Executa package procedure/function
   */
  async executePackageItem(
    packageName: string,
    itemName: string,
    itemType: 'procedure' | 'function',
    parameters: { [key: string]: any } = {},
    returnType?: string,
    options: PLSQLExecutionOptions = {}
  ): Promise<PLSQLExecutionResult> {
    const fullName = `${packageName}.${itemName}`;
    
    if (itemType === 'procedure') {
      return this.executeProcedure(fullName, parameters, options);
    } else {
      return this.executeFunction(fullName, parameters, returnType || 'VARCHAR2', options);
    }
  }

  /**
   * Valida sintaxe básica do bloco PL/SQL
   */
  private validatePLSQLBlock(plsqlBlock: string): void {
    const trimmed = plsqlBlock.trim().toUpperCase();
    
    if (!trimmed.startsWith('BEGIN') && !trimmed.startsWith('DECLARE')) {
      throw new Error('Bloco PL/SQL deve começar com BEGIN ou DECLARE');
    }

    if (!trimmed.endsWith('END;') && !trimmed.endsWith('END')) {
      throw new Error('Bloco PL/SQL deve terminar com END;');
    }

    // Verificar balanceamento de BEGIN/END
    const beginCount = (plsqlBlock.match(/\\bBEGIN\\b/gi) || []).length;
    const endCount = (plsqlBlock.match(/\\bEND\\b/gi) || []).length;
    
    if (beginCount !== endCount) {
      throw new Error(`Desbalanceamento de BEGIN/END: ${beginCount} BEGIN(s), ${endCount} END(s)`);
    }
  }

  /**
   * Detecta parâmetros de saída no PL/SQL
   */
  private detectOutputParameters(plsqlBlock: string): string[] {
    const outParams: string[] = [];
    
    // Detectar parâmetros com :=
    const assignmentRegex = /:(\w+)\\s*:=/g;
    let match;
    
    while ((match = assignmentRegex.exec(plsqlBlock)) !== null) {
      outParams.push(match);
    }

    // Detectar parâmetros OUT
    const outParamRegex = /:(\w+)\\s+OUT/gi;
    while ((match = outParamRegex.exec(plsqlBlock)) !== null) {
      outParams.push(match);
    }

    return [...new Set(outParams)];
  }

  /**
   * Processa resultados implícitos (cursors)
   */
  private async processImplicitResults(implicitResults?: any[]): Promise<any[][]> {
    if (!implicitResults || implicitResults.length === 0) {
      return [];
    }

    const results: any[][] = [];
    
    for (const resultSet of implicitResults) {
      const rows: any[] = [];
      let row;
      
      while ((row = await resultSet.getRow())) {
        rows.push(row);
      }
      
      await resultSet.close();
      results.push(rows);
    }

    return results;
  }

  /**
   * Verifica erros de compilação
   */
  private async checkCompilationErrors(): Promise<PLSQLCompilationError[]> {
    try {
      const sql = `
        SELECT line, position, text, attribute, message_number
        FROM user_errors
        WHERE name = 'ANONYMOUS_BLOCK'
        ORDER BY sequence
      `;

      const result = await this.connection.execute(sql, {}, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      return (result.rows as any[]).map(row => ({
        line: row.LINE,
        position: row.POSITION,
        text: row.TEXT,
        attribute: row.ATTRIBUTE,
        messageNumber: row.MESSAGE_NUMBER,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtém metadados de procedure
   */
  private async getProcedureMetadata(procedureName: string): Promise<any[]> {
    const sql = `
      SELECT argument_name, data_type, in_out, position
      FROM user_arguments
      WHERE object_name = UPPER(:procedureName)
      ORDER BY position
    `;

    const result = await this.connection.execute(
      sql,
      { procedureName: procedureName.split('.').pop() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows as any[];
  }

  /**
   * Configura binds baseado em metadados
   */
  private configureBindsFromMetadata(
    parameters: { [key: string]: any },
    metadata: any[]
  ): { [key: string]: any } {
    const configuredBinds: { [key: string]: any } = {};

    for (const param of metadata) {
      const paramName = param.ARGUMENT_NAME?.toLowerCase();
      if (!paramName) continue;

      if (param.IN_OUT === 'OUT' || param.IN_OUT === 'IN OUT') {
        configuredBinds[paramName] = {
          dir: param.IN_OUT === 'OUT' ? oracledb.BIND_OUT : oracledb.BIND_INOUT,
          type: this.getOracleType(param.DATA_TYPE),
          maxSize: PLSQL_DEFAULTS.MAX_SIZE,
          val: parameters[paramName],
        };
      } else {
        configuredBinds[paramName] = parameters[paramName];
      }
    }

    return configuredBinds;
  }

  /**
   * Mapeia tipos Oracle para oracledb
   */
  private getOracleType(dataType: string): any {
    const typeMap = {
      VARCHAR2: oracledb.STRING,
      CHAR: oracledb.STRING,
      NVARCHAR2: oracledb.STRING,
      NCHAR: oracledb.STRING,
      NUMBER: oracledb.NUMBER,
      BINARY_INTEGER: oracledb.NUMBER,
      PLS_INTEGER: oracledb.NUMBER,
      DATE: oracledb.DATE,
      TIMESTAMP: oracledb.DATE,
      CLOB: oracledb.CLOB,
      BLOB: oracledb.BLOB,
      CURSOR: oracledb.CURSOR,
    };

    return typeMap[dataType.toUpperCase() as keyof typeof typeMap] || oracledb.STRING;
  }

  /**
   * Configura timeout de execução
   */
  private setExecutionTimeout(timeoutSeconds: number): void {
    setTimeout(() => {
      console.warn(`Execução PL/SQL excedeu timeout de ${timeoutSeconds}s`);
    }, timeoutSeconds * 1000);
  }

  /**
   * Habilita/desabilita debug
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

/**
 * Factory para diferentes tipos de executores PL/SQL
 */
export class PLSQLExecutorFactory {
  /**
   * Executor para desenvolvimento
   */
  static createDevelopment(connection: Connection): OraclePLSQLExecutor {
    return new OraclePLSQLExecutor(connection, true);
  }

  /**
   * Executor para produção
   */
  static createProduction(connection: Connection): OraclePLSQLExecutor {
    return new OraclePLSQLExecutor(connection, false);
  }

  /**
   * Executor para batch processing
   */
  static createBatch(connection: Connection): OraclePLSQLExecutor {
    return new OraclePLSQLExecutor(connection, false);
  }
}
