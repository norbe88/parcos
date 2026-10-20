import React, { useState } from 'react';
import { 
  X, Building2, Globe, Shield, Sparkles, ArrowRight, ArrowLeft, 
  Check, CheckCircle2, Copy, AlertTriangle, ExternalLink, Sliders, 
  Layers, Palette, Phone, CreditCard, ChevronUp, ChevronDown
} from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { getAdminAuthHeaders } from '../../utils/adminAuth';

interface SuperAdminOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

const THEME_OPTIONS = [
  {
    id: 'obsidian_gold',
    label: 'Obsidian Amber / Gold',
    desc: 'Estetică Dark Luxury caldă, chihlimbar și bronz satinat (Stil RXM Classic)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    accentColor: '#f59e0b',
  },
  {
    id: 'clean_white',
    label: 'Clean White Luxury / Nordic',
    desc: 'Stil minimalist nordic, accente perlate și oțel șlefuit (Stil Porsche Studio)',
    badgeBg: 'bg-white/20 text-white border-white/40',
    accentColor: '#ffffff',
  },
  {
    id: 'midnight_blue',
    label: 'Midnight Sapphire / Blue',
    desc: 'Design corporativ de înaltă precizie, safir metalizat (Stil BMW / Mercedes)',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    accentColor: '#3b82f6',
  },
  {
    id: 'carbon_red',
    label: 'Carbon Crimson / Red',
    desc: 'Aspect sportiv, fibră de carbon și roșu dinamic (Stil Audi S-Line / Cupra)',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    accentColor: '#ef4444',
  },
  {
    id: 'emerald_prestige',
    label: 'Emerald Prestige / Green',
    desc: 'Lux ecologic regal, tonuri de smarald (Stil British Racing Green)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    accentColor: '#10b981',
  },
];

const DEFAULT_SECTIONS = [
  { key: 'HERO_SPOTLIGHT', label: '1. Hero Spotlight & Reel Video (TikTok)', enabled: true },
  { key: 'VEHICLE_CATALOG', label: '2. Catalog Autovehicule & Filtre Stoc', enabled: true },
  { key: 'FINANCING', label: '3. Calculator Rate Finanțare Auto (BT / TBI)', enabled: true },
  { key: 'BUY_BACK', label: '4. Formular Buy-Back & Trade-In', enabled: true },
  { key: 'GOOGLE_REVIEWS', label: '5. Recenzii Verificate Google Showroom', enabled: true },
  { key: 'WHY_CHOOSE_US', label: '6. Avantaje & Garanție Parc Auto', enabled: true },
  { key: 'CUSTOM_ORDER', label: '7. Formular Comandă Auto la Cerere', enabled: true },
];

export const SuperAdminOnboardingModal: React.FC<SuperAdminOnboardingModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const { setTenantId } = useTenant();

  const [step, setStep] = useState<number>(1);
  const [isQueryingAnaf, setIsQueryingAnaf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    slug: string;
    domain: string;
    name: string;
  } | null>(null);

  // Form State
  const [cui, setCui] = useState('');
  const [name, setName] = useState('');
  const [regCom, setRegCom] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [showroomAddress, setShowroomAddress] = useState('');
  const [city, setCity] = useState('Cluj-Napoca');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ibanRon, setIbanRon] = useState('RO00 BTRL 0000 0000 0000 0000');
  const [themePreset, setThemePreset] = useState('clean_white');

  // Layout & Modules State
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [modules, setModules] = useState({
    scannerOcr: true,
    financeCalc: true,
    stockSync: true,
    windowStickers: true,
    carVerticalCheck: true,
  });

  if (!isOpen) return null;

  const handleLookupAnaf = async () => {
    const clean = cui.replace(/\D/g, '');
    if (!clean) {
      showToast('⚠️ Introduceți un CUI valid pentru căutare.');
      return;
    }

    setIsQueryingAnaf(true);
    try {
      const res = await fetch(`/api/anaf/${clean}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (json.name) setName(json.name);
          if (json.regCom) setRegCom(json.regCom);
          if (json.legalAddress) {
            setLegalAddress(json.legalAddress);
            setShowroomAddress(json.legalAddress);
          }
          if (json.phone) setPhone(json.phone);

          // Generare slug implicit din nume dacă lipsește
          if (!slug && json.name) {
            const autoSlug = json.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_+|_+$/g, '')
              .slice(0, 20);
            setSlug(autoSlug);
            setDomain(`${autoSlug}.ro`);
            setEmail(`contact@${autoSlug}.ro`);
          }

          showToast(`✓ Date preluate din registrul ANAF: ${json.name}`);
        }
      } else {
        showToast('ℹ️ CUI-ul nu a fost găsit în ANAF. Puteți completa manual datele.');
      }
    } catch {
      showToast('⚠️ Serviciul ANAF este momentan indisponibil. Continuați manual.');
    } finally {
      setIsQueryingAnaf(false);
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const copy = [...sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setSections(copy);
  };

  const handleToggleSection = (index: number) => {
    const copy = [...sections];
    copy[index].enabled = !copy[index].enabled;
    setSections(copy);
  };

  const handleSubmit = async () => {
    if (!slug || !name || !cui) {
      showToast('⚠️ Câmpurile Slug, Nume Societate și CUI sunt obligatorii.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_').trim();
      const payload = {
        name,
        slug: cleanSlug,
        domain: domain || `${cleanSlug}.ro`,
        phonePrimary: phone || '0740 000 000',
        phoneSecondary: phone || '',
        whatsappNumber: phone.replace(/\D/g, '') || '40740000000',
        email: email || `contact@${domain || `${cleanSlug}.ro`}`,
        addressStreet: showroomAddress || legalAddress || 'Cluj-Napoca, jud. Cluj',
        city: city || 'Cluj-Napoca',
        county: 'Cluj',
        vatNumber: cui.toUpperCase().startsWith('RO') ? cui.toUpperCase() : `RO${cui}`,
        openingHours: 'Luni - Vineri 09:00 - 18:00 | Sâmbătă 10:00 - 14:00',
        isActive: true,
        config: {
          themePreset,
          vatRate: 0.21, // Invariant strict 21%
          partnerTier: 'FOUNDER_VIP',
          isVip: true,
          freeListing: true,
          freeRelist: true,
          autoRelist: true,
          bank: {
            name: 'Banca Transilvania',
            warrantyTerm: 'Cont de Garanție',
            reservationTerm: 'Garanție de Rezervare/Participare',
            ibanRon: ibanRon,
          },
          layout: {
            sectionsOrder: sections.filter((s) => s.enabled).map((s) => s.key),
          },
          modules,
        },
      };

      const res = await fetch('/api/dealers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTenantId(cleanSlug);
        setSuccessResult({
          slug: cleanSlug,
          domain: payload.domain,
          name: payload.name,
        });
        showToast(`🎉 Showroom-ul ${name} a fost lansat cu succes!`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(`❌ Eroare la înrolare: ${errJson.error || 'Server error'}`);
      }
    } catch (err: any) {
      showToast(`❌ Eroare rețea: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-amber-500/30 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Antet Modal */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  SuperAdmin Suite
                </span>
                <span className="text-xs text-zinc-400">Pasul {step} din 4</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Înrolează Parc Auto Nou (Turnkey Showroom)
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicator Pasi */}
        {!successResult && (
          <div className="px-6 py-3 bg-black/30 border-b border-white/[0.06] flex items-center justify-between text-xs font-medium">
            <span className={step >= 1 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>1. Date ANAF & CUI</span>
            <span className="text-zinc-600">→</span>
            <span className={step >= 2 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>2. Identitate Vizuală</span>
            <span className="text-zinc-600">→</span>
            <span className={step >= 3 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>3. Layout Secțiuni</span>
            <span className="text-zinc-600">→</span>
            <span className={step >= 4 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>4. Lansare Showroom</span>
          </div>
        )}

        {/* Corp Modal */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* REZULTAT FINAL DE SUCCES */}
          {successResult ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{successResult.name} este gata!</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Instanța a fost configurată și este activă în rețeaua Netcup VPS (152.53.158.65).
                </p>
              </div>

              {/* Card Linkuri */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">Previzualizare Live ZBook:</span>
                  <a
                    href={`/?dealer=${successResult.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    <span>Deschide Showroom</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <span className="text-xs font-bold text-white block mb-1">🌐 Configurare Cloudflare DNS:</span>
                  <p className="text-xs text-zinc-400 mb-2">
                    Clienții din parcul auto trebuie să adauge în registrar/Cloudflare pentru domeniul <strong className="text-amber-300">{successResult.domain}</strong>:
                  </p>
                  <div className="font-mono text-[11px] bg-black/60 p-3 rounded-xl border border-white/10 space-y-1 text-zinc-300">
                    <div>A &nbsp;&nbsp;&nbsp;&nbsp; @ &nbsp;&nbsp; 152.53.158.65 &nbsp; (Proxied / Netcup VPS)</div>
                    <div>CNAME www &nbsp; @ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (Proxied)</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-bold transition-all cursor-pointer"
              >
                Închide Fereastra
              </button>
            </div>
          ) : (
            <>
              {/* PASUL 1: DATE FISCALE & IDENTITATE */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-2">
                    <span>💡 Introduceți CUI-ul pentru a prelua automat denumirea și sediul din registrul oficial ANAF v9.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">CUI / Cod Fiscal ANAF *</label>
                      <input
                        type="text"
                        value={cui}
                        onChange={(e) => setCui(e.target.value)}
                        placeholder="ex: RO43460100 sau 43460100"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-amber-500/60 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupAnaf}
                      disabled={isQueryingAnaf}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isQueryingAnaf ? '⏳ Căutare...' : '🔍 Verifică ANAF'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Denumire Societate *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ex: MPI AUTO CLA S.R.L."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-amber-500/60 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Nr. Reg. Comerțului</label>
                      <input
                        type="text"
                        value={regCom}
                        onChange={(e) => setRegCom(e.target.value)}
                        placeholder="ex: J12/4202/2020"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-amber-500/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Slug Identificator Showroom *</label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                        placeholder="ex: mpi_auto"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-mono focus:border-amber-500/60 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Domeniu Web Propriu</label>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="ex: mpiauto.ro"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-amber-500/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Telefon Vânzări Showroom</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="ex: 0759 757 858"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-amber-500/60 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Email Contact</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex: contact@mpiauto.ro"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-amber-500/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">Adresă Showroom / Parc Fizic</label>
                    <input
                      type="text"
                      value={showroomAddress}
                      onChange={(e) => setShowroomAddress(e.target.value)}
                      placeholder="ex: Centura Apahida, jud. Cluj (lângă sensul giratoriu)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:border-amber-500/60 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                      <span>IBAN RON — Cont de Garanție (Banca Transilvania)</span>
                      <span className="text-[11px] text-amber-400 font-mono">TVA 21% Invariant</span>
                    </label>
                    <input
                      type="text"
                      value={ibanRon}
                      onChange={(e) => setIbanRon(e.target.value.toUpperCase())}
                      placeholder="RO00 BTRL 0000 0000 0000 0000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-mono focus:border-amber-500/60 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* PASUL 2: IDENTITATE VIZUALĂ */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Alegeți Tema Vizuală Showroom</h3>
                    <p className="text-xs text-zinc-400">
                      Fiecare temă calibrează automat culorile de accent, bordurile și contrastele WCAG AA.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = themePreset === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setThemePreset(theme.id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-white/[0.07] border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                              : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">{theme.label}</span>
                            <div
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{ backgroundColor: theme.accentColor }}
                            />
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">{theme.desc}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${theme.badgeBg}`}>
                            {isSelected ? '✓ Selectată' : 'Apasă pentru selectare'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASUL 3: LAYOUT & ORDINE SECȚIUNI */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Configurare Ordine Secțiuni Showroom</h3>
                    <p className="text-xs text-zinc-400">
                      Bifați componentele active și folosiți săgețile pentru a rearanja ordinea pe pagina principală.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {sections.map((sec, idx) => (
                      <div
                        key={sec.key}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          sec.enabled
                            ? 'bg-white/[0.03] border-white/10 text-white'
                            : 'bg-black/30 border-white/[0.04] text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={sec.enabled}
                            onChange={() => handleToggleSection(idx)}
                            className="w-4 h-4 rounded bg-white/10 border-white/20 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className={`text-xs font-medium ${sec.enabled ? 'text-zinc-200' : 'text-zinc-500'}`}>
                            {sec.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mută mai sus"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, 'down')}
                            disabled={idx === sections.length - 1}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mută mai jos"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PASUL 4: MODULE ACTIVE & LANSARE */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Pachet & Module Active Showroom</h3>
                    <p className="text-xs text-zinc-400">
                      Toate opțiunile sunt activate din oficiu cu tier FOUNDER_VIP pentru parcurile partenere.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: 'scannerOcr', label: 'Scanner Buletine OCR & CIV Auto', desc: 'Completare automată contracte și proforme în 1.5 secunde' },
                      { key: 'financeCalc', label: 'Calculator Rate Finanțare (Banca Transilvania)', desc: 'Simulare rate cu TVA deductibil strict 21%' },
                      { key: 'stockSync', label: 'Sincronizare Stoc S9 / Autovit / OLX', desc: 'Dezactivare automată la vânzare fizică în showroom' },
                      { key: 'windowStickers', label: 'Generator Fișe Parbriz A4 (QR Code)', desc: 'Scanare duminica pentru galerie 25 poze HD pe mobil' },
                      { key: 'carVerticalCheck', label: 'Verificare carVertical în platformă', desc: 'Prezentare transparentă istoric vehicul fără false claims' },
                    ].map((mod) => (
                      <div
                        key={mod.key}
                        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{mod.label}</div>
                          <div className="text-[11px] text-zinc-400">{mod.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={(modules as any)[mod.key]}
                          onChange={(e) => setModules({ ...modules, [mod.key]: e.target.checked })}
                          className="w-4 h-4 rounded bg-white/10 border-white/20 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                    <div className="text-xs font-bold text-amber-300">Garanții Arhitecturale Respectate:</div>
                    <ul className="text-[11px] text-zinc-300 list-disc list-inside space-y-0.5">
                      <li>TVA Strict 21% (VAT_RATE = 0.21, Net = Gross / 1.21)</li>
                      <li>Terminologie strictă: Cont de Garanție (Banca Transilvania)</li>
                      <li>Găzduire dedicată: Netcup VPS (152.53.158.65)</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Bara Navigare / Butoane Pas */}
        {!successResult && (
          <div className="px-6 py-4 bg-black/40 border-t border-white/[0.08] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Înapoi</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!slug || !name || !cui)) {
                    showToast('⚠️ Vă rugăm completați CUI-ul, Numele și Slug-ul înainte de a continua.');
                    return;
                  }
                  setStep((s) => s + 1);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <span>Continuă</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Se configurează...' : '🚀 Lansează Showroom Turnkey'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
