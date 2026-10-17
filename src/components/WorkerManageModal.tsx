import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  Edit2,
  Trash2,
  HardHat,
  Users,
  Check,
  UserCheck,
  UserX,
  Phone,
  Building,
  Briefcase,
} from 'lucide-react';
import { Worker, WorkerStatus } from '../types';

interface WorkerManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  workerToEdit?: Worker | null;
  onSaveWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
}

export const WorkerManageModal: React.FC<WorkerManageModalProps> = ({
  isOpen,
  onClose,
  workers,
  workerToEdit,
  onSaveWorker,
  onDeleteWorker,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmpCode, setFormEmpCode] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formCompany, setFormCompany] = useState('SST');
  const [formCustomCompany, setFormCustomCompany] = useState('');
  const [formSheetSource, setFormSheetSource] = useState('Sheet 1: SST & M Sky');
  const [formPhone, setFormPhone] = useState('');
  const [formDefaultSite, setFormDefaultSite] = useState('');
  const [formStatus, setFormStatus] = useState<WorkerStatus>('active');
  const [formNotes, setFormNotes] = useState('');

  React.useEffect(() => {
    if (isOpen && workerToEdit) {
      startEdit(workerToEdit);
    } else if (isOpen && !workerToEdit && !editingWorker) {
      setIsCreatingNew(false);
      setEditingWorker(null);
    }
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
    setFormSheetSource('Sheet 1: SST & M Sky');
    setFormPhone('');
    setFormDefaultSite('');
    setFormStatus('active');
    setFormNotes('');
  };

  const startEdit = (worker: Worker) => {
    setIsCreatingNew(false);
    setEditingWorker(worker);
    setFormName(worker.name);
    setFormEmpCode(worker.empCode || '');
    setFormDesignation(worker.designation || '');
    setFormCompany(worker.company || 'SST');
    setFormCustomCompany('');
    setFormSheetSource(worker.sheetSource || 'Custom Entry');
    setFormPhone(worker.phone || '');
    setFormDefaultSite(worker.currentSite || '');
    setFormStatus(worker.status || 'active');
    setFormNotes(worker.notes || '');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const companyFinal =
      formCompany === 'other' ? formCustomCompany.trim() || 'Outsiders' : formCompany;

    const workerToSave: Worker = {
      id: editingWorker ? editingWorker.id : `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      empCode: formEmpCode.trim() || `EMP-${Date.now().toString().slice(-4)}`,
      name: formName.trim(),
      designation: formDesignation.trim() || 'Scaffolder',
      company: companyFinal,
      sheetSource: formSheetSource,
      phone: formPhone.trim() || undefined,
      currentSite: formDefaultSite.trim() || undefined,
      status: formStatus,
      notes: formNotes.trim() || undefined,
    };

    onSaveWorker(workerToSave);
    setIsCreatingNew(false);
    setEditingWorker(null);
  };

  const filteredWorkers = workers.filter((w) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        w.name.toLowerCase().includes(q) ||
        w.designation.toLowerCase().includes(q) ||
        w.company.toLowerCase().includes(q) ||
        w.empCode.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCompany !== 'all' && w.company !== selectedCompany) {
      return false;
    }
    return true;
  });

  const companies = Array.from(new Set(workers.map((w) => w.company))).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Workforce Management Database</h2>
              <p className="text-xs text-slate-400">
                {workers.length} Total Workers · SST, Mountain Sky & Subcontractors
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

        {/* Modal Body: Either Form or Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isCreatingNew || editingWorker ? (
            /* Add / Edit Form */
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-white">
                  {editingWorker ? `Edit Worker: ${editingWorker.name}` : 'Add New Worker to Database'}
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee / Badge ID</label>
                  <input
                    type="text"
                    value={formEmpCode}
                    onChange={(e) => setFormEmpCode(e.target.value)}
                    placeholder="e.g. SST-014 or MS-102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Company / Source *</label>
                  <select
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
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
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Excel Sheet Category</label>
                  <select
                    value={formSheetSource}
                    onChange={(e) => setFormSheetSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Sheet 1: SST & M Sky">Sheet 1: SST & M Sky</option>
                    <option value="Sheet 2: Others & Outsiders">Sheet 2: Others & Outsiders</option>
                    <option value="Direct Add">Direct Office Addition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Contact Phone (UAE Mobile)</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +971 50 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Workforce Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as WorkerStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="active">Active (Available for Daily Allocation)</option>
                    <option value="on_leave">On Annual Leave / Vacation</option>
                    <option value="inactive">Inactive / Deactivated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Default/Base Site</label>
                  <input
                    type="text"
                    value={formDefaultSite}
                    onChange={(e) => setFormDefaultSite(e.target.value)}
                    placeholder="e.g. Burj Crown Tower or Sajja Yard"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Notes / Certifications</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. CISRS card valid until 2027, height work approved..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <div>
                  {editingWorker && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteWorker(editingWorker.id);
                        setIsCreatingNew(false);
                        setEditingWorker(null);
                      }}
                      className="px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    {editingWorker ? 'Save Changes' : 'Add Worker'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Database Table View */
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search workforce by name, role, company, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full sm:w-auto cursor-pointer"
                >
                  <option value="all">All Companies ({workers.length})</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c} ({workers.filter((w) => w.company === c).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Workers Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Emp ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3">Sheet Source</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredWorkers.map((worker) => (
                        <tr
                          key={worker.id}
                          className="hover:bg-slate-900/60 transition-colors group"
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                            {worker.empCode}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {worker.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {worker.designation}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                              {worker.company}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {worker.sheetSource}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                worker.status === 'active'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : worker.status === 'on_leave'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
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
                              className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                              title="Edit worker"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteWorker(worker.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredWorkers.length} matching workers</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
