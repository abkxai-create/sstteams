import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Phone,
} from 'lucide-react';
import { Worker, WorkerStatus } from '../types';
import { upsertWorker, deleteWorker } from '../services/dataService';

interface WorkerManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  workerToEdit?: Worker | null;
  onWorkerSaved: (worker: Worker) => void;
  onWorkerDeleted: (workerId: string) => void;
  onShowToast: (msg: string) => void;
  nextSortOrder: number;
}

export const WorkerManageModal: React.FC<WorkerManageModalProps> = ({
  isOpen,
  onClose,
  workers,
  workerToEdit,
  onWorkerSaved,
  onWorkerDeleted,
  onShowToast,
  nextSortOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmpCode, setFormEmpCode] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formCompany, setFormCompany] = useState('SST');
  const [formCustomCompany, setFormCustomCompany] = useState('');
  const [formSheetSource, setFormSheetSource] = useState('Direct Add');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<WorkerStatus>('active');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    if (isOpen && workerToEdit) {
      startEdit(workerToEdit);
    } else if (isOpen && !workerToEdit) {
      setIsCreatingNew(false);
      setEditingWorker(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, workerToEdit]);

  if (!isOpen) return null;

  const startCreateNew = () => {
    setIsCreatingNew(true);
    setEditingWorker(null);
    setFormName('');
    setFormEmpCode(`SST-${workers.length + 1}`);
    setFormDesignation('Scaffolder Level 1');
    setFormCompany('SST');
    setFormCustomCompany('');
    setFormSheetSource('Direct Add');
    setFormPhone('');
    setFormStatus('active');
    setFormNotes('');
  };

  const startEdit = (worker: Worker) => {
    setIsCreatingNew(false);
    setEditingWorker(worker);
    setFormName(worker.name);
    setFormEmpCode(worker.emp_code || '');
    setFormDesignation(worker.designation || '');
    setFormCompany(worker.company || 'SST');
    setFormCustomCompany('');
    setFormSheetSource(worker.sheet_source || 'Direct Add');
    setFormPhone(worker.phone || '');
    setFormStatus(worker.status || 'active');
    setFormNotes(worker.notes || '');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || isSaving) return;

    const companyFinal =
      formCompany === 'other' ? formCustomCompany.trim() || 'Outsiders' : formCompany;

    const workerToSave: Worker = {
      id: editingWorker ? editingWorker.id : `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emp_code: formEmpCode.trim() || `EMP-${Date.now().toString().slice(-4)}`,
      name: formName.trim(),
      designation: formDesignation.trim() || 'Scaffolder',
      company: companyFinal,
      sheet_source: formSheetSource,
      phone: formPhone.trim() || null,
      status: formStatus,
      notes: formNotes.trim() || null,
      sort_order: editingWorker ? editingWorker.sort_order : nextSortOrder,
    };

    setIsSaving(true);
    try {
      await upsertWorker(workerToSave);
      onWorkerSaved(workerToSave);
      onShowToast(editingWorker ? `Updated worker: ${workerToSave.name}` : `Added worker: ${workerToSave.name}`);
      setIsCreatingNew(false);
      setEditingWorker(null);
    } catch (err: any) {
      onShowToast(`Failed to save worker: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (worker: Worker) => {
    try {
      await deleteWorker(worker.id);
      onWorkerDeleted(worker.id);
      onShowToast(`Removed worker: ${worker.name}`);
      setIsCreatingNew(false);
      setEditingWorker(null);
    } catch (err: any) {
      onShowToast(`Failed to delete worker: ${err.message}`);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        w.name.toLowerCase().includes(q) ||
        w.designation.toLowerCase().includes(q) ||
        w.company.toLowerCase().includes(q) ||
        w.emp_code.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCompany !== 'all' && w.company !== selectedCompany) return false;
    return true;
  });

  const companies = Array.from(new Set(workers.map((w) => w.company))).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Workforce Database</h2>
              <p className="text-xs text-slate-400">
                {workers.length} total workers · SST, Mountain Sky & Subcontractors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreatingNew && !editingWorker && (
              <button
                onClick={startCreateNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Worker</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isCreatingNew || editingWorker ? (
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-white">
                  {editingWorker ? `Edit Worker: ${editingWorker.name}` : 'Add New Worker'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingWorker(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Worker Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Tariq Mahmood"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee / Badge ID</label>
                  <input
                    type="text"
                    value={formEmpCode}
                    onChange={(e) => setFormEmpCode(e.target.value)}
                    placeholder="e.g. SST-014 or MS-102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Scaffold Foreman, Scaffolder L2, Helper"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Company / Source *</label>
                  <select
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                  >
                    <option value="SST">SST (Safe Scaffolding Trading)</option>
                    <option value="Mountain Sky">Mountain Sky Scaffolding</option>
                    <option value="SST/Sajja Yard">SST/Sajja Yard</option>
                    <option value="Outsiders">Outsiders</option>
                    <option value="Al Barsha Sub">Al Barsha Subcontractor</option>
                    <option value="other">Custom Company...</option>
                  </select>
                  {formCompany === 'other' && (
                    <input
                      type="text"
                      placeholder="Enter custom company name"
                      value={formCustomCompany}
                      onChange={(e) => setFormCustomCompany(e.target.value)}
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 transition"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Source Category</label>
                  <select
                    value={formSheetSource}
                    onChange={(e) => setFormSheetSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                  >
                    <option value="Direct Add">Direct Office Addition</option>
                    <option value="Sheet 1: SST & M Sky">Sheet 1: SST & M Sky</option>
                    <option value="Sheet 2: Others & Outsiders">Sheet 2: Others & Outsiders</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-slate-400 mb-1 font-medium">
                    <Phone className="w-3 h-3" />
                    <span>Contact Phone (UAE Mobile)</span>
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +971 50 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Workforce Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as WorkerStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                  >
                    <option value="active">Active (Available for Daily Allocation)</option>
                    <option value="on_leave">On Annual Leave / Vacation</option>
                    <option value="inactive">Inactive / Deactivated</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Notes / Certifications</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. CISRS card valid until 2027, height work approved..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <div>
                  {editingWorker && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingWorker)}
                      className="px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Worker</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setEditingWorker(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold shadow-sm transition-colors"
                  >
                    {isSaving ? 'Saving...' : editingWorker ? 'Save Changes' : 'Add Worker'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Search & filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, role, company, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full sm:w-auto cursor-pointer [color-scheme:dark]"
                >
                  <option value="all">All Companies ({workers.length})</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c} ({workers.filter((w) => w.company === c).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Emp ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredWorkers.map((worker) => (
                        <tr key={worker.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                            {worker.emp_code}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">{worker.name}</td>
                          <td className="py-2.5 px-3 text-slate-300">{worker.designation}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                              {worker.company}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                worker.status === 'active'
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                  : worker.status === 'on_leave'
                                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                                  : 'bg-rose-950 text-rose-400 border-rose-800'
                              }`}
                            >
                              {worker.status === 'active'
                                ? 'Active'
                                : worker.status === 'on_leave'
                                ? 'On Leave'
                                : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1">
                            <button
                              onClick={() => startEdit(worker)}
                              className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors"
                              title="Edit worker"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(worker)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                              title="Delete worker"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
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
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredWorkers.length} matching workers</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
