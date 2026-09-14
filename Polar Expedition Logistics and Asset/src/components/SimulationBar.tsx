import React from 'react';
import { 
  Play, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ArrowRight,
  Sparkles,
  Ship,
  Flame,
  PackageCheck
} from 'lucide-react';

export interface SimulationBarProps {
  currentStep: number;
  totalSteps: number;
  onSelectStep: (step: number) => void;
  onNextStep: () => void;
  onReset: () => void;
  onExecuteAction: (actionKey: string) => void;
}

export const STEPS_CONFIG = [
  {
    step: 1,
    title: 'Plan Expedition & Requirements',
    tag: 'Mission & Indents',
    desc: 'Define mission parameters for Bharati Station (45 crew, 160 days). System automatically calculates vital requirements: 12,000 kg Food, 30,000 L Polar Diesel, 500 Medical units, and 2,000 kg Equipment.',
    actionKey: 'plan_and_requirements',
    actionLabel: 'Generate Plan & Auto-Requirements',
    targetTab: 'expeditions',
  },
  {
    step: 2,
    title: 'Cargo Stowage & Voyage Tracking',
    tag: 'Stowage & AIS',
    desc: 'Bin-packing optimization: Allocate 46.2t cargo into standard expedition containers with prioritized deck offloading sequence. Track MV Vasiliy Golovnin from Goa -> Cape Town -> Prydz Bay fast-ice.',
    actionKey: 'stowage_and_voyage',
    actionLabel: 'Stow Cargo & Advance Vessel',
    targetTab: 'cargo',
  },
  {
    step: 3,
    title: 'Station Resupply & Depletion Simulation',
    tag: 'Resupply & Depletion',
    desc: 'Offload containers to restock Bharati (+30,000 L Fuel, +12,000 kg Food), simulate 30 days of Antarctic winter consumption, detect 14-day resupply deficit, and apply AI fuel rationing (-12%).',
    actionKey: 'resupply_and_depletion',
    actionLabel: 'Simulate Delivery & Depletion Deficit',
    targetTab: 'inventory',
  },
  {
    step: 4,
    title: 'Emergency Incident & Command Response',
    tag: 'Incident & Response',
    desc: 'Simulate Station APU-2 generator thermal overload at Bharati Station, trigger station-wide safety alert, deploy PistenBully snowcat rescue team, and execute emergency containment protocol.',
    actionKey: 'emergency_and_response',
    actionLabel: 'Trigger & Contain Emergency',
    targetTab: 'emergency',
  },
];

export const SimulationBar: React.FC<SimulationBarProps> = ({
  currentStep,
  totalSteps,
  onSelectStep,
  onNextStep,
  onReset,
  onExecuteAction,
}) => {
  const currentConfig = STEPS_CONFIG.find((s) => s.step === currentStep) || STEPS_CONFIG[0];

  return (
    <div className="bg-white border-b border-blue-200 shadow-xs px-4 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Header line */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                End-to-End Antarctic Mission Lifecycle Simulation
              </span>
              <span className="text-xs text-slate-500 ml-2 hidden sm:inline">
                (NCPOR Guided Workflow: Mission & Indents → Stowage & Voyage → Station Resupply & Depletion → Emergency Response)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 transition font-medium cursor-pointer"
              title="Reset state to initial scenario"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Demo</span>
            </button>
            <button
              onClick={onNextStep}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 px-3 py-1 rounded transition shadow-xs cursor-pointer"
            >
              <span>Next Stage ({Math.min(currentStep + 1, totalSteps)}/{totalSteps})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Step Progress Tracker Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {STEPS_CONFIG.map((cfg) => {
            const isCompleted = cfg.step < currentStep;
            const isCurrent = cfg.step === currentStep;
            return (
              <button
                key={cfg.step}
                onClick={() => onSelectStep(cfg.step)}
                className={`text-left p-2.5 rounded-lg transition border text-xs cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-400/40 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100/80'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold">
                  <span className="text-[11px] uppercase tracking-wider">Stage {cfg.step}</span>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Done
                    </span>
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-sans font-normal">Pending</span>
                  )}
                </div>
                <div className={`font-bold text-xs mt-1 truncate ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                  {cfg.title}
                </div>
                <div className={`text-[10px] mt-0.5 truncate ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>
                  {cfg.tag}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Active Step Details & One-Click Trigger Button */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-sm shadow-xs">
              {currentConfig.step}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-blue-950">{currentConfig.title}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-700 font-mono font-semibold">
                  {currentConfig.tag}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                {currentConfig.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecuteAction(currentConfig.actionKey)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>{currentConfig.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
