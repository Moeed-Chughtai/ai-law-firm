'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Matter, StageId, StageInfo } from '@/lib/types';
import Timeline from '@/components/matter/Timeline';
import StageDetail from '@/components/matter/StageDetail';
import TrustPanel from '@/components/matter/TrustPanel';
import { Scale, Shield, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-md shadow-brand-600/20">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 tracking-tight">LexForge</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                AI-Native Startup Law Firm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-mono text-gray-400">Matter</span>
              <span className="font-mono font-semibold text-gray-700 bg-surface-100 px-2 py-0.5 rounded">
                #{matter.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  matter.status === 'processing'
                    ? 'bg-brand-50 text-brand-700'
                    : matter.status === 'complete'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                }`}
              >
                {matter.status === 'processing' && (
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                )}
                {matter.status === 'processing'
                  ? 'Processing'
                  : matter.status === 'complete'
                    ? 'Complete'
                    : 'Error'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Confidential</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content — 3 Column Layout */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full grid grid-cols-[280px_1fr_320px] gap-0 min-h-0">
        {/* LEFT — Timeline */}
        <div className="border-r border-surface-200 bg-white/40 overflow-y-auto">
          <Timeline
            stages={matter.stages}
            currentStage={matter.currentStage}
            selectedStage={activeStageId}
            onSelectStage={handleStageSelect}
          />
        </div>

        {/* CENTER — Stage Detail */}
        <div className="overflow-y-auto bg-surface-50">
          <StageDetail matter={matter} activeStage={activeStage} />
        </div>

        {/* RIGHT — Trust Panel */}
        <div className="border-l border-surface-200 bg-white/40 overflow-y-auto">
          <TrustPanel matter={matter} />
        </div>
      </div>
    </div>
  );
}
