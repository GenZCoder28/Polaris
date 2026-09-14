import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Calculator, Target, Database, CheckCircle2 } from 'lucide-react';
import { KpiDefinition } from '../../types.ts';
import { fetchReportingKpiDefinitionsApi } from '../../lib/api.ts';

interface KpiDefinitionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KpiDefinitionsModal: React.FC<KpiDefinitionsModalProps> = ({ isOpen, onClose }) => {
  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetchReportingKpiDefinitionsApi()
      .then((data) => {
        if (isMounted) {
          setKpis(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch KPI definitions:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['ALL', 'EXPEDITION', 'PERSONNEL', 'CARGO_CONTAINER', 'SHIPMENT', 'INVENTORY', 'ASSET', 'SAFETY_EMERGENCY', 'COMMUNICATION'];

  const filteredKpis = kpis.filter((kpi) => {
    const matchesCat = selectedCategory === 'ALL' || kpi.category === selectedCategory;
    const q = (search || '').toLowerCase();
    const name = (kpi.name || '').toLowerCase();
    const code = (kpi.code || '').toLowerCase();
    const desc = (kpi.description || '').toLowerCase();
    const formula = (kpi.formula || '').toLowerCase();

    const matchesSearch = !q || name.includes(q) || code.includes(q) || desc.includes(q) || formula.includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Standard Operational KPI Dictionary</h2>
              <p className="text-xs text-slate-500">Official mathematical formulas, baseline benchmarks, and authoritative data sources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search KPI code, formula, or term..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading authoritative definitions...</div>
          ) : filteredKpis.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No KPIs match the search criteria.</div>
          ) : (
            filteredKpis.map((kpi) => (
              <div
                key={kpi.code}
                className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-xs transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {kpi.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{kpi.name}</h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Unit: {kpi.unit}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3">{kpi.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-2">
                    <Calculator className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-semibold text-slate-700 text-[10px] uppercase tracking-wider">Formula</span>
                      <code className="font-mono text-[11px] text-blue-900 font-semibold">{kpi.formula}</code>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-semibold text-slate-700 text-[10px] uppercase tracking-wider">Target / Standard</span>
                      <span className="text-[11px] text-slate-800">{kpi.targetOrBenchmark}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Database className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-semibold text-slate-700 text-[10px] uppercase tracking-wider">Source Registry</span>
                      <span className="text-[11px] text-slate-800">{kpi.authoritativeSource}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Standards compliant with Antarctic Treaty System (ATCM) Operational Guidelines</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
          >
            Close Dictionary
          </button>
        </div>
      </div>
    </div>
  );
};
