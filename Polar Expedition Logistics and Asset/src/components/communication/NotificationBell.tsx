import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Radio, 
  ExternalLink, 
  ShieldAlert,
  Smartphone,
  Mail,
  Layers,
  X
} from 'lucide-react';
import { NotificationRecord } from '../../types.ts';

interface NotificationBellProps {
  onNavigateToComms: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateToComms }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalUnacknowledged, setCriticalUnacknowledged] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationRecord[]>([]);
  const [activeToast, setActiveToast] = useState<NotificationRecord | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread || 0);
        setCriticalUnacknowledged(data.critical_unacknowledged || 0);
      }
    } catch {
      // Ignore network blip
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await fetch('/api/notifications?limit=8');
      if (res.ok) {
        const data = await res.json();
        setRecentNotifications(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecent();

    // Connect to live SSE Stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'NOTIFICATION_CREATED' || parsed.type === 'NOTIFICATION_UPDATED') {
            fetchStats();
            fetchRecent();

            if (parsed.type === 'NOTIFICATION_CREATED') {
              const notif: NotificationRecord = parsed.data;
              setActiveToast(notif);
              // Auto hide toast after 8 seconds
              setTimeout(() => {
                setActiveToast((curr) => (curr?.id === notif.id ? null : curr));
              }, 8000);
            }
          }
        } catch {
          // parse error
        }
      };
    } catch {
      // SSE unsupported or offline
    }

    const interval = setInterval(fetchStats, 15000);

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: 'CURRENT_OPERATOR' }),
      });
      if (res.ok) {
        fetchStats();
        fetchRecent();
      }
    } catch {
      // Ignore
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      fetchStats();
      fetchRecent();
    } catch {
      // Ignore
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-rose-100 text-rose-800 border border-rose-300">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-300">HIGH</span>;
      case 'NORMAL':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-800 border border-blue-200">NORMAL</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700">LOW</span>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchRecent();
        }}
        className={`relative p-2 rounded-md transition flex items-center justify-center border ${
          criticalUnacknowledged > 0
            ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
            : unreadCount > 0
            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
        title={`Notifications (${unreadCount} unread, ${criticalUnacknowledged} critical awaiting ACK)`}
      >
        <Bell className={`w-4 h-4 ${criticalUnacknowledged > 0 ? 'text-rose-600' : 'text-slate-600'}`} />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] font-bold px-1 rounded-full flex items-center justify-center text-white ${
            criticalUnacknowledged > 0 ? 'bg-rose-600' : 'bg-blue-600'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Critical Incoming Alert Toast */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-slate-900 text-white rounded-xl shadow-2xl border border-rose-500/50 p-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                LIVE POLAR DISPATCH ({activeToast.priority})
              </span>
            </div>
            <button 
              onClick={() => setActiveToast(null)} 
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-100 line-clamp-2">
            {activeToast.title}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-mono">
              {activeToast.source_module} • {new Date(activeToast.created_at).toLocaleTimeString()} UTC
            </span>
            <div className="flex items-center gap-2">
              {activeToast.requires_acknowledgement && !activeToast.acknowledged_at && (
                <button
                  onClick={(e) => {
                    handleAcknowledge(activeToast.id, e);
                    setActiveToast(null);
                  }}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Acknowledge</span>
                </button>
              )}
              <button
                onClick={() => {
                  setActiveToast(null);
                  onNavigateToComms();
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
              >
                View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Quick Tray */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 sm:w-[420px] bg-white rounded-xl shadow-2xl border border-blue-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Polar Comm & Alert Feed</span>
            </div>
            <div className="flex items-center gap-2">
              {criticalUnacknowledged > 0 && (
                <span className="text-[10px] bg-rose-600 font-bold px-2 py-0.5 rounded text-white">
                  {criticalUnacknowledged} UNACK
                </span>
              )}
              <span className="text-[11px] text-slate-400">
                {unreadCount} unread
              </span>
            </div>
          </div>

          {/* Quick Filter Info Ribbon */}
          <div className="px-3.5 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>CHANNELS: IN_APP • SATELLITE SMS • EMAIL</span>
            <button
              onClick={onNavigateToComms}
              className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
            >
              <span>Full Center</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* List of Recent Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No notifications logged. All polar channels quiet.
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const isUnread = !notif.read_at && notif.status !== 'READ' && notif.status !== 'ACKNOWLEDGED';
                const isUnackedCritical = notif.priority === 'CRITICAL' && !notif.acknowledged_at;

                return (
                  <div
                    key={notif.id}
                    onClick={(e) => handleMarkRead(notif.id, e)}
                    className={`p-3.5 transition cursor-pointer hover:bg-slate-50 ${
                      isUnackedCritical
                        ? 'bg-rose-50/70 border-l-4 border-rose-600'
                        : isUnread
                        ? 'bg-blue-50/40 border-l-4 border-blue-600'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getPriorityBadge(notif.priority)}
                        <span className="text-[11px] font-mono text-slate-500 font-semibold">
                          {notif.source_module}
                        </span>
                        {notif.station_id && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono uppercase">
                            {notif.station_id}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                      </span>
                    </div>

                    <h4 className="mt-1 text-xs font-bold text-slate-900 line-clamp-1">
                      {notif.title}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Delivery summary and actions */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Send className="w-2.5 h-2.5 text-blue-500" />
                          <span>{notif.recipients.length} rcpt</span>
                        </span>
                        <span>•</span>
                        <span className={`font-semibold ${
                          notif.status === 'ACKNOWLEDGED' ? 'text-emerald-700' :
                          notif.status === 'DELIVERED' ? 'text-blue-700' :
                          notif.status === 'FAILED' ? 'text-rose-700' : 'text-slate-600'
                        }`}>
                          {notif.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {notif.requires_acknowledgement && !notif.acknowledged_at && (
                          <button
                            onClick={(e) => handleAcknowledge(notif.id, e)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Ack</span>
                          </button>
                        )}
                        {isUnread && (
                          <button
                            onClick={(e) => handleMarkRead(notif.id, e)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-2.5 border-t border-slate-200 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateToComms();
              }}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center justify-center gap-1.5 w-full py-1 rounded hover:bg-blue-50 transition"
            >
              <span>Launch Communication & Alert Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
