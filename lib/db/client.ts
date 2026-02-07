import { Pool, PoolClient } from 'pg';

// Lazy-initialized pool to avoid crashing at import time
let _pool: Pool | null = null;
let _initPromise: Promise<void> | null = null;
let _initialized = false;

function getConnectionString(): string | undefined {
  return process.env.DATABASE_URL;
}

export function getPool(): Pool {
  if (!_pool) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Set it in .env.local'
      );
    }
    _pool = new Pool({
      connectionString,
      max: 30,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 60000,
    });

    _pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err.message);
    });
  }
  return _pool;
}

// Lazy proxy for backward compat — won't crash at import time
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const realPool = getPool();
    const value = (realPool as any)[prop];
    if (typeof value === 'function') {
      return value.bind(realPool);
    }
    return value;
  },
});

// Initialize database schema with graceful pgvector handling
export async function initializeDatabase(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;
  _initPromise = _doInitialize();
  return _initPromise;
}

async function _doInitialize(): Promise<void> {
  const p = getPool();
  const client = await p.connect();

  try {
    // Check if pgvector is available
    let hasVector = false;
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      hasVector = true;
    } catch {
      console.warn('⚠️  pgvector not available — RAG features limited');
    }

    await client.query('BEGIN');

    // Core matters table
    await client.query(`
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
        adversarial_critiques JSONB DEFAULT '[]',
        draft_revised BOOLEAN DEFAULT FALSE
      )
    `);

    // Migrate existing tables: TEXT[] -> JSONB for adversarial_critiques
    // Run outside main transaction to avoid aborting on harmless errors
    await client.query('COMMIT');
    try {
      await client.query(`ALTER TABLE matters ALTER COLUMN adversarial_critiques DROP DEFAULT`);
      await client.query(`ALTER TABLE matters ALTER COLUMN adversarial_critiques TYPE JSONB USING to_jsonb(adversarial_critiques)`);
      await client.query(`ALTER TABLE matters ALTER COLUMN adversarial_critiques SET DEFAULT '[]'::jsonb`);
    } catch {
      // Column is already JSONB or table was just created — ignore
    }
    await client.query('BEGIN');

    // Legal documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        doc_type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Document chunks — with or without pgvector
    if (hasVector) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          embedding vector(1536),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
          ON document_chunks USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
        `);
      } catch {
        // IVFFlat needs data — will be created on first seed
      }
      await client.query(`
        CREATE INDEX IF NOT EXISTS document_chunks_metadata_idx 
        ON document_chunks USING gin (metadata)
      `);
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          embedding FLOAT8[],
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    }

    // Issue citations
    await client.query(`
      CREATE TABLE IF NOT EXISTS issue_citations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        matter_id TEXT REFERENCES matters(id) ON DELETE CASCADE,
        issue_id TEXT NOT NULL,
        chunk_id UUID,
        relevance_score FLOAT,
        citation_text TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Query cache
    await client.query(`
      CREATE TABLE IF NOT EXISTS query_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query_hash TEXT UNIQUE NOT NULL,
        query_text TEXT NOT NULL,
        results JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS query_cache_hash_idx ON query_cache(query_hash)`);

    // Analytics
    await client.query(`
      CREATE TABLE IF NOT EXISTS analysis_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        matter_id TEXT REFERENCES matters(id) ON DELETE CASCADE,
        stage TEXT NOT NULL,
        query_text TEXT,
        retrieved_chunks INTEGER,
        llm_tokens_used INTEGER,
        latency_ms INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    _initialized = true;
    console.log('✅ Database schema initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        _initialized = true;
        console.log('ℹ️  Database schema already exists');
        return;
      }
    }
    console.error('⚠️  Database init error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper: execute with auto-retry on transient failures
export async function withRetry<T>(
  fn: (client: PoolClient) => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i <= maxRetries; i++) {
    const client = await getPool().connect();
    try {
      return await fn(client);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, 100 * (i + 1)));
      }
    } finally {
      client.release();
    }
  }
  throw lastError;
}
