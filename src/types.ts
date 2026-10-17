export type WorkerStatus = 'active' | 'inactive' | 'on_leave';

export interface Worker {
  id: string;
  empCode: string;
  name: string;
  designation: string;
  company: string;
  sheetSource: string; // e.g., "Sheet 1: SST & M Sky" or "Sheet 2: Others & Outsiders"
  currentSite?: string;
  phone?: string;
  status: WorkerStatus;
  notes?: string;
}

export interface Site {
  id: string;
  name: string;
  code?: string;
  location?: string;
  inchargeName?: string; // e.g. "Qadeer", "Zubair", "Naeem", "Safdar"
  reportingTime?: string; // e.g. "6:00AM"
  targetHeadcount?: number;
  foremanId?: string; // ID of the assigned foreman worker
  order: number;
  notes?: string;
}

export interface SiteAllocation {
  siteId: string;
  foremanId?: string;
  workerIds: string[];
}

export interface DailyDeployment {
  date: string; // YYYY-MM-DD
  allocations: Record<string, SiteAllocation>; // siteId -> SiteAllocation
  updatedAt: string;
}
