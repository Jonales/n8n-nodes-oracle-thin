import oracledb, { Connection } from 'oracledb';
import { INodeExecutionData } from 'n8n-workflow';

export class OracleVectorStoreService {
  async setupCollection(
    connection: Connection,
    collectionName: string,
    vectorDimension: number,
  ): Promise<INodeExecutionData[]> {
    const createTableSQL = `
			BEGIN
				EXECUTE IMMEDIATE '
					CREATE TABLE ${collectionName} (
						id VARCHAR2(255) PRIMARY KEY,
						content CLOB NOT NULL,
						embedding VECTOR(${vectorDimension}, FLOAT32),
						metadata CLOB,
						created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
						updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
					)
				';
			EXCEPTION
				WHEN OTHERS THEN
					IF SQLCODE != -955 THEN
						RAISE;
					END IF;
			END;
		`;

    await connection.execute(createTableSQL);

    const createIndexSQL = `
			BEGIN
				EXECUTE IMMEDIATE 'CREATE VECTOR INDEX idx_${collectionName}_embedding ON ${collectionName}(embedding)
					ORGANIZATION NEIGHBOR PARTITIONS
					DISTANCE COSINE
					WITH TARGET ACCURACY 95';
			EXCEPTION
				WHEN OTHERS THEN
					IF SQLCODE != -955 THEN
						RAISE;
					END IF;
			END;
		`;

    await connection.execute(createIndexSQL);
    await connection.commit();

    return [
      {
        json: {
          success: true,
          message: `Coleção "${collectionName}" criada com sucesso`,
          vectorDimension,
          operation: 'setup',
        },
      },
    ];
  }

  async addDocument(
    connection: Connection,
    collectionName: string,
    documentData: any,
    nodeId: string,
  ): Promise<INodeExecutionData[]> {
    if (!documentData) {
      throw new Error('Nenhum dado de documento fornecido no input');
    }

    const documentId = documentData.id != null ? String(documentData.id) : String(Date.now());
    const content = documentData.content != null ? String(documentData.content) : '';
    const embedding = documentData.embedding || documentData.vector;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Embedding/vector é obrigatório e deve ser um array');
    }

    const metadataObj =
			documentData && typeof documentData.metadata === 'object' && documentData.metadata !== null
			  ? documentData.metadata
			  : {};

    const metadata = JSON.stringify({
      timestamp: new Date().toISOString(),
      nodeId,
      ...metadataObj,
    });

    const insertSQL = `
			INSERT INTO ${collectionName} (id, content, embedding, metadata)
			VALUES (:id, :content, :embedding, :metadata)
		`;

    const bindParams = {
      id: documentId,
      content,
      embedding: { type: oracledb.DB_TYPE_VECTOR, val: embedding },
      metadata,
    };

    const result = await connection.execute(insertSQL, bindParams, {
      autoCommit: true,
    });

    return [
      {
        json: {
          success: true,
          documentId,
          content,
          embeddingDimension: embedding.length,
          rowsAffected: result.rowsAffected,
          operation: 'addDocument',
        },
      },
    ];
  }

  async searchSimilarity(
    connection: Connection,
    collectionName: string,
    searchVectorParam: string,
    limit: number,
    threshold: number,
  ): Promise<INodeExecutionData[]> {
    let searchVector: number[];

    try {
      searchVector = JSON.parse(searchVectorParam);
    } catch {
      throw new Error('Search vector deve ser um JSON array válido');
    }

    if (!Array.isArray(searchVector)) {
      throw new Error('Search vector deve ser um array de números');
    }

    const searchSQL = `
			SELECT
				id,
				content,
				metadata,
				created_at,
				VECTOR_DISTANCE(embedding, :searchVector, COSINE) as distance,
				(1 - VECTOR_DISTANCE(embedding, :searchVector, COSINE)) as similarity
			FROM ${collectionName}
			WHERE (1 - VECTOR_DISTANCE(embedding, :searchVector, COSINE)) >= :threshold
			ORDER BY similarity DESC
			FETCH FIRST :limit ROWS ONLY
		`;

    const bindParams = {
      searchVector: { type: oracledb.DB_TYPE_VECTOR, val: searchVector },
      threshold,
      limit,
    };

    const result = await connection.execute(searchSQL, bindParams, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    const documents = (result.rows as any[]).map((row) => ({
      json: {
        id: row.ID,
        content: row.CONTENT,
        metadata: row.METADATA ? JSON.parse(row.METADATA) : null,
        createdAt: row.CREATED_AT,
        distance: row.DISTANCE,
        similarity: row.SIMILARITY,
      },
    }));

    return documents;
  }

  async deleteDocument(
    connection: Connection,
    collectionName: string,
    documentId: string,
  ): Promise<INodeExecutionData[]> {
    const deleteSQL = `DELETE FROM ${collectionName} WHERE id = :documentId`;

    const result = await connection.execute(
      deleteSQL,
      { documentId },
      { autoCommit: true },
    );

    return [
      {
        json: {
          success: true,
          documentId,
          rowsDeleted: result.rowsAffected,
          operation: 'deleteDocument',
        },
      },
    ];
  }

  async updateDocument(
    connection: Connection,
    collectionName: string,
    documentId: string,
    updateData: any,
    nodeId: string,
  ): Promise<INodeExecutionData[]> {
    const content = updateData.content != null ? String(updateData.content) : null;
    const embedding = updateData.embedding || updateData.vector;

    const metadataObj =
			updateData && typeof updateData.metadata === 'object' && updateData.metadata !== null
			  ? updateData.metadata
			  : {};

    const metadata = JSON.stringify({
      timestamp: new Date().toISOString(),
      nodeId,
      updated: true,
      ...metadataObj,
    });

    let updateSQL = `UPDATE ${collectionName} SET updated_at = CURRENT_TIMESTAMP`;
    const bindParams: Record<string, any> = {};

    if (content !== null) {
      updateSQL += ', content = :content';
      bindParams.content = content;
    }

    if (embedding && Array.isArray(embedding)) {
      updateSQL += ', embedding = :embedding';
      bindParams.embedding = { type: oracledb.DB_TYPE_VECTOR, val: embedding };
    }

    updateSQL += ', metadata = :metadata WHERE id = :documentId';
    bindParams.metadata = metadata;
    bindParams.documentId = documentId;

    const result = await connection.execute(updateSQL, bindParams, {
      autoCommit: true,
    });

    return [
      {
        json: {
          success: true,
          documentId,
          rowsUpdated: result.rowsAffected,
          operation: 'updateDocument',
        },
      },
    ];
  }

  async getDocument(
    connection: Connection,
    collectionName: string,
    documentId: string,
  ): Promise<INodeExecutionData[]> {
    const selectSQL = `
			SELECT id, content, embedding, metadata, created_at, updated_at
			FROM ${collectionName}
			WHERE id = :documentId
		`;

    const result = await connection.execute(
      selectSQL,
      { documentId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    if (!result.rows || result.rows.length === 0) {
      return [
        {
          json: {
            success: false,
            error: 'Documento não encontrado',
            documentId,
          },
        },
      ];
    }

    const row = result.rows[0] as any;
    return [
      {
        json: {
          id: row.ID,
          content: row.CONTENT,
          embedding: Array.from(row.EMBEDDING || []),
          metadata: row.METADATA ? JSON.parse(row.METADATA) : null,
          createdAt: row.CREATED_AT,
          updatedAt: row.UPDATED_AT,
        },
      },
    ];
  }

  async listCollections(connection: Connection): Promise<INodeExecutionData[]> {
    const listSQL = `
			SELECT table_name
			FROM user_tables
			WHERE table_name LIKE '%VECTOR%' OR table_name LIKE '%EMBEDDING%'
			ORDER BY table_name
		`;

    const result = await connection.execute(listSQL, {}, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    const collections = (result.rows as any[]).map((row) => ({
      json: {
        collectionName: row.TABLE_NAME,
        type: 'vector_store',
      },
    }));

    return collections;
  }
}
