import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Building2, 
  User, 
  Check, 
  ShieldAlert, 
  Lock
} from 'lucide-react';
import { ExpeditionRecord, ExpeditionUpdatePayload, UserRole } from '../../types';

interface EditExpeditionModalProps {
  isOpen: boolean;
  expedition: ExpeditionRecord | null;
  onClose: () => void;
  onSubmit: (id: string, payload: ExpeditionUpdatePayload) => Promise<void>;
  userRole: UserRole;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Planned: ['Planned', 'Approved', 'Cancelled'],
  Approved: ['Approved', 'Active', 'Cancelled'],
  Active: ['Active', 'Completed', 'Cancelled'],
  Completed: ['Completed'],
  Cancelled: ['Cancelled']
};

export const EditExpeditionModal: React.FC<EditExpeditionModalProps> = ({
  isOpen,
  expedition,
  onClose,
  onSubmit,
  userRole,
}) => {
  const isViewer = userRole === 'VIEWER';

  const [formData, setFormData] = useState<ExpeditionUpdatePayload>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (expedition) {
      setFormData({
        expedition_name: expedition.expedition_name,
        expedition_code: expedition.expedition_code,
        expedition_year: expedition.expedition_year,
        target_region: expedition.target_region,
        lead_organization: expedition.lead_organization,
        expedition_leader: expedition.expedition_leader,
        start_date: expedition.start_date,
        end_date: expedition.end_date,
        status: expedition.status,
        description: expedition.description || '',
        mission_objective: expedition.mission_objective || '',
        notes: expedition.notes || '',
      });
      setErrorMessage(null);
    }
  }, [expedition]);

  if (!isOpen || !expedition) return null;

  const validStatuses = ALLOWED_TRANSITIONS[expedition.status] || [expedition.status];

  const handleChange = (field: keyof ExpeditionUpdatePayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMessage('Viewer role is not authorized to edit expeditions.');
      return;
    }

    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      setErrorMessage('End date cannot be before start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSubmit(expedition.expedition_id, formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update expedition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Edit Expedition Record</h2>
              <p className="text-xs text-slate-400">
                Updating {expedition.expedition_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Non-editable system identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Expedition ID (Fixed)</span>
              </label>
              <input
                type="text"
                disabled
                value={expedition.expedition_id}
                className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 font-mono text-xs cursor-not-allowed"
                title="Primary expedition ID cannot be altered to maintain referential integrity."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expedition Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.expedition_code || ''}
                onChange={(e) => handleChange('expedition_code', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Title and Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Expedition Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.expedition_name || ''}
                onChange={(e) => handleChange('expedition_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Operational Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1950}
                max={2100}
                value={formData.expedition_year || ''}
                onChange={(e) => handleChange('expedition_year', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Region, Org, Leader */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Target Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.target_region || ''}
                onChange={(e) => handleChange('target_region', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Lead Organization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lead_organization || ''}
                onChange={(e) => handleChange('lead_organization', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Expedition Leader <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.expedition_leader || ''}
                onChange={(e) => handleChange('expedition_leader', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Timeline & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.end_date || ''}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Lifecycle Status (Controlled)
              </label>
              <select
                value={formData.status || expedition.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {validStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st} {st === expedition.status ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Objectives */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Mission Objective
            </label>
            <textarea
              rows={2}
              value={formData.mission_objective || ''}
              onChange={(e) => handleChange('mission_objective', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Description & Scope
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Logistics Notes & Directives
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isViewer}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
