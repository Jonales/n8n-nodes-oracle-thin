/**
 * Oracle Vector Store Service - Refatorado
 * Localização: lib/services/vector-store/oracle-vector-store.service.ts
 */

import oracledb, { Connection } from 'oracledb';
import { INodeExecutionData } from 'n8n-workflow';
import {
  VectorStoreService as IVectorStoreService,
  VectorStoreOptions,
  VectorStoreResult,
  VectorDocument,
  ServiceResult,
  VECTOR_DEFAULTS,
  ORACLE_DATA_TYPES
} from '@shared';

export interface VectorCollectionOptions {
  vectorDimension: number;
  distanceFunction?: 'COSINE' | 'DOT' | 'EUCLIDEAN' | 'MANHATTAN';
  indexType?: 'IVF' | 'HNSW';
  accuracy?: number;
  createFullTextIndex?: boolean;
  enableVersioning?: boolean;
}

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
  includeContent?: boolean;
  filters?: Record<string, any>;
  hybridSearch?: {
    textQuery?: string;
    textWeight?: number;
    vectorWeight?: number;
  };
}

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

export interface VectorSearchResult extends VectorDocument {
  distance: number;
  similarity: number;
  score?: number;
}

export class OracleVectorStoreService implements IVectorStoreService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Configura nova coleção de vetores
   */
  async setupCollection(
    collectionName: string,
    options: VectorCollectionOptions
  ): Promise<ServiceResult<{ collectionName: string; created: boolean }>> {
    try {
      const {
        vectorDimension,
        distanceFunction = 'COSINE',
        indexType = 'IVF',
        accuracy = 95,
        createFullTextIndex = false,
        enableVersioning = false
      } = options;

      // Validar dimensão do vetor
      if (vectorDimension < 1 || vectorDimension > 65535) {
        throw new Error('Vector dimension deve estar entre 1 e 65535');
      }

      // Criar tabela principal
      const createTableSQL = this.buildCreateTableSQL(collectionName, {
        vectorDimension,
        enableVersioning
      });

      await this.connection.execute(createTableSQL);

      // Criar índice vetorial
      await this.createVectorIndex(collectionName, {
        distanceFunction,
        indexType,
        accuracy
      });

      // Criar índice full-text se solicitado
      if (createFullTextIndex) {
        await this.createFullTextIndex(collectionName);
      }

      // Criar trigger de versioning se habilitado
      if (enableVersioning) {
        await this.createVersioningTrigger(collectionName);
      }

      await this.connection.commit();

      return {
        success: true,
        data: {
          collectionName,
          created: true
        },
        message: `Vector collection '${collectionName}' criada com dimensão ${vectorDimension}`
      };

    } catch (error: unknown) {
      await this.connection.rollback();
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Erro ao criar coleção '${collectionName}'`
      };
    }
  }

  /**
   * Adiciona documento à coleção
   */
  async addDocument(
    collectionName: string,
    document: VectorDocument,
    options: {
      upsert?: boolean;
      validateEmbedding?: boolean;
      generateId?: boolean;
    } = {}
  ): Promise<ServiceResult<VectorDocument>> {
    try {
      const {
        upsert = false,
        validateEmbedding = true,
        generateId = false
      } = options;

      // Validar embedding
      if (validateEmbedding) {
        this.validateEmbedding(document.embedding);
      }

      // Gerar ID se necessário
      const documentId = generateId ? this.generateDocumentId() : document.id;

      const insertSQL = upsert
        ? this.buildUpsertSQL(collectionName)
        : this.buildInsertSQL(collectionName);

      const bindParams = {
        id: documentId,
        content: document.content,
        embedding: {
          type: oracledb.DB_TYPE_VECTOR,
          val: document.embedding
        },
        metadata: document.metadata ? JSON.stringify(document.metadata) : null
      };

      const result = await this.connection.execute(insertSQL, bindParams, {
        autoCommit: true
      });

      const addedDocument: VectorDocument = {
        ...document,
        id: documentId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        success: true,
        data: addedDocument,
        message: `Documento ${upsert ? 'inserido/atualizado' : 'adicionado'} com sucesso`,
        rowsAffected: result.rowsAffected
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao adicionar documento'
      };
    }
  }

  /**
   * Busca por similaridade vetorial
   */
  async searchSimilarity(
    collectionName: string,
    queryVector: number[],
    options: VectorSearchOptions = {}
  ): Promise<ServiceResult<VectorSearchResult[]>> {
    try {
      const {
        limit = 10,
        threshold = 0.0,
        includeMetadata = true,
        includeContent = true,
        filters,
        hybridSearch
      } = options;

      // Validar vetor de busca
      this.validateEmbedding(queryVector);

      let searchSQL: string;
      const bindParams: any = {
        query_vector: {
          type: oracledb.DB_TYPE_VECTOR,
          val: queryVector
        },
        similarity_threshold: threshold,
        result_limit: limit
      };

      if (hybridSearch?.textQuery) {
        // Busca híbrida (vetorial + texto)
        searchSQL = this.buildHybridSearchSQL(collectionName, {
          includeMetadata,
          includeContent,
          filters: !!filters
        });
        bindParams.text_query = `%${hybridSearch.textQuery}%`;
        bindParams.text_weight = hybridSearch.textWeight || 0.3;
        bindParams.vector_weight = hybridSearch.vectorWeight || 0.7;
      } else {
        // Busca vetorial pura
        searchSQL = this.buildVectorSearchSQL(collectionName, {
          includeMetadata,
          includeContent,
          filters: !!filters
        });
      }

      // Adicionar filtros se especificados
      if (filters) {
        const { filterSQL, filterParams } = this.buildFilters(filters);
        searchSQL = searchSQL.replace('/* FILTERS */', filterSQL);
        Object.assign(bindParams, filterParams);
      }

      const result = await this.connection.execute(searchSQL, bindParams, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });

      const documents: VectorSearchResult[] = (result.rows as any[]).map(row => {
        const doc: VectorSearchResult = {
          id: row.ID,
          content: includeContent ? row.CONTENT : '',
          embedding: Array.from(row.EMBEDDING || []),
          distance: row.DISTANCE,
          similarity: row.SIMILARITY,
          createdAt: row.CREATED_AT,
          updatedAt: row.UPDATED_AT
        };

        if (includeMetadata && row.METADATA) {
          doc.metadata = JSON.parse(row.METADATA);
        }

        if (hybridSearch) {
          doc.score = row.HYBRID_SCORE;
        }

        return doc;
      });

      return {
        success: true,
        data: documents,
        message: `${documents.length} documentos encontrados`
      };

    } catch (error: unknown) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro na busca por similaridade'
      };
    }
  }

  /**
   * Atualiza documento existente
   */
  async updateDocument(
    collectionName: string,
    documentId: string,
    updates: Partial<VectorDocument>,
    options: {
      incrementVersion?: boolean;
      validateEmbedding?: boolean;
    } = {}
  ): Promise<ServiceResult<VectorDocument>> {
    try {
      const {
        incrementVersion = false,
        validateEmbedding = true
      } = options;

      // Validar embedding se fornecido
      if (updates.embedding && validateEmbedding) {
        this.validateEmbedding(updates.embedding);
      }

      const updateSQL = this.buildUpdateSQL(collectionName, updates, {
        incrementVersion
      });

      const bindParams: any = {
        document_id: documentId,
        updated_at: new Date()
      };

      // Adicionar campos a atualizar
      if (updates.content !== undefined) {
        bindParams.content = updates.content;
      }

      if (updates.embedding !== undefined) {
        bindParams.embedding = {
          type: oracledb.DB_TYPE_VECTOR,
          val: updates.embedding
        };
      }

      if (updates.metadata !== undefined) {
        bindParams.metadata = updates.metadata ? JSON.stringify(updates.metadata) : null;
      }

      const result = await this.connection.execute(updateSQL, bindParams, {
        autoCommit: true
      });

      if (result.rowsAffected === 0) {
        return {
          success: false,
          message: `Documento '${documentId}' não encontrado`,
          error: 'DOCUMENT_NOT_FOUND'
        };
      }

      // Buscar documento atualizado
      const updatedDoc = await this.getDocument(collectionName, documentId);

      return {
        success: true,
        data: updatedDoc.data!,
        message: 'Documento atualizado com sucesso',
        rowsAffected: result.rowsAffected
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao atualizar documento'
      };
    }
  }

  /**
   * Remove documento da coleção
   */
  async deleteDocument(
    collectionName: string,
    documentId: string,
    options: {
      softDelete?: boolean;
    } = {}
  ): Promise<ServiceResult<{ documentId: string; deleted: boolean }>> {
    try {
      const { softDelete = false } = options;

      let deleteSQL: string;
      if (softDelete) {
        deleteSQL = `
          UPDATE ${collectionName} 
          SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = :document_id AND deleted_at IS NULL
        `;
      } else {
        deleteSQL = `DELETE FROM ${collectionName} WHERE id = :document_id`;
      }

      const result = await this.connection.execute(deleteSQL, {
        document_id: documentId
      }, {
        autoCommit: true
      });

      const deleted = (result.rowsAffected || 0) > 0;

      return {
        success: deleted,
        data: {
          documentId,
          deleted
        },
        message: deleted
          ? `Documento '${documentId}' ${softDelete ? 'marcado como deletado' : 'removido'}`
          : `Documento '${documentId}' não encontrado`,
        rowsAffected: result.rowsAffected
      };

    } catch (error: unknown) {
      return {
        success: false,
        data: {
          documentId,
          deleted: false
        },
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao deletar documento'
      };
    }
  }

  /**
   * Obtém documento por ID
   */
  async getDocument(
    collectionName: string,
    documentId: string,
    options: {
      includeEmbedding?: boolean;
      includeMetadata?: boolean;
    } = {}
  ): Promise<ServiceResult<VectorDocument>> {
    try {
      const {
        includeEmbedding = false,
        includeMetadata = true
      } = options;

      const selectSQL = this.buildGetDocumentSQL(collectionName, {
        includeEmbedding,
        includeMetadata
      });

      const result = await this.connection.execute(selectSQL, {
        document_id: documentId
      }, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });

      if (!result.rows || result.rows.length === 0) {
        return {
          success: false,
          message: `Documento '${documentId}' não encontrado`,
          error: 'DOCUMENT_NOT_FOUND'
        };
      }

      const row = result.rows as any;
      const document: VectorDocument = {
        id: row.ID,
        content: row.CONTENT,
        embedding: includeEmbedding ? Array.from(row.EMBEDDING || []) : [],
        createdAt: row.CREATED_AT,
        updatedAt: row.UPDATED_AT,
        version: row.VERSION || 1
      };

      if (includeMetadata && row.METADATA) {
        document.metadata = JSON.parse(row.METADATA);
      }

      return {
        success: true,
        data: document,
        message: 'Documento encontrado'
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao buscar documento'
      };
    }
  }

  /**
   * Lista coleções disponíveis
   */
  async listCollections(
    options: {
      includeStats?: boolean;
      pattern?: string;
    } = {}
  ): Promise<ServiceResult<Array<{
    name: string;
    documentCount?: number;
    vectorDimension?: number;
    createdAt?: Date;
  }>>> {
    try {
      const { includeStats = false, pattern } = options;

      let listSQL = `
        SELECT table_name as name, created
        FROM user_tables
        WHERE table_name LIKE '%VECTOR%' OR table_name LIKE '%EMBEDDING%'
      `;

      const bindParams: any = {};

      if (pattern) {
        listSQL += ' AND UPPER(table_name) LIKE UPPER(:pattern)';
        bindParams.pattern = `%${pattern}%`;
      }

      listSQL += ' ORDER BY table_name';

      const result = await this.connection.execute(listSQL, bindParams, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });

      const collections = await Promise.all(
        (result.rows as any[]).map(async (row) => {
          const collection: any = {
            name: row.NAME,
            createdAt: row.CREATED
          };

          if (includeStats) {
            const stats = await this.getCollectionStats(row.NAME);
            Object.assign(collection, stats);
          }

          return collection;
        })
      );

      return {
        success: true,
        data: collections,
        message: `${collections.length} coleções encontradas`
      };

    } catch (error: unknown) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao listar coleções'
      };
    }
  }

  /**
   * Adiciona múltiplos documentos em batch
   */
  async addDocumentsBatch(
    collectionName: string,
    documents: VectorDocument[],
    options: {
      batchSize?: number;
      continueOnError?: boolean;
      validateEmbeddings?: boolean;
    } = {}
  ): Promise<ServiceResult<{
    successful: number;
    failed: number;
    errors: Array<{ index: number; error: string; document?: VectorDocument }>;
  }>> {
    try {
      const {
        batchSize = 1000,
        continueOnError = true,
        validateEmbeddings = true
      } = options;

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as Array<{ index: number; error: string; document?: VectorDocument }>
      };

      // Processar em lotes
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        try {
          const batchResult = await this.processBatch(collectionName, batch, {
            validateEmbeddings,
            continueOnError
          });

          results.successful += batchResult.successful;
          results.failed += batchResult.failed;
          results.errors.push(...batchResult.errors.map(e => ({
            ...e,
            index: i + e.index
          })));

        } catch (error) {
          if (!continueOnError) {
            throw error;
          }
          
          // Marcar todo o lote como falhado
          results.failed += batch.length;
          batch.forEach((doc, idx) => {
            results.errors.push({
              index: i + idx,
              error: error instanceof Error ? error.message : String(error),
              document: doc
            });
          });
        }
      }

      return {
        success: results.failed === 0 || (results.successful > 0 && continueOnError),
        data: results,
        message: `Processados ${documents.length} documentos: ${results.successful} sucessos, ${results.failed} falhas`
      };

    } catch (error: unknown) {
      return {
        success: false,
        data: {
          successful: 0,
          failed: documents.length,
          errors: []
        },
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro no processamento em lote'
      };
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private buildCreateTableSQL(
    tableName: string,
    options: {
      vectorDimension: number;
      enableVersioning?: boolean;
    }
  ): string {
    const { vectorDimension, enableVersioning } = options;

    return `
      CREATE TABLE ${tableName} (
        id VARCHAR2(255) PRIMARY KEY,
        content CLOB NOT NULL,
        embedding VECTOR(${vectorDimension}, FLOAT32),
        metadata CLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ${enableVersioning ? ', version NUMBER DEFAULT 1' : ''}
        ${enableVersioning ? ', deleted_at TIMESTAMP' : ''}
      )
    `;
  }

  private async createVectorIndex(
    tableName: string,
    options: {
      distanceFunction: string;
      indexType: string;
      accuracy: number;
    }
  ): Promise<void> {
    const { distanceFunction, indexType, accuracy } = options;

    const indexSQL = `
      CREATE VECTOR INDEX idx_${tableName}_embedding ON ${tableName}(embedding)
      ORGANIZATION NEIGHBOR PARTITIONS
      DISTANCE ${distanceFunction}
      WITH TARGET ACCURACY ${accuracy}
    `;

    await this.connection.execute(indexSQL);
  }

  private async createFullTextIndex(tableName: string): Promise<void> {
    const indexSQL = `
      CREATE INDEX idx_${tableName}_content_text ON ${tableName}(content)
      INDEXTYPE IS CTXSYS.CONTEXT
    `;

    try {
      await this.connection.execute(indexSQL);
    } catch (error) {
      // Ignorar se Oracle Text não estiver disponível
      console.warn(`Full-text index não pôde ser criado: ${error}`);
    }
  }

  private buildVectorSearchSQL(
    tableName: string,
    options: {
      includeMetadata: boolean;
      includeContent: boolean;
      filters: boolean;
    }
  ): string {
    const selectFields = [
      'id',
      options.includeContent ? 'content' : 'NULL as content',
      'embedding',
      options.includeMetadata ? 'metadata' : 'NULL as metadata',
      'created_at',
      'updated_at',
      'VECTOR_DISTANCE(embedding, :query_vector, COSINE) as distance',
      '(1 - VECTOR_DISTANCE(embedding, :query_vector, COSINE)) as similarity'
    ].join(',\\n        ');

    return `
      SELECT ${selectFields}
      FROM ${tableName}
      WHERE (1 - VECTOR_DISTANCE(embedding, :query_vector, COSINE)) >= :similarity_threshold
      /* FILTERS */
      ORDER BY similarity DESC
      FETCH FIRST :result_limit ROWS ONLY
    `;
  }

  private validateEmbedding(embedding: number[]): void {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Embedding deve ser um array não vazio');
    }

    if (embedding.some(val => typeof val !== 'number' || !isFinite(val))) {
      throw new Error('Embedding deve conter apenas números válidos');
    }
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  }

  private async getCollectionStats(tableName: string): Promise<any> {
    const statsSQL = `
      SELECT 
        COUNT(*) as document_count,
        MIN(created_at) as earliest_doc,
        MAX(updated_at) as latest_update
      FROM ${tableName}
    `;

    const result = await this.connection.execute(statsSQL, {}, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    return result.rows?.;
  }

  // Outros métodos privados auxiliares...
  private buildInsertSQL(tableName: string): string {
    return `
      INSERT INTO ${tableName} (id, content, embedding, metadata)
      VALUES (:id, :content, :embedding, :metadata)
    `;
  }

  private buildUpsertSQL(tableName: string): string {
    return `
      MERGE INTO ${tableName} t
      USING (SELECT :id as id, :content as content, :embedding as embedding, :metadata as metadata FROM dual) s
      ON (t.id = s.id)
      WHEN MATCHED THEN
        UPDATE SET content = s.content, embedding = s.embedding, metadata = s.metadata, updated_at = CURRENT_TIMESTAMP
      WHEN NOT MATCHED THEN
        INSERT (id, content, embedding, metadata) VALUES (s.id, s.content, s.embedding, s.metadata)
    `;
  }

  private async processBatch(
    tableName: string,
    batch: VectorDocument[],
    options: any
  ): Promise<any> {
    // Implementação simplificada - seria necessário implementar lógica de batch real
    const results = { successful: 0, failed: 0, errors: [] as any[] };
    
    for (let i = 0; i < batch.length; i++) {
      try {
        await this.addDocument(tableName, batch[i]);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : String(error),
          document: batch[i]
        });
      }
    }

    return results;
  }

  // ... outros métodos privados conforme necessário
}

/**
 * Factory para criar OracleVectorStoreService
 */
export class OracleVectorStoreServiceFactory {
  static create(connection: Connection): OracleVectorStoreService {
    return new OracleVectorStoreService(connection);
  }

  static createHighPerformance(connection: Connection): OracleVectorStoreService {
    return new OracleVectorStoreService(connection);
  }

  static createAnalytics(connection: Connection): OracleVectorStoreService {
    return new OracleVectorStoreService(connection);
  }
}
