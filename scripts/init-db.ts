/**
 * Database initialization script
 * Run with: npx tsx scripts/init-db.ts
 */

import { initializeDatabase } from '../lib/db/client';
import { pool } from '../lib/db/client';

async function main() {
  console.log('Initializing database...');

  try {
    await initializeDatabase();
    console.log('Database initialized successfully');

    const result = await pool.query('SELECT NOW()');
    console.log('Database connection test:', result.rows[0].now);

    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

main();
