import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Building2, 
  User, 
  Compass, 
  Check, 
  FileText, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ExpeditionCreatePayload } from '../../types';

interface CreateExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ExpeditionCreatePayload) => Promise<void>;
}

export const CreateExpeditionModal: React.FC<CreateExpeditionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const currentYear = new Date().getFullYear();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<ExpeditionCreatePayload>({
    expedition_id: `EXP-${currentYear + 1}-046`,
    expedition_name: `46th Indian Scientific Expedition to Antarctica`,
    expedition_code: `ISEA-46`,
    expedition_year: currentYear + 1,
    target_region: 'Schirmacher Oasis (Maitri Station)',
    lead_organization: 'NCPOR - National Centre for Polar and Ocean Research',
    expedition_leader: 'Dr. Priya Verma',
    start_date: `${currentYear + 1}-11-15`,
    end_date: `${currentYear + 2}-04-05`,
    status: 'Planned',
    description: 'National polar mission focused on deep ice core drilling, solar microgrid deployment, and atmospheric trace gas quantification across Queen Maud Land.',
    mission_objective: 'Complete deep cryosphere core sampling to 400m depth, install automated glaciology radar, and establish clean renewable battery storage at Maitri-II site.',
    notes: 'Diplomatic clearance filed with ATCM secretariat. Charter vessel negotiations underway at Mormugao Port.'
  });

  if (!isOpen) return null;

  const handleChange = (field: keyof ExpeditionCreatePayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  const handleApplyTemplate = () => {
    const nextNum = Math.floor(Math.random() * 80) + 47;
    setFormData({
      expedition_id: `EXP-2027-0${nextNum}`,
      expedition_name: `${nextNum}th Indian Scientific Expedition to Antarctica`,
      expedition_code: `ISEA-${nextNum}`,
      expedition_year: 2027,
      target_region: 'Larsemann Hills (Bharati Station)',
      lead_organization: 'NCPOR - National Centre for Polar and Ocean Research',
      expedition_leader: 'Dr. Arvind Swaminathan',
      start_date: '2027-11-20',
      end_date: '2028-03-30',
      status: 'Planned',
      description: 'Systematic Southern Ocean biogeochemistry transect and subglacial bedrock seismic surveying.',
      mission_objective: 'Deploy 6 autonomous hydrographic gliders and service coastal satellite receiving antennas.',
      notes: 'Logistics coordination with Cape Town gateway operational committee confirmed.'
    });
    setErrorMessage(null);
  };

  const validateCurrentStep = (): boolean => {
    setErrorMessage(null);
    if (activeStep === 1) {
      if (!formData.expedition_id.trim()) {
        setErrorMessage('Expedition ID is required (e.g. EXP-2026-001).');
        return false;
      }
      if (!formData.expedition_name.trim()) {
        setErrorMessage('Expedition Name is required.');
        return false;
      }
      if (!formData.expedition_code.trim()) {
        setErrorMessage('Expedition Code is required (e.g. ISEA-45).');
        return false;
      }
      if (!formData.expedition_year || formData.expedition_year < 1950) {
        setErrorMessage('A valid Expedition Year is required.');
        return false;
      }
    }

    if (activeStep === 2) {
      if (!formData.target_region.trim()) {
        setErrorMessage('Target Region is required (e.g. Larsemann Hills).');
        return false;
      }
      if (!formData.lead_organization.trim()) {
        setErrorMessage('Lead Organization is required (e.g. NCPOR).');
        return false;
      }
      if (!formData.expedition_leader.trim()) {
        setErrorMessage('Expedition Leader name is required.');
        return false;
      }
    }

    if (activeStep === 4) {
      if (!formData.start_date || !formData.end_date) {
        setErrorMessage('Both Start Date and End Date are required.');
        return false;
      }
      if (formData.end_date < formData.start_date) {
        setErrorMessage('End date cannot be before start date.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Final validation
    if (!formData.expedition_id.trim() || !formData.expedition_code.trim() || !formData.expedition_name.trim()) {
      setErrorMessage('Identification fields cannot be blank.');
      return;
    }
    if (formData.end_date < formData.start_date) {
      setErrorMessage('End date cannot be before start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create expedition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Identification', subtitle: 'ID, Code & Title' },
    { num: 2, title: 'Deployment', subtitle: 'Region & Leadership' },
    { num: 3, title: 'Scientific Scope', subtitle: 'Objectives & Scope' },
    { num: 4, title: 'Schedule & Status', subtitle: 'Timeline & Notes' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-400/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Register New Antarctic Expedition</h2>
              <p className="text-xs text-blue-200">
                National Centre for Polar and Ocean Research (NCPOR)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
              title="Populate with standard Indian Antarctic Research Expedition template"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sample Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Section Stepper */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {steps.map((step) => {
              const isCurrent = activeStep === step.num;
              const isPassed = activeStep > step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (validateCurrentStep()) {
                      setActiveStep(step.num);
                    }
                  }}
                  className={`text-left p-2 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isPassed
                      ? 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                      : 'bg-white text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={`w-4 h-4 rounded-full text-[10px] inline-flex items-center justify-center ${
                      isCurrent ? 'bg-white text-blue-600' : isPassed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isPassed ? '✓' : step.num}
                    </span>
                    <span className="truncate">{step.title}</span>
                  </div>
                  <div className={`text-[10px] mt-0.5 truncate ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                    {step.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Identification & Registration */}
          {activeStep === 1 && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600">
                Enter primary registration credentials for the Antarctic campaign. Expedition ID and Expedition Code must be unique.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Expedition ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-expedition-id"
                    type="text"
                    required
                    placeholder="e.g. EXP-2026-001"
                    value={formData.expedition_id}
                    onChange={(e) => handleChange('expedition_id', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Unique system identifier.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Expedition Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-expedition-code"
                    type="text"
                    required
                    placeholder="e.g. ISEA-45"
                    value={formData.expedition_code}
                    onChange={(e) => handleChange('expedition_code', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Short mission callsign.</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Official Expedition Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-expedition-name"
                  type="text"
                  required
                  placeholder="e.g. 45th Indian Scientific Expedition to Antarctica"
                  value={formData.expedition_name}
                  onChange={(e) => handleChange('expedition_name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Expedition Year <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-expedition-year"
                  type="number"
                  required
                  min={1950}
                  max={2100}
                  value={formData.expedition_year}
                  onChange={(e) => handleChange('expedition_year', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Section 2: Deployment & Leadership */}
          {activeStep === 2 && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600">
                Specify the Antarctic geographical sector, organizing agency, and appointed field commander.
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Target Region / Station Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-target-region"
                  type="text"
                  required
                  placeholder="e.g. Larsemann Hills (Bharati Station) or Schirmacher Oasis"
                  value={formData.target_region}
                  onChange={(e) => handleChange('target_region', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Lead Organization <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-lead-organization"
                  type="text"
                  required
                  placeholder="e.g. NCPOR - National Centre for Polar and Ocean Research"
                  value={formData.lead_organization}
                  onChange={(e) => handleChange('lead_organization', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Expedition Leader <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-expedition-leader"
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Asthana (Scientist-G)"
                  value={formData.expedition_leader}
                  onChange={(e) => handleChange('expedition_leader', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Section 3: Scientific Scope & Objectives */}
          {activeStep === 3 && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600">
                Define the overarching scientific mandate, research projects, and operational tasks.
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Expedition Scope & Description
                </label>
                <textarea
                  id="textarea-description"
                  rows={3}
                  placeholder="Provide detailed background, scientific disciplines involved, and operational scope..."
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Primary Mission Objectives
                </label>
                <textarea
                  id="textarea-mission-objective"
                  rows={3}
                  placeholder="List key scientific deliverables, infrastructure tasks, or environmental surveys..."
                  value={formData.mission_objective || ''}
                  onChange={(e) => handleChange('mission_objective', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Section 4: Schedule, Lifecycle & Notes */}
          {activeStep === 4 && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600">
                Set operational deployment timeline and initial status. Note: End Date cannot precede Start Date.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-start-date"
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-end-date"
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Initial Status
                </label>
                <select
                  id="select-initial-status"
                  value={formData.status || 'Planned'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Planned">Planned (Standard drafting state)</option>
                  <option value="Approved">Approved (Pre-cleared authorization)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  New expeditions typically initialize in 'Planned' status and progress through authorization.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Logistics & Diplomatic Notes
                </label>
                <textarea
                  id="textarea-notes"
                  rows={3}
                  placeholder="Internal logistics notes, environmental clearance directives, vessel charter notes..."
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Modal Footer / Navigation Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  id="btn-modal-prev-step"
                  onClick={() => setActiveStep((prev) => prev - 1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              {activeStep < 4 ? (
                <button
                  type="button"
                  id="btn-modal-next-step"
                  onClick={() => {
                    if (validateCurrentStep()) {
                      setActiveStep((prev) => prev + 1);
                    }
                  }}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-xs"
                >
                  Next Section
                </button>
              ) : (
                <button
                  type="submit"
                  id="btn-modal-submit-expedition"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Register Expedition'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
