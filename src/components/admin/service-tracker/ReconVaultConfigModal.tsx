import React from 'react';
import { HardDrive, X } from 'lucide-react';
import { GDriveVaultConfig } from '../../../services/gdriveVaultClient';

interface ReconVaultConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configEmail: string;
  setConfigEmail: (val: string) => void;
  configFolderUrl: string;
  setConfigFolderUrl: (val: string) => void;
  configRootFolder: string;
  setConfigRootFolder: (val: string) => void;
  onSave: () => void;
}

export const ReconVaultConfigModal: React.FC<ReconVaultConfigModalProps> = ({
  isOpen,
  onClose,
  configEmail,
  setConfigEmail,
  configFolderUrl,
  setConfigFolderUrl,
  configRootFolder,
  setConfigRootFolder,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#18181c] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Configurare Seif Google Drive Dedicat</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">Email Cont Google Drive Dedicat:</label>
            <input
              type="email"
              value={configEmail}
              onChange={(e) => setConfigEmail(e.target.value)}
              placeholder="ex: vault-mpi@gmail.com"
              className="w-full bg-black/50 border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Link Folder Dedicat (Partajat):</label>
            <input
              type="url"
              value={configFolderUrl}
              onChange={(e) => setConfigFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-black/50 border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Nume Folder Rădăcină:</label>
            <input
              type="text"
              value={configRootFolder}
              onChange={(e) => setConfigRootFolder(e.target.value)}
              placeholder="ParcOS_Vault_MPI"
              className="w-full bg-black/50 border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition-colors"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black transition-colors"
          >
            Salvează Configurația
          </button>
        </div>
      </div>
    </div>
  );
};
