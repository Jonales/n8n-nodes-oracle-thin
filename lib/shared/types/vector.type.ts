/**
 * Tipos para Vector Store Oracle
 * Localização: src/shared/types/vector.type.ts
 */

import { INodeExecutionData } from 'n8n-workflow';

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VectorSearchParams {
  searchVector: number[];
  limit?: number;
  threshold?: number;
  filters?: VectorFilters;
}

export interface VectorFilters {
  metadata?: Record<string, any>;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  contentMatch?: string;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  distance: number;
  similarity: number;
}

export interface VectorCollectionInfo {
  name: string;
  vectorDimension: number;
  documentCount: number;
  createdAt: Date;
  indexInfo?: VectorIndexInfo;
}

export interface VectorIndexInfo {
  indexName: string;
  indexType: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  targetAccuracy: number;
  isValid: boolean;
}

export interface VectorOperationResult {
  success: boolean;
  operation: VectorOperation;
  documentId?: string;
  documentsAffected?: number;
  rowsAffected?: number;
  executionTime?: number;
  error?: string;
}

export interface EmbeddingConfig {
  dimension: number;
  model?: string;
  normalize?: boolean;
}

export interface VectorStoreConfig {
  collectionName: string;
  vectorDimension: number;
  indexType?: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  targetAccuracy?: number;
  enableMetadataIndex?: boolean;
}

export type VectorOperation = 
  | 'setup'
  | 'addDocument' 
  | 'updateDocument' 
  | 'deleteDocument' 
  | 'getDocument'
  | 'searchSimilarity' 
  | 'listCollections'
  | 'dropCollection';

export type VectorDistanceMetric = 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT' | 'MANHATTAN';

export type VectorIndexType = 'NEIGHBOR_PARTITIONS' | 'APPROXIMATE' | 'EXACT';
