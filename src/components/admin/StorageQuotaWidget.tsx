/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Storage Quota & Google Drive Vault Widget (PMH-404)
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Netcup VPS (152.53.158.65)
 * Hard Cap: <= 500 MB VPS • Eviction: 400 MB LRU • AES-256-GCM Vault
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HardDrive, Cloud, ShieldCheck, RefreshCw, AlertTriangle, ArrowUpRight, Database } from 'lucide-react';
import { getAdminAuthHeaders } from '../../utils/adminAuth';

interface StorageStats {
  localBytes: number;
  quotaBytes: number;
  thresholdBytes: number;
  vaultBytes: number;
  fileCount: number;
  isWithinQuota: boolean;
}

interface StorageQuotaWidgetProps {
  showToast?: (msg: string) => void;
}

export const StorageQuotaWidget: React.FC<StorageQuotaWidgetProps> = ({ showToast }) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/storage/stats', {
        headers: getAdminAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      }
    } catch (err) {
      console.warn('[StorageWidget] Eroare citire statistici stocare:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleEnforceQuota = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch('/api/admin/storage/enforce-quota', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) {
          showToast(`🧹 Curățare LRU finalizată: ${data.evicted} fișiere arhivate în Google Drive Vault.`);
        }
        await fetchStats();
      } else {
        if (showToast) showToast(`⚠️ ${data.error || 'Operațiune eșuată'}`);
      }
    } catch (err: any) {
      if (showToast) showToast(`❌ Eroare la curățare: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const localMb = stats ? (stats.localBytes / (1024 * 1024)).toFixed(1) : '0.0';
  const quotaMb = stats ? Math.round(stats.quotaBytes / (1024 * 1024)) : 500;
  const vaultGb = stats ? (stats.vaultBytes / (1024 * 1024 * 1024)).toFixed(2) : '0.00';
  const percentage = stats ? Math.min(100, Math.round((stats.localBytes / stats.quotaBytes) * 100)) : 0;

  const isWarning = percentage >= 80;
  const isDanger = percentage >= 95;

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
      {/* Glow discret fundal */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Stocare ParcOS VPS
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CAP 500 MB
              </span>
            </h4>
            <p className="text-xs text-[#a1a1aa]">Stocare Cloud VPS Securizată • Arhivare Google Drive Vault</p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
          title="Reîmprospătează statisticile"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Indicator Progres Stocare VPS */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#f4f4f5]">
            {localMb} MB <span className="text-[#71717a]">/ {quotaMb} MB</span>
          </span>
          <span className={`font-mono text-xs font-bold ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
            {percentage}% utilizat
          </span>
        </div>

        <div className="w-full bg-[#18181b] rounded-full h-2.5 overflow-hidden border border-[#27272a]">
          <div
            className={`h-full transition-all duration-500 ${
              isDanger
                ? 'bg-rose-500'
                : isWarning
                ? 'bg-gradient-to-r from-amber-500 to-rose-400'
                : 'bg-gradient-to-r from-amber-500 to-amber-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Grid Detalii Vault & Fișiere */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 flex items-center gap-2.5">
          <Cloud className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <div className="truncate">
            <p className="text-[10px] text-[#71717a] uppercase font-semibold">Google Drive Vault</p>
            <p className="text-xs font-bold text-white font-mono">{vaultGb} GB <span className="text-[10px] text-sky-400">AES-256</span></p>
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 flex items-center gap-2.5">
          <Database className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="truncate">
            <p className="text-[10px] text-[#71717a] uppercase font-semibold">Fișiere Locale</p>
            <p className="text-xs font-bold text-white font-mono">{stats?.fileCount || 0} atașamente</p>
          </div>
        </div>
      </div>

      {/* Footer Acțiuni & Securitate */}
      <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
        <div className="flex items-center gap-1.5 text-[11px] text-[#71717a]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Magic Header PV01 • Criptat la repaus</span>
        </div>

        <button
          onClick={handleEnforceQuota}
          disabled={isCleaning}
          className="text-xs bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-amber-400 hover:text-amber-300 font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
        >
          {isCleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Curăță Cache (LRU)</span>
        </button>
      </div>
    </div>
  );
};
