import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Initialize schema
export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const schemaPath = join(process.cwd(), 'lib/db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute the entire schema as one transaction
    await client.query(schema);
    
    await client.query('COMMIT');
    console.log('✅ Database schema initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Check if it's just "already exists" errors (which are fine)
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        console.log('ℹ️  Database schema already exists (some objects may have been created)');
        return; // Don't throw, it's okay
      }
    }
    
    console.error('⚠️  Database schema initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}
