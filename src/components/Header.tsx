import React from 'react';
import {
  Calendar,
  Clock,
  Copy,
  Download,
  Upload,
  Users,
  RotateCcw,
  Building2,
  HardHat,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatUAETime, getYesterdayDateString, getTomorrowDateString } from '../utils/uaeTime';
import { formatDateForWorkHeader } from '../utils/whatsappFormatter';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  uaeTime: Date;
  totalWorkers: number;
  deployedCount: number;
  unassignedCount: number;
  sitesCount: number;
  onDuplicateYesterday: () => void;
  onOpenWorkerManage: () => void;
  onOpenSitesManage: () => void;
  onOpenExcelImport: () => void;
  onExportExcel: () => void;
  onResetSeed: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  uaeTime,
  totalWorkers,
  deployedCount,
  unassignedCount,
  sitesCount,
  onDuplicateYesterday,
  onOpenWorkerManage,
  onOpenSitesManage,
  onOpenExcelImport,
  onExportExcel,
  onResetSeed,
}) => {
  const formattedTime = formatUAETime(uaeTime);
  const workHeader = `WORK - ${formatDateForWorkHeader(selectedDate)}`;

  const handlePrevDay = () => {
    onDateChange(getYesterdayDateString(selectedDate));
  };

  const handleNextDay = () => {
    onDateChange(getTomorrowDateString(selectedDate));
  };

  const handleToday = () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
    onDateChange(today);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Banner with Branding & UAE Live Clock */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Company Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>ScaffoldAlloc</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase tracking-wider">
                    UAE Ops
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Safe Scaffolding Trading (SST) · Mountain Sky Scaffolding · Subcontractors
              </p>
            </div>
          </div>

          {/* UAE Live Clock & Date Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800">
            {/* Live UAE Time display */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="text-xs font-mono font-semibold tracking-wider">
                {formattedTime} <span className="text-[10px] text-slate-400 uppercase">GST</span>
              </div>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevDay}
                title="Previous Day"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && onDateChange(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleNextDay}
                title="Next Day"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                Today
              </button>
            </div>

            {/* Duplicate yesterday allocation */}
            <button
              onClick={onDuplicateYesterday}
              title="Duplicate Yesterday's Allocation to This Date"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-medium border border-slate-700 transition-colors shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Yesterday</span>
            </button>
          </div>

          {/* Master Tools: Workers Master & Sites Master */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenWorkerManage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Master Add, Edit, Remove Workers"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Workers ({totalWorkers})</span>
            </button>

            <button
              onClick={onOpenSitesManage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Master Add, Edit, Remove Sites"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Sites ({sitesCount})</span>
            </button>

            <button
              onClick={onOpenExcelImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-medium border border-emerald-800/60 transition-colors"
              title="Import Excel labours list"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Excel</span>
            </button>

            <button
              onClick={onExportExcel}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Export to Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onResetSeed}
              className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
              title="Reset to default screenshot data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Operational Status Ribbon */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500">Dispatch Header:</span>
              <span className="font-bold text-amber-400 font-mono">{workHeader}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-500">Deployed:</span>
              <span className="font-semibold text-emerald-400">{deployedCount} Workers</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-500">Free Pool:</span>
              <span className="font-semibold text-amber-400">{unassignedCount} Workers</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500">Active Worksites:</span>
              <span className="font-semibold text-slate-200">{sitesCount}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>✨ Click any site button below worker name to attach in 1 click</span>
          </div>
        </div>
      </div>
    </header>
  );
};
