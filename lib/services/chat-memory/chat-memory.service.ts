/**
 * Chat Memory Service - Refatorado
 * Localização: lib/services/chat-memory/chat-memory.service.ts
 */

import oracledb, { Connection } from 'oracledb';
import { INodeExecutionData } from 'n8n-workflow';
import {
  ChatMemoryService as IChatMemoryService,
  ChatMemoryOptions,
  ChatMemoryResult,
  ServiceResult,
  TABLE_DEFAULTS,
  SQL_TEMPLATES,
  ORACLE_DATA_TYPES
} from '@shared';

export interface ChatMemorySetupOptions {
  tableName: string;
  createIndexes?: boolean;
  enablePartitioning?: boolean;
  retentionDays?: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  memoryType: string;
  message: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class ChatMemoryService implements IChatMemoryService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Configura tabela de chat memory
   */
  async setupTable(
    tableName: string,
    options: ChatMemorySetupOptions = {}
  ): Promise<ServiceResult<{ tableName: string; created: boolean }>> {
    try {
      const {
        createIndexes = true,
        enablePartitioning = false,
        retentionDays
      } = options;

      // Criar tabela principal
      const createTableSQL = this.buildCreateTableSQL(tableName, {
        enablePartitioning,
        retentionDays
      });

      await this.connection.execute(createTableSQL);

      // Criar índices se solicitado
      if (createIndexes) {
        await this.createIndexes(tableName);
      }

      // Criar política de retenção se especificada
      if (retentionDays) {
        await this.createRetentionPolicy(tableName, retentionDays);
      }

      await this.connection.commit();

      return {
        success: true,
        data: {
          tableName,
          created: true
        },
        message: `Chat Memory table '${tableName}' criada com sucesso`
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Erro ao criar tabela '${tableName}'`
      };
    }
  }

  /**
   * Adiciona mensagem ao chat memory
   */
  async addMessage(
    sessionId: string,
    memoryType: string,
    tableName: string,
    message: string,
    options: {
      metadata?: Record<string, any>;
      messageId?: string;
    } = {}
  ): Promise<ServiceResult<ChatMessage>> {
    try {
      const messageId = options.messageId || this.generateMessageId(sessionId);
      const metadata = options.metadata || {};

      const insertSQL = SQL_TEMPLATES.CHAT_MEMORY.INSERT_MESSAGE;
      const bindParams = {
        id: messageId,
        session_id: sessionId,
        memory_type: memoryType,
        message,
        metadata: JSON.stringify(metadata)
      };

      // Executar insert com template dinâmico
      const finalSQL = insertSQL.replace('${tableName}', tableName);
      const result = await this.connection.execute(finalSQL, bindParams, {
        autoCommit: true
      });

      const chatMessage: ChatMessage = {
        id: messageId,
        sessionId,
        memoryType,
        message,
        createdAt: new Date(),
        metadata
      };

      return {
        success: true,
        data: chatMessage,
        message: 'Mensagem adicionada com sucesso',
        rowsAffected: result.rowsAffected
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao adicionar mensagem'
      };
    }
  }

  /**
   * Obtém mensagens de uma sessão
   */
  async getMessages(
    sessionId: string,
    tableName: string,
    options: {
      limit?: number;
      offset?: number;
      memoryType?: string;
      orderBy?: 'ASC' | 'DESC';
    } = {}
  ): Promise<ServiceResult<ChatMessage[]>> {
    try {
      const {
        limit = 100,
        offset = 0,
        memoryType,
        orderBy = 'ASC'
      } = options;

      let selectSQL = SQL_TEMPLATES.CHAT_MEMORY.GET_MESSAGES
        .replace('${tableName}', tableName)
        .replace('${orderBy}', orderBy);

      const bindParams: any = {
        session_id: sessionId,
        row_limit: limit,
        row_offset: offset
      };

      // Adicionar filtro por tipo de memória se especificado
      if (memoryType) {
        selectSQL = selectSQL.replace(
          'WHERE session_id = :session_id',
          'WHERE session_id = :session_id AND memory_type = :memory_type'
        );
        bindParams.memory_type = memoryType;
      }

      const result = await this.connection.execute(selectSQL, bindParams, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });

      const messages: ChatMessage[] = (result.rows as any[]).map(row => ({
        id: row.ID,
        sessionId: row.SESSION_ID,
        memoryType: row.MEMORY_TYPE,
        message: row.MESSAGE,
        createdAt: row.CREATED_AT,
        metadata: row.METADATA ? JSON.parse(row.METADATA) : {}
      }));

      return {
        success: true,
        data: messages,
        message: `${messages.length} mensagens encontradas`
      };

    } catch (error: unknown) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao buscar mensagens'
      };
    }
  }

  /**
   * Limpa memória de uma sessão
   */
  async clearMemory(
    sessionId: string,
    tableName: string,
    options: {
      memoryType?: string;
      beforeDate?: Date;
    } = {}
  ): Promise<ServiceResult<{ deletedCount: number }>> {
    try {
      const { memoryType, beforeDate } = options;

      let deleteSQL = SQL_TEMPLATES.CHAT_MEMORY.CLEAR_MEMORY
        .replace('${tableName}', tableName);

      const bindParams: any = {
        session_id: sessionId
      };

      // Construir WHERE clause dinâmica
      const whereConditions = ['session_id = :session_id'];

      if (memoryType) {
        whereConditions.push('memory_type = :memory_type');
        bindParams.memory_type = memoryType;
      }

      if (beforeDate) {
        whereConditions.push('created_at < :before_date');
        bindParams.before_date = beforeDate;
      }

      deleteSQL = deleteSQL.replace(
        'WHERE session_id = :session_id',
        `WHERE ${whereConditions.join(' AND ')}`
      );

      const result = await this.connection.execute(deleteSQL, bindParams, {
        autoCommit: true
      });

      return {
        success: true,
        data: {
          deletedCount: result.rowsAffected || 0
        },
        message: `${result.rowsAffected || 0} mensagens removidas`
      };

    } catch (error: unknown) {
      return {
        success: false,
        data: { deletedCount: 0 },
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao limpar memória'
      };
    }
  }

  /**
   * Obtém resumo da sessão
   */
  async getSummary(
    sessionId: string,
    tableName: string,
    options: {
      memoryType?: string;
      includeStats?: boolean;
    } = {}
  ): Promise<ServiceResult<{
    sessionId: string;
    messageCount: number;
    lastMessage: Date | null;
    memoryTypes: string[];
    stats?: any;
  }>> {
    try {
      const { memoryType, includeStats = false } = options;

      let summarySQL = SQL_TEMPLATES.CHAT_MEMORY.GET_SUMMARY
        .replace('${tableName}', tableName);

      const bindParams: any = {
        session_id: sessionId
      };

      if (memoryType) {
        summarySQL = summarySQL.replace(
          'WHERE session_id = :session_id',
          'WHERE session_id = :session_id AND memory_type = :memory_type'
        );
        bindParams.memory_type = memoryType;
      }

      const result = await this.connection.execute(summarySQL, bindParams, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });

      const row = result.rows?. as any;

      let stats = undefined;
      if (includeStats && row) {
        stats = await this.getDetailedStats(sessionId, tableName);
      }

      const summary = {
        sessionId,
        messageCount: row?.MESSAGE_COUNT || 0,
        lastMessage: row?.LAST_MESSAGE || null,
        memoryTypes: row?.MEMORY_TYPES?.split(',') || [],
        ...(stats && { stats })
      };

      return {
        success: true,
        data: summary,
        message: 'Resumo da sessão obtido com sucesso'
      };

    } catch (error: unknown) {
      return {
        success: false,
        data: {
          sessionId,
          messageCount: 0,
          lastMessage: null,
          memoryTypes: []
        },
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao obter resumo da sessão'
      };
    }
  }

  /**
   * Busca mensagens por conteúdo
   */
  async searchMessages(
    searchTerm: string,
    tableName: string,
    options: {
      sessionId?: string;
      memoryType?: string;
      limit?: number;
      caseSensitive?: boolean;
    } = {}
  ): Promise<ServiceResult<ChatMessage[]>> {
    try {
      const {
        sessionId,
        memoryType,
        limit = 50,
        caseSensitive = false
      } = options;

      const searchSQL = this.buildSearchSQL(tableName, {
        sessionId: !!sessionId,
        memoryType: !!memoryType,
        caseSensitive
      });

      const bindParams: any = {
        search_term: caseSensitive ? searchTerm : searchTerm.toLowerCase(),
        row_limit: limit
      };

      if (sessionId) {
        bindParams.session_id = sessionId;
      }

      if (memoryType) {
        bindParams.memory_type = memoryType;
      }

      const result = await this.connection.execute(searchSQL, bindParams, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });

      const messages: ChatMessage[] = (result.rows as any[]).map(row => ({
        id: row.ID,
        sessionId: row.SESSION_ID,
        memoryType: row.MEMORY_TYPE,
        message: row.MESSAGE,
        createdAt: row.CREATED_AT,
        metadata: row.METADATA ? JSON.parse(row.METADATA) : {}
      }));

      return {
        success: true,
        data: messages,
        message: `${messages.length} mensagens encontradas`
      };

    } catch (error: unknown) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao buscar mensagens'
      };
    }
  }

  /**
   * Constrói SQL de criação de tabela
   */
  private buildCreateTableSQL(
    tableName: string,
    options: {
      enablePartitioning?: boolean;
      retentionDays?: number;
    }
  ): string {
    let createSQL = `
      CREATE TABLE ${tableName} (
        id VARCHAR2(64) PRIMARY KEY,
        session_id VARCHAR2(64) NOT NULL,
        memory_type VARCHAR2(50) NOT NULL,
        message CLOB NOT NULL,
        metadata CLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    if (options.enablePartitioning) {
      createSQL += `
        PARTITION BY RANGE (created_at) 
        INTERVAL (INTERVAL '1' MONTH)
        (PARTITION p0 VALUES LESS THAN (DATE '2024-01-01'))
      `;
    }

    return createSQL;
  }

  /**
   * Cria índices otimizados
   */
  private async createIndexes(tableName: string): Promise<void> {
    const indexes = [
      `CREATE INDEX idx_${tableName}_session ON ${tableName}(session_id)`,
      `CREATE INDEX idx_${tableName}_type ON ${tableName}(memory_type)`,
      `CREATE INDEX idx_${tableName}_created ON ${tableName}(created_at)`,
      `CREATE INDEX idx_${tableName}_composite ON ${tableName}(session_id, memory_type, created_at)`
    ];

    for (const indexSQL of indexes) {
      try {
        await this.connection.execute(indexSQL);
      } catch (error) {
        // Ignorar erro se índice já existir
        if (!(error as any).message?.includes('ORA-00955')) {
          throw error;
        }
      }
    }
  }

  /**
   * Cria política de retenção
   */
  private async createRetentionPolicy(
    tableName: string,
    retentionDays: number
  ): Promise<void> {
    const policySQL = `
      CREATE OR REPLACE PROCEDURE cleanup_${tableName}_old_data AS
      BEGIN
        DELETE FROM ${tableName} 
        WHERE created_at < SYSDATE - ${retentionDays};
        COMMIT;
      END;
    `;

    await this.connection.execute(policySQL);
  }

  /**
   * Constrói SQL de busca
   */
  private buildSearchSQL(
    tableName: string,
    options: {
      sessionId: boolean;
      memoryType: boolean;
      caseSensitive: boolean;
    }
  ): string {
    const whereConditions = [];
    const searchCondition = options.caseSensitive
      ? 'message LIKE \'%\' || :search_term || \'%\''
      : 'LOWER(message) LIKE \'%\' || :search_term || \'%\'';

    whereConditions.push(searchCondition);

    if (options.sessionId) {
      whereConditions.push('session_id = :session_id');
    }

    if (options.memoryType) {
      whereConditions.push('memory_type = :memory_type');
    }

    return `
      SELECT id, session_id, memory_type, message, metadata, created_at
      FROM ${tableName}
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
      FETCH FIRST :row_limit ROWS ONLY
    `;
  }

  /**
   * Obtém estatísticas detalhadas
   */
  private async getDetailedStats(
    sessionId: string,
    tableName: string
  ): Promise<any> {
    const statsSQL = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT memory_type) as unique_memory_types,
        MIN(created_at) as first_message,
        MAX(created_at) as last_message,
        AVG(LENGTH(message)) as avg_message_length,
        MAX(LENGTH(message)) as max_message_length,
        MIN(LENGTH(message)) as min_message_length
      FROM ${tableName}
      WHERE session_id = :session_id
    `;

    const result = await this.connection.execute(statsSQL, { session_id: sessionId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    return result.rows?.;
  }

  /**
   * Gera ID único para mensagem
   */
  private generateMessageId(sessionId: string): string {
    return `${sessionId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Converte para formato n8n
   */
  async convertToN8nFormat<T>(data: T): Promise<INodeExecutionData[]> {
    return [{
      json: data as any
    }];
  }
}

/**
 * Factory para criar ChatMemoryService
 */
export class ChatMemoryServiceFactory {
  /**
   * Cria service básico
   */
  static create(connection: Connection): ChatMemoryService {
    return new ChatMemoryService(connection);
  }

  /**
   * Cria service com configuração otimizada para alta frequência
   */
  static createHighFrequency(connection: Connection): ChatMemoryService {
    return new ChatMemoryService(connection);
  }

  /**
   * Cria service com configuração para análise
   */
  static createAnalytics(connection: Connection): ChatMemoryService {
    return new ChatMemoryService(connection);
  }
}
