-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Legal documents table (knowledge base)
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL, -- 'safe_template', 'term_sheet', 'case_law', 'market_data', 'precedent'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Document chunks table (for RAG)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}', -- section, clause, page, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- GIN index for metadata filtering
CREATE INDEX IF NOT EXISTS document_chunks_metadata_idx 
ON document_chunks USING gin (metadata);

-- Matters table (client matters)
CREATE TABLE IF NOT EXISTS matters (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  doc_type TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'Delaware',
  risk_tolerance TEXT NOT NULL,
  audience TEXT NOT NULL,
  document_text TEXT NOT NULL,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  current_stage TEXT,
  overall_confidence FLOAT DEFAULT 0,
  stages JSONB DEFAULT '[]',
  parsed_sections JSONB DEFAULT '[]',
  issues JSONB DEFAULT '[]',
  guardrails JSONB,
  deliverables JSONB DEFAULT '[]',
  audit_log JSONB DEFAULT '[]',
  adversarial_critiques TEXT[] DEFAULT '{}',
  draft_revised BOOLEAN DEFAULT FALSE,
  adversarial_loop_count INTEGER DEFAULT 0,
  conflict_check JSONB,
  engagement_scope JSONB,
  defined_terms JSONB DEFAULT '[]',
  missing_provisions JSONB DEFAULT '[]'
);

-- Issue citations (track which legal docs were used)
CREATE TABLE IF NOT EXISTS issue_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id TEXT REFERENCES matters(id) ON DELETE CASCADE,
  issue_id TEXT NOT NULL,
  chunk_id UUID REFERENCES document_chunks(id),
  relevance_score FLOAT,
  citation_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Query cache for expensive operations
CREATE TABLE IF NOT EXISTS query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  query_text TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS query_cache_hash_idx ON query_cache(query_hash);
CREATE INDEX IF NOT EXISTS query_cache_expires_idx ON query_cache(expires_at);

-- Analytics table (for improving the system)
CREATE TABLE IF NOT EXISTS analysis_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id TEXT REFERENCES matters(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  query_text TEXT,
  retrieved_chunks INTEGER,
  llm_tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_legal_documents_updated_at 
BEFORE UPDATE ON legal_documents 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
