import * as XLSX from 'xlsx';
import { Worker, Site, SiteAllocation } from '../types';

export interface ParsedExcelResult {
  sheetNames: string[];
  totalRowsFound: number;
  workers: Worker[];
  warnings: string[];
}

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

export async function parseExcelWorkersFile(file: File): Promise<ParsedExcelResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const workers: Worker[] = [];
  const warnings: string[] = [];
  let totalRowsFound = 0;

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
      blankrows: false,
    });

    totalRowsFound += rawRows.length;

    rawRows.forEach((row) => {
      const name = findValue(row, [
        'name', 'worker name', 'labour name', 'labor name',
        'employee name', 'full name', 'worker', 'person',
      ]);

      const firstColVal = Object.values(row)[0];
      const workerName =
        name ||
        (typeof firstColVal === 'string' && firstColVal.trim().length > 1
          ? firstColVal.trim()
          : '');

      if (
        !workerName ||
        workerName.toLowerCase() === 'total' ||
        workerName.toLowerCase() === 'name'
      ) {
        return;
      }

      const designation =
        findValue(row, [
          'designation', 'designation / trade', 'trade', 'role',
          'job title', 'category', 'skill', 'position',
        ]) || 'Scaffolder';

      let company = findValue(row, [
        'company', 'company name', 'firm', 'employer', 'source', 'subcontractor',
      ]);

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

      const empCode =
        findValue(row, [
          'emp code', 'empcode', 'emp id', 'empid', 'code', 'id',
          'badge no', 'sr no', 'sl no', 's.no', 'no',
        ]) || `IMP-${workers.length + 1}`;

      const currentSite = findValue(row, [
        'current site', 'site', 'project', 'worksite', 'location', 'assigned site',
      ]);

      const phone = findValue(row, [
        'phone', 'mobile', 'contact', 'tel', 'whatsapp', 'phone number',
      ]);

      const statusRaw = findValue(row, ['status', 'state', 'remarks', 'active']);
      let status: Worker['status'] = 'active';
      if (statusRaw.toLowerCase().includes('leave') || statusRaw.toLowerCase().includes('vacation')) {
        status = 'on_leave';
      } else if (
        statusRaw.toLowerCase().includes('inactive') ||
        statusRaw.toLowerCase().includes('exit') ||
        statusRaw.toLowerCase().includes('cancelled')
      ) {
        status = 'inactive';
      }

      workers.push({
        id: `imp-${Date.now()}-${workers.length}-${Math.random().toString(36).substring(2, 6)}`,
        emp_code: empCode,
        name: workerName,
        designation,
        company,
        sheet_source: sheetName,
        current_site: currentSite || null,
        phone: phone || null,
        status,
        notes: findValue(row, ['notes', 'remarks', 'comment']) || null,
        sort_order: 1000 + workers.length,
      });
    });
  });

  if (workers.length === 0) {
    warnings.push(
      'Could not detect any valid worker rows. Please check column headers (Name, Designation, Company).'
    );
  }

  return {
    sheetNames: workbook.SheetNames,
    totalRowsFound,
    workers,
    warnings,
  };
}

export function exportToExcel(params: {
  workers: Worker[];
  sites: Site[];
  allocations: Record<string, SiteAllocation>;
  dateStr: string;
}): void {
  const { workers, sites, allocations, dateStr } = params;
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Daily Deployments by Site
  const deploymentRows: any[] = [];
  sites.forEach((site) => {
    const alloc = allocations[site.id];
    const workerIds = alloc?.worker_ids || [];
    const foremanId = alloc?.foreman_id;

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
        const worker = workerMap.get(wId);
        if (!worker) return;
        deploymentRows.push({
          'Site Name': site.name,
          'Site Code': site.code || '',
          'Location': site.location || '',
          'Role on Site': wId === foremanId ? 'Foreman / In-charge' : 'Crew Member',
          'Worker Name': worker.name,
          'Designation': worker.designation,
          'Company': worker.company,
          'Employee ID': worker.emp_code,
          'Contact': worker.phone || '',
        });
      });
    }
  });

  const wsDeployments = XLSX.utils.json_to_sheet(deploymentRows);
  XLSX.utils.book_append_sheet(workbook, wsDeployments, 'Daily Deployments');

  // Sheet 2: Master Workers Database
  const workerRows = workers.map((w) => {
    let assignedSiteName = 'Unassigned';
    for (const site of sites) {
      const alloc = allocations[site.id];
      if (alloc?.worker_ids?.includes(w.id)) {
        assignedSiteName = site.name;
        break;
      }
    }

    return {
      'Emp Code': w.emp_code,
      'Worker Name': w.name,
      'Designation': w.designation,
      'Company': w.company,
      'Sheet Source': w.sheet_source,
      'Status': w.status,
      'Default/Saved Site': w.current_site || '',
      'Today Deployment': assignedSiteName,
      'Contact Phone': w.phone || '',
      'Notes': w.notes || '',
    };
  });

  const wsWorkers = XLSX.utils.json_to_sheet(workerRows);
  XLSX.utils.book_append_sheet(workbook, wsWorkers, 'All Workers Database');

  XLSX.writeFile(workbook, `Scaffolding_Allocation_${dateStr}.xlsx`);
}
