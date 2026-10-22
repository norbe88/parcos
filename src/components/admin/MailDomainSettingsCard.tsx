/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Showroom Domain & DNS Configuration Card (PMH-202)
 * Holding: CARVANA SRL • Invariante: Dark Luxury Aesthetics • 1-Click DNS Sync
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  CloudLightning,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

export interface DnsChecklistItem {
  type: string;
  name: string;
  host: string;
  value: string;
  description: string;
}

export interface MailDomainRecord {
  id?: string;
  domain: string;
  verificationStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  dkimStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  isCloudflareSynced: boolean;
  dkimTokens?: string[];
  spfRecord?: string;
}

export interface MailDomainSettingsCardProps {
  initialDomain?: string;
  onDomainConfigured?: (domain: string) => void;
}

export const MailDomainSettingsCard: React.FC<MailDomainSettingsCardProps> = ({
  initialDomain = 'rxmautomobile.ro',
  onDomainConfigured,
}) => {
  const [domainInput, setDomainInput] = useState(initialDomain);
  const [activeDomain, setActiveDomain] = useState(initialDomain);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const [isCloudflareSynced, setIsCloudflareSynced] = useState(false);
  const [dnsChecklist, setDnsChecklist] = useState<DnsChecklistItem[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showManualDns, setShowManualDns] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verificare status la montare
  useEffect(() => {
    checkStatus(activeDomain);
  }, [activeDomain]);

  // Polling automat la 30s dacă statusul este PENDING
  useEffect(() => {
    if (status !== 'PENDING') return;
    const interval = setInterval(() => {
      checkStatus(activeDomain, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [status, activeDomain]);

  const checkStatus = async (domainToCheck: string, silent = false) => {
    if (!domainToCheck || !domainToCheck.includes('.')) return;
    if (!silent) setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/mail/domains/${encodeURIComponent(domainToCheck)}/status`);
      const data = await res.json();
      if (data.success || data.verificationStatus) {
        setStatus(data.verificationStatus || (data.isReady ? 'SUCCESS' : 'PENDING'));
      }
    } catch {
      // Ignoră erorile tranzitorii de rețea la polling
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleVerifyAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean || !clean.includes('.')) {
      setErrorMessage('Introduceți un nume de domeniu valid (ex: autocluj.ro)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/mail/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: clean }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verificarea domeniului a eșuat');
      }

      setActiveDomain(clean);
      setStatus(data.verificationStatus || 'PENDING');
      setIsCloudflareSynced(!!data.isCloudflareSynced);
      if (Array.isArray(data.dnsChecklist)) {
        setDnsChecklist(data.dnsChecklist);
        if (!data.isCloudflareSynced) {
          setShowManualDns(true);
        }
      }

      if (onDomainConfigured) {
        onDomainConfigured(clean);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Eroare la configurarea domeniului.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 text-zinc-100 shadow-xl">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#27272a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              Domeniu E-mail Showroom
              <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                AWS SES v2
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Autentificare DKIM RSA 2048-bit & SPF pentru livrare sigură în inbox
            </p>
          </div>
        </div>

        {/* Badge Status */}
        <div className="flex items-center gap-2">
          {status === 'SUCCESS' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Activ & Autentificat
            </span>
          ) : status === 'FAILED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              Eroare Configurare
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              În Așteptare DNS
            </span>
          )}

          <button
            type="button"
            onClick={() => checkStatus(activeDomain)}
            disabled={isLoading}
            title="Reîmprospătează statusul din AWS SES"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Formular Configurare Domeniu */}
      <form onSubmit={handleVerifyAndSync} className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Domeniul oficial al parcului auto
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="ex: autocluj.ro sau rxmautomobile.ro"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CloudLightning className="w-4 h-4" />
              )}
              <span>Verifică & Configurează</span>
            </button>
          </div>
          {errorMessage && (
            <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errorMessage}
            </p>
          )}
        </div>

        {/* Notificare Cloudflare */}
        {isCloudflareSynced && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Înregistrările DNS au fost sincronizate automat în Cloudflare via API.</span>
            </div>
          </div>
        )}
      </form>

      {/* Accordion Configurare Manuală DNS */}
      {dnsChecklist.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#27272a]">
          <button
            type="button"
            onClick={() => setShowManualDns(!showManualDns)}
            className="flex items-center justify-between w-full text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              📋 Instrucțiuni Manuale DNS pentru Registrar ({dnsChecklist.length} înregistrări)
            </span>
            {showManualDns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showManualDns && (
            <div className="mt-3 space-y-2.5">
              <p className="text-[11px] text-zinc-400">
                Dacă domeniul nu este pe Cloudflare, adăugați următoarele înregistrări CNAME și TXT în panoul registrarului dvs. (RoTLD, Romarg, Hostico, Namecheap):
              </p>

              <div className="space-y-2">
                {dnsChecklist.map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-amber-400 font-bold">
                          {rec.type}
                        </span>
                        <span className="text-zinc-200 truncate">{rec.host}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(rec.host, `host-${idx}`)}
                          className="text-zinc-500 hover:text-zinc-300"
                          title="Copiază Host / Name"
                        >
                          {copiedKey === `host-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-zinc-400">
                        <span className="truncate max-w-md">{rec.value}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(rec.value, `val-${idx}`)}
                          className="text-zinc-500 hover:text-zinc-300"
                          title="Copiază Valoare"
                        >
                          {copiedKey === `val-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MailDomainSettingsCard;
