import React, { useState, useEffect } from 'react';
import { X, Building2, Clock, User, Trash2 } from 'lucide-react';
import { Site } from '../types';

interface SiteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteToEdit?: Site | null;
  onSaveSite: (site: Partial<Site>) => void;
  onDeleteSite?: (siteId: string) => void;
}

export const SiteEditModal: React.FC<SiteEditModalProps> = ({
  isOpen,
  onClose,
  siteToEdit,
  onSaveSite,
  onDeleteSite,
}) => {
  const [name, setName] = useState('');
  const [inchargeName, setInchargeName] = useState('');
  const [reportingTime, setReportingTime] = useState('6:00AM');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (siteToEdit) {
      setName(siteToEdit.name || '');
      setInchargeName(siteToEdit.inchargeName || '');
      setReportingTime(siteToEdit.reportingTime || '6:00AM');
    } else {
      setName('');
      setInchargeName('');
      setReportingTime('6:00AM');
    }
  }, [siteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveSite({
      ...(siteToEdit ? { id: siteToEdit.id } : {}),
      name: name.trim().toUpperCase(),
      inchargeName: inchargeName.trim() || undefined,
      reportingTime: reportingTime.trim() || '6:00AM',
    });
    onClose();
  };

  const handleDelete = () => {
    if (!siteToEdit || !onDeleteSite) return;
    onDeleteSite(siteToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {siteToEdit ? 'Edit Worksite' : 'Add New Worksite'}
              </h2>
              <p className="text-xs text-slate-400">
                Site name, in-charge supervisor, and reporting time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Site / Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SHANTHI FOUNDATION, HTS, EGE INTERIOR"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>With (In-charge)</span>
              </label>
              <input
                type="text"
                value={inchargeName}
                onChange={(e) => setInchargeName(e.target.value)}
                placeholder="e.g. Qadeer, Zubair"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                "With Qadeer / 6:00AM"
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Reporting Time</span>
              </label>
              <input
                type="text"
                value={reportingTime}
                onChange={(e) => setReportingTime(e.target.value)}
                placeholder="e.g. 6:00AM"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                e.g. 6:00AM, 7:00AM
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <div>
              {siteToEdit && onDeleteSite && (
                <>
                  {!isConfirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex items-center gap-1 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Site</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer animate-pulse"
                      >
                        Confirm Delete!
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
              >
                {siteToEdit ? 'Save Changes' : 'Create Site'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
