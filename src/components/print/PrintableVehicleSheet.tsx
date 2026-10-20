import React from 'react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { calculateRate as defaultCalcRate, getStockNumber, formatMileage } from '../../utils/helpers';
import { convertEurToRon } from '../../utils/currencyEngine';

interface PrintableVehicleSheetProps {
  selectedCar: VehicleItem | null;
  dealer?: typeof SEED_DEALER;
  calculateRate?: (price: number, advPct: number, months: number) => number;
}

export const PrintableVehicleSheet: React.FC<PrintableVehicleSheetProps> = ({
  selectedCar,
  dealer = SEED_DEALER,
  calculateRate = defaultCalcRate
}) => {
  if (!selectedCar) return null;

  const stockRef = getStockNumber(selectedCar);
  const dealerName = dealer.name || 'RXM AUTOMOBILE SRL';
  const dealerRegCom = dealer.regCom || 'J12/3012/13.07.2023';
  const dealerAddress = dealer.showroomAddress || dealer.address || 'Strada Colonia Hodai F.N., Cluj-Napoca, jud. Cluj';

  return (
    <div className="print-only printable-dossier w-full text-black bg-white font-sans text-left leading-normal print:p-0 print:m-0">
      {/* Header Oficial Dealer */}
      <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-2 mb-2 gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img src="/rxm/images/rxm-emblem.png" alt={dealerName} className="w-10 h-10 object-contain shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-black tracking-tight text-zinc-900 leading-tight uppercase truncate">{dealerName}</h1>
            <p className="text-[10.5px] text-zinc-700 font-semibold truncate">Dealer Autovehicule Rulate Premium • Cluj-Napoca</p>
            <p className="text-[9px] text-zinc-500">CUI: {dealer.cui} • Reg. Com: {dealerRegCom}</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-zinc-700 leading-tight max-w-[280px] shrink-0">
          <div className="font-bold text-zinc-900">Punct de Lucru & Showroom:</div>
          <div className="leading-snug">{dealerAddress}</div>
          <div>Tel: {dealer.phonePrimary} {dealer.phoneSecondary ? `/ ${dealer.phoneSecondary}` : ''}</div>
          <div className="font-mono text-zinc-900 font-semibold">{dealer.email}</div>
          <div className="text-[8.5px] text-zinc-500 mt-0.5">Data emiterii: {new Date().toLocaleDateString('ro-RO')}</div>
        </div>
      </div>

      {/* Titlu, Cod Stoc & Preț */}
      <div className="flex justify-between items-end border-b border-zinc-200 pb-2 mb-2.5 gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Fișă de Ofertă Vehicul Rulat
            </span>
            <span className="text-[9.5px] font-black uppercase font-mono tracking-wider text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
              COD STOC: #{stockRef}
            </span>
            {selectedCar.warrantyMonths > 0 && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Garanție {selectedCar.warrantyMonths} Luni
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-zinc-900 leading-snug truncate">
            {selectedCar.brand} {selectedCar.model}
          </h2>
          <div className="text-[11px] text-zinc-600 font-medium truncate">{selectedCar.versionTrim}</div>
        </div>
        <div className="text-right shrink-0 max-w-[260px]">
          <div className="text-2xl font-black text-zinc-900 font-mono leading-none">
            {selectedCar.priceEur.toLocaleString('ro-RO')} €
          </div>
          <div className="text-[10.5px] text-zinc-600 font-medium mt-0.5">
            {convertEurToRon(selectedCar.priceEur).toLocaleString('ro-RO')} RON (TVA inclus)
          </div>
          <div className="text-[9px] text-zinc-500 leading-tight mt-0.5">
            {selectedCar.vatDeductible ? 'TVA DEDUCTIBIL 21% — Posibilitate leasing PJ' : 'Regim Special Marjă art. 312 Cod Fiscal (TVA inclus)'}
          </div>
        </div>
      </div>

      {/* Imagine & Date Tehnice */}
      <div className="grid grid-cols-2 gap-3 mb-2.5 items-stretch">
        <div className="flex flex-col">
          <div className="w-full rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 h-[170px] flex items-center justify-center p-0.5">
            <img 
              src={selectedCar.images[0]} 
              alt={`${selectedCar.brand} ${selectedCar.model}`} 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="grid grid-cols-3 gap-1 mt-1.5 text-[8.5px] text-zinc-700 font-semibold text-center">
            <div className="bg-zinc-50 rounded px-1 py-0.5 border border-zinc-200 truncate">✓ 100+ Pct. Verificate</div>
            <div className="bg-zinc-50 rounded px-1 py-0.5 border border-zinc-200 truncate">✓ Km Reali pe Factură</div>
            <div className="bg-zinc-50 rounded px-1 py-0.5 border border-zinc-200 truncate">✓ Numere Roșii pe Loc</div>
          </div>
        </div>

        <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-200 text-xs flex flex-col justify-between">
          <div className="font-bold text-[11px] text-zinc-900 border-b border-zinc-200 pb-1 mb-1.5">Specificații Tehnice & Identificare</div>
          <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] leading-tight">
            <div><span className="text-zinc-500">Serie Șasiu (VIN):</span><br/><strong className="font-mono text-zinc-900">{selectedCar.vin}</strong> <span className="text-[8.5px] text-emerald-700 font-bold">✓ Verificat</span></div>
            <div><span className="text-zinc-500">Proveniență Acte:</span><br/><strong className="text-zinc-900">{selectedCar.docOriginCountry ? (selectedCar.docOriginCountry === 'DE' ? '🇩🇪 Germania' : selectedCar.docOriginCountry === 'AT' ? '🇦🇹 Austria' : selectedCar.docOriginCountry === 'FR' ? '🇫🇷 Franța' : selectedCar.docOriginCountry === 'IT' ? '🇮🇹 Italia' : selectedCar.docOriginCountry === 'NL' ? '🇳🇱 Olanda' : selectedCar.docOriginCountry === 'BE' ? '🇧🇪 Belgia' : selectedCar.docOriginCountry === 'US' ? '🇺🇸 SUA' : selectedCar.docOriginCountry === 'OTHER' ? '🌍 Import (UE / SUA)' : '🇷🇴 România') : '🇷🇴 România (CIV RAR)'}</strong></div>
            <div><span className="text-zinc-500">Kilometraj:</span><br/><strong className="font-mono text-zinc-900">{formatMileage(selectedCar.mileageKm)}</strong></div>
            <div><span className="text-zinc-500">Combustibil:</span><br/><strong className="text-zinc-900">{selectedCar.fuelType}</strong></div>
            <div><span className="text-zinc-500">Motorizare / Putere:</span><br/><strong className="text-zinc-900">{selectedCar.powerHp} CP ({selectedCar.engineCc} cmc)</strong></div>
            <div><span className="text-zinc-500">Transmisie:</span><br/><strong className="text-zinc-900">{selectedCar.transmission}</strong></div>
            <div><span className="text-zinc-500">Tracțiune:</span><br/><strong className="text-zinc-900">{selectedCar.drivetrain}</strong></div>
            <div><span className="text-zinc-500">Garanție Dealer:</span><br/><strong className="text-emerald-700 font-bold">{selectedCar.warrantyMonths} Luni (Certificat)</strong></div>
          </div>
        </div>
      </div>

      {/* Dotări & Echipamente */}
      <div className="mb-2.5">
        <div className="font-bold text-[11px] text-zinc-900 border-b border-zinc-200 pb-1 mb-1.5">Dotări & Echipamente Principale (Selectate):</div>
        <div className="grid grid-cols-3 gap-x-2.5 gap-y-1 text-[9px] text-zinc-800 leading-tight">
          {[...selectedCar.features.safety, ...selectedCar.features.comfort, ...selectedCar.features.multimedia].slice(0, 18).map((feat, i) => (
            <div key={i} className="flex items-center gap-1 min-w-0">
              <span className="text-emerald-600 font-bold shrink-0">✓</span>
              <span className="truncate" title={feat}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Simulare Finanțare & Condiții */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 mb-2.5 text-xs">
        <div className="font-bold text-[10.5px] text-amber-900 mb-0.5 flex justify-between items-center gap-2 flex-wrap">
          <span>Opțiune Finanțare în Rate (BT Direct / TBI Bank / UniCredit):</span>
          <span className="font-mono">Rată estimată: de la {calculateRate(selectedCar.priceEur, 15, 48)} € / lună</span>
        </div>
        <p className="text-[9px] text-amber-800 leading-tight">
          Calcul orientativ cu 15% avans pe 48 luni. Aprobare rapidă în 2 ore pe loc cu buletinul, avans 0% opțional, fără adeverință de venit. Posibilitate leasing financiar pentru SRL cu deductibilitate strictă TVA 21%.
        </p>
      </div>

      {/* Semnături & Contact */}
      <div className="border-t border-zinc-300 pt-2 flex justify-between items-end text-[10px] text-zinc-600 gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-zinc-900 uppercase truncate">{dealerName}</div>
          <div className="truncate">Consilier Vânzări: Echipa Vânzări {dealerName}</div>
          <div>Telefon: {dealer.phonePrimary} • {dealer.email}</div>
          <div className="text-[8.5px] text-zinc-400 mt-0.5 italic">*Prezenta fișă are caracter informativ și este valabilă în limita stocului disponibil.</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9px] text-zinc-500 mb-3">Semnătură & Ștampilă Dealer:</div>
          <div className="w-36 border-b border-zinc-400"></div>
        </div>
      </div>
    </div>
  );
};
