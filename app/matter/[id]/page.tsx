'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Matter, StageId, StageInfo } from '@/lib/types';
import Timeline from '@/components/matter/Timeline';
import StageDetail from '@/components/matter/StageDetail';
import TrustPanel from '@/components/matter/TrustPanel';
import { Scale, Loader2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function MatterPage() {
  const params = useParams();
  const matterId = params.id as string;

  const [matter, setMatter] = useState<Matter | null>(null);
  const [selectedStage, setSelectedStage] = useState<StageId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userSelectedRef = useRef(false);

  const fetchMatter = useCallback(async () => {
    try {
      const res = await fetch(`/api/matters/${matterId}`);
      if (!res.ok) {
        setError('Matter not found');
        return;
      }
      const data: Matter = await res.json();
      setMatter(data);

      if (!userSelectedRef.current) {
        const runningStage = data.stages.find((s) => s.status === 'running');
        if (runningStage) {
          setSelectedStage(runningStage.id);
        } else if (data.status === 'complete') {
          setSelectedStage('deliverables');
        }
      }
    } catch (err) {
      console.error('Failed to fetch matter:', err);
    }
  }, [matterId]);

  useEffect(() => {
    fetchMatter();
    const interval = setInterval(() => {
      if (!matter || matter.status === 'processing') {
        fetchMatter();
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [fetchMatter, matter?.status]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-25">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Matter not found</h2>
          <p className="text-sm text-gray-500">The requested matter could not be located.</p>
          <Link href="/" className="mt-4 inline-flex text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Back to intake
          </Link>
        </div>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-25">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading matter…</span>
        </div>
      </div>
    );
  }

  const handleStageSelect = (stageId: StageId) => {
    userSelectedRef.current = true;
    setSelectedStage(stageId);
  };

  const activeStageId = selectedStage || matter.currentStage || 'intake';
  const activeStage = matter.stages.find((s) => s.id === activeStageId) || matter.stages[0];

  return (
    <div className="min-h-screen bg-gray-25 flex flex-col">
      {/* ── Top Nav ── */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 h-14 flex-none">
        <div className="max-w-screen-2xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-base text-gray-900">LexForge</span>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-gray-400 text-xs">#{matter.id.slice(0, 8)}</span>
              <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200 capitalize">
                {matter.docType.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white">
              <div className={`w-1.5 h-1.5 rounded-full ${matter.status === 'processing' ? 'bg-warning-500 animate-pulse-slow' : 'bg-success-500'}`} />
              <span className="font-medium capitalize">{matter.status}</span>
            </div>
            <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-5 grid grid-cols-12 gap-6 h-[calc(100vh-56px)] overflow-hidden">

        {/* Left Sidebar — Timeline + Trust */}
        <aside className="hidden lg:flex lg:col-span-3 h-full flex-col gap-4">
          <div className="card overflow-y-auto flex flex-col" style={{ height: 'calc(100% - 240px)' }}>
            <Timeline
              stages={matter.stages}
              currentStage={matter.currentStage}
              selectedStage={activeStageId}
              onSelectStage={handleStageSelect}
            />
          </div>
          <div className="card p-4 h-[220px] shrink-0 overflow-y-auto">
            <TrustPanel matter={matter} />
          </div>
        </aside>

        {/* Center Content — Stage Detail */}
        <main className="col-span-12 lg:col-span-9 h-full overflow-y-auto">
          <div className="card min-h-full p-8">
            <StageDetail matter={matter} activeStage={activeStage} />
          </div>
        </main>
      </div>
    </div>
  );
}
