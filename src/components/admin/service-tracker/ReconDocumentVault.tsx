import React, { useState, useMemo } from 'react';
import { 
  FileText, Receipt, ShieldCheck, Settings, Search, 
  ExternalLink, HardDrive, Sparkles, FolderOpen, Eye, Filter
} from 'lucide-react';
import { VehicleItem } from '../../../db/types';
import { GDriveVaultConfig } from '../../../services/gdriveVaultClient';
import { PreviewDocumentData } from './ReconDocumentViewerModal';

interface ReconDocumentVaultProps {
  cars: VehicleItem[];
  vaultConfig: GDriveVaultConfig;
  onOpenConfigModal: () => void;
  onOpenPreview: (doc: PreviewDocumentData) => void;
}

export const ReconDocumentVault: React.FC<ReconDocumentVaultProps> = ({
  cars,
  vaultConfig,
  onOpenConfigModal,
  onOpenPreview
}) => {
  const [docFilter, setDocFilter] = useState<'all' | 'receipts' | 'tech_docs'>('all');
  const [vaultSearch, setVaultSearch] = useState('');

  // Colectare și agregare documente din toate mașinile parcului
  const allVaultDocuments = useMemo(() => {
    const list: (PreviewDocumentData & {
      id: string;
      carId: string;
      carName: string;
      vin?: string;
      category: 'receipt' | 'tech_doc';
    })[] = [];

    cars.forEach(car => {
      // 1. Bonuri și facturi din cheltuieli
      (car.expenses || []).forEach(exp => {
        (exp.receipts || []).forEach(r => {
          list.push({
            id: r.id,
            carId: car.id,
            carName: `${car.brand} ${car.model}`,
            vin: car.vin,
            title: `${exp.title} (${r.name})`,
            type: r.type === 'receipt' ? 'Bon Fiscal' : 'Factură Fiscală',
            sizeKb: r.fileSizeKb,
            compressionRatio: r.compressionRatio,
            url: r.dataUrl || '',
            category: 'receipt'
          });
        });
      });

      // 2. Documente tehnice (CIV, Talon, Diagnoză)
      (car.technicalDocuments || []).forEach(doc => {
        let label = 'Document Tehnic';
        if (doc.type === 'civ') label = 'CIV (Carte Vehicul)';
        else if (doc.type === 'talon') label = 'Certificat Înmatriculare / Talon';
        else if (doc.type === 'diagnosis_tuv') label = 'Raport Diagnoză / TUV';
        else if (doc.type === 'purchase_invoice') label = 'Factură Achiziție';
        else if (doc.type === 'warranty_book') label = 'Carte Service / Garanție';

        list.push({
          id: doc.id,
          carId: car.id,
          carName: `${car.brand} ${car.model}`,
          vin: car.vin,
          title: doc.title,
          type: label,
          sizeKb: doc.fileSizeKb,
          compressionRatio: doc.compressionRatio,
          url: doc.dataUrl || '',
          category: 'tech_doc'
        });
      });
    });

    return list;
  }, [cars]);

  // Filtrare documente după categorie și text căutat
  const filteredDocs = useMemo(() => {
    return allVaultDocuments.filter(doc => {
      if (docFilter === 'receipts' && doc.category !== 'receipt') return false;
      if (docFilter === 'tech_docs' && doc.category !== 'tech_doc') return false;

      if (!vaultSearch.trim()) return true;
      const q = vaultSearch.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.carName.toLowerCase().includes(q) ||
        (doc.vin && doc.vin.toLowerCase().includes(q)) ||
        doc.type.toLowerCase().includes(q)
      );
    });
  }, [allVaultDocuments, docFilter, vaultSearch]);

  return (
    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
      {/* 🧭 Antet Seif General */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Seif Documente Tehnice & Bonuri Fiscale (Arhivă Google Drive PRO)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Toate actele (CIV, Talon, Facturi piese, Devize) sunt comprimate cu claritate 100% și sincronizate în Google Drive PRO.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
            Destinație: <code className="text-amber-400 font-mono">{vaultConfig.rootFolderName}</code>
          </span>

          {vaultConfig.sharedFolderUrl && (
            <a
              href={vaultConfig.sharedFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Deschide folderul în Google Drive"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Drive</span>
              <ExternalLink className="w-3 h-3 text-emerald-400/80" />
            </a>
          )}

          <button
            type="button"
            onClick={onOpenConfigModal}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all"
            title="Configurare Seif Google Drive"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Configurare</span>
          </button>
        </div>
      </div>

      {/* 🔍 Filtrare și Căutare în Seif */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={vaultSearch}
            onChange={(e) => setVaultSearch(e.target.value)}
            placeholder="Caută document, mașină, VIN..."
            className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setDocFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              docFilter === 'all'
                ? 'bg-zinc-700 text-white'
                : 'bg-black/30 text-zinc-400 hover:text-white border border-white/[0.05]'
            }`}
          >
            Toate ({allVaultDocuments.length})
          </button>
          <button
            type="button"
            onClick={() => setDocFilter('receipts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              docFilter === 'receipts'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-black/30 text-zinc-400 hover:text-white border border-white/[0.05]'
            }`}
          >
            Bonuri & Facturi ({allVaultDocuments.filter(d => d.category === 'receipt').length})
          </button>
          <button
            type="button"
            onClick={() => setDocFilter('tech_docs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              docFilter === 'tech_docs'
                ? 'bg-cyan-500 text-black font-bold'
                : 'bg-black/30 text-zinc-400 hover:text-white border border-white/[0.05]'
            }`}
          >
            CIV & Acte Tehnice ({allVaultDocuments.filter(d => d.category === 'tech_doc').length})
          </button>
        </div>
      </div>

      {/* 📑 Grid Carduri Documente */}
      {filteredDocs.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-white/[0.06] rounded-xl">
          Niciun document încărcat în seif conform filtrelor selectate.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              onClick={() => onOpenPreview(doc)}
              className="bg-[#18181c] hover:bg-[#1e1e24] border border-white/[0.06] hover:border-amber-500/40 rounded-xl p-3 cursor-pointer transition-all group flex flex-col justify-between gap-3 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    doc.category === 'receipt'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {doc.type}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {doc.sizeKb} KB
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                  {doc.title}
                </h4>

                <div className="text-[11px] text-zinc-400 mt-1">
                  🚗 {doc.carName}
                </div>

                {doc.vin && (
                  <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
                    VIN: {doc.vin}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                {typeof doc.compressionRatio === 'number' && doc.compressionRatio > 0 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    -{doc.compressionRatio}%
                  </span>
                ) : (
                  <span className="text-zinc-500">Claritate 100%</span>
                )}

                <span className="text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors">
                  <Eye className="w-3 h-3" /> Deschide
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
