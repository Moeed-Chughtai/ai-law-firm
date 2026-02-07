import { NextRequest, NextResponse } from 'next/server';
import { getMatter } from '@/lib/store';
import { generateHearingScripts } from '@/lib/hearing/generateScripts';
import { Issue } from '@/lib/types';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const ELEVENLABS_VOICE_IDS = [
  process.env.ELEVENLABS_VOICE_ID_1 || DEFAULT_VOICE_ID,
  process.env.ELEVENLABS_VOICE_ID_2 || DEFAULT_VOICE_ID,
  process.env.ELEVENLABS_VOICE_ID_3 || DEFAULT_VOICE_ID,
  process.env.ELEVENLABS_VOICE_ID_4 || DEFAULT_VOICE_ID,
];
const SYNTHESIS_VOICE_ID = process.env.ELEVENLABS_VOICE_SYNTHESIS || DEFAULT_VOICE_ID;

async function textToSpeechBase64(text: string, voiceId: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set. Add it to .env.local to use The Hearing.');
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${err}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

function pickIssueForHearing(issues: Issue[]): Issue | null {
  const withResearch = issues.filter((i) => i.research && i.synthesis);
  if (withResearch.length === 0) return null;
  const criticalOrHigh = withResearch.find((i) => i.severity === 'critical' || i.severity === 'high');
  return criticalOrHigh || withResearch[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const matterId = body.matterId as string | undefined;
    const issueId = body.issueId as string | undefined;

    if (!matterId) {
      return NextResponse.json({ error: 'matterId is required' }, { status: 400 });
    }

    const matter = await getMatter(matterId);
    if (!matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    const issue = issueId
      ? matter.issues.find((i) => i.id === issueId)
      : pickIssueForHearing(matter.issues);

    if (!issue || !issue.research) {
      return NextResponse.json(
        { error: 'No issue with research found. Run the pipeline first.' },
        { status: 400 }
      );
    }

    const { issueTitle, issueSeverity, agentSegments, synthesisScript } =
      generateHearingScripts(issue);

    const segments: { agentRole: string; agentName: string; script: string; audioBase64: string }[] = [];

    for (let i = 0; i < agentSegments.length; i++) {
      const seg = agentSegments[i];
      const voiceId = ELEVENLABS_VOICE_IDS[i % ELEVENLABS_VOICE_IDS.length];
      const audioBase64 = await textToSpeechBase64(seg.script, voiceId);
      segments.push({ ...seg, audioBase64 });
    }

    const synthesisAudioBase64 = await textToSpeechBase64(synthesisScript, SYNTHESIS_VOICE_ID);

    return NextResponse.json({
      issueTitle,
      issueSeverity,
      segments,
      synthesis: { script: synthesisScript, audioBase64: synthesisAudioBase64 },
    });
  } catch (error) {
    console.error('Hearing API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
