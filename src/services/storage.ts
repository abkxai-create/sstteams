import { Worker, Site, SiteAllocation } from '../types';
import { INITIAL_WORKERS, INITIAL_SITES, INITIAL_ALLOCATIONS_SEED } from '../data/seedData';
import { getTodayUAEDateString } from '../utils/uaeTime';

const STORAGE_WORKERS_KEY = 'scaffold_workers_v2';
const STORAGE_SITES_KEY = 'scaffold_sites_v2';
const STORAGE_DATES_INDEX_KEY = 'scaffold_saved_dates_v2';
const ALLOC_PREFIX = 'scaffold_alloc_v2_';

export function getStoredWorkers(): Worker[] {
  try {
    const raw = localStorage.getItem(STORAGE_WORKERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored workers:', e);
  }
  // Initialize with initial seed
  localStorage.setItem(STORAGE_WORKERS_KEY, JSON.stringify(INITIAL_WORKERS));
  return INITIAL_WORKERS;
}

export function saveStoredWorkers(workers: Worker[]): void {
  try {
    localStorage.setItem(STORAGE_WORKERS_KEY, JSON.stringify(workers));
  } catch (e) {
    console.error('Error saving workers to localStorage:', e);
  }
}

export function getStoredSites(): Site[] {
  try {
    const raw = localStorage.getItem(STORAGE_SITES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored sites:', e);
  }
  localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(INITIAL_SITES));
  return INITIAL_SITES;
}

export function saveStoredSites(sites: Site[]): void {
  try {
    localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(sites));
  } catch (e) {
    console.error('Error saving sites to localStorage:', e);
  }
}

export function getSavedAllocationDates(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_DATES_INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading saved dates index:', e);
  }
  return [];
}

function recordSavedDate(dateStr: string): void {
  try {
    const dates = new Set(getSavedAllocationDates());
    dates.add(dateStr);
    localStorage.setItem(STORAGE_DATES_INDEX_KEY, JSON.stringify(Array.from(dates)));
  } catch (e) {
    console.error('Error recording saved date:', e);
  }
}

export function getStoredAllocationsForDate(
  dateStr: string,
  sites: Site[]
): Record<string, SiteAllocation> {
  try {
    const raw = localStorage.getItem(`${ALLOC_PREFIX}${dateStr}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const validMap: Record<string, SiteAllocation> = {};
        sites.forEach((s) => {
          validMap[s.id] = parsed[s.id] || {
            siteId: s.id,
            foremanId: undefined,
            workerIds: [],
          };
        });
        return validMap;
      }
    }
  } catch (e) {
    console.error(`Error reading allocations for ${dateStr}:`, e);
  }

  // Initial map for new dates
  const today = getTodayUAEDateString();
  const initialMap: Record<string, SiteAllocation> = {};

  sites.forEach((s) => {
    if (INITIAL_ALLOCATIONS_SEED[s.id]) {
      initialMap[s.id] = {
        siteId: s.id,
        foremanId: INITIAL_ALLOCATIONS_SEED[s.id].foremanId,
        workerIds: [...INITIAL_ALLOCATIONS_SEED[s.id].workerIds],
      };
    } else {
      initialMap[s.id] = {
        siteId: s.id,
        foremanId: undefined,
        workerIds: [],
      };
    }
  });

  saveStoredAllocationsForDate(dateStr, initialMap);
  return initialMap;
}

export function saveStoredAllocationsForDate(
  dateStr: string,
  allocations: Record<string, SiteAllocation>
): void {
  try {
    localStorage.setItem(`${ALLOC_PREFIX}${dateStr}`, JSON.stringify(allocations));
    recordSavedDate(dateStr);
  } catch (e) {
    console.error(`Error saving allocations for ${dateStr}:`, e);
  }
}

export function duplicateAllocations(
  sourceDateStr: string,
  targetDateStr: string,
  sites: Site[]
): Record<string, SiteAllocation> {
  const sourceAlloc = getStoredAllocationsForDate(sourceDateStr, sites);
  const cloned: Record<string, SiteAllocation> = {};

  sites.forEach((s) => {
    const src = sourceAlloc[s.id];
    cloned[s.id] = {
      siteId: s.id,
      foremanId: src?.foremanId,
      workerIds: src ? [...src.workerIds] : [],
    };
  });

  saveStoredAllocationsForDate(targetDateStr, cloned);
  return cloned;
}

export function resetToSeedData(): {
  workers: Worker[];
  sites: Site[];
  allocations: Record<string, SiteAllocation>;
} {
  localStorage.setItem(STORAGE_WORKERS_KEY, JSON.stringify(INITIAL_WORKERS));
  localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(INITIAL_SITES));

  const today = getTodayUAEDateString();
  const initialMap: Record<string, SiteAllocation> = {};
  INITIAL_SITES.forEach((s) => {
    if (INITIAL_ALLOCATIONS_SEED[s.id]) {
      initialMap[s.id] = {
        siteId: s.id,
        foremanId: INITIAL_ALLOCATIONS_SEED[s.id].foremanId,
        workerIds: [...INITIAL_ALLOCATIONS_SEED[s.id].workerIds],
      };
    } else {
      initialMap[s.id] = {
        siteId: s.id,
        foremanId: undefined,
        workerIds: [],
      };
    }
  });

  saveStoredAllocationsForDate(today, initialMap);
  return {
    workers: INITIAL_WORKERS,
    sites: INITIAL_SITES,
    allocations: initialMap,
  };
}
