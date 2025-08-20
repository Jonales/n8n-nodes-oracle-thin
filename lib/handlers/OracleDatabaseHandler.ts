import { INodeExecutionData } from 'n8n-workflow';
import oracledb from 'oracledb';
import { BaseOracleHandler } from './BaseOracleHandler';
import { randomUUID } from 'crypto';

interface ParameterItem {
  name: string;
  value: string | number;
  datatype: string;
  parseInStatement: boolean;
}

/**
 * Handler para Oracle Database com suporte a parametrização avançada
 * Suporte para queries SQL com parâmetros nomeados e IN statements
 */
export class OracleDatabaseHandler extends BaseOracleHandler {
  
  /**
   * Executar query Oracle com parametrização
   */
  async execute(): Promise<INodeExecutionData[]> {
    return this.executeWithConnection(async (connection) => {
      // Obter e validar query
      const query = this.getParameter<string>('query', 0);
      this.validateQuery(query);

      // Obter parâmetros do usuário
      const parameterList = this.getParameterList();
      
      // Processar parâmetros
      const { bindParameters, processedQuery } = this.processParameters(parameterList, query);

      this.debug('Executando query', { 
        query: processedQuery.substring(0, 200) + '...',
        parameterCount: Object.keys(bindParameters).length 
      });

      // Executar query
      const result = await connection.execute(processedQuery, bindParameters, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
      });

      return this.convertToN8nFormat(result.rows as any[]);
    });
  }

  /**
   * Validar query SQL
   */
  private validateQuery(query: string): void {
    if (!query || query.trim() === '') {
      throw new Error('SQL query não pode estar vazia');
    }
  }

  /**
   * Obter lista de parâmetros do node
   */
  private getParameterList(): ParameterItem[] {
    const params = this.getParameter('params', 0, {}) as any;
    return params.values || [];
  }

  /**
   * Processar todos os parâmetros e construir bind parameters
   */
  private processParameters(parameters: ParameterItem[], query: string): {
    bindParameters: { [key: string]: oracledb.BindParameter };
    processedQuery: string;
  } {
    this.validateParameters(parameters);
    
    const bindParameters: { [key: string]: oracledb.BindParameter } = {};
    let processedQuery = query;

    for (const param of parameters) {
      if (param.parseInStatement) {
        processedQuery = this.processInStatementParameter(param, bindParameters, processedQuery);
      } else {
        this.processNormalParameter(param, bindParameters);
      }
    }

    return { bindParameters, processedQuery };
  }

  /**
   * Validar parâmetros fornecidos
   */
  private validateParameters(parameters: ParameterItem[]): void {
    for (const param of parameters) {
      if (!param.name || param.name.trim() === '') {
        throw new Error('Nome do parâmetro não pode estar vazio');
      }

      if (param.parseInStatement && (!param.value || param.value.toString().trim() === '')) {
        throw new Error(`Parâmetro '${param.name}' marcado para IN statement mas não possui valores`);
      }
    }
  }

  /**
   * Processar parâmetro normal (não IN statement)
   */
  private processNormalParameter(item: ParameterItem, bindParameters: { [key: string]: oracledb.BindParameter }): void {
    bindParameters[item.name] = {
      type: this.getOracleDataType(item.datatype),
      val: this.convertValue(item.value, item.datatype),
    };
  }

  /**
   * Processar parâmetro para IN statement
   */
  private processInStatementParameter(
    item: ParameterItem,
    bindParameters: { [key: string]: oracledb.BindParameter },
    query: string
  ): string {
    const valueList = item.value
      .toString()
      .split(',')
      .map(v => v.trim());

    if (valueList.length === 0) {
      throw new Error(`Parâmetro '${item.name}' para IN statement não pode estar vazio`);
    }

    const placeholders: string[] = [];
    const datatype = this.getOracleDataType(item.datatype);

    valueList.forEach((val, index) => {
      const paramName = `${item.name}_${index}_${this.generateUniqueId()}`;
      placeholders.push(`:${paramName}`);
      bindParameters[paramName] = {
        type: datatype,
        val: this.convertValue(val, item.datatype),
      };
    });

    const inClause = `(${placeholders.join(',')})`;
    return query.replaceAll(`:${item.name}`, inClause);
  }

  /**
   * Converter tipo de dados para formato Oracle
   */
  private getOracleDataType(datatype: string): oracledb.DbType {
    return datatype === 'number' ? oracledb.NUMBER : oracledb.STRING;
  }

  /**
   * Converter valor para tipo apropriado
   */
  private convertValue(value: string | number, datatype: string): string | number {
    return datatype === 'number' ? Number(value) : String(value);
  }

  /**
   * Gerar ID único para parâmetros
   */
  private generateUniqueId(): string {
    try {
      return randomUUID().replaceAll('-', '_');
    } catch {
      // Fallback para ambientes sem randomUUID
      return (
        Math.random().toString(36).substring(2, 15) + 
        Math.random().toString(36).substring(2, 15)
      );
    }
  }
}