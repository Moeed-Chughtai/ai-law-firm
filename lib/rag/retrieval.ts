import {
  semanticSearch,
  multiQueryRetrieval,
  compressContext,
  RetrievedChunk,
} from './vectorStore';
import { Matter } from '../types';

/**
 * Advanced RAG retrieval with state-of-the-art techniques
 */
export interface RetrievalOptions {
  useMultiQuery?: boolean;
  useCompression?: boolean;
  topK?: number;
  docType?: string;
  minRelevance?: number;
}

/**
 * Retrieve relevant legal context for a query
 */
export async function retrieveLegalContext(
  query: string,
  matter: Matter,
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  const {
    useMultiQuery = true,
    useCompression = true,
    topK = 8,
    docType,
    minRelevance = 0.7,
  } = options;

  let chunks: RetrievedChunk[];

  // Strategy 1: Multi-query retrieval (better recall)
  if (useMultiQuery) {
    chunks = await multiQueryRetrieval(query, {
      topK: topK * 2, // Get more, then compress
      docType: docType || (matter.docType === 'safe' ? 'safe_template' : 'term_sheet'),
      numQueries: 3,
    });
  } else {
    chunks = await semanticSearch(query, {
      topK: topK * 2,
      docType: docType || (matter.docType === 'safe' ? 'safe_template' : 'term_sheet'),
      minScore: minRelevance,
    });
  }

  // Strategy 2: Context compression (better precision)
  if (useCompression && chunks.length > topK) {
    chunks = await compressContext(chunks, query, topK);
  }

  // Filter by minimum relevance
  return chunks.filter((c) => c.relevanceScore >= minRelevance);
}

/**
 * Retrieve general context for initial issue analysis
 */
export async function retrieveGeneralIssueContext(
  matter: Matter
): Promise<RetrievedChunk[]> {
  const query = `${matter.docType === 'safe' ? 'SAFE' : 'term sheet'} legal issues market standards best practices`;
  
  return retrieveLegalContext(query, matter, {
    useMultiQuery: false, // Simpler for initial analysis
    useCompression: false,
    topK: 5,
    docType: matter.docType === 'safe' ? 'safe_template' : 'term_sheet',
    minRelevance: 0.6, // Lower threshold for general context
  });
}

/**
 * Retrieve context for specific issue analysis
 */
export async function retrieveIssueContext(
  issueTitle: string,
  clauseRef: string,
  matter: Matter
): Promise<RetrievedChunk[]> {
  const query = `${issueTitle} ${clauseRef} ${matter.docType === 'safe' ? 'SAFE' : 'term sheet'} market standards`;
  
  return retrieveLegalContext(query, matter, {
    useMultiQuery: true,
    useCompression: true,
    topK: 5,
    docType: matter.docType === 'safe' ? 'safe_template' : 'term_sheet',
  });
}

/**
 * Retrieve context for research stage
 */
export async function retrieveResearchContext(
  issueTitle: string,
  researchType: 'marketNorms' | 'riskImpact' | 'negotiationLeverage',
  matter: Matter
): Promise<RetrievedChunk[]> {
  const queries: Record<string, string> = {
    marketNorms: `${issueTitle} market standards YC NVCA benchmarks 2024`,
    riskImpact: `${issueTitle} risk analysis dilution impact founder equity`,
    negotiationLeverage: `${issueTitle} negotiation strategy counter-proposal leverage`,
  };

  const docTypes: Record<string, string> = {
    marketNorms: 'market_data',
    riskImpact: 'precedent',
    negotiationLeverage: 'precedent',
  };

  return retrieveLegalContext(queries[researchType], matter, {
    useMultiQuery: true,
    useCompression: true,
    topK: 4,
    docType: docTypes[researchType],
  });
}

/**
 * Format retrieved chunks for LLM context
 */
export function formatChunksForPrompt(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk, idx) => `## Reference ${idx + 1}: ${chunk.documentTitle || 'Legal Document'}
${chunk.section ? `Section: ${chunk.section}\n` : ''}
${chunk.content}

Relevance: ${(chunk.relevanceScore * 100).toFixed(1)}%`
    )
    .join('\n\n---\n\n');
}
