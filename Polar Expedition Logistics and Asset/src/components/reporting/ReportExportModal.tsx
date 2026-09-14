import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, Printer, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { getExportUrl } from '../../lib/api.ts';
import { ReportFilterParams } from '../../types.ts';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: ReportFilterParams;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ isOpen, onClose, activeFilters }) => {
  const [reportType, setReportType] = useState<string>('expeditions');
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('pdf');
  const [includeClassified, setIncludeClassified] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const reportTypes = [
    { id: 'expeditions', label: 'Expeditions Operational Registry' },
    { id: 'personnel', label: 'Personnel Manifest & Station Deployments' },
    { id: 'cargo', label: 'Cargo & Freight Tracking Inventory' },
    { id: 'containers', label: 'Container Utilization & Stowage Tiers' },
    { id: 'shipments', label: 'Multi-Modal Shipments & Delay Metrics' },
    { id: 'inventory', label: 'Inventory Depletion & Stock Horizons' },
    { id: 'assets', label: 'Asset Lifecycle & Telemetry Reliability' },
    { id: 'emergencies', label: 'Emergency Incident Records & Timings' },
    { id: 'weather', label: 'Severe Weather Warnings & Radar Events' },
  ];

  const handleDownload = () => {
    setExporting(true);
    const url = getExportUrl(format, reportType, activeFilters);

    if (format === 'pdf') {
      // Open print view in new window / tab
      window.open(url, '_blank');
      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 500);
    } else {
      // Trigger file download
      const a = document.createElement('a');
      a.href = url;
      a.download = `POLARIS_${reportType}_Report.${format === 'csv' ? 'csv' : 'xls'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Export Operational Report</h2>
              <p className="text-xs text-slate-500">Generate formatted official polar command dispatches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Report Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Operational Domain
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Format Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  format === 'pdf'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Printer className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">Printable PDF</span>
                <span className="text-[10px] text-slate-400">Official Seal View</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  format === 'excel'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Excel (.xls)</span>
                <span className="text-[10px] text-slate-400">XML Spreadsheet</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  format === 'csv'
                    ? 'border-slate-800 bg-slate-100 text-slate-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-5 h-5 text-slate-700" />
                <span className="text-xs font-bold">Raw CSV</span>
                <span className="text-[10px] text-slate-400">Tabular Ingestion</span>
              </button>
            </div>
          </div>

          {/* Active Filter Scope Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inherited Active Filters Scope</span>
            </div>
            <p className="text-[11px] text-slate-500">
              The generated export will automatically include currently active filters: Date range (
              <strong>{activeFilters.dateRange || 'All'}</strong>), Station (
              <strong>{activeFilters.stationId || 'All'}</strong>
              {activeFilters.q ? `, Search Query: "${activeFilters.q}"` : ''}).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownload}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <span>Preparing Export...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
