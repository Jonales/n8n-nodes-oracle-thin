import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { OracleFactory } from '../../lib/factory/OracleFactory';

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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const handler = OracleFactory.createChatMemoryNode(this, this);
    return handler.execute();
  }
}
