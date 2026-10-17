import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Building2, Clock, User, Trash2 } from 'lucide-react';
import { Site } from '../types';
import { upsertSite, deleteSite } from '../services/dataService';

interface SiteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteToEdit?: Site | null;
  onSaved: (site: Site) => void;
  onDeleted: (siteId: string) => void;
  onShowToast: (msg: string) => void;
  nextSortOrder: number;
}

export const SiteEditModal: React.FC<SiteEditModalProps> = ({
  isOpen,
  onClose,
  siteToEdit,
  onSaved,
  onDeleted,
  onShowToast,
  nextSortOrder,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [inchargeName, setInchargeName] = useState('');
  const [reportingTime, setReportingTime] = useState('6:00AM');
  const [targetHeadcount, setTargetHeadcount] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (siteToEdit) {
      setName(siteToEdit.name || '');
      setCode(siteToEdit.code || '');
      setLocation(siteToEdit.location || '');
      setInchargeName(siteToEdit.incharge_name || '');
      setReportingTime(siteToEdit.reporting_time || '6:00AM');
      setTargetHeadcount(siteToEdit.target_headcount ? String(siteToEdit.target_headcount) : '');
    } else {
      setName('');
      setCode('');
      setLocation('');
      setInchargeName('');
      setReportingTime('6:00AM');
      setTargetHeadcount('');
    }
  }, [siteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    const site: Site = {
      id: siteToEdit?.id || `site-${Date.now()}`,
      name: name.trim().toUpperCase(),
      code: code.trim() || null,
      location: location.trim() || null,
      incharge_name: inchargeName.trim() || null,
      reporting_time: reportingTime.trim() || '6:00AM',
      target_headcount: targetHeadcount ? Number(targetHeadcount) : null,
      sort_order: siteToEdit?.sort_order ?? nextSortOrder,
    };

    try {
      await upsertSite(site);
      onSaved(site);
      onShowToast(siteToEdit ? `Updated site: ${site.name}` : `Created site: ${site.name}`);
      onClose();
    } catch (err: any) {
      onShowToast(`Failed to save site: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!siteToEdit || isSaving) return;
    setIsSaving(true);
    try {
      await deleteSite(siteToEdit.id);
      onDeleted(siteToEdit.id);
      onShowToast(`Deleted site: ${siteToEdit.name}`);
      onClose();
    } catch (err: any) {
      onShowToast(`Failed to delete site: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] shadow-2xl overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {siteToEdit ? 'Edit Worksite' : 'Add New Worksite'}
              </h2>
              <p className="text-xs text-slate-400">Name, in-charge, reporting time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Site / Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SHANTHI FOUNDATION, HTS, EGE INTERIOR"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Site Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SF-01"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dubai, UAE"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-slate-300 font-semibold mb-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>With (In-charge)</span>
              </label>
              <input
                type="text"
                value={inchargeName}
                onChange={(e) => setInchargeName(e.target.value)}
                placeholder="e.g. Qadeer, Zubair"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-slate-300 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Reporting Time</span>
              </label>
              <input
                type="text"
                value={reportingTime}
                onChange={(e) => setReportingTime(e.target.value)}
                placeholder="e.g. 6:00AM"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Headcount</label>
              <input
                type="number"
                min="0"
                value={targetHeadcount}
                onChange={(e) => setTargetHeadcount(e.target.value)}
                placeholder="e.g. 6"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <div>
              {siteToEdit &&
                (isConfirmingDelete ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold animate-pulse"
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
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Site</span>
                  </button>
                ))}
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
                disabled={isSaving}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition-colors"
              >
                {isSaving ? 'Saving...' : siteToEdit ? 'Save Changes' : 'Create Site'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
