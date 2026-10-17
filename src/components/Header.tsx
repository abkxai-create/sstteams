import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  Copy,
  Download,
  Upload,
  Users,
  Building2,
  HardHat,
  ChevronLeft,
  ChevronRight,
  Zap,
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
}) => {
  const formattedTime = formatUAETime(uaeTime);
  const workHeader = `WORK - ${formatDateForWorkHeader(selectedDate)}`;

  const handleToday = () => {
    onDateChange(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }));
  };

  const stats = [
    { label: 'Deployed', value: deployedCount, dot: 'bg-emerald-500', text: 'text-emerald-400' },
    { label: 'Free Pool', value: unassignedCount, dot: 'bg-amber-500', text: 'text-amber-400' },
    { label: 'Worksites', value: sitesCount, dot: 'bg-sky-500', text: 'text-sky-400' },
    { label: 'Workforce', value: totalWorkers, dot: 'bg-slate-400', text: 'text-slate-200' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-xl border-b border-slate-800 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25"
              >
                <HardHat className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate">
                    ScaffoldAlloc
                  </h1>
                  <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-widest">
                    UAE Ops
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-slate-400 truncate">
                  Safe Scaffolding Trading · Mountain Sky · Subcontractors
                </p>
              </div>
            </div>

            {/* Mobile-only live clock */}
            <div className="flex xl:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-amber-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono font-semibold tabular-nums">{formattedTime}</span>
            </div>
          </div>

          {/* Clock + Date Navigator */}
          <div className="hidden xl:flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-amber-400">
              <Clock className="w-4 h-4" />
              <div className="text-xs font-mono font-semibold tracking-wider tabular-nums">
                {formattedTime} <span className="text-[10px] text-slate-500 uppercase">GST</span>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                onClick={() => onDateChange(getYesterdayDateString(selectedDate))}
                title="Previous day"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && onDateChange(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>
              <button
                onClick={() => onDateChange(getTomorrowDateString(selectedDate))}
                title="Next day"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>

            <button
              onClick={onDuplicateYesterday}
              title="Duplicate yesterday's allocation to this date"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Copy Yesterday</span>
            </button>
          </div>

          {/* Master tools */}
          <div className="hidden xl:flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenWorkerManage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Workers ({totalWorkers})</span>
            </button>
            <button
              onClick={onOpenSitesManage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Sites ({sitesCount})</span>
            </button>
            <button
              onClick={onOpenExcelImport}
              title="Import workforce from Excel"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={onExportExcel}
              title="Export to Excel (.xlsx)"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile: date nav + primary actions (visible below xl) */}
        <div className="xl:hidden mt-3 flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
            <button
              onClick={() => onDateChange(getYesterdayDateString(selectedDate))}
              title="Previous day"
              className="p-2 text-slate-400 active:text-white active:bg-slate-800 rounded-lg transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer [color-scheme:dark] w-[118px]"
            />
            <button
              onClick={() => onDateChange(getTomorrowDateString(selectedDate))}
              title="Next day"
              className="p-2 text-slate-400 active:text-white active:bg-slate-800 rounded-lg transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2 py-1.5 text-xs font-semibold text-amber-400 active:bg-amber-500/10 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={onDuplicateYesterday}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 active:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Copy Yesterday</span>
          </button>
        </div>

        {/* Mobile: management tools row (visible below xl) */}
        <div className="xl:hidden mt-2 grid grid-cols-4 gap-2">
          <button
            onClick={onOpenWorkerManage}
            className="flex flex-col items-center justify-center gap-1 px-1 py-2.5 rounded-xl bg-slate-800/80 active:bg-slate-700 text-slate-100 border border-slate-700 transition-colors"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-semibold">Workers</span>
          </button>
          <button
            onClick={onOpenSitesManage}
            className="flex flex-col items-center justify-center gap-1 px-1 py-2.5 rounded-xl bg-slate-800/80 active:bg-slate-700 text-slate-100 border border-slate-700 transition-colors"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-semibold">Sites</span>
          </button>
          <button
            onClick={onOpenExcelImport}
            className="flex flex-col items-center justify-center gap-1 px-1 py-2.5 rounded-xl bg-slate-800/80 active:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Import</span>
          </button>
          <button
            onClick={onExportExcel}
            className="flex flex-col items-center justify-center gap-1 px-1 py-2.5 rounded-xl bg-slate-800/80 active:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Export</span>
          </button>
        </div>

        {/* Status ribbon (desktop only) */}
        <div className="hidden xl:flex mt-3 pt-3 border-t border-slate-800/70 items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <span className="flex items-center gap-1.5 text-slate-400">
              Dispatch Header:
              <span className="font-bold text-amber-400 font-mono">{workHeader}</span>
            </span>
            {stats.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-slate-400">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}:
                <span className={`font-semibold ${s.text} tabular-nums`}>{s.value}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Copy className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] text-slate-500">
              Click a site button on any worker row to deploy in one click
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
