import React from 'react';
import { 
  Compass, 
  Menu
} from 'lucide-react';
import { Station } from '../types';
import { NotificationBell } from './communication/NotificationBell.tsx';

interface HeaderProps {
  stations?: Station[];
  activeEmergencyCount?: number;
  onOpenEmergencyModal?: () => void;
  onNavigateToTab?: (tab: string) => void;
  simulatedDays?: number;
  onReset?: () => void;
  onBackToHome?: () => void;
  isDetailPage?: boolean;
  activeBoxTitle?: string;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateToTab,
  onToggleSidebar,
  sidebarOpen,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-2xs">
      {/* Main Header Brand & Control Bar */}
      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Hamburger Menu button like Gmail */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title={sidebarOpen ? "Collapse menu" : "Expand menu"}
              className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-blue-600 shadow-sm shadow-blue-500/20 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-white" />
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              POLARIS
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Static Notification Bell */}
          <NotificationBell onNavigateToComms={() => onNavigateToTab?.('emergency')} />
        </div>
      </div>
    </header>
  );
};

