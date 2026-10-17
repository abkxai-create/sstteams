import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Copy,
  Check,
  Share2,
  X,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';
import { Site, Worker, SiteAllocation } from '../types';
import {
  formatSingleSiteWhatsApp,
  formatMasterWhatsAppDeployment,
  formatDateForWorkHeader,
} from '../utils/whatsappFormatter';

interface DailyManpowerSummaryProps {
  sites: Site[];
  workers: Worker[];
  allocations: Record<string, SiteAllocation>;
  selectedDate: string;
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

  const workerMap = useMemo(() => {
    const map = new Map<string, Worker>();
    workers.forEach((w) => map.set(w.id, w));
    return map;
  }, [workers]);

  const totalDeployedWorkers = useMemo(
    () =>
      Object.values(allocations).reduce(
        (sum, alloc) => sum + (alloc?.worker_ids?.length || 0),
        0
      ),
    [allocations]
  );

  const masterWhatsAppText = formatMasterWhatsAppDeployment({
    sites,
    allocations,
    workerMap,
    dateStr: selectedDate,
    headerPrefix: 'WORK',
  });

  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      onShowToast('Could not copy to clipboard. Please copy manually.');
      return false;
    }
  };

  const handleCopySite = async (site: Site) => {
    const alloc = allocations[site.id];
    const siteWorkers = (alloc?.worker_ids || [])
      .map((id) => workerMap.get(id))
      .filter((w): w is Worker => Boolean(w));

    let foremanName = site.incharge_name || undefined;
    if (!foremanName && alloc?.foreman_id) {
      foremanName = workerMap.get(alloc.foreman_id)?.name;
    }

    const isCradle = site.name.toUpperCase().includes('CRADLE');
    const text = formatSingleSiteWhatsApp({
      site,
      workers: siteWorkers,
      foremanName,
      reportingTime: site.reporting_time || '6:00AM',
      includePin: !isCradle,
    });

    if (await copyToClipboard(text, '')) {
      setCopiedSiteId(site.id);
      onShowToast(`Copied "${site.name}" WhatsApp list!`);
      setTimeout(() => setCopiedSiteId(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    if (await copyToClipboard(masterWhatsAppText, '')) {
      setCopiedAll(true);
      onShowToast(`Copied WORK - ${formattedDateHeader} master list!`);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleOpenWhatsAppShare = () => {
    const encoded = encodeURIComponent(masterWhatsAppText);
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

  return (
    <section className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
      {/* Section header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                WORK - {formattedDateHeader}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                WhatsApp Format
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {totalDeployedWorkers} headcount deployed across {sites.length} worksites
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            {(['cards', 'preview'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  viewMode === mode
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'cards' ? 'Site Boards' : 'Raw Text'}
              </button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCopyAll}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors ${
              copiedAll
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? 'Copied Master List!' : 'COPY ALL (WhatsApp)'}</span>
          </motion.button>

          <button
            onClick={handleOpenWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        {viewMode === 'preview' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Exact text format for WhatsApp:</span>
              <button
                onClick={handleCopyAll}
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Entire Text</span>
              </button>
            </div>
            <pre className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-emerald-300/90 whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto">
              {masterWhatsAppText}
            </pre>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sites.map((site, index) => {
              const alloc = allocations[site.id];
              const siteWorkers = (alloc?.worker_ids || [])
                .map((id) => workerMap.get(id))
                .filter((w): w is Worker => Boolean(w));

              const isCopied = copiedSiteId === site.id;
              const effectiveIncharge = site.incharge_name || 'Qadeer';
              const effectiveTime = site.reporting_time || '6:00AM';
              const isCradle = site.name.toUpperCase().includes('CRADLE');
              const isDeletingSite = confirmDeleteSiteId === site.id;
              const target = site.target_headcount || 0;
              const fillPct = target > 0 ? Math.min(100, (siteWorkers.length / target) * 100) : 0;

              return (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 220, damping: 24 }}
                  className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col shadow-lg shadow-black/20 transition-colors"
                >
                  {/* Site header */}
                  <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-start justify-between gap-2">
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
                      <button
                        onClick={() => handleCopySite(site)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          isCopied
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                        }`}
                        title="Copy WhatsApp text for this site"
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => onOpenEditSite(site)}
                        className="p-1 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Edit site details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteSite &&
                        (isDeletingSite ? (
                          <button
                            onClick={() => handleDeleteSiteClick(site.id)}
                            className="px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-bold animate-pulse"
                            title="Click again to confirm delete"
                          >
                            Delete?
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteSiteClick(site.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Delete site"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Headcount progress bar */}
                  {target > 0 && (
                    <div className="px-3.5 pt-3">
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            fillPct >= 100
                              ? 'bg-emerald-500'
                              : fillPct >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {siteWorkers.length} of {target} target headcount
                      </div>
                    </div>
                  )}

                  {/* Worker list */}
                  <div className="p-3.5 flex-1 min-h-[120px] max-h-[300px] overflow-y-auto space-y-1">
                    {siteWorkers.length === 0 ? (
                      <div className="text-slate-500 text-xs italic py-6 text-center">
                        (No workers assigned)
                      </div>
                    ) : (
                      siteWorkers.map((w, index) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-900 group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-slate-500 text-[11px] w-4">
                              {index + 1}.
                            </span>
                            <span className="font-medium text-slate-100 truncate">{w.name}</span>
                            {alloc?.foreman_id === w.id && (
                              <span className="text-[9px] text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-700/60">
                                Lead
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-400">
                              {w.company}
                            </span>
                            <button
                              onClick={() => onRemoveWorkerFromSite(w.id, site.id)}
                              className="p-0.5 text-slate-600 hover:text-rose-400 rounded"
                              title="Return worker to free pool"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      Headcount:{' '}
                      <strong className="text-emerald-400">{siteWorkers.length}</strong>
                    </span>
                    <button
                      onClick={() => handleCopySite(site)}
                      className="text-amber-400 hover:underline text-[10px]"
                    >
                      Copy text
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
