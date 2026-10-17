import { Site, Worker, SiteAllocation } from '../types';

/**
 * Converts a YYYY-MM-DD date string to DD-MM-YYYY (e.g., 2026-10-10 -> 10-10-2026)
 */
export function formatDateForWorkHeader(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

/**
 * Formats a single site's manpower deployment in the exact format from the WhatsApp screenshot:
 *
 * 📍 SHANTHI FOUNDATION
 * With Qadeer / 6:00AM
 *
 * 1. Yubaraj
 * 2. Samim
 */
export function formatSingleSiteWhatsApp(params: {
  site: Site;
  workers: Worker[];
  foremanName?: string;
  reportingTime?: string;
  includePin?: boolean;
}): string {
  const { site, workers, foremanName, reportingTime, includePin = true } = params;

  const lines: string[] = [];

  const siteNameUpper = site.name.trim().toUpperCase();
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(siteNameUpper);
  if (hasEmoji) {
    lines.push(siteNameUpper);
  } else if (includePin && !siteNameUpper.includes('CRADLE')) {
    lines.push(`📍 ${siteNameUpper}`);
  } else {
    lines.push(siteNameUpper);
  }

  const effectiveIncharge = site.incharge_name || foremanName || 'Supervisor';
  const effectiveTime = site.reporting_time || reportingTime || '6:00AM';

  lines.push(`With ${effectiveIncharge} / ${effectiveTime}`);
  lines.push('');

  if (workers.length === 0) {
    lines.push('(No workers assigned)');
  } else {
    workers.forEach((w, index) => {
      lines.push(`${index + 1}. ${w.name.trim()}`);
    });
  }

  return lines.join('\n');
}

/**
 * Formats all active sites into one master WhatsApp deployment message.
 */
export function formatMasterWhatsAppDeployment(params: {
  sites: Site[];
  allocations: Record<string, SiteAllocation>;
  workerMap: Map<string, Worker>;
  dateStr: string;
  headerPrefix?: string;
}): string {
  const { sites, allocations, workerMap, dateStr, headerPrefix = 'WORK' } = params;

  const dateHeader = formatDateForWorkHeader(dateStr);
  const blocks: string[] = [];

  blocks.push(`${headerPrefix} - ${dateHeader}`);
  blocks.push('');

  sites.forEach((site) => {
    const alloc = allocations[site.id];
    const siteWorkers = (alloc?.worker_ids || [])
      .map((id) => workerMap.get(id))
      .filter((w): w is Worker => Boolean(w));

    let foremanName = site.incharge_name || undefined;
    if (!foremanName && alloc?.foreman_id) {
      foremanName = workerMap.get(alloc.foreman_id)?.name;
    }

    const isCradle = site.name.toUpperCase().includes('CRADLE');
    const siteText = formatSingleSiteWhatsApp({
      site,
      workers: siteWorkers,
      foremanName,
      reportingTime: site.reporting_time || '6:00AM',
      includePin: !isCradle,
    });

    blocks.push(siteText);
    blocks.push('');
  });

  return blocks.join('\n').trim();
}
