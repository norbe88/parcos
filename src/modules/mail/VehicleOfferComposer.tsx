/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Modal Inteligent de Compunere Ofertă (PMH-303)
 * Component: VehicleOfferComposer.tsx
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Regim Marjă Art. 312
 * Design: Dark Luxury Dual-Theme (#09090b, #121215, font Plus Jakarta Sans)
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Send, Car, Sparkles, Shield, Calculator, FileText, Check, 
  Paperclip, Eye, RefreshCw, Upload, Trash2, Building2, ExternalLink, 
  Info, CheckCircle2, ChevronRight, Percent, Calendar, Clock, Truck, Camera
} from 'lucide-react';
import { VehicleItem, DealerProfile } from '../../db/types';
import { SEED_DEALER } from '../../db/dealer';
import { MailThreadItem } from './types';
import { 
  formatMileage, 
  normalizeCarImageUrl, 
  getStockNumber, 
  VAT_RATE, 
  calculateRate 
} from '../../utils/helpers';
import { convertEurToRon, DEFAULT_BT_EXCHANGE_RATE } from '../../utils/currencyEngine';
import { getAdminAuthHeaders } from '../../utils/adminAuth';

export type OfferTemplateType = 
  | 'STANDARD_OFFER' 
  | 'FINANCING_OFFER' 
  | 'RESERVATION_GUARANTEE' 
  | 'TESTDRIVE_INVITATION' 
  | 'NATIONAL_DELIVERY';

export interface ComposerAttachment {
  fileName: string;
  mimeType: string;
  fileSize: number;
  content: string; // Base64
}

export interface VehicleOfferComposerProps {
  isOpen: boolean;
  onClose: () => void;
  allVehicles: VehicleItem[];
  preselectedVehicle?: VehicleItem | null;
  activeThread?: MailThreadItem | null;
  dealershipName?: string;
  dealerSlug?: string;
  dealerProfile?: DealerProfile;
  showToast: (msg: string) => void;
  onOfferSent?: (threadId?: string) => void;
}

const WARRANTY_TERM = 'Cont de Garanție';
const RESERVATION_TERM = 'Garanție de Rezervare/Participare';

export const VehicleOfferComposer: React.FC<VehicleOfferComposerProps> = ({
  isOpen,
  onClose,
  allVehicles,
  preselectedVehicle = null,
  activeThread = null,
  dealershipName = 'RXM Automobile',
  dealerSlug = 'rxm',
  dealerProfile,
  showToast,
  onOfferSent,
}) => {
  const activeDealerProfile = dealerProfile || SEED_DEALER;
  const dealership = dealershipName || activeDealerProfile.name;
  const dealerBankName = activeDealerProfile.bankName || 'Banca Transilvania';
  const dealerBankBranch = activeDealerProfile.bankBranch || 'Sucursala Cluj-Napoca';
  const dealerIbanEur = activeDealerProfile.ibanEur || 'RO35 BTRL 0120 4205 8482 2102';
  const dealerIbanRon = activeDealerProfile.ibanRon || 'RO88 BTRL 0120 1205 8482 2101';
  const dealerCui = activeDealerProfile.cui || 'RO48482214';

  // ── Stări Clauză Opțională de Garanție de Rezervare (Direct cu Parcul Vânzător)
  const [includeGuaranteeClause, setIncludeGuaranteeClause] = useState<boolean>(false);
  const [guaranteeDepositAmount, setGuaranteeDepositAmount] = useState<500 | 1000>(500);
  // ── Stări Câmpuri E-mail ───────────────────────────────────────────────────
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<OfferTemplateType>('STANDARD_OFFER');
  const [bodyText, setBodyText] = useState<string>('');
  const [isHtmlPreview, setIsHtmlPreview] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // ── Stări Simulator Finanțare ──────────────────────────────────────────────
  const [advancePct, setAdvancePct] = useState<number>(20);
  const [durationMonths, setDurationMonths] = useState<number>(48);
  const [interestRatePct, setInterestRatePct] = useState<number>(7.9);

  // ── Stări Atașamente Drag & Drop ──────────────────────────────────────────
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Vehicul selectat în compozitor
  const currentVehicle = useMemo<VehicleItem | null>(() => {
    if (selectedVehicleId) {
      const match = allVehicles.find((v) => v.id === selectedVehicleId);
      if (match) return match;
    }
    if (preselectedVehicle) return preselectedVehicle;
    return allVehicles.length > 0 ? allVehicles[0] : null;
  }, [selectedVehicleId, preselectedVehicle, allVehicles]);

  // Sincronizare la deschidere modal
  useEffect(() => {
    if (isOpen) {
      if (activeThread) {
        setRecipientEmail(activeThread.customer_email || '');
        setRecipientName(activeThread.customer_name || '');
      } else {
        setRecipientEmail('');
        setRecipientName('');
      }

      if (preselectedVehicle) {
        setSelectedVehicleId(preselectedVehicle.id);
      } else if (activeThread?.vehicle_id) {
        setSelectedVehicleId(activeThread.vehicle_id);
      } else if (allVehicles.length > 0) {
        setSelectedVehicleId(allVehicles[0].id);
      }

      setAttachments([]);
      setIsHtmlPreview(false);
    }
  }, [isOpen, activeThread, preselectedVehicle, allVehicles]);

  // Sincronizare avans recomandat garanție (500 € vs 1.000 € pentru mașini scumpe)
  useEffect(() => {
    if (currentVehicle?.priceEur && currentVehicle.priceEur > 25000) {
      setGuaranteeDepositAmount(1000);
    } else {
      setGuaranteeDepositAmount(500);
    }
  }, [currentVehicle?.id, currentVehicle?.priceEur]);

  // ── Calcule Financiare (Strict 21% TVA vs Regim Marjă Art. 312) ────────────
  const pricingData = useMemo(() => {
    if (!currentVehicle) return null;
    const priceEur = currentVehicle.priceEur || 0;
    const isVatDeductible = !!currentVehicle.vatDeductible;
    const grossRon = convertEurToRon(priceEur);

    if (isVatDeductible) {
      const netEur = Math.round(priceEur / (1 + VAT_RATE));
      const vatEur = priceEur - netEur;
      const netRon = convertEurToRon(netEur);
      const vatRon = convertEurToRon(vatEur);

      return {
        isVatDeductible: true,
        grossEur: priceEur,
        grossRon,
        netEur,
        netRon,
        vatEur,
        vatRon,
        vatLabel: 'TVA 21% deductibil inclus',
        fiscalNotice: 'Factură cu TVA 21% deductibil integral pentru societăți comerciale.',
      };
    } else {
      return {
        isVatDeductible: false,
        grossEur: priceEur,
        grossRon,
        netEur: null,
        netRon: null,
        vatEur: null,
        vatRon: null,
        vatLabel: 'Regim de Marjă (TVA inclusă, nedeductibilă conform Art. 312 Cod Fiscal)',
        fiscalNotice: 'Regimul special al marjei de profit conform Art. 312 Cod Fiscal (Legea 227/2015).',
      };
    }
  }, [currentVehicle]);

  // ── Calcule Simulator Finanțare ───────────────────────────────────────────
  const financingSummary = useMemo(() => {
    if (!currentVehicle) return null;
    const price = currentVehicle.priceEur;
    const advanceAmountEur = Math.round(price * (advancePct / 100));
    const advanceAmountRon = convertEurToRon(advanceAmountEur);
    const financedEur = price - advanceAmountEur;
    const monthlyRateEur = calculateRate(price, advancePct, durationMonths, interestRatePct);
    const monthlyRateRon = convertEurToRon(monthlyRateEur);

    return {
      priceEur: price,
      advancePct,
      advanceAmountEur,
      advanceAmountRon,
      financedEur,
      durationMonths,
      interestRatePct,
      monthlyRateEur,
      monthlyRateRon,
    };
  }, [currentVehicle, advancePct, durationMonths, interestRatePct]);

  // ── Generare Conținut pe Baza Șablonului ───────────────────────────────────
  useEffect(() => {
    if (!currentVehicle) return;

    const brand = currentVehicle.brand;
    const model = currentVehicle.model;
    const version = currentVehicle.versionTrim ? ` ${currentVehicle.versionTrim}` : '';
    const carTitle = `${brand} ${model}${version}`;
    const client = recipientName.trim() || 'Stimate Client';
    const vinText = currentVehicle.vin ? ` (VIN: ${currentVehicle.vin})` : '';
    const formattedPrice = currentVehicle.priceEur.toLocaleString('ro-RO');

    // 1. Subiect dinamic
    let newSubject = '';
    if (selectedTemplate === 'STANDARD_OFFER') {
      newSubject = `Ofertă Comercială Oficială: ${carTitle} — ${dealershipName}`;
    } else if (selectedTemplate === 'FINANCING_OFFER') {
      newSubject = `Plan Finanțare & Rate ${carTitle} — ${dealershipName}`;
    } else if (selectedTemplate === 'RESERVATION_GUARANTEE') {
      newSubject = `Acord Rezervare & Garanție de Participare: ${carTitle} — ${dealershipName}`;
    } else if (selectedTemplate === 'TESTDRIVE_INVITATION') {
      newSubject = `Invitație Test-Drive Showroom Cluj: ${carTitle} — ${dealershipName}`;
    } else if (selectedTemplate === 'NATIONAL_DELIVERY') {
      newSubject = `Ofertă cu Livrare Gratuită pe Platformă: ${carTitle} — ${dealershipName}`;
    }
    setSubject(newSubject);

    // 2. Structură preț conform TVA 21% vs Regim Marjă
    let priceDetailsBlock = '';
    if (pricingData?.isVatDeductible) {
      priceDetailsBlock = `• Preț Net: ${pricingData.netEur?.toLocaleString('ro-RO')} EUR
• TVA deductibil (21%): ${pricingData.vatEur?.toLocaleString('ro-RO')} EUR
• Preț Total Brut (TVA 21% inclus): ${pricingData.grossEur.toLocaleString('ro-RO')} EUR (~ ${pricingData.grossRon.toLocaleString('ro-RO')} RON)
• Regim Fiscal: Factură cu TVA 21% deductibil pe firmă`;
    } else {
      priceDetailsBlock = `• Preț Total de Vânzare: ${formattedPrice} EUR (~ ${pricingData?.grossRon.toLocaleString('ro-RO')} RON)
• Regim Fiscal: Regimul special al marjei de profit (Art. 312 Cod Fiscal — TVA inclusă, nedeductibilă)`;
    }

    // 3. Conținut conform șablonului ales
    let content = '';

    if (selectedTemplate === 'STANDARD_OFFER') {
      content = `Bună ziua, ${client},

Vă mulțumim pentru interesul manifestat față de parcul nostru auto, ${dealership}.
Vă transmitem mai jos specificația tehnică și oferta financiară oficială pentru ${carTitle}${vinText}:

📊 STRUCTURĂ PREȚ & REGIM FISCAL:
${priceDetailsBlock}

🔧 SPECIFICAȚII TEHNICE ESENȚIALE:
• An Fabricație: ${currentVehicle.year}
• Rulaj Certificat: ${formatMileage(currentVehicle.mileageKm)}
• Motorizare: ${currentVehicle.engineCc} cm³ ${currentVehicle.fuelType}, ${currentVehicle.powerHp} CP
• Transmisie & Tracțiune: ${currentVehicle.transmission} • ${currentVehicle.drivetrain}
• Culoare: ${currentVehicle.color} • Caroserie: ${currentVehicle.bodyType}
• Garanție Tehnică Inclusă: ${currentVehicle.warrantyMonths || 12} luni conform contractului
• Metodă Tranzacționare Securizată: ${WARRANTY_TERM} / ${RESERVATION_TERM}

Pentru programarea unui test-drive la sediul nostru din Cluj-Napoca sau pentru detalii suplimentare, vă rugăm să ne răspundeți la acest e-mail.

Cu respect,
Echipa de Vânzări • ${dealership}`;

      if (includeGuaranteeClause) {
        const depositEur = guaranteeDepositAmount;
        const depositRon = convertEurToRon(depositEur).toLocaleString('ro-RO');
        content += `\n\n🔒 OPȚIONAL — CLAUZĂ DE REZERVARE & BLOCARE STOC (5 ZILE):
Dacă doriți blocarea exclusivă a autovehiculului timp de 5 zile până la vizionare sau finalizarea formalităților, puteți constitui o ${RESERVATION_TERM} în cuantum de ${depositEur} EUR (echiv. ${depositRon} RON) direct în ${WARRANTY_TERM} al parcului nostru ${dealership}:
• Cont de Garanție EUR (IBAN): ${dealerIbanEur} (${dealerBankName})
• Cont de Garanție RON (IBAN): ${dealerIbanRon} (${dealerBankName})
• Beneficiar Direct: ${dealership}${dealerCui ? ` (CUI: ${dealerCui})` : ''}
Acordul este 100% opțional, încheiat direct cu parcul vânzător, iar suma reprezintă avans dedus integral din prețul final de achiziție.`;
      }
    } 
    else if (selectedTemplate === 'FINANCING_OFFER') {
      content = `Bună ziua, ${client},

Pentru achiziția autovehiculului ${carTitle}${vinText}, parcul nostru auto ${dealership} vă propune următoarea simulare avantajoasă de finanțare prin partenerii noștri de credit auto și leasing:

📊 STRUCTURĂ FINANȚARE PERSONALIZATĂ:
• Preț Autovehicul: ${formattedPrice} EUR (${pricingData?.vatLabel})
• Avans Recomandat (${advancePct}%): ${financingSummary?.advanceAmountEur.toLocaleString('ro-RO')} EUR (~ ${financingSummary?.advanceAmountRon.toLocaleString('ro-RO')} RON)
• Sumă Finanțată: ${financingSummary?.financedEur.toLocaleString('ro-RO')} EUR
• Perioadă Contract: ${durationMonths} luni
• Rată Lunară Estimativă: de la ~${financingSummary?.monthlyRateEur.toLocaleString('ro-RO')} EUR / lună (~ ${financingSummary?.monthlyRateRon.toLocaleString('ro-RO')} RON / lună)

🛡️ BENEFICII INCLUSE ÎN PACHET:
• Aprobare rapidă dosar (persoane fizice sau juridice) în 2-24 ore.
• Garanție tehnică premium: ${currentVehicle.warrantyMonths || 12} luni.
• Mașină verificată riguros pe elevator și istoric garantat.

Vă stăm la dispoziție cu pregătirea dosarului de finanțare. Răspundeți la acest e-mail cu preferințele dumneavoastră de avans.

Cu stimă,
Departamentul Financiar • ${dealership}`;

      if (includeGuaranteeClause) {
        const depositEur = guaranteeDepositAmount;
        const depositRon = convertEurToRon(depositEur).toLocaleString('ro-RO');
        content += `\n\n🔒 OPȚIONAL — CLAUZĂ DE REZERVARE & BLOCARE STOC (5 ZILE):
Dacă doriți blocarea exclusivă a autovehiculului timp de 5 zile până la aprobarea creditului/leasingului, puteți constitui o ${RESERVATION_TERM} în cuantum de ${depositEur} EUR (echiv. ${depositRon} RON) direct în ${WARRANTY_TERM} al parcului nostru ${dealership}:
• Cont de Garanție EUR (IBAN): ${dealerIbanEur} (${dealerBankName})
• Cont de Garanție RON (IBAN): ${dealerIbanRon} (${dealerBankName})
• Beneficiar Direct: ${dealership}${dealerCui ? ` (CUI: ${dealerCui})` : ''}
Acordul este 100% opțional, încheiat direct cu parcul vânzător, iar suma reprezintă avans dedus integral din prețul final de achiziție.`;
      }
    } 
    else if (selectedTemplate === 'RESERVATION_GUARANTEE') {
      const depositEur = guaranteeDepositAmount;
      const depositRon = convertEurToRon(depositEur).toLocaleString('ro-RO');

      content = `Bună ziua, ${client},

Vă transmitem acordul oficial privind rezervarea fermă a autovehiculului ${carTitle} din stocul ${dealership}:

📋 DETALII IDENTIFICARE VEHICUL:
• Autovehicul: ${carTitle}
• Serie Șasiu (VIN): ${currentVehicle.vin || 'Conform Talon/CIV'}
• An / Kilometraj: ${currentVehicle.year} • ${formatMileage(currentVehicle.mileageKm)}
• Preț Convenit: ${formattedPrice} EUR (${pricingData?.vatLabel})

🔒 CLAUZĂ OPȚIONALĂ — REZERVARE & GARANȚIE:
• Procedură: ${RESERVATION_TERM} (Încheiată direct cu parcul auto vânzător)
• Cuantum Garanție: ${depositEur} EUR (sau echivalent ${depositRon} RON la cursul oficial BNR)
• Modalitate Plată: Virament bancar securizat în ${WARRANTY_TERM}
• Beneficiar Direct: ${dealership}${dealerCui ? ` (CUI: ${dealerCui})` : ''}
• Cont de Garanție EUR (IBAN): ${dealerIbanEur} (${dealerBankName})
• Cont de Garanție RON (IBAN): ${dealerIbanRon} (${dealerBankName})
• Perioadă Blocare Stoc: 5 zile calendaristice

Constituirea acestei garanții este 100% OPȚIONALĂ și se realizează direct cu parcul nostru auto ${dealership}. Prin achitarea garanției, autovehiculul este blocat exclusiv pe numele dumneavoastră și retras din stoc timp de 5 zile. Suma reprezintă avans confirmat și se deduce integral din factura finală de achiziție.

Vă rugăm să ne transmiteți ordinul de plată ca răspuns la acest mesaj pentru confirmarea blocării pe stoc.

Cu respect,
Consilier Vânzări • ${dealership}`;
    } 
    else if (selectedTemplate === 'TESTDRIVE_INVITATION') {
      content = `Bună ziua, ${client},

Vă mulțumim pentru interesul acordat modelului ${carTitle}.
Vă invităm cu plăcere la sediul showroom-ului ${dealership} din Cluj-Napoca pentru o probă de drum și o inspecție completă.

🚗 CE VĂ PUNEM LA DISPOZIȚIE:
• Test-drive pe traseu mixt (urban și drum deschis).
• Inspecție tehnică pe elevator dedicat în prezența mecanicului nostru.
• Diagnosticare computerizată și verificare grosime vopsea cu micrometru profesional.
• Punerea la dispoziție a istoricului complet de service și raport carVertical.

Autovehiculul este disponibil fizic în stoc:
• An Fabricație: ${currentVehicle.year} • Rulaj: ${formatMileage(currentVehicle.mileageKm)}
• Preț: ${formattedPrice} EUR (${pricingData?.vatLabel})

Vă rugăm să ne comunicați ziua și intervalul orar preferat pentru a vă rezerva autovehiculul și consultanța dedicată.

Cu deosebită considerație,
Echipa de Vânzări • ${dealership}`;
    } 
    else if (selectedTemplate === 'NATIONAL_DELIVERY') {
      content = `Bună ziua, ${client},

Vă transmitem oferta de achiziție pentru autovehiculul ${carTitle} cu pachetul de livrare gratuită pe platformă dedicată, oriunde pe teritoriul României:

🚚 DETALII LIVRARE LA DOMICILIU:
• Transport securizat cu platformă auto asigurată CMR până la adresa dumneavoastră.
• Livrare directă în termen de 24 - 48 ore de la finalizarea documentelor.
• Numere provizorii (roșii) și asigurare RCA valabile incluse pentru deplasare imediată.
• Pachet complet acte de vânzare (factură fiscală, certificat de conformitate, dosar înmatriculare).

💰 CONDIȚII FINANCIARE:
${priceDetailsBlock}
• Garanție Tehnică Inclusă: ${currentVehicle.warrantyMonths || 12} luni.
• Tranzacție securizată prin: ${WARRANTY_TERM} / ${RESERVATION_TERM}.

Pentru demararea procedurii de livrare, vă rugăm să ne confirmați adresa de destinație ca răspuns la acest e-mail.

Cu respect,
Departamentul Logistică & Vânzări • ${dealership}`;
    }

    setBodyText(content);
  }, [
    currentVehicle, 
    selectedTemplate, 
    recipientName, 
    advancePct, 
    durationMonths, 
    interestRatePct, 
    pricingData, 
    financingSummary, 
    dealership,
    includeGuaranteeClause,
    guaranteeDepositAmount,
    dealerIbanEur,
    dealerIbanRon,
    dealerBankName,
    dealerCui
  ]);

  // ── Drag & Drop Gestionare Fișiere ────────────────────────────────────────
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    const maxFiles = 5;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB per fișier

    Array.from(files).slice(0, maxFiles - attachments.length).forEach((file) => {
      if (file.size > maxSizeBytes) {
        showToast(`⚠️ Fișierul ${file.name} depășește limita de 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1] || '';

        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
            content: base64Data,
          },
        ]);
        showToast(`📎 Atașament adăugat: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Captură Cameră Mobilă Showroom (CIV / Talon / Poze Detailing) - PMH-403 ──
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (loadEvent) => {
        img.src = loadEvent.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
            const base64Data = compressedBase64.split(',')[1];
            const approxBytes = Math.round((base64Data.length * 3) / 4);

            setAttachments((prev) => [
              ...prev,
              {
                fileName: `foto-showroom-${Date.now().toString().slice(-4)}.jpg`,
                mimeType: 'image/jpeg',
                fileSize: approxBytes,
                content: base64Data
              }
            ]);
            showToast('📸 Fotografia a fost optimizată și atașată la ofertă!');
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Eroare procesare poză:', err);
      showToast('Eroare la procesarea fotografiei');
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // ── Trimitere Ofertă (Outbound SES) ───────────────────────────────────────
  const handleSendOffer = async () => {
    if (!recipientEmail || !subject || !bodyText.trim()) {
      showToast('⚠️ Vă rugăm să completați destinatarul, subiectul și textul ofertei.');
      return;
    }

    setIsSending(true);
    try {
      // 1. Pregătire HTML E-mail Dark Luxury compatibil cu toți clienții de e-mail
      const carImage = currentVehicle && currentVehicle.images && currentVehicle.images.length > 0 
        ? normalizeCarImageUrl(currentVehicle.images[0]) 
        : '';

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #121215; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header Brand -->
          <tr>
            <td style="padding: 24px; background: linear-gradient(135deg, #18181b 0%, #121215 100%); border-bottom: 2px solid #f59e0b;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #f59e0b; letter-spacing: -0.5px;">${dealership}</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa;">Ofertă Oficială de Vânzări • ParcOS Mail Hub</p>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
                      ${pricingData?.isVatDeductible ? 'TVA 21% DEDUCTIBIL' : 'REGIM MARJĂ ART. 312'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${carImage ? `
          <!-- Card Foto Vehicul -->
          <tr>
            <td style="padding: 0;">
              <img src="${carImage}" alt="${currentVehicle?.brand} ${currentVehicle?.model}" style="width: 100%; height: auto; max-height: 320px; object-fit: cover; display: block;" />
            </td>
          </tr>` : ''}

          <!-- Corp Text Ofertă -->
          <tr>
            <td style="padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #e4e4e7;">
              <div style="white-space: pre-wrap; font-family: inherit;">
                ${bodyText.replace(/\n/g, '<br/>')}
              </div>
            </td>
          </tr>

          <!-- Invariante Garanții & Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: #0c0c0e; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #a1a1aa;">
                🛡️ Opțional: Rezervare securizată direct cu parcul auto prin <strong>${WARRANTY_TERM}</strong> (${dealerBankName}).
              </p>
              <p style="margin: 0;">
                © 2026 ${dealership} • Toate drepturile rezervate.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      // Trimitere către backend: dacă avem threadId activ, trimitem ca răspuns în fir, altfel /api/mail/send
      const endpoint = activeThread?.id 
        ? `/api/mail/threads/${activeThread.id}/reply` 
        : '/api/mail/send';

      const payload = {
        recipientEmail,
        recipientName,
        subject,
        textBody: bodyText,
        htmlBody,
        vehicleId: currentVehicle?.id || undefined,
        dealershipName: dealership,
        attachments: attachments.length > 0 ? attachments : undefined,
        threadId: activeThread?.id || undefined,
        isOffer: true,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAdminAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('🚀 Oferta oficială a fost expediată cu succes prin AWS SES.');
        onClose();
        if (onOfferSent) onOfferSent(data.threadId || activeThread?.id);
      } else {
        showToast(`❌ Eroare la trimitere: ${data.error || 'Trimitere eșuată'}`);
      }
    } catch (err) {
      showToast('❌ Eroare de rețea la expedierea ofertei.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* ───────────────────────────────────────────────────────────────── */}
        {/* HEADER MODAL COMPUNERE OFERTĂ                                     */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-[#27272a] bg-[#16161a] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Generator & Compunere Ofertă Auto
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-medium">
                  PMH-303
                </span>
              </div>
              <p className="text-xs text-[#71717a]">
                ParcOS Mail Hub • Strict 21% TVA / Regim Marjă Art. 312 • Expediere SES
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* CORP MODAL (2 COLOANE: PARAMETRI & EDITOR / PREVIZUALIZARE)       */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#27272a]">
          
          {/* ── COLOANA STÂNGA: SELECTOR VEHICUL, ȘABLOANE & FINANȚARE (5 col) ── */}
          <div className="lg:col-span-5 p-4 space-y-4 bg-[#141418] overflow-y-auto">
            
            {/* 1. Selector Vehicul din Stoc */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>Autovehicul din Stocul Parcului</span>
              </label>

              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60 font-sans"
              >
                {allVehicles.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} ({car.year}) — {car.priceEur.toLocaleString('ro-RO')} € ({car.vatDeductible ? 'TVA 21%' : 'Marjă'})
                  </option>
                ))}
              </select>

              {currentVehicle && (
                <div className="p-2.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center gap-2.5 mt-2">
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-[#27272a] shrink-0">
                    {currentVehicle.images && currentVehicle.images.length > 0 ? (
                      <img
                        src={normalizeCarImageUrl(currentVehicle.images[0])}
                        alt={currentVehicle.model}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="w-full h-full p-2 text-zinc-600" />
                    )}
                  </div>
                  <div className="min-w-0 text-xs">
                    <div className="font-bold text-white truncate">
                      {currentVehicle.brand} {currentVehicle.model}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold">
                      {currentVehicle.priceEur.toLocaleString('ro-RO')} € 
                      <span className="text-[10px] text-[#71717a] ml-1 font-normal">
                        ({currentVehicle.vatDeductible ? 'TVA 21%' : 'Regim Marjă'})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Selector Șabloane Salvate */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Șablon Ofertă Salvat</span>
              </label>

              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'STANDARD_OFFER', label: 'Ofertă Comercială Standard', desc: 'Preț complet, dotări & garanție' },
                  { id: 'FINANCING_OFFER', label: 'Simulare Leasing / Rate', desc: 'Calcul avans minim & rate lunare' },
                  { id: 'RESERVATION_GUARANTEE', label: 'Garanție de Rezervare (Opțională)', desc: 'Direct cu parcul • Blocare 5 zile • Cont BT' },
                  { id: 'TESTDRIVE_INVITATION', label: 'Invitație Test-Drive Cluj', desc: 'Verificare elevator & probă drum' },
                  { id: 'NATIONAL_DELIVERY', label: 'Livrare Gratuită pe Platformă', desc: 'Transport la domiciliu în 24-48h' },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id as OfferTemplateType)}
                    className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                      selectedTemplate === tmpl.id
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold shadow-sm'
                        : 'bg-[#18181c] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">{tmpl.label}</div>
                      <div className="text-[10px] text-[#71717a]">{tmpl.desc}</div>
                    </div>
                    {selectedTemplate === tmpl.id && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2.5 Clauză Opțională de Rezervare (Direct cu Parcul • 5 Zile) */}
            <div className="p-3 bg-[#18181c] border border-amber-500/25 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGuaranteeClause || selectedTemplate === 'RESERVATION_GUARANTEE'}
                    onChange={(e) => {
                      setIncludeGuaranteeClause(e.target.checked);
                    }}
                    disabled={selectedTemplate === 'RESERVATION_GUARANTEE'}
                    className="rounded border-[#3f3f46] text-amber-500 focus:ring-amber-500/30 bg-[#121215]"
                  />
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Include Garanție de Rezervare</span>
                </label>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                  Opțional
                </span>
              </div>

              <p className="text-[10px] text-[#71717a]">
                Acord direct cu {dealership} • Cont Garanție {dealerBankName} • Blocare 5 zile
              </p>

              {(includeGuaranteeClause || selectedTemplate === 'RESERVATION_GUARANTEE') && (
                <div className="pt-2 border-t border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#a1a1aa]">Avans Recomandat:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setGuaranteeDepositAmount(500)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                          guaranteeDepositAmount === 500
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'bg-[#121215] text-[#a1a1aa] border border-[#27272a]'
                        }`}
                      >
                        500 €
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuaranteeDepositAmount(1000)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                          guaranteeDepositAmount === 1000
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'bg-[#121215] text-[#a1a1aa] border border-[#27272a]'
                        }`}
                      >
                        1.000 €
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-300 bg-[#121215] p-2 rounded-lg border border-[#27272a] font-mono truncate">
                    Cont Garanție EUR: {dealerIbanEur}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Simulator Finanțare & Rate (Pentru oferta de finanțare) */}
            <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Simulator Finanțare Auto</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  ~{financingSummary?.monthlyRateEur} € / lună
                </span>
              </div>

              {/* Selector Avans % */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#a1a1aa]">
                  <span>Avans ({advancePct}%):</span>
                  <strong className="text-white font-mono">{financingSummary?.advanceAmountEur.toLocaleString('ro-RO')} €</strong>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[15, 20, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setAdvancePct(pct)}
                      className={`py-1 text-[10px] rounded-lg border font-mono font-bold transition-all ${
                        advancePct === pct
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-[#121215] text-[#a1a1aa] border-[#27272a] hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector Durată (Luni) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#a1a1aa]">
                  <span>Perioadă Rambursare:</span>
                  <strong className="text-white font-mono">{durationMonths} luni ({durationMonths / 12} ani)</strong>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[12, 24, 36, 48, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-1 text-[10px] rounded-lg border font-mono font-bold transition-all ${
                        durationMonths === m
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : 'bg-[#121215] text-[#a1a1aa] border-[#27272a] hover:text-white'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1 text-[10px] text-[#71717a] flex items-center justify-between">
                <span>DAE / Dobândă fixă: {interestRatePct}% p.a.</span>
                <span>Curs BT: {DEFAULT_BT_EXCHANGE_RATE.toFixed(2)} RON</span>
              </div>
            </div>

            {/* 4. Atașamente Drag & Drop */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                  <span>Atașamente ({attachments.length}/5)</span>
                </span>
                <span className="text-[10px] text-[#71717a]">Max 10MB/fișier</span>
              </label>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-[#27272a] bg-[#18181c] hover:border-amber-500/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Upload className="w-4 h-4 text-amber-400 mx-auto mb-1 opacity-70" />
                <p className="text-[11px] text-[#a1a1aa]">
                  Trage fișierele aici sau <span className="text-amber-400 underline">răsfoiește</span>
                </p>
                <p className="text-[9px] text-[#71717a]">PDF fișă tehnică, talon, contract, CIV</p>
              </div>

              {/* Buton Captură Rapidă cu Camera (CIV / Talon) - PMH-403 */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  title="Fotografiază talonul, CIV-ul sau detaliul vehiculului cu camera telefonului"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Foto Cameră Showroom (CIV / Talon)</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
              </div>

              {/* Listă fișiere atașate */}
              {attachments.length > 0 && (
                <div className="space-y-1 mt-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-white text-[11px] truncate">{att.fileName}</span>
                        <span className="text-[9px] text-[#71717a] shrink-0">
                          ({Math.round(att.fileSize / 1024)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(idx); }}
                        className="text-[#71717a] hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── COLOANA DREAPTA: EDITOR OFERTĂ & PREVIZUALIZARE (7 col) ─────── */}
          <div className="lg:col-span-7 p-4 flex flex-col space-y-3 bg-[#121215]">
            
            {/* Câmpuri E-mail Destinatar & Subiect */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">
                  E-mail Client (Destinatar)*
                </label>
                <input
                  type="email"
                  placeholder="client@domeniu.ro"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">
                  Nume Client (opțional)
                </label>
                <input
                  type="text"
                  placeholder="ex: Andrei Popescu"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">
                Subiect E-mail*
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Selector Comutare Mod Vizualizare: Editor Text vs Preview E-mail */}
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
              <span className="text-xs font-semibold text-white">
                {isHtmlPreview ? 'Previzualizare E-mail (Format HTML Destinatar)' : 'Editor Conținut Ofertă'}
              </span>

              <div className="flex items-center gap-1 bg-[#18181c] border border-[#27272a] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsHtmlPreview(false)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    !isHtmlPreview ? 'bg-amber-500 text-black font-bold' : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  Editor Text
                </button>
                <button
                  type="button"
                  onClick={() => setIsHtmlPreview(true)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1 transition-colors ${
                    isHtmlPreview ? 'bg-amber-500 text-black font-bold' : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview Client</span>
                </button>
              </div>
            </div>

            {/* Zona Principală de Editare / Preview */}
            <div className="flex-1 min-h-[300px] flex flex-col">
              {!isHtmlPreview ? (
                <textarea
                  rows={14}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full flex-1 bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-xs text-[#f4f4f5] font-sans leading-relaxed resize-none focus:outline-none focus:border-amber-500/60"
                  placeholder="Scrie sau ajustează conținutul ofertei..."
                />
              ) : (
                /* Previzualizare HTML a ofertei stilizate Dark Luxury */
                <div className="w-full flex-1 bg-[#09090b] border border-[#27272a] rounded-xl p-4 overflow-y-auto space-y-4">
                  <div className="border-b-2 border-amber-500 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400">{dealershipName}</h3>
                      <p className="text-[11px] text-[#71717a]">Ofertă Oficială de Vânzări • ParcOS Mail Hub</p>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-bold">
                      {pricingData?.isVatDeductible ? 'TVA 21% DEDUCTIBIL' : 'REGIM MARJĂ ART. 312'}
                    </span>
                  </div>

                  {currentVehicle?.images && currentVehicle.images.length > 0 && (
                    <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-[#27272a]">
                      <img
                        src={normalizeCarImageUrl(currentVehicle.images[0])}
                        alt="Foto Vehicul"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="text-xs text-[#e4e4e7] leading-relaxed whitespace-pre-wrap font-sans">
                    {bodyText}
                  </div>

                  <div className="pt-3 border-t border-[#27272a] text-[10px] text-[#71717a] text-center space-y-1">
                    <p>🛡️ Opțional: Rezervare securizată direct cu parcul auto prin <strong>{WARRANTY_TERM}</strong> ({dealerBankName}).</p>
                    <p>© 2026 {dealership} • Toate drepturile rezervate.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bară Subsol: Info Fiscală & Buton Trimitere SES */}
            <div className="pt-2 border-t border-[#27272a] flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-[#71717a] flex items-center gap-1.5 truncate">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Livrat prin AWS SES Outbound • DKIM & SPF Semnat</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-[#a1a1aa] hover:text-white"
                >
                  Anulează
                </button>

                <button
                  type="button"
                  onClick={handleSendOffer}
                  disabled={isSending || !recipientEmail || !subject}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/15 transition-all transform active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Se expediază prin SES...' : 'Trimite Oferta'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
