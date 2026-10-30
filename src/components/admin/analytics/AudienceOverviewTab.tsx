import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, Eye, TrendingUp, Sparkles, Globe, Compass,
  Smartphone, Monitor, Tablet, MessageSquare, Phone,
  CheckCircle2, Calculator, QrCode, Search, Share2,
  Camera, Video, RefreshCw, ArrowUpRight, BarChart3,
  ShieldCheck, AlertTriangle, Tag, Car, Info, ChevronRight
} from 'lucide-react';
import {
  fetchSiteTrafficAnalytics,
  SiteTrafficSummary,
  TrafficSummaryResponse
} from '../../../services/telemetryService';
import {
  getSourceDisplay,
  calculateDevicePercentages,
  formatTrafficNumber,
  SOURCE_CONFIGS
} from '../../../utils/telemetryHelpers';

interface AudienceOverviewTabProps {
  dealerSlug?: string;
  activeTimeframe?: string;
  showToast?: (msg: string) => void;
}

export const AudienceOverviewTab: React.FC<AudienceOverviewTabProps> = ({
  dealerSlug = 'rxm',
  activeTimeframe = '30d',
  showToast
}) => {
  const [summary, setSummary] = useState<SiteTrafficSummary>({
    uniqueVisitors: 0,
    totalPageviews: 0,
    totalEvents: 0,
    conversionRate: 0,
    topSource: 'direct',
    sources: [],
    devices: { mobile: 0, desktop: 0, tablet: 0 },
    conversions: { whatsappClicks: 0, phoneClicks: 0, leadsSubmitted: 0, financeCalc: 0 }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [internalTimeframe, setInternalTimeframe] = useState<string>(activeTimeframe);

  // Sincronizare când se schimbă timeframe-ul din containerul părinte
  useEffect(() => {
    setInternalTimeframe(activeTimeframe);
  }, [activeTimeframe]);

  const loadAnalytics = useCallback(async (timeframeToFetch: string) => {
    setIsLoading(true);
    try {
      const res: TrafficSummaryResponse = await fetchSiteTrafficAnalytics(dealerSlug, timeframeToFetch);
      if (res && res.success && res.summary) {
        setSummary(res.summary);
      } else {
        // Păstrează starea golită dar structurată
        setSummary(res?.summary || {
          uniqueVisitors: 0,
          totalPageviews: 0,
          totalEvents: 0,
          conversionRate: 0,
          topSource: 'direct',
          sources: [],
          devices: { mobile: 0, desktop: 0, tablet: 0 },
          conversions: { whatsappClicks: 0, phoneClicks: 0, leadsSubmitted: 0, financeCalc: 0 }
        });
      }
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.warn('[AudienceOverviewTab] Eroare la încărcarea datelor de audiență:', err);
      showToast?.('Atenție: Datele de audiență nu au putut fi sincronizate.');
    } finally {
      setIsLoading(false);
    }
  }, [dealerSlug, showToast]);

  useEffect(() => {
    let cancelled = false;
    void loadAnalytics(internalTimeframe).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [internalTimeframe, loadAnalytics]);

  const handleManualRefresh = () => {
    void loadAnalytics(internalTimeframe).then(() => {
      showToast?.('Audiența și telemetria showroom au fost actualizate din PostgreSQL.');
    });
  };

  // Calcule derivate pentru metrici executive
  const avgPagesPerVisitor = useMemo(() => {
    if (!summary.uniqueVisitors || summary.uniqueVisitors === 0) return '1.0';
    return (summary.totalPageviews / summary.uniqueVisitors).toFixed(1);
  }, [summary.totalPageviews, summary.uniqueVisitors]);

  const topSourceConfig = useMemo(() => {
    return getSourceDisplay(summary.topSource || 'direct');
  }, [summary.topSource]);

  // Calcule dispozitive
  const deviceStats = useMemo(() => {
    return calculateDevicePercentages(summary.devices);
  }, [summary.devices]);

  // Lista ordonată a canalelor de achiziție
  const sortedSources = useMemo(() => {
    if (Array.isArray(summary.sources) && summary.sources.length > 0) {
      return [...summary.sources].sort((a, b) => b.visitors - a.visitors);
    }
    // Dacă lista din summary este goală, returnăm structura de bază cu 0 pentru a asigura un dashboard estetic
    return [
      { source: 'google_organic', visitors: 0, pageviews: 0, percentage: 0 },
      { source: 'olx', visitors: 0, pageviews: 0, percentage: 0 },
      { source: 'window_qr', visitors: 0, pageviews: 0, percentage: 0 },
      { source: 'direct', visitors: 0, pageviews: 0, percentage: 0 },
      { source: 'facebook', visitors: 0, pageviews: 0, percentage: 0 },
      { source: 'autovit', visitors: 0, pageviews: 0, percentage: 0 },
      { source: 'instagram', visitors: 0, pageviews: 0, percentage: 0 },
      { source: 'tiktok', visitors: 0, pageviews: 0, percentage: 0 }
    ];
  }, [summary.sources]);

  // Total conversii directe
  const totalDirectContacts = useMemo(() => {
    const c = summary.conversions;
    return (c?.whatsappClicks || 0) + (c?.phoneClicks || 0) + (c?.leadsSubmitted || 0);
  }, [summary.conversions]);

  // Total toate micro-conversiile (inclusiv calcule finanțare)
  const totalAllMicroConversions = useMemo(() => {
    const c = summary.conversions;
    return totalDirectContacts + (c?.financeCalc || 0);
  }, [summary.conversions, totalDirectContacts]);

  // Helper randare icon canal
  const renderSourceIcon = (sourceKey: string) => {
    const key = sourceKey.toLowerCase();
    if (key.includes('qr')) return <QrCode className="w-4 h-4 text-emerald-400" />;
    if (key.includes('google')) return <Search className="w-4 h-4 text-amber-400" />;
    if (key.includes('olx')) return <Tag className="w-4 h-4 text-blue-400" />;
    if (key.includes('autovit')) return <Car className="w-4 h-4 text-red-400" />;
    if (key.includes('facebook') || key.includes('fb')) return <Share2 className="w-4 h-4 text-indigo-400" />;
    if (key.includes('instagram') || key.includes('ig')) return <Camera className="w-4 h-4 text-fuchsia-400" />;
    if (key.includes('tiktok')) return <Video className="w-4 h-4 text-cyan-400" />;
    return <Compass className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 🧭 BARA SUPERIOARĂ DE CONTROL: TITLU, TIMEFRAME & REFRESH               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Trafic & Audiență Showroom
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Telemetrie Activă
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Urmărire fără cookie-uri (Zero PII) sincronizată cu PostgreSQL Netcup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Selector orizont timp dedicat */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: 'Astăzi' },
              { id: '7d', label: '7 Zile' },
              { id: '30d', label: '30 Zile' },
              { id: 'all', label: 'Tot Timpul' }
            ].map((t) => {
              const active = internalTimeframe === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInternalTimeframe(t.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                    active
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Buton Reîmprospătare */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading}
            title={`Ultima actualizare: ${lastRefreshedAt.toLocaleTimeString('ro-RO')}`}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500 dark:text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Reîmprospătează</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 SECȚIUNEA 1: CELE 4 CARDURI KPI EXECUTIVE (TICKET 01)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vizitatori Unici */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm dark:shadow-lg">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Vizitatori Unici</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
              {formatTrafficNumber(summary.uniqueVisitors)}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800/80 mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Dispozitive distincte</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" />
              Clienți Reali
            </span>
          </div>
        </div>

        {/* KPI 2: Afișări Totale (Pageviews) */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm dark:shadow-lg">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Afișări Totale</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
              {formatTrafficNumber(summary.totalPageviews)}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800/80 mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Medie vizionare</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
              {avgPagesPerVisitor} pagini / vizitator
            </span>
          </div>
        </div>

        {/* KPI 3: Rată de Conversie Contact */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm dark:shadow-lg">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Rată Conversie</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>{summary.conversionRate.toFixed(1)}%</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800/80 mt-3 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="truncate pr-1" title="(WhatsApp + Apeluri + Formulare) / Vizitatori">
              (Contacte directe / Vizitatori)
            </span>
            <span className="text-zinc-700 dark:text-zinc-300 font-mono font-bold shrink-0">
              {totalDirectContacts} acțiuni
            </span>
          </div>
        </div>

        {/* KPI 4: Top Sursă de Achiziție */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm dark:shadow-lg">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Top Sursă Achiziție</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
              {topSourceConfig.label}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800/80 mt-3 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Canal dominant</span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${topSourceConfig.badgeBg} ${topSourceConfig.badgeText} ${topSourceConfig.badgeBorder}`}>
              {topSourceConfig.shortLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📈 GRAFIC TEMPORAL DE TENDINȚĂ & DISTRIBUȚIE EVENIMENTE (TICKET 01)        */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Tendință Trafic & Implicare Vizitatori
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Evoluția volumului de navigare raportat la conversiile calificate generate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Afișări Pagini ({formatTrafficNumber(summary.totalPageviews)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
              <span className="text-zinc-600 dark:text-zinc-400">Conversii ({totalAllMicroConversions})</span>
            </div>
          </div>
        </div>

        {/* Grafic bare volum stilizate */}
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-black/30 rounded-xl p-4 border border-slate-200 dark:border-zinc-800/60">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-2 font-mono">
              <span>Proporție Paginare vs Conversie Directă</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {summary.conversionRate.toFixed(1)}% Rata de Răspuns
              </span>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{
                  width: `${Math.max(5, Math.min(95, 100 - summary.conversionRate))}%`
                }}
                title={`Navigare Showroom: ${100 - summary.conversionRate}%`}
              />
              <div
                className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-500"
                style={{
                  width: `${Math.max(5, Math.min(95, summary.conversionRate))}%`
                }}
                title={`Conversii Directe: ${summary.conversionRate}%`}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              <span>Vizualizări stoc și specificații tehnice</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Interacțiuni telefon / WhatsApp / lead</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 SECȚIUNEA 2: CANALE DE ACHIZIȚIE & DISPOZITIVE & CONVERSII (TICKET 02) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* WIDGET 1: Distribuție Canale de Achiziție (Acquisition Breakdown) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Distribuție Canale de Achiziție
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Originea vizitatorilor: Motoare căutare, portaluri partenere, reclame și QR fizic
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {sortedSources.length} canale
              </span>
            </div>

            {/* Listă canale de achiziție */}
            <div className="space-y-3.5 mt-5">
              {sortedSources.map((item, idx) => {
                const config = getSourceDisplay(item.source);
                const pct = item.percentage || 0;

                return (
                  <div
                    key={`${item.source}-${idx}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-black/25 hover:bg-slate-100 dark:hover:bg-black/40 border border-slate-200 dark:border-zinc-800/80 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800/80 shrink-0">
                          {renderSourceIcon(item.source)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {config.label}
                            </span>
                            {config.isPhysicalQr && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                Trafic Fizic Parc Auto (QR)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500 truncate block">
                            {config.description}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <div className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {formatTrafficNumber(item.visitors)} vizitatori
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {pct}% din total
                        </div>
                      </div>
                    </div>

                    {/* Bară de progres procentuală */}
                    <div className="w-full bg-slate-200 dark:bg-zinc-800/70 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                        style={{ width: `${Math.max(pct, item.visitors > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80 mt-6 flex items-center justify-between text-xs text-zinc-500">
            <span>Deduplicare automată pe sesiune utilizator</span>
            <span className="text-zinc-600 dark:text-zinc-400 font-mono">UTM + Referrer + Parametri QR</span>
          </div>
        </div>

        {/* COLOANA LATERALĂ: Dispozitive & Micro-Conversii */}
        <div className="space-y-6">

          {/* WIDGET 2: Distribuție Dispozitive (Mobile vs Desktop) */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Distribuție Dispozitive
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ponderea utilizatorilor după formatul ecranului
                </p>
              </div>
            </div>

            {/* Reprezentare vizuală bară combinată */}
            <div className="bg-slate-50 dark:bg-black/30 rounded-xl p-3 border border-slate-200 dark:border-zinc-800/60 mb-4">
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex mb-2">
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${deviceStats.mobilePct}%` }}
                  title={`Mobil: ${deviceStats.mobilePct}%`}
                />
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${deviceStats.desktopPct}%` }}
                  title={`Desktop: ${deviceStats.desktopPct}%`}
                />
                <div
                  className="bg-purple-500 h-full transition-all"
                  style={{ width: `${deviceStats.tabletPct}%` }}
                  title={`Tabletă: ${deviceStats.tabletPct}%`}
                />
              </div>

              {/* Detalii Dispozitive */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/40">
                  <div className="flex items-center justify-center gap-1 text-amber-500 dark:text-amber-400 mb-1">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold font-mono">{deviceStats.mobilePct}%</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Mobil</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/40">
                  <div className="flex items-center justify-center gap-1 text-blue-500 dark:text-blue-400 mb-1">
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold font-mono">{deviceStats.desktopPct}%</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Desktop</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/40">
                  <div className="flex items-center justify-center gap-1 text-purple-500 dark:text-purple-400 mb-1">
                    <Tablet className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold font-mono">{deviceStats.tabletPct}%</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tabletă</span>
                </div>
              </div>
            </div>

            {/* Insight automat dacă peste 60% din trafic este mobil */}
            {deviceStats.isMobileDominant && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Mobile-First Confirmat:</span>
                  <span>Experiența pe telefon mobil domină interesul cumpărătorilor ({deviceStats.mobilePct}%). Asigurați-vă că pozele și butoanele de apel sunt proeminente.</span>
                </div>
              </div>
            )}
          </div>

          {/* WIDGET 3: Sumar Micro-Conversii */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Micro-Conversii Calificate
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Acțiuni comerciale generate din showroom
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {totalAllMicroConversions} total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs mb-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="font-semibold">WhatsApp</span>
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatTrafficNumber(summary.conversions?.whatsappClicks || 0)}
                </div>
                <span className="text-[10px] text-zinc-500">Conversații inițiate</span>
              </div>

              {/* Apeluri Telefonice */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400 text-xs mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-semibold">Apeluri Directe</span>
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatTrafficNumber(summary.conversions?.phoneClicks || 0)}
                </div>
                <span className="text-[10px] text-zinc-500">Click pe număr dealer</span>
              </div>

              {/* Formulare Lead */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-purple-500 dark:text-purple-400 text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">Lead-uri Formular</span>
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatTrafficNumber(summary.conversions?.leadsSubmitted || 0)}
                </div>
                <span className="text-[10px] text-zinc-500">Cereri ofertă / test drive</span>
              </div>

              {/* Simulări Credit */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 text-xs mb-1">
                  <Calculator className="w-3.5 h-3.5" />
                  <span className="font-semibold">Simulări Rate</span>
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatTrafficNumber(summary.conversions?.financeCalc || 0)}
                </div>
                <span className="text-[10px] text-zinc-500">Calcule leasing & rate</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Rată contact din total audiență:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                {summary.uniqueVisitors > 0
                  ? ((totalDirectContacts / summary.uniqueVisitors) * 100).toFixed(1)
                  : '0.0'}%
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
