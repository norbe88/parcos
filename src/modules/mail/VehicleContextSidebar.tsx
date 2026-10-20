/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Panou Lateral Contextual Vehicul (PMH-302)
 * Component: VehicleContextSidebar.tsx
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Regim Marjă Art. 312
 * Design: Dark Luxury Dual-Theme (#09090b, #121215, font Plus Jakarta Sans)
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Car, Check, Copy, ChevronLeft, ChevronRight, FileText, Shield, 
  Sparkles, Building2, ExternalLink, AlertCircle, Link2, Unlink, 
  RefreshCw, Eye, Fuel, Gauge, Cog, Calendar, Tag, Info, CheckCircle2,
  Share2, ArrowRight, Calculator
} from 'lucide-react';
import { VehicleItem, DealerProfile } from '../../db/types';
import { SEED_DEALER } from '../../db/dealer';
import { MailThreadItem } from './types';
import { 
  formatMileage, 
  normalizeCarImageUrl, 
  getStockNumber, 
  VAT_RATE 
} from '../../utils/helpers';
import { convertEurToRon } from '../../utils/currencyEngine';

export interface VehicleContextSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleItem | null;
  allVehicles: VehicleItem[];
  activeThread: MailThreadItem | null;
  dealershipName?: string;
  dealerProfile?: DealerProfile;
  onAssociateVehicle: (vehicleId: string | null) => Promise<void>;
  onInsertReplySnippet: (snippetText: string) => void;
  onOpenOfferComposer?: () => void;
  onSelectVehicleInCatalog?: (vehicleId: string) => void;
  showToast: (msg: string) => void;
}

const WARRANTY_TERM = 'Cont de Garanție';
const RESERVATION_TERM = 'Garanție de Rezervare/Participare';

export const VehicleContextSidebar: React.FC<VehicleContextSidebarProps> = ({
  isOpen,
  onClose,
  vehicle,
  allVehicles,
  activeThread,
  dealershipName = 'RXM Automobile',
  dealerProfile,
  onAssociateVehicle,
  onInsertReplySnippet,
  onOpenOfferComposer,
  onSelectVehicleInCatalog,
  showToast,
}) => {
  const activeDealerProfile = dealerProfile || SEED_DEALER;
  const dealership = dealershipName || activeDealerProfile.name;

  // Stări interne galerie foto cu blur-up
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [copiedVin, setCopiedVin] = useState<boolean>(false);

  // Stare sumă garanție de rezervare recomandată: 500 € sau 1.000 € (Opțional • Direct cu parcul)
  const [selectedGuaranteeDeposit, setSelectedGuaranteeDeposit] = useState<500 | 1000>(500);

  // Stări asociere manuală stoc
  const [isChangingVehicle, setIsChangingVehicle] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmittingLink, setIsSubmittingLink] = useState<boolean>(false);

  // Resetare index foto și sumă garanție recomandată la schimbarea mașinii
  useEffect(() => {
    setActivePhotoIndex(0);
    setIsImageLoaded(false);
    if (vehicle?.priceEur && vehicle.priceEur > 25000) {
      setSelectedGuaranteeDeposit(1000);
    } else {
      setSelectedGuaranteeDeposit(500);
    }
  }, [vehicle?.id, vehicle?.priceEur]);

  // Lista de imagini normalizate
  const galleryImages = useMemo(() => {
    if (!vehicle || !vehicle.images || vehicle.images.length === 0) return [];
    return vehicle.images.map((img) => normalizeCarImageUrl(img));
  }, [vehicle]);

  const currentImage = galleryImages[activePhotoIndex] || null;

  // Filtrare mașini disponibile pentru asociere manuală
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return allVehicles;
    const q = searchQuery.toLowerCase().trim();
    return allVehicles.filter((v) => 
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.versionTrim && v.versionTrim.toLowerCase().includes(q)) ||
      (v.vin && v.vin.toLowerCase().includes(q)) ||
      (v.stockNumber && v.stockNumber.toLowerCase().includes(q))
    );
  }, [allVehicles, searchQuery]);

  // Copiere VIN în clipboard
  const handleCopyVin = (vin: string) => {
    if (!vin) return;
    navigator.clipboard.writeText(vin);
    setCopiedVin(true);
    showToast(`📋 Serie Șasiu (VIN) copiată: ${vin}`);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  // Navigare galerie foto
  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryImages.length <= 1) return;
    setIsImageLoaded(false);
    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryImages.length <= 1) return;
    setIsImageLoaded(false);
    setActivePhotoIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Calcule Financiare: Strict 21% TVA vs Regim Marjă (Art. 312 Cod Fiscal)
  // ─────────────────────────────────────────────────────────────────────────
  const pricingDetails = useMemo(() => {
    if (!vehicle) return null;
    const priceEur = vehicle.priceEur || 0;
    const priceRon = convertEurToRon(priceEur);
    const isVatDeductible = !!vehicle.vatDeductible;

    if (isVatDeductible) {
      // TVA deductibil 21% (pentru persoane juridice/societăți comerciale)
      const netEur = Math.round(priceEur / (1 + VAT_RATE));
      const vatEur = priceEur - netEur;
      const netRon = convertEurToRon(netEur);
      const vatRon = convertEurToRon(vatEur);

      return {
        isVatDeductible: true,
        badgeLabel: 'TVA DEDUCTIBIL (21%)',
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        regimeTitle: 'Regim Fiscal Standard (TVA 21%)',
        legalNotice: 'Factură fiscală cu TVA 21% defalcat, deductibil integral pentru societăți comerciale.',
        grossEur: priceEur,
        grossRon: priceRon,
        netEur,
        netRon,
        vatEur,
        vatRon,
      };
    } else {
      // Regim de Marjă conform Art. 312 din Legea 227/2015 privind Codul Fiscal
      return {
        isVatDeductible: false,
        badgeLabel: 'REGIM DE MARJĂ (ART. 312)',
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        regimeTitle: 'Regim Special Bunuri Second-Hand (Marjă)',
        legalNotice: 'Facturare în regim de marjă de profit conform Art. 312 Cod Fiscal. TVA este inclusă în preț și nedeductibilă.',
        grossEur: priceEur,
        grossRon: priceRon,
        netEur: null,
        netRon: null,
        vatEur: null,
        vatRon: null,
      };
    }
  }, [vehicle]);

  // ─────────────────────────────────────────────────────────────────────────
  // Generare Acord Garanție de Rezervare (Opțional — Direct cu Parcul Vânzător)
  // ─────────────────────────────────────────────────────────────────────────
  const handleGenerateReservationGuarantee = () => {
    if (!vehicle || !activeThread) return;

    const brand = vehicle.brand;
    const model = vehicle.model;
    const version = vehicle.versionTrim ? ` ${vehicle.versionTrim}` : '';
    const vinText = vehicle.vin || 'Conform Talon/CIV';
    const clientName = activeThread.customer_name || 'Stimate Client';
    const priceEur = vehicle.priceEur.toLocaleString('ro-RO');

    // Valoare garanție de rezervare selectată opțional (500 EUR sau 1.000 EUR)
    const depositEur = selectedGuaranteeDeposit;
    const depositRon = convertEurToRon(depositEur).toLocaleString('ro-RO');

    const fiscalNote = vehicle.vatDeductible
      ? `Preț Brut cu 21% TVA: ${priceEur} EUR (TVA 21% deductibil)`
      : `Preț Final: ${priceEur} EUR (Regim de marjă second-hand conform art. 312 Cod Fiscal)`;

    const reservationTemplate = `Bună ziua, ${clientName},

Vă transmitem acordul oficial (opțional) privind rezervarea fermă a autovehiculului din stocul ${dealership}:

📋 DATE IDENTIFICARE VEHICUL:
• Autovehicul: ${brand} ${model}${version}
• An Fabricație / Rulaj: ${vehicle.year} • ${formatMileage(vehicle.mileageKm)}
• Serie Șasiu (VIN): ${vinText}
• Preț Convenit: ${fiscalNote}

🔒 CONDIȚII REZERVARE & GARANȚIE (OPȚIONAL):
• Procedură: ${RESERVATION_TERM} (Încheiată direct cu parcul vânzător)
• Cuantum Garanție: ${depositEur} EUR (sau echivalent ${depositRon} RON la cursul oficial BNR)
• Modalitate Plată: Virament bancar securizat în ${WARRANTY_TERM}
• Beneficiar Direct: ${dealership}${activeDealerProfile.cui ? ` (CUI: ${activeDealerProfile.cui})` : ''}
• Cont de Garanție EUR (IBAN): ${activeDealerProfile.ibanEur || 'RO35 BTRL 0120 4205 8482 2102'} (${activeDealerProfile.bankName} - ${activeDealerProfile.bankBranch || 'Sucursala Cluj-Napoca'})
• Cont de Garanție RON (IBAN): ${activeDealerProfile.ibanRon || 'RO88 BTRL 0120 1205 8482 2101'} (${activeDealerProfile.bankName} - ${activeDealerProfile.bankBranch || 'Sucursala Cluj-Napoca'})
• Perioadă Blocare Exclusivă Stoc: 5 zile calendaristice

Constituirea acestei garanții de rezervare este 100% OPȚIONALĂ și se derulează direct cu parcul auto ${dealership}. Prin achitarea garanției, autovehiculul este blocat exclusiv în favoarea dumneavoastră și retras temporar de la vânzare timp de 5 zile. Suma reprezintă avans confirmat și se deduce integral din factura finală de achiziție.

Vă rugăm să ne transmiteți confirmarea transferului bancar (ordinul de plată) răspunzând direct la acest e-mail pentru confirmarea blocării pe stoc.

Cu stimă,
Consilier Vânzări • ${dealership}`;

    onInsertReplySnippet(reservationTemplate);
    showToast(`📑 Acordul de Garanție de Rezervare (${depositEur} € • 5 Zile) a fost inserat în editorul de răspuns.`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Generare Ofertă Comercială Oficială (Strict 21% TVA sau Regim Marjă)
  // ─────────────────────────────────────────────────────────────────────────
  const handleGenerateOfficialOffer = () => {
    if (!vehicle || !activeThread) return;

    const brand = vehicle.brand;
    const model = vehicle.model;
    const clientName = activeThread.customer_name || 'Stimate Client';
    const vinText = vehicle.vin ? ` (VIN: ${vehicle.vin})` : '';

    let pricingBlock = '';
    if (pricingDetails?.isVatDeductible) {
      pricingBlock = `• Preț Net: ${pricingDetails.netEur?.toLocaleString('ro-RO')} EUR (+21% TVA: ${pricingDetails.vatEur?.toLocaleString('ro-RO')} EUR)
• Preț Total Brut (TVA 21% inclus): ${pricingDetails.grossEur.toLocaleString('ro-RO')} EUR (echiv. ${pricingDetails.grossRon.toLocaleString('ro-RO')} RON)
• Regim Fiscal: Factură cu TVA 21% deductibil pentru persoane juridice`;
    } else {
      pricingBlock = `• Preț Total de Vânzare: ${vehicle.priceEur.toLocaleString('ro-RO')} EUR (echiv. ${pricingDetails?.grossRon.toLocaleString('ro-RO')} RON)
• Regim Fiscal: Regimul special al marjei de profit (Art. 312 Cod Fiscal — TVA inclusă, nedeductibilă)`;
    }

    const offerTemplate = `Bună ziua, ${clientName},

Vă transmitem specificația și oferta oficială de preț pentru ${brand} ${model}${vinText}:

${pricingBlock}
• Kilometraj Certificat: ${formatMileage(vehicle.mileageKm)}
• An Fabricație / Transmisie: ${vehicle.year} • ${vehicle.transmission} (${vehicle.fuelType})
• Putere / Capacitate: ${vehicle.powerHp} CP • ${vehicle.engineCc} cm³
• Garanție Tehnică Inclusă: ${vehicle.warrantyMonths || 12} luni conform contract
• Metodă Tranzacționare Securizată: ${WARRANTY_TERM} / ${RESERVATION_TERM}

Pentru test-drive la showroom-ul nostru din Cluj-Napoca sau livrare gratuită pe platformă națională, vă stăm la dispoziție.

Cu respect,
Echipa de Vânzări • ${dealershipName}`;

    onInsertReplySnippet(offerTemplate);
    showToast('📑 Oferta oficială a fost inserată în editor.');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Generare Fișă Tehnică & Dotări
  // ─────────────────────────────────────────────────────────────────────────
  const handleInsertSpecs = () => {
    if (!vehicle) return;
    const specsTemplate = `Specificații Tehnice — ${vehicle.brand} ${vehicle.model} (${vehicle.year}):
• Motorizare: ${vehicle.engineCc} cm³ ${vehicle.fuelType}, ${vehicle.powerHp} CP
• Transmisie & Tracțiune: ${vehicle.transmission} • ${vehicle.drivetrain}
• Rulaj: ${formatMileage(vehicle.mileageKm)}
• Caroserie & Culoare: ${vehicle.bodyType} • ${vehicle.color}
• Serie Șasiu (VIN): ${vehicle.vin || 'Disponibil la cerere'}
• Garanție: ${vehicle.warrantyMonths || 12} luni`;

    onInsertReplySnippet(specsTemplate);
    showToast('📋 Fișa tehnică a fost inserată în mesaj.');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Asociere manuală vehicul la conversația curentă
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelectInventoryVehicle = async (targetVehicleId: string | null) => {
    setIsSubmittingLink(true);
    try {
      await onAssociateVehicle(targetVehicleId);
      setIsChangingVehicle(false);
    } catch {
      showToast('❌ Nu s-a putut actualiza asocierea vehiculului.');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  // Badge Status Stoc
  const renderStockBadge = (status?: VehicleItem['status']) => {
    const s = status || 'in_stock';
    if (s === 'in_stock') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Disponibil în Stoc</span>
        </span>
      );
    }
    if (s === 'reserved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide">
          <Shield className="w-3 h-3" />
          <span>Rezervat (Garanție)</span>
        </span>
      );
    }
    if (s === 'sold') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wide">
          <CheckCircle2 className="w-3 h-3" />
          <span>Vândut / Livrat</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide">
        <RefreshCw className="w-3 h-3" />
        <span>În Pregătire / RAR</span>
      </span>
    );
  };

  return (
    <>
      {/* Drawer Container (Slide-over) */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-[#121215] border-l border-[#27272a] shadow-2xl flex flex-col font-sans transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Panou Contextual Vehicul"
      >
        {/* ───────────────────────────────────────────────────────────────── */}
        {/* HEADER DRAWER                                                     */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-[#27272a] bg-[#16161a] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                <span>Fișă Contextuală Vehicul</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-normal">
                  PMH-302
                </span>
              </h3>
              <p className="text-[11px] text-[#71717a] truncate">
                {vehicle ? `${vehicle.brand} ${vehicle.model} • Stoc #${vehicle.stockNumber || getStockNumber(vehicle)}` : 'Niciun vehicul asociat'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsChangingVehicle((prev) => !prev)}
              title="Asociază sau schimbă mașina din stoc"
              className={`p-2 rounded-lg text-xs transition-colors ${
                isChangingVehicle 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
              }`}
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Închide panoul"
              className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* SECȚIUNE: ASOCIERE MANUALĂ / SELECTOR DROPDOWN STOC                */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {isChangingVehicle && (
          <div className="p-4 bg-[#18181c] border-b border-[#27272a] space-y-3 shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Asociază Vehicul din Stocul Parcului</span>
              </span>
              {vehicle && (
                <button
                  onClick={() => handleSelectInventoryVehicle(null)}
                  disabled={isSubmittingLink}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Unlink className="w-3 h-3" />
                  <span>Dezasociază</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Caută după marcă, model, VIN sau stoc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {filteredInventory.length === 0 ? (
                <p className="text-center py-4 text-xs text-[#71717a]">
                  Niciun vehicul găsit conform căutării.
                </p>
              ) : (
                filteredInventory.map((item) => {
                  const isCurrent = vehicle?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isCurrent && handleSelectInventoryVehicle(item.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between gap-2 transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : 'bg-[#121215] border-[#27272a] hover:border-[#3f3f46] text-[#e4e4e7]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">
                          {item.brand} {item.model} <span className="text-[10px] text-[#a1a1aa]">({item.year})</span>
                        </div>
                        <div className="text-[10px] text-[#71717a] font-mono truncate">
                          VIN: {item.vin || 'Nespecificat'} • #{item.stockNumber || getStockNumber(item)}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-emerald-400">
                          {item.priceEur.toLocaleString('ro-RO')} €
                        </div>
                        <div className="text-[9px] text-[#71717a]">
                          {item.vatDeductible ? 'TVA 21%' : 'Regim Marjă'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* CORP CONȚINUT DRAWER (SCROLLABLE)                                 */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!vehicle ? (
            /* Caz: Firul nu are mașină asociată */
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mx-auto text-amber-400">
                <Car className="w-8 h-8 opacity-60" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  Niciun vehicul asociat la acest fir
                </h4>
                <p className="text-xs text-[#a1a1aa] max-w-xs mx-auto leading-relaxed">
                  Mesajul nu are o mașină detectată automat din baza de date. Poți asocia manual un autovehicul din inventar pentru a genera oferte și acorduri de rezervare.
                </p>
              </div>
              <button
                onClick={() => setIsChangingVehicle(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all transform active:scale-95"
              >
                <Link2 className="w-4 h-4" />
                <span>Asociază Vehicul din Stoc</span>
              </button>
            </div>
          ) : (
            /* Caz: Vehicul Asociat — Fișă Completă PMH-302 */
            <>
              {/* 1. Header Card Vehicul & Badge Stoc */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {vehicle.brand} {vehicle.model}
                    </h2>
                    {vehicle.versionTrim && (
                      <p className="text-xs text-[#a1a1aa]">
                        {vehicle.versionTrim}
                      </p>
                    )}
                  </div>
                  {renderStockBadge(vehicle.status)}
                </div>

                {/* Serie Șasiu & Număr Stoc */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {vehicle.vin && (
                    <button
                      onClick={() => handleCopyVin(vehicle.vin)}
                      title="Apasă pentru a copia seria de șasiu"
                      className="inline-flex items-center gap-1.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] px-2.5 py-1 rounded-md text-[#d4d4d8] font-mono text-[11px] transition-colors"
                    >
                      <span>VIN: {vehicle.vin}</span>
                      {copiedVin ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#71717a]" />
                      )}
                    </button>
                  )}
                  <span className="text-[11px] text-[#71717a] font-mono bg-[#18181b] border border-[#27272a] px-2 py-1 rounded-md">
                    Stoc: #{vehicle.stockNumber || getStockNumber(vehicle)}
                  </span>
                </div>
              </div>

              {/* 2. Galerie Foto cu Placeholder Blur-Up */}
              <div className="space-y-2">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-[#27272a] group select-none">
                  {/* Blur-Up Placeholder Skeleton */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col items-center justify-center transition-opacity duration-500 ${
                      isImageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                      <Car className="w-10 h-10 text-amber-500/30" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">
                        RXM AUTOMOBILE CLUJ
                      </span>
                    </div>
                  </div>

                  {/* Imagine Principală cu Blur-Up Transition */}
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      onLoad={() => setIsImageLoaded(true)}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.includes('/rxm/cars/')) {
                          target.src = target.src.replace('/rxm/cars/', '/cars/');
                        }
                      }}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        isImageLoaded 
                          ? 'blur-0 scale-100 opacity-100' 
                          : 'blur-md scale-105 opacity-40'
                      }`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <Car className="w-10 h-10 text-[#3f3f46] mb-2" />
                      <span className="text-xs text-[#71717a]">Fotografii în curs de actualizare</span>
                    </div>
                  )}

                  {/* Butoane Navigare Galerie Foto */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevPhoto}
                        aria-label="Fotografia anterioară"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        aria-label="Fotografia următoare"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Badge Contor Fotografii */}
                  {galleryImages.length > 0 && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10">
                      {activePhotoIndex + 1} / {galleryImages.length}
                    </div>
                  )}
                </div>

                {/* Strip Miniaturi Galerie (Thumbnails) */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {galleryImages.slice(0, 10).map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (idx !== activePhotoIndex) {
                            setIsImageLoaded(false);
                            setActivePhotoIndex(idx);
                          }
                        }}
                        className={`relative w-14 h-9 rounded-md overflow-hidden flex-shrink-0 border transition-all ${
                          idx === activePhotoIndex
                            ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105'
                            : 'border-[#27272a] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Miniatură ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    {galleryImages.length > 10 && (
                      <div className="w-14 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[10px] text-[#71717a] font-mono shrink-0">
                        +{galleryImages.length - 10}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Preț Defalcat — Strict 21% TVA vs Regim Marjă (Art. 312 Cod Fiscal) */}
              <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Structură Financiară & Preț
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pricingDetails?.badgeBg}`}>
                    {pricingDetails?.badgeLabel}
                  </span>
                </div>

                {/* Preț Principal */}
                <div className="flex items-baseline justify-between border-b border-[#27272a] pb-2.5">
                  <div>
                    <span className="text-2xl font-black text-white tracking-tight">
                      {vehicle.priceEur.toLocaleString('ro-RO')} €
                    </span>
                    <span className="text-xs text-[#71717a] ml-2 font-mono">
                      (~ {pricingDetails?.grossRon.toLocaleString('ro-RO')} RON)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#a1a1aa] font-medium">
                    {pricingDetails?.isVatDeductible ? 'TVA 21% Inclus' : 'Preț Final Facturat'}
                  </span>
                </div>

                {/* Defalcare Fiscală */}
                {pricingDetails?.isVatDeductible ? (
                  /* Cazul 1: TVA Deductibil 21% */
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>Bază Impozabilă (Preț Net):</span>
                      <strong className="text-white font-mono">{pricingDetails.netEur?.toLocaleString('ro-RO')} €</strong>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>TVA deductibil (strict 21%):</span>
                      </span>
                      <strong className="text-emerald-400 font-mono">+{pricingDetails.vatEur?.toLocaleString('ro-RO')} €</strong>
                    </div>
                    <div className="pt-1 text-[11px] text-[#71717a] leading-tight">
                      ℹ️ {pricingDetails.legalNotice}
                    </div>
                  </div>
                ) : (
                  /* Cazul 2: Regim de Marjă (Art. 312) - cele mai multe vehicule */
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block mb-0.5">Regimul special al marjei de profit</strong>
                        {pricingDetails?.legalNotice}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#71717a]">
                      💡 Cumpărătorul achită prețul total afișat, fără defalcare de TVA pe factură.
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Butoane Acțiuni Rapide Vânzări */}
              <div className="space-y-2.5 pt-1">
                {/* Acord Garanție de Rezervare (Opțional — Direct cu Parcul Vânzător) */}
                <div className="bg-[#18181c] border border-amber-500/30 rounded-2xl p-3.5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                          <span>Garanție de Rezervare</span>
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                            Opțional
                          </span>
                        </div>
                        <div className="text-[10px] text-[#71717a]">
                          Blocare 5 zile • Direct cu {dealership}
                        </div>
                      </div>
                    </div>

                    {/* Selector Avans Recomandat (500 € / 1.000 €) */}
                    <div className="flex items-center gap-1 bg-[#121215] p-0.5 rounded-lg border border-[#27272a]">
                      <button
                        type="button"
                        onClick={() => setSelectedGuaranteeDeposit(500)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                          selectedGuaranteeDeposit === 500
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'text-[#a1a1aa] hover:text-white'
                        }`}
                      >
                        500 €
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGuaranteeDeposit(1000)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                          selectedGuaranteeDeposit === 1000
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'text-[#a1a1aa] hover:text-white'
                        }`}
                      >
                        1.000 €
                      </button>
                    </div>
                  </div>

                  {/* Detalii virament direct parc */}
                  <div className="text-[11px] bg-[#121215] border border-[#27272a] rounded-xl p-2.5 space-y-1 text-[#a1a1aa]">
                    <div className="flex justify-between items-center">
                      <span>Avans Recomandat:</span>
                      <span className="text-white font-mono font-bold">
                        {selectedGuaranteeDeposit} € <span className="text-[10px] text-[#71717a] font-normal">(~{convertEurToRon(selectedGuaranteeDeposit).toLocaleString('ro-RO')} RON)</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Bancă & Termen:</span>
                      <span className="text-zinc-300 font-medium">{activeDealerProfile.bankName} • 5 zile blocare</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-0.5 border-t border-[#27272a]/60">
                      <span>Cont Garanție:</span>
                      <span className="text-amber-400 font-mono font-semibold truncate ml-2">
                        {activeDealerProfile.ibanEur || 'RO35 BTRL 0120 4205 8482 2102'}
                      </span>
                    </div>
                  </div>

                  {/* Buton Inserează Acord Rezervare */}
                  <button
                    type="button"
                    onClick={handleGenerateReservationGuarantee}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 transition-all transform active:scale-98"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Inserează Acord Rezervare ({selectedGuaranteeDeposit} € • 5 Zile)</span>
                  </button>
                </div>

                {/* Buton 2: Inserează Ofertă Oficială */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateOfficialOffer}
                    className="bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-[#f4f4f5] hover:text-white text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ofertă Oficială</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertSpecs}
                    className="bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-[#f4f4f5] hover:text-white text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Fișă Tehnică</span>
                  </button>
                </div>

                {/* Buton Compozitor Inteligent de Ofertă (PMH-303) */}
                {onOpenOfferComposer && (
                  <button
                    type="button"
                    onClick={onOpenOfferComposer}
                    className="w-full bg-[#18181c] hover:bg-[#222226] border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-medium"
                  >
                    <Calculator className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deschide Compozitor Ofertă (Simulator Rate & PDF)</span>
                  </button>
                )}

                {/* Buton 3: Deschide în Catalog / Admin */}
                {onSelectVehicleInCatalog && (
                  <button
                    type="button"
                    onClick={() => onSelectVehicleInCatalog(vehicle.id)}
                    className="w-full bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-xs text-[#a1a1aa] hover:text-white py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vezi Fișa Completă în Showroom / Admin</span>
                  </button>
                )}
              </div>

              {/* 5. Grilă Specificații Tehnice */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Specificații Esențiale
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">An Fabricație</div>
                      <div className="font-semibold text-white">{vehicle.year}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center gap-2.5">
                    <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Kilometraj</div>
                      <div className="font-semibold text-white">{formatMileage(vehicle.mileageKm)}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center gap-2.5">
                    <Fuel className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Combustibil</div>
                      <div className="font-semibold text-white">{vehicle.fuelType}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center gap-2.5">
                    <Cog className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Transmisie</div>
                      <div className="font-semibold text-white">{vehicle.transmission}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Putere & Motor</div>
                      <div className="font-semibold text-white">{vehicle.powerHp} CP • {vehicle.engineCc} cm³</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center gap-2.5">
                    <Car className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Caroserie & Tracțiune</div>
                      <div className="font-semibold text-white">{vehicle.bodyType} • {vehicle.drivetrain}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Dotări & Echipare Sumar */}
              {vehicle.features && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Dotări Selectate
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ...(vehicle.features.safety || []),
                      ...(vehicle.features.comfort || []),
                      ...(vehicle.features.multimedia || []),
                    ].slice(0, 10).map((feat, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-[#18181c] border border-[#27272a] text-[#d4d4d8] px-2 py-1 rounded-md"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Backdrop pentru dispozitive mobile & ecrane înguste */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm sm:hidden"
        />
      )}
    </>
  );
};
