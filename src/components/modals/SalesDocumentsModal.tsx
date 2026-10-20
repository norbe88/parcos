import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, FileText, Printer, ShieldCheck, CheckCircle2, 
  DollarSign, User, MapPin, Phone, CreditCard, ChevronRight,
  Download, Loader2, Key, Fuel, PackageCheck,
  MessageSquare, ClipboardCheck, Wrench, Car
} from 'lucide-react';
import { VehicleItem, SEED_DEALER, DealerProfile } from '../../db/seed';
import { BuyerData } from '../print/types';
import { PrintableSaleContract } from '../print/PrintableSaleContract';
import { PrintableProformaInvoice } from '../print/PrintableProformaInvoice';
import { PrintableDeliveryProtocol } from '../print/PrintableDeliveryProtocol';
import { PrintableWarrantyCertificate } from '../print/PrintableWarrantyCertificate';
import { PrintableMarginCalculationNote } from '../print/PrintableMarginCalculationNote';
import { PrintableTechnicalInspectionSheet } from '../print/PrintableTechnicalInspectionSheet';
import { PrintableGdprConsent } from '../print/PrintableGdprConsent';
import { 
  getStandardDocumentFileName, 
  printWithDocumentTitle, 
  downloadElementAsPdf 
} from '../../utils/pdfGenerator';
import { ClientIdOcrScanner } from './ClientIdOcrScanner';
import { ParsedClientIdDocument } from '../../utils/clientIdOcrEngine';

export const DEFAULT_MANUAL_CAR: VehicleItem = {
  id: 'manual-doc-vehicle',
  stockNumber: 'RXM-MANUAL',
  brand: 'Renault',
  model: 'Megane',
  versionTrim: '1.5 dCi Energy',
  year: 2018,
  mileageKm: 145000,
  priceEur: 8500,
  vatDeductible: false,
  fuelType: 'Diesel',
  transmission: 'Manuală',
  powerHp: 110,
  engineCc: 1461,
  bodyType: 'Break',
  drivetrain: 'Față',
  color: 'Gri Metalizat',
  vin: 'VF1KZ000000000000',
  isVinPublic: true,
  warrantyMonths: 12,
  status: 'in_stock',
  images: [],
  features: { safety: [], comfort: [], multimedia: [] },
  description: ''
};

interface SalesDocumentsModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  cars?: VehicleItem[];
  onClose: () => void;
  showToast: (msg: string) => void;
  dealer?: DealerProfile;
  initialBuyerData?: Partial<BuyerData>;
  initialDocTab?: 'proforma' | 'protocol' | 'warranty' | 'inspection' | 'margin' | 'contract' | 'gdpr';
}

export const SalesDocumentsModal: React.FC<SalesDocumentsModalProps> = ({
  isOpen,
  car,
  cars = [],
  onClose,
  showToast,
  dealer = SEED_DEALER,
  initialBuyerData,
  initialDocTab
}) => {
  // Stare vehicul editabil direct în documente (permite modificarea oricărui VIN, mărci etc.)
  const [editableCar, setEditableCar] = useState<VehicleItem>(() => {
    if (car) return { ...car };
    return { ...DEFAULT_MANUAL_CAR };
  });

  // Sincronizare când se schimbă prop-ul car
  useEffect(() => {
    if (car) {
      setEditableCar({ ...car });
    }
  }, [car]);

  const [activeDocTab, setActiveDocTab] = useState<'proforma' | 'protocol' | 'warranty' | 'inspection' | 'margin' | 'contract' | 'gdpr'>(initialDocTab || 'proforma');
  const [invoiceType, setInvoiceType] = useState<'proforma' | 'fiscal'>('proforma');
  const [billingType, setBillingType] = useState<'full_car' | 'deposit'>('full_car');
  const [proformaDepositEur, setProformaDepositEur] = useState<number>(500);
  const [proformaRegime, setProformaRegime] = useState<'margin_scheme' | 'standard'>('margin_scheme');
  const [isDownloading, setIsDownloading] = useState(false);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);
  
  // Stare formular date cumpărător & accesorii proces-verbal de predare
  const [buyerData, setBuyerData] = useState<BuyerData>(() => ({
    fullName: 'Popescu Mihai',
    cnpOrCui: '1850412125890',
    idSeries: 'CJ',
    idNumber: '874521',
    address: 'Str. Constantin Brâncuși nr. 45, Ap. 12',
    county: 'Cluj',
    phone: '0744 123 456',
    agreedPriceEur: car ? car.priceEur : 14500,
    agreedPriceRon: car ? Math.round(car.priceEur * 4.975) : 72137,
    exchangeRate: 4.9750,
    contractDate: new Date().toISOString().split('T')[0],
    invoiceNumber: car ? `RXM-FT-${new Date().getFullYear()}-${car.stockNumber || car.vin.slice(-4).toUpperCase()}` : `RXM-FT-${new Date().getFullYear()}-001`,
    deliveryMileageKm: car ? car.mileageKm : 145000,
    warrantyStartDate: new Date().toISOString().split('T')[0],
    // Accesorii Proces-Verbal Predare-Primire (Standard: Toate bifate)
    keysCount: 2,
    keysCustomText: '',
    hasRegistrationCertificate: true,
    hasCivOrOriginDocs: true,
    hasTaxInvoice: true,
    hasWarrantyCertificate: true,
    hasMedicalKitTriangles: true,
    hasSpareWheelOrKit: true,
    hasMountedTiresGoodCondition: true,
    hasUserManualServiceBook: true,
    fuelLevel: 'Minim 1/4 rezervor',
    deliveryNotes: '',
    // Inspecție Tehnică Showroom (100+ Puncte)
    inspectorName: 'Ing. Mihai Radu (Inspector Tehnic Auto)',
    tireTreadFrontMm: 6.5,
    tireTreadRearMm: 6.2,
    brakePadsFrontPct: 25,
    brakePadsRearPct: 20,
    paintThicknessMicronsAvg: 118,
    obdScanResult: 'clean',
    generalConditionRating: 'foarte_buna',
    inspectionNotes: ''
  }));

  // Sincronizare automată când vehiculul selectat se schimbă
  useEffect(() => {
    if (car) {
      setBuyerData(prev => ({
        ...prev,
        agreedPriceEur: prev.agreedPriceEur || car.priceEur,
        agreedPriceRon: prev.agreedPriceRon || Math.round(car.priceEur * (prev.exchangeRate || 4.975)),
        deliveryMileageKm: car.mileageKm,
        invoiceNumber: prev.invoiceNumber || `RXM-FT-${new Date().getFullYear()}-${car.stockNumber || car.vin.slice(-4).toUpperCase()}`
      }));
      // Standard regim marjă (ajustabil oricând de dealer)
      setProformaRegime('margin_scheme');
    }
  }, [car]);

  // Sincronizare date cumpărător pre-completate din CRM Showroom / Lead Kanban
  useEffect(() => {
    if (initialBuyerData) {
      setBuyerData(prev => ({
        ...prev,
        ...initialBuyerData,
        fullName: initialBuyerData.fullName || prev.fullName,
        phone: initialBuyerData.phone || prev.phone,
        agreedPriceEur: initialBuyerData.agreedPriceEur || (car ? car.priceEur : prev.agreedPriceEur),
        agreedPriceRon: initialBuyerData.agreedPriceRon || (car ? Math.round(car.priceEur * (prev.exchangeRate || 4.975)) : prev.agreedPriceRon)
      }));
      setWasAutoFilled(true);
    }
  }, [initialBuyerData, car]);

  // Sincronizare tab inițial documente (ex: proforma)
  useEffect(() => {
    if (initialDocTab) {
      setActiveDocTab(initialDocTab);
    }
  }, [initialDocTab]);

  // 🔒 Lock background scroll pe body când modalul este deschis (previne rubber-banding pe iOS)
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('has-sales-docs-open');
    return () => {
      document.body.style.overflow = orig;
      document.body.classList.remove('has-sales-docs-open');
    };
  }, [isOpen]);

  if (!isOpen || !car) return null;

  const handlePriceEurChange = (valEur: number) => {
    const ron = Math.round(valEur * buyerData.exchangeRate);
    setBuyerData(prev => ({ ...prev, agreedPriceEur: valEur, agreedPriceRon: ron }));
  };

  const handleOcrSuccess = (data: ParsedClientIdDocument) => {
    setBuyerData(prev => ({
      ...prev,
      fullName: data.fullName,
      cnpOrCui: data.cnp,
      idSeries: data.idSeries,
      idNumber: data.idNumber,
      address: data.address,
      county: data.county
    }));
    setWasAutoFilled(true);
    setTimeout(() => setWasAutoFilled(false), 5000);
  };


  // Nomenclatură standardizată conform specificațiilor RXM
  const currentFileName = getStandardDocumentFileName({
    docType: activeDocTab === 'proforma' 
      ? (invoiceType === 'fiscal' ? 'tax_invoice' : 'proforma') 
      : (activeDocTab === 'inspection' ? 'technical_inspection' : activeDocTab),
    brand: editableCar.brand,
    model: editableCar.model,
    stockNumber: editableCar.stockNumber,
    vin: editableCar.vin,
    date: buyerData.contractDate,
    invoiceNumber: buyerData.invoiceNumber
  });

  const handlePrint = () => {
    printWithDocumentTitle(currentFileName);
    showToast(`Pregătit pentru print / Salvare PDF: "${currentFileName}.pdf"`);
  };

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    setIsDownloading(true);
    showToast(`Se generează fișierul "${currentFileName}.pdf"...`);
    try {
      await downloadElementAsPdf(paperRef.current, currentFileName, { orientation: 'portrait' });
      showToast(`Documentul "${currentFileName}.pdf" a fost descărcat cu succes!`);
    } catch (err) {
      console.error('Download PDF error:', err);
      showToast('Eroare descărcare directă. Deschidem dialogul de salvare ca PDF.');
      printWithDocumentTitle(currentFileName);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendWhatsApp = () => {
    const rawPhone = (buyerData.phone || '').trim();
    let phoneDigits = rawPhone.replace(/[^0-9]/g, '');
    
    // Normalizare automată număr de telefon RO
    if (phoneDigits.startsWith('07') && phoneDigits.length === 10) {
      phoneDigits = '40' + phoneDigits.slice(1);
    } else if (phoneDigits.startsWith('7') && phoneDigits.length === 9) {
      phoneDigits = '40' + phoneDigits;
    }

    const clientGreeting = buyerData.fullName ? `Bună ziua, ${buyerData.fullName.trim()}!` : 'Bună ziua!';
    const carTitle = `${editableCar.brand} ${editableCar.model} ${editableCar.versionTrim || ''}`.trim();
    let text = '';

    if (activeDocTab === 'proforma') {
      if (billingType === 'deposit') {
        text = `${clientGreeting}\n\nVă transmitem din partea ${dealer.name} factura proformă pentru avansul de rezervare al autoturismului *${carTitle}* (VIN: ${editableCar.vin}).\n\n` +
          `💰 *Sumă Avans:* ${proformaDepositEur} EUR (aprox. ${Math.round(proformaDepositEur * (buyerData.exchangeRate || 4.975)).toLocaleString('ro-RO')} RON)\n` +
          `🏦 *Bancă:* ${dealer.bankName}\n` +
          `💳 *IBAN RON:* ${dealer.ibanRon}\n` +
          (dealer.ibanEur ? `💶 *IBAN EUR:* ${dealer.ibanEur}\n` : '') +
          `📋 *Beneficiar:* ${dealer.name} (CUI: ${dealer.cui})\n\n` +
          `După efectuarea plății, vă rugăm să ne transmiteți confirmarea. Vă mulțumim!`;
      } else {
        const priceRonFormatted = buyerData.agreedPriceRon.toLocaleString('ro-RO');
        const priceEurFormatted = buyerData.agreedPriceEur.toLocaleString('ro-RO');
        const regimeLabel = proformaRegime === 'margin_scheme' ? 'Regimul Marjei (Art. 312 Cod Fiscal)' : 'Regim TVA 21% Deductibil';
        text = `${clientGreeting}\n\nVă transmitem ${invoiceType === 'fiscal' ? 'factura fiscală' : 'factura proformă'} pentru achiziția autoturismului *${carTitle}* (VIN: ${editableCar.vin}).\n\n` +
          `💰 *Total de plată:* ${priceEurFormatted} EUR (${priceRonFormatted} RON)\n` +
          `⚖️ *Regim fiscal:* ${regimeLabel}\n` +
          `🏦 *Bancă:* ${dealer.bankName}\n` +
          `💳 *IBAN RON:* ${dealer.ibanRon}\n` +
          (dealer.ibanEur ? `💶 *IBAN EUR:* ${dealer.ibanEur}\n` : '') +
          `📋 *Beneficiar:* ${dealer.name} (CUI: ${dealer.cui})\n\n` +
          `Vă mulțumim pentru colaborare!\nEchipa ${dealer.name}`;
      }
    } else if (activeDocTab === 'inspection') {
      text = `${clientGreeting}\n\nVă punem la dispoziție Raportul de Inspecție Tehnică Showroom (100+ Puncte Verificate) pentru *${carTitle}* (VIN: ${editableCar.vin}).\n\n` +
        `🔍 *Rulaj certificat:* ${(buyerData.deliveryMileageKm || editableCar.mileageKm).toLocaleString('ro-RO')} km\n` +
        `🛡️ *Calificativ General:* ${buyerData.generalConditionRating === 'exceptional' ? 'Excepțional' : buyerData.generalConditionRating === 'buna' ? 'Bună' : 'Foarte Bună (Standard Showroom)'}\n` +
        `⚡ *Diagnoză Computerizată:* ${buyerData.obdScanResult === 'clean' ? 'Zero Erori Active (Curat)' : 'Parametri Nominați'}\n` +
        `🎨 *Grosime Medie Vopsea:* ${buyerData.paintThicknessMicronsAvg ?? 118} μm\n` +
        `🛞 *Profil Anvelope:* Față ${buyerData.tireTreadFrontMm ?? 6.5} mm / Spate ${buyerData.tireTreadRearMm ?? 6.2} mm\n\n` +
        `Autoturismul este gata de livrare în showroom-ul ${dealer.name}!`;
    } else if (activeDocTab === 'warranty') {
      text = `${clientGreeting}\n\nVă transmitem Certificatul Oficial de Garanție (12 Luni / 10.000 KM) pentru autoturismul *${carTitle}* (VIN: ${editableCar.vin}), emis de ${dealer.name} conform OUG 140/2021.\n\n` +
        `🛡️ Garanția acoperă ansamblul motor, cutie de viteze și componentele principale.\nVă dorim drumuri bune și fără evenimente!`;
    } else if (activeDocTab === 'protocol') {
      text = `${clientGreeting}\n\nVă transmitem Procesul-Verbal de Predare-Primire și confirmarea accesoriilor predate pentru autoturismul *${carTitle}* (VIN: ${editableCar.vin}).\n\n` +
        `🔑 Chei originale predate: ${buyerData.keysCount ?? 2}\n` +
        `📍 Kilometraj la livrare: ${(buyerData.deliveryMileageKm || editableCar.mileageKm).toLocaleString('ro-RO')} km\n` +
        `Cu stimă,\n${dealer.name}`;
    } else if (activeDocTab === 'gdpr') {
      text = `${clientGreeting}\n\nVă transmitem din partea ${dealer.name} Acordul privind Prelucrarea Datelor cu Caracter Personal (GDPR - Regulament UE 2016/679) aferent tranzacției autoturismului *${carTitle}* (VIN: ${editableCar.vin}).\n\n` +
        `📄 Datele dvs. sunt prelucrate în deplină siguranță și conformitate, exclusiv pentru emiterea facturii, a contractului și a documentelor legale de vânzare.\n\n` +
        `Vă mulțumim pentru colaborare!\nEchipa ${dealer.name}`;
    } else {
      text = `${clientGreeting}\n\nVă transmitem detaliile și actele de vânzare pentru autoturismul *${carTitle}* (VIN: ${editableCar.vin}) de la ${dealer.name}.\n\nVă stăm cu plăcere la dispoziție!`;
    }

    const encodedText = encodeURIComponent(text);
    const waUrl = phoneDigits 
      ? `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    showToast(phoneDigits ? `Se deschide WhatsApp către ${phoneDigits}...` : 'Se deschide WhatsApp (alege contactul din listă)...');
  };

  const modalContent = (
    <div className="sales-docs-modal-container fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0.5rem))] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-6xl max-h-[92dvh] sm:max-h-[94vh] overflow-y-auto bg-[#121215] border border-white/10 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-3.5 sm:p-5 border-b border-white/[0.08] flex flex-col md:flex-row gap-3 md:items-center justify-between sticky top-0 bg-[#121215]/95 backdrop-blur-md z-20 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                Generator Documente Vânzare & Garanție (1-Click Legal)
              </h3>
              <p className="text-xs text-zinc-400">
                Pachet legal pentru <span className="text-amber-300 font-semibold">{editableCar.brand} {editableCar.model}</span> (VIN: <span className="font-mono text-white font-bold">{editableCar.vin}</span>)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buton Trimitere Directă WhatsApp */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-2.5 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all min-h-[44px] touch-manipulation cursor-pointer"
              title="Trimite link-ul și detaliile documentului direct pe WhatsApp către client"
            >
              <MessageSquare className="w-4 h-4 text-black fill-black/20" />
              <span>Trimite pe WhatsApp</span>
            </button>

            {/* Buton Descărcare Directă PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 active:scale-[0.98] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all min-h-[44px] touch-manipulation cursor-pointer"
              title={`Descarcă fișierul ${currentFileName}.pdf`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Se generează...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descarcă PDF</span>
                </>
              )}
            </button>

            {/* Buton Tipărire / Salvare prin Dialog Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all min-h-[44px] touch-manipulation cursor-pointer"
              title={`Tipărește sau salvează ca PDF (${currentFileName}.pdf)`}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Tipărește</span>
            </button>

            {/* Buton Închidere */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 hover:text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Închide generatorul de documente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corp: Formular Date Cumpărător + Sub-Tabs Documente */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Panou Stânga: Formular Cumpărător & Setări Contract (4 coloane pe ecran mare) */}
          <div className="lg:col-span-4 space-y-4 no-print">
            {/* 🚗 Panou Date Autovehicul & Serie Șasiu (VIN) — Editare Directă & Switcher */}
            <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  <span>Date Autovehicul & Serie Șasiu (VIN)</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {editableCar.vin ? `${editableCar.vin.trim().length}/17 car.` : 'Fără VIN'}
                </span>
              </div>

              {/* Selector Mașină din Parc sau Manual */}
              {cars.length > 0 && (
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Alege din stoc sau editează liber:</label>
                  <select
                    value={cars.some(c => c.id === editableCar.id) ? editableCar.id : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        // Rămâne pe editare liberă
                      } else {
                        const selected = cars.find(c => c.id === val);
                        if (selected) {
                          setEditableCar({ ...selected });
                          setBuyerData(prev => ({
                            ...prev,
                            agreedPriceEur: selected.priceEur,
                            agreedPriceRon: Math.round(selected.priceEur * prev.exchangeRate),
                            deliveryMileageKm: selected.mileageKm,
                            invoiceNumber: `RXM-FT-${new Date().getFullYear()}-${selected.stockNumber || selected.vin.slice(-4).toUpperCase()}`
                          }));
                          showToast(`S-a încărcat vehiculul: ${selected.brand} ${selected.model} (VIN: ${selected.vin})`);
                        }
                      }
                    }}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="custom">✏️ Editare Manuală / Vehicul Personalizat</option>
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} ({c.year}) — VIN: {c.vin}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Serie Șasiu (VIN) — Câmp principal modificabil de dealer */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                    <span>Serie Șasiu (VIN)</span>
                    <span className="text-[10px] text-zinc-400 font-normal">• Obligatoriu DITL/RAR</span>
                  </label>
                  {editableCar.vin.trim().length === 17 ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> 17/17 caractere
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-medium">
                      {editableCar.vin.trim().length}/17 car.
                    </span>
                  )}
                </div>
                <input 
                  type="text"
                  value={editableCar.vin}
                  onChange={(e) => {
                    const cleanVin = e.target.value.toUpperCase().replace(/\s+/g, '');
                    setEditableCar(prev => ({ ...prev, vin: cleanVin }));
                  }}
                  className="w-full bg-[#18181b] border-2 border-amber-500/50 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-amber-300 tracking-wider mt-1 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  placeholder="Ex: VF1... sau WBA... (17 caractere)"
                  maxLength={17}
                />
              </div>

              {/* Marcă & Model */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Marcă</label>
                  <input 
                    type="text"
                    value={editableCar.brand}
                    onChange={(e) => setEditableCar(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="Ex: Audi, BMW, Renault"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Model</label>
                  <input 
                    type="text"
                    value={editableCar.model}
                    onChange={(e) => setEditableCar(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="Ex: A6, 320d, Megane"
                  />
                </div>
              </div>

              {/* Versiune / Echipare */}
              <div>
                <label className="text-[11px] text-zinc-400 font-medium">Versiune / Motorizare</label>
                <input 
                  type="text"
                  value={editableCar.versionTrim || ''}
                  onChange={(e) => setEditableCar(prev => ({ ...prev, versionTrim: e.target.value }))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                  placeholder="Ex: 2.0 TDI S-Line, 1.5 dCi Energy"
                />
              </div>

              {/* An, Rulaj, Cilindree, Putere */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">An Fabricație</label>
                  <input 
                    type="number"
                    value={editableCar.year || ''}
                    onChange={(e) => setEditableCar(prev => ({ ...prev, year: Number(e.target.value) || new Date().getFullYear() }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="2018"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Rulaj (Km)</label>
                  <input 
                    type="number"
                    value={editableCar.mileageKm || ''}
                    onChange={(e) => {
                      const km = Number(e.target.value) || 0;
                      setEditableCar(prev => ({ ...prev, mileageKm: km }));
                      setBuyerData(prev => ({ ...prev, deliveryMileageKm: km }));
                    }}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="145000"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Cilindree (cmc)</label>
                  <input 
                    type="number"
                    value={editableCar.engineCc || ''}
                    onChange={(e) => setEditableCar(prev => ({ ...prev, engineCc: Number(e.target.value) || 0 }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="1995"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Putere (CP)</label>
                  <input 
                    type="number"
                    value={editableCar.powerHp || ''}
                    onChange={(e) => setEditableCar(prev => ({ ...prev, powerHp: Number(e.target.value) || 0 }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* Combustibil, Serie CIV, Număr Înmatriculare */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Combustibil</label>
                  <select
                    value={editableCar.fuelType}
                    onChange={(e) => setEditableCar(prev => ({ ...prev, fuelType: e.target.value as any }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Benzină">Benzină</option>
                    <option value="Hibrid">Hibrid</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Serie CIV</label>
                  <input 
                    type="text"
                    value={editableCar.civSeries || ''}
                    onChange={(e) => setEditableCar(prev => ({ ...prev, civSeries: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white uppercase font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="X123456"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Nr. Înmatr./Roșu</label>
                  <input 
                    type="text"
                    value={editableCar.licensePlate || ''}
                    onChange={(e) => setEditableCar(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white uppercase font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="CJ 01 RXM"
                  />
                </div>
              </div>
            </div>

            {/* Scanner Agentic OCR Buletin / C.I. (GDPR Compliant) */}
            <ClientIdOcrScanner 
              onSuccess={handleOcrSuccess}
              showToast={showToast}
            />

            <div className={`bg-black/40 border p-4 rounded-xl space-y-3 transition-all duration-500 ${
              wasAutoFilled 
                ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' 
                : 'border-white/[0.08]'
            }`}>
              <div className="text-xs font-bold text-white flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Date Cumpărător (Persoană Fizică / Juridică)</span>
                </div>
                {wasAutoFilled && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                    Autocompletat din Buletin
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium">Nume și Prenume / Companie</label>
                <input 
                  type="text"
                  value={buyerData.fullName}
                  onChange={(e) => setBuyerData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                  placeholder="Ex: Popescu Mihai"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">C.N.P. / C.U.I.</label>
                  <input 
                    type="text"
                    value={buyerData.cnpOrCui}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, cnpOrCui: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="185..."
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Act Identitate (CI/Pașaport)</label>
                  <div className="flex gap-1 mt-0.5">
                    <input 
                      type="text"
                      value={buyerData.idSeries}
                      onChange={(e) => setBuyerData(prev => ({ ...prev, idSeries: e.target.value.toUpperCase() }))}
                      className="w-12 bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center uppercase focus:border-amber-400 focus:outline-none"
                      placeholder="CJ"
                    />
                    <input 
                      type="text"
                      value={buyerData.idNumber}
                      onChange={(e) => setBuyerData(prev => ({ ...prev, idNumber: e.target.value }))}
                      className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                      placeholder="123456"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] text-zinc-400 font-medium">Adresă Domiciliu / Sediu</label>
                  <input 
                    type="text"
                    value={buyerData.address}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="Strada, Număr, Bloc..."
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Județ</label>
                  <input 
                    type="text"
                    value={buyerData.county}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, county: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="Cluj"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Telefon Contact</label>
                  <input 
                    type="text"
                    value={buyerData.phone}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="0744..."
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Data Contractului</label>
                  <input 
                    type="date"
                    value={buyerData.contractDate}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, contractDate: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Setare Preț Vânzare & Curs */}
            <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Preț Vânzare & Monedă
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Preț Final Negociat (EUR)</label>
                  <input 
                    type="number"
                    value={buyerData.agreedPriceEur}
                    onChange={(e) => handlePriceEurChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold mt-0.5 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Echivalent Curs BNR (RON)</label>
                  <div className="w-full bg-zinc-900 border border-white/06 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold mt-0.5">
                    {buyerData.agreedPriceRon.toLocaleString('ro-RO')} lei
                  </div>
                </div>
              </div>
            </div>

            {/* Date Specifice Garanție & Facturare RXM (Standard Mădălina) */}
            <div className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Factură & Garanție RXM</span>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono font-bold">
                  1 An / 10.000 KM
                </span>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-medium">Factură Fiscală Nr.</label>
                <input 
                  type="text"
                  value={buyerData.invoiceNumber || ''}
                  onChange={(e) => setBuyerData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-semibold mt-0.5 focus:border-amber-400 focus:outline-none"
                  placeholder="Ex: RXM-FT-2026-089"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">KM la Livrare</label>
                  <input 
                    type="number"
                    value={buyerData.deliveryMileageKm ?? (car ? car.mileageKm : 0)}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, deliveryMileageKm: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="145000"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Data Începerii Garanției</label>
                  <input 
                    type="date"
                    value={buyerData.warrantyStartDate || buyerData.contractDate}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, warrantyStartDate: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 🔑 Accesorii & Echipamente Predate (Proces-Verbal de Predare-Primire) */}
            <div className={`bg-black/40 border p-4 rounded-xl space-y-3.5 transition-all ${
              activeDocTab === 'protocol'
                ? 'border-amber-500/40 ring-1 ring-amber-500/30 bg-black/60 shadow-lg'
                : 'border-white/[0.08]'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Accesorii & Predare (Proces-Verbal)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBuyerData(prev => ({
                      ...prev,
                      keysCount: 2,
                      keysCustomText: '',
                      hasRegistrationCertificate: true,
                      hasCivOrOriginDocs: true,
                      hasTaxInvoice: true,
                      hasWarrantyCertificate: true,
                      hasMedicalKitTriangles: true,
                      hasSpareWheelOrKit: true,
                      hasMountedTiresGoodCondition: true,
                      hasUserManualServiceBook: true
                    }))}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    title="Bifează toate accesoriile ca fiind predate conform standardului"
                  >
                    Toate bifate (Standard)
                  </button>
                  <span className="text-zinc-600 text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={() => setBuyerData(prev => ({
                      ...prev,
                      hasRegistrationCertificate: false,
                      hasCivOrOriginDocs: false,
                      hasTaxInvoice: false,
                      hasWarrantyCertificate: false,
                      hasMedicalKitTriangles: false,
                      hasSpareWheelOrKit: false,
                      hasMountedTiresGoodCondition: false,
                      hasUserManualServiceBook: false
                    }))}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 font-medium cursor-pointer"
                    title="Debifează toate accesoriile"
                  >
                    Debifează
                  </button>
                </div>
              </div>

              {/* Selector Chei Originale */}
              <div>
                <label className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" />
                    Număr chei originale predate:
                  </span>
                  <span className="text-amber-300 font-mono font-bold text-[10.5px]">
                    {buyerData.keysCount ?? 2} {buyerData.keysCount === 1 ? 'cheie' : 'chei'}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBuyerData(prev => ({ ...prev, keysCount: num }))}
                      className={`min-h-[32px] px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all touch-manipulation cursor-pointer border ${
                        (buyerData.keysCount ?? 2) === num
                          ? 'bg-amber-500 text-black border-amber-400 shadow-sm font-bold'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>{num} {num === 1 ? 'Cheie' : num === 2 ? 'Chei (Standard)' : 'Chei'}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={buyerData.keysCustomText || ''}
                  onChange={(e) => setBuyerData(prev => ({ ...prev, keysCustomText: e.target.value }))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white mt-1.5 focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
                  placeholder="Opțional: text detaliat chei (ex: 1 cheie funcțională + 1 lamă de rezervă)"
                />
              </div>

              {/* Checkbox-uri Accesorii Predate */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10.5px] text-zinc-400 font-medium block">
                  Elemente bifate în Procesul-Verbal:
                </span>

                {[
                  { key: 'hasRegistrationCertificate', label: 'Certificat Înmatriculare (Talon) original / străin' },
                  { key: 'hasCivOrOriginDocs', label: 'Carte de Identitate (CIV) / Proveniență' },
                  { key: 'hasTaxInvoice', label: 'Factură Fiscală emisă de vânzător' },
                  { key: 'hasWarrantyCertificate', label: 'Certificat de Garanție (12 luni / 10.000 km)' },
                  { key: 'hasMedicalKitTriangles', label: 'Trusă medicală, triunghiuri, stingător' },
                  { key: 'hasSpareWheelOrKit', label: 'Roată rezervă / Kit etanșare pană și cric' },
                  { key: 'hasMountedTiresGoodCondition', label: 'Set anvelope montate (stare bună)' },
                  { key: 'hasUserManualServiceBook', label: 'Manual utilizare / Carte service' },
                ].map(({ key, label }) => {
                  const isChecked = buyerData[key as keyof BuyerData] !== false;
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                          : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 focus:ring-offset-0 bg-[#18181b] border-white/20 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-medium leading-none">{label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Nivel Carburant */}
              <div className="pt-1">
                <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-1">
                  <Fuel className="w-3 h-3 text-amber-400" />
                  Carburant în rezervor la predare:
                </label>
                <select
                  value={buyerData.fuelLevel || 'Minim 1/4 rezervor'}
                  onChange={(e) => setBuyerData(prev => ({ ...prev, fuelLevel: e.target.value }))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="Minim 1/4 rezervor">Minim 1/4 rezervor (Standard RXM)</option>
                  <option value="Aproximativ 1/2 rezervor">Aproximativ 1/2 rezervor</option>
                  <option value="Rezervor Plin (1/1)">Rezervor Plin (1/1)</option>
                  <option value="Rezervă aprinsă (Minim combustibil)">Rezervă aprinsă (Minim combustibil)</option>
                </select>
              </div>

              {/* Mențiuni Suplimentare Predare */}
              <div>
                <label className="text-[11px] text-zinc-400 font-medium">Mențiuni predare / alte accesorii (opțional):</label>
                <input
                  type="text"
                  value={buyerData.deliveryNotes || ''}
                  onChange={(e) => setBuyerData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
                  placeholder="Ex: Predat al 2-lea set jante aliaj în portbagaj, 4 prezoane antifurt..."
                />
              </div>
            </div>

            {/* 🔍 Setări Raport Inspecție Tehnică Showroom (100+ Puncte) */}
            {activeDocTab === 'inspection' && (
              <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Parametri Inspecție Tehnică</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    100+ PUNCTE
                  </span>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Inspector Tehnic Acreditat</label>
                  <input
                    type="text"
                    value={buyerData.inspectorName || ''}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, inspectorName: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                    placeholder="Ex: Ing. Mihai Radu (Inspector Tehnic Auto)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 font-medium">Data Inspecției</label>
                    <input
                      type="date"
                      value={buyerData.inspectionDate || buyerData.contractDate}
                      onChange={(e) => setBuyerData(prev => ({ ...prev, inspectionDate: e.target.value }))}
                      className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 font-medium">Grosime Vopsea (μm)</label>
                    <input
                      type="number"
                      value={buyerData.paintThicknessMicronsAvg ?? 118}
                      onChange={(e) => setBuyerData(prev => ({ ...prev, paintThicknessMicronsAvg: parseInt(e.target.value) || 110 }))}
                      className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5 focus:border-amber-400 focus:outline-none"
                      placeholder="118"
                    />
                  </div>
                </div>

                {/* Rating Calitate Generală */}
                <div>
                  <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
                    Verdict / Calificativ General Showroom:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { key: 'exceptional', label: 'Excepțională' },
                      { key: 'foarte_buna', label: 'Foarte Bună (Std)' },
                      { key: 'buna', label: 'Bună' }
                    ].map(rating => (
                      <button
                        key={rating.key}
                        type="button"
                        onClick={() => setBuyerData(prev => ({ ...prev, generalConditionRating: rating.key as any }))}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold border text-center transition-all cursor-pointer ${
                          (buyerData.generalConditionRating || 'foarte_buna') === rating.key
                            ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {rating.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diagnoză OBD */}
                <div>
                  <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
                    Rezultat Scanare Tester OBD-II:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBuyerData(prev => ({ ...prev, obdScanResult: 'clean' }))}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border text-center transition-all cursor-pointer ${
                        (buyerData.obdScanResult || 'clean') === 'clean'
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      ✓ Zero Erori Active (Curat)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyerData(prev => ({ ...prev, obdScanResult: 'minor' }))}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border text-center transition-all cursor-pointer ${
                        buyerData.obdScanResult === 'minor'
                          ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Erori Istorice Șterse
                    </button>
                  </div>
                </div>

                {/* Profil Anvelope & Plăcuțe */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-medium">Profil Anvelope (Față / Spate mm)</label>
                    <div className="flex gap-1 mt-0.5">
                      <input
                        type="number"
                        step="0.1"
                        value={buyerData.tireTreadFrontMm ?? 6.5}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, tireTreadFrontMm: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                        placeholder="F: 6.5"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={buyerData.tireTreadRearMm ?? 6.2}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, tireTreadRearMm: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                        placeholder="S: 6.2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-medium">Uzură Plăcuțe (Față / Spate %)</label>
                    <div className="flex gap-1 mt-0.5">
                      <input
                        type="number"
                        value={buyerData.brakePadsFrontPct ?? 25}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, brakePadsFrontPct: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                        placeholder="F: 25%"
                      />
                      <input
                        type="number"
                        value={buyerData.brakePadsRearPct ?? 20}
                        onChange={(e) => setBuyerData(prev => ({ ...prev, brakePadsRearPct: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                        placeholder="S: 20%"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] text-zinc-400 font-medium">Observații Inspector Showroom:</label>
                  <input
                    type="text"
                    value={buyerData.inspectionNotes || ''}
                    onChange={(e) => setBuyerData(prev => ({ ...prev, inspectionNotes: e.target.value }))}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white mt-0.5 focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
                    placeholder="Ex: Fără urme de accident structural. Geometrie verificată..."
                  />
                </div>
              </div>
            )}

            {/* Setare Factură Fiscală / Proformă & Regim Fiscal */}
            {activeDocTab === 'proforma' && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Configurare Facturare</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                    proformaRegime === 'margin_scheme'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {proformaRegime === 'margin_scheme' ? 'Art. 312 (Fără TVA afișat)' : 'TVA 21% Deductibil'}
                  </span>
                </div>

                {/* 1. Tip Document: Proformă vs Fiscală */}
                <div>
                  <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
                    Tip Document Comercial:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInvoiceType('proforma')}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
                        invoiceType === 'proforma'
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Factură Proformă
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceType('fiscal')}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
                        invoiceType === 'fiscal'
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Factură Fiscală
                    </button>
                  </div>
                </div>

                {/* 2. Obiect Facturare: Preț Integral vs Avans */}
                <div>
                  <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
                    Valoare Facturată:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBillingType('full_car')}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
                        billingType === 'full_car'
                          ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Preț Integral ({buyerData.agreedPriceEur.toLocaleString('ro-RO')} €)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingType('deposit')}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
                        billingType === 'deposit'
                          ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Avans Rezervare
                    </button>
                  </div>
                </div>

                {/* Câmp Sumă Avans (afișat când este selectat Avans Rezervare) */}
                {billingType === 'deposit' && (
                  <div className="bg-black/40 border border-white/10 p-2.5 rounded-lg space-y-1.5">
                    <label className="text-[10.5px] text-zinc-400 font-medium block">
                      Sumă Avans / Rezervare (EUR):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={proformaDepositEur}
                        onChange={(e) => setProformaDepositEur(Math.max(50, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#18181b] border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        placeholder="500"
                      />
                      <div className="text-[11px] text-zinc-300 font-mono whitespace-nowrap">
                        ≈ {Math.round(proformaDepositEur * (buyerData.exchangeRate || 4.975)).toLocaleString('ro-RO')} lei
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Comutator Regim Fiscal: Regimul Marjei vs Regim Normal TVA 21% */}
                <div className="pt-1 border-t border-emerald-500/20">
                  <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
                    Regim fiscal aplicabil pe factură:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setProformaRegime('margin_scheme')}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
                        proformaRegime === 'margin_scheme'
                          ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                      title="Art. 312 Cod Fiscal: TVA inclus și nedeductibil, interzisă evidențierea separată a TVA-ului"
                    >
                      Regimul Marjei (Art. 312)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProformaRegime('standard')}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
                        proformaRegime === 'standard'
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                      title="Regim normal: Evidențiere distinctă bază + cota 21% TVA + total"
                    >
                      TVA 21% Deductibil
                    </button>
                  </div>
                </div>

                <div className="text-[9.5px] text-zinc-400 leading-tight pt-0.5">
                  Virament bancar direct în contul societății (<strong>{dealer.bankName}</strong> — IBAN: <span className="font-mono text-[10px] text-zinc-300 font-semibold">{dealer.ibanRon}</span>).
                </div>
              </div>
            )}

            {/* Selector Documente (Ordine prioritizată pentru fluxul real de dealer auto) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 mb-1">Alege Documentul pentru Vizualizare / Print:</div>

              {/* 1. Factură Fiscală / Proformă */}
              <button
                type="button"
                onClick={() => setActiveDocTab('proforma')}
                className={`w-full min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-[0.98] ${
                  activeDocTab === 'proforma'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>1. Factură {invoiceType === 'fiscal' ? 'Fiscală' : 'Proformă'}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      proformaRegime === 'margin_scheme'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {proformaRegime === 'margin_scheme' ? 'REGIMUL MARJEI' : 'TVA 21% DEDUCTIBIL'}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                    {billingType === 'full_car'
                      ? `Preț Integral ${buyerData.agreedPriceEur.toLocaleString('ro-RO')} € • ${proformaRegime === 'margin_scheme' ? 'Art. 312 (Fără TVA)' : 'TVA 21%'}`
                      : `Avans ${proformaDepositEur} € • ${proformaRegime === 'margin_scheme' ? 'Art. 312 (Fără TVA)' : 'TVA 21%'}`
                    }
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>

              {/* 2. Proces-Verbal Predare-Primire */}
              <button
                type="button"
                onClick={() => setActiveDocTab('protocol')}
                className={`w-full min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-[0.98] ${
                  activeDocTab === 'protocol'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>2. Proces-Verbal Predare-Primire</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">LIVRARE CHEI</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                    Checklist Accesorii, Kilometraj Predare, Chei
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>

              {/* 3. Certificat Garanție Oficial */}
              <button
                type="button"
                onClick={() => setActiveDocTab('warranty')}
                className={`w-full min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-[0.98] ${
                  activeDocTab === 'warranty'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>3. Certificat Garanție Oficial</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">1 AN / 10.000 KM</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                    Standard OUG 140/2021 • Acoperire Motor/Cutie
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>

              {/* 4. Raport Inspecție Tehnică Showroom (100+ Puncte) */}
              <button
                type="button"
                onClick={() => setActiveDocTab('inspection')}
                className={`w-full min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-[0.98] ${
                  activeDocTab === 'inspection'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>4. Raport Inspecție Tehnică (100+ Puncte)</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">SHOWROOM VERIFIED</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                    Motor, OBD, Frâne, Anvelope, Grosime Vopsea
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>

              {/* 5. Notă Calcul Fiscal Marjă */}
              <button
                type="button"
                onClick={() => setActiveDocTab('margin')}
                className={`w-full min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-[0.98] ${
                  activeDocTab === 'margin'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>5. Notă Calcul Fiscal Marjă (Art. 312)</span>
                    <span className="text-[9px] bg-zinc-700 text-zinc-300 font-bold px-1.5 py-0.2 rounded">CONTABILITATE</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                    Justificare Marjă de Profit și TVA la Marjă
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>

              {/* 6. Contract Înstrăinare-Dobândire (Model ITL-054 / Model 2026) */}
              <button
                type="button"
                onClick={() => setActiveDocTab('contract')}
                className={`w-full min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-[0.98] ${
                  activeDocTab === 'contract'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>6. Contract Înstrăinare - Dobândire</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">MODEL 2026</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                    Model Tipizat ITL-054 • Format Oficial DITL
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>

              {/* 7. Acord Prelucrare Date GDPR (Regulament UE 2016/679) */}
              <button
                type="button"
                onClick={() => setActiveDocTab('gdpr')}
                className={`w-full min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all touch-manipulation active:scale-[0.98] ${
                  activeDocTab === 'gdpr'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>7. Acord Prelucrare Date GDPR</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">CONFORME GDPR</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                    Regulamentul (UE) 2016/679 • Facturi, Contracte & Dosar Vânzare
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* Panou Dreapta: Previzualizare Foaie A4 Tipăribilă */}
          <div className="lg:col-span-8 flex flex-col gap-2.5">
            {/* Bară Informare Denumire Fișier Standard & Comutator Rapid Regim Fiscal */}
            <div className="no-print bg-black/60 border border-white/[0.08] px-3.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-zinc-400 text-[11px]">Denumire fișier standard:</span>
                <span className="font-mono text-amber-300 font-bold truncate max-w-[240px] sm:max-w-xs">
                  {currentFileName}.pdf
                </span>
              </div>

              {/* Comutator Rapid Regim Fiscal (Standard Regimul Marjei vs TVA 21%) */}
              {activeDocTab === 'proforma' ? (
                <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg border border-white/10">
                  <span className="text-[10px] text-zinc-400 font-semibold">Regim:</span>
                  <button
                    type="button"
                    onClick={() => setProformaRegime('margin_scheme')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold border transition-all cursor-pointer ${
                      proformaRegime === 'margin_scheme'
                        ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:text-white'
                    }`}
                    title="Art. 312 Cod Fiscal: TVA inclus și nedeductibil, fără TVA afișat"
                  >
                    Regimul Marjei (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProformaRegime('standard')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold border transition-all cursor-pointer ${
                      proformaRegime === 'standard'
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:text-white'
                    }`}
                    title="Regim normal: 21% TVA itemizat distinct (Bază + Cota 21% + Total)"
                  >
                    Cu TVA 21%
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono">
                  {activeDocTab === 'gdpr' 
                    ? 'Format A4 • Conform Regulament (UE) 2016/679 & Legea 190/2018' 
                    : 'Format A4 • Conform Art. 312 / OUG 140 / Cod Fiscal'}
                </span>
              )}
            </div>

            {/* Notă Fiscală & Juridică la Tab-ul de Contract */}
            {activeDocTab === 'contract' && (
              <div className="no-print bg-gradient-to-r from-amber-500/10 via-[#18181b] to-black border border-amber-500/30 rounded-xl p-3.5 shadow-lg space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Notă Fiscală & Juridică: Firmele de Dealeri Vând prin Factură Fiscală
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Societățile comerciale facturează pe Regimul Marjei (Art. 312) sau Regim TVA 21%. Contractul tipizat ITL-054 generat mai jos este necesar în special la achiziția de la persoane fizice (Buy-Back / Consignație) sau dacă cumpărătorul îl solicită pentru transcriere la DITL.
                </p>
              </div>
            )}

            {/* Notă Juridică la Tab-ul GDPR */}
            {activeDocTab === 'gdpr' && (
              <div className="no-print bg-gradient-to-r from-emerald-500/10 via-[#18181b] to-black border border-emerald-500/30 rounded-xl p-3.5 shadow-lg space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Conformitate Legală GDPR: Acord Expres Prelucrare Date (Regulament UE 2016/679)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Document obligatoriu pentru dosarul fizic al dealerului auto la vânzarea vehiculului și scanarea buletinului cumpărătorului. Datele sunt utilizate strict pentru întocmirea contractului, a facturii și a actelor de înmatriculare.
                </p>
              </div>
            )}

            <div className="bg-zinc-300 p-2 sm:p-5 rounded-xl overflow-y-auto max-h-[75vh] flex justify-center shadow-inner">
              <div ref={paperRef} className="sales-docs-paper-preview shadow-2xl w-full">
                {activeDocTab === 'contract' && (
                  <PrintableSaleContract car={editableCar} buyer={buyerData} dealer={dealer} />
                )}
                {activeDocTab === 'proforma' && (
                  <PrintableProformaInvoice 
                    car={editableCar} 
                    buyer={buyerData} 
                    dealer={dealer} 
                    invoiceType={invoiceType}
                    billingType={billingType}
                    depositAmountEur={proformaDepositEur}
                    salesRegime={proformaRegime}
                    invoiceNumber={buyerData.invoiceNumber}
                    issueDate={buyerData.contractDate}
                  />
                )}
                {activeDocTab === 'warranty' && (
                  <PrintableWarrantyCertificate car={editableCar} buyer={buyerData} dealer={dealer} />
                )}
                {activeDocTab === 'protocol' && (
                  <PrintableDeliveryProtocol car={editableCar} buyer={buyerData} dealer={dealer} />
                )}
                {activeDocTab === 'inspection' && (
                  <PrintableTechnicalInspectionSheet car={editableCar} buyer={buyerData} dealer={dealer} />
                )}
                {activeDocTab === 'margin' && (
                  <PrintableMarginCalculationNote car={editableCar} buyer={buyerData} dealer={dealer} />
                )}
                {activeDocTab === 'gdpr' && (
                  <PrintableGdprConsent car={editableCar} buyer={buyerData} dealer={dealer} />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
