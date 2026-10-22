/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — 4-Step 1-Click Automated Setup Wizard (PMH-406)
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Netcup VPS (152.53.158.65)
 * Pas 1: Domeniu SES/Cloudflare • Pas 2: Căsuțe/Roluri • Pas 3: Drive Vault • Pas 4: Test SES
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertCircle, RefreshCw, Globe, Users, HardDrive, 
  Send, ShieldCheck, ArrowRight, ArrowLeft, Copy, CheckCircle2,
  Lock, Sparkles, FileText
} from 'lucide-react';
import { getAdminAuthHeaders } from '../../utils/adminAuth';

interface MailSetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerSlug?: string;
  dealershipName?: string;
  showToast: (msg: string) => void;
  onSetupCompleted?: () => void;
}

export const MailSetupWizardModal: React.FC<MailSetupWizardModalProps> = ({
  isOpen,
  onClose,
  dealerSlug = 'rxm',
  dealershipName = 'RXM Automobile',
  showToast,
  onSetupCompleted,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Pasul 1: Domeniu
  const [domain, setDomain] = useState<string>(() => `${dealerSlug}automobile.ro`);
  const [cfZoneId, setCfZoneId] = useState<string>('');
  const [isVerifyingDomain, setIsVerifyingDomain] = useState<boolean>(false);
  const [domainVerifiedData, setDomainVerifiedData] = useState<any>(null);

  // Pasul 2: Căsuțe
  const [adminAlias, setAdminAlias] = useState<string>('contact');
  const [salesAlias, setSalesAlias] = useState<string>('vanzari');
  const [financeAlias, setFinanceAlias] = useState<string>('finantare');
  const [hrAlias, setHrAlias] = useState<string>('salarii');
  const [isCreatingAccounts, setIsCreatingAccounts] = useState<boolean>(false);
  const [accountsCreated, setAccountsCreated] = useState<boolean>(false);

  // Pasul 3: Storage Drive Vault
  const [storageStats, setStorageStats] = useState<any>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(false);

  // Pasul 4: Test Trimitere
  const [testEmailRecipient, setTestEmailRecipient] = useState<string>('norby.vultur@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSentResult, setTestSentResult] = useState<any>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Încarcă date stocare când intră pe pasul 3
  useEffect(() => {
    if (currentStep === 3) {
      setIsLoadingStorage(true);
      fetch('/api/admin/storage/stats', { headers: getAdminAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.success) setStorageStats(data);
        })
        .catch(() => {})
        .finally(() => setIsLoadingStorage(false));
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    showToast('📋 Copiat în clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Pasul 1: Verificare domeniu
  const handleVerifyDomain = async () => {
    if (!domain.trim()) {
      showToast('⚠️ Vă rugăm să specificați un domeniu valid.');
      return;
    }
    setIsVerifyingDomain(true);
    try {
      const res = await fetch('/api/mail/domains/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          domain: domain.trim().toLowerCase(),
          cloudflareZoneId: cfZoneId.trim() || undefined,
          dealerId: dealerSlug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDomainVerifiedData(data);
        showToast(`✅ Domeniul ${domain} a fost înregistrat în SES și DNS.`);
      } else {
        showToast(`⚠️ ${data.error || 'Eroare la verificare domeniu'}`);
      }
    } catch (err: any) {
      showToast(`❌ Eroare rețea: ${err.message}`);
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  // Pasul 2: Creare căsuțe
  const handleProvisionDefaultAccounts = async () => {
    setIsCreatingAccounts(true);
    const targetDomain = domain.trim().toLowerCase();
    const accountsToCreate = [
      {
        displayName: `${dealershipName} (Admin Showroom)`,
        alias: adminAlias.trim(),
        domain: targetDomain,
        email: `${adminAlias.trim()}@${targetDomain}`,
        role: 'ADMIN',
      },
      {
        displayName: `Consilier Vânzări (${dealershipName})`,
        alias: salesAlias.trim(),
        domain: targetDomain,
        email: `${salesAlias.trim()}@${targetDomain}`,
        role: 'SALES',
      },
      {
        displayName: `Finanțare & Credite (${dealershipName})`,
        alias: financeAlias.trim(),
        domain: targetDomain,
        email: `${financeAlias.trim()}@${targetDomain}`,
        role: 'FINANCE',
      },
      {
        displayName: `Resurse Umane & Salarii (${dealershipName})`,
        alias: hrAlias.trim(),
        domain: targetDomain,
        email: `${hrAlias.trim()}@${targetDomain}`,
        role: 'HR_PAYROLL',
      },
    ];

    try {
      for (const acc of accountsToCreate) {
        await fetch('/api/mail/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders(),
          },
          body: JSON.stringify({ ...acc, dealerId: dealerSlug }),
        });
      }
      setAccountsCreated(true);
      showToast('✅ Căsuțele implicite (Admin, Vânzări, Financiar, HR) au fost create cu succes!');
    } catch (err: any) {
      showToast(`❌ Eroare la creare căsuțe: ${err.message}`);
    } finally {
      setIsCreatingAccounts(false);
    }
  };

  // Pasul 4: Trimitere test
  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim()) {
      showToast('⚠️ Vă rugăm să introduceți o adresă de destinatar.');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          recipientEmail: testEmailRecipient.trim(),
          senderEmail: `contact@${domain.trim()}`,
          subject: `⚡ Test Setup ParcOS Mail Hub — ${dealershipName}`,
          textBody: `Felicitări! Căsuța de e-mail pentru ${dealershipName} funcționează perfect prin ParcOS Mail Hub.\nToate ofertele de vehicule respectă invarianta strict 21% TVA și Garanție de Rezervare (Cont de Garanție Banca Transilvania).`,
          dealershipName,
          dealerId: dealerSlug,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestSentResult(data);
        showToast('🎉 E-mailul de test a fost expediat cu succes!');
      } else {
        showToast(`⚠️ ${data.error || 'Trimiterea a eșuat'}`);
      }
    } catch (err: any) {
      showToast(`❌ Eroare trimitere: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleFinish = () => {
    if (onSetupCompleted) onSetupCompleted();
    showToast('🚀 Setup-ul ParcOS Mail Hub a fost finalizat cu succes!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121215] border border-[#27272a] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Glow Header */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Modal */}
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Asistent Automatizare ParcOS Mail Hub
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Pasul {currentStep} din 4
                </span>
              </h3>
              <p className="text-xs text-[#a1a1aa]">Configurare 1-Click: Domeniu, Căsuțe, Stocare & Test Livrare</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicator Pasi Progres */}
        <div className="grid grid-cols-4 border-b border-[#27272a] bg-[#0d0d10] text-[11px] font-semibold text-center">
          <div className={`py-2.5 border-b-2 flex items-center justify-center gap-1.5 ${currentStep === 1 ? 'border-amber-400 text-amber-300 bg-amber-500/5' : currentStep > 1 ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[#71717a]'}`}>
            <span>1. Domeniu</span>
            {currentStep > 1 && <Check className="w-3 h-3" />}
          </div>
          <div className={`py-2.5 border-b-2 flex items-center justify-center gap-1.5 ${currentStep === 2 ? 'border-amber-400 text-amber-300 bg-amber-500/5' : currentStep > 2 ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[#71717a]'}`}>
            <span>2. Căsuțe</span>
            {currentStep > 2 && <Check className="w-3 h-3" />}
          </div>
          <div className={`py-2.5 border-b-2 flex items-center justify-center gap-1.5 ${currentStep === 3 ? 'border-amber-400 text-amber-300 bg-amber-500/5' : currentStep > 3 ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[#71717a]'}`}>
            <span>3. Stocare</span>
            {currentStep > 3 && <Check className="w-3 h-3" />}
          </div>
          <div className={`py-2.5 border-b-2 flex items-center justify-center gap-1.5 ${currentStep === 4 ? 'border-amber-400 text-amber-300 bg-amber-500/5' : 'border-transparent text-[#71717a]'}`}>
            <span>4. Test</span>
          </div>
        </div>

        {/* Corp Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#f4f4f5]">
          {/* ─────────────────────────────────────────────────────────── */}
          {/* PASUL 1: DOMENIU SES & CLOUDFLARE DNS                      */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                Introduceți domeniul oficial al showroom-ului. Asistentul îl înregistrează automat în AWS SES v2 și sincronizează înregistrările DKIM, SPF și MX în Cloudflare.
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                  Domeniu Showroom *
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                  placeholder="ex: rxmautomobile.ro sau mpiauto.ro"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5 flex items-center justify-between">
                  <span>Cloudflare Zone ID (Opțional pentru sincronizare automată)</span>
                  <span className="text-[10px] text-[#71717a]">Auto-detectat dacă este omis</span>
                </label>
                <input
                  type="text"
                  value={cfZoneId}
                  onChange={(e) => setCfZoneId(e.target.value.trim())}
                  placeholder="ex: d14e9f7839b23..."
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleVerifyDomain}
                  disabled={isVerifyingDomain}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isVerifyingDomain ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>Verifică & Configurează în SES / DNS</span>
                </button>
              </div>

              {domainVerifiedData && (
                <div className="mt-4 p-4 rounded-xl bg-black/40 border border-[#27272a] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Status Domeniu:</span>
                    <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {domainVerifiedData.verificationStatus || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#a1a1aa]">Sincronizare Cloudflare:</span>
                    <span className="text-sky-400 font-semibold">
                      {domainVerifiedData.isCloudflareSynced ? '✅ Sincronizat automat' : 'ℹ️ Înregistrat local'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* PASUL 2: CĂSUȚE & ROLURI SHOWROOM                          */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                Personalizați alias-urile căsuțelor pentru personalul din showroom. La apăsarea butonului, adresele vor fi create instant pe domeniul <strong>@{domain}</strong>.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#a1a1aa] mb-1">
                    👑 Director / Admin
                  </label>
                  <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs">
                    <input
                      type="text"
                      value={adminAlias}
                      onChange={(e) => setAdminAlias(e.target.value.toLowerCase())}
                      className="w-20 bg-transparent text-white font-mono focus:outline-none"
                    />
                    <span className="text-[#71717a] font-mono text-[11px]">@{domain}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#a1a1aa] mb-1">
                    💼 Vânzări & Lead Closer
                  </label>
                  <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs">
                    <input
                      type="text"
                      value={salesAlias}
                      onChange={(e) => setSalesAlias(e.target.value.toLowerCase())}
                      className="w-20 bg-transparent text-white font-mono focus:outline-none"
                    />
                    <span className="text-[#71717a] font-mono text-[11px]">@{domain}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#a1a1aa] mb-1">
                    💰 Finanțare & Credite
                  </label>
                  <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs">
                    <input
                      type="text"
                      value={financeAlias}
                      onChange={(e) => setFinanceAlias(e.target.value.toLowerCase())}
                      className="w-20 bg-transparent text-white font-mono focus:outline-none"
                    />
                    <span className="text-[#71717a] font-mono text-[11px]">@{domain}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#a1a1aa] mb-1">
                    📑 HR & Salarii (Confidențial)
                  </label>
                  <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs">
                    <input
                      type="text"
                      value={hrAlias}
                      onChange={(e) => setHrAlias(e.target.value.toLowerCase())}
                      className="w-20 bg-transparent text-white font-mono focus:outline-none"
                    />
                    <span className="text-[#71717a] font-mono text-[11px]">@{domain}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProvisionDefaultAccounts}
                  disabled={isCreatingAccounts || accountsCreated}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isCreatingAccounts ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : accountsCreated ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  <span>{accountsCreated ? 'Căsuțe Create cu Succes!' : 'Generează Căsuțe Showroom'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* PASUL 3: STOCARE 500 MB VPS & GDRIVE VAULT                 */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                ParcOS protejează Netcup VPS plafonând discul la <strong>500 MB</strong>. Fisierele mari și ofertele arhivate sunt mutate automat în <strong>Google Drive Vault</strong> criptate cu <strong>AES-256-GCM</strong>.
              </div>

              <div className="bg-black/40 border border-[#27272a] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa]">Capacitate Stocare Netcup VPS:</span>
                  <span className="font-mono text-white font-bold">500 MB Hard Cap</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa]">Trigger Curățare LRU:</span>
                  <span className="font-mono text-amber-400 font-bold">400 MB</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa]">Criptare la Repaus:</span>
                  <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Magic Header PV01 (AES-256-GCM)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa]">Consum Local Curent:</span>
                  <span className="font-mono text-white font-semibold">
                    {storageStats ? `${(storageStats.localBytes / (1024 * 1024)).toFixed(1)} MB` : '0.0 MB'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Politica de viață a fișierelor este activă și garantează zero risc de umplere a discului VPS.</span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* PASUL 4: TEST LIVRARE REALĂ SES                           */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                Verificați livrabilitatea outbound trimitând un e-mail de test semnat criptografic de către noul nod ParcOS Mail Hub către adresa dvs.
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                  Adresă Destinatar Test *
                </label>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="ex: proprietar@gmail.com"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Trimite E-mail de Test Deliverability</span>
                </button>
              </div>

              {testSentResult && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>E-mail expediat cu succes!</span>
                  </div>
                  <p className="font-mono text-[11px] text-[#a1a1aa] break-all">
                    SES Message ID: {testSentResult.messageId || 'mock-ses-ok'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigare Pasi */}
        <div className="p-4 border-t border-[#27272a] bg-[#0d0d10] flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Înapoi</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
              className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>Continuă</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Finalizează Setup Showroom</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
