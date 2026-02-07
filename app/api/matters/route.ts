import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Matter, CreateMatterRequest, StageInfo } from '@/lib/types';
import { setMatter } from '@/lib/store';
import { runPipeline } from '@/lib/pipeline/engine';

const INITIAL_STAGES: StageInfo[] = [
  { id: 'intake', label: 'Intake & Scoping', status: 'pending' },
  { id: 'parsing', label: 'Document Parsing', status: 'pending' },
  { id: 'issue_analysis', label: 'Issue Analysis', status: 'pending' },
  { id: 'research', label: 'Legal Research', status: 'pending' },
  { id: 'synthesis', label: 'Synthesis & Reasoning', status: 'pending' },
  { id: 'drafting', label: 'Drafting', status: 'pending' },
  { id: 'adversarial_review', label: 'Adversarial Review', status: 'pending' },
  { id: 'guardrails', label: 'Guardrails & Approval', status: 'pending' },
  { id: 'deliverables', label: 'Final Deliverables', status: 'pending' },
];

export async function POST(request: NextRequest) {
  try {
    const body: CreateMatterRequest = await request.json();

    const matter: Matter = {
      id: uuidv4().slice(0, 8),
      createdAt: new Date().toISOString(),
      docType: body.docType,
      jurisdiction: 'Delaware',
      riskTolerance: body.riskTolerance,
      audience: body.audience,
      documentText: body.documentText,
      fileName: body.fileName,
      stages: INITIAL_STAGES.map((s) => ({ ...s })),
      currentStage: null,
      overallConfidence: 0,
      parsedSections: [],
      issues: [],
      guardrails: null,
      deliverables: [],
      auditLog: [],
      adversarialCritiques: [],
      draftRevised: false,
      status: 'processing',
    };

    await setMatter(matter);

    // Start pipeline in background (non-blocking)
    runPipeline(matter.id).catch(console.error);

    return NextResponse.json({ id: matter.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to create matter:', error);
    return NextResponse.json({ error: 'Failed to create matter' }, { status: 500 });
  }
}
