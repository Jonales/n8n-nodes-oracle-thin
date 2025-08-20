import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { OracleConnectionPool } from './core/connectionPool';
import { Connection } from 'oracledb';
import { ChatMemoryService } from './ChatMemory.service';

export class ChatMemoryNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Chat Memory',
    name: 'chatMemory',
    group: ['transform'],
    version: 1,
    description: 'Gerencia sessões de memória de chat em Oracle',
    defaults: {
      name: 'Chat Memory',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'oracleCredentials',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Setup Table', value: 'setup' },
          { name: 'Add Message', value: 'addMessage' },
          { name: 'Get Messages', value: 'getMessages' },
          { name: 'Clear Memory', value: 'clearMemory' },
          { name: 'Get Summary', value: 'getSummary' },
        ],
        default: 'setup',
      },
      {
        displayName: 'Session ID',
        name: 'sessionId',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['addMessage', 'getMessages', 'clearMemory', 'getSummary'],
          },
        },
      },
      {
        displayName: 'Memory Type',
        name: 'memoryType',
        type: 'string',
        default: 'chat',
        displayOptions: {
          show: {
            operation: ['addMessage'],
          },
        },
      },
      {
        displayName: 'Table Name',
        name: 'tableName',
        type: 'string',
        default: 'CHAT_MEMORY',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials('oracleCredentials');
    const operation = this.getNodeParameter('operation', 0) as string;
    const sessionId = this.getNodeParameter('sessionId', 0, '') as string;
    const memoryType = this.getNodeParameter('memoryType', 0, '') as string;
    const tableName = this.getNodeParameter('tableName', 0) as string;

    const oracleCredentials = {
      user: String(credentials.user),
      password: String(credentials.password),
      connectionString: String(credentials.connectionString),
    };

    let connection: Connection | undefined;
    let returnItems: INodeExecutionData[] = [];
    const service = new ChatMemoryService();

    try {
      const pool = await OracleConnectionPool.getPool(oracleCredentials);
      connection = await pool.getConnection();

      switch (operation) {
      case 'setup':
        returnItems = await service.setupTable(connection, tableName);
        break;
      case 'addMessage': {
        const rawMessage = this.getInputData()[0].json.message;

        if (typeof rawMessage !== 'string') {
          throw new NodeOperationError(this.getNode(), 'O campo "message" precisa ser uma string.');
        }

        const inputMessage = rawMessage;
        returnItems = await service.addMessage(connection, sessionId, memoryType, tableName, inputMessage);

        break;
      }
      case 'getMessages':
        returnItems = await service.getMessages(connection, sessionId, tableName);
        break;
      case 'clearMemory':
        returnItems = await service.clearMemory(connection, sessionId, tableName);
        break;
      case 'getSummary':
        returnItems = await service.getSummary(connection, sessionId, tableName);
        break;
      default:
        throw new NodeOperationError(this.getNode(), `Operação "${operation}" não suportada`);
      }
    } catch (error) {
      throw new NodeOperationError(this.getNode(), `Chat Memory Error: ${(error as Error).message}`);
    } finally {
      if (connection) {
        await connection.close();
      }
    }

    return [returnItems];
  }
}
