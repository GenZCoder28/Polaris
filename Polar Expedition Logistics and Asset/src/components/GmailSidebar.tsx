import React from 'react';
import { 
  Compass, 
  Navigation,
  Ship, 
  Boxes, 
  ShieldAlert,
  Building2
} from 'lucide-react';

export interface GmailSidebarProps {
  sidebarOpen: boolean;
  activeBox: number;
  onSelectBox: (boxId: number) => void;
  activeEmergenciesCount: number;
  onComposeClick?: () => void;
  onSelectStation?: (stationKey: string) => void;
  isStationsViewActive?: boolean;
}

export const GmailSidebar: React.FC<GmailSidebarProps> = ({
  sidebarOpen,
  activeBox,
  onSelectBox,
  activeEmergenciesCount,
  onSelectStation,
  isStationsViewActive,
}) => {
  const mainNavItems = [
    {
      id: 1,
      label: 'Expedition Planning & Requirements',
      shortLabel: 'Expeditions',
      icon: Compass,
      showRedDot: false,
    },
    {
      id: 2,
      label: 'Polar Navigation & Fast-Ice Moorings',
      shortLabel: 'Navigation',
      icon: Navigation,
      showRedDot: false,
    },
    {
      id: 3,
      label: 'Cargo Manifest & Voyage Tracking',
      shortLabel: 'Cargo',
      icon: Ship,
      showRedDot: false,
    },
    {
      id: 4,
      label: 'Station Inventory & Depletion',
      shortLabel: 'Inventory',
      icon: Boxes,
      showRedDot: false,
    },
    {
      id: 5,
      label: 'Emergency Incidents & Safety',
      shortLabel: 'Safety',
      icon: ShieldAlert,
      showRedDot: false,
    },
  ];

  return (
    <aside
      id="gmail-sidebar"
      className={`
        ${sidebarOpen ? 'w-72 sm:w-80' : 'w-[72px]'}
        shrink-0 bg-[#f6f8fc] border-r border-slate-200/90 flex flex-col h-[calc(100vh-61px)]
        transition-all duration-200 ease-in-out select-none overflow-y-auto overflow-x-hidden z-30 pt-3
      `}
    >
      {/* 1. Primary Navigation List (One by One without button/card shapes, no numbers, red dot for Emergency) */}
      <nav className="flex flex-col space-y-1 pr-2">
        {mainNavItems.map((item) => {
          const IconComp = item.icon;
          const isActive = activeBox === item.id && !isStationsViewActive;

          if (sidebarOpen) {
            return (
              <button
                key={item.id}
                id={`gmail-nav-item-${item.id}`}
                onClick={() => onSelectBox(item.id)}
                className={`
                  w-full flex items-center justify-between pl-5 pr-3 py-2.5 transition-colors cursor-pointer select-none rounded-r-full text-left
                  ${
                    isActive
                      ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                      : 'text-slate-700 hover:bg-slate-200/60 font-medium'
                  }
                `}
                title={item.label}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <IconComp
                    className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-[#041e49]' : 'text-slate-600'}`}
                  />
                  {/* Complete words visible: wraps under the first line of the same option */}
                  <span className="text-[13px] leading-snug font-medium break-normal whitespace-normal">
                    {item.label}
                  </span>
                </div>
                {item.showRedDot && (
                  <span
                    id="emergency-red-dot"
                    className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 ml-2 self-center animate-pulse"
                    title={`${activeEmergenciesCount} Active Emergency Incidents`}
                  />
                )}
              </button>
            );
          }

          // Collapsed state (icon strip)
          return (
            <button
              key={item.id}
              id={`gmail-nav-item-icon-${item.id}`}
              onClick={() => onSelectBox(item.id)}
              className="w-full flex justify-center py-1.5 cursor-pointer group select-none"
              title={item.label}
            >
              <div
                className={`w-12 h-8 rounded-full flex items-center justify-center transition-all relative ${
                  isActive
                    ? 'bg-[#d3e3fd] text-[#041e49]'
                    : 'text-slate-600 group-hover:bg-slate-200/70'
                }`}
              >
                <IconComp className="w-5 h-5" />
                {item.showRedDot && (
                  <span
                    className="absolute top-1.5 right-3 w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse ring-2 ring-white"
                    title="Active Emergency"
                  />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-3 border-t border-slate-200/80 mx-3" />

      {/* 2. Only One Single Button for Stations (no two stations, no numbers) */}
      {sidebarOpen ? (
        <div className="pr-2">
          <button
            id="gmail-station-single-btn"
            onClick={() => onSelectStation?.('all')}
            className={`
              w-full flex items-center gap-3.5 pl-5 pr-3 py-2.5 transition-colors cursor-pointer select-none rounded-r-full text-left
              ${
                isStationsViewActive
                  ? 'bg-[#d3e3fd] text-[#041e49] font-bold'
                  : 'text-slate-700 hover:bg-slate-200/60 font-medium'
              }
            `}
            title="Antarctic Research Stations (Bharati & Maitri)"
          >
            <Building2 className={`w-5 h-5 shrink-0 ${isStationsViewActive ? 'text-[#041e49]' : 'text-slate-600'}`} />
            <span className="text-[13px] leading-snug font-medium">
              Stations
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-1.5">
          <button
            id="gmail-station-collapsed-btn"
            onClick={() => onSelectStation?.('all')}
            className="w-full flex justify-center py-1.5 cursor-pointer group select-none"
            title="Stations (Bharati & Maitri)"
          >
            <div
              className={`w-12 h-8 rounded-full flex items-center justify-center transition-all relative ${
                isStationsViewActive
                  ? 'bg-[#d3e3fd] text-[#041e49]'
                  : 'text-slate-600 group-hover:bg-slate-200/70'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}
    </aside>
  );
};
