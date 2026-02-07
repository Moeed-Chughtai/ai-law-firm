import { pool } from '../db/client';
import { generateEmbedding, generateEmbeddingsBatch } from './embeddings';
import { DocumentChunk } from './chunking';

export interface RetrievedChunk {
  id: string;
  content: string;
  metadata: Record<string, any>;
  relevanceScore: number;
  documentTitle?: string;
  section?: string;
}

/**
 * Store a legal document with chunking and embeddings
 */
export async function storeLegalDocument(
  title: string,
  content: string,
  docType: string,
  metadata: Record<string, any> = {},
  chunks: DocumentChunk[]
): Promise<string> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert document
    const docResult = await client.query(
      `INSERT INTO legal_documents (title, doc_type, content, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [title, docType, content, JSON.stringify(metadata)]
    );
    const documentId = docResult.rows[0].id;

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddingsBatch(chunkTexts);

    // Insert chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await client.query(
        `INSERT INTO document_chunks 
         (document_id, chunk_index, content, embedding, metadata)
         VALUES ($1, $2, $3, $4::vector, $5)`,
        [
          documentId,
          chunk.chunkIndex,
          chunk.content,
          `[${embeddings[i].join(',')}]`, // pgvector format
          JSON.stringify(chunk.metadata),
        ]
      );
    }

    await client.query('COMMIT');
    return documentId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Semantic search with hybrid retrieval (vector + metadata filtering)
 */
export async function semanticSearch(
  query: string,
  options: {
    topK?: number;
    docType?: string;
    section?: string;
    minScore?: number;
    useHybrid?: boolean; // Combine vector + keyword search
  } = {}
): Promise<RetrievedChunk[]> {
  const {
    topK = 10,
    docType,
    section,
    minScore = 0.7,
    useHybrid = true,
  } = options;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const queryEmbeddingStr = `[${queryEmbedding.join(',')}]`;

  // Build metadata filter
  const metadataFilters: string[] = [];
  const params: any[] = [queryEmbeddingStr, topK];
  let paramIndex = 3;

  if (docType) {
    metadataFilters.push(`dc.metadata->>'docType' = $${paramIndex}`);
    params.push(docType);
    paramIndex++;
  }

  if (section) {
    metadataFilters.push(`dc.metadata->>'section' = $${paramIndex}`);
    params.push(section);
    paramIndex++;
  }

  const metadataFilter = metadataFilters.length > 0
    ? `AND ${metadataFilters.join(' AND ')}`
    : '';

  // Vector similarity search with cosine distance
  const vectorQuery = `
    SELECT 
      dc.id,
      dc.content,
      dc.metadata,
      d.title as document_title,
      dc.metadata->>'section' as section,
      1 - (dc.embedding <=> $1::vector) as relevance_score
    FROM document_chunks dc
    JOIN legal_documents d ON dc.document_id = d.id
    WHERE dc.embedding IS NOT NULL
      AND 1 - (dc.embedding <=> $1::vector) >= $${paramIndex}
      ${metadataFilter}
    ORDER BY dc.embedding <=> $1::vector
    LIMIT $2
  `;

  params.push(minScore);

  const result = await pool.query(vectorQuery, params);

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata,
    relevanceScore: parseFloat(row.relevance_score),
    documentTitle: row.document_title,
    section: row.section,
  }));
}

/**
 * Multi-query retrieval: Generate multiple query variations
 * and retrieve from each, then merge and re-rank
 */
export async function multiQueryRetrieval(
  originalQuery: string,
  options: {
    topK?: number;
    docType?: string;
    numQueries?: number;
  } = {}
): Promise<RetrievedChunk[]> {
  const { topK = 10, docType, numQueries = 3 } = options;

  // Generate query variations using LLM
  const queryVariations = await generateQueryVariations(originalQuery, numQueries);

  // Retrieve from each variation
  const allResults: Map<string, RetrievedChunk> = new Map();

  for (const query of [originalQuery, ...queryVariations]) {
    const results = await semanticSearch(query, { topK: topK * 2, docType });
    
    for (const chunk of results) {
      const existing = allResults.get(chunk.id);
      if (!existing || chunk.relevanceScore > existing.relevanceScore) {
        allResults.set(chunk.id, chunk);
      }
    }
  }

  // Re-rank by relevance score
  const ranked = Array.from(allResults.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);

  return ranked;
}

/**
 * Generate query variations for better retrieval
 */
async function generateQueryVariations(
  query: string,
  numVariations: number
): Promise<string[]> {
  const { callLLMJSON } = await import('../ai/openai');
  
  const result = await callLLMJSON<{ variations: string[] }>(
    'You are a query expansion specialist. Generate alternative phrasings of legal queries.',
    `Generate ${numVariations} alternative phrasings of this legal query that would help retrieve relevant documents:
    
Query: "${query}"

Return JSON: { "variations": ["variation1", "variation2", ...] }`,
    { temperature: 0.7, maxTokens: 200 }
  );

  return result.variations || [];
}

/**
 * Contextual compression: Re-rank and filter retrieved chunks
 * to keep only the most relevant
 */
export async function compressContext(
  chunks: RetrievedChunk[],
  query: string,
  maxChunks: number = 5
): Promise<RetrievedChunk[]> {
  if (chunks.length <= maxChunks) return chunks;

  // Use LLM to re-rank by relevance to query
  const { callLLMJSON } = await import('../ai/openai');
  
  const result = await callLLMJSON<{ rankedIds: string[] }>(
    'You are a relevance ranking specialist. Rank document chunks by relevance to a query.',
    `Rank these document chunks by relevance to this query: "${query}"

Chunks:
${chunks.map((c, i) => `${i}: ${c.content.substring(0, 200)}...`).join('\n\n')}

Return JSON with top ${maxChunks} chunk indices: { "rankedIds": ["0", "2", ...] }`,
    { temperature: 0.2, maxTokens: 500 }
  );

  const rankedIds = result.rankedIds?.slice(0, maxChunks) || [];
  return rankedIds
    .map((id) => chunks[parseInt(id)])
    .filter(Boolean);
}

/**
 * Store citation when a chunk is used in analysis
 */
export async function storeCitation(
  matterId: string,
  issueId: string,
  chunkId: string,
  relevanceScore: number,
  citationText: string
): Promise<void> {
  await pool.query(
    `INSERT INTO issue_citations 
     (matter_id, issue_id, chunk_id, relevance_score, citation_text)
     VALUES ($1, $2, $3, $4, $5)`,
    [matterId, issueId, chunkId, relevanceScore, citationText]
  );
}
