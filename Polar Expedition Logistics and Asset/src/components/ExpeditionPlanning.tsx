import React, { useState, useEffect, useCallback } from 'react';
import { 
  Compass, 
  Search, 
  RefreshCw, 
  UserCheck, 
  Layers, 
  LayoutDashboard, 
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { 
  ExpeditionRecord, 
  DashboardStats, 
  ExpeditionFilterParams, 
  ExpeditionCreatePayload, 
  ExpeditionUpdatePayload, 
  UserRole 
} from '../types';
import { 
  fetchExpeditionDashboardStats, 
  fetchExpeditionsApi, 
  searchExpeditionsApi, 
  createExpeditionApi, 
  updateExpeditionApi, 
  deleteExpeditionApi,
  setActiveRole
} from '../lib/api';

import { ExpeditionDashboard } from './expedition/ExpeditionDashboard';
import { ExpeditionList } from './expedition/ExpeditionList';
import { CreateExpeditionModal } from './expedition/CreateExpeditionModal';
import { ExpeditionDetailsModal } from './expedition/ExpeditionDetailsModal';
import { EditExpeditionModal } from './expedition/EditExpeditionModal';
import { DeleteExpeditionModal } from './expedition/DeleteExpeditionModal';

interface ExpeditionPlanningProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  openCreateTrigger?: number;
}

export const ExpeditionPlanning: React.FC<ExpeditionPlanningProps> = ({
  currentRole = 'LOGISTICS_OFFICER',
  onRoleChange,
  openCreateTrigger,
}) => {
  // Map application role to Expedition Planning permission model:
  // LOGISTICS_OFFICER / STATION_COMMANDER / SCIENTIST -> Expedition Manager
  // VIEWER -> Viewer
  const [internalRole, setInternalRole] = useState<'Expedition Manager' | 'VIEWER'>(
    currentRole === 'VIEWER' ? 'VIEWER' : 'Expedition Manager'
  );

  // Synchronize internal role when parent role changes
  useEffect(() => {
    const mapped = currentRole === 'VIEWER' ? 'VIEWER' : 'Expedition Manager';
    setInternalRole(mapped);
    setActiveRole(mapped);
  }, [currentRole]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  useEffect(() => {
    if (openCreateTrigger && openCreateTrigger > 0) {
      setShowCreateModal(true);
    }
  }, [openCreateTrigger]);

  const handleToggleRole = (newRole: 'Expedition Manager' | 'VIEWER') => {
    setInternalRole(newRole);
    setActiveRole(newRole);
    if (onRoleChange) {
      onRoleChange(newRole === 'VIEWER' ? 'VIEWER' : 'LOGISTICS_OFFICER');
    }
  };

  // View state: 'dashboard' | 'list'
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'list'>('dashboard');

  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [expeditions, setExpeditions] = useState<ExpeditionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter state
  const [filterParams, setFilterParams] = useState<ExpeditionFilterParams>({
    q: '',
    status: 'ALL',
  });

  // Modal states
  const [selectedExpeditionId, setSelectedExpeditionId] = useState<string | null>(null);
  const [expeditionToEdit, setExpeditionToEdit] = useState<ExpeditionRecord | null>(null);
  const [expeditionToDelete, setExpeditionToDelete] = useState<ExpeditionRecord | null>(null);

  // Load Dashboard Stats
  const loadStats = useCallback(async () => {
    try {
      const data = await fetchExpeditionDashboardStats();
      setDashboardStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Load / Search Expeditions
  const loadExpeditions = useCallback(async (params: ExpeditionFilterParams) => {
    try {
      setLoading(true);
      const data = await searchExpeditionsApi(params);
      setExpeditions(data);
    } catch (err: any) {
      console.error('Failed to load expeditions:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to query expeditions' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadStats();
    loadExpeditions(filterParams);
  }, [loadStats, loadExpeditions]);

  // Handle filter changes
  const handleFilterChange = (updates: Partial<ExpeditionFilterParams>) => {
    const next = { ...filterParams, ...updates };
    setFilterParams(next);
    loadExpeditions(next);
  };

  const handleResetFilters = () => {
    const empty: ExpeditionFilterParams = { q: '', status: 'ALL' };
    setFilterParams(empty);
    loadExpeditions(empty);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadExpeditions(filterParams)]);
    setLoading(false);
  };

  // Create
  const handleCreateExpedition = async (payload: ExpeditionCreatePayload) => {
    const created = await createExpeditionApi(payload);
    setNotification({
      type: 'success',
      message: `Expedition ${created.expedition_id} (${created.expedition_name}) successfully registered!`
    });
    await loadStats();
    await loadExpeditions(filterParams);
    // Automatically open the details modal for the newly registered expedition
    setSelectedExpeditionId(created.expedition_id);
  };

  // Update
  const handleUpdateExpedition = async (id: string, payload: ExpeditionUpdatePayload) => {
    const updated = await updateExpeditionApi(id, payload);
    setNotification({
      type: 'success',
      message: `Expedition ${updated.expedition_id} successfully updated.`
    });
    await loadStats();
    await loadExpeditions(filterParams);
  };

  // Delete
  const handleExpeditionDeleted = async () => {
    setNotification({
      type: 'success',
      message: `Expedition successfully removed from registry.`
    });
    await loadStats();
    await loadExpeditions(filterParams);
  };

  // Transition / status changed
  const handleStatusChanged = async () => {
    await loadStats();
    await loadExpeditions(filterParams);
  };

  // Auto-dismiss notification after 5s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  return (
    <div className="space-y-6">
      {/* Global Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs border ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Sub-View Content */}
      {activeSubView === 'dashboard' ? (
        <ExpeditionDashboard
          stats={dashboardStats}
          loading={loading}
          onRefresh={handleRefresh}
          onNavigateToList={(filter) => {
            if (filter) {
              setFilterParams((prev) => ({ ...prev, ...filter }));
              loadExpeditions({ ...filterParams, ...filter });
            }
            setActiveSubView('list');
          }}
          onOpenCreate={() => setShowCreateModal(true)}
          onSelectExpedition={(id) => setSelectedExpeditionId(id)}
          userRole={internalRole}
        />
      ) : (
        <ExpeditionList
          expeditions={expeditions}
          loading={loading}
          filterParams={filterParams}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onRefresh={handleRefresh}
          onOpenCreate={() => setShowCreateModal(true)}
          onSelectExpedition={(id) => setSelectedExpeditionId(id)}
          onOpenEdit={(exp) => setExpeditionToEdit(exp)}
          onOpenDelete={(exp) => setExpeditionToDelete(exp)}
          userRole={internalRole}
          onBackToDashboard={() => setActiveSubView('dashboard')}
        />
      )}

      {/* MODALS */}
      {/* 1. Create Modal */}
      <CreateExpeditionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateExpedition}
      />

      {/* 2. Details Modal */}
      <ExpeditionDetailsModal
        isOpen={!!selectedExpeditionId}
        expeditionId={selectedExpeditionId}
        onClose={() => setSelectedExpeditionId(null)}
        onOpenEdit={(exp) => {
          setSelectedExpeditionId(null);
          setExpeditionToEdit(exp);
        }}
        onOpenDelete={(exp) => {
          setSelectedExpeditionId(null);
          setExpeditionToDelete(exp);
        }}
        onStatusChanged={handleStatusChanged}
        userRole={internalRole}
      />

      {/* 3. Edit Modal */}
      <EditExpeditionModal
        isOpen={!!expeditionToEdit}
        expedition={expeditionToEdit}
        onClose={() => setExpeditionToEdit(null)}
        onSubmit={handleUpdateExpedition}
        userRole={internalRole}
      />

      {/* 4. Delete Modal (with operational records check) */}
      <DeleteExpeditionModal
        isOpen={!!expeditionToDelete}
        expedition={expeditionToDelete}
        onClose={() => setExpeditionToDelete(null)}
        onDeleted={handleExpeditionDeleted}
        onStatusChanged={handleStatusChanged}
        userRole={internalRole}
      />
    </div>
  );
};
