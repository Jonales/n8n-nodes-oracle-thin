import { INodeExecutionData } from 'n8n-workflow';
import { BaseOracleHandler } from './BaseOracleHandler';
import { OracleVectorStoreService } from './OracleVectorStore.service';

/**
 * Handler para Oracle Vector Store com suporte a Oracle Vector
 * Operações de vector search, similarity matching e document storage
 */
export class OracleVectorStoreHandler extends BaseOracleHandler {

  async execute(): Promise<INodeExecutionData[]> {
    const operation = this.getParameter<string>('operation', 0);

    return this.executeWithConnection(async (connection) => {
      const service = new OracleVectorStoreService();

      switch (operation) {
        case 'setup':
          return this.setupCollection(service, connection);
        case 'addDocument':
          return this.addDocument(service, connection);
        case 'searchSimilarity':
          return this.searchSimilarity(service, connection);
        case 'deleteDocument':
          return this.deleteDocument(service, connection);
        case 'updateDocument':
          return this.updateDocument(service, connection);
        case 'getDocument':
          return this.getDocument(service, connection);
        case 'listCollections':
          return this.listCollections(service, connection);
        default:
          throw new Error(`Operação não suportada: ${operation}`);
      }
    });
  }

  /**
   * Configurar nova coleção de vetores
   */
  private async setupCollection(service: OracleVectorStoreService, connection: any): Promise<INodeExecutionData[]> {
    const collectionName = this.getParameter<string>('collectionName', 0);
    const vectorDimension = this.getParameter<number>('vectorDimension', 0);

    this.validateRequiredParameters({ collectionName, vectorDimension });

    const result = await service.setupCollection(connection, collectionName, vectorDimension);
    return result;
  }

  /**
   * Adicionar documento com embedding
   */
  private async addDocument(service: OracleVectorStoreService, connection: any): Promise<INodeExecutionData[]> {
    const collectionName = this.getParameter<string>('collectionName', 0);
    const documentData = this.getInputData()[0]?.json;
    const nodeId = this.functions.getNode().id;

    this.validateRequiredParameters({ collectionName });

    if (!documentData) {
      throw new Error('Dados do documento são obrigatórios no input');
    }

    const result = await service.addDocument(connection, collectionName, documentData, nodeId);
    return result;
  }

  /**
   * Buscar documentos por similaridade
   */
  private async searchSimilarity(service: OracleVectorStoreService, connection: any): Promise<INodeExecutionData[]> {
    const collectionName = this.getParameter<string>('collectionName', 0);
    const searchVector = this.getParameter<string>('searchVector', 0);
    const limit = this.getParameter<number>('limit', 0, 10);
    const threshold = this.getParameter<number>('threshold', 0, 0.7);

    this.validateRequiredParameters({ collectionName, searchVector });

    const result = await service.searchSimilarity(connection, collectionName, searchVector, limit, threshold);
    return result;
  }

  /**
   * Deletar documento
   */
  private async deleteDocument(service: OracleVectorStoreService, connection: any): Promise<INodeExecutionData[]> {
    const collectionName = this.getParameter<string>('collectionName', 0);
    const documentId = this.getParameter<string>('documentId', 0);

    this.validateRequiredParameters({ collectionName, documentId });

    const result = await service.deleteDocument(connection, collectionName, documentId);
    return result;
  }

  /**
   * Atualizar documento
   */
  private async updateDocument(service: OracleVectorStoreService, connection: any): Promise<INodeExecutionData[]> {
    const collectionName = this.getParameter<string>('collectionName', 0);
    const documentId = this.getParameter<string>('documentId', 0);
    const updateData = this.getInputData()[0]?.json;
    const nodeId = this.functions.getNode().id;

    this.validateRequiredParameters({ collectionName, documentId });

    if (!updateData) {
      throw new Error('Dados para atualização são obrigatórios no input');
    }

    const result = await service.updateDocument(connection, collectionName, documentId, updateData, nodeId);
    return result;
  }

  /**
   * Obter documento por ID
   */
  private async getDocument(service: OracleVectorStoreService, connection: any): Promise<INodeExecutionData[]> {
    const collectionName = this.getParameter<string>('collectionName', 0);
    const documentId = this.getParameter<string>('documentId', 0);

    this.validateRequiredParameters({ collectionName, documentId });

    const result = await service.getDocument(connection, collectionName, documentId);
    return result;
  }

  /**
   * Listar todas as coleções
   */
  private async listCollections(service: OracleVectorStoreService, connection: any): Promise<INodeExecutionData[]> {
    const result = await service.listCollections(connection);
    return result;
  }
}