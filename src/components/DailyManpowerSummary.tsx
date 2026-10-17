import React, { useState } from 'react';
import {
  MessageSquare,
  Copy,
  Check,
  Share2,
  Building2,
  Clock,
  Calendar,
  X,
  Edit2,
  Trash2,
  Plus,
  Users,
} from 'lucide-react';
import { Site, Worker, SiteAllocation } from '../types';
import { formatSingleSiteWhatsApp, formatMasterWhatsAppDeployment, formatDateForWorkHeader } from '../utils/whatsappFormatter';
import { formatUAETime, formatUAEDateLong } from '../utils/uaeTime';

interface DailyManpowerSummaryProps {
  sites: Site[];
  workers: Worker[];
  allocations: Record<string, SiteAllocation>;
  selectedDate: string;
  uaeTime: Date;
  onShowToast: (message: string) => void;
  onRemoveWorkerFromSite: (workerId: string, siteId: string) => void;
  onOpenEditSite: (site: Site) => void;
  onOpenAddSite: () => void;
  onDeleteSite?: (siteId: string) => void;
}

export const DailyManpowerSummary: React.FC<DailyManpowerSummaryProps> = ({
  sites,
  workers,
  allocations,
  selectedDate,
  uaeTime,
  onShowToast,
  onRemoveWorkerFromSite,
  onOpenEditSite,
  onOpenAddSite,
  onDeleteSite,
}) => {
  const [copiedSiteId, setCopiedSiteId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'preview'>('cards');
  const [confirmDeleteSiteId, setConfirmDeleteSiteId] = useState<string | null>(null);

  const formattedDateHeader = formatDateForWorkHeader(selectedDate);

  // Worker lookup map
  const workerMap = new Map<string, Worker>();
  workers.forEach((w) => workerMap.set(w.id, w));

  const totalDeployedWorkers = Object.values(allocations).reduce(
    (sum, alloc) => sum + (alloc?.workerIds?.length || 0),
    0
  );

  // Copy individual site in screenshot format
  const handleCopySite = async (site: Site) => {
    const alloc = allocations[site.id] || { workerIds: [] };
    const siteWorkers = alloc.workerIds
      .map((id) => workerMap.get(id))
      .filter((w): w is Worker => Boolean(w));

    let foremanName = site.inchargeName;
    if (!foremanName && alloc.foremanId) {
      foremanName = workerMap.get(alloc.foremanId)?.name;
    }

    const isCradle = site.name.toUpperCase().includes('CRADLE');
    const text = formatSingleSiteWhatsApp({
      site,
      workers: siteWorkers,
      foremanName,
      reportingTime: site.reportingTime || '6:00AM',
      includePin: !isCradle,
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSiteId(site.id);
      onShowToast(`Copied "${site.name}" WhatsApp list to clipboard!`);
      setTimeout(() => setCopiedSiteId(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
      onShowToast('Could not copy to clipboard. Please copy manually.');
    }
  };

  // Copy all sites matching screenshot format
  const handleCopyAll = async () => {
    const text = formatMasterWhatsAppDeployment({
      sites,
      allocations,
      workerMap,
      dateStr: selectedDate,
      headerPrefix: 'WORK',
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      onShowToast(`Copied WORK - ${formattedDateHeader} master list for WhatsApp!`);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
      onShowToast('Could not copy to clipboard. Please copy manually.');
    }
  };

  const handleOpenWhatsAppShare = () => {
    const text = formatMasterWhatsAppDeployment({
      sites,
      allocations,
      workerMap,
      dateStr: selectedDate,
      headerPrefix: 'WORK',
    });
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDeleteSiteClick = (siteId: string) => {
    if (confirmDeleteSiteId === siteId) {
      onDeleteSite?.(siteId);
      setConfirmDeleteSiteId(null);
    } else {
      setConfirmDeleteSiteId(siteId);
      setTimeout(() => setConfirmDeleteSiteId((prev) => (prev === siteId ? null : prev)), 3000);
    }
  };

  const masterWhatsAppText = formatMasterWhatsAppDeployment({
    sites,
    allocations,
    workerMap,
    dateStr: selectedDate,
    headerPrefix: 'WORK',
  });

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
      {/* Top Section Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  WORK - {formattedDateHeader}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  WhatsApp Format
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalDeployedWorkers} Total Headcount deployed across {sites.length} worksites
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Controls: View Switcher, Copy All, WhatsApp Share */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Site Boards
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Text Preview
            </button>
          </div>

          {/* Master Copy Button */}
          <button
            onClick={handleCopyAll}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer ${
              copiedAll
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title="Copy entire deployment list matching WhatsApp format"
          >
            {copiedAll ? <Check className="w-4 h-4 font-bold" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? 'Copied Master List!' : 'COPY ALL (WhatsApp)'}</span>
          </button>

          <button
            onClick={handleOpenWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Open in WhatsApp Web"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp Share</span>
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="p-4 sm:p-5">
        {viewMode === 'preview' ? (
          /* Raw formatted WhatsApp text box */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Exact text format for WhatsApp (matching screenshot):</span>
              <button
                onClick={handleCopyAll}
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Entire Text</span>
              </button>
            </div>
            <pre className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-emerald-300/90 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto selection:bg-amber-500 selection:text-slate-950">
              {masterWhatsAppText}
            </pre>
          </div>
        ) : (
          /* Visual Site Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sites.map((site) => {
              const alloc = allocations[site.id] || { workerIds: [] };
              const siteWorkers = alloc.workerIds
                .map((id) => workerMap.get(id))
                .filter((w): w is Worker => Boolean(w));

              const isCopied = copiedSiteId === site.id;
              const effectiveIncharge = site.inchargeName || 'Qadeer';
              const effectiveTime = site.reportingTime || '6:00AM';
              const isCradle = site.name.toUpperCase().includes('CRADLE');
              const isDeletingSite = confirmDeleteSiteId === site.id;

              return (
                <div
                  key={site.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm transition-all"
                >
                  {/* Site Header */}
                  <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm uppercase tracking-wider truncate">
                        {!isCradle && <span className="text-rose-500">📍</span>}
                        <span className="truncate">{site.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        With <span className="text-amber-300">{effectiveIncharge}</span> /{' '}
                        <span className="font-mono text-slate-300">{effectiveTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* One click copy for this site */}
                      <button
                        onClick={() => handleCopySite(site)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700'
                        }`}
                        title="Copy WhatsApp text for this site"
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => onOpenEditSite(site)}
                        className="p-1 text-slate-500 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit site details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteSite && (
                        <>
                          {isDeletingSite ? (
                            <button
                              onClick={() => handleDeleteSiteClick(site.id)}
                              className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold animate-pulse cursor-pointer"
                              title="Click again to confirm delete"
                            >
                              Delete?
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteSiteClick(site.id)}
                              className="p-1 text-slate-600 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete site"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Worker Names List (Matching numbered format) */}
                  <div className="p-3.5 flex-1 min-h-[140px] max-h-[300px] overflow-y-auto space-y-1">
                    {siteWorkers.length === 0 ? (
                      <div className="text-slate-500 text-xs italic py-6 text-center">
                        (No workers assigned)
                      </div>
                    ) : (
                      siteWorkers.map((w, index) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-900 group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-slate-500 text-[11px] w-4">
                              {index + 1}.
                            </span>
                            <span className="font-medium text-slate-100 truncate">
                              {w.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-400">
                              {w.company}
                            </span>
                            <button
                              onClick={() => onRemoveWorkerFromSite(w.id, site.id)}
                              className="p-0.5 text-slate-600 hover:text-rose-400 rounded cursor-pointer"
                              title="Unassign worker from this site"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Card Footer with count */}
                  <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      Headcount: <strong className="text-emerald-400">{siteWorkers.length}</strong>
                    </span>
                    <button
                      onClick={() => handleCopySite(site)}
                      className="text-amber-400 hover:underline text-[10px] cursor-pointer"
                    >
                      Copy text
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
