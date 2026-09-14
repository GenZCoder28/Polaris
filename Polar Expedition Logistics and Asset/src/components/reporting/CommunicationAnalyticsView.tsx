import React from 'react';
import { 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send, 
  RefreshCw, 
  Layers, 
  ShieldCheck,
  Signal
} from 'lucide-react';
import { CommunicationReportSummary } from '../../types.ts';

interface CommunicationAnalyticsViewProps {
  commData: CommunicationReportSummary | null;
  loading: boolean;
}

export const CommunicationAnalyticsView: React.FC<CommunicationAnalyticsViewProps> = ({
  commData,
  loading,
}) => {
  if (loading || !commData) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        Polling satellite link and message dispatch logs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Dispatches</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {commData.totalDispatches}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Across Iridium, SMS, Email, and In-App
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Delivered Messages</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {commData.deliveredCount}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
            {commData.deliverySuccessRate}% Success Ratio
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">In-Queue / Retrying</span>
            <RefreshCw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {commData.pendingCount}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Backoff exponential retries
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Permanent Failures</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {commData.failedCount}
          </div>
          <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
            Dead-letter queue audited
          </span>
        </div>
      </div>

      {/* Breakdown by Module and Channel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Dispatches by Originating Module</span>
          </h3>

          <div className="space-y-2">
            {Object.entries(commData.breakdownByModule || {}).map(([mod, rawCount]) => {
              const count = Number(rawCount);
              const total = Number(commData.totalDispatches) || 1;
              const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
              return (
                <div key={mod} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700 capitalize">{mod} Module</span>
                    <span className="font-mono text-slate-900 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Dispatches by Channel Medium</span>
          </h3>

          <div className="space-y-2">
            {Object.entries(commData.breakdownByChannel || {}).map(([ch, rawCount]) => {
              const count = Number(rawCount);
              const total = Number(commData.totalDispatches) || 1;
              const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
              return (
                <div key={ch} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">{ch} Channel</span>
                    <span className="font-mono text-slate-900 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
