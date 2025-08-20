import { INodeExecutionData } from 'n8n-workflow';
import oracledb, { Connection } from 'oracledb';
import { BaseOracleHandler } from './BaseOracleHandler';
import { AQOperations } from './aqOperations';
import { BulkOperationsFactory } from './bulkOperations';
import { OracleConnectionPool } from './connectionPool';
import { PLSQLExecutorFactory } from './plsqlExecutor';
import { TransactionManagerFactory } from './transactionManager';

interface ParameterDefinition {
  name: string;
  value: string | number;
  datatype: string;
}

/**
 * Handler para Oracle Database Advanced com recursos empresariais
 * Suporte para PL/SQL, bulk operations, transações, AQ e connection pooling
 */
export class OracleAdvancedHandler extends BaseOracleHandler {

  async execute(): Promise<INodeExecutionData[]> {
    const operationType = this.getParameter<string>('operationType', 0);
    const connectionPoolType = this.getParameter<string>('connectionPool', 0, 'standard');

    // Configurar pool baseado no tipo
    const poolConfig = this.getPoolConfig(connectionPoolType);

    // Executar operação baseada no tipo
    switch (operationType) {
      case 'query':
        return this.executeQuery(poolConfig);
      case 'plsql':
        return this.executePLSQL(poolConfig);
      case 'procedure':
        return this.executeProcedure(poolConfig);
      case 'function':
        return this.executeFunction(poolConfig);
      case 'bulk':
        return this.executeBulkOperations(poolConfig);
      case 'transaction':
        return this.executeTransaction(poolConfig);
      case 'queue':
        return this.executeAQOperations(poolConfig);
      default:
        throw new Error(`Tipo de operação não suportado: ${operationType}`);
    }
  }

  /**
   * Executar query SQL simples
   */
  private async executeQuery(poolConfig: any): Promise<INodeExecutionData[]> {
    return this.executeWithConnection(async (connection) => {
      const statement = this.getParameter<string>('statement', 0);
      const bindParameters = this.processParameters();

      const result = await connection.execute(statement, bindParameters, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
      });

      return this.convertToN8nFormat(result.rows as any[]);
    }, poolConfig);
  }

  /**
   * Executar bloco PL/SQL
   */
  private async executePLSQL(poolConfig: any): Promise<INodeExecutionData[]> {
    return this.executeWithConnection(async (connection) => {
      const statement = this.getParameter<string>('statement', 0);
      const bindParameters = this.processParameters();

      const executor = PLSQLExecutorFactory.createProductionExecutor(connection);
      const result = await executor.executeAnonymousBlock(statement, bindParameters);

      return this.convertToN8nFormat([result]);
    }, poolConfig);
  }

  /**
   * Executar stored procedure
   */
  private async executeProcedure(poolConfig: any): Promise<INodeExecutionData[]> {
    return this.executeWithConnection(async (connection) => {
      const procedureName = this.getParameter<string>('procedureName', 0);
      const bindParameters = this.processParameters();

      const executor = PLSQLExecutorFactory.createProductionExecutor(connection);
      const result = await executor.executeProcedure(procedureName, bindParameters);

      return this.convertToN8nFormat([result]);
    }, poolConfig);
  }

  /**
   * Executar function
   */
  private async executeFunction(poolConfig: any): Promise<INodeExecutionData[]> {
    return this.executeWithConnection(async (connection) => {
      const functionName = this.getParameter<string>('functionName', 0);
      const returnType = this.getParameter<string>('returnType', 0, 'VARCHAR2');
      const bindParameters = this.processParameters();

      const executor = PLSQLExecutorFactory.createProductionExecutor(connection);
      const result = await executor.executeFunction(functionName, bindParameters, returnType);

      return this.convertToN8nFormat([result]);
    }, poolConfig);
  }

  /**
   * Executar operações em massa
   */
  private async executeBulkOperations(poolConfig: any): Promise<INodeExecutionData[]> {
    return this.executeWithConnection(async (connection) => {
      const operation = this.getParameter<string>('bulkOperation', 0, 'insert');
      const tableName = this.getParameter<string>('tableName', 0);
      const inputData = this.getInputData();
      const data = inputData.map(item => item.json);

      const bulkOps = BulkOperationsFactory.createHighVolumeOperations(connection);

      let result;
      switch (operation) {
        case 'insert':
          result = await bulkOps.bulkInsert(tableName, data, {
            batchSize: this.getParameter<number>('batchSize', 0, 5000),
            continueOnError: this.getParameter<boolean>('continueOnError', 0, true),
            autoCommit: true,
          });
          break;
        case 'update':
          const whereColumns = this.getParameter<string[]>('whereColumns', 0, []);
          result = await bulkOps.bulkUpdate(tableName, data, {
            whereColumns,
            batchSize: this.getParameter<number>('batchSize', 0, 5000),
            continueOnError: this.getParameter<boolean>('continueOnError', 0, true),
            autoCommit: true,
          });
          break;
        case 'delete':
          const deleteWhereColumns = this.getParameter<string[]>('whereColumns', 0, []);
          result = await bulkOps.bulkDelete(tableName, data, {
            whereColumns: deleteWhereColumns,
            batchSize: this.getParameter<number>('batchSize', 0, 5000),
            continueOnError: this.getParameter<boolean>('continueOnError', 0, true),
            autoCommit: true,
          });
          break;
        case 'upsert':
          const keyColumns = this.getParameter<string[]>('keyColumns', 0, []);
          result = await bulkOps.bulkUpsert(tableName, data, keyColumns, {
            batchSize: this.getParameter<number>('batchSize', 0, 5000),
            autoCommit: true,
          });
          break;
        default:
          throw new Error(`Operação bulk não suportada: ${operation}`);
      }

      return this.convertToN8nFormat([result]);
    }, poolConfig);
  }

  /**
   * Executar bloco de transação
   */
  private async executeTransaction(poolConfig: any): Promise<INodeExecutionData[]> {
    return this.executeWithConnection(async (connection) => {
      const statements = this.getParameter<string>('statement', 0);
      const txManager = TransactionManagerFactory.createBatchManager(connection);

      await txManager.beginTransaction();

      try {
        const operations = statements
          .split(';')
          .filter(s => s.trim())
          .map(sql => ({
            sql: sql.trim(),
            binds: this.processParameters(),
          }));

        const results = await txManager.executeBatch(operations, {
          savepointPerOperation: this.getParameter<boolean>('savepointPerOperation', 0, true),
          stopOnError: this.getParameter<boolean>('stopOnError', 0, true),
        });

        await txManager.commit();
        return this.convertToN8nFormat([{ success: true, results }]);
      } catch (error) {
        await txManager.rollback();
        throw error;
      }
    }, poolConfig);
  }

  /**
   * Executar operações Oracle AQ
   */
  private async executeAQOperations(poolConfig: any): Promise<INodeExecutionData[]> {
    return this.executeWithConnection(async (connection) => {
      const operation = this.getParameter<string>('queueOperation', 0, 'enqueue');
      const queueName = this.getParameter<string>('queueName', 0, 'DEFAULT_QUEUE');
      
      const aqOps = new AQOperations(connection);

      let result;
      switch (operation) {
        case 'enqueue':
          const message = this.getParameter<any>('message', 0);
          result = await aqOps.enqueueMessage(queueName, { payload: message });
          break;
        case 'dequeue':
          result = await aqOps.dequeueMessage(queueName, {
            waitTime: this.getParameter<number>('waitTime', 0, 5),
          });
          break;
        case 'getInfo':
          result = await aqOps.getQueueInfo(queueName);
          break;
        case 'listQueues':
          const queues = await aqOps.listQueues();
          result = { queues };
          break;
        default:
          throw new Error(`Operação AQ não suportada: ${operation}`);
      }

      return this.convertToN8nFormat([result]);
    }, poolConfig);
  }

  /**
   * Processar parâmetros do node
   */
  private processParameters(): { [key: string]: any } {
    const parameterList = this.getParameter('params', 0, { values: [] }) as { values: ParameterDefinition[] };
    const bindParameters: { [key: string]: any } = {};

    for (const param of parameterList.values) {
      let value: any = param.value;
      
      switch (param.datatype) {
        case 'number':
          value = Number(param.value);
          break;
        case 'date':
          value = new Date(param.value);
          break;
        case 'out':
          value = {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 4000,
          };
          break;
        case 'clob':
          value = { type: oracledb.CLOB, val: param.value };
          break;
        default:
          value = String(param.value);
      }

      bindParameters[param.name] = value;
    }

    return bindParameters;
  }

  /**
   * Obter configuração do pool baseada no tipo
   */
  private getPoolConfig(poolType: string): any {
    switch (poolType) {
      case 'highvolume':
        return OracleConnectionPool.getHighVolumeConfig();
      case 'oltp':
        return OracleConnectionPool.getOLTPConfig();
      case 'analytics':
        return OracleConnectionPool.getAnalyticsConfig();
      case 'single':
        return null; // Usar conexão direta
      default:
        return {}; // Configuração padrão
    }
  }
}