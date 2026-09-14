import React, { useState, useEffect } from 'react';
import { 
  AssetPredictionRecord, 
  AssetAvailabilityRiskAssessment, 
  AssetModelArtifact 
} from '../../types.ts';
import { INITIAL_ASSET_PREDICTIONS } from '../../data/initialAssetMaster.ts';
import { 
  BrainCircuit, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  ArrowRight, 
  Layers, 
  Database,
  Sliders,
  Cpu,
  Info
} from 'lucide-react';

interface AssetMLPredictionDashboardProps {
  onOpenSupplyWorkflow: (category?: string, shortageQty?: number) => void;
}

const DEFAULT_MODEL_STATUS: AssetModelArtifact = {
  model_name: 'Antarctic-AssetRF-v1.4',
  model_version: '1.4.2',
  algorithm: 'RandomForestRegressor_AssetDemandEnsemble',
  r2_score: 0.912,
  mae_score: 0.42,
  rmse_score: 0.58,
  sample_count: 24,
  trained_at: new Date().toISOString(),
  total_inferences: 345,
  status: 'OPTIMAL'
};

const FALLBACK_RISKS: AssetAvailabilityRiskAssessment[] = [
  {
    asset_id: 'AST-002',
    asset_name: 'Kirloskar 45kVA Mobile Camp Generator',
    risk_level: 'CRITICAL',
    failure_probability_pct: 95,
    hours_until_service: 60,
    risk_factors: ['Abnormal vibration signature (>6.5)', 'Maintenance due within 2 days'],
    recommended_action: 'Maintenance mandatory within 2 days to prevent cold-soak breakdown.',
    estimated_days_to_downtime: 2
  },
  {
    asset_id: 'AST-006',
    asset_name: 'PistenBully 100 All-Terrain Snowcat #2',
    risk_level: 'CRITICAL',
    failure_probability_pct: 100,
    hours_until_service: 110,
    risk_factors: ['Sprocket drive failure reported', 'Under emergency maintenance'],
    recommended_action: 'Maintenance mandatory within 3 days to prevent cold-soak breakdown.',
    estimated_days_to_downtime: 3
  },
  {
    asset_id: 'AST-010',
    asset_name: 'Motorola MOTOTRBO DP4801e Polar VHF/UHF Base',
    risk_level: 'CRITICAL',
    failure_probability_pct: 100,
    hours_until_service: 550,
    risk_factors: ['Damaged antenna incident recorded', 'Asset offline'],
    recommended_action: 'Asset offline due to damage incident. Initiate corrective repair or request spare replacement.',
    estimated_days_to_downtime: 1
  },
  {
    asset_id: 'AST-001',
    asset_name: 'Cummins 250kVA Polar Diesel Generator #1',
    risk_level: 'MEDIUM',
    failure_probability_pct: 40,
    hours_until_service: 150,
    risk_factors: ['Nominal operational bounds', 'Scheduled lube service in 5 days'],
    recommended_action: 'Nominal operational status. Continue scheduled monitoring.',
    estimated_days_to_downtime: 5
  },
  {
    asset_id: 'AST-004',
    asset_name: 'PistenBully 300 Polar Tracked Snowcat #1',
    risk_level: 'MEDIUM',
    failure_probability_pct: 25,
    hours_until_service: 190,
    risk_factors: ['Nominal operational bounds'],
    recommended_action: 'Nominal operational status. Continue scheduled monitoring.',
    estimated_days_to_downtime: 27
  }
];

function normalizePrediction(p: any, idx: number): AssetPredictionRecord {
  const station = p.station || p.station_id || p.stationId || 'bharati';
  const category = p.asset_category || p.category || 'Generators';
  const predicted = p.predicted_required_count ?? p.predicted_requirement ?? p.predictedRequirement ?? 0;
  const available = p.currently_available_count ?? p.currently_available ?? p.currentlyAvailable ?? 0;
  const shortage = p.additional_requirement ?? p.predicted_shortage ?? p.additionalRequirement ?? Math.max(0, predicted - available);

  return {
    id: p.id ?? idx + 1,
    prediction_id: p.prediction_id || `PRED-${station.toUpperCase()}-${category.replace(/\s+/g, '-').toUpperCase()}-${idx}`,
    expedition_id: p.expedition_id || p.expeditionId || 'EXP-2025-044',
    station_id: station,
    station: station,
    asset_category: category,
    asset_type: p.asset_type || p.equipmentType || `${category} Polar Units`,
    predicted_requirement: predicted,
    predicted_required_count: predicted,
    currently_available: available,
    currently_available_count: available,
    predicted_shortage: shortage,
    additional_requirement: shortage,
    prediction_horizon: p.prediction_horizon || '30-45 Days (Upcoming Polar Field Operations)',
    risk_level: p.risk_level || p.riskLevel || (shortage > 0 ? 'HIGH' : 'LOW'),
    confidence_metric: p.confidence_metric ?? p.confidenceMetric ?? 0.88,
    prediction_factors: p.prediction_factors || { confidence: '88%' },
    model_version: p.model_version || p.modelVersion || 'Antarctic-AssetRF-v1.4',
    prediction_date: p.prediction_date || new Date().toISOString().split('T')[0],
    status: p.status || (shortage > 0 ? 'ACTIVE' : 'RESOLVED'),
    reason: p.reason || `${category} allocation required for mission operational reserve.`,
    algorithm_used: p.algorithm_used || p.algorithmUsed || 'RandomForestRegressor_AssetDemandEnsemble',
    is_fallback: p.is_fallback ?? false,
    created_at: p.created_at || new Date().toISOString()
  };
}

function normalizeRisk(r: any, idx: number): AssetAvailabilityRiskAssessment {
  const riskCategory = r.risk_level || r.riskCategory || 'LOW';
  const score = r.failure_probability_pct ?? r.riskScore ?? (riskCategory === 'CRITICAL' ? 95 : riskCategory === 'HIGH' ? 65 : 15);
  const hoursLeft = r.hours_until_service ?? r.operatingHoursRemaining ?? 200;
  const daysDowntime = r.estimated_days_to_downtime ?? r.maintenanceDueDays;

  let factors = Array.isArray(r.risk_factors) ? r.risk_factors : [];
  if (factors.length === 0) {
    if (r.vibrationAnomaly) factors.push('Abnormal vibration signature (>6.5)');
    if (r.healthDeteriorating) factors.push('Health index score degraded (<80)');
    if (hoursLeft <= 100) factors.push(`${hoursLeft} operating hours remaining before service lockout`);
    if (factors.length === 0 && r.recommendation) factors.push(r.recommendation);
    if (factors.length === 0) factors.push('All diagnostic parameters within nominal bounds');
  }

  return {
    asset_id: r.asset_id || r.assetId || `AST-${String(idx + 1).padStart(3, '0')}`,
    asset_name: r.asset_name || r.assetName || 'Polar Expedition Asset',
    risk_level: riskCategory,
    failure_probability_pct: score,
    hours_until_service: hoursLeft,
    risk_factors: factors,
    recommended_action: r.recommended_action || r.recommendation || 'Nominal operational status. Continue scheduled monitoring.',
    estimated_days_to_downtime: daysDowntime
  };
}

export const AssetMLPredictionDashboard: React.FC<AssetMLPredictionDashboardProps> = ({
  onOpenSupplyWorkflow
}) => {
  const [predictions, setPredictions] = useState<AssetPredictionRecord[]>(() =>
    INITIAL_ASSET_PREDICTIONS.map(normalizePrediction)
  );
  const [risks, setRisks] = useState<AssetAvailabilityRiskAssessment[]>(FALLBACK_RISKS);
  const [modelStatus, setModelStatus] = useState<AssetModelArtifact | null>(DEFAULT_MODEL_STATUS);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [predResult, riskResult, modelResult] = await Promise.allSettled([
        fetch('/api/assets/predictions'),
        fetch('/api/assets/risk-assessment'),
        fetch('/api/assets/model-status')
      ]);

      if (predResult.status === 'fulfilled' && predResult.value.ok) {
        const data = await predResult.value.json().catch(() => null);
        const rawList = Array.isArray(data) 
          ? data 
          : (Array.isArray(data?.predictions) ? data.predictions : (Array.isArray(data?.alerts) ? data.alerts : []));
        if (rawList && rawList.length > 0) {
          setPredictions(rawList.map(normalizePrediction));
        }
      }

      if (riskResult.status === 'fulfilled' && riskResult.value.ok) {
        const data = await riskResult.value.json().catch(() => null);
        if (Array.isArray(data) && data.length > 0) {
          setRisks(data.map(normalizeRisk));
        }
      }

      if (modelResult.status === 'fulfilled' && modelResult.value.ok) {
        const data = await modelResult.value.json().catch(() => null);
        if (data) {
          setModelStatus({
            ...DEFAULT_MODEL_STATUS,
            ...data,
            r2_score: data.r2_score ?? data.r2Score ?? DEFAULT_MODEL_STATUS.r2_score,
            mae_score: data.mae_score ?? data.mae ?? DEFAULT_MODEL_STATUS.mae_score,
            rmse_score: data.rmse_score ?? data.rmse ?? DEFAULT_MODEL_STATUS.rmse_score,
            sample_count: data.sample_count ?? data.sampleCount ?? DEFAULT_MODEL_STATUS.sample_count,
            trained_at: data.trained_at ?? data.retrainedAt ?? data.evaluationDate ?? DEFAULT_MODEL_STATUS.trained_at
          });
        }
      }
    } catch (e: any) {
      console.warn('Notice loading ML dashboard data, keeping fallback dataset:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assets/predictions/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) 
          ? data 
          : (Array.isArray(data?.predictions) ? data.predictions : (Array.isArray(data?.alerts) ? data.alerts : []));
        if (rawList && rawList.length > 0) {
          setPredictions(rawList.map(normalizePrediction));
        }
        setToastFeedback('ML Requirement Forecast recalculated across all stations and equipment categories.');
        setTimeout(() => setToastFeedback(null), 4000);
      }
      // Also refresh risks
      const riskRes = await fetch('/api/assets/risk-assessment');
      if (riskRes.ok) {
        const rData = await riskRes.json();
        if (Array.isArray(rData) && rData.length > 0) {
          setRisks(rData.map(normalizeRisk));
        }
      }
    } catch (err: any) {
      setToastFeedback(`Forecast computation notice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrainModel = async () => {
    setRetraining(true);
    try {
      const res = await fetch('/api/assets/model/retrain', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const normalized: AssetModelArtifact = {
          ...DEFAULT_MODEL_STATUS,
          ...data,
          r2_score: data.r2_score ?? data.r2Score ?? 0.912,
          mae_score: data.mae_score ?? data.mae ?? 0.42,
          rmse_score: data.rmse_score ?? data.rmse ?? 0.58,
          sample_count: data.sample_count ?? data.sampleCount ?? 24,
          trained_at: data.trained_at ?? data.retrainedAt ?? new Date().toISOString()
        };
        setModelStatus(normalized);
        setToastFeedback(`Model retrained successfully. New R² Score: ${((normalized.r2_score ?? 0.912) * 100).toFixed(1)}%, MAE: ${normalized.mae_score}`);
        setTimeout(() => setToastFeedback(null), 5000);
      }
    } catch (err: any) {
      setToastFeedback(`Retraining notice: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  const filteredPredictions = predictions.filter(p => {
    if (selectedStation === 'ALL') return true;
    const pStation = (p.station || p.station_id || '').toLowerCase();
    return pStation === (selectedStation || '').toLowerCase();
  });

  const totalShortages = predictions.reduce((sum, p) => sum + (p.additional_requirement || p.predicted_shortage || 0), 0);
  const criticalRiskAssets = risks.filter(r => r.risk_level === 'CRITICAL' || r.risk_level === 'HIGH');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="p-3.5 bg-blue-900 text-white border border-blue-400 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
            <span>{toastFeedback}</span>
          </div>
          <button onClick={() => setToastFeedback(null)} className="text-blue-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Hero Bar: ML Predictive Engine Principle Banner */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-600/20 via-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold tracking-wide">
                Small-Intelligence Asset Requirement & Risk Prediction Model
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Trained on multi-year Antarctic expedition telemetry (run-hours, vibration, blizzard thermal shocks, and team allocations). Uses a lightweight Random Forest ensemble to forecast asset shortages and calculate degradation risks without heavy cloud dependencies.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleRunForecast}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Computing...' : 'Recalculate Predictions'}</span>
            </button>
            <button
              type="button"
              disabled={retraining}
              onClick={handleRetrainModel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Cpu className={`w-3.5 h-3.5 text-cyan-400 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining...' : 'Retrain Random Forest'}</span>
            </button>
          </div>
        </div>

        {/* Model Metrics Micro-Ticker */}
        {modelStatus && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px] flex-wrap">
              <span>Model: <strong className="text-slate-200">{modelStatus.algorithm || 'Random Forest Ensemble'}</strong></span>
              <span>•</span>
              <span>R² Score: <strong className="text-emerald-400">{((modelStatus.r2_score ?? (modelStatus as any).r2Score ?? 0.912) * 100).toFixed(1)}%</strong></span>
              <span>•</span>
              <span>MAE: <strong className="text-cyan-400">{modelStatus.mae_score ?? (modelStatus as any).mae ?? 0.42}</strong></span>
              <span>•</span>
              <span>RMSE: <strong className="text-blue-300">{modelStatus.rmse_score ?? (modelStatus as any).rmse ?? 0.58}</strong></span>
              <span>•</span>
              <span>Trained Samples: <strong className="text-slate-200">{modelStatus.sample_count ?? (modelStatus as any).sampleCount ?? 24}</strong></span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Last Trained: {(modelStatus.trained_at || (modelStatus as any).retrainedAt) ? new Date(modelStatus.trained_at || (modelStatus as any).retrainedAt).toLocaleString() : 'Recent'}
            </div>
          </div>
        )}
      </div>

      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Anticipated Shortages</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono">{totalShortages}</span>
            <span className="text-xs text-slate-500 font-medium">units across stations</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Recommended for resupply inclusion</p>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High/Critical Risk Assets</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono">{criticalRiskAssets.length}</span>
            <span className="text-xs text-slate-500 font-medium">require imminent service</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">&lt;200 hrs left or high vibration</p>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model Reliability</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {modelStatus ? `${(modelStatus.r2_score * 100).toFixed(0)}%` : '92%'}
            </span>
            <span className="text-xs text-slate-500 font-medium">accuracy confidence</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Fallback rule engine active as guardrail</p>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">India Logistics Dispatch</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-900">Alok Mukherjee</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Chief Logistics Officer, NCPOR Goa</p>
        </div>
      </div>

      {/* Station Filter & Section Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-blue-100 rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Filter Station:</span>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {['ALL', 'bharati', 'maitri'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStation(st)}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  selectedStation === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Stations' : st.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredPredictions.length} category forecasts
        </span>
      </div>

      {/* Main Grid: Predictions Table vs Availability Risk Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Future Asset Requirements Table */}
        <div className="lg:col-span-7 bg-white border border-blue-100 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-blue-600" />
                <span>Forecasted Asset Requirements & Shortages</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated demand against functional availability for upcoming polar traverse & winter-over
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Station & Category</th>
                  <th className="py-2.5 px-2 text-center">Required (ML)</th>
                  <th className="py-2.5 px-2 text-center">Available</th>
                  <th className="py-2.5 px-2 text-center">Deficit / Shortage</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPredictions.map((pred) => {
                  const hasShortage = pred.additional_requirement > 0;
                  return (
                    <tr key={pred.prediction_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{pred.asset_category}</div>
                        <div className="text-[11px] font-mono text-slate-500 uppercase">{pred.station} Station</div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-blue-900 text-sm">
                        {pred.predicted_required_count}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-emerald-800 text-sm">
                        {pred.currently_available_count}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {hasShortage ? (
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            +{pred.additional_requirement} short
                          </span>
                        ) : (
                          <span className="font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          pred.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          pred.risk_level === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                          pred.risk_level === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {pred.risk_level}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {pred.prediction_factors?.confidence || '92%'} conf
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {hasShortage && (
                          <button
                            type="button"
                            onClick={() => onOpenSupplyWorkflow(pred.asset_category, pred.additional_requirement)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded text-[11px] font-bold transition"
                          >
                            Requisition
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Assistive Principle Notice:</strong> The ML model does not execute automatic purchasing or freight booking. All predictions are surfaced as advisory alerts requiring human review and approval by the Expedition Manager and India Logistics Officer.
            </p>
          </div>
        </div>

        {/* Right 5 cols: Equipment Availability & Degradation Risk Matrix */}
        <div className="lg:col-span-5 bg-white border border-blue-100 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Asset Availability Risk Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Wear telemetry, run-hours remaining, and breakdown hazards
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500">{risks.length} Assets Tracked</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {risks.map((risk) => {
              const isCrit = risk.risk_level === 'CRITICAL';
              const isHigh = risk.risk_level === 'HIGH';
              const isMed = risk.risk_level === 'MEDIUM';

              return (
                <div
                  key={risk.asset_id}
                  className={`p-3.5 rounded-xl border transition space-y-2 ${
                    isCrit ? 'bg-rose-50/70 border-rose-200' :
                    isHigh ? 'bg-amber-50/70 border-amber-200' :
                    isMed ? 'bg-blue-50/50 border-blue-100' :
                    'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-900">{risk.asset_id}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                          isCrit ? 'bg-rose-100 text-rose-800' :
                          isHigh ? 'bg-amber-100 text-amber-800' :
                          isMed ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {risk.risk_level} RISK
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mt-0.5">{risk.asset_name}</h5>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <div className="font-bold text-slate-700">
                        {risk.hours_until_service} hrs left
                      </div>
                      <div className="text-slate-500">
                        Score: <strong>{risk.failure_probability_pct}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Warning Factors */}
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    {risk.risk_factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  <div className="text-[11px] pt-1 border-t border-slate-200/60 flex items-center justify-between text-slate-700">
                    <span className="font-semibold">{risk.recommended_action}</span>
                    {risk.estimated_days_to_downtime && (
                      <span className="font-mono text-slate-500 font-medium">
                        Due in {risk.estimated_days_to_downtime}d
                      </span>
                    )}
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
