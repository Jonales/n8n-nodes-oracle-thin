import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { Connection } from 'oracledb';
import { OracleConnectionPool } from './core/connectionPool';
import { OracleVectorStoreService } from './OracleVectorStore.service';

export class OracleVectorStore implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Oracle Vector Store',
    name: 'oracleVectorStore',
    icon: 'file:oracle.svg',
    group: ['transform'],
    version: 1,
    description: 'Gerenciamento de vector store usando Oracle Database com Oracle Vector compatibilidade',
    defaults: {
      name: 'Oracle Vector Store',
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
        default: 'addDocument',
        options: [
          { name: 'Setup Collection', value: 'setup' },
          { name: 'Add Document', value: 'addDocument' },
          { name: 'Search Similarity', value: 'searchSimilarity' },
          { name: 'Delete Document', value: 'deleteDocument' },
          { name: 'Update Document', value: 'updateDocument' },
          { name: 'Get Document', value: 'getDocument' },
          { name: 'List Collections', value: 'listCollections' },
        ],
      },
      {
        displayName: 'Collection Name',
        name: 'collectionName',
        type: 'string',
        default: 'vector_documents',
        displayOptions: {
          hide: {
            operation: ['listCollections'],
          },
        },
      },
      {
        displayName: 'Vector Dimension',
        name: 'vectorDimension',
        type: 'number',
        default: 1536,
        displayOptions: {
          show: {
            operation: ['setup'],
          },
        },
      },
      {
        displayName: 'Document ID',
        name: 'documentId',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['deleteDocument', 'updateDocument', 'getDocument'],
          },
        },
      },
      {
        displayName: 'Search Vector',
        name: 'searchVector',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['searchSimilarity'],
          },
        },
      },
      {
        displayName: 'Limit Results',
        name: 'limit',
        type: 'number',
        default: 10,
        displayOptions: {
          show: {
            operation: ['searchSimilarity'],
          },
        },
      },
      {
        displayName: 'Similarity Threshold',
        name: 'threshold',
        type: 'number',
        default: 0.7,
        displayOptions: {
          show: {
            operation: ['searchSimilarity'],
          },
        },
      }
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials('oracleCredentials');
    const operation = this.getNodeParameter('operation', 0) as string;
    const collectionName = this.getNodeParameter('collectionName', 0, '') as string;

    const oracleCredentials = {
      user: String(credentials.user),
      password: String(credentials.password),
      connectionString: String(credentials.connectionString),
    };

    let connection: Connection | undefined;
    const service = new OracleVectorStoreService();
    let returnItems: INodeExecutionData[] = [];

    try {
      const pool = await OracleConnectionPool.getPool(oracleCredentials);
      connection = await pool.getConnection();

      switch (operation) {
      case 'setup': {
        const dimension = this.getNodeParameter('vectorDimension', 0) as number;
        returnItems = await service.setupCollection(connection, collectionName, dimension);
        break;
      }
      case 'addDocument': {
        const documentData = this.getInputData()[0]?.json;
        const nodeId = this.getNode().id;
        returnItems = await service.addDocument(connection, collectionName, documentData, nodeId);
        break;
      }
      case 'searchSimilarity': {
        const searchVector = this.getNodeParameter('searchVector', 0) as string;
        const limit = this.getNodeParameter('limit', 0) as number;
        const threshold = this.getNodeParameter('threshold', 0) as number;
        returnItems = await service.searchSimilarity(connection, collectionName, searchVector, limit, threshold);
        break;
      }
      case 'deleteDocument': {
        const documentId = this.getNodeParameter('documentId', 0) as string;
        returnItems = await service.deleteDocument(connection, collectionName, documentId);
        break;
      }
      case 'updateDocument': {
        const documentId = this.getNodeParameter('documentId', 0) as string;
        const updateData = this.getInputData()[0]?.json;
        const nodeId = this.getNode().id;
        returnItems = await service.updateDocument(connection, collectionName, documentId, updateData, nodeId);
        break;
      }
      case 'getDocument': {
        const documentId = this.getNodeParameter('documentId', 0) as string;
        returnItems = await service.getDocument(connection, collectionName, documentId);
        break;
      }
      case 'listCollections': {
        returnItems = await service.listCollections(connection);
        break;
      }
      default:
        throw new NodeOperationError(this.getNode(), `Operação "${operation}" não suportada`);
      }
    } catch (error) {
      throw new NodeOperationError(this.getNode(), `Erro no Oracle Vector Store: ${(error as Error).message}`);
    } finally {
      if (connection) {
        await connection.close();
      }
    }

    return [returnItems];
  }
}
