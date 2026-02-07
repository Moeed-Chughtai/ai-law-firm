import { NextRequest, NextResponse } from 'next/server';
import { getMatter } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matter = await getMatter(params.id);

    if (!matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    return NextResponse.json(matter);
  } catch (error) {
    console.error('Failed to fetch matter:', error);
    return NextResponse.json({ error: 'Failed to fetch matter' }, { status: 500 });
  }
}
