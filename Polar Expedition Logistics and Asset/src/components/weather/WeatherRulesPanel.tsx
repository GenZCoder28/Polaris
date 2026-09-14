import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  Filter,
  Info,
  X,
  Play
} from 'lucide-react';
import { WeatherRule, WeatherSeverity, WeatherEnvironmentType, WeatherRuleOperator } from '../../types';

interface WeatherRulesPanelProps {
  rules: WeatherRule[];
  onToggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  onCreateRule: (rule: Omit<WeatherRule, 'id'>) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onRunCheck: () => Promise<void>;
}

export const WeatherRulesPanel: React.FC<WeatherRulesPanelProps> = ({
  rules,
  onToggleRule,
  onCreateRule,
  onDeleteRule,
  onRunCheck,
}) => {
  const [filterEnv, setFilterEnv] = useState<'ALL' | WeatherEnvironmentType>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | WeatherSeverity>('ALL');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEnv, setFormEnv] = useState<WeatherEnvironmentType>('STATION');
  const [formParam, setFormParam] = useState('wind_speed');
  const [formOperator, setFormOperator] = useState<WeatherRuleOperator>('>=');
  const [formThreshold, setFormThreshold] = useState<number>(60);
  const [formSeverity, setFormSeverity] = useState<WeatherSeverity>('WARNING');
  const [formDescription, setFormDescription] = useState('');
  const [hasCombined, setHasCombined] = useState<boolean>(false);
  const [combParam, setCombParam] = useState('visibility');
  const [combOperator, setCombOperator] = useState<WeatherRuleOperator>('<=');
  const [combThreshold, setCombThreshold] = useState<number>(400);

  const filteredRules = rules.filter((r) => {
    if (filterEnv !== 'ALL' && r.environment_type !== filterEnv) return false;
    if (filterSeverity !== 'ALL' && r.severity !== filterSeverity) return false;
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim()) return;

    const newRule: Omit<WeatherRule, 'id'> = {
      name: formName.trim(),
      environment_type: formEnv,
      parameter: formParam,
      operator: formOperator,
      threshold: Number(formThreshold),
      severity: formSeverity,
      enabled: true,
      description: formDescription.trim(),
      combined_conditions: hasCombined ? [
        { parameter: combParam, operator: combOperator, threshold: Number(combThreshold) }
      ] : undefined,
    };

    await onCreateRule(newRule);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName('');
    setFormEnv('STATION');
    setFormParam('wind_speed');
    setFormOperator('>=');
    setFormThreshold(60);
    setFormSeverity('WARNING');
    setFormDescription('');
    setHasCombined(false);
  };

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      await onRunCheck();
    } finally {
      setEvaluating(false);
    }
  };

  const getUnit = (param: string) => {
    switch (param) {
      case 'wind_speed':
      case 'wind_gust': return 'km/h';
      case 'temperature':
      case 'apparent_temperature': return '°C';
      case 'visibility': return 'm';
      case 'pressure': return 'hPa';
      case 'wave_height': return 'm';
      case 'wave_period': return 's';
      case 'snow': return 'cm/h';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">
            Deterministic Safety Threshold Engine (Strictly Non-AI / Non-LLM)
          </div>
          <p className="text-slate-600 leading-relaxed">
            Safety rules evaluate continuous numerical meteorological telemetry against certified NCPOR Polar Expedition Manual SOPs and IMO Polar Maritime Codes. When a parameter or combination of parameters breaches threshold, the system immediately registers an auditable Weather Event and dispatches pre-approved emergency instructions to assigned personnel.
          </p>
        </div>
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter:</span>
          </div>

          {/* Env Filter */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {(['ALL', 'STATION', 'SHIP'] as const).map((env) => (
              <button
                key={env}
                onClick={() => setFilterEnv(env)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  filterEnv === env ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {(['ALL', 'CRITICAL', 'WARNING', 'WATCH'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  filterSeverity === sev ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
            title="Execute rule evaluation across all stations and vessels"
          >
            <Play className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin text-blue-600' : ''}`} />
            <span>{evaluating ? 'Evaluating...' : 'Test Rules Against Live Data'}</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Safety Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="divide-y divide-slate-100">
          {filteredRules.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No rules match the selected filters.
            </div>
          ) : (
            filteredRules.map((rule) => {
              const isCrit = rule.severity === 'CRITICAL';
              const isWarn = rule.severity === 'WARNING';

              return (
                <div key={rule.id} className="p-4 hover:bg-slate-50/50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        isCrit ? 'bg-rose-100 text-rose-800' : isWarn ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rule.severity}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        {rule.environment_type}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{rule.name}</h4>
                      {!rule.enabled && (
                        <span className="text-[10px] text-slate-400 font-mono italic">(Disabled)</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.description}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-700">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {rule.parameter} {rule.operator} {rule.threshold} {getUnit(rule.parameter)}
                      </span>
                      {rule.combined_conditions?.map((c, i) => (
                        <span key={i} className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          + {c.parameter} {c.operator} {c.threshold} {getUnit(c.parameter)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => onToggleRule(rule.id, !rule.enabled)}
                      className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition"
                      title={rule.enabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      )}
                      <span className="text-[11px] font-medium">{rule.enabled ? 'Active' : 'Muted'}</span>
                    </button>

                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded hover:bg-rose-50"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Add Safety Rule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Configure Polar Safety Rule</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extreme Catabatic Wind Gust Protocol"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Environment</label>
                  <select
                    value={formEnv}
                    onChange={(e) => {
                      const env = e.target.value as WeatherEnvironmentType;
                      setFormEnv(env);
                      if (env === 'SHIP') setFormParam('wave_height');
                      else setFormParam('wind_speed');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="STATION">STATION (Polar Base)</option>
                    <option value="SHIP">SHIP (Marine Vessel)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Trigger</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as WeatherSeverity)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="WATCH">WATCH (Elevated Vigilance)</option>
                    <option value="WARNING">WARNING (Tethered Move / Check Lashing)</option>
                    <option value="CRITICAL">CRITICAL (Lockdown / Course Deviation)</option>
                  </select>
                </div>
              </div>

              {/* Primary Condition */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">Primary Parameter Condition</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Parameter</label>
                    <select
                      value={formParam}
                      onChange={(e) => setFormParam(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md bg-white text-slate-800"
                    >
                      <option value="wind_speed">Wind Speed</option>
                      <option value="wind_gust">Wind Gust</option>
                      <option value="temperature">Temperature</option>
                      <option value="apparent_temperature">Wind Chill</option>
                      <option value="visibility">Visibility</option>
                      <option value="pressure">Pressure</option>
                      {formEnv === 'SHIP' && (
                        <>
                          <option value="wave_height">Wave Height</option>
                          <option value="wave_period">Wave Period</option>
                        </>
                      )}
                      {formEnv === 'STATION' && (
                        <option value="snow">Snowfall Rate</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Operator</label>
                    <select
                      value={formOperator}
                      onChange={(e) => setFormOperator(e.target.value as WeatherRuleOperator)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md bg-white text-slate-800 font-mono font-bold"
                    >
                      <option value=">=">&gt;= (Greater or Equal)</option>
                      <option value="<=">&lt;= (Less or Equal)</option>
                      <option value=">">&gt; (Greater than)</option>
                      <option value="<">&lt; (Less than)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                      Threshold ({getUnit(formParam)})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Combined condition toggle */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCombined}
                    onChange={(e) => setHasCombined(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">
                    Add Combined Secondary Condition (e.g., AND Visibility &lt;= 400m)
                  </span>
                </label>

                {hasCombined && (
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">Parameter</label>
                      <select
                        value={combParam}
                        onChange={(e) => setCombParam(e.target.value)}
                        className="w-full px-2 py-1.5 border border-indigo-200 rounded-md bg-white text-slate-800"
                      >
                        <option value="visibility">Visibility</option>
                        <option value="temperature">Temperature</option>
                        <option value="wind_speed">Wind Speed</option>
                        <option value="wave_height">Wave Height</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">Operator</label>
                      <select
                        value={combOperator}
                        onChange={(e) => setCombOperator(e.target.value as WeatherRuleOperator)}
                        className="w-full px-2 py-1.5 border border-indigo-200 rounded-md bg-white text-slate-800 font-mono font-bold"
                      >
                        <option value="<=">&lt;= (Less or Equal)</option>
                        <option value=">=">&gt;= (Greater or Equal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                        Threshold ({getUnit(combParam)})
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={combThreshold}
                        onChange={(e) => setCombThreshold(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-indigo-200 rounded-md bg-white text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Safety Protocol Description & SOP Reference
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this threshold is hazardous and the mandated actions (e.g. SOP-NCPOR-STN-01: Station Lockdown)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs shadow-blue-500/20 transition"
                >
                  Save Safety Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
