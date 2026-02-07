import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';

// Initialize database on first API call
let initialized = false;

export async function GET() {
  if (!initialized) {
    try {
      await initializeDatabase();
      initialized = true;
      return NextResponse.json({ status: 'Database initialized' });
    } catch (error) {
      return NextResponse.json(
        { error: 'Database initialization failed', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({ status: 'Already initialized' });
}
