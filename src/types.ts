export type WorkerStatus = 'active' | 'inactive' | 'on_leave';

export interface Worker {
  id: string;
  emp_code: string;
  name: string;
  designation: string;
  company: string;
  sheet_source: string;
  current_site?: string | null;
  phone?: string | null;
  status: WorkerStatus;
  notes?: string | null;
  sort_order: number;
}

export interface Site {
  id: string;
  name: string;
  code?: string | null;
  location?: string | null;
  incharge_name?: string | null;
  reporting_time?: string | null;
  target_headcount?: number | null;
  notes?: string | null;
  sort_order: number;
}

export interface SiteAllocation {
  work_date: string;
  site_id: string;
  foreman_id?: string | null;
  worker_ids: string[];
}
