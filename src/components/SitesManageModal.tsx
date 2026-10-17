import React, { useState } from 'react';
import {
  X,
  Plus,
  Building2,
  Edit2,
  Trash2,
  Clock,
  User,
  MapPin,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Site } from '../types';

interface SitesManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  onOpenAddSite: () => void;
  onOpenEditSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onReorderSites: (siteId: string, direction: 'prev' | 'next') => void;
}

export const SitesManageModal: React.FC<SitesManageModalProps> = ({
  isOpen,
  onClose,
  sites,
  onOpenAddSite,
  onOpenEditSite,
  onDeleteSite,
  onReorderSites,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Master Sites Manager</h2>
              <p className="text-xs text-slate-400">
                Add, edit, reorder or remove worksites and configure in-charges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAddSite();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Site</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sites List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {sites.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No worksites configured yet. Click "Add New Site" to create one.
            </div>
          ) : (
            sites.map((site, index) => (
              <div
                key={site.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex flex-col items-center justify-center">
                    <button
                      onClick={() => onReorderSites(site.id, 'prev')}
                      disabled={index === 0}
                      className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => onReorderSites(site.id, 'next')}
                      disabled={index === sites.length - 1}
                      className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">
                        {site.name}
                      </span>
                      {site.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {site.code}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-400 mt-1 text-[11px]">
                      <span className="flex items-center gap-1 text-amber-300">
                        <User className="w-3 h-3 text-amber-400" />
                        <span>With: {site.inchargeName || 'Unassigned'}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{site.reportingTime || '6:00AM'}</span>
                      </span>
                      {site.location && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{site.location}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEditSite(site);
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Site Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteSite(site.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Site"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>{sites.length} Active Sites</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
