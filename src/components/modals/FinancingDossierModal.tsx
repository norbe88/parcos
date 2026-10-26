import React, { useState, useEffect } from 'react';
import { 
  X, CreditCard, DollarSign, Calendar, FileText, CheckCircle2, 
  AlertCircle, Shield, Building2, User, Phone, Mail, Clock, 
  Printer, Save, CheckSquare, Square, Percent, Sparkles, MessageCircle
} from 'lucide-react';
import { FinancingDossierItem, FinancingDossierStatus, CreditorPartnerId, VehicleItem } from '../../db/types';
import { calculateMonthlyRate, calculateDealerCommission } from '../../services/financingService';
import { convertEurToRon, formatPriceRon, getBtExchangeRate } from '../../utils/currencyEngine';

interface FinancingDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: FinancingDossierItem | null;
  onSave: (updated: FinancingDossierItem) => void;
  cars: VehicleItem[];
  showToast: (msg: string) => void;
}

const CREDITOR_OPTIONS: { id: CreditorPartnerId; name: string; ratePct: number; desc: string }[] = [
  { id: 'tbi', name: 'TBI Bank', ratePct: 7.9, desc: 'Aprobare 100% online (15-30 min)' },
  { id: 'bt', name: 'Banca Transilvania', ratePct: 8.5, desc: 'BT Direct • Dobândă fixă' },
  { id: 'unicredit', name: 'UniCredit Consumer', ratePct: 8.9, desc: 'Finanțare sume mari / premium' },
  { id: 'creditfix', name: 'CreditFix', ratePct: 11.5, desc: 'Aprobare rapidă nebancară' },
  { id: 'mogo', name: 'Mogo IFN', ratePct: 14.0, desc: 'Soluție istoric negativ Biroul de Credit' },
];

const STATUS_LABELS: Record<FinancingDossierStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Ciornă / Date Inițiale', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  docs_pending: { label: 'Așteptare Acte / Acord ANAF', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  submitted: { label: 'Trimis la Creditor', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  under_review: { label: 'În Analiză Bancară', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  conditional: { label: 'Aprobat Condiționat', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  approved: { label: 'Aprobat Definitiv', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  contract_signed: { label: 'Contract Credit Semnat', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  funded: { label: 'Decontat / Banii Virați', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
  delivered: { label: 'Vehicul Livrat', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  rejected: { label: 'Respins de Bancă', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  canceled: { label: 'Client Renunțat', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
};

export const FinancingDossierModal: React.FC<FinancingDossierModalProps> = ({
  isOpen,
  onClose,
  dossier,
  onSave,
  cars,
  showToast
}) => {
  if (!isOpen || !dossier) return null;

  // Stări formular dosar
  const [clientName, setClientName] = useState(dossier.clientName);
  const [clientPhone, setClientPhone] = useState(dossier.clientPhone);
  const [clientEmail, setClientEmail] = useState(dossier.clientEmail || '');
  const [clientCnp, setClientCnp] = useState(dossier.clientCnp || '');
  const [employmentType, setEmploymentType] = useState(dossier.clientEmploymentType || 'salariat_ro');
  const [monthlyNetIncome, setMonthlyNetIncome] = useState<number>(dossier.monthlyNetIncomeRon || 0);

  // Stări financiare
  const [selectedCreditor, setSelectedCreditor] = useState<CreditorPartnerId>(dossier.creditor || 'tbi');
  const [downPaymentEur, setDownPaymentEur] = useState<number>(dossier.downPaymentEur || 0);
  const [tenureMonths, setTenureMonths] = useState<number>(dossier.tenureMonths || 60);
  const [status, setStatus] = useState<FinancingDossierStatus>(dossier.status);
  const [conditionNotes, setConditionNotes] = useState(dossier.conditionNotes || '');
  const [rejectionReason, setRejectionReason] = useState(dossier.rejectionReason || '');
  const [internalNotes, setInternalNotes] = useState(dossier.internalNotes || '');
  const [commissionPct, setCommissionPct] = useState<number>(dossier.brokerCommissionPct || 2.0);

  // Checklist documente
  const [documents, setDocuments] = useState({
    idCardUploaded: dossier.documents?.idCardUploaded || false,
    anafConsentSigned: dossier.documents?.anafConsentSigned || false,
    incomeProofUploaded: dossier.documents?.incomeProofUploaded || false,
    bankContractUploaded: dossier.documents?.bankContractUploaded || false,
  });

  // Recalculare dinamică la orice modificare
  const creditorMeta = CREDITOR_OPTIONS.find(c => c.id === selectedCreditor) || CREDITOR_OPTIONS[0];
  const interestRatePct = creditorMeta.ratePct;

  const carPriceRon = dossier.carPriceRon || convertEurToRon(dossier.carPriceEur);
  const downPaymentRon = convertEurToRon(downPaymentEur);
  const downPaymentPct = dossier.carPriceEur > 0 ? Math.round((downPaymentEur / dossier.carPriceEur) * 100) : 0;
  const financedAmountRon = Math.max(0, carPriceRon - downPaymentRon);
  const monthlyInstallmentRon = calculateMonthlyRate(financedAmountRon, tenureMonths, interestRatePct);
  const calculatedCommissionRon = calculateDealerCommission(financedAmountRon, commissionPct);

  const toggleDoc = (key: keyof typeof documents) => {
    setDocuments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      showToast('Te rugăm să completezi numele și telefonul clientului.');
      return;
    }

    const updated: FinancingDossierItem = {
      ...dossier,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientCnp: clientCnp.trim() || undefined,
      clientEmploymentType: employmentType,
      monthlyNetIncomeRon: monthlyNetIncome > 0 ? monthlyNetIncome : undefined,
      creditor: selectedCreditor,
      downPaymentEur,
      downPaymentRon,
      downPaymentPct,
      financedAmountRon,
      tenureMonths,
      interestRatePct,
      monthlyInstallmentRon,
      status,
      conditionNotes: status === 'conditional' ? conditionNotes : undefined,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      documents,
      brokerCommissionPct: commissionPct,
      brokerCommissionRon: calculatedCommissionRon,
      internalNotes,
      updatedAt: new Date().toISOString()
    };

    onSave(updated);
  };

  const completedDocsCount = Object.values(documents).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#121215] border border-white/10 shadow-2xl text-white overflow-hidden">
        
        {/* Antet Modal */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">{clientName || 'Dosar Finanțare'}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_LABELS[status].bg} ${STATUS_LABELS[status].color} border-current/20`}>
                  {STATUS_LABELS[status].label}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Vehicul: <span className="text-amber-300 font-semibold">{dossier.carTitle}</span> • {dossier.carPriceEur.toLocaleString('ro-RO')} € ({formatPriceRon(dossier.carPriceEur)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
              title="Tipărește fișa dosarului"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corp Scrollabil */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. Simulator Financiar Activ */}
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Simulator Rate & Condiții Finanțare
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Curs BT: 1 EUR = {getBtExchangeRate().toFixed(4)} LEI
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Partener Creditor */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                  Instituție Finanțatoare
                </label>
                <select
                  value={selectedCreditor}
                  onChange={(e) => setSelectedCreditor(e.target.value as CreditorPartnerId)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {CREDITOR_OPTIONS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ratePct}% dobândă)
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {creditorMeta.desc}
                </span>
              </div>

              {/* Avans Solicitat */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300 mb-1.5">
                  <span>Avans: {downPaymentEur.toLocaleString('ro-RO')} € ({downPaymentPct}%)</span>
                  <span className="text-zinc-500">{downPaymentRon.toLocaleString('ro-RO')} RON</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.round(dossier.carPriceEur * 0.5)}
                  step="250"
                  value={downPaymentEur}
                  onChange={(e) => setDownPaymentEur(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 mt-1 font-mono">
                  <span>Fără avans (0%)</span>
                  <span>Max 50%</span>
                </div>
              </div>

              {/* Perioadă Rambursare */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                  Perioadă Creditare
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[12, 24, 36, 48, 60].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTenureMonths(m)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        tenureMonths === m 
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                          : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {m}l
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {tenureMonths / 12} {tenureMonths / 12 === 1 ? 'an' : 'ani'} rambursare
                </span>
              </div>
            </div>

            {/* Rezumat Cifre Cheie */}
            <div className="pt-3 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-zinc-400 block uppercase">Sumă Finanțată</span>
                <span className="text-sm font-black text-white font-mono">{financedAmountRon.toLocaleString('ro-RO')} RON</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-zinc-400 block uppercase">Rată Lunară Estimată</span>
                <span className="text-base font-black text-amber-400 font-mono">{monthlyInstallmentRon.toLocaleString('ro-RO')} RON/lună</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-zinc-400 block uppercase">Dobândă Anuală</span>
                <span className="text-sm font-black text-white font-mono">{interestRatePct}% fixă</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-emerald-400 block uppercase">Comision Dealer ({commissionPct}%)</span>
                <span className="text-sm font-black text-emerald-400 font-mono">+{calculatedCommissionRon.toLocaleString('ro-RO')} RON</span>
              </div>
            </div>
          </div>

          {/* 2. Date Solicitant & Status Dosar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Informații Client */}
            <div className="space-y-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Date Solicitant & Venituri
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Nume & Prenume Client *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Telefon *</label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Email</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@exemplu.ro"
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Tip Venit / Ocupație</label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value as any)}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="salariat_ro">Salariat România (min 3 luni)</option>
                      <option value="salariat_diaspora">Contract Muncă Diaspora</option>
                      <option value="pensionar">Pensionar</option>
                      <option value="pfa_srl">PFA / Administrator SRL</option>
                      <option value="co_platitor">Cu Co-plătitor (Girant)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Venit Net Lunar (RON)</label>
                    <input
                      type="number"
                      value={monthlyNetIncome || ''}
                      onChange={(e) => setMonthlyNetIncome(Number(e.target.value))}
                      placeholder="ex: 4500"
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Documente KYC & Status */}
            <div className="space-y-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  Checklist Documente KYC ({completedDocsCount}/4)
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${completedDocsCount === 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {completedDocsCount === 4 ? 'Dosar Complet' : 'Documente În Așteptare'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { key: 'idCardUploaded', label: 'Carte de Identitate (Buletin)', desc: 'Scanată / pozată clar față-verso' },
                  { key: 'anafConsentSigned', label: 'Acord Interogare ANAF & Biroul de Credit', desc: 'Semnat electronic prin SMS / OTP de client' },
                  { key: 'incomeProofUploaded', label: 'Adeverință / Extrase Cont (Dacă e cazul)', desc: 'Necesar pentru venituri externe / diaspora' },
                  { key: 'bankContractUploaded', label: 'Contract Credit Oficial Semnat', desc: 'Emis de bancă după aprobarea finală' },
                ].map((doc) => {
                  const isChecked = documents[doc.key as keyof typeof documents];
                  return (
                    <button
                      key={doc.key}
                      type="button"
                      onClick={() => toggleDoc(doc.key as keyof typeof documents)}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-white/[0.01] border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className={`font-semibold ${isChecked ? 'text-white' : 'text-zinc-300'}`}>{doc.label}</div>
                        <div className="text-[10px] text-zinc-500">{doc.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Stare Bancară Curentă */}
              <div className="pt-3 border-t border-white/10">
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Stare Dosar (Workflow Bancar)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FinancingDossierStatus)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                >
                  {Object.entries(STATUS_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>

                {/* Notă suplimentară pentru dosar condiționat */}
                {status === 'conditional' && (
                  <div className="mt-2">
                    <label className="text-[10px] text-yellow-400 block mb-1">Condiții cerute de bancă (ex: avans, garant)</label>
                    <input
                      type="text"
                      value={conditionNotes}
                      onChange={(e) => setConditionNotes(e.target.value)}
                      placeholder="ex: Banca cere avans suplimentar de 15%"
                      className="w-full bg-[#18181b] border border-yellow-500/30 rounded-xl px-3 py-1.5 text-xs text-yellow-200 focus:outline-none"
                    />
                  </div>
                )}

                {/* Motiv respingere */}
                {status === 'rejected' && (
                  <div className="mt-2">
                    <label className="text-[10px] text-rose-400 block mb-1">Motiv Respingere Bancă</label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-[#18181b] border border-rose-500/30 rounded-xl px-3 py-1.5 text-xs text-rose-200 focus:outline-none"
                    >
                      <option value="">Selectează motiv...</option>
                      <option value="Grad de îndatorare depășit (>40%)">Grad de îndatorare depășit (&gt;40%)</option>
                      <option value="Istoric negativ Biroul de Credit">Istoric negativ Biroul de Credit</option>
                      <option value="Venituri declarate insuficiente">Venituri declarate insuficiente</option>
                      <option value="Lipsă vechime minimă angajator">Lipsă vechime minimă angajator</option>
                      <option value="Documente neconforme">Documente neconforme</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Jurnal Notițe & Responsabil */}
          <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
              Jurnal Notițe Interne & Discuții Bancare
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notițe despre convorbirile cu clientul sau analistul băncii..."
              className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Butoane Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <div className="text-[11px] text-zinc-500">
              Responsabil: <span className="text-zinc-300 font-semibold">{dossier.assignedOfficer}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvează Dosar</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
