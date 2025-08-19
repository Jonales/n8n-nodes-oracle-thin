import { INodeExecutionData } from 'n8n-workflow';
import { Connection } from 'oracledb';

export class ChatMemoryService {
  async setupTable(connection: Connection, tableName: string): Promise<INodeExecutionData[]> {
    const createTableSql = `
			CREATE TABLE ${tableName} (
				id VARCHAR2(64) PRIMARY KEY,
				session_id VARCHAR2(64),
				memory_type VARCHAR2(20),
				message CLOB,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`;

    await connection.execute(createTableSql);
    await connection.commit();

    return [
      {
        json: {
          success: true,
          message: `Tabela "${tableName}" criada com sucesso`,
        },
      },
    ];
  }

  async addMessage(
    connection: Connection,
    sessionId: string,
    memoryType: string,
    tableName: string,
    message: string,
  ): Promise<INodeExecutionData[]> {
    const id = `${sessionId}-${Date.now()}`;

    const insertSql = `
			INSERT INTO ${tableName} (id, session_id, memory_type, message)
			VALUES (:id, :session_id, :memory_type, :message)
		`;

    await connection.execute(insertSql, {
      id,
      session_id: sessionId,
      memory_type: memoryType,
      message,
    });

    await connection.commit();

    return [
      {
        json: {
          success: true,
          message: 'Mensagem adicionada',
          id,
        },
      },
    ];
  }

  async getMessages(connection: Connection, sessionId: string, tableName: string): Promise<INodeExecutionData[]> {
    const selectSql = `
			SELECT message, created_at FROM ${tableName}
			WHERE session_id = :session_id
			ORDER BY created_at ASC
		`;

    const result = await connection.execute(selectSql, { session_id: sessionId }, { outFormat: 4002 });
    const rows = result.rows || [];

    return [
      {
        json: {
          sessionId,
          messages: rows,
        },
      },
    ];
  }

  async clearMemory(connection: Connection, sessionId: string, tableName: string): Promise<INodeExecutionData[]> {
    const deleteSql = `DELETE FROM ${tableName} WHERE session_id = :session_id`;

    await connection.execute(deleteSql, { session_id: sessionId });
    await connection.commit();

    return [
      {
        json: {
          success: true,
          message: `Memória limpa para sessão ${sessionId}`,
        },
      },
    ];
  }

  async getSummary(connection: Connection, sessionId: string, tableName: string): Promise<INodeExecutionData[]> {
    const countSql = `
			SELECT COUNT(*) AS TOTAL, MAX(created_at) AS ULTIMA_MENSAGEM
			FROM ${tableName}
			WHERE session_id = :session_id
		`;

    const result = await connection.execute(countSql, { session_id: sessionId }, { outFormat: 4002 });
    const row = result.rows?.[0] as { TOTAL: number; ULTIMA_MENSAGEM: Date };

    return [
      {
        json: {
          sessionId,
          total: row?.TOTAL ?? 0,
          ultimaMensagem: row?.ULTIMA_MENSAGEM ?? null,
        },
      },
    ];
  }
}
