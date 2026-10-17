import * as XLSX from 'xlsx';
import { Worker, Site, SiteAllocation } from '../types';

export interface ParsedExcelResult {
  sheetNames: string[];
  totalRowsFound: number;
  workers: Worker[];
  warnings: string[];
}

/**
 * Normalizes header keys to standard worker properties.
 */
function findValue(row: Record<string, any>, possibleKeys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const targetKey of possibleKeys) {
    const match = rowKeys.find(
      (k) => k.trim().toLowerCase() === targetKey.trim().toLowerCase()
    );
    if (match && row[match] !== undefined && row[match] !== null) {
      const val = String(row[match]).trim();
      if (val !== '' && val !== 'undefined' && val !== 'null') {
        return val;
      }
    }
  }
  return '';
}

/**
 * Parses an Excel / CSV File or ArrayBuffer into workers.
 * Carefully treats missing or inconsistent entries without inventing fake details.
 */
export async function parseExcelWorkersFile(file: File): Promise<ParsedExcelResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const workers: Worker[] = [];
  const warnings: string[] = [];
  let totalRowsFound = 0;

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    // Convert sheet to JSON array with header detection
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
      blankrows: false,
    });

    totalRowsFound += rawRows.length;

    rawRows.forEach((row, idx) => {
      // Find worker name
      const name = findValue(row, [
        'name',
        'worker name',
        'labour name',
        'labor name',
        'employee name',
        'full name',
        'worker',
        'person',
      ]);

      // If no name is found, check if first column has string
      const firstColVal = Object.values(row)[0];
      const workerName = name || (typeof firstColVal === 'string' && firstColVal.trim().length > 1 ? firstColVal.trim() : '');

      if (!workerName || workerName.toLowerCase() === 'total' || workerName.toLowerCase() === 'name') {
        return; // Skip blank or header/total rows
      }

      const designation = findValue(row, [
        'designation',
        'designation / trade',
        'trade',
        'role',
        'job title',
        'category',
        'skill',
        'position',
      ]) || 'Scaffolder';

      let company = findValue(row, [
        'company',
        'company name',
        'firm',
        'employer',
        'source',
        'subcontractor',
      ]);

      // If company is not on row, infer from sheet name
      if (!company) {
        const lowerSheet = sheetName.toLowerCase();
        if (lowerSheet.includes('sst') && lowerSheet.includes('sky')) {
          company = 'SST';
        } else if (lowerSheet.includes('sst')) {
          company = 'SST';
        } else if (lowerSheet.includes('mountain') || lowerSheet.includes('sky')) {
          company = 'Mountain Sky';
        } else if (lowerSheet.includes('sajja')) {
          company = 'SST/Sajja Yard';
        } else if (lowerSheet.includes('other') || lowerSheet.includes('outsider')) {
          company = 'Outsiders';
        } else {
          company = sheetName.trim() || 'General Scaffolding';
        }
      }

      const empCode = findValue(row, [
        'emp code',
        'empcode',
        'emp id',
        'empid',
        'code',
        'id',
        'badge no',
        'sr no',
        'sl no',
        's.no',
        'no',
      ]) || `IMP-${workers.length + 1}`;

      const currentSite = findValue(row, [
        'current site',
        'site',
        'project',
        'worksite',
        'location',
        'assigned site',
      ]);

      const phone = findValue(row, [
        'phone',
        'mobile',
        'contact',
        'tel',
        'whatsapp',
        'phone number',
      ]);

      const statusRaw = findValue(row, ['status', 'state', 'remarks', 'active']);
      let status: 'active' | 'inactive' | 'on_leave' = 'active';
      if (statusRaw.toLowerCase().includes('leave') || statusRaw.toLowerCase().includes('vacation')) {
        status = 'on_leave';
      } else if (statusRaw.toLowerCase().includes('inactive') || statusRaw.toLowerCase().includes('exit') || statusRaw.toLowerCase().includes('cancelled')) {
        status = 'inactive';
      }

      workers.push({
        id: `imp-${Date.now()}-${workers.length}-${Math.random().toString(36).substring(2, 6)}`,
        empCode,
        name: workerName,
        designation,
        company,
        sheetSource: sheetName,
        currentSite: currentSite || undefined,
        phone: phone || undefined,
        status,
        notes: findValue(row, ['notes', 'remarks', 'comment']) || undefined,
      });
    });
  });

  if (workers.length === 0) {
    warnings.push('Could not detect any valid worker rows. Please check column headers (Name, Designation, Company).');
  }

  return {
    sheetNames: workbook.SheetNames,
    totalRowsFound,
    workers,
    warnings,
  };
}

/**
 * Exports current worker database and allocations to an Excel workbook (.xlsx).
 */
export function exportToExcel(params: {
  workers: Worker[];
  sites: Site[];
  allocations: Record<string, SiteAllocation>;
  dateStr: string;
}): void {
  const { workers, sites, allocations, dateStr } = params;

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Daily Deployments by Site
  const deploymentRows: any[] = [];
  sites.forEach((site) => {
    const alloc = allocations[site.id];
    const workerIds = alloc?.workerIds || [];
    const foremanId = alloc?.foremanId;

    if (workerIds.length === 0) {
      deploymentRows.push({
        'Site Name': site.name,
        'Site Code': site.code || '',
        'Location': site.location || '',
        'Role on Site': 'None',
        'Worker Name': '(No workers assigned)',
        'Designation': '',
        'Company': '',
        'Employee ID': '',
        'Contact': '',
      });
    } else {
      workerIds.forEach((wId) => {
        const worker = workers.find((w) => w.id === wId);
        if (!worker) return;
        const isForeman = wId === foremanId;
        deploymentRows.push({
          'Site Name': site.name,
          'Site Code': site.code || '',
          'Location': site.location || '',
          'Role on Site': isForeman ? '⭐ Foreman / In-charge' : 'Crew Member',
          'Worker Name': worker.name,
          'Designation': worker.designation,
          'Company': worker.company,
          'Employee ID': worker.empCode,
          'Contact': worker.phone || '',
        });
      });
    }
  });

  const wsDeployments = XLSX.utils.json_to_sheet(deploymentRows);
  XLSX.utils.book_append_sheet(workbook, wsDeployments, 'Daily Deployments');

  // Sheet 2: Master Workers Database
  const workerRows = workers.map((w) => {
    // Check if assigned today
    let assignedSiteName = 'Unassigned';
    for (const site of sites) {
      const alloc = allocations[site.id];
      if (alloc?.workerIds?.includes(w.id)) {
        assignedSiteName = site.name;
        break;
      }
    }

    return {
      'Emp Code': w.empCode,
      'Worker Name': w.name,
      'Designation': w.designation,
      'Company': w.company,
      'Sheet Source': w.sheetSource,
      'Status': w.status,
      'Default/Saved Site': w.currentSite || '',
      'Today Deployment': assignedSiteName,
      'Contact Phone': w.phone || '',
      'Notes': w.notes || '',
    };
  });

  const wsWorkers = XLSX.utils.json_to_sheet(workerRows);
  XLSX.utils.book_append_sheet(workbook, wsWorkers, 'All Workers Database');

  // Generate and download file
  XLSX.writeFile(workbook, `Scaffolding_Allocation_${dateStr}.xlsx`);
}
