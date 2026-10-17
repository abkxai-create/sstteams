import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Users,
  Check,
  Building2,
  RotateCcw,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Worker, Site, SiteAllocation } from '../types';

interface OneClickWorkerSiteAllocatorProps {
  workers: Worker[];
  sites: Site[];
  allocations: Record<string, SiteAllocation>;
  onAttachWorkerToSite: (workerId: string, siteId: string) => void;
  onDetachWorkerToPool: (workerId: string) => void;
  onOpenAddWorker: () => void;
  onOpenEditWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
  onOpenAddSite: () => void;
  onOpenSitesMaster: () => void;
}

export const OneClickWorkerSiteAllocator: React.FC<OneClickWorkerSiteAllocatorProps> = ({
  workers,
  sites,
  allocations,
  onAttachWorkerToSite,
  onDetachWorkerToPool,
  onOpenAddWorker,
  onOpenEditWorker,
  onDeleteWorker,
  onOpenAddSite,
  onOpenSitesMaster,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState<'all' | 'unassigned' | string>('all');
  const [confirmDeleteWorkerId, setConfirmDeleteWorkerId] = useState<string | null>(null);

  const workerSiteMap = useMemo(() => {
    const map = new Map<string, { siteId: string; siteName: string; isForeman: boolean }>();
    sites.forEach((site) => {
      const alloc = allocations[site.id];
      if (alloc) {
        alloc.worker_ids.forEach((wId) => {
          map.set(wId, {
            siteId: site.id,
            siteName: site.name,
            isForeman: alloc.foreman_id === wId,
          });
        });
      }
    });
    return map;
  }, [sites, allocations]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((w) => {
      if (w.company) set.add(w.company);
    });
    return Array.from(set).sort();
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (w.status !== 'active') return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          w.name.toLowerCase().includes(q) ||
          w.designation.toLowerCase().includes(q) ||
          w.company.toLowerCase().includes(q) ||
          w.emp_code.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (companyFilter !== 'all' && w.company !== companyFilter) return false;

      const assignment = workerSiteMap.get(w.id);
      if (siteFilter === 'unassigned' && assignment) return false;
      if (siteFilter !== 'all' && siteFilter !== 'unassigned') {
        if (assignment?.siteId !== siteFilter) return false;
      }

      return true;
    });
  }, [workers, searchTerm, companyFilter, siteFilter, workerSiteMap]);

  const unassignedCount = workers.filter(
    (w) => w.status === 'active' && !workerSiteMap.has(w.id)
  ).length;

  const deployedCount = workers.filter(
    (w) => w.status === 'active' && workerSiteMap.has(w.id)
  ).length;

  const getCompanyBadgeClass = (company: string) => {
    const c = company.toLowerCase();
    if (c.includes('sst/sajja') || c.includes('sajja')) {
      return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
    }
    if (c.includes('sst')) {
      return 'bg-sky-950/60 text-sky-300 border-sky-800/60';
    }
    if (c.includes('mountain') || c.includes('sky')) {
      return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60';
    }
    if (c.includes('outsider') || c.includes('sub')) {
      return 'bg-teal-950/60 text-teal-300 border-teal-800/60';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const handleDeleteClick = (workerId: string) => {
    if (confirmDeleteWorkerId === workerId) {
      onDeleteWorker(workerId);
      setConfirmDeleteWorkerId(null);
    } else {
      setConfirmDeleteWorkerId(workerId);
      setTimeout(() => setConfirmDeleteWorkerId((prev) => (prev === workerId ? null : prev)), 3000);
    }
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl shadow-xl shadow-black/20 flex flex-col overflow-hidden">
      {/* Header row */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Workers ({workers.length})</span>
          </h2>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
            {deployedCount} deployed
          </span>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/40">
            {unassignedCount} free
          </span>
        </div>

        <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-2 text-xs">
          <div className="relative flex-1 min-w-[150px] xs:max-w-[220px] sm:w-52 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search worker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="flex-1 xs:flex-none bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
          >
            <option value="all">All Companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="flex-1 xs:flex-none bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
          >
            <option value="all">All Workers</option>
            <option value="unassigned">Free Pool Only</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 xs:contents">
            <button
              onClick={onOpenAddWorker}
              className="flex items-center justify-center gap-1 px-2.5 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Worker</span>
            </button>

            <button
              onClick={onOpenAddSite}
              className="flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workers: card list on mobile, table on desktop */}
      <div className="max-h-[560px] overflow-y-auto">
        {/* Mobile cards */}
        <div className="lg:hidden p-3 space-y-2.5">
          <AnimatePresence initial={false}>
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-14 text-slate-500 text-xs">
                No workers match the current filter.
              </div>
            ) : (
              filteredWorkers.map((worker) => {
                const assignment = workerSiteMap.get(worker.id);
                const currentSiteId = assignment?.siteId;
                const isDeleting = confirmDeleteWorkerId === worker.id;

                return (
                  <motion.div
                    key={worker.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2.5"
                  >
                    {/* Card top row: identity + actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                          <span className="truncate">{worker.name}</span>
                          {worker.emp_code && (
                            <span className="text-[10px] font-mono text-slate-500 font-normal shrink-0">
                              #{worker.emp_code}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {worker.designation}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onOpenEditWorker(worker)}
                          className="p-2 text-slate-400 active:text-amber-400 rounded-lg active:bg-slate-800 transition-colors"
                          aria-label={`Edit ${worker.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isDeleting ? (
                          <button
                            onClick={() => handleDeleteClick(worker.id)}
                            className="px-2 py-1 bg-rose-600 text-white rounded-full text-[10px] font-bold animate-pulse"
                          >
                            Delete?
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteClick(worker.id)}
                            className="p-2 text-slate-400 active:text-rose-400 rounded-lg active:bg-slate-800 transition-colors"
                            aria-label={`Delete ${worker.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Company + status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCompanyBadgeClass(worker.company)}`}
                      >
                        {worker.company}
                      </span>
                      {assignment ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/40 truncate max-w-[160px]">
                          At: {assignment.siteName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                          Free pool
                        </span>
                      )}
                    </div>

                    {/* Site buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {sites.map((site) => {
                        const isAssignedToThisSite = currentSiteId === site.id;
                        return (
                          <button
                            key={site.id}
                            onClick={() => {
                              if (isAssignedToThisSite) {
                                onDetachWorkerToPool(worker.id);
                              } else {
                                onAttachWorkerToSite(worker.id, site.id);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all duration-150 ${
                              isAssignedToThisSite
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30'
                                : 'bg-slate-900 active:bg-slate-800 text-slate-300 border border-slate-800 active:border-amber-400'
                            }`}
                          >
                            {isAssignedToThisSite ? (
                              <Check className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                            )}
                            <span className="truncate max-w-[110px]">{site.name}</span>
                          </button>
                        );
                      })}

                      <button
                        onClick={() => onDetachWorkerToPool(worker.id)}
                        disabled={!assignment}
                        className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-colors ${
                          !assignment
                            ? 'opacity-30 text-slate-600'
                            : 'text-slate-400 active:text-rose-400 active:bg-rose-950/40'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Free</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/95 backdrop-blur sticky top-0 z-10 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-800 select-none">
              <tr>
                <th className="py-2.5 px-3.5 font-bold w-44">Worker</th>
                <th className="py-2.5 px-3 font-bold w-32">Company</th>
                <th className="py-2.5 px-3 font-bold w-44">Designation</th>
                <th className="py-2.5 px-3 font-bold">Deploy to Site (1-Click)</th>
                <th className="py-2.5 px-3 font-bold text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-slate-500 text-xs">
                      No workers match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const assignment = workerSiteMap.get(worker.id);
                    const currentSiteId = assignment?.siteId;
                    const isDeleting = confirmDeleteWorkerId === worker.id;

                    return (
                      <motion.tr
                        key={worker.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="hover:bg-slate-950/60 transition-colors group border-b border-slate-800/50"
                      >
                        <td className="py-2.5 px-3.5 font-bold text-white text-sm whitespace-nowrap">
                          <span>{worker.name}</span>
                          {worker.emp_code && (
                            <span className="text-[10px] font-mono text-slate-500 font-normal ml-1.5">
                              #{worker.emp_code}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCompanyBadgeClass(worker.company)}`}
                          >
                            {worker.company}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-slate-300 font-medium whitespace-nowrap">
                          {worker.designation}
                        </td>

                        <td className="py-2 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {sites.map((site) => {
                              const isAssignedToThisSite = currentSiteId === site.id;
                              return (
                                <button
                                  key={site.id}
                                  onClick={() => {
                                    if (isAssignedToThisSite) {
                                      onDetachWorkerToPool(worker.id);
                                    } else {
                                      onAttachWorkerToSite(worker.id, site.id);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-150 ${
                                    isAssignedToThisSite
                                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30 scale-[1.02]'
                                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-amber-400'
                                  }`}
                                  title={`Deploy ${worker.name} to ${site.name}`}
                                >
                                  {isAssignedToThisSite ? (
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                                  )}
                                  <span className="truncate max-w-[130px] sm:max-w-[170px]">
                                    {site.name}
                                  </span>
                                </button>
                              );
                            })}

                            <button
                              onClick={() => onDetachWorkerToPool(worker.id)}
                              disabled={!assignment}
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                                !assignment
                                  ? 'opacity-30 text-slate-600 cursor-default'
                                  : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'
                              }`}
                              title="Return worker to free pool"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Free</span>
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenEditWorker(worker)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Edit worker"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {isDeleting ? (
                              <button
                                onClick={() => handleDeleteClick(worker.id)}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-[10px] font-bold animate-pulse"
                                title="Click again to confirm delete"
                              >
                                Delete?
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteClick(worker.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Delete worker"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between gap-2">
        <span>
          Showing {filteredWorkers.length} of {workers.length} active workers
        </span>
        <button
          onClick={onOpenSitesMaster}
          className="text-amber-400 hover:underline flex items-center gap-1 text-[11px] shrink-0"
        >
          <Building2 className="w-3 h-3" />
          <span>Master Sites ({sites.length})</span>
        </button>
      </div>
    </div>
  );
};
