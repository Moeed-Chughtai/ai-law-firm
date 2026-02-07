'use client';

import { useState, useRef, useCallback } from 'react';
import { Matter } from '@/lib/types';
import { Mic, Loader2, Play, Square, Users } from 'lucide-react';

interface HearingSegment {
  agentRole: string;
  agentName: string;
  script: string;
  audioBase64: string;
}

interface HearingData {
  issueTitle: string;
  issueSeverity: string;
  segments: HearingSegment[];
  synthesis: { script: string; audioBase64: string };
}

export default function Hearing({ matter }: { matter: Matter }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HearingData | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasEligibleIssue = matter.issues?.some((i) => i.research && i.synthesis);

  const playSegment = useCallback(
    (index: number, segments: HearingSegment[], synthesisAudio: string) => {
      if (index < segments.length) {
        const seg = segments[index];
        const src = `data:audio/mpeg;base64,${seg.audioBase64}`;
        setPlayingIndex(index);
        const audio = new Audio(src);
        audioRef.current = audio;
        audio.onended = () => playSegment(index + 1, segments, synthesisAudio);
        audio.onerror = () => setPlayingIndex(-1);
        audio.play().catch(() => setPlayingIndex(-1));
      } else {
        setPlayingIndex(segments.length);
        const audio = new Audio(`data:audio/mpeg;base64,${synthesisAudio}`);
        audioRef.current = audio;
        audio.onended = () => {
          setPlayingIndex(-1);
          audioRef.current = null;
        };
        audio.onerror = () => setPlayingIndex(-1);
        audio.play().catch(() => setPlayingIndex(-1));
      }
    },
    []
  );

  const handleStart = async () => {
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch('/api/hearing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matterId: matter.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate hearing');
      setData(json);
      playSegment(0, json.segments, json.synthesis.audioBase64);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingIndex(-1);
  };

  if (!hasEligibleIssue) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-indigo-50/80 to-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Mic className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">The Hearing</h3>
          <p className="text-xs text-gray-600">
            Hear how the four research agents reached consensus on your top issue.
          </p>
        </div>
      </div>

      {!data && !error && (
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="btn-primary w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating audio…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Hear how we got here
            </>
          )}
        </button>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </span>
              <p className="text-sm font-semibold text-gray-900">{data.issueTitle}</p>
              <p className="text-xs text-gray-600 capitalize">{data.issueSeverity} severity</p>
            </div>
            {playingIndex >= 0 && (
              <button
                type="button"
                onClick={handleStop}
                className="btn-secondary text-xs py-1.5 px-2.5"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            )}
          </div>

          <div className="grid gap-3">
            {data.segments.map((seg, idx) => (
              <div
                key={seg.agentRole}
                className={`rounded-lg border p-4 transition-all ${
                  playingIndex === idx
                    ? 'border-indigo-400 bg-indigo-50/80 shadow-sm'
                    : playingIndex > idx
                      ? 'border-gray-200 bg-gray-50/50'
                      : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      playingIndex === idx ? 'bg-indigo-200' : 'bg-gray-100'
                    }`}
                  >
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{seg.agentName}</span>
                  {playingIndex === idx && (
                    <span className="text-xs text-indigo-600 font-medium animate-pulse">
                      Speaking…
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{seg.script}</p>
              </div>
            ))}

            <div
              className={`rounded-lg border-2 p-4 transition-all ${
                playingIndex === data.segments.length
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : playingIndex > data.segments.length
                    ? 'border-gray-200 bg-gray-50/50'
                    : 'border-gray-200 bg-white border-dashed'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    playingIndex === data.segments.length ? 'bg-indigo-200' : 'bg-gray-100'
                  }`}
                >
                  <Play className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Consensus</span>
                {playingIndex === data.segments.length && (
                  <span className="text-xs text-indigo-600 font-medium animate-pulse">
                    Speaking…
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                {data.synthesis.script}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
