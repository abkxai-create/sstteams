import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Star,
  X,
  ArrowRight,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  HardHat,
  Users,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Site, Worker, SiteAllocation } from '../types';

interface SiteAllocationBoardProps {
  sites: Site[];
  workers: Worker[];
  allocations: Record<string, SiteAllocation>;
  onAssignWorkersToSite: (workerIds: string[], siteId: string) => void;
  onRemoveWorkerFromSite: (workerId: string, siteId: string) => void;
  onClearSiteWorkers: (siteId: string) => void;
  onSetSiteForeman: (siteId: string, foremanId?: string) => void;
  onMoveWorkerBetweenSites: (workerId: string, fromSiteId: string, toSiteId: string) => void;
  onReorderSites: (siteId: string, direction: 'prev' | 'next') => void;
  onOpenAddSiteModal: () => void;
  onOpenEditSiteModal: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onDragStart: (e: React.DragEvent, workerIds: string[], sourceSiteId?: string) => void;
  onDropOnSite: (e: React.DragEvent, targetSiteId: string) => void;
}

export const SiteAllocationBoard: React.FC<SiteAllocationBoardProps> = ({
  sites,
  workers,
  allocations,
  onAssignWorkersToSite,
  onRemoveWorkerFromSite,
  onClearSiteWorkers,
  onSetSiteForeman,
  onMoveWorkerBetweenSites,
  onReorderSites,
  onOpenAddSiteModal,
  onOpenEditSiteModal,
  onDeleteSite,
  onDragStart,
  onDropOnSite,
}) => {
  const [dragOverSiteId, setDragOverSiteId] = useState<string | null>(null);

  // Helper map for fast worker lookup
  const workerMap = new Map<string, Worker>();
  workers.forEach((w) => workerMap.set(w.id, w));

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

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Sites Top Bar with Add Site Action */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Active Worksite Blocks</span>
              <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                {sites.length} Projects
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Drag workers into any site block · Designate foreman with ⭐ · Reorder or customize projects
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddSiteModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Site</span>
        </button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-1">
        {sites.map((site, index) => {
          const alloc = allocations[site.id] || { siteId: site.id, workerIds: [] };
          const assignedWorkers = alloc.workerIds
            .map((id) => workerMap.get(id))
            .filter((w): w is Worker => Boolean(w));

          const foreman = alloc.foremanId ? workerMap.get(alloc.foremanId) : undefined;
          const otherWorkers = assignedWorkers.filter((w) => w.id !== alloc.foremanId);
          const isDragOver = dragOverSiteId === site.id;

          const otherSites = sites.filter((s) => s.id !== site.id);

          return (
            <div
              key={site.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverSiteId(site.id);
              }}
              onDragLeave={() => {
                if (dragOverSiteId === site.id) setDragOverSiteId(null);
              }}
              onDrop={(e) => {
                setDragOverSiteId(null);
                onDropOnSite(e, site.id);
              }}
              className={`flex flex-col bg-slate-900 border rounded-xl shadow-md transition-all duration-150 ${
                isDragOver
                  ? 'border-amber-400 ring-2 ring-amber-400/60 bg-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Site Card Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 rounded-t-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        #{index + 1}
                      </span>
                      {site.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {site.code}
                        </span>
                      )}
                      <h3 className="font-bold text-white text-sm truncate" title={site.name}>
                        {site.name}
                      </h3>
                    </div>

                    {site.location && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5" title={site.location}>
                        📍 {site.location}
                      </p>
                    )}
                  </div>

                  {/* Site Header Controls: Reorder, Edit, Delete */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => onReorderSites(site.id, 'prev')}
                      disabled={index === 0}
                      title="Move Left / Up"
                      className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 rounded"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderSites(site.id, 'next')}
                      disabled={index === sites.length - 1}
                      title="Move Right / Down"
                      className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 rounded"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenEditSiteModal(site)}
                      title="Edit Site Details"
                      className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSite(site.id)}
                      title="Remove Site"
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Headcount progress ribbon */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-white">
                      {assignedWorkers.length} {assignedWorkers.length === 1 ? 'Worker' : 'Workers'}
                    </span>
                    {site.targetHeadcount && (
                      <span className="text-slate-500 text-[11px]">
                        / {site.targetHeadcount} target
                      </span>
                    )}
                  </div>

                  {assignedWorkers.length > 0 && (
                    <button
                      onClick={() => onClearSiteWorkers(site.id)}
                      title="Unassign all workers from this site"
                      className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Foreman Designation Area */}
              <div className="p-2.5 bg-slate-950/70 border-b border-slate-800">
                {foreman ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Site Foreman:
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {foreman.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                          <span>{foreman.designation}</span>
                          <span>·</span>
                          <span className="text-amber-300">{foreman.company}</span>
                          {foreman.phone && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-slate-500">{foreman.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSetSiteForeman(site.id, undefined)}
                      title="Unset as Foreman (worker remains in crew)"
                      className="p-1 text-slate-400 hover:text-amber-400 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-dashed border-slate-800 text-slate-500 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[11px]">No Foreman marked</span>
                    </span>
                    {assignedWorkers.length > 0 && (
                      <span className="text-[10px] text-amber-400">
                        Click ⭐ on worker below
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Assigned Workers List */}
              <div className="p-3 flex-1 overflow-y-auto space-y-2 min-h-[160px] max-h-[360px]">
                {assignedWorkers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 text-slate-500 border border-dashed border-slate-800/80 rounded-lg bg-slate-950/30">
                    <HardHat className="w-6 h-6 text-slate-600 mb-1.5" />
                    <p className="text-xs font-medium text-slate-400">Site is empty</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Drop workers here or use multi-assign on left
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Render Foreman Card First if designated */}
                    {foreman && (
                      <div
                        key={foreman.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, [foreman.id], site.id)}
                        className="group flex items-center justify-between p-2 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs shadow-sm cursor-grab active:cursor-grabbing hover:bg-amber-950/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-amber-500/50 group-hover:text-amber-400" />
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate flex items-center gap-1">
                              <span>{foreman.name}</span>
                              <span className="text-[10px] text-amber-400 font-normal">
                                (Lead)
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {foreman.designation} · {foreman.company}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Move to another site dropdown */}
                          {otherSites.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  onMoveWorkerBetweenSites(foreman.id, site.id, e.target.value);
                                }
                              }}
                              value=""
                              className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded px-1 py-0.5 cursor-pointer hover:border-amber-500"
                              title="Move to another site"
                            >
                              <option value="" disabled>
                                Move to...
                              </option>
                              {otherSites.map((os) => (
                                <option key={os.id} value={os.id}>
                                  {os.name}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            onClick={() => onRemoveWorkerFromSite(foreman.id, site.id)}
                            title="Remove from site to available pool"
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Render Other Crew Members */}
                    {otherWorkers.map((worker) => (
                      <div
                        key={worker.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, [worker.id], site.id)}
                        className="group flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400" />
                          <button
                            onClick={() => onSetSiteForeman(site.id, worker.id)}
                            title="Designate as Foreman"
                            className="p-0.5 text-slate-600 hover:text-amber-400 rounded transition-colors"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-200 truncate">
                              {worker.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                              <span>{worker.designation}</span>
                              <span
                                className={`px-1 py-0.2 rounded text-[9px] border ${getCompanyBadgeClass(
                                  worker.company
                                )}`}
                              >
                                {worker.company}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Move to another site dropdown */}
                          {otherSites.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  onMoveWorkerBetweenSites(worker.id, site.id, e.target.value);
                                }
                              }}
                              value=""
                              className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] rounded px-1 py-0.5 cursor-pointer hover:border-amber-500"
                              title="Move to another site"
                            >
                              <option value="" disabled>
                                Move to...
                              </option>
                              {otherSites.map((os) => (
                                <option key={os.id} value={os.id}>
                                  {os.name}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            onClick={() => onRemoveWorkerFromSite(worker.id, site.id)}
                            title="Remove from site to available pool"
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Site Block Footer with Drag Notice */}
              <div className="p-2.5 bg-slate-950/40 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between rounded-b-xl">
                <span>{assignedWorkers.length} assigned</span>
                {isDragOver ? (
                  <span className="text-amber-400 font-semibold animate-pulse">
                    Drop to assign!
                  </span>
                ) : (
                  <span className="text-slate-600">Drop zone active</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
