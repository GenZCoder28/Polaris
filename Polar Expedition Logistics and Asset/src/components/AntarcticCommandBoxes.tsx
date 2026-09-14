import React from 'react';
import { 
  Compass, 
  Navigation,
  Ship, 
  Boxes, 
  ShieldAlert,
} from 'lucide-react';

export interface CommandBoxItem {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  summary: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  quickActionLabel: string;
  quickActionKey: string;
}

export const COMMAND_BOXES: CommandBoxItem[] = [
  {
    id: 1,
    key: 'expeditions',
    title: 'Expedition Planning & Requirements',
    subtitle: 'Mission Charter & Auto-Indents',
    summary: 'ISEA-44 Active • 45 Crew • 160 Days',
    desc: 'Charter Antarctic expeditions for Bharati & Maitri stations, deploy crew, and auto-calculate 5-category requirements (Fuel, Food, Medical, Equipment, Spares).',
    icon: Compass,
    quickActionLabel: 'Formulate Requirements',
    quickActionKey: 'plan_and_requirements',
  },
  {
    id: 2,
    key: 'map',
    title: 'Polar Navigation & Fast-Ice Moorings',
    subtitle: 'Antarctic Map & Polar AIS Fleet',
    summary: 'Maitri & Bharati Coast • Active Ice Routes',
    desc: 'Real-time geographic navigation map, sea-ice thickness telemetry, research station positions, and chartered icebreaker voyage monitoring.',
    icon: Navigation,
    quickActionLabel: 'Open Polar Map',
    quickActionKey: 'map_navigation',
  },
  {
    id: 3,
    key: 'cargo',
    title: 'Cargo Manifest & Voyage Tracking',
    subtitle: 'Cargo Manifest & Staging',
    summary: 'Active Voyage • Southern Ocean Transit',
    desc: 'Review multi-category cargo manifest and track active polar research vessels across the Southern Ocean to fast-ice moorings.',
    icon: Ship,
    quickActionLabel: 'View Cargo Manifest',
    quickActionKey: 'stowage_and_voyage',
  },
  {
    id: 4,
    key: 'inventory',
    title: 'Station Inventory & Depletion',
    subtitle: 'Stock Depletion & Machinery Health',
    summary: 'Fuel & Rations • Depletion Deficit Alert',
    desc: 'Monitor Bharati & Maitri supply reserves, simulate 30-day winter consumption burn rates, apply fuel conservation rationing, and maintain snowcat assets.',
    icon: Boxes,
    quickActionLabel: 'Simulate 30-Day Depletion',
    quickActionKey: 'resupply_and_depletion',
  },
  {
    id: 5,
    key: 'emergency',
    title: 'Emergency Incidents & Safety',
    subtitle: 'Polar Incident Command & Response',
    summary: 'Life-Support Nominal • Teams on Standby',
    desc: 'Real-time incident response: declare Code Red, execute standard operating procedures, dispatch PistenBully snowcat rescue teams, and stabilize station power.',
    icon: ShieldAlert,
    quickActionLabel: 'Execute Emergency Drill',
    quickActionKey: 'emergency_and_response',
  },
];

interface AntarcticCommandBoxesProps {
  activeBox: number | null;
  onSelectBox: (boxId: number) => void;
  onExecuteQuickAction?: (actionKey: string) => void;
  onReset?: () => void;
  layout?: 'stacked' | 'horizontal-bar';
  showHeader?: boolean;
}

export const AntarcticCommandBoxes: React.FC<AntarcticCommandBoxesProps> = ({
  activeBox,
  onSelectBox,
  layout = 'stacked',
  showHeader = true,
}) => {
  return (
    <nav className="w-full" aria-label="Antarctic Operational Command Pillars">
      {showHeader && (
        <div className="mb-3 px-1">
          <h2 className="text-base sm:text-[17px] font-extrabold text-slate-900 tracking-tight">
            Antarctic Command Pillars
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a pillar to open workspace
          </p>
        </div>
      )}

      {/* Primary Command Box cards matching uploaded image */}
      <div className={layout === 'horizontal-bar' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3' : 'flex flex-col gap-2.5'}>
        {COMMAND_BOXES.map((box) => {
          const isSelected = box.id === activeBox;
          const Icon = box.icon;

          return (
            <button
              key={box.id}
              onClick={() => onSelectBox(box.id)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative group flex items-center gap-3.5 shadow-2xs ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-100 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/70'
              }`}
            >
              {/* Left Icon Squircle container matching screenshot */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'bg-[#edf5fd] border-blue-100 text-blue-600 group-hover:border-blue-200'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform group-hover:scale-105" />
              </div>

              {/* Text: Title and Subtitle */}
              <div className="min-w-0 flex-1">
                <h3
                  className={`text-sm sm:text-[14.5px] font-bold leading-snug truncate transition-colors ${
                    isSelected ? 'text-blue-950 font-extrabold' : 'text-slate-900 group-hover:text-blue-700'
                  }`}
                >
                  {box.title}
                </h3>
                <p
                  className={`text-xs leading-tight truncate mt-0.5 ${
                    isSelected ? 'text-blue-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  {box.subtitle}
                </p>
              </div>

              {/* Active selection indicator bar on right */}
              {isSelected && (
                <div className="w-1.5 h-6 rounded-full bg-blue-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
