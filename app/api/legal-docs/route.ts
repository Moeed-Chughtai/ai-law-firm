import { NextRequest, NextResponse } from 'next/server';
import { ingestLegalDocument, ingestBatch, getDocumentStats, listLegalDocuments, type DocumentSource } from '@/lib/rag/ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/legal-docs
 * Upload and ingest legal documents into the RAG system
 * Supports single document or batch upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const docType = formData.get('docType') as DocumentSource || 'other';
    const jurisdiction = formData.get('jurisdiction') as string | null;
    const citation = formData.get('citation') as string | null;

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Process all files
    const documents = await Promise.all(
      files.map(async (file) => {
        const content = await file.text();
        return {
          title: file.name.replace(/\.(txt|md|pdf)$/, ''),
          content,
          docType,
          jurisdiction: jurisdiction || undefined,
          citation: citation || undefined,
          metadata: {
            originalFilename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString()
          }
        };
      })
    );

    // Ingest documents (with rate limiting between documents)
    const results = await ingestBatch(documents, 300);

    const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);

    return NextResponse.json({
      success: true,
      documentsIngested: results.length,
      totalChunks,
      results: results.map(r => ({
        documentId: r.documentId,
        title: r.title,
        chunks: r.chunksCreated
      }))
    });
  } catch (error) {
    console.error('Legal document upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process legal documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/legal-docs
 * List all documents in the knowledge base
 * Optional query params: docType, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType') as DocumentSource | null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getDocumentStats();
      return NextResponse.json({ stats });
    }

    const documents = await listLegalDocuments(
      docType || undefined,
      limit,
      offset
    );

    return NextResponse.json({
      documents,
      count: documents.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Failed to list legal documents:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
