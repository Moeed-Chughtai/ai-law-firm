/**
 * Legal document ingestion system
 * Handles uploading, chunking, embedding, and storing legal documents in the RAG system
 */

import { pool } from '@/lib/db/client';
import { chunkLegalDocument } from './chunking';
import { generateEmbeddingsBatch } from './embeddings';

export type DocumentSource = 
  | 'statute'           // Statutory law (DGCL, UCC, Securities Act, etc.)
  | 'case_law'          // Court decisions and precedents
  | 'standard_form'     // Model agreements (NVCA, ABA templates)
  | 'practice_guide'    // Legal treatises and practice guides
  | 'firm_knowledge'    // Internal firm memos and playbooks
  | 'regulation'        // SEC rules, state regulations
  | 'other';

export interface LegalDocumentInput {
  title: string;
  content: string;
  docType: DocumentSource;
  jurisdiction?: string;
  effectiveDate?: Date;
  citation?: string;
  metadata?: Record<string, any>;
}

export interface IngestionResult {
  documentId: string;
  chunksCreated: number;
  title: string;
}

/**
 * Ingest a single legal document into the RAG system
 * 1. Store document metadata
 * 2. Chunk the content
 * 3. Generate embeddings
 * 4. Store chunks with embeddings
 */
export async function ingestLegalDocument(
  doc: LegalDocumentInput
): Promise<IngestionResult> {
  try {
    // 1. Insert document metadata
    const docResult = await pool.query(
      `INSERT INTO legal_documents 
       (title, doc_type, content, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [
        doc.title,
        doc.docType,
        doc.content,
        JSON.stringify({
          jurisdiction: doc.jurisdiction,
          effectiveDate: doc.effectiveDate?.toISOString(),
          citation: doc.citation,
          ...doc.metadata
        })
      ]
    );

    const documentId = docResult.rows[0].id;

    // 2. Chunk the document
    const chunks = chunkLegalDocument(doc.content, {
      docType: doc.docType,
      jurisdiction: doc.jurisdiction,
      citation: doc.citation
    });

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document');
    }

    // 3. Generate embeddings in batches (max 100 per batch to avoid rate limits)
    const BATCH_SIZE = 50;
    let totalChunksStored = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map(chunk => chunk.content);
      
      // Generate embeddings for this batch
      const embeddings = await generateEmbeddingsBatch(texts);

      // 4. Store chunks with embeddings
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddings[j];

        await pool.query(
          `INSERT INTO document_chunks 
           (document_id, chunk_index, content, embedding, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            documentId,
            chunk.chunkIndex,
            chunk.content,
            JSON.stringify(embedding), // Store as JSON array
            JSON.stringify(chunk.metadata)
          ]
        );

        totalChunksStored++;
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ Ingested: ${doc.title} (${totalChunksStored} chunks)`);

    return {
      documentId,
      chunksCreated: totalChunksStored,
      title: doc.title
    };
  } catch (error) {
    console.error('Document ingestion failed:', error);
    throw error;
  }
}

/**
 * Ingest multiple documents in sequence with rate limiting
 */
export async function ingestBatch(
  documents: LegalDocumentInput[],
  delayMs = 300
): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];

  for (const doc of documents) {
    try {
      const result = await ingestLegalDocument(doc);
      results.push(result);
      
      // Delay between documents to avoid rate limits
      if (documents.indexOf(doc) < documents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to ingest ${doc.title}:`, error);
      // Continue with next document
    }
  }

  return results;
}

/**
 * Get count of documents in the knowledge base by type
 */
export async function getDocumentStats(): Promise<Record<string, number>> {
  const result = await pool.query(
    `SELECT doc_type, COUNT(*) as count 
     FROM legal_documents 
     GROUP BY doc_type`
  );

  const stats: Record<string, number> = {};
  result.rows.forEach(row => {
    stats[row.doc_type] = parseInt(row.count);
  });

  return stats;
}

/**
 * Delete a document and all its chunks
 */
export async function deleteLegalDocument(documentId: string): Promise<void> {
  await pool.query(
    `DELETE FROM legal_documents WHERE id = $1`,
    [documentId]
  );
}

/**
 * List all documents in the knowledge base
 */
export async function listLegalDocuments(
  docType?: DocumentSource,
  limit = 100,
  offset = 0
): Promise<Array<{
  id: string;
  title: string;
  docType: string;
  metadata: any;
  createdAt: Date;
  chunkCount: number;
}>> {
  const query = docType
    ? `SELECT 
         ld.id, 
         ld.title, 
         ld.doc_type as "docType", 
         ld.metadata,
         ld.created_at as "createdAt",
         COUNT(dc.id) as "chunkCount"
       FROM legal_documents ld
       LEFT JOIN document_chunks dc ON ld.id = dc.document_id
       WHERE ld.doc_type = $1
       GROUP BY ld.id
       ORDER BY ld.created_at DESC
       LIMIT $2 OFFSET $3`
    : `SELECT 
         ld.id, 
         ld.title, 
         ld.doc_type as "docType", 
         ld.metadata,
         ld.created_at as "createdAt",
         COUNT(dc.id) as "chunkCount"
       FROM legal_documents ld
       LEFT JOIN document_chunks dc ON ld.id = dc.document_id
       GROUP BY ld.id
       ORDER BY ld.created_at DESC
       LIMIT $1 OFFSET $2`;

  const params = docType ? [docType, limit, offset] : [limit, offset];
  const result = await pool.query(query, params);

  return result.rows.map(row => ({
    ...row,
    chunkCount: parseInt(row.chunkCount)
  }));
}
