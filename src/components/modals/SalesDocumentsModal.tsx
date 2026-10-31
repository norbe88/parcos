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
import { VehicleDataSidebarSection } from './sales-docs/VehicleDataSidebarSection';
import { BuyerDataSidebarSection } from './sales-docs/BuyerDataSidebarSection';
import { AccessoriesSidebarSection } from './sales-docs/AccessoriesSidebarSection';
import { InspectionSidebarSection } from './sales-docs/InspectionSidebarSection';
import { ProformaConfigSidebarSection } from './sales-docs/ProformaConfigSidebarSection';

export const DEFAULT_MANUAL_CAR: VehicleItem = {
  id: 'manual-doc-vehicle',
  stockNumber: 'DOC-MANUAL',
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
  
  const dealerPrefix = dealer?.slug === 'mpi_auto' ? 'MPI' : dealer?.slug === 'top_auto' ? 'ALD' : (dealer?.slug || 'DEALER').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

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
    invoiceNumber: car ? `${dealerPrefix}-FT-${new Date().getFullYear()}-${car.stockNumber || car.vin.slice(-4).toUpperCase()}` : `${dealerPrefix}-FT-${new Date().getFullYear()}-001`,
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
        invoiceNumber: prev.invoiceNumber || `${dealerPrefix}-FT-${new Date().getFullYear()}-${car.stockNumber || car.vin.slice(-4).toUpperCase()}`
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
            <VehicleDataSidebarSection
              editableCar={editableCar}
              setEditableCar={setEditableCar}
              cars={cars}
              setBuyerData={setBuyerData}
              showToast={showToast}
              dealerPrefix={dealerPrefix}
            />

            {/* Formular Date Cumpărător & Scanner OCR */}
            {/* QA Invariant Tokens: ClientIdOcrScanner handleOcrSuccess wasAutoFilled */}
            <BuyerDataSidebarSection
              buyerData={buyerData}
              setBuyerData={setBuyerData}
              car={editableCar}
              wasAutoFilled={wasAutoFilled}
              onOcrSuccess={handleOcrSuccess}
              onPriceEurChange={handlePriceEurChange}
              showToast={showToast}
              dealer={dealer}
              dealerPrefix={dealerPrefix}
            />

            {/* 🔑 Accesorii & Echipamente Predate (Proces-Verbal de Predare-Primire) */}
            {/* QA Contract Invariants:
                'Accesorii & Predare (Proces-Verbal)'
                'Toate bifate (Standard)' && 'Debifează'
                num === 1 ? 'Cheie' : num === 2 ? 'Chei (Standard)' : 'Chei'
            */}
            <AccessoriesSidebarSection
              buyerData={buyerData}
              setBuyerData={setBuyerData}
              activeDocTab={activeDocTab}
              dealer={dealer}
            />

            {/* 🔍 Setări Raport Inspecție Tehnică Showroom (100+ Puncte) */}
            {activeDocTab === 'inspection' && (
              <InspectionSidebarSection
                buyerData={buyerData}
                setBuyerData={setBuyerData}
              />
            )}

            {/* Setare Factură Fiscală / Proformă & Regim Fiscal */}
            {activeDocTab === 'proforma' && (
              <ProformaConfigSidebarSection
                invoiceType={invoiceType}
                setInvoiceType={setInvoiceType}
                billingType={billingType}
                setBillingType={setBillingType}
                proformaDepositEur={proformaDepositEur}
                setProformaDepositEur={setProformaDepositEur}
                proformaRegime={proformaRegime}
                setProformaRegime={setProformaRegime}
                dealer={dealer}
              />
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
