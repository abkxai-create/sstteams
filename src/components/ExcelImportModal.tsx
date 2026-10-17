import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  X,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { parseExcelWorkersFile, ParsedExcelResult } from '../utils/excelHandler';
import { Worker } from '../types';
import { upsertWorker } from '../services/dataService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFinished: (imported: Worker[], replaced: boolean) => void;
  onShowToast: (msg: string) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportFinished,
  onShowToast,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedExcelResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMsg('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setFileName(file.name);

    try {
      const result = await parseExcelWorkersFile(file);
      if (result.workers.length === 0) {
        setErrorMsg('No valid worker rows could be parsed. Please check sheet columns.');
        setParsedData(null);
      } else {
        setParsedData(result);
      }
    } catch (e: any) {
      setErrorMsg(`Failed to parse Excel file: ${e?.message || 'Unknown error'}`);
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.workers.length === 0 || isImporting) return;
    setIsImporting(true);

    try {
      for (const worker of parsedData.workers) {
        await upsertWorker(worker);
      }
      onImportFinished(parsedData.workers, importMode === 'replace');
      onShowToast(`Imported ${parsedData.workers.length} workers from Excel!`);
      onClose();
    } catch (err: any) {
      onShowToast(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Workers from Excel</h2>
              <p className="text-xs text-slate-400">
                Multi-sheet workbooks supported (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleProcessFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
                : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <Upload className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
            <p className="text-sm font-bold text-white mb-1">
              Click to select or drag and drop your Excel file here
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Auto-detects columns: Name, Designation, Company, Emp Code, Phone, Status
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-emerald-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Parsing Excel sheets and validating labour records...</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedData && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>File: {fileName}</span>
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {parsedData.workers.length} valid workers detected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Sheets detected:</span>
                  {parsedData.sheetNames.map((sn) => (
                    <span
                      key={sn}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[10px]"
                    >
                      {sn}
                    </span>
                  ))}
                </div>
              </div>

              {/* Import mode */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-200 block">
                  Select Import Action:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      importMode === 'append'
                        ? 'border-emerald-500 bg-emerald-950/20 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-slate-200">Append & Merge</div>
                      <div className="text-[11px] text-slate-400">
                        Add imported workers into the existing database
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      importMode === 'replace'
                        ? 'border-emerald-500 bg-emerald-950/20 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-slate-200">Replace All</div>
                      <div className="text-[11px] text-slate-400">
                        Removes current workers first, then imports {parsedData.workers.length}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Sample Preview (First 8 Rows):
                </div>
                <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/80 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Designation</th>
                        <th className="py-2 px-3">Company</th>
                        <th className="py-2 px-3">Sheet Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {parsedData.workers.slice(0, 8).map((w, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-medium text-white">{w.name}</td>
                          <td className="py-2 px-3 text-slate-300">{w.designation}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              {w.company}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[10px]">{w.sheet_source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
          >
            Cancel
          </button>

          {parsedData && parsedData.workers.length > 0 && (
            <button
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>{isImporting ? 'Importing...' : `Confirm & Import ${parsedData.workers.length} Workers`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
