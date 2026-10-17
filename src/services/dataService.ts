import { supabase } from './supabaseClient';
import { Worker, Site, SiteAllocation } from '../types';

export async function fetchWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Worker[];
}

export async function fetchSites(): Promise<Site[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Site[];
}

export async function fetchAllocations(workDate: string): Promise<SiteAllocation[]> {
  const { data, error } = await supabase
    .from('allocations')
    .select('*')
    .eq('work_date', workDate);
  if (error) throw new Error(error.message);
  return (data || []) as SiteAllocation[];
}

export async function upsertAllocation(alloc: SiteAllocation): Promise<void> {
  const { error } = await supabase
    .from('allocations')
    .upsert(
      {
        work_date: alloc.work_date,
        site_id: alloc.site_id,
        foreman_id: alloc.foreman_id ?? null,
        worker_ids: alloc.worker_ids,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'work_date,site_id' }
    );
  if (error) throw new Error(error.message);
}

export async function upsertWorker(worker: Worker): Promise<void> {
  const { error } = await supabase
    .from('workers')
    .upsert(worker, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteWorker(id: string): Promise<void> {
  const { error } = await supabase.from('workers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function upsertSite(site: Site): Promise<void> {
  const { error } = await supabase
    .from('sites')
    .upsert(site, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteSite(id: string): Promise<void> {
  const { error } = await supabase.from('sites').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
