'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Matter, StageId, StageInfo } from '@/lib/types';
import Timeline from '@/components/matter/Timeline';
import StageDetail from '@/components/matter/StageDetail';
import TrustPanel from '@/components/matter/TrustPanel';
import { Scale, Shield, Loader2, ArrowLeft, MoreHorizontal } from 'lucide-react';
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

      // Auto-follow running stage ONLY if user hasn't manually clicked a stage
      if (!userSelectedRef.current) {
        const runningStage = data.stages.find((s) => s.status === 'running');
        if (runningStage) {
          setSelectedStage(runningStage.id);
        } else if (data.status === 'complete') {
          // When complete and user hasn't selected, show deliverables
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
      // Only poll if not complete/error - saves network requests
      if (!matter || matter.status === 'processing') {
        fetchMatter();
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [fetchMatter, matter?.status]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Matter Not Found</h2>
          <p className="text-gray-500">The requested matter could not be found.</p>
        </div>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading matter...</span>
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 h-16 flex-none">
        <div className="max-w-screen-2xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif font-semibold text-lg text-slate-900">LexForge</span>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-slate-500 text-xs">MATTER-{matter.id.slice(0, 6)}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 capitalize">
                {matter.docType.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <div className={`w-2 h-2 rounded-full ${matter.status === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="uppercase tracking-wide font-medium">{matter.status}</span>
            </div>
             <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6 grid grid-cols-12 gap-8 h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:block col-span-3 h-full overflow-y-auto pr-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
            <Timeline
              stages={matter.stages}
              currentStage={matter.currentStage}
              selectedStage={activeStageId}
              onSelectStage={handleStageSelect}
            />
            <div className="mt-auto border-t border-slate-100 p-4 bg-slate-50">
              <TrustPanel matter={matter} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 lg:col-span-9 h-full overflow-y-auto pb-20">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-full p-8 md:p-10 relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
             <StageDetail matter={matter} activeStage={activeStage} />
          </div>
        </main>
      </div>
    </div>
  );
}
