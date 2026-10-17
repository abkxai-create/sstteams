import React, { useState, useMemo } from 'react';
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

  // Fast map from worker ID to assigned site
  const workerSiteMap = useMemo(() => {
    const map = new Map<string, { siteId: string; siteName: string; isForeman: boolean }>();
    sites.forEach((site) => {
      const alloc = allocations[site.id];
      if (alloc) {
        alloc.workerIds.forEach((wId) => {
          map.set(wId, {
            siteId: site.id,
            siteName: site.name,
            isForeman: alloc.foremanId === wId,
          });
        });
      }
    });
    return map;
  }, [sites, allocations]);

  // Unique companies
  const companies = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((w) => {
      if (w.company) set.add(w.company);
    });
    return Array.from(set).sort();
  }, [workers]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (w.status !== 'active') return false;

      // Search query
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = w.name.toLowerCase().includes(q);
        const matchDesig = w.designation.toLowerCase().includes(q);
        const matchComp = w.company.toLowerCase().includes(q);
        const matchCode = w.empCode.toLowerCase().includes(q);
        if (!matchName && !matchDesig && !matchComp && !matchCode) return false;
      }

      // Company filter
      if (companyFilter !== 'all' && w.company !== companyFilter) {
        return false;
      }

      // Site assignment filter
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
      return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
    }
    if (c.includes('mountain') || c.includes('sky')) {
      return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60';
    }
    if (c.includes('outsider') || c.includes('sub')) {
      return 'bg-purple-950/60 text-purple-300 border-purple-800/60';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const handleDeleteClick = (workerId: string) => {
    if (confirmDeleteWorkerId === workerId) {
      onDeleteWorker(workerId);
      setConfirmDeleteWorkerId(null);
    } else {
      setConfirmDeleteWorkerId(workerId);
      // Auto reset confirm after 3 seconds
      setTimeout(() => setConfirmDeleteWorkerId((prev) => (prev === workerId ? null : prev)), 3000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
      {/* Top Filter & Actions Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Workers ({workers.length})</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              {deployedCount} Assigned
            </span>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              {unassignedCount} Free
            </span>
          </h2>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative min-w-[170px] sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search worker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
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
            className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Workers</option>
            <option value="unassigned">⚠️ Free Pool Only</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                📍 {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenAddWorker}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Worker</span>
          </button>

          <button
            onClick={onOpenAddSite}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors cursor-pointer"
          >
            <Building2 className="w-3 h-3 text-amber-400" />
            <span>Site</span>
          </button>
        </div>
      </div>

      {/* Workers Table with SEPARATE COLUMNS FOR COMPANY AND DESIGNATION */}
      <div className="overflow-x-auto max-h-[620px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 sticky top-0 z-10 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 select-none">
            <tr>
              <th className="py-2.5 px-3 font-bold w-44">Worker Name</th>
              <th className="py-2.5 px-3 font-bold w-32">Company</th>
              <th className="py-2.5 px-3 font-bold w-44">Designation</th>
              <th className="py-2.5 px-3 font-bold">Assign to Site (1-Click)</th>
              <th className="py-2.5 px-3 font-bold text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-500 text-xs">
                  No workers match current filter.
                </td>
              </tr>
            ) : (
              filteredWorkers.map((worker) => {
                const assignment = workerSiteMap.get(worker.id);
                const currentSiteId = assignment?.siteId;
                const isDeleting = confirmDeleteWorkerId === worker.id;

                return (
                  <tr
                    key={worker.id}
                    className="hover:bg-slate-950/70 transition-colors group"
                  >
                    {/* COLUMN 1: Worker Name */}
                    <td className="py-2.5 px-3 font-bold text-white text-sm whitespace-nowrap">
                      <span>{worker.name}</span>
                      {worker.empCode && (
                        <span className="text-[10px] font-mono text-slate-500 font-normal ml-1.5">
                          #{worker.empCode}
                        </span>
                      )}
                    </td>

                    {/* COLUMN 2: Company (Dedicated Column) */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCompanyBadgeClass(
                          worker.company
                        )}`}
                      >
                        {worker.company}
                      </span>
                    </td>

                    {/* COLUMN 3: Designation (Dedicated Column) */}
                    <td className="py-2.5 px-3 text-slate-300 font-medium whitespace-nowrap">
                      {worker.designation}
                    </td>

                    {/* COLUMN 4: 1-Click Site Assignment */}
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
                              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                isAssignedToThisSite
                                  ? 'bg-emerald-500 text-slate-950 font-bold border border-emerald-400 shadow-sm'
                                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-amber-400'
                              }`}
                              title={`Assign ${worker.name} to ${site.name}`}
                            >
                              {isAssignedToThisSite ? (
                                <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                              ) : (
                                <span className="text-[10px] text-amber-400">📍</span>
                              )}
                              <span className="truncate max-w-[130px] sm:max-w-[170px]">
                                {site.name}
                              </span>
                            </button>
                          );
                        })}

                        {/* Free / Pool button */}
                        <button
                          onClick={() => onDetachWorkerToPool(worker.id)}
                          disabled={!assignment}
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                            !assignment
                              ? 'opacity-30 text-slate-600 cursor-default'
                              : 'text-slate-400 hover:text-rose-300 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-700 cursor-pointer'
                          }`}
                          title="Free to available pool"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Free</span>
                        </button>
                      </div>
                    </td>

                    {/* COLUMN 5: Actions (Edit & Direct Delete without window.confirm) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenEditWorker(worker)}
                          className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit worker"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {isDeleting ? (
                          <button
                            onClick={() => handleDeleteClick(worker.id)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold animate-pulse cursor-pointer"
                            title="Click again to confirm delete"
                          >
                            Delete?
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteClick(worker.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete worker"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span>Showing {filteredWorkers.length} of {workers.length} active workers</span>
        <button
          onClick={onOpenSitesMaster}
          className="text-amber-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
        >
          <Building2 className="w-3 h-3" />
          <span>Master Sites ({sites.length})</span>
        </button>
      </div>
    </div>
  );
};
