import React, { useState, useRef } from 'react';
import { 
  X, Check, Plus, Upload, Eye, FileText, Receipt, 
  DollarSign, CheckCircle2, Clock, AlertTriangle, Sparkles 
} from 'lucide-react';
import { 
  VehicleItem, VehicleReconStatus, VehicleDefectItem, 
  ExpenseReceiptDocument, VehicleTechnicalDocument, VehicleExpenseItem 
} from '../../../db/types';
import { optimizeDocumentFile, OptimizedDocumentResult } from '../../../utils/documentOptimizer';
import { queueFileForGDriveSync } from '../../../services/gdriveVaultClient';
import { 
  RECON_COLUMNS, getCarHoldingCostMetrics, 
  createReconStatusAuditEntry, calculateMechanicalVat, VAT_RATE 
} from './reconHelpers';
import { PreviewDocumentData } from './ReconDocumentViewerModal';

export interface ReconVehicleDrawerProps {
  car: VehicleItem;
  onClose: () => void;
  onUpdateCar?: (updatedCar: VehicleItem) => void;
  onAddExpense?: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
  showToast?: (msg: string) => void;
  onOpenDocumentPreview: (doc: PreviewDocumentData) => void;
}

export const ReconVehicleDrawer: React.FC<ReconVehicleDrawerProps> = ({
  car,
  onClose,
  onUpdateCar,
  onAddExpense,
  showToast,
  onOpenDocumentPreview
}) => {
  const [activeTab, setActiveTab] = useState<'defects' | 'receipts' | 'documents' | 'expenses'>('defects');
  
  // Stare adăugare defecțiune
  const [defectTitle, setDefectTitle] = useState('');
  const [defectSeverity, setDefectSeverity] = useState<'low' | 'medium' | 'critical'>('medium');
  const [defectCostStr, setDefectCostStr] = useState('');

  // Stare încărcare fișier optimizat
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Metrici holding cost
  const holdingMetrics = getCarHoldingCostMetrics(car);

  // 1. Adăugare defecțiune / task mecanic cu legare automată la registrul de cheltuieli
  const handleAddDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectTitle.trim() || !onUpdateCar) return;

    const newDefectId = `def_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newDefect: VehicleDefectItem = {
      id: newDefectId,
      title: defectTitle.trim(),
      severity: defectSeverity,
      resolved: false,
      createdAt: new Date().toISOString()
    };

    // Dacă a completat o sumă estimată, adăugăm direct în registrul oficial de cheltuieli cu 21% TVA
    const cost = parseInt(defectCostStr, 10);
    if (!isNaN(cost) && cost > 0 && onAddExpense) {
      const vatInfo = calculateMechanicalVat(cost);
      onAddExpense(car.id, {
        category: 'mechanical_repairs',
        title: `Piesă/Manoperă: ${defectTitle.trim()}`,
        amountEur: cost,
        date: new Date().toISOString().split('T')[0],
        notes: `TVA 21% inclus (${vatInfo.vatEur} €). Creat automat din Recon Task`
      });
      newDefect.linkedExpenseId = `linked_${Date.now()}`;
    }

    const updatedCar: VehicleItem = {
      ...car,
      reconDefects: [newDefect, ...(car.reconDefects || [])]
    };

    onUpdateCar(updatedCar);
    setDefectTitle('');
    setDefectCostStr('');
    showToast?.('Sarcina a fost adăugată în fișa de service.');
  };

  // 2. Bifează/Debifează defecțiune
  const handleToggleDefect = (defectId: string) => {
    if (!onUpdateCar) return;
    const updatedDefects = (car.reconDefects || []).map(d => {
      if (d.id === defectId) {
        return {
          ...d,
          resolved: !d.resolved,
          resolvedAt: !d.resolved ? new Date().toISOString() : undefined
        };
      }
      return d;
    });

    onUpdateCar({
      ...car,
      reconDefects: updatedDefects
    });
  };

  // 3. Modificare stadiu cu jurnalizare formală în Audit Log
  const handleStatusChange = (nextStatus: VehicleReconStatus) => {
    if (!onUpdateCar || car.reconStatus === nextStatus) return;

    const auditEntry = createReconStatusAuditEntry(car.reconStatus, nextStatus);
    const updatedCar: VehicleItem = {
      ...car,
      reconStatus: nextStatus,
      reconStatusChangedAt: new Date().toISOString(),
      status: nextStatus === 'ready_for_sale' ? 'in_stock' : 'preparing',
      auditLog: [...(car.auditLog || []), auditEntry]
    };

    onUpdateCar(updatedCar);
    const colName = RECON_COLUMNS.find(c => c.id === nextStatus)?.title || nextStatus;
    showToast?.(`Stadiu actualizat: ${colName}`);
  };

  // 4. Încărcare & Optimizare Bon / Factură (Compresie 95% cu text lizibil)
  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCar) return;

    setIsOptimizing(true);
    try {
      const result: OptimizedDocumentResult = await optimizeDocumentFile(file, {
        maxDimension: 1800,
        quality: 0.78,
        enhanceContrast: true
      });

      // Înregistrare în coada Google Drive Vault
      queueFileForGDriveSync(car.id, 'receipt', result.fileName, result.fileSizeKb);

      const newReceipt: ExpenseReceiptDocument = {
        id: `rcp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: result.fileName,
        type: 'receipt',
        fileSizeKb: result.fileSizeKb,
        originalSizeKb: result.originalSizeKb,
        compressionRatio: result.compressionRatio,
        dataUrl: result.dataUrl,
        uploadedAt: new Date().toISOString(),
        gdriveWebViewLink: `https://drive.google.com/drive/folders/parcos-mpi-${car.id}`
      };

      const expenses = car.expenses || [];
      let updatedExpenses: VehicleExpenseItem[];

      if (expenses.length > 0) {
        updatedExpenses = expenses.map((exp, idx) => {
          if (idx === 0) {
            return {
              ...exp,
              receipts: [newReceipt, ...(exp.receipts || [])]
            };
          }
          return exp;
        });
      } else {
        updatedExpenses = [{
          id: `exp_${Date.now()}`,
          category: 'mechanical_repairs',
          title: `Cheltuială atașată bon ${result.fileName}`,
          amountEur: 0,
          date: new Date().toISOString().split('T')[0],
          notes: `TVA 21% aplicabil conform legii`,
          receipts: [newReceipt]
        }];
      }

      onUpdateCar({
        ...car,
        expenses: updatedExpenses
      });

      showToast?.(`Bon salvat și comprimat: ${result.originalSizeKb} KB ➔ ${result.fileSizeKb} KB (-${result.compressionRatio}%)`);
    } catch (err: any) {
      showToast?.(`Eroare la optimizarea imaginii: ${err.message}`);
    } finally {
      setIsOptimizing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 5. Încărcare Document Tehnic High-Res (CIV, Talon, Diagnoză)
  const handleUploadTechnicalDoc = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    docType: 'civ' | 'talon' | 'purchase_invoice' | 'diagnosis_tuv'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCar) return;

    setIsOptimizing(true);
    try {
      const result = await optimizeDocumentFile(file, {
        maxDimension: 2000,
        quality: 0.82,
        enhanceContrast: true
      });

      queueFileForGDriveSync(car.id, docType, result.fileName, result.fileSizeKb);

      let docTitle = file.name;
      if (docType === 'civ') docTitle = 'Carte Identitate Vehicul (CIV)';
      else if (docType === 'talon') docTitle = 'Certificat Înmatriculare (Talon)';
      else if (docType === 'diagnosis_tuv') docTitle = 'Raport Diagnoză & Tester';

      const newDoc: VehicleTechnicalDocument = {
        id: `tech_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: docType,
        title: docTitle,
        fileSizeKb: result.fileSizeKb,
        originalSizeKb: result.originalSizeKb,
        compressionRatio: result.compressionRatio,
        dataUrl: result.dataUrl,
        uploadedAt: new Date().toISOString()
      };

      onUpdateCar({
        ...car,
        technicalDocuments: [newDoc, ...(car.technicalDocuments || [])]
      });

      showToast?.(`Document tehnic salvat în Seif Google Drive (-${result.compressionRatio}%).`);
    } catch (err: any) {
      showToast?.(`Eroare la procesarea documentului: ${err.message}`);
    } finally {
      setIsOptimizing(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const totalSpent = (car.expenses || []).reduce((s, e) => s + (e.amountEur || 0), 0);
  const defects = car.reconDefects || [];
  const allReceipts = (car.expenses || []).flatMap(e => e.receipts || []);
  const techDocs = car.technicalDocuments || [];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#121215] border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* 1. Antet Drawer cu Date Vehicul & Holding Cost */}
      <div className="p-5 border-b border-white/[0.08] bg-black/40 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/[0.08]">
            {car.images?.[0] ? (
              <img src={car.images[0]} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Fără foto</div>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{car.brand} {car.model}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {car.year}
              </span>
            </h3>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              VIN: <span className="text-amber-400">{car.vin || 'Nesetat'}</span>
            </div>
            
            {/* Telemetrie Holding Cost & Defecte */}
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2.5 flex-wrap">
              <span>Total Service: <strong className="text-amber-400 font-mono">{totalSpent} €</strong></span>
              <span>•</span>
              <span>{defects.filter(d => !d.resolved).length} defecte deschise</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                holdingMetrics.isOverdue 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                  : 'bg-zinc-800 text-zinc-300'
              }`}>
                <Clock className="w-3 h-3" />
                {holdingMetrics.daysInPrep} zile în lucru
                {holdingMetrics.costEur > 0 && ` (~${holdingMetrics.costEur} € holding)`}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
          title="Închide fișa"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Selector Stadiu Curent cu Salvare în Audit Log */}
      <div className="px-5 py-3 bg-zinc-900/60 border-b border-white/[0.05] flex items-center justify-between">
        <span className="text-xs text-zinc-400">Stadiu Recondiționare:</span>
        <select
          value={car.reconStatus || 'ready_for_sale'}
          onChange={(e) => handleStatusChange(e.target.value as VehicleReconStatus)}
          className="bg-black/60 border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500/50"
        >
          {RECON_COLUMNS.map(col => (
            <option key={col.id} value={col.id}>
              {col.icon} {col.title}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Tab-uri Navigare */}
      <div className="flex border-b border-white/[0.06] bg-black/20 px-5 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('defects')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'defects'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Defecțiuni & To-Do ({defects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'receipts'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Bonuri & Facturi ({allReceipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'documents'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Seif CIV / Acte ({techDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'expenses'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Costuri ({totalSpent} €)</span>
        </button>
      </div>

      {/* 4. Conținut Tab Activ */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {/* ── TAB 1: DEFECȚIUNI & TASK-URI MECANIC ── */}
        {activeTab === 'defects' && (
          <div className="space-y-4">
            {/* Formular Adăugare Rapidă cu 21% TVA */}
            <form onSubmit={handleAddDefect} className="bg-black/30 border border-white/[0.08] rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-white block">Adaugă Sarcină / Defect Recondiționare</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defectTitle}
                  onChange={(e) => setDefectTitle(e.target.value)}
                  placeholder="ex: Schimb plăcuțe frână, Diagnoză martor bord, Polish faruri..."
                  className="flex-1 bg-black/60 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
                <select
                  value={defectSeverity}
                  onChange={(e) => setDefectSeverity(e.target.value as any)}
                  className="bg-black/60 border border-white/[0.08] rounded-lg px-2 text-xs text-zinc-300"
                >
                  <option value="low">Minor</option>
                  <option value="medium">Normal</option>
                  <option value="critical">Critic / Urgent</option>
                </select>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Cost estimat:</span>
                  <input
                    type="number"
                    value={defectCostStr}
                    onChange={(e) => setDefectCostStr(e.target.value)}
                    placeholder="€"
                    className="w-20 bg-black/60 border border-white/[0.08] rounded px-2 py-1 text-xs text-amber-400 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500">(21% TVA deductibil inclus)</span>
                </div>

                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adaugă Task
                </button>
              </div>
            </form>

            {/* Listă Defecte cu Bife */}
            <div className="space-y-2">
              {defects.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-white/[0.06] rounded-xl">
                  Nu este înregistrată nicio defecțiune. Mașina este conformă tehnic.
                </div>
              ) : (
                defects.map(d => (
                  <div
                    key={d.id}
                    onClick={() => handleToggleDefect(d.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      d.resolved 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-400 line-through' 
                        : 'bg-[#18181c] border-white/[0.08] text-white hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        d.resolved ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-600'
                      }`}>
                        {d.resolved && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-medium">{d.title}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Prioritate: {d.severity.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-500">
                      {d.resolved ? 'Rezolvat ✅' : 'De făcut ⏳'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: BONURI & FACTURI CHELTUIELI ── */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-white/[0.1] hover:border-amber-500/50 rounded-2xl p-5 text-center bg-black/20 transition-all">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleUploadReceipt}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <span className="p-3 rounded-full bg-amber-500/10 text-amber-400">
                  <Upload className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Încarcă Bon Fiscal sau Factură Piesă</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 max-w-sm">
                    Imaginea se comprimă automat cu 90-95% păstrând textul 100% clar și se sincronizează în Google Drive Vault.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isOptimizing}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isOptimizing ? 'Se optimizează & comprimă...' : 'Selectează Poza / Documentul'}
                </button>
              </div>
            </div>

            {/* Listă Bonuri Încărcate */}
            <div className="grid grid-cols-2 gap-3">
              {allReceipts.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-zinc-500 text-xs">
                  Niciun bon încărcat încă pentru acest vehicul.
                </div>
              ) : (
                allReceipts.map(r => (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (r.dataUrl) {
                        onOpenDocumentPreview({
                          url: r.dataUrl,
                          title: r.name,
                          type: r.type === 'receipt' ? 'Bon Fiscal' : 'Factură',
                          sizeKb: r.fileSizeKb,
                          compressionRatio: r.compressionRatio
                        });
                      }
                    }}
                    className="bg-[#18181c] border border-white/[0.08] hover:border-amber-500/40 rounded-xl p-3 cursor-pointer group transition-all"
                  >
                    <div className="h-28 bg-black/60 rounded-lg overflow-hidden mb-2 relative">
                      {r.dataUrl ? (
                        <img src={r.dataUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">PDF / Fără preview</div>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-mono">
                        -{r.compressionRatio || 93}%
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white truncate group-hover:text-amber-400">
                      {r.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center justify-between mt-1">
                      <span>{r.fileSizeKb} KB</span>
                      <span className="text-amber-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Zoom
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: SEIF CIV & ACTE FLOTĂ ── */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => docInputRef.current?.click()}
                className="p-3 rounded-xl bg-[#18181c] border border-white/[0.08] hover:border-cyan-500/40 text-left transition-all"
              >
                <input
                  ref={docInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleUploadTechnicalDoc(e, 'civ')}
                  className="hidden"
                />
                <span className="text-xs font-bold text-cyan-400 block">+ Încarcă Carte CIV</span>
                <span className="text-[10px] text-zinc-500">Scanare față-verso rezoluție 100%</span>
              </button>

              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*,application/pdf';
                  input.onchange = (e: any) => handleUploadTechnicalDoc(e, 'talon');
                  input.click();
                }}
                className="p-3 rounded-xl bg-[#18181c] border border-white/[0.08] hover:border-cyan-500/40 text-left transition-all"
              >
                <span className="text-xs font-bold text-cyan-400 block">+ Încarcă Talon (Brief)</span>
                <span className="text-[10px] text-zinc-500">Certificat înmatriculare străin / RO</span>
              </button>
            </div>

            {/* Listă Acte Salvate */}
            <div className="space-y-2">
              {techDocs.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-white/[0.06] rounded-xl">
                  Nu este salvat niciun document tehnic în seif.
                </div>
              ) : (
                techDocs.map(d => (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (d.dataUrl) {
                        onOpenDocumentPreview({
                          url: d.dataUrl,
                          title: d.title,
                          type: d.type === 'civ' ? 'CIV' : d.type === 'talon' ? 'Talon' : 'Document',
                          sizeKb: d.fileSizeKb,
                          compressionRatio: d.compressionRatio
                        });
                      }
                    }}
                    className="p-3 rounded-xl bg-[#18181c] border border-white/[0.08] hover:border-cyan-500/40 flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300">{d.title}</div>
                        <div className="text-[10px] text-zinc-500">
                          {d.fileSizeKb} KB • Sincronizat Google Drive PRO
                        </div>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 text-xs font-medium flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Deschide
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: CHELTUIELI SERVICE INTEGRATE ── */}
        {activeTab === 'expenses' && (
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-center justify-between">
              <span>Total cheltuieli înregistrate pe mașină:</span>
              <strong className="text-sm font-mono">{totalSpent.toLocaleString('ro-RO')} €</strong>
            </div>

            <div className="space-y-2">
              {(car.expenses || []).map(exp => (
                <div key={exp.id} className="p-3 rounded-xl bg-[#18181c] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{exp.title}</div>
                    <div className="text-[10px] text-zinc-500">{exp.category} • {exp.date}</div>
                  </div>
                  <div className="font-mono font-bold text-amber-400">
                    {exp.amountEur} €
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
