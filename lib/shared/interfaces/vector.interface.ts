/**
 * Interfaces para Oracle Vector Store operations
 * Localização: src/shared/interfaces/vector.interface.ts
 */

import { Connection } from 'oracledb';
import { INodeExecutionData } from 'n8n-workflow';
import {
  VectorDocument,
  VectorSearchParams,
  VectorSearchResult,
  VectorCollectionInfo,
  VectorOperationResult,
  VectorStoreConfig,
  VectorOperation
} from '../types/vector.type';

/**
 * Interface principal para operações do Vector Store
 */
export interface VectorStoreService {
  /**
   * Configura uma nova coleção de vetores
   */
  setupCollection(
    connection: Connection,
    collectionName: string,
    vectorDimension: number,
    config?: VectorStoreConfig
  ): Promise<INodeExecutionData[]>;

  /**
   * Adiciona um documento com embedding à coleção
   */
  addDocument(
    connection: Connection,
    collectionName: string,
    document: Partial<VectorDocument>,
    nodeId?: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Atualiza um documento existente
   */
  updateDocument(
    connection: Connection,
    collectionName: string,
    documentId: string,
    updateData: Partial<VectorDocument>,
    nodeId?: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Remove um documento da coleção
   */
  deleteDocument(
    connection: Connection,
    collectionName: string,
    documentId: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Obtém um documento específico
   */
  getDocument(
    connection: Connection,
    collectionName: string,
    documentId: string
  ): Promise<INodeExecutionData[]>;

  /**
   * Busca documentos por similaridade vetorial
   */
  searchSimilarity(
    connection: Connection,
    collectionName: string,
    searchParams: VectorSearchParams
  ): Promise<INodeExecutionData[]>;

  /**
   * Lista todas as coleções disponíveis
   */
  listCollections(connection: Connection): Promise<INodeExecutionData[]>;

  /**
   * Remove uma coleção completamente
   */
  dropCollection(
    connection: Connection,
    collectionName: string
  ): Promise<INodeExecutionData[]>;
}

/**
 * Interface para gerenciamento de embeddings
 */
export interface EmbeddingManager {
  /**
   * Gera embedding a partir de texto
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Gera embeddings em lote
   */
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Valida dimensões do embedding
   */
  validateEmbedding(embedding: number[], expectedDimension: number): boolean;

  /**
   * Normaliza um embedding
   */
  normalizeEmbedding(embedding: number[]): number[];
}

/**
 * Interface para operações de índice vetorial
 */
export interface VectorIndexManager {
  /**
   * Cria um índice vetorial na coleção
   */
  createVectorIndex(
    connection: Connection,
    collectionName: string,
    indexConfig: {
      indexName?: string;
      distanceMetric?: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
      targetAccuracy?: number;
      indexType?: 'NEIGHBOR_PARTITIONS' | 'APPROXIMATE';
    }
  ): Promise<boolean>;

  /**
   * Remove um índice vetorial
   */
  dropVectorIndex(
    connection: Connection,
    indexName: string
  ): Promise<boolean>;

  /**
   * Obtém informações sobre índices
   */
  getIndexInfo(
    connection: Connection,
    collectionName: string
  ): Promise<any>;

  /**
   * Otimiza um índice vetorial
   */
  optimizeIndex(
    connection: Connection,
    indexName: string
  ): Promise<boolean>;
}

/**
 * Interface para validação de vetores
 */
export interface VectorValidator {
  /**
   * Valida estrutura do documento
   */
  validateDocument(document: Partial<VectorDocument>): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * Valida parâmetros de busca
   */
  validateSearchParams(params: VectorSearchParams): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * Valida nome da coleção
   */
  validateCollectionName(name: string): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * Valida configuração da coleção
   */
  validateCollectionConfig(config: VectorStoreConfig): {
    isValid: boolean;
    errors: string[];
  };
}

/**
 * Interface para cache de vetores
 */
export interface VectorCache {
  /**
   * Armazena resultado de busca no cache
   */
  cacheSearchResult(
    searchKey: string,
    results: VectorSearchResult[],
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Obtém resultado do cache
   */
  getCachedSearchResult(searchKey: string): Promise<VectorSearchResult[] | null>;

  /**
   * Remove entrada do cache
   */
  removeCachedResult(searchKey: string): Promise<void>;

  /**
   * Limpa todo o cache
   */
  clearCache(): Promise<void>;

  /**
   * Gera chave de cache a partir dos parâmetros de busca
   */
  generateCacheKey(
    collectionName: string,
    searchParams: VectorSearchParams
  ): string;
}
