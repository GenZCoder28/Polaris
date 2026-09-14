import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Send, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  Smartphone, 
  Mail, 
  Laptop, 
  ShieldAlert, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  FileText, 
  Users, 
  Sliders, 
  History, 
  Layers, 
  Info,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { 
  NotificationRecord, 
  NotificationTemplateRecord, 
  NotificationPreferenceRecord, 
  NotificationAuditLogRecord,
  NotificationDashboardStats,
  CreateNotificationRequest,
  NotificationChannel,
  NotificationPriority,
  SourceModule,
  NotificationType
} from '../../types.ts';
import { PersonnelContact } from '../../data/initialCommunicationData.ts';

export const CommunicationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'channels' | 'templates' | 'preferences' | 'audit'>('feed');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferenceRecord[]>([]);
  const [contacts, setContacts] = useState<PersonnelContact[]>([]);
  const [auditLogs, setAuditLogs] = useState<NotificationAuditLogRecord[]>([]);
  const [stats, setStats] = useState<NotificationDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters for feed
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);

  // Modal states
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<NotificationTemplateRecord | null>(null);
  const [ackTargetNotif, setAckTargetNotif] = useState<NotificationRecord | null>(null);
  const [ackOfficerName, setAckOfficerName] = useState<string>('Dr. Rajesh Sharma (Expedition Director)');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateRecord | null>(null);
  const [templateForm, setTemplateForm] = useState({
    template_code: '',
    template_name: '',
    notification_type: 'GENERAL_UPDATE' as any,
    channel: 'ALL' as any,
    subject: '',
    body: '',
    variables_description: '',
  });
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  // Simulation settings
  const [simSettings, setSimSettings] = useState({
    forceFailSMS: false,
    forceTimeoutEmail: false,
    simulatedLatencyMs: 250,
  });

  // Manual Dispatch Form state
  const [newNotif, setNewNotif] = useState<Partial<CreateNotificationRequest>>({
    source_module: 'EMERGENCY',
    notification_type: 'EMERGENCY',
    priority: 'HIGH',
    station_id: 'bharati',
    template_code: 'CRITICAL_EMERGENCY',
    template_params: {
      emergency_code: 'EMG-MANUAL-001',
      station_name: 'Bharati Station',
      emergency_type: 'FACILITY_POWER',
      severity: 'HIGH',
      reported_by: 'Operations Watch Officer',
      detected_at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      description: 'Main generator alternator output fluctuation detected during blizzard.',
      response_team: 'Life Support & Electrical Response Team',
    },
    requires_acknowledgement: true,
  });

  // Load all initial data
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [notifsRes, statsRes, tplsRes, prefsRes, contactsRes, logsRes, simRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/notifications/stats'),
        fetch('/api/notification-templates'),
        fetch('/api/notification-preferences'),
        fetch('/api/notification-contacts'),
        fetch('/api/notification-audit-logs'),
        fetch('/api/notifications-simulation'),
      ]);

      if (notifsRes.ok) setNotifications(await notifsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (tplsRes.ok) setTemplates(await tplsRes.json());
      if (prefsRes.ok) setPreferences(await prefsRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (simRes.ok) setSimSettings(await simRes.json());
    } catch (err) {
      console.error('Failed to load communication module data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // SSE connection for live updates
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/notifications/stream');
      es.onmessage = () => {
        loadData();
      };
    } catch {
      // Offline
    }

    const interval = setInterval(() => {
      loadData();
    }, 20000);

    return () => {
      clearInterval(interval);
      if (es) es.close();
    };
  }, []);

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filterModule !== 'ALL' && n.source_module !== filterModule) return false;
    if (filterPriority !== 'ALL' && n.priority !== filterPriority) return false;
    if (filterStatus !== 'ALL' && n.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      const matchCode = n.notification_code.toLowerCase().includes(q);
      const matchStation = n.station_id?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchCode || matchStation;
    }
    return true;
  });

  // Action Handlers
  const handleAcknowledge = async (id: string, officerName: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: officerName }),
      });
      if (res.ok) {
        setAckTargetNotif(null);
        await loadData();
      }
    } catch (err) {
      alert('Failed to submit acknowledgement');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      await loadData();
    } catch (err) {
      // Ignore
    }
  };

  const handleRetryFailed = async () => {
    try {
      const res = await fetch('/api/notifications/retry-failed', { method: 'POST' });
      if (res.ok) {
        await loadData();
        alert('All failed/retrying notification deliveries queued for immediate resend.');
      }
    } catch (err) {
      alert('Failed to retry deliveries');
    }
  };

  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif),
      });
      if (res.ok) {
        setIsDispatchModalOpen(false);
        await loadData();
        alert('Notification successfully dispatched across all designated channels!');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to dispatch'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  const handleTogglePreference = async (prefId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/notification-preferences/${prefId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update preference');
      }
    } catch (err) {
      alert('Network error updating preference');
    }
  };

  const handleUpdateSimSettings = async (updated: typeof simSettings) => {
    setSimSettings(updated);
    try {
      await fetch('/api/notifications-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Ignore
    }
  };

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      template_code: 'TPL_STN_' + Math.floor(Math.random() * 1000),
      template_name: 'Custom Station Operations Alert',
      notification_type: 'GENERAL_UPDATE',
      channel: 'ALL',
      subject: '📡 Station Advisory: {{station_name}} - {{topic}}',
      body: `Operational Advisory Notice\n\nStation: {{station_name}}\nTopic: {{topic}}\nSummary: {{summary}}\nIssued By: {{issued_by}}\nEffective Date: {{date}}\n\nPlease review station directives accordingly.`,
      variables_description: 'station_name, topic, summary, issued_by, date',
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: NotificationTemplateRecord) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      template_code: tpl.template_code,
      template_name: tpl.template_name,
      notification_type: tpl.notification_type,
      channel: tpl.channel,
      subject: tpl.subject,
      body: tpl.body,
      variables_description: tpl.variables_description.join(', '),
    });
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vars = templateForm.variables_description
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      const payload = {
        template_code: templateForm.template_code,
        template_name: templateForm.template_name,
        notification_type: templateForm.notification_type,
        channel: templateForm.channel,
        subject: templateForm.subject,
        body: templateForm.body,
        variables_description: vars,
      };

      let res;
      if (editingTemplate) {
        res = await fetch(`/api/notifications/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/notifications/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsTemplateModalOpen(false);
        await loadData(true);
      } else {
        const err = await res.json();
        alert(`Error saving template: ${err.error || 'Failed'}`);
      }
    } catch (err: any) {
      alert(`Request error: ${err.message}`);
    }
  };

  const handleSimulateModuleTrigger = async (scenario: string) => {
    try {
      if (scenario === 'SHIPMENT_DELAY') {
        await fetch('/api/shipments/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'DELAY',
            shipment_id: 'SHP-2026-044-IND',
            vessel_name: 'MV Vasiliy Golovnin',
            origin: 'Mormugao Port, Goa',
            destination: 'Prydz Bay / Bharati Station',
            previous_eta: '2026-09-20 12:00 UTC',
            updated_eta: '2026-09-27 18:00 UTC',
            reason: 'Heavy multi-year fast ice barrier (3.4m thickness) encountered near 69°S.',
            containers_count: 54,
            severity: 'HIGH',
          }),
        });
      } else if (scenario === 'SHIPMENT_ARRIVAL') {
        await fetch('/api/shipments/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'ARRIVAL',
            shipment_id: 'SHP-2026-042-MTR',
            vessel_name: 'SA Agulhas II',
            origin: 'Cape Town, South Africa',
            destination: 'Princess Astrid Coast / Maitri Station',
            arrival_time: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
            containers_count: 36,
          }),
        });
      } else if (scenario === 'FOOD_REQUIREMENT') {
        await fetch('/api/internal/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_module: 'INVENTORY',
            notification_type: 'FOOD_REQUIREMENT',
            priority: 'HIGH',
            station_id: 'maitri',
            template_code: 'FOOD_REQUIREMENT',
            template_params: {
              expedition: '43rd Indian Antarctic Expedition',
              station: 'Maitri Station',
              current_stock: '420 kg (21 days supply)',
              predicted_requirement: '1,200 kg (60 days reserve)',
              shortage: '780 kg Freeze-Dried Provisions',
              item_name: 'Freeze-Dried High-Calorie Rations',
              category: 'FOOD',
              stockout_days: '21',
            },
          }),
        });
      } else if (scenario === 'ASSET_REQUIREMENT') {
        await fetch('/api/internal/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_module: 'ASSET',
            notification_type: 'ASSET_REQUIREMENT',
            priority: 'HIGH',
            station_id: 'bharati',
            template_code: 'ASSET_REQUIREMENT',
            template_params: {
              expedition: '44th Indian Antarctic Expedition',
              station: 'Bharati Station',
              asset_type: 'PistenBully 300 Polar Snowcat',
              available: '1 operational',
              predicted: '3 units required for ice runway grooming',
              shortage: '2 Snowcat track assemblies',
            },
          }),
        });
      } else if (scenario === 'WEATHER_BLIZZARD') {
        await fetch('/api/internal/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_module: 'WEATHER',
            notification_type: 'CRITICAL_WEATHER_EMERGENCY',
            priority: 'CRITICAL',
            station_id: 'bharati',
            template_code: 'CRITICAL_WEATHER_EMERGENCY',
            requires_acknowledgement: true,
            template_params: {
              station_name: 'Bharati Station (Larsemann Hills)',
              warning_level: 'CODE RED - CATACLYSMIC BLIZZARD',
              wind_speed: '84 knots (155 km/h)',
              temperature: '-44°C (Windchill -68°C)',
              visibility: '< 5 meters (Complete Whiteout)',
              safety_action: 'ALL OUTDOOR MOVEMENT PROHIBITED. Emergency bunker isolation initiated. Station perimeter safety lines engaged.',
            },
          }),
        });
      } else if (scenario === 'GENERATOR_EMERGENCY') {
        await fetch('/api/internal/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_module: 'EMERGENCY',
            notification_type: 'CRITICAL_EMERGENCY',
            priority: 'CRITICAL',
            station_id: 'maitri',
            template_code: 'CRITICAL_EMERGENCY',
            requires_acknowledgement: true,
            template_params: {
              emergency_code: `EMG-${Date.now().toString().slice(-4)}`,
              station_name: 'Maitri Station (Schirmacher Oasis)',
              emergency_type: 'LIFE_SUPPORT_POWER',
              severity: 'CRITICAL LEVEL 3',
              detected_at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
              description: 'Station Primary Diesel Genset #1 tripped on high coolant temperature during -35°C gale. Auxiliary generator failed auto-crank.',
              response_team: 'Lead Station Engineer & Electrical Rapid Deployment Team',
            },
          }),
        });
      }
      setIsSimulateModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 text-xs font-extrabold rounded-md bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>HIGH</span>
          </span>
        );
      case 'NORMAL':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 text-blue-800 border border-blue-200">
            NORMAL
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700">
            LOW
          </span>
        );
    }
  };

  const getChannelIcon = (ch: NotificationChannel) => {
    switch (ch) {
      case 'IN_APP':
        return <Laptop className="w-3.5 h-3.5 text-blue-600" title="In-App System" />;
      case 'SMS':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-600" title="Satellite SMS / SBD" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-purple-600" title="Email Relay" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Top Banner & Telemetry Ribbon */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-lg border border-blue-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold tracking-wide rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                MODULE 7: NCPOR TELECOM
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>IRIDIUM SATELLITE LINK ACTIVE</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white flex items-center gap-2">
              <span>Communication & Notification Infrastructure</span>
              <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Multi-channel alerting backbone for Indian Polar Research Stations (Bharati, Maitri, Himadri) and marine expedition vessels. Enforces strict deterministic templates, automated recipient routing, satellite delivery tracking, and mandatory critical incident acknowledgement.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition"
              title="Trigger simulated events from Inventory, Weather, Cargo, and Asset modules"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Simulate Module Trigger</span>
            </button>

            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch Notification</span>
            </button>

            <button
              onClick={handleRetryFailed}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Resend any failed or retrying notifications"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Failed</span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
              title="Refresh telemetry"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Operational Telemetry Cards Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Total Logged</span>
              <p className="text-lg font-bold text-white mt-0.5">{stats.total}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
              <span className="text-[11px] font-mono text-emerald-400 uppercase">Success Rate</span>
              <p className="text-lg font-bold text-emerald-300 mt-0.5">{stats.success_rate_percent}%</p>
            </div>
            <div className={`rounded-lg p-2.5 border ${
              stats.unacknowledged_critical > 0 
                ? 'bg-rose-950/40 border-rose-800 text-rose-200 animate-pulse' 
                : 'bg-slate-800/50 border-slate-700/50 text-white'
            }`}>
              <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">Unacknowledged Critical</span>
              <p className="text-lg font-extrabold text-rose-300 mt-0.5">{stats.unacknowledged_critical}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
              <span className="text-[11px] font-mono text-blue-400 uppercase">Delivered & Read</span>
              <p className="text-lg font-bold text-blue-200 mt-0.5">{stats.delivered}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
              <span className="text-[11px] font-mono text-purple-400 uppercase">Channels Used</span>
              <p className="text-lg font-bold text-purple-200 mt-0.5">3 Active</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
              <span className="text-[11px] font-mono text-amber-400 uppercase">Retrying / Pending</span>
              <p className="text-lg font-bold text-amber-200 mt-0.5">{stats.retrying + stats.pending}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-blue-200 bg-white px-2 rounded-lg shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'feed'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-blue-600'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Live Notification Feed</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'channels'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-blue-600'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Delivery Channels & Gateway</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-blue-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Deterministic Templates (NO LLM)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
            {templates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-blue-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Contacts & Safety Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-blue-600'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Delivery Audit Logs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: LIVE NOTIFICATION FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Module Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-500 font-medium">Module:</span>
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Modules</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="WEATHER">Weather</option>
                  <option value="INVENTORY">Inventory (Food)</option>
                  <option value="ASSET">Asset / Equipment</option>
                  <option value="SHIPMENT">Shipment / Marine</option>
                  <option value="PERSONNEL">Personnel</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                <span className="text-slate-500 font-medium">Priority:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High</option>
                  <option value="NORMAL">Normal</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="READ">Read</option>
                  <option value="RETRYING">Retrying</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alert, station, code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Notifications Card List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm">No notifications found matching filter criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing filters or dispatch a new notification.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isExpanded = expandedNotifId === notif.id;
                const isCriticalUnacked = notif.priority === 'CRITICAL' && !notif.acknowledged_at;

                return (
                  <div
                    key={notif.id}
                    className={`bg-white rounded-xl border transition-all shadow-xs ${
                      isCriticalUnacked
                        ? 'border-rose-400 ring-2 ring-rose-300/50 bg-rose-50/20'
                        : notif.status === 'ACKNOWLEDGED'
                        ? 'border-emerald-200'
                        : 'border-blue-200 hover:border-blue-300'
                    }`}
                  >
                    {/* Top Row Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPriorityBadge(notif.priority)}
                        <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {notif.notification_code}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {notif.source_module}
                        </span>
                        {notif.station_id && (
                          <span className="text-xs font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                            {notif.station_id}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(notif.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })} UTC
                        </span>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${
                          notif.status === 'ACKNOWLEDGED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : notif.status === 'DELIVERED'
                            ? 'bg-blue-100 text-blue-800'
                            : notif.status === 'RETRYING'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : notif.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {notif.status}
                        </span>

                        {notif.requires_acknowledgement && !notif.acknowledged_at && (
                          <button
                            onClick={() => setAckTargetNotif(notif)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Acknowledge</span>
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedNotifId(isExpanded ? null : notif.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Notification Title & Body */}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {notif.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 whitespace-pre-line font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Acknowledgement Stamp if present */}
                      {notif.acknowledged_at && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Formally acknowledged by <strong>{notif.acknowledged_by || 'Station Commander'}</strong> on{' '}
                            {new Date(notif.acknowledged_at).toLocaleString()} UTC.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Recipients and Channel Strip */}
                    <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-semibold text-slate-700">
                          Recipients ({notif.recipients.length}):
                        </span>
                        {notif.recipients.map((rcpt) => (
                          <div key={rcpt.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200 text-[11px]">
                            <span className="font-medium text-slate-800">{rcpt.recipient_name}</span>
                            <span className="text-slate-400">({rcpt.recipient_role})</span>
                            <div className="flex items-center gap-1 ml-1">
                              {rcpt.channels.map((ch) => (
                                <span key={ch} title={ch}>
                                  {getChannelIcon(ch)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setExpandedNotifId(isExpanded ? null : notif.id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Delivery Details' : 'View Delivery Attempts & Gateway Responses'}</span>
                      </button>
                    </div>

                    {/* Expanded Drawer: Delivery Attempts & Audit */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-900 text-white border-t border-slate-800 space-y-3 rounded-b-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                            Satellite Gateway & Channel Delivery Transmission Logs
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Attempts: {notif.attempts.length}
                          </span>
                        </div>

                        {notif.attempts.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No delivery attempts recorded yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {notif.attempts.map((att) => (
                              <div
                                key={att.id}
                                className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs font-mono flex flex-col md:flex-row md:items-center justify-between gap-2"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      att.status === 'SUCCESS' ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                                    }`}>
                                      {att.status}
                                    </span>
                                    <span className="text-slate-300 font-bold">
                                      Channel: {att.channel} (Attempt #{att.attemptNumber})
                                    </span>
                                    <span className="text-slate-400 text-[11px]">
                                      Provider: {att.provider_name}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-[11px]">
                                    Response: <span className="text-emerald-400">{att.provider_response}</span>
                                  </p>
                                  {att.failureReason && (
                                    <p className="text-rose-400 text-[11px]">
                                      Failure Reason: {att.failureReason}
                                    </p>
                                  )}
                                </div>
                                <span className="text-slate-500 text-[10px] whitespace-nowrap">
                                  {new Date(att.attempted_at).toISOString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CHANNELS & GATEWAYS */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          {/* Status of 3 Polar Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* In-App */}
            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <Laptop className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                  ONLINE (100%)
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">Polaris In-App Stream (SSE)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct WebSocket/SSE event push to all active browser sessions and mission consoles. Supports instant audio-visual dispatch and badge increments.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
                <div>Protocol: Server-Sent Events (SSE)</div>
                <div>Latency: &lt; 50 ms</div>
                <div>Availability: Real-time</div>
              </div>
            </div>

            {/* Satellite SMS */}
            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                  CONSTELLATION UP
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">Iridium Satellite SBD / SMS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Short Burst Data packets transmitted over 66 low-Earth orbit satellites directly to handheld sat phones (Iridium Extreme / 9555) of Station Commanders.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
                <div>Protocol: Iridium SBD Gateway</div>
                <div>Payload Limit: 340 bytes/packet</div>
                <div>Uplink Status: 5/5 Bars</div>
              </div>
            </div>

            {/* Email Relay */}
            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                  RELAY ACTIVE
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">NCPOR High-Latitude Email Relay</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asynchronous secure SMTP relay queued through Goa NCPOR HQ ground stations. Used for detailed situation reports and supply requisitions.
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
                <div>Protocol: SMTP / TLS Relay</div>
                <div>Queue Capacity: 5,000 msgs</div>
                <div>Encryption: 256-bit AES</div>
              </div>
            </div>
          </div>

          {/* Interactive Provider Simulation & Fallback Sandbox */}
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Interactive Satellite Link & Fallback Simulator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Test edge cases: simulate satellite solar blackout or VSAT drop to watch the automated retry engine execute fallback routing to secondary channels!
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono">
                TEST & EVALUATION HOOKS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Force SMS Fail */}
              <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200">Simulate Satellite SMS Failure</span>
                  <input
                    type="checkbox"
                    checked={simSettings.forceFailSMS}
                    onChange={(e) => handleUpdateSimSettings({ ...simSettings, forceFailSMS: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  When enabled, Iridium SBD uplink fails, triggering automatic fallback dispatch to Email and In-App channels.
                </p>
                {simSettings.forceFailSMS && (
                  <span className="text-[10px] text-rose-400 font-bold font-mono">
                    ⚠️ SMS FAIL ACTIVE: Fallback will engage
                  </span>
                )}
              </div>

              {/* Force Email Timeout */}
              <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200">Simulate VSAT Email Timeout</span>
                  <input
                    type="checkbox"
                    checked={simSettings.forceTimeoutEmail}
                    onChange={(e) => handleUpdateSimSettings({ ...simSettings, forceTimeoutEmail: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Simulates polar atmospheric disturbance causing email relay connection timeouts after 30 seconds.
                </p>
                {simSettings.forceTimeoutEmail && (
                  <span className="text-[10px] text-rose-400 font-bold font-mono">
                    ⚠️ EMAIL TIMEOUT SIMULATION ACTIVE
                  </span>
                )}
              </div>

              {/* Simulated Latency */}
              <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200">Simulated Satellite Latency</span>
                  <span className="text-xs font-mono text-blue-400 font-bold">{simSettings.simulatedLatencyMs} ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={simSettings.simulatedLatencyMs}
                  onChange={(e) => handleUpdateSimSettings({ ...simSettings, simulatedLatencyMs: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Adjust simulated satellite hop round-trip delay.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DETERMINISTIC TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Deterministic Token Replacement Engine (Strictly NO LLM)</p>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  Emergency communications require 100% predictable formatting and zero hallucination risk. All notifications are rendered through pre-approved organizational templates replacing validated placeholder tokens like <code>{'{{emergency_code}}'}</code>, <code>{'{{station_name}}'}</code>, <code>{'{{severity}}'}</code>, and <code>{'{{shortage}}'}</code>.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenCreateTemplate}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {tpl.template_code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 font-mono">
                      v{tpl.version} • {tpl.notification_type}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-2">{tpl.template_name}</h4>

                  <div className="mt-2 text-xs">
                    <span className="text-slate-400 font-mono font-semibold">Subject Template:</span>
                    <div className="font-mono bg-slate-50 p-2 rounded border border-slate-200 mt-0.5 text-slate-800 text-[11px]">
                      {tpl.subject}
                    </div>
                  </div>

                  <div className="mt-2 text-xs">
                    <span className="text-slate-400 font-mono font-semibold">Body Template:</span>
                    <pre className="font-mono bg-slate-50 p-2.5 rounded border border-slate-200 mt-0.5 text-slate-800 text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                      {tpl.body}
                    </pre>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {tpl.variables_description.map((v) => (
                      <span key={v} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleOpenEditTemplate(tpl)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition shrink-0"
                  >
                    Edit Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RECIPIENT CONTACTS & PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Policy Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">MANDATORY CRITICAL ALERTING DIRECTIVE (NCPOR Protocol Sec 21)</p>
              <p className="mt-0.5 text-amber-900 leading-relaxed">
                By polar maritime safety regulations, all <strong>CRITICAL</strong> emergency notifications are forcibly transmitted to response teams via In-App, Satellite SMS, and Email simultaneously. Personal channel muting or opt-outs for CRITICAL alerts are prohibited by system policy.
              </p>
            </div>
          </div>

          {/* Personnel Contact Directory */}
          <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Mission Personnel Contact Directory (Recipient Resolver Database)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Station / Vessel</th>
                    <th className="p-2.5">Email Relay</th>
                    <th className="p-2.5">Iridium Sat Phone</th>
                    <th className="p-2.5">Recipient Group</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                      <td className="p-2.5 text-slate-600">{c.role}</td>
                      <td className="p-2.5 font-mono uppercase text-blue-700 font-semibold">
                        {c.station_id || c.vessel_id || 'CENTRAL HQ'}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">{c.email}</td>
                      <td className="p-2.5 font-mono text-slate-600">{c.phone}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {c.recipient_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Channel Preferences Matrix */}
          <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Officer Channel Subscriptions & Preferences Matrix</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Personnel</th>
                    <th className="p-2.5">Notification Category</th>
                    <th className="p-2.5">Channel</th>
                    <th className="p-2.5">Policy Tier</th>
                    <th className="p-2.5">Toggle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preferences.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-slate-900">{p.personnel_name}</td>
                      <td className="p-2.5 font-mono text-blue-700">{p.notification_type}</td>
                      <td className="p-2.5 font-semibold flex items-center gap-1.5">
                        {getChannelIcon(p.channel)}
                        <span>{p.channel}</span>
                      </td>
                      <td className="p-2.5">
                        {p.is_mandatory ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            MANDATORY CRITICAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            USER CONFIGURABLE
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <button
                          onClick={() => handleTogglePreference(p.id, p.enabled)}
                          disabled={p.is_mandatory}
                          className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                            p.enabled
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          } ${p.is_mandatory ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={p.is_mandatory ? 'Mandatory critical channel cannot be disabled' : 'Click to toggle'}
                        >
                          {p.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          <span>{p.enabled ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Communication Delivery & Dispatch Audit Ledger</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Log Entries: {auditLogs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Timestamp (UTC)</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Actor</th>
                  <th className="p-2.5">Notification ID</th>
                  <th className="p-2.5">State Transition</th>
                  <th className="p-2.5">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        log.action === 'CREATED' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'ACKNOWLEDGED' ? 'bg-emerald-100 text-emerald-800 font-extrabold' :
                        log.action === 'FALLBACK_TRIGGERED' ? 'bg-amber-100 text-amber-800 font-bold' :
                        log.action === 'DUPLICATE_SUPPRESSED' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700 font-semibold">{log.actor}</td>
                    <td className="p-2.5 text-blue-700">{log.notification_id || '-'}</td>
                    <td className="p-2.5 text-slate-600">
                      {log.previous_state || 'NONE'} → <strong>{log.new_state || 'SAME'}</strong>
                    </td>
                    <td className="p-2.5 text-slate-700 font-sans max-w-md">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPATCH NOTIFICATION MODAL */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-blue-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Dispatch Polar Notification</h3>
                  <p className="text-xs text-slate-500">
                    Creates a deterministic notification, resolves recipients, and routes to In-App, SMS, and Email.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchNotification} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Source Module */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Module</label>
                  <select
                    value={newNotif.source_module}
                    onChange={(e) => setNewNotif({ ...newNotif, source_module: e.target.value as SourceModule })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="EMERGENCY">Emergency Management</option>
                    <option value="WEATHER">Weather & Meteorology</option>
                    <option value="INVENTORY">Inventory & Food Logistics</option>
                    <option value="ASSET">Equipment & Assets</option>
                    <option value="SHIPMENT">Shipment & Maritime</option>
                    <option value="PERSONNEL">Personnel & Medical</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Tier</label>
                  <select
                    value={newNotif.priority}
                    onChange={(e) => setNewNotif({ ...newNotif, priority: e.target.value as NotificationPriority })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 font-bold text-slate-800"
                  >
                    <option value="CRITICAL">🔴 CRITICAL (Mandatory All Channels)</option>
                    <option value="HIGH">🟠 HIGH (In-App + Email)</option>
                    <option value="NORMAL">🔵 NORMAL (In-App + Email)</option>
                    <option value="LOW">⚪ LOW (In-App Only)</option>
                  </select>
                </div>

                {/* Notification Type */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notification Type</label>
                  <select
                    value={newNotif.notification_type}
                    onChange={(e) => {
                      const nt = e.target.value as NotificationType;
                      let tCode = 'CRITICAL_EMERGENCY';
                      if (nt === 'FOOD_REQUIREMENT') tCode = 'FOOD_REQUIREMENT';
                      if (nt === 'ASSET_REQUIREMENT') tCode = 'ASSET_REQUIREMENT';
                      if (nt === 'SHIPMENT_DELAY') tCode = 'SHIPMENT_DELAY';
                      if (nt === 'WEATHER_WARNING') tCode = 'WEATHER_WARNING';
                      setNewNotif({ ...newNotif, notification_type: nt, template_code: tCode });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 font-mono"
                  >
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="CRITICAL_WEATHER_EMERGENCY">CRITICAL_WEATHER_EMERGENCY</option>
                    <option value="WEATHER_WARNING">WEATHER_WARNING</option>
                    <option value="FOOD_REQUIREMENT">FOOD_REQUIREMENT</option>
                    <option value="INVENTORY_SHORTAGE">INVENTORY_SHORTAGE</option>
                    <option value="ASSET_REQUIREMENT">ASSET_REQUIREMENT</option>
                    <option value="SHIPMENT_DELAY">SHIPMENT_DELAY</option>
                    <option value="SHIPMENT_ARRIVAL">SHIPMENT_ARRIVAL</option>
                    <option value="MAINTENANCE_ALERT">MAINTENANCE_ALERT</option>
                  </select>
                </div>

                {/* Target Station */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Station</label>
                  <select
                    value={newNotif.station_id || 'bharati'}
                    onChange={(e) => setNewNotif({ ...newNotif, station_id: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="bharati">Bharati Station (Larsemann Hills)</option>
                    <option value="maitri">Maitri Station (Schirmacher Oasis)</option>
                    <option value="himadri">Himadri (Svalbard Arctic)</option>
                  </select>
                </div>
              </div>

              {/* Custom Title Override */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject / Title Override (Optional)</label>
                <input
                  type="text"
                  value={newNotif.custom_title || ''}
                  onChange={(e) => setNewNotif({ ...newNotif, custom_title: e.target.value })}
                  placeholder="Leave blank to use pre-approved deterministic template subject"
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Template Params Description */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-700">Template Context Parameters:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <input
                    type="text"
                    value={newNotif.template_params?.description || ''}
                    onChange={(e) => setNewNotif({
                      ...newNotif,
                      template_params: { ...newNotif.template_params, description: e.target.value }
                    })}
                    placeholder="Incident description..."
                    className="col-span-2 p-1.5 rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={newNotif.template_params?.shortage || '3,500 kg'}
                    onChange={(e) => setNewNotif({
                      ...newNotif,
                      template_params: { ...newNotif.template_params, shortage: e.target.value }
                    })}
                    placeholder="Shortage quantity (e.g. 3,500 kg)"
                    className="p-1.5 rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={newNotif.template_params?.reported_by || 'Operations Watch'}
                    onChange={(e) => setNewNotif({
                      ...newNotif,
                      template_params: { ...newNotif.template_params, reported_by: e.target.value }
                    })}
                    placeholder="Reported by..."
                    className="p-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requires_ack"
                  checked={newNotif.requires_acknowledgement ?? true}
                  onChange={(e) => setNewNotif({ ...newNotif, requires_acknowledgement: e.target.checked })}
                  className="rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="requires_ack" className="text-slate-700 font-semibold cursor-pointer">
                  Require Formal Operational Acknowledgement (Critical safety response loop)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Notification Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMAL ACKNOWLEDGEMENT MODAL */}
      {ackTargetNotif && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-rose-300 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-100 text-rose-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Formal Operational Acknowledgement</h3>
                <p className="text-xs text-slate-500 font-mono">{ackTargetNotif.notification_code}</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900">
              <p className="font-bold">{ackTargetNotif.title}</p>
              <p className="text-rose-700 mt-1 line-clamp-3 font-mono">{ackTargetNotif.message}</p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Acknowledging Officer Identity / Sign-off:</label>
              <input
                type="text"
                value={ackOfficerName}
                onChange={(e) => setAckOfficerName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-rose-500 font-semibold text-slate-900"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setAckTargetNotif(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleAcknowledge(ackTargetNotif.id, ackOfficerName)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Sign Acknowledgement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE CREATE / EDIT MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-blue-200 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingTemplate ? `Edit Template: ${editingTemplate.template_code}` : 'Create Custom Deterministic Template'}
                </h3>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Template Code (Unique identifier):</label>
                  <input
                    type="text"
                    disabled={!!editingTemplate}
                    value={templateForm.template_code}
                    onChange={(e) => setTemplateForm({ ...templateForm, template_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                    placeholder="e.g. TPL_CUSTOM_RUNWAY"
                    required
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold uppercase bg-slate-50 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Template Friendly Name:</label>
                  <input
                    type="text"
                    value={templateForm.template_name}
                    onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })}
                    placeholder="e.g. Skiway Ice Runway Advisory"
                    required
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notification Type Category:</label>
                  <select
                    value={templateForm.notification_type}
                    onChange={(e) => setTemplateForm({ ...templateForm, notification_type: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="GENERAL_UPDATE">GENERAL_UPDATE</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="WEATHER">WEATHER</option>
                    <option value="FOOD_REQUIREMENT">FOOD_REQUIREMENT</option>
                    <option value="INVENTORY_SHORTAGE">INVENTORY_SHORTAGE</option>
                    <option value="ASSET_REQUIREMENT">ASSET_REQUIREMENT</option>
                    <option value="SHIPMENT_DELAY">SHIPMENT_DELAY</option>
                    <option value="SHIPMENT_ARRIVAL">SHIPMENT_ARRIVAL</option>
                    <option value="PERSONNEL_ALERT">PERSONNEL_ALERT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Transmit Channel:</label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="ALL">ALL (In-App + SMS + Email)</option>
                    <option value="IN_APP">IN_APP Only</option>
                    <option value="SMS">SMS (Satellite Iridium SBD) Only</option>
                    <option value="EMAIL">EMAIL Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject Line Template <span className="text-slate-400 font-normal">(use {'{{token}}'} format)</span>:
                </label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="e.g. ⚠️ Polar Advisory: {{station_name}} - {{topic}}"
                  required
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Message Body Template <span className="text-slate-400 font-normal">(deterministic placeholders)</span>:
                </label>
                <textarea
                  rows={5}
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Variables / Tokens Description <span className="text-slate-400 font-normal">(comma-separated)</span>:
                </label>
                <input
                  type="text"
                  value={templateForm.variables_description}
                  onChange={(e) => setTemplateForm({ ...templateForm, variables_description: e.target.value })}
                  placeholder="station_name, topic, summary, issued_by, date"
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>

              {/* Sample Token Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <span className="font-semibold text-slate-600 block">Token Interpolation Validation:</span>
                <p className="text-[11px] text-slate-500">
                  During automated dispatch, the template engine verifies all placeholder tokens match incoming module fields. Null or missing tokens are safely reported rather than hallucinated.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIMULATE MULTI-MODULE EVENT TRIGGER MODAL */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-indigo-200 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Simulate Subsystem Integration Triggers</h3>
                  <p className="text-xs text-slate-500">Trigger automated cross-module alerting as defined in NCPOR System Specifications</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Scenario 1: Shipment Delay */}
              <div
                onClick={() => handleSimulateModuleTrigger('SHIPMENT_DELAY')}
                className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 cursor-pointer transition space-y-1.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-1.5">
                    <span>🚢</span> Shipment Schedule Delay
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">HIGH</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cargo vessel <em>MV Vasiliy Golovnin</em> encounters pack ice in Roaring Forties. Transmits delay notice to India-based Logistics Officer.
                </p>
                <span className="text-[10px] font-semibold text-blue-600 inline-block pt-1">Trigger Event →</span>
              </div>

              {/* Scenario 2: Shipment Arrival */}
              <div
                onClick={() => handleSimulateModuleTrigger('SHIPMENT_ARRIVAL')}
                className="bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl p-3.5 cursor-pointer transition space-y-1.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1.5">
                    <span>⚓</span> Vessel Anchorage Arrival
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">NORMAL</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <em>SA Agulhas II</em> arrives at Princess Astrid Coast (Maitri). Alerts Station Leader and Cargo Handling Crew.
                </p>
                <span className="text-[10px] font-semibold text-emerald-600 inline-block pt-1">Trigger Event →</span>
              </div>

              {/* Scenario 3: Food Resupply Requirement */}
              <div
                onClick={() => handleSimulateModuleTrigger('FOOD_REQUIREMENT')}
                className="bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl p-3.5 cursor-pointer transition space-y-1.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-amber-800 flex items-center gap-1.5">
                    <span>🍲</span> Inventory Food Shortage
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">HIGH</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Predictive ML engine forecasts Freeze-Dried High-Calorie Rations reaching critical reserve at Maitri in 21 days.
                </p>
                <span className="text-[10px] font-semibold text-amber-700 inline-block pt-1">Trigger Event →</span>
              </div>

              {/* Scenario 4: Asset Equipment Shortage */}
              <div
                onClick={() => handleSimulateModuleTrigger('ASSET_REQUIREMENT')}
                className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 cursor-pointer transition space-y-1.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-indigo-700 flex items-center gap-1.5">
                    <span>🚜</span> Snowcat Machinery Shortage
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">HIGH</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ice runway grooming equipment deficit detected at Bharati Station. Routes requisition to Equipment Supply Officer.
                </p>
                <span className="text-[10px] font-semibold text-indigo-600 inline-block pt-1">Trigger Event →</span>
              </div>

              {/* Scenario 5: Blizzard Weather Emergency */}
              <div
                onClick={() => handleSimulateModuleTrigger('WEATHER_BLIZZARD')}
                className="bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl p-3.5 cursor-pointer transition space-y-1.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-rose-700 flex items-center gap-1.5">
                    <span>❄️</span> Cataclysmic Blizzard Alert
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold animate-pulse">CRITICAL</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Larsemann Hills weather station detects 84-knot sustained winds and zero visibility. Mandatory bunker isolation alert.
                </p>
                <span className="text-[10px] font-semibold text-rose-600 inline-block pt-1">Trigger Event →</span>
              </div>

              {/* Scenario 6: Generator Emergency */}
              <div
                onClick={() => handleSimulateModuleTrigger('GENERATOR_EMERGENCY')}
                className="bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl p-3.5 cursor-pointer transition space-y-1.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-rose-700 flex items-center gap-1.5">
                    <span>🚨</span> Power Genset Failure
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold animate-pulse">CRITICAL</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Primary Diesel Genset #1 tripped at Maitri during subzero storm. Forcible broadcast requiring formal signed acknowledgement.
                </p>
                <span className="text-[10px] font-semibold text-rose-600 inline-block pt-1">Trigger Event →</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
