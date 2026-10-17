import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getStoredWorkers,
  saveStoredWorkers,
  getStoredSites,
  saveStoredSites,
  getStoredAllocationsForDate,
  saveStoredAllocationsForDate,
  duplicateAllocations,
  resetToSeedData,
} from './services/storage';
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
  // Current UAE Date & live ticking clock
  const [selectedDate, setSelectedDate] = useState<string>(getTodayUAEDateString());
  const [uaeTime, setUaeTime] = useState<Date>(new Date());

  // Core Data from persistent storage
  const [workers, setWorkers] = useState<Worker[]>(() => getStoredWorkers());
  const [sites, setSites] = useState<Site[]>(() => getStoredSites());
  const [allocations, setAllocations] = useState<Record<string, SiteAllocation>>(() =>
    getStoredAllocationsForDate(getTodayUAEDateString(), getStoredSites())
  );

  // Modals state
  const [isWorkerManageModalOpen, setIsWorkerManageModalOpen] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [isSitesManageModalOpen, setIsSitesManageModalOpen] = useState(false);
  const [isSiteEditModalOpen, setIsSiteEditModalOpen] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<Site | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // UAE Time ticker (1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setUaeTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // When selectedDate changes, load allocations for that date
  useEffect(() => {
    const allocForDate = getStoredAllocationsForDate(selectedDate, sites);
    setAllocations(allocForDate);
  }, [selectedDate, sites]);

  // Persist workers whenever changed
  const updateWorkers = useCallback((newWorkers: Worker[]) => {
    setWorkers(newWorkers);
    saveStoredWorkers(newWorkers);
  }, []);

  // Persist sites whenever changed
  const updateSites = useCallback((newSites: Site[]) => {
    setSites(newSites);
    saveStoredSites(newSites);
  }, []);

  // Persist allocations for current date
  const updateAllocations = useCallback(
    (newAlloc: Record<string, SiteAllocation>) => {
      setAllocations(newAlloc);
      saveStoredAllocationsForDate(selectedDate, newAlloc);
    },
    [selectedDate]
  );

  // Worker lookup map
  const workerMap = useMemo(() => {
    const map = new Map<string, Worker>();
    workers.forEach((w) => map.set(w.id, w));
    return map;
  }, [workers]);

  // Total Deployed & Unassigned Counts
  const { deployedCount, unassignedCount } = useMemo(() => {
    const assignedSet = new Set<string>();
    Object.values(allocations).forEach((alloc) => {
      alloc?.workerIds?.forEach((id) => assignedSet.add(id));
    });

    const activeWorkers = workers.filter((w) => w.status === 'active');
    const deployed = activeWorkers.filter((w) => assignedSet.has(w.id)).length;
    const unassigned = activeWorkers.length - deployed;

    return { deployedCount: deployed, unassignedCount: unassigned };
  }, [allocations, workers]);

  // --- 1-CLICK ATTACH WORKER TO SITE ---
  const handleAttachWorkerToSite = useCallback(
    (workerId: string, targetSiteId: string) => {
      const updated = { ...allocations };

      // 1. Remove this worker from all other sites (no duplicates)
      Object.keys(updated).forEach((sId) => {
        const curAlloc = updated[sId];
        if (!curAlloc) return;

        if (curAlloc.workerIds.includes(workerId)) {
          updated[sId] = {
            ...curAlloc,
            workerIds: curAlloc.workerIds.filter((id) => id !== workerId),
            foremanId: curAlloc.foremanId === workerId ? undefined : curAlloc.foremanId,
          };
        }
      });

      // 2. Attach to target site
      const targetAlloc = updated[targetSiteId] || {
        siteId: targetSiteId,
        workerIds: [],
        foremanId: undefined,
      };

      if (!targetAlloc.workerIds.includes(workerId)) {
        updated[targetSiteId] = {
          ...targetAlloc,
          workerIds: [...targetAlloc.workerIds, workerId],
        };
      }

      updateAllocations(updated);

      const worker = workerMap.get(workerId);
      const site = sites.find((s) => s.id === targetSiteId);
      showToast(`Attached ${worker?.name || 'Worker'} to ${site?.name || 'Site'}`);
    },
    [allocations, updateAllocations, workerMap, sites, showToast]
  );

  // --- 1-CLICK DETACH WORKER TO FREE POOL ---
  const handleDetachWorkerToPool = useCallback(
    (workerId: string) => {
      const updated = { ...allocations };

      Object.keys(updated).forEach((sId) => {
        const curAlloc = updated[sId];
        if (!curAlloc) return;

        if (curAlloc.workerIds.includes(workerId)) {
          updated[sId] = {
            ...curAlloc,
            workerIds: curAlloc.workerIds.filter((id) => id !== workerId),
            foremanId: curAlloc.foremanId === workerId ? undefined : curAlloc.foremanId,
          };
        }
      });

      updateAllocations(updated);
      const worker = workerMap.get(workerId);
      showToast(`Freed ${worker?.name || 'Worker'} to available pool`);
    },
    [allocations, updateAllocations, workerMap, showToast]
  );

  // --- REMOVE WORKER FROM SPECIFIC SITE ---
  const handleRemoveWorkerFromSite = useCallback(
    (workerId: string, siteId: string) => {
      handleDetachWorkerToPool(workerId);
    },
    [handleDetachWorkerToPool]
  );

  // --- MASTER SITES ACTIONS (ADD / EDIT / DELETE / REORDER) ---
  const handleOpenAddSite = useCallback(() => {
    setSiteToEdit(null);
    setIsSiteEditModalOpen(true);
  }, []);

  const handleOpenEditSite = useCallback((site: Site) => {
    setSiteToEdit(site);
    setIsSiteEditModalOpen(true);
  }, []);

  const handleSaveSite = useCallback(
    (siteData: Partial<Site>) => {
      if (siteData.id) {
        // Edit existing site
        const newSites = sites.map((s) => (s.id === siteData.id ? { ...s, ...siteData } : s));
        updateSites(newSites as Site[]);
        showToast(`Updated site: ${siteData.name}`);
      } else {
        // Add new site
        const newSite: Site = {
          id: `site-${Date.now()}`,
          name: siteData.name || 'NEW WORKSITE',
          code: siteData.code,
          inchargeName: siteData.inchargeName || 'Qadeer',
          reportingTime: siteData.reportingTime || '6:00AM',
          location: siteData.location || 'Dubai, UAE',
          targetHeadcount: siteData.targetHeadcount || 6,
          order: sites.length + 1,
          notes: siteData.notes,
        };
        const newSites = [...sites, newSite];
        updateSites(newSites);

        const updatedAlloc = {
          ...allocations,
          [newSite.id]: {
            siteId: newSite.id,
            workerIds: [],
            foremanId: undefined,
          },
        };
        updateAllocations(updatedAlloc);
        showToast(`Created new site: ${newSite.name}`);
      }
    },
    [sites, updateSites, allocations, updateAllocations, showToast]
  );

  const handleDeleteSite = useCallback(
    (siteId: string) => {
      const site = sites.find((s) => s.id === siteId);
      if (!site) return;

      // Safely detach workers from this site back to free pool
      const curAlloc = allocations[siteId];
      if (curAlloc && curAlloc.workerIds.length > 0) {
        curAlloc.workerIds.forEach((wId) => handleDetachWorkerToPool(wId));
      }

      const newSites = sites.filter((s) => s.id !== siteId);
      updateSites(newSites);

      const updatedAlloc = { ...allocations };
      delete updatedAlloc[siteId];
      updateAllocations(updatedAlloc);

      showToast(`Deleted site: ${site.name}`);
    },
    [sites, updateSites, allocations, updateAllocations, handleDetachWorkerToPool, showToast]
  );

  const handleReorderSites = useCallback(
    (siteId: string, direction: 'prev' | 'next') => {
      const index = sites.findIndex((s) => s.id === siteId);
      if (index === -1) return;

      const targetIndex = direction === 'prev' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sites.length) return;

      const newSites = [...sites];
      const temp = newSites[index];
      newSites[index] = newSites[targetIndex];
      newSites[targetIndex] = temp;

      newSites.forEach((s, idx) => {
        s.order = idx + 1;
      });

      updateSites(newSites);
    },
    [sites, updateSites]
  );

  // --- MASTER WORKERS ACTIONS (ADD / EDIT / DELETE) ---
  const handleSaveWorker = useCallback(
    (worker: Worker) => {
      const exists = workers.some((w) => w.id === worker.id);
      let newWorkers: Worker[];
      if (exists) {
        newWorkers = workers.map((w) => (w.id === worker.id ? worker : w));
        showToast(`Updated worker: ${worker.name}`);
      } else {
        newWorkers = [worker, ...workers];
        showToast(`Added worker: ${worker.name}`);
      }
      updateWorkers(newWorkers);
    },
    [workers, updateWorkers, showToast]
  );

  const handleDeleteWorker = useCallback(
    (workerId: string) => {
      handleDetachWorkerToPool(workerId);
      const newWorkers = workers.filter((w) => w.id !== workerId);
      updateWorkers(newWorkers);
      showToast('Worker removed from database');
    },
    [workers, updateWorkers, handleDetachWorkerToPool, showToast]
  );

  // --- EXCEL & DUPLICATE ACTIONS ---
  const handleImportExcelSuccess = useCallback(
    (importedWorkers: Worker[], mode: 'replace' | 'append') => {
      let finalWorkers: Worker[];
      if (mode === 'replace') {
        finalWorkers = importedWorkers;
        const freshAlloc: Record<string, SiteAllocation> = {};
        sites.forEach((s) => {
          freshAlloc[s.id] = { siteId: s.id, workerIds: [], foremanId: undefined };
        });
        updateAllocations(freshAlloc);
        showToast(`Replaced database with ${importedWorkers.length} workers from Excel!`);
      } else {
        const existingNames = new Set(workers.map((w) => w.name.trim().toLowerCase()));
        const uniqueNew = importedWorkers.filter(
          (w) => !existingNames.has(w.name.trim().toLowerCase())
        );
        finalWorkers = [...workers, ...uniqueNew];
        showToast(`Added ${uniqueNew.length} new workers from Excel!`);
      }
      updateWorkers(finalWorkers);
    },
    [workers, updateWorkers, sites, updateAllocations, showToast]
  );

  const handleExportExcel = useCallback(() => {
    exportToExcel({
      workers,
      sites,
      allocations,
      dateStr: selectedDate,
    });
    showToast('Exported workbook to Excel (.xlsx)');
  }, [workers, sites, allocations, selectedDate, showToast]);

  const handleDuplicateYesterday = useCallback(() => {
    const yesterdayDate = getYesterdayDateString(selectedDate);
    if (
      !confirm(
        `Do you want to duplicate allocations from yesterday (${yesterdayDate}) to today (${selectedDate})?`
      )
    ) {
      return;
    }

    const cloned = duplicateAllocations(yesterdayDate, selectedDate, sites);
    setAllocations(cloned);
    showToast(`Successfully duplicated allocations from ${yesterdayDate} to ${selectedDate}!`);
  }, [selectedDate, sites, showToast]);

  const handleResetSeedData = useCallback(() => {
    if (
      !confirm(
        'Reset to default WhatsApp deployment dataset (Shanthi Foundation, HTS, EGE Interior, Cradle Work)?'
      )
    ) {
      return;
    }
    const reset = resetToSeedData();
    setWorkers(reset.workers);
    setSites(reset.sites);
    setAllocations(reset.allocations);
    showToast('Restored default deployment dataset');
  }, [showToast]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header & Metrics Ribbon */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        uaeTime={uaeTime}
        totalWorkers={workers.length}
        deployedCount={deployedCount}
        unassignedCount={unassignedCount}
        sitesCount={sites.length}
        onDuplicateYesterday={handleDuplicateYesterday}
        onOpenWorkerManage={() => setIsWorkerManageModalOpen(true)}
        onOpenSitesManage={() => setIsSitesManageModalOpen(true)}
        onOpenExcelImport={() => setIsExcelImportModalOpen(true)}
        onExportExcel={handleExportExcel}
        onResetSeed={handleResetSeedData}
      />

      {/* Main Working Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col space-y-6">
        {/* Full-width 1-Click Worker Site Allocator */}
        <section>
          <OneClickWorkerSiteAllocator
            workers={workers}
            sites={sites}
            allocations={allocations}
            onAttachWorkerToSite={handleAttachWorkerToSite}
            onDetachWorkerToPool={handleDetachWorkerToPool}
            onOpenAddWorker={() => setIsWorkerManageModalOpen(true)}
            onOpenEditWorker={(worker) => {
              setWorkerToEdit(worker);
              setIsWorkerManageModalOpen(true);
            }}
            onDeleteWorker={handleDeleteWorker}
            onOpenAddSite={handleOpenAddSite}
            onOpenSitesMaster={() => setIsSitesManageModalOpen(true)}
          />
        </section>

        {/* Copy Section Moved Below All to the End */}
        <section id="whatsapp-summary-section">
          <DailyManpowerSummary
            sites={sites}
            workers={workers}
            allocations={allocations}
            selectedDate={selectedDate}
            uaeTime={uaeTime}
            onShowToast={showToast}
            onRemoveWorkerFromSite={handleRemoveWorkerFromSite}
            onOpenEditSite={handleOpenEditSite}
            onOpenAddSite={handleOpenAddSite}
            onDeleteSite={handleDeleteSite}
          />
        </section>
      </main>

      {/* Master Modals */}
      <WorkerManageModal
        isOpen={isWorkerManageModalOpen}
        onClose={() => {
          setIsWorkerManageModalOpen(false);
          setWorkerToEdit(null);
        }}
        workers={workers}
        workerToEdit={workerToEdit}
        onSaveWorker={handleSaveWorker}
        onDeleteWorker={handleDeleteWorker}
      />

      <SitesManageModal
        isOpen={isSitesManageModalOpen}
        onClose={() => setIsSitesManageModalOpen(false)}
        sites={sites}
        onOpenAddSite={handleOpenAddSite}
        onOpenEditSite={handleOpenEditSite}
        onDeleteSite={handleDeleteSite}
        onReorderSites={handleReorderSites}
      />

      <SiteEditModal
        isOpen={isSiteEditModalOpen}
        onClose={() => {
          setIsSiteEditModalOpen(false);
          setSiteToEdit(null);
        }}
        siteToEdit={siteToEdit}
        onSaveSite={handleSaveSite}
        onDeleteSite={handleDeleteSite}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportSuccess={handleImportExcelSuccess}
      />

      {/* Floating Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
