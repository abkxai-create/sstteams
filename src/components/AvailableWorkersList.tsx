import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  GripVertical,
  Plus,
  Filter,
  UserCheck,
  UserX,
  Users,
  Building,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { Worker, Site } from '../types';

interface AvailableWorkersListProps {
  workers: Worker[];
  sites: Site[];
  allocations: Record<string, { foremanId?: string; workerIds: string[] }>;
  selectedWorkerIds: string[];
  onToggleSelectWorker: (workerId: string) => void;
  onSelectAllFiltered: (workerIds: string[]) => void;
  onClearSelection: () => void;
  onAssignWorkersToSite: (workerIds: string[], siteId: string) => void;
  onReturnWorkersToAvailable: (workerIds: string[]) => void;
  onDragStart: (e: React.DragEvent, workerIds: string[], sourceSiteId?: string) => void;
  onDropOnAvailablePool: (e: React.DragEvent) => void;
  onOpenWorkerModal: () => void;
}

export const AvailableWorkersList: React.FC<AvailableWorkersListProps> = ({
  workers,
  sites,
  allocations,
  selectedWorkerIds,
  onToggleSelectWorker,
  onSelectAllFiltered,
  onClearSelection,
  onAssignWorkersToSite,
  onReturnWorkersToAvailable,
  onDragStart,
  onDropOnAvailablePool,
  onOpenWorkerModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'assigned'>('unassigned');
  const [targetSiteId, setTargetSiteId] = useState<string>(sites[0]?.id || '');
  const [isDragOverPool, setIsDragOverPool] = useState(false);

  // Map each worker to their current assigned site if any
  const workerSiteAssignmentMap = useMemo(() => {
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

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      // Must be active worker
      if (w.status !== 'active') return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = w.name.toLowerCase().includes(term);
        const matchDesig = w.designation.toLowerCase().includes(term);
        const matchComp = w.company.toLowerCase().includes(term);
        const matchCode = w.empCode.toLowerCase().includes(term);
        if (!matchName && !matchDesig && !matchComp && !matchCode) return false;
      }

      // Company filter
      if (selectedCompany !== 'all' && w.company !== selectedCompany) {
        return false;
      }

      // Designation filter
      if (selectedDesignation !== 'all') {
        if (!w.designation.toLowerCase().includes(selectedDesignation.toLowerCase())) {
          return false;
        }
      }

      // Status filter
      const isAssigned = workerSiteAssignmentMap.has(w.id);
      if (statusFilter === 'unassigned' && isAssigned) return false;
      if (statusFilter === 'assigned' && !isAssigned) return false;

      return true;
    });
  }, [workers, searchTerm, selectedCompany, selectedDesignation, statusFilter, workerSiteAssignmentMap]);

  // Quick stats
  const unassignedCount = workers.filter((w) => w.status === 'active' && !workerSiteAssignmentMap.has(w.id)).length;
  const assignedCount = workers.filter((w) => w.status === 'active' && workerSiteAssignmentMap.has(w.id)).length;

  const handleSelectAllToggle = () => {
    const filteredIds = filteredWorkers.map((w) => w.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedWorkerIds.includes(id));
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAllFiltered(filteredIds);
    }
  };

  const areAllFilteredSelected =
    filteredWorkers.length > 0 &&
    filteredWorkers.every((w) => selectedWorkerIds.includes(w.id));

  const handleBatchAssign = () => {
    if (selectedWorkerIds.length === 0 || !targetSiteId) return;
    onAssignWorkersToSite(selectedWorkerIds, targetSiteId);
    onClearSelection();
  };

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
    <div
      className={`bg-slate-900 border rounded-xl flex flex-col h-full shadow-lg transition-colors ${
        isDragOverPool ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/50' : 'border-slate-800'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOverPool(true);
      }}
      onDragLeave={() => setIsDragOverPool(false)}
      onDrop={(e) => {
        setIsDragOverPool(false);
        onDropOnAvailablePool(e);
      }}
    >
      {/* Top Header of Available Section */}
      <div className="p-3.5 border-b border-slate-800 space-y-3 bg-slate-900/90 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Available Workers</span>
                <span className="text-xs font-mono text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                  {unassignedCount} Free
                </span>
              </h2>
              <div className="text-[11px] text-slate-400">
                {totalWorkforceText(workers.length, assignedCount)}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenWorkerModal}
            className="text-xs px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Worker</span>
          </button>
        </div>

        {/* Drop target prompt when dragging back */}
        <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-dashed border-slate-700 text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Drag workers here to unassign / return to pool</span>
          </span>
          {isDragOverPool && <span className="text-amber-400 font-bold animate-pulse">Release to Unassign!</span>}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, trade, company, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs (Anti-slop clean segmented control) */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setStatusFilter('unassigned')}
            className={`py-1 rounded text-center transition-colors ${
              statusFilter === 'unassigned'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unassigned ({unassignedCount})
          </button>
          <button
            onClick={() => setStatusFilter('assigned')}
            className={`py-1 rounded text-center transition-colors ${
              statusFilter === 'assigned'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deployed ({assignedCount})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`py-1 rounded text-center transition-colors ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Active ({workers.filter((w) => w.status === 'active').length})
          </button>
        </div>

        {/* Company & Designation Filter Dropdowns */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Companies</option>
              {companies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Designation</label>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Trades</option>
              <option value="Foreman">Foremen & Supervisors</option>
              <option value="CISRS">CISRS / Certified</option>
              <option value="Scaffolder">Scaffolders (L1/L2)</option>
              <option value="Helper">Helpers</option>
              <option value="Driver">Drivers / Heavy Operators</option>
              <option value="Yard">Yard & Maintenance</option>
            </select>
          </div>
        </div>

        {/* Multi-Select & Batch Assignment Controls */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={handleSelectAllToggle}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            {areAllFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-amber-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Select All Filtered ({filteredWorkers.length})</span>
          </button>

          {selectedWorkerIds.length > 0 && (
            <button
              onClick={onClearSelection}
              className="text-amber-400 hover:underline text-[11px]"
            >
              Deselect ({selectedWorkerIds.length})
            </button>
          )}
        </div>

        {/* Fast Batch Assign Toolbar when 1 or more workers selected */}
        {selectedWorkerIds.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-2">
            <div className="text-xs text-amber-300 font-semibold flex items-center gap-1 whitespace-nowrap">
              <span>{selectedWorkerIds.length} workers selected</span>
            </div>
            <div className="flex items-center gap-1.5 w-full">
              <select
                value={targetSiteId}
                onChange={(e) => setTargetSiteId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    Assign to: {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBatchAssign}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-md flex items-center gap-1 shadow-sm transition-colors whitespace-nowrap"
              >
                <span>Assign</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Workers Cards Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[350px]">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500">
            <UserX className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-medium text-slate-400">No workers match this filter</p>
            <p className="text-[11px] text-slate-600 mt-1">Try clearing search or switching status</p>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const isSelected = selectedWorkerIds.includes(worker.id);
            const assignment = workerSiteAssignmentMap.get(worker.id);

            // Determine if dragged as individual or part of multi-select
            const dragPayload = isSelected && selectedWorkerIds.length > 1
              ? selectedWorkerIds
              : [worker.id];

            return (
              <div
                key={worker.id}
                draggable
                onDragStart={(e) => {
                  onDragStart(e, dragPayload, assignment?.siteId);
                }}
                className={`group relative p-2.5 rounded-lg border text-xs transition-all cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                    : assignment
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950 border-slate-800 hover:border-amber-500/40 hover:bg-slate-950/90'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Select Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectWorker(worker.id);
                    }}
                    className="mt-0.5 text-slate-500 hover:text-white"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Drag Handle */}
                  <div className="mt-0.5 text-slate-600 group-hover:text-amber-400 transition-colors" title="Drag to site">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Worker Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                        <span>{worker.name}</span>
                        {assignment?.isForeman && (
                          <span className="text-[10px] text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-700">
                            Foreman
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {worker.empCode}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {worker.designation}
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px]">
                      {/* Company tag */}
                      <span
                        className={`px-1.5 py-0.5 rounded border font-medium ${getCompanyBadgeClass(
                          worker.company
                        )}`}
                      >
                        {worker.company}
                      </span>

                      {/* Current deployment status */}
                      {assignment ? (
                        <span className="text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40 truncate max-w-[150px]">
                          At: {assignment.siteName}
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          Available in Pool
                        </span>
                      )}

                      {worker.phone && (
                        <span className="text-slate-500 font-mono hidden sm:inline">
                          {worker.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fast Action Dropdown / Quick Button for touch / non-drag users */}
                  <div className="shrink-0 flex items-center gap-1">
                    {assignment ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReturnWorkersToAvailable([worker.id]);
                        }}
                        title="Return to available pool"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="relative group/menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (sites.length > 0) {
                              onAssignWorkersToSite([worker.id], sites[0].id);
                            }
                          }}
                          title={`Quick assign to ${sites[0]?.name || 'first site'}`}
                          className="px-2 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded text-[11px] font-medium border border-slate-700 transition-colors flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between rounded-b-xl">
        <span>Showing {filteredWorkers.length} of {workers.length} workers</span>
        <button
          onClick={onOpenWorkerModal}
          className="text-amber-400 hover:underline flex items-center gap-1"
        >
          <Layers className="w-3 h-3" />
          <span>Manage Workforce</span>
        </button>
      </div>
    </div>
  );
};

function totalWorkforceText(total: number, assigned: number): string {
  return `${assigned} deployed · ${total - assigned} in pool`;
}
