import React from 'react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { calculateRate, formatMileage, getStockNumber } from '../../utils/helpers';
import { useQrCodeDataUrl } from '../../utils/qrCodeGenerator';

interface PrintableWindowStickerProps {
  car: VehicleItem;
  dealer?: typeof SEED_DEALER;
  orientation?: 'portrait' | 'landscape';
  showVin?: boolean;
}

export const PrintableWindowSticker: React.FC<PrintableWindowStickerProps> = ({
  car,
  dealer = SEED_DEALER,
  orientation = 'portrait',
  showVin = false
}) => {
  const stockRef = getStockNumber(car);
  const estimatedMonthlyRate = calculateRate(car.priceEur, 15, 48);
  const targetCarUrl = typeof window !== 'undefined' && window.location?.origin 
    ? `${window.location.origin}/?car=${car.id}` 
    : `https://rxmautomobile.ro/?car=${car.id}`;
  
  // ⚡ Motor QR Code Local 100% Offline (fără apeluri către api.qrserver.com)
  const qrCodeUrl = useQrCodeDataUrl(targetCarUrl, { width: 300, margin: 1 });

  // Detalii reducere & Ofertă Promoțională
  const hasDiscount = !!(car.oldPriceEur && car.oldPriceEur > car.priceEur);
  const savings = hasDiscount ? car.oldPriceEur! - car.priceEur : 0;
  const isDeal = car.isDealOfWeek || hasDiscount;
  const dealBadge = car.dealBadgeText || 'OFERTA SĂPTĂMÂNII';

  // Detalii TVA 21% (Invariantă CARVANA SRL)
  const netPriceEur = Math.round(car.priceEur / 1.21);
  const vatAmountEur = car.priceEur - netPriceEur;

  // Caracteristici principale
  const topFeatures = [
    ...(car.features?.safety || []),
    ...(car.features?.comfort || []),
    ...(car.features?.multimedia || [])
  ].slice(0, 8);

  // =========================================================================
  // 📄 VARIANTA 1: FORMAT PORTRAIT (VERTICAL A4)
  // =========================================================================
  if (orientation === 'portrait') {
    return (
      <div className="printable-doc printable-window-sticker bg-white text-black p-5 sm:p-6 max-w-[210mm] mx-auto font-sans leading-normal print:p-0 border-4 border-amber-500 rounded-2xl shadow-xl overflow-visible">
        
        {/* 1. Antet Oficial Dealer */}
        <div className="bg-[#09090b] text-white p-5 rounded-xl flex items-center justify-between mb-4 border border-amber-500/30">
          <div>
            <div className="text-2xl font-black tracking-wider text-amber-400 flex items-center gap-2">
              <span>{dealer.name}</span>
            </div>
            <div className="text-xs text-zinc-300 font-medium tracking-widest uppercase mt-0.5">
              DEALER AUTO RULATE PREMIUM • CLUJ-NAPOCA
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <div className="font-bold text-amber-300 font-mono text-sm">
              {dealer.phonePrimary} / {dealer.phoneSecondary}
            </div>
            <div className="text-zinc-400 text-[11px]">
              {dealer.address}
            </div>
            <div className="text-zinc-400 text-[11px] font-mono">
              rxmautomobile.ro
            </div>
          </div>
        </div>

        {/* 2. Titlu Mașină, Versiune & Stock Ref */}
        <div className="mb-4 text-center border-b-2 border-zinc-200 pb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
              STOC #{stockRef}
            </span>
            {isDeal && (
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-black">
                🔥 {dealBadge}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
            {car.brand} {car.model}
          </h1>
          <div className="text-base font-bold text-amber-600 mt-0.5 tracking-wide">
            {car.versionTrim}
          </div>
        </div>

        {/* 3. Bloc Preț Imens & Rata Lunară (Optimizat Împotriva Suprapunerii Fonturilor) */}
        <div className="grid grid-cols-2 gap-4 mb-5 items-stretch">
          
          {/* Preț Vânzare Showroom */}
          <div className="bg-zinc-900 text-white p-4 sm:p-5 rounded-xl flex flex-col justify-between items-center text-center shadow-md relative min-h-[148px]">
            {hasDiscount && (
              <div className="w-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase py-0.5 mb-1 rounded">
                REDUCERE SPECIALĂ: -{savings.toLocaleString('ro-RO')} €
              </div>
            )}
            
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 leading-snug">
              PREȚ DE VÂNZARE SHOWROOM
            </div>

            {hasDiscount && (
              <div className="text-base font-mono font-bold line-through text-zinc-400 my-0.5">
                {car.oldPriceEur!.toLocaleString('ro-RO')} €
              </div>
            )}

            <div className={`font-black font-mono tracking-tight text-white leading-none my-2 ${hasDiscount ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-[44px]'}`}>
              {car.priceEur.toLocaleString('ro-RO')} €
            </div>

            <div className="text-[10px] font-semibold text-zinc-300 leading-snug px-1 mt-1 text-center">
              {car.vatDeductible ? (
                <span className="text-emerald-400 font-bold block">
                  TVA DEDUCTIBIL 21% INCLUS • NET: {netPriceEur.toLocaleString('ro-RO')} € + TVA: {vatAmountEur.toLocaleString('ro-RO')} €
                </span>
              ) : (
                <span className="text-zinc-300 block">
                  REGIM MARJĂ DE PROFIT SECOND-HAND (FĂRĂ TVA ADĂUGAT)
                </span>
              )}
            </div>
          </div>

          {/* Rata Lunară Estimată */}
          <div className="bg-amber-50 border-2 border-amber-400/80 p-4 sm:p-5 rounded-xl flex flex-col justify-between items-center text-center min-h-[148px]">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-800 leading-snug">
              DISPONIBIL ȘI ÎN RATE FIXE
            </div>
            <div className="text-3xl sm:text-[38px] font-black font-mono text-amber-900 leading-none my-2 whitespace-nowrap">
              de la {estimatedMonthlyRate} € <span className="text-base font-bold text-amber-800">/ lună</span>
            </div>
            <div className="text-[10.5px] font-bold text-amber-700 leading-snug mt-1">
              Avans de la 0% • BT Direct / TBI Bank / UniCredit
            </div>
          </div>

        </div>

        {/* 4. Grilă Specificații Tehnice Cheie */}
        <div className="grid grid-cols-4 gap-2.5 mb-5 text-center text-xs">
          <div className="bg-zinc-100 p-2.5 rounded-lg border border-zinc-300">
            <div className="text-[10px] text-zinc-500 font-bold uppercase leading-snug">An Fabricație</div>
            <div className="text-base font-black text-zinc-900 leading-snug mt-0.5">{car.year}</div>
          </div>
          <div className="bg-zinc-100 p-2.5 rounded-lg border border-zinc-300">
            <div className="text-[10px] text-zinc-500 font-bold uppercase leading-snug">Rulaj Certificat</div>
            <div className="text-base font-black text-zinc-900 leading-snug mt-0.5">{formatMileage(car.mileageKm)}</div>
          </div>
          <div className="bg-zinc-100 p-2.5 rounded-lg border border-zinc-300">
            <div className="text-[10px] text-zinc-500 font-bold uppercase leading-snug">Motorizare / Putere</div>
            <div className="text-base font-black text-zinc-900 leading-snug mt-0.5">{car.powerHp} CP ({car.fuelType})</div>
          </div>
          <div className="bg-zinc-100 p-2.5 rounded-lg border border-zinc-300">
            <div className="text-[10px] text-zinc-500 font-bold uppercase leading-snug">Transmisie</div>
            <div className="text-base font-black text-zinc-900 leading-snug mt-0.5">{car.transmission}</div>
          </div>
        </div>

        {/* 5. Top Dotări & Echipamente (Design Aerisit fără Truncate/Clipping) */}
        <div className="mb-5">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2 border-b border-zinc-200 pb-1">
            ECHIPAMENTE & DOTĂRI PRINCIPALE DE TOP:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {topFeatures.map((feat: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2.5 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200 min-h-[38px] overflow-visible">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                <span className="font-semibold text-zinc-800 text-[11px] sm:text-xs leading-snug overflow-visible break-words">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Bloc QR Code & Apel la Acțiune */}
        <div className="bg-zinc-100 border-2 border-dashed border-zinc-400 p-4 rounded-xl flex items-center justify-between gap-5">
          <div className="space-y-1.5 flex-1">
            <div className="text-sm font-black text-zinc-900 uppercase flex items-center gap-2">
              <span>📱 SCANEAZĂ CODUL CU CAMERA TELEFONULUI</span>
            </div>
            <p className="text-xs text-zinc-700 leading-normal">
              Dacă ne vizitezi în afara orelor de program, scanează codul alăturat pentru a vedea:
            </p>
            <ul className="text-xs text-zinc-800 space-y-0.5 font-medium">
              <li>• <strong className="text-amber-700">Videoclipul complet TikTok / YouTube</strong> cu prezentarea mașinii</li>
              <li>• Galeria foto de înaltă rezoluție cu peste 20 de detalii</li>
              <li>• Transmite mesaj direct pe <strong className="text-emerald-700">WhatsApp</strong> pentru rezervare</li>
            </ul>
          </div>

          <div className="flex flex-col items-center flex-shrink-0 bg-white p-2 rounded-xl border border-zinc-300 shadow-sm">
            <img 
              src={qrCodeUrl} 
              alt="QR Code Pagina Masina" 
              className="w-28 h-28 object-contain" 
            />
            <span className="text-[9px] font-bold font-mono text-zinc-500 mt-1">
              SCAN TO VIEW
            </span>
          </div>
        </div>

        {/* 7. Footer de Siguranță & Garanție */}
        <div className="mt-4 pt-3 border-t border-zinc-300 flex items-center justify-between text-[11px] text-zinc-600 font-semibold">
          <div className="flex items-center gap-2 text-emerald-800">
            <span>🛡️ GARANȚIE DEALER {dealer.name} ({car.warrantyMonths || 12} LUNI)</span>
            <span>•</span>
            <span>KM REALI CERTIFICAȚI FACTURĂ</span>
            <span>•</span>
            <span>GARANȚIE DE REZERVARE</span>
          </div>
          <div className="font-mono text-zinc-700 font-bold">
            STOC #{stockRef}{showVin && car.vin ? ` • VIN: ${car.vin}` : ''}
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // 📄 VARIANTA 2: FORMAT LANDSCAPE (ORIZONTAL A4 - 2 COLOANE OPTIMIZATE)
  // =========================================================================
  return (
    <div className="printable-doc printable-window-sticker bg-white text-black p-6 max-w-[297mm] mx-auto font-sans leading-normal print:p-0 border-4 border-amber-500 rounded-2xl shadow-xl overflow-visible">
      
      {/* Antet Dealer Complet pe Toată Lățimea */}
      <div className="bg-[#09090b] text-white p-4 rounded-xl flex items-center justify-between mb-4 border border-amber-500/30">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black tracking-wider text-amber-400">
            {dealer.name}
          </span>
          <span className="text-xs text-zinc-300 font-medium tracking-widest uppercase border-l border-zinc-700 pl-4">
            DEALER AUTO RULATE PREMIUM • CLUJ-NAPOCA
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-amber-300 font-bold">
            {dealer.phonePrimary} / {dealer.phoneSecondary}
          </span>
          <span className="text-zinc-400 font-sans">
            {dealer.address}
          </span>
          <span className="text-zinc-400 font-bold">
            STOC #{stockRef}
          </span>
        </div>
      </div>

      {/* Grid Landscape pe 2 Coloane */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        
        {/* Coloana Stânga: Titlu, Date Tehnice, Dotări */}
        <div className="col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Titlu & Versiune */}
          <div className="border-b-2 border-zinc-200 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                STOC #{stockRef}
              </span>
              {isDeal && (
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black">
                  🔥 {dealBadge}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
              {car.brand} {car.model}
            </h1>
            <div className="text-base font-bold text-amber-600 mt-0.5 tracking-wide">
              {car.versionTrim}
            </div>
          </div>

          {/* Grilă Specificații Tehnice */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-zinc-100 p-2 rounded-lg border border-zinc-300">
              <div className="text-[9px] text-zinc-500 font-bold uppercase leading-snug">An Fabricație</div>
              <div className="text-base font-black text-zinc-900 leading-snug mt-0.5">{car.year}</div>
            </div>
            <div className="bg-zinc-100 p-2 rounded-lg border border-zinc-300">
              <div className="text-[9px] text-zinc-500 font-bold uppercase leading-snug">Rulaj Certificat</div>
              <div className="text-base font-black text-zinc-900 leading-snug mt-0.5">{formatMileage(car.mileageKm)}</div>
            </div>
            <div className="bg-zinc-100 p-2 rounded-lg border border-zinc-300">
              <div className="text-[9px] text-zinc-500 font-bold uppercase leading-snug">Motor / Putere</div>
              <div className="text-base font-black text-zinc-900 leading-snug mt-0.5">{car.powerHp} CP ({car.fuelType})</div>
            </div>
            <div className="bg-zinc-100 p-2 rounded-lg border border-zinc-300">
              <div className="text-[9px] text-zinc-500 font-bold uppercase leading-snug">Transmisie</div>
              <div className="text-base font-black text-zinc-900 leading-snug mt-0.5">{car.transmission}</div>
            </div>
          </div>

          {/* Dotări Principale (Design Aerisit fără Truncate/Clipping) */}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2 border-b border-zinc-200 pb-1">
              ECHIPAMENTE & DOTĂRI DE TOP:
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {topFeatures.map((feat: string, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1.5 rounded-lg border border-zinc-200 min-h-[34px] overflow-visible">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">✓</span>
                  <span className="font-semibold text-zinc-800 text-[11px] leading-snug overflow-visible break-words">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Tehnic */}
          <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-600 font-semibold">
            <span className="text-emerald-800">🛡️ GARANȚIE DEALER {dealer.name} ({car.warrantyMonths || 12} LUNI)</span>
            {showVin && car.vin ? (
              <span className="font-mono text-zinc-700 font-bold">VIN: {car.vin}</span>
            ) : (
              <span className="font-mono text-zinc-700 font-bold">STOC #{stockRef}</span>
            )}
          </div>

        </div>

        {/* Coloana Dreapta: Preț, Rate, QR Code */}
        <div className="col-span-5 flex flex-col justify-between space-y-3">
          
          {/* Preț Vânzare Showroom */}
          <div className="bg-zinc-900 text-white p-4 rounded-xl flex flex-col justify-between items-center text-center shadow-md relative min-h-[128px]">
            {hasDiscount && (
              <div className="w-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase py-0.5 mb-1 rounded">
                REDUCERE: -{savings.toLocaleString('ro-RO')} € (DE LA {car.oldPriceEur!.toLocaleString('ro-RO')} €)
              </div>
            )}
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 leading-snug">
              PREȚ DE VÂNZARE SHOWROOM
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white leading-none my-1.5">
              {car.priceEur.toLocaleString('ro-RO')} €
            </div>
            <div className="text-[10px] font-semibold text-zinc-300 leading-snug mt-1 text-center">
              {car.vatDeductible ? (
                <span className="text-emerald-400 font-bold block">
                  TVA DEDUCTIBIL 21% INCLUS • NET: {netPriceEur.toLocaleString('ro-RO')} €
                </span>
              ) : (
                <span className="text-zinc-300 block">REGIM MARJĂ SECOND-HAND (FĂRĂ TVA ADĂUGAT)</span>
              )}
            </div>
          </div>

          {/* Rate Lunare */}
          <div className="bg-amber-50 border-2 border-amber-400/80 p-3.5 rounded-xl flex flex-col justify-between items-center text-center min-h-[128px]">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-800 leading-snug">
              RATE FIXE FĂRĂ AVANS
            </div>
            <div className="text-2xl font-black font-mono text-amber-900 leading-none my-1.5 whitespace-nowrap">
              de la {estimatedMonthlyRate} € <span className="text-sm font-bold text-amber-800">/ lună</span>
            </div>
            <div className="text-[10px] font-bold text-amber-700 leading-snug mt-1">
              BT Direct • TBI Bank • UniCredit
            </div>
          </div>

          {/* Bloc QR Code */}
          <div className="bg-zinc-100 border-2 border-dashed border-zinc-400 p-3 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-1 flex-1 text-xs">
              <div className="font-black text-zinc-900 uppercase text-[11px]">
                📱 SCANEAZĂ PENTRU VIDEO & GALERIE HD
              </div>
              <p className="text-[10px] text-zinc-600 leading-tight">
                Scanează cu camera telefonului pentru a vedea clipul TikTok, pozele detaliate sau pentru contact WhatsApp.
              </p>
            </div>
            <div className="flex flex-col items-center flex-shrink-0 bg-white p-1.5 rounded-lg border border-zinc-300 shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="QR Code Pagina Masina" 
                className="w-20 h-20 object-contain" 
              />
              <span className="text-[8px] font-bold font-mono text-zinc-500 mt-0.5">
                SCAN TO VIEW
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
