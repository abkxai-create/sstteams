import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import {
  fetchWorkers,
  fetchSites,
  fetchAllocations,
  upsertAllocation,
  upsertWorker,
  upsertSite,
  deleteWorker,
  deleteSite,
} from './services/dataService';
import { exportToExcel } from './utils/excelHandler';
import { getTodayUAEDateString, getYesterdayDateString } from './utils/uaeTime';
import { Worker, Site, SiteAllocation } from './types';
import { Header } from './components/Header';
import { OneClickWorkerSiteAllocator } from './components/OneClickWorkerSiteAllocator';
import { DailyManpowerSummary } from './components/DailyManpowerSummary';
import { WorkerManageModal } from './components/WorkerManageModal';
import { SitesManageModal } from './components/SitesManageModal';
import { SiteEditModal } from './components/SiteEditModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { Toast } from './components/Toast';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayUAEDateString());
  const [uaeTime, setUaeTime] = useState<Date>(new Date());

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [allocations, setAllocations] = useState<Record<string, SiteAllocation>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isWorkerManageModalOpen, setIsWorkerManageModalOpen] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [isSitesManageModalOpen, setIsSitesManageModalOpen] = useState(false);
  const [isSiteEditModalOpen, setIsSiteEditModalOpen] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<Site | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToastMessage(msg), []);

  // UAE live clock
  useEffect(() => {
    const timer = setInterval(() => setUaeTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial load from database
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [w, s] = await Promise.all([fetchWorkers(), fetchSites()]);
      setWorkers(w);
      setSites(s);
      const allocs = await fetchAllocations(getTodayUAEDateString());
      const map: Record<string, SiteAllocation> = {};
      s.forEach((site) => {
        const found = allocs.find((a) => a.site_id === site.id);
        map[site.id] = found
          ? { work_date: found.work_date, site_id: found.site_id, foreman_id: found.foreman_id, worker_ids: found.worker_ids || [] }
          : { work_date: getTodayUAEDateString(), site_id: site.id, foreman_id: null, worker_ids: [] };
      });
      setAllocations(map);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load data from database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Reload allocations when the selected date changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const allocs = await fetchAllocations(selectedDate);
        if (cancelled) return;
        setAllocations((prev) => {
          const map: Record<string, SiteAllocation> = {};
          sites.forEach((site) => {
            const found = allocs.find((a) => a.site_id === site.id);
            map[site.id] = found
              ? { work_date: found.work_date, site_id: found.site_id, foreman_id: found.foreman_id, worker_ids: found.worker_ids || [] }
              : { work_date: selectedDate, site_id: site.id, foreman_id: null, worker_ids: [] };
          });
          return map;
        });
      } catch (err: any) {
        showToast(`Failed to load allocations: ${err.message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Persist an allocation map for the current date
  const persistAllocations = useCallback(
    async (newAlloc: Record<string, SiteAllocation>) => {
      setAllocations(newAlloc);
      setIsSaving(true);
      try {
        const changed = Object.values(newAlloc);
        await Promise.all(changed.map((a) => upsertAllocation({ ...a, work_date: selectedDate })));
      } catch (err: any) {
        showToast(`Failed to save: ${err.message}`);
      } finally {
        setIsSaving(false);
      }
    },
    [selectedDate, showToast]
  );

  const workerMap = useMemo(() => {
    const map = new Map<string, Worker>();
    workers.forEach((w) => map.set(w.id, w));
    return map;
  }, [workers]);

  const { deployedCount, unassignedCount } = useMemo(() => {
    const assignedSet = new Set<string>();
    Object.values(allocations).forEach((alloc) => {
      alloc?.worker_ids?.forEach((id) => assignedSet.add(id));
    });
    const activeWorkers = workers.filter((w) => w.status === 'active');
    const deployed = activeWorkers.filter((w) => assignedSet.has(w.id)).length;
    return {
      deployedCount: deployed,
      unassignedCount: activeWorkers.length - deployed,
    };
  }, [allocations, workers]);

  // --- 1-CLICK ATTACH WORKER TO SITE ---
  const handleAttachWorkerToSite = useCallback(
    (workerId: string, targetSiteId: string) => {
      const updated: Record<string, SiteAllocation> = {};

      Object.values(allocations).forEach((alloc) => {
        if (alloc.worker_ids.includes(workerId)) {
          updated[alloc.site_id] = {
            ...alloc,
            worker_ids: alloc.worker_ids.filter((id) => id !== workerId),
            foreman_id: alloc.foreman_id === workerId ? null : alloc.foreman_id,
          };
        }
      });

      const target = updated[targetSiteId] || allocations[targetSiteId] || {
        work_date: selectedDate,
        site_id: targetSiteId,
        foreman_id: null,
        worker_ids: [],
      };

      if (!target.worker_ids.includes(workerId)) {
        updated[targetSiteId] = {
          ...target,
          worker_ids: [...target.worker_ids, workerId],
        };
      }

      const merged = { ...allocations, ...updated };
      persistAllocations(merged);

      const worker = workerMap.get(workerId);
      const site = sites.find((s) => s.id === targetSiteId);
      showToast(`Attached ${worker?.name || 'Worker'} to ${site?.name || 'Site'}`);
    },
    [allocations, persistAllocations, workerMap, sites, selectedDate, showToast]
  );

  // --- 1-CLICK DETACH WORKER TO FREE POOL ---
  const handleDetachWorkerToPool = useCallback(
    (workerId: string) => {
      const updated: Record<string, SiteAllocation> = { ...allocations };
      let changed = false;

      Object.values(updated).forEach((alloc) => {
        if (alloc.worker_ids.includes(workerId)) {
          updated[alloc.site_id] = {
            ...alloc,
            worker_ids: alloc.worker_ids.filter((id) => id !== workerId),
            foreman_id: alloc.foreman_id === workerId ? null : alloc.foreman_id,
          };
          changed = true;
        }
      });

      if (changed) persistAllocations(updated);
      const worker = workerMap.get(workerId);
      showToast(`Freed ${worker?.name || 'Worker'} to available pool`);
    },
    [allocations, persistAllocations, workerMap, showToast]
  );

  const handleRemoveWorkerFromSite = useCallback(
    (workerId: string) => {
      handleDetachWorkerToPool(workerId);
    },
    [handleDetachWorkerToPool]
  );

  // --- MASTER SITES ACTIONS ---
  const handleOpenAddSite = useCallback(() => {
    setSiteToEdit(null);
    setIsSiteEditModalOpen(true);
  }, []);

  const handleOpenEditSite = useCallback((site: Site) => {
    setSiteToEdit(site);
    setIsSiteEditModalOpen(true);
  }, []);

  const handleSiteSaved = useCallback(
    (saved: Site) => {
      setSites((prev) => {
        const exists = prev.some((s) => s.id === saved.id);
        if (exists) return prev.map((s) => (s.id === saved.id ? saved : s));
        return [...prev, saved].sort((a, b) => a.sort_order - b.sort_order);
      });
      setAllocations((prev) => ({
        ...prev,
        [saved.id]: prev[saved.id] || {
          work_date: selectedDate,
          site_id: saved.id,
          foreman_id: null,
          worker_ids: [],
        },
      }));
    },
    [selectedDate]
  );

  const handleSiteDeleted = useCallback(
    (siteId: string) => {
      setSites((prev) => prev.filter((s) => s.id !== siteId));
      setAllocations((prev) => {
        const next = { ...prev };
        delete next[siteId];
        return next;
      });
    },
    []
  );

  const handleReorderSites = useCallback(
    async (siteId: string, direction: 'prev' | 'next') => {
      const index = sites.findIndex((s) => s.id === siteId);
      if (index === -1) return;

      const targetIndex = direction === 'prev' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sites.length) return;

      const newSites = [...sites];
      const temp = newSites[index];
      newSites[index] = newSites[targetIndex];
      newSites[targetIndex] = temp;

      const reordered = newSites.map((s, idx) => ({ ...s, sort_order: idx + 1 }));
      setSites(reordered);

      try {
        await Promise.all(reordered.map((s) => upsertSite(s)));
      } catch (err: any) {
        showToast(`Failed to save site order: ${err.message}`);
      }
    },
    [sites, showToast]
  );

  // --- MASTER WORKERS ACTIONS ---
  const handleWorkerSaved = useCallback((saved: Worker) => {
    setWorkers((prev) => {
      const exists = prev.some((w) => w.id === saved.id);
      if (exists) return prev.map((w) => (w.id === saved.id ? saved : w));
      return [saved, ...prev];
    });
  }, []);

  const handleWorkerDeleted = useCallback(
    (workerId: string) => {
      // Detach from any site first
      const updated: Record<string, SiteAllocation> = { ...allocations };
      let changed = false;
      Object.values(updated).forEach((alloc) => {
        if (alloc.worker_ids.includes(workerId)) {
          updated[alloc.site_id] = {
            ...alloc,
            worker_ids: alloc.worker_ids.filter((id) => id !== workerId),
            foreman_id: alloc.foreman_id === workerId ? null : alloc.foreman_id,
          };
          changed = true;
        }
      });
      if (changed) persistAllocations(updated);
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
    },
    [allocations, persistAllocations]
  );

  // --- EXCEL & DUPLICATE ACTIONS ---
  const handleImportFinished = useCallback(
    (importedWorkers: Worker[], replaced: boolean) => {
      if (replaced) {
        // Delete all current workers then add imported
        (async () => {
          try {
            await Promise.all(workers.map((w) => deleteWorker(w.id)));
            await Promise.all(importedWorkers.map((w) => upsertWorker(w)));
            setWorkers(importedWorkers);
          } catch (err: any) {
            showToast(`Replace import failed: ${err.message}`);
          }
        })();
      } else {
        const existingNames = new Set(workers.map((w) => w.name.trim().toLowerCase()));
        const uniqueNew = importedWorkers.filter(
          (w) => !existingNames.has(w.name.trim().toLowerCase())
        );
        setWorkers((prev) => [...prev, ...uniqueNew]);
      }
    },
    [workers, showToast]
  );

  const handleExportExcel = useCallback(() => {
    exportToExcel({ workers, sites, allocations, dateStr: selectedDate });
    showToast('Exported workbook to Excel (.xlsx)');
  }, [workers, sites, allocations, selectedDate, showToast]);

  const handleDuplicateYesterday = useCallback(async () => {
    const yesterdayDate = getYesterdayDateString(selectedDate);
    if (
      !window.confirm(
        `Do you want to duplicate allocations from yesterday (${yesterdayDate}) to today (${selectedDate})?`
      )
    ) {
      return;
    }

    try {
      const yesterdayAllocs = await fetchAllocations(yesterdayDate);
      const cloned: Record<string, SiteAllocation> = {};
      sites.forEach((site) => {
        const src = yesterdayAllocs.find((a) => a.site_id === site.id);
        cloned[site.id] = {
          work_date: selectedDate,
          site_id: site.id,
          foreman_id: src?.foreman_id ?? null,
          worker_ids: src?.worker_ids ? [...src.worker_ids] : [],
        };
      });
      await persistAllocations(cloned);
      showToast(`Duplicated allocations from ${yesterdayDate} to ${selectedDate}!`);
    } catch (err: any) {
      showToast(`Failed to duplicate: ${err.message}`);
    }
  }, [selectedDate, sites, persistAllocations, showToast]);

  const nextWorkerSortOrder = workers.length + 1;
  const nextSiteSortOrder = sites.length + 1;

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
          >
            <RefreshCw className="w-8 h-8 text-amber-400" />
          </motion.div>
          <p className="text-sm text-slate-400">Loading workforce data...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-800/60 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-white mb-1">Could not load data</h1>
          <p className="text-xs text-slate-400 mb-5">{loadError}</p>
          <button
            onClick={loadAll}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06),transparent_55%)]">
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        uaeTime={uaeTime}
        totalWorkers={workers.length}
        deployedCount={deployedCount}
        unassignedCount={unassignedCount}
        sitesCount={sites.length}
        onDuplicateYesterday={handleDuplicateYesterday}
        onOpenWorkerManage={() => {
          setWorkerToEdit(null);
          setIsWorkerManageModalOpen(true);
        }}
        onOpenSitesManage={() => setIsSitesManageModalOpen(true)}
        onOpenExcelImport={() => setIsExcelImportModalOpen(true)}
        onExportExcel={handleExportExcel}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col space-y-6">
        {isSaving && (
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-amber-300 shadow-lg">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Saving to database...
          </div>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <OneClickWorkerSiteAllocator
            workers={workers}
            sites={sites}
            allocations={allocations}
            onAttachWorkerToSite={handleAttachWorkerToSite}
            onDetachWorkerToPool={handleDetachWorkerToPool}
            onOpenAddWorker={() => {
              setWorkerToEdit(null);
              setIsWorkerManageModalOpen(true);
            }}
            onOpenEditWorker={(worker) => {
              setWorkerToEdit(worker);
              setIsWorkerManageModalOpen(true);
            }}
            onDeleteWorker={handleWorkerDeleted}
            onOpenAddSite={handleOpenAddSite}
            onOpenSitesMaster={() => setIsSitesManageModalOpen(true)}
          />
        </motion.section>

        <motion.section
          id="whatsapp-summary-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
        >
          <DailyManpowerSummary
            sites={sites}
            workers={workers}
            allocations={allocations}
            selectedDate={selectedDate}
            onShowToast={showToast}
            onRemoveWorkerFromSite={handleRemoveWorkerFromSite}
            onOpenEditSite={handleOpenEditSite}
            onOpenAddSite={handleOpenAddSite}
            onDeleteSite={handleSiteDeleted}
          />
        </motion.section>
      </main>

      <WorkerManageModal
        isOpen={isWorkerManageModalOpen}
        onClose={() => {
          setIsWorkerManageModalOpen(false);
          setWorkerToEdit(null);
        }}
        workers={workers}
        workerToEdit={workerToEdit}
        onWorkerSaved={handleWorkerSaved}
        onWorkerDeleted={handleWorkerDeleted}
        onShowToast={showToast}
        nextSortOrder={nextWorkerSortOrder}
      />

      <SitesManageModal
        isOpen={isSitesManageModalOpen}
        onClose={() => setIsSitesManageModalOpen(false)}
        sites={sites}
        onOpenAddSite={handleOpenAddSite}
        onOpenEditSite={handleOpenEditSite}
        onSiteDeleted={handleSiteDeleted}
        onReorderSites={handleReorderSites}
        onShowToast={showToast}
      />

      <SiteEditModal
        isOpen={isSiteEditModalOpen}
        onClose={() => {
          setIsSiteEditModalOpen(false);
          setSiteToEdit(null);
        }}
        siteToEdit={siteToEdit}
        onSaved={handleSiteSaved}
        onDeleted={handleSiteDeleted}
        onShowToast={showToast}
        nextSortOrder={nextSiteSortOrder}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportFinished={handleImportFinished}
        onShowToast={showToast}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
