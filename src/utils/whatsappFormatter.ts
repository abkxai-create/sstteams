import { Site, Worker } from '../types';

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
 * Formats a single site's manpower deployment in the exact format from user's WhatsApp screenshot.
 *
 * Example:
 * 📍 SHANTHI FOUNDATION
 * With Qadeer / 6:00AM
 *
 * 1. Yubaraj
 * 2. Samim
 * 3. Mushtaq
 * 4. Ayoub
 * 5. Tajammal
 * 6. Godred
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

  // Site Title
  const siteNameUpper = site.name.trim().toUpperCase();
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(siteNameUpper);
  if (hasEmoji) {
    lines.push(siteNameUpper);
  } else if (includePin && !siteNameUpper.includes('CRADLE')) {
    lines.push(`📍 ${siteNameUpper}`);
  } else {
    lines.push(siteNameUpper);
  }

  // "With <Incharge> / <Time>"
  const effectiveIncharge =
    site.inchargeName || foremanName || 'Supervisor';
  const effectiveTime =
    site.reportingTime || reportingTime || '6:00AM';

  lines.push(`With ${effectiveIncharge} / ${effectiveTime}`);
  lines.push(''); // Blank line

  // Numbered list of workers (First name / display name as requested)
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
 * Formats all active sites into one master WhatsApp deployment message matching user's image:
 *
 * WORK - 10-10-2026
 *
 * 📍 SHANTHI FOUNDATION
 * With Qadeer / 6:00AM
 *
 * 1. Yubaraj
 * 2. Samim
 * ...
 */
export function formatMasterWhatsAppDeployment(params: {
  sites: Site[];
  allocations: Record<string, { foremanId?: string; workerIds: string[] }>;
  workerMap: Map<string, Worker>;
  dateStr: string; // YYYY-MM-DD
  headerPrefix?: string; // e.g. "WORK"
}): string {
  const { sites, allocations, workerMap, dateStr, headerPrefix = 'WORK' } = params;

  const dateHeader = formatDateForWorkHeader(dateStr);
  const blocks: string[] = [];

  // Top header matching image
  blocks.push(`${headerPrefix} - ${dateHeader}`);
  blocks.push('');

  sites.forEach((site) => {
    const alloc = allocations[site.id] || { workerIds: [] };
    const siteWorkers = alloc.workerIds
      .map((id) => workerMap.get(id))
      .filter((w): w is Worker => Boolean(w));

    // Resolve in-charge name
    let foremanName = site.inchargeName;
    if (!foremanName && alloc.foremanId) {
      foremanName = workerMap.get(alloc.foremanId)?.name;
    }

    const isCradle = site.name.toUpperCase().includes('CRADLE');
    const siteText = formatSingleSiteWhatsApp({
      site,
      workers: siteWorkers,
      foremanName,
      reportingTime: site.reportingTime || '6:00AM',
      includePin: !isCradle,
    });

    blocks.push(siteText);
    blocks.push(''); // Extra line between sites
  });

  return blocks.join('\n').trim();
}
