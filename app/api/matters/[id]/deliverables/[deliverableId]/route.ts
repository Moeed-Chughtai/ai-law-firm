import { NextRequest, NextResponse } from 'next/server';
import { getMatter } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; deliverableId: string } }
) {
  const matter = getMatter(params.id);

  if (!matter) {
    return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
  }

  const deliverable = matter.deliverables.find((d) => d.id === params.deliverableId);

  if (!deliverable) {
    return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
  }

  const contentType =
    deliverable.format === 'JSON' ? 'application/json' : 'text/markdown';

  return new NextResponse(deliverable.content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${deliverable.name.replace(/ /g, '_')}.${deliverable.format === 'JSON' ? 'json' : 'md'}"`,
    },
  });
}
