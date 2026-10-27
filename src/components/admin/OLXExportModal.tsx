import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, ExternalLink, Image as ImageIcon, Sparkles, CheckCircle2, 
  AlertCircle, ShieldCheck, CreditCard, RefreshCw, Bookmark, 
  Copy, Check, Phone, MapPin, User, ChevronDown, ChevronUp,
  Sliders, Layers, Tag, Puzzle, Download, Save, Truck, Shield
} from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { 
  OlxVehiclePayload,
  OlxDealerTemplateConfig,
  getDealerOlxTemplate,
  saveDealerOlxTemplate,
  generateOlxTitle, 
  generateOlxDescription, 
  pickRecommendedOlxPhotos,
  mapToOlxCarBody,
  mapToOlxColor,
  mapToOlxFuel,
  mapToOlxGearbox,
  cleanCarModel,
  sanitizeForOlx
} from '../../utils/olxPosterPayload';
import { generateOlxBookmarkletUrl } from '../../utils/olxBookmarkletGenerator';
import { ADMIN_AUTH_TOKEN_KEY } from '../../utils/adminAuth';

interface OLXExportModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  showToast: (msg: string) => void;
  dealer?: DealerProfile;
  onOpenInstallModal?: () => void;
}

export const OLXExportModal: React.FC<OLXExportModalProps> = ({
  isOpen,
  car,
  onClose,
  showToast,
  dealer = SEED_DEALER,
  onOpenInstallModal
}) => {
  // State formular export
  const [title, setTitle] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<'€' | 'lei'>('€');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [includeVin, setIncludeVin] = useState(true);
  const [autoExtension, setAutoExtension] = useState(false); // Default false (fără costuri surpriză)
  const [carBody, setCarBody] = useState('Berlina');
  const [color, setColor] = useState('Negru');
  const [doors, setDoors] = useState('4 sau 5');
  const [fuel, setFuel] = useState<'Diesel' | 'Benzina' | 'Hibrid' | 'Electric' | 'GPL'>('Diesel');
  const [gearbox, setGearbox] = useState<'automat' | 'manual'>('automat');
  const [registration, setRegistration] = useState<'registered' | 'unregistered'>('unregistered');
  
  // Date de contact
  const [location, setLocation] = useState('Cluj-Napoca');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Fotografii selectate (maxim 8)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // Opțiuni descriere comercială
  const [includeFinancing, setIncludeFinancing] = useState(true);
  const [includeWarranty, setIncludeWarranty] = useState(true);
  const [includeBuyBack, setIncludeBuyBack] = useState(true);
  const [includeDelivery, setIncludeDelivery] = useState(true);
  const [includeContGarantie, setIncludeContGarantie] = useState(true);
  const [customNotes, setCustomNotes] = useState('');
  const [description, setDescription] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'form' | 'bookmarklet'>('form');
  const [isCopied, setIsCopied] = useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [extensionVersion, setExtensionVersion] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const check = () => {
      const attr = document.documentElement.getAttribute('data-parcos-olx-extension');
      if (attr === 'installed' || (window as any).__PARCOS_OLX_EXTENSION__) {
        setIsExtensionInstalled(true);
      }
    };
    check();

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PARCOS_OLX_PONG' || e.data?.type === 'PARCOS_OLX_EXPORT_SAVED') {
        setIsExtensionInstalled(true);
        if (e.data?.version) setExtensionVersion(e.data.version);
      }
    };

    window.addEventListener('message', handleMessage);
    const handleReady = (e: any) => {
      setIsExtensionInstalled(true);
      if (e?.detail?.version) setExtensionVersion(e.detail.version);
    };
    window.addEventListener('parcos-olx-extension-ready', handleReady as EventListener);

    // Trimite un ping către content script
    window.postMessage({ type: 'PARCOS_OLX_PING' }, '*');
    const timer = setInterval(() => {
      window.postMessage({ type: 'PARCOS_OLX_PING' }, '*');
      check();
    }, 800);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('parcos-olx-extension-ready', handleReady as EventListener);
      clearInterval(timer);
    };
  }, [isOpen]);

  const dealerId = dealer?.id || dealer?.slug || dealer?.cui;

  // Inițializare stare la selectarea mașinii
  useEffect(() => {
    if (!car) return;

    const template = getDealerOlxTemplate(dealerId);

    setTitle(generateOlxTitle(car));
    setModel(cleanCarModel(car.brand, car.model));
    setPrice(car.priceEur || 0);
    setCurrency('€');
    setIsNegotiable(false);
    setIncludeVin(template.includeVinInText && Boolean(car.vin && car.vin.trim().length > 5));
    setAutoExtension(false);
    setCarBody(mapToOlxCarBody(car.bodyType));
    setColor(mapToOlxColor(car.color));
    const isCoupeOrCabrio = (car.bodyType || '').toLowerCase().includes('coupe') || (car.bodyType || '').toLowerCase().includes('cabrio');
    setDoors(isCoupeOrCabrio ? '2 sau 3' : '4 sau 5');
    setFuel(mapToOlxFuel(car.fuelType));
    setGearbox(mapToOlxGearbox(car.transmission, `${car.brand} ${car.model} ${car.versionTrim || ''}`));
    setRegistration('unregistered');

    // Contact din profil dealer
    const loc = dealer.serviceLocation || dealer.showroomAddress || 'Cluj-Napoca';
    const cleanCity = loc.toLowerCase().includes('cluj') ? 'Cluj-Napoca' : (loc.split(',')[0] || 'Cluj-Napoca');
    setLocation(cleanCity);
    setContactPerson(dealer.generalContactName ? `${dealer.generalContactName} - ${dealer.name.split(' ')[0]}` : dealer.name);
    setContactPhone(dealer.phonePrimary ? dealer.phonePrimary.replace(/\s+/g, '') : '0748892937');

    // Opțiuni comerciale încărcate din template-ul dealerului
    setIncludeFinancing(template.includeFinancing);
    setIncludeWarranty(template.includeWarranty);
    setIncludeBuyBack(template.includeBuyBack);
    setIncludeDelivery(template.includeDelivery);
    setIncludeContGarantie(template.includeContGarantie);
    setCustomNotes(template.customNotes || '');

    // Fotografii: selectăm automat cele 8 recomandate
    const recommended = pickRecommendedOlxPhotos(car.images || []);
    setSelectedPhotos(recommended);

    // Descriere inițială pe baza template-ului configurat
    const initialDesc = generateOlxDescription(car, dealer, {
      includeFinancing: template.includeFinancing,
      includeWarranty: template.includeWarranty,
      warrantyMonths: template.warrantyMonths,
      includeBuyBack: template.includeBuyBack,
      includeDelivery: template.includeDelivery,
      includeVinInText: template.includeVinInText && Boolean(car.vin),
      includeContGarantie: template.includeContGarantie,
      customHeader: template.customHeader,
      customFooter: template.customFooter,
      customNotes: template.customNotes
    });
    setDescription(initialDesc);
  }, [car, dealer, dealerId]);

  // Recalculare descriere la modificarea opțiunilor de text
  const handleRegenerateDescription = (customOverrides?: Partial<{
    includeFinancing: boolean;
    includeWarranty: boolean;
    includeBuyBack: boolean;
    includeDelivery: boolean;
    includeVinInText: boolean;
    includeContGarantie: boolean;
  }>) => {
    if (!car) return;
    const template = getDealerOlxTemplate(dealerId);
    const fin = customOverrides?.includeFinancing !== undefined ? customOverrides.includeFinancing : includeFinancing;
    const war = customOverrides?.includeWarranty !== undefined ? customOverrides.includeWarranty : includeWarranty;
    const bb = customOverrides?.includeBuyBack !== undefined ? customOverrides.includeBuyBack : includeBuyBack;
    const del = customOverrides?.includeDelivery !== undefined ? customOverrides.includeDelivery : includeDelivery;
    const vin = customOverrides?.includeVinInText !== undefined ? customOverrides.includeVinInText : includeVin;
    const cg = customOverrides?.includeContGarantie !== undefined ? customOverrides.includeContGarantie : includeContGarantie;

    const newDesc = generateOlxDescription(car, dealer, {
      includeFinancing: fin,
      includeWarranty: war,
      warrantyMonths: template.warrantyMonths,
      includeBuyBack: bb,
      includeDelivery: del,
      includeVinInText: vin,
      includeContGarantie: cg,
      customHeader: template.customHeader,
      customFooter: template.customFooter,
      customNotes
    });
    setDescription(newDesc);
  };

  // Salvează opțiunile curente ca șablon implicit pentru parc
  const handleSaveAsDefaultTemplate = () => {
    const currentTpl = getDealerOlxTemplate(dealerId);
    const updatedConfig: OlxDealerTemplateConfig = {
      ...currentTpl,
      includeFinancing,
      includeWarranty,
      includeBuyBack,
      includeDelivery,
      includeVinInText: includeVin,
      includeContGarantie,
      customNotes
    };
    saveDealerOlxTemplate(updatedConfig, dealerId);
    showToast('✓ Șablonul implicit OLX pentru parcul tău a fost actualizat cu succes!');
  };

  // Toggle selecție poză cu limită la 8
  const handleTogglePhoto = (photoUrl: string) => {
    if (selectedPhotos.includes(photoUrl)) {
      setSelectedPhotos(prev => prev.filter(p => p !== photoUrl));
    } else {
      if (selectedPhotos.length >= 8) {
        showToast('⚠️ OLX permite maxim 8 fotografii per anunț!');
        return;
      }
      setSelectedPhotos(prev => [...prev, photoUrl]);
    }
  };

  // Buton recomandare 8 cadre
  const handleApplyRecommendedPhotos = () => {
    if (!car?.images) return;
    const recommended = pickRecommendedOlxPhotos(car.images);
    setSelectedPhotos(recommended);
    showToast(`✓ Au fost selectate ${recommended.length} cadre optime conform recomandărilor OLX!`);
  };

  // Construire Payload complet
  const buildPayload = (): OlxVehiclePayload | null => {
    if (!car) return null;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
    const absolutePhotos = selectedPhotos.map(p => {
      if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) {
        return p;
      }
      return `${currentOrigin}${p.startsWith('/') ? '' : '/'}${p}`;
    });

    return {
      title: title.trim(),
      brand: car.brand,
      model: model.trim() || cleanCarModel(car.brand, car.model),
      carBody,
      color,
      doors,
      fuel,
      gearbox,
      state: 'used',
      steeringWheel: 'lhd',
      registration: registration || 'unregistered',
      sellerType: 'business',
      engineCc: car.engineCc,
      powerHp: car.powerHp,
      year: car.year,
      mileageKm: car.mileageKm || 0,
      vin: includeVin ? car.vin : undefined,
      price,
      currency,
      negotiable: isNegotiable,
      autoExtension,
      location,
      contactPerson,
      contactPhone,
      description: sanitizeForOlx(description),
      photos: absolutePhotos,
      exportedAt: new Date().toISOString(),
      vehicleId: car.id,
      origin: currentOrigin,
      adminToken: typeof window !== 'undefined' ? (sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY) || undefined) : undefined
    };
  };

  // Trimitere către OLX și salvare în localStorage + clipboard
  const handleExportAndOpenOlx = async () => {
    const payload = buildPayload();
    if (!payload) return;

    if (selectedPhotos.length === 0) {
      showToast('⚠️ Te rugăm să selectezi cel puțin o fotografie pentru anunț.');
      return;
    }

    try {
      // 1. Salvare în localStorage pentru citire instant de extensie sau bookmarklet
      localStorage.setItem('parcos_olx_pending_car', JSON.stringify(payload));
      localStorage.setItem('parcos_olx_last_export', JSON.stringify({
        carId: car?.id,
        title: payload.title,
        exportedAt: new Date().toISOString()
      }));

      // 2. Copiere în clipboard ca fallback instant garantat
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});

      let handledByExtension = false;

      // 3. Dacă extensia este prezentă, trimitem comanda cu openTab: true
      const exportSavedPromise = new Promise<boolean>((resolve) => {
        const handler = (e: MessageEvent) => {
          if (e.data?.type === 'PARCOS_OLX_EXPORT_SAVED' && e.data?.openedTab) {
            window.removeEventListener('message', handler);
            resolve(true);
          }
        };
        window.addEventListener('message', handler);
        setTimeout(() => {
          window.removeEventListener('message', handler);
          resolve(false);
        }, 500);
      });

      window.postMessage({ type: 'PARCOS_OLX_EXPORT', payload, openTab: true }, '*');

      if (isExtensionInstalled) {
        showToast('🚀 Date transmise extensiei! OLX se deschide și se completează automat...');
      }

      handledByExtension = await exportSavedPromise;

      // 4. Dacă extensia NU a deschis tab-ul (sau nu este instalată), îl deschidem noi ca fallback
      if (!handledByExtension) {
        if (!isExtensionInstalled) {
          showToast('📋 Datele mașinii au fost copiate! Pe pagina OLX dă 1 click pe Bookmarklet-ul ParcOS din bara de sus.');
        }
        window.open('https://www.olx.ro/adding/', '_blank');
      }

      onClose();
    } catch (err) {
      console.error('[ParcOS] Eroare export OLX', err);
      showToast('Eroare la salvarea datelor pentru export.');
    }
  };

  // Copiere manuală a JSON-ului
  const handleCopyPayloadJson = () => {
    const payload = buildPayload();
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setIsCopied(true);
    showToast('✓ Datele au fost copiate în clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  if (!isOpen || !car) return null;

  const bookmarkletUrl = generateOlxBookmarkletUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#121215] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Antet Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 font-black text-xs tracking-tighter">
              OLX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Export Automat pe OLX România
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Zero Comision · 1-Click
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {car.brand} {cleanCarModel(car.brand, car.model)} ({car.year}) · Pre-completare inteligentă a formularului OLX
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Buton tab comutare */}
            <div className="hidden sm:flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'form' 
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Configurare Anunț
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bookmarklet')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'bookmarklet' 
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Bookmarklet 1-Click</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Indicator Conectivitate Extensie / Bookmarklet */}
        <div className={`px-4 py-2 border-b text-xs flex flex-wrap items-center justify-between gap-2 ${
          isExtensionInstalled
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isExtensionInstalled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isExtensionInstalled ? (
              <span>
                <strong>Extensie ParcOS v{extensionVersion || '1.0.2'} Conectată:</strong> La deschiderea paginii OLX formularul se va completa 100% automat.
              </span>
            ) : (
              <span>
                <strong>Extensia nu este detectată în acest tab:</strong> Folosește <strong>Bookmarklet-ul 1-Click</strong> din bara de sus (zero instalare) sau reîncarcă extensia în <code>chrome://extensions/</code>.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isExtensionInstalled && onOpenInstallModal && (
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 cursor-pointer"
              >
                Ghid Instalare
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'form' ? 'bookmarklet' : 'form')}
              className="text-[11px] underline text-zinc-400 hover:text-white font-medium cursor-pointer"
            >
              {activeTab === 'form' ? 'Cum funcționează Bookmarklet?' : 'Înapoi la Formular'}
            </button>
          </div>
        </div>

        {/* Corp Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'bookmarklet' ? (
            /* Tab 2: Prezentare Bookmarklet Zero-Instalare */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-zinc-300 text-xs sm:text-sm leading-relaxed">
                <div className="font-bold text-blue-400 text-sm mb-1 flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Ce este Smart Bookmarklet-ul ParcOS?
                </div>
                O metodă 100% sigură și rapidă pentru dealerii care nu pot sau nu vor să instaleze extensii de browser. 
                Tragi butonul de mai jos în bara ta de Favorite, iar pe pagina OLX apeși pe el pentru a injecta instant toate datele mașinii!
              </div>

              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/20 gap-4">
                <span className="text-xs text-zinc-400 font-medium">Trage acest buton în bara de marcaje (Bookmarks Bar):</span>
                <a
                  href={bookmarkletUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('💡 Trage acest buton cu mouse-ul în bara de Favorite sus!');
                  }}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 cursor-grab active:cursor-grabbing hover:scale-105 transition-all flex items-center gap-2 select-none"
                  title="Trage acest buton în bara de sus de Favorite a browserului tău"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>⚡ ParcOS OLX Auto-Poster</span>
                </a>
                <span className="text-[11px] text-zinc-500">
                  (Dacă nu vezi bara de favorite, apasă <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">Ctrl + Shift + B</kbd> în Chrome)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
                <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 space-y-1">
                  <div className="font-bold text-amber-400">Pasul 1: Configurează</div>
                  <p className="text-zinc-400">Verifică prețul, cele 8 fotografii și descrierea în tabul Configurare.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 space-y-1">
                  <div className="font-bold text-amber-400">Pasul 2: Deschide OLX</div>
                  <p className="text-zinc-400">Apasă pe butonul de deschidere a paginii de adăugare anunț OLX.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 space-y-1">
                  <div className="font-bold text-amber-400">Pasul 3: Apasă Bookmarklet</div>
                  <p className="text-zinc-400">Apasă pe semnul de carte din bară. Formularul se completează automat în sub 2 secunde!</p>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 1: Configurare Anunț & Fotografii */
            <>
              {/* Banner Asistență Extensie dacă nu este instalată */}
              {!isExtensionInstalled && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-transparent border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Puzzle className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-zinc-200">
                      Pentru completare 100% automată în formularul OLX, instalează extensia sau folosește Bookmarklet-ul:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenInstallModal && (
                      <button
                        type="button"
                        onClick={onOpenInstallModal}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs border border-teal-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Puzzle className="w-3.5 h-3.5" />
                        <span>Ghid Instalare</span>
                      </button>
                    )}
                    <a
                      href="/downloads/parcos-olx-publisher.zip?v=1.1.0"
                      download="parcos-olx-publisher.zip"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Descarcă arhiva ZIP oficială a extensiei (v1.1.0 · 66 KB)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descarcă ZIP</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookmarklet')}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 font-semibold text-xs border border-white/10 transition-all cursor-pointer"
                    >
                      Bookmarklet
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Selecție Fotografii (Maxim 8) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      Fotografii Anunț ({selectedPhotos.length} / 8 selectate)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyRecommendedPhotos}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🎯 Recomandare Cadre Optime (8 poze)</span>
                    </button>
                    {selectedPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhotos([])}
                        className="px-2 py-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors cursor-pointer"
                      >
                        Deselectează tot
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {(car.images || []).map((imgUrl, idx) => {
                    const isSelected = selectedPhotos.includes(imgUrl);
                    const orderIndex = selectedPhotos.indexOf(imgUrl);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleTogglePhoto(imgUrl)}
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                          isSelected 
                            ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/20 scale-[0.98]' 
                            : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Foto ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isSelected ? (
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] flex items-center justify-center shadow-md">
                            {orderIndex + 1}
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[10px] text-white font-bold bg-white/20 px-1.5 py-0.5 rounded">
                              + Adaugă
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedPhotos.length > 8 && (
                  <p className="text-xs text-red-400 font-medium">
                    ⚠️ Atenție: OLX suportă strict 8 fotografii per anunț. Primele 8 vor fi încărcate.
                  </p>
                )}
              </div>

              {/* 2. Marcă & Model OLX */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-4 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Marcă Autoturism</label>
                  <div className="w-full bg-[#18181b]/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-amber-300 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{car.brand}</span>
                  </div>
                </div>
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Model OLX (Selecție inteligentă din listă)</span>
                    <span className="text-[10px] text-zinc-400">Canonic OLX (ex: Clio, Megane, Golf, Seria 3)</span>
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400/50"
                    placeholder="Ex: Clio"
                  />
                </div>
              </div>

              {/* 3. Titlu, Preț & Monedă */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-7 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Titlu Anunț OLX (max 70 caractere)</span>
                    <span className={`text-[10px] font-mono ${title.length > 70 ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                      {title.length} / 70
                    </span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={70}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400/50"
                    placeholder="Ex: BMW Seria 3 320d xDrive M-Sport Automat Panoramic"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Preț Afișat
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-400/50"
                      placeholder="24500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Monedă
                  </label>
                  <div className="grid grid-cols-2 bg-[#18181b] border border-white/10 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setCurrency('€')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currency === '€' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      € (EUR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('lei')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currency === 'lei' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      lei
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Parametri Tehnici & Bife de Control */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Caroserie</label>
                  <select
                    value={carBody}
                    onChange={(e) => setCarBody(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="Berlina">Berlina</option>
                    <option value="SUV">SUV</option>
                    <option value="Break">Break (Combi)</option>
                    <option value="Coupe">Coupe</option>
                    <option value="Cabriolet">Cabriolet</option>
                    <option value="Monovolum">Monovolum</option>
                    <option value="Hatchback">Hatchback</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Culoare</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="Negru">Negru</option>
                    <option value="Alb">Alb</option>
                    <option value="Gri">Gri</option>
                    <option value="Argintiu">Argintiu</option>
                    <option value="Albastru">Albastru</option>
                    <option value="Rosu">Roșu</option>
                    <option value="Maro">Maro</option>
                    <option value="Verde">Verde</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Cutie Viteze</label>
                  <select
                    value={gearbox}
                    onChange={(e) => setGearbox(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="automat">Automată</option>
                    <option value="manual">Manuală</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Combustibil</label>
                  <select
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Benzina">Benzină</option>
                    <option value="Hibrid">Hibrid</option>
                    <option value="Electric">Electric</option>
                    <option value="GPL">GPL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Număr Uși</label>
                  <select
                    value={doors}
                    onChange={(e) => setDoors(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="4 sau 5">4 / 5 Uși</option>
                    <option value="2 sau 3">2 / 3 Uși</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Înmatriculare</label>
                  <select
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="unregistered">Neînmatriculat (Implicit)</option>
                    <option value="registered">Înmatriculat</option>
                  </select>
                </div>
              </div>

              {/* Bife Importante: VIN, Autoprelungire, Negociabil */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeVin}
                    onChange={(e) => setIncludeVin(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-black/40 border-white/20 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold block text-white">Include VIN (Serie Șasiu)</span>
                    <span className="text-[10px] text-zinc-500">{car.vin || 'Fără serie definită'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoExtension}
                    onChange={(e) => setAutoExtension(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-black/40 border-white/20 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold block text-white">Autoprelungire Anunț</span>
                    <span className="text-[10px] text-zinc-500">{autoExtension ? 'Activ (poate genera costuri)' : 'Dezactivat (recomandat)'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-black/40 border-white/20 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold block text-white">Preț Negociabil</span>
                    <span className="text-[10px] text-zinc-500">{isNegotiable ? 'Afișează etichetă negociabil' : 'Preț fix'}</span>
                  </div>
                </label>
              </div>

              {/* 4. Date de Contact Dealer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Localitate Anunț OLX</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50"
                    placeholder="Cluj-Napoca"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Persoană de Contact</span>
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50"
                    placeholder="Robert - RXM Automobile"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Număr Telefon</span>
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400/50"
                    placeholder="0748892937"
                  />
                </div>
              </div>

              {/* 5. Descriere Comercială cu Opțiuni Rapide & Template Personalizat */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-zinc-300">
                      Descriere Comercială Anunț (Șablon Certificat)
                    </label>
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">
                      · Personalizabil per dealer
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Cont de Garanție Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !includeContGarantie;
                        setIncludeContGarantie(next);
                        handleRegenerateDescription({ includeContGarantie: next });
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        includeContGarantie 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                          : 'bg-white/5 text-zinc-500 border-white/10 opacity-70'
                      }`}
                      title={includeContGarantie ? 'Clauza Cont de Garanție este inclusă în text' : 'Clauza Cont de Garanție este exclusă'}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Cont Garanție</span>
                    </button>

                    {/* Rate TBI / BT Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !includeFinancing;
                        setIncludeFinancing(next);
                        handleRegenerateDescription({ includeFinancing: next });
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        includeFinancing 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                          : 'bg-white/5 text-zinc-500 border-white/10 opacity-70'
                      }`}
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Rate TBI/BT</span>
                    </button>

                    {/* Garanție Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !includeWarranty;
                        setIncludeWarranty(next);
                        handleRegenerateDescription({ includeWarranty: next });
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        includeWarranty 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' 
                          : 'bg-white/5 text-zinc-500 border-white/10 opacity-70'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>Garanție</span>
                    </button>

                    {/* Buy-Back Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !includeBuyBack;
                        setIncludeBuyBack(next);
                        handleRegenerateDescription({ includeBuyBack: next });
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        includeBuyBack 
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm' 
                          : 'bg-white/5 text-zinc-500 border-white/10 opacity-70'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Buy-Back</span>
                    </button>

                    {/* Livrare Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !includeDelivery;
                        setIncludeDelivery(next);
                        handleRegenerateDescription({ includeDelivery: next });
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        includeDelivery 
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm' 
                          : 'bg-white/5 text-zinc-500 border-white/10 opacity-70'
                      }`}
                    >
                      <Truck className="w-3 h-3" />
                      <span>Livrare</span>
                    </button>

                    {/* Salvează ca implicit */}
                    <button
                      type="button"
                      onClick={handleSaveAsDefaultTemplate}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold transition-all cursor-pointer flex items-center gap-1"
                      title="Salvează aceste selecții ca șablon implicit pentru toate anunțurile viitoare"
                    >
                      <Save className="w-3 h-3" />
                      <span>Setează ca Șablon Implicit</span>
                    </button>

                    {/* Buton Regenerare manuală */}
                    <button
                      type="button"
                      onClick={() => handleRegenerateDescription()}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 font-semibold transition-all cursor-pointer flex items-center gap-1"
                      title="Regenerează textul complet"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerează</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3.5 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-amber-400/50 resize-y"
                  placeholder="Descrierea completă a vehiculului..."
                />
              </div>
            </>
          )}
        </div>

        {/* Subsol Modal & Acțiuni */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0f0f12] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyPayloadJson}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Copiază datele brute în format JSON"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Copiat!' : 'Copiază JSON'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'form' ? 'bookmarklet' : 'form')}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>{activeTab === 'form' ? 'Ghid Bookmarklet' : 'Înapoi la Configurare'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              Anulează
            </button>

            <button
              type="button"
              onClick={handleExportAndOpenOlx}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-black" />
              <span>{isExtensionInstalled ? '🚀 Exportă & Deschide OLX' : '🚀 Deschide OLX & Exportă Date'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
