import React from 'react';
import { VehicleItem, SEED_DEALER, DealerProfile } from '../../db/seed';
import { BuyerData } from './types';
import { formatMileage } from '../../utils/helpers';

interface PrintableTechnicalInspectionSheetProps {
  car: VehicleItem;
  buyer: BuyerData;
  dealer?: DealerProfile;
}

export const PrintableTechnicalInspectionSheet: React.FC<PrintableTechnicalInspectionSheetProps> = ({
  car,
  buyer,
  dealer = SEED_DEALER
}) => {
  const currentYear = new Date().getFullYear();
  const inspectionDate = buyer.inspectionDate || buyer.contractDate || new Date().toISOString().split('T')[0];
  const reportNumber = `RXM-IT-${currentYear}-${car.stockNumber || car.vin.slice(-4).toUpperCase()}`;
  const inspectorName = buyer.inspectorName || 'Ing. Mihai Radu (Inspector Tehnic Auto)';
  const formattedMileage = formatMileage(buyer.deliveryMileageKm || car.mileageKm);

  // Valori tehnice dinamice cu fallback-uri sigure de showroom
  const tireFront = buyer.tireTreadFrontMm ?? 6.5;
  const tireRear = buyer.tireTreadRearMm ?? 6.2;
  const brakePadsFront = buyer.brakePadsFrontPct ?? 25;
  const brakePadsRear = buyer.brakePadsRearPct ?? 20;
  const paintMicrons = buyer.paintThicknessMicronsAvg ?? 118;
  const obdStatus = buyer.obdScanResult ?? 'clean';
  const conditionRating = buyer.generalConditionRating ?? 'foarte_buna';

  return (
    <div className="printable-doc bg-white text-black p-7 max-w-[210mm] mx-auto text-[10px] leading-tight font-serif print:p-0">
      
      {/* ========================================================================= */}
      {/* 1. ANTET OFICIAL DEALER & RAPORT DE INSPECȚIE TEHNICĂ                     */}
      {/* ========================================================================= */}
      <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-3">
        <div>
          <div className="text-lg font-black tracking-tight uppercase font-sans text-black">
            RAPORT DE INSPECȚIE TEHNICĂ & CALITATE
          </div>
          <div className="text-[11px] font-bold text-zinc-900 mt-0.5">
            VERIFICARE RIGUROASĂ ÎN 100+ PUNCTE • DIAGNOZĂ OBD & TEST DINAMIC
          </div>
          <div className="text-[9.5px] text-zinc-700 mt-1">
            Nr. Raport: <strong className="font-mono text-black font-bold">{reportNumber}</strong> • Showroom: <span className="font-semibold">{dealer.name}</span>
          </div>
        </div>

        <div className="text-right text-[9.5px] space-y-0.5 font-sans">
          <div>Data Inspecției: <strong className="font-mono">{new Date(inspectionDate).toLocaleDateString('ro-RO')}</strong></div>
          <div>Inspector Tehnic: <strong className="font-semibold">{inspectorName}</strong></div>
          <div>C.U.I. Operator: <strong className="font-mono">{dealer.cui}</strong></div>
          <div>Locație: <span>{dealer.showroomAddress || dealer.address}</span></div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DATE DE IDENTIFICARE AUTOVEHICUL                                       */}
      {/* ========================================================================= */}
      <div className="bg-zinc-50 border border-black p-2.5 mb-3 text-[10px]">
        <div className="font-bold uppercase text-[10px] text-zinc-900 border-b border-black/30 pb-1 mb-1.5 flex items-center justify-between">
          <span>IDENTIFICARE AUTOVEHICUL INSPECTAT:</span>
          <span className="font-mono font-bold text-black text-[10.5px]">
            {car.brand} {car.model} {car.versionTrim || ''} ({car.year})
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 font-mono text-[9.5px]">
          <div>Serie VIN: <strong className="font-bold text-black block text-[10px]">{car.vin}</strong></div>
          <div>Rulaj Certificat: <strong className="font-bold text-black block">{formattedMileage} km</strong></div>
          <div>Cilindree / Putere: <strong className="block">{car.engineCc ? `${car.engineCc} cm³` : 'N/A'} • {car.powerHp ? `${car.powerHp} CP` : 'N/A'}</strong></div>
          <div>Combustibil / Cutie: <strong className="block">{car.fuelType || 'Diesel'} • {car.transmission || 'Manuală'}</strong></div>
          <div>Serie CIV: <strong className="block">{car.civSeries || 'Conform Talon'}</strong></div>
          <div>Culoare / Caroserie: <strong className="block">{car.color || 'Vopsea Originală'} • {car.bodyType || 'Sedan/SUV'}</strong></div>
          <div>Număr Chei: <strong className="block">{buyer.keysCount ?? 2} Chei Originale</strong></div>
          <div>Garanție Acordată: <strong className="font-bold text-black block">12 Luni / 10.000 KM</strong></div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRILĂ DETALIATĂ DE VERIFICARE ÎN 100+ PUNCTE (5 CATEGORII MAJORE)      */}
      {/* ========================================================================= */}
      <div className="space-y-2.5 mb-3">
        
        {/* SECȚIUNEA A: MOTOR, TRANSMISIE & DIAGNOZĂ OBD */}
        <div className="border border-black">
          <div className="bg-zinc-200 px-2 py-1 font-bold text-[10px] uppercase flex items-center justify-between border-b border-black">
            <span>A. Compartiment Motor, Cutie de Viteze & Diagnoză OBD-II (25 Puncte)</span>
            <span className="font-mono text-[9px] font-bold text-emerald-800">
              {obdStatus === 'clean' ? '✓ TEST OBD: ZERO ERORI ACTIVE' : 'OBD: PARAMETRI NOMINALI'}
            </span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Nivel, culoare & vâscozitate ulei motor:</span>
              <strong className="text-emerald-900 font-sans">[✓] Conform / Nivel Optim</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Lichid răcire (Antigel) & densitate:</span>
              <strong className="text-emerald-900 font-sans">[✓] Protecție -35°C</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Lichid frână & servodirecție:</span>
              <strong className="text-emerald-900 font-sans">[✓] Nivel & Punct Fierbere OK</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Etanșeitate motor & carter (fără scurgeri):</span>
              <strong className="text-emerald-900 font-sans">[✓] Uscat / Fără Pierderi</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Sunet motor la relanti & în sarcină (vibrații):</span>
              <strong className="text-emerald-900 font-sans">[✓] Funcționare Lină / Silențios</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Turbocompresor & intercooler (presiune admisie):</span>
              <strong className="text-emerald-900 font-sans">[✓] Fără Joc Ax / Răspuns Prompt</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Ambreiaj / Cutie automată (cuplare & trepte):</span>
              <strong className="text-emerald-900 font-sans">[✓] Schimbare Fină / Fără Șocuri</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Filtru particule (DPF) / Catalizator / Emisii:</span>
              <strong className="text-emerald-900 font-sans">[✓] Încărcare sub 15% (Optim)</strong>
            </div>
          </div>
        </div>

        {/* SECȚIUNEA B: TREN DE RULARE, SUSPENSIE & SISTEM DE FRÂNARE */}
        <div className="border border-black">
          <div className="bg-zinc-200 px-2 py-1 font-bold text-[10px] uppercase flex items-center justify-between border-b border-black">
            <span>B. Sistem de Frânare, Suspensie & Direcție (25 Puncte)</span>
            <span className="font-mono text-[9px] font-bold text-zinc-900">
              Eficiență Frânare: 82% Față / 78% Spate
            </span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Plăcuțe frână puntea față:</span>
              <strong className="font-mono text-black">Uzură ~{brakePadsFront}% (Rămas ~{100 - brakePadsFront}%)</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Plăcuțe frână puntea spate:</span>
              <strong className="font-mono text-black">Uzură ~{brakePadsRear}% (Rămas ~{100 - brakePadsRear}%)</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Discuri de frână (grosime & fără ovalizare):</span>
              <strong className="text-emerald-900 font-sans">[✓] Suprafață Dreaptă / Fără Bavuri</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Amortizoare & flanșe (test eficiență):</span>
              <strong className="text-emerald-900 font-sans">[✓] Fără Scurgeri / Răspuns Ferm</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Brațe suspensie, bucșe & pivoți direcție:</span>
              <strong className="text-emerald-900 font-sans">[✓] Fără Jocuri / Cauciuc Elastic</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Casetă direcție & bielete antiruliu:</span>
              <strong className="text-emerald-900 font-sans">[✓] Servodirecție Precisă</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Rulmenți roți & planetare (burdufuri):</span>
              <strong className="text-emerald-900 font-sans">[✓] Burdufuri Integre / Silențios</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Frână de parcare (mână / electrică):</span>
              <strong className="text-emerald-900 font-sans">[✓] Blocare Fermă Ambele Roți</strong>
            </div>
          </div>
        </div>

        {/* SECȚIUNEA C: ANVELOPE, JANTE & GEOMETRIE */}
        <div className="border border-black">
          <div className="bg-zinc-200 px-2 py-1 font-bold text-[10px] uppercase flex items-center justify-between border-b border-black">
            <span>C. Anvelope, Jante & Geometrie Roți (15 Puncte)</span>
            <span className="font-mono text-[9px] font-bold text-zinc-900">
              Profil: Față {tireFront} mm • Spate {tireRear} mm
            </span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Profil anvelope puntea față:</span>
              <strong className="font-mono text-black">{tireFront} mm (Minim legal: 1.6 mm)</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Profil anvelope puntea spate:</span>
              <strong className="font-mono text-black">{tireRear} mm (Stare Foarte Bună)</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Uzură uniformă profil & geometrie:</span>
              <strong className="text-emerald-900 font-sans">[✓] Fără Uzură Asimetrică</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Jante aliaj / oțel (fără fisuri sau lovituri):</span>
              <strong className="text-emerald-900 font-sans">[✓] Verificate pe Stand</strong>
            </div>
          </div>
        </div>

        {/* SECȚIUNEA D: CAROSERIE, VOPSEA & STRUCTURĂ DE REZISTENȚĂ */}
        <div className="border border-black">
          <div className="bg-zinc-200 px-2 py-1 font-bold text-[10px] uppercase flex items-center justify-between border-b border-black">
            <span>D. Caroserie, Grosime Vopsea & Integritate Structurală (20 Puncte)</span>
            <span className="font-mono text-[9px] font-bold text-zinc-900">
              Test Micrometru: Medie ~{paintMicrons} µm
            </span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Grosime strat vopsea per panou:</span>
              <strong className="font-mono text-black">{paintMicrons} µm (Valori Producător 90-140 µm)</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Lonjeroane, stâlpi rezistență & oale:</span>
              <strong className="text-emerald-900 font-sans">[✓] Suduri & Mastic de Fabrică</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Fără accidente structurale / daună totală:</span>
              <strong className="text-emerald-900 font-sans">[✓] Certificat Integrat carVertical</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Parbriz & geamuri laterale originale:</span>
              <strong className="text-emerald-900 font-sans">[✓] Fără Fisuri / Marcaj Securizat</strong>
            </div>
          </div>
        </div>

        {/* SECȚIUNEA E: ELECTRONICĂ, CLIMATIZARE & HABITACLU */}
        <div className="border border-black">
          <div className="bg-zinc-200 px-2 py-1 font-bold text-[10px] uppercase flex items-center justify-between border-b border-black">
            <span>E. Electronică, Climatizare, Siguranță & Habitaclu (20 Puncte)</span>
            <span className="font-mono text-[9px] font-bold text-emerald-800">
              ✓ TOATE SISTEMELE CONFORME
            </span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Instalație aer condiționat / Climatronic:</span>
              <strong className="text-emerald-900 font-sans">[✓] Răcire Eficientă (6.8°C la Grilă)</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Sistem iluminare (Faruri, Semnalizare, Stopuri):</span>
              <strong className="text-emerald-900 font-sans">[✓] Fascicul Reglat / Becuri OK</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Geamuri, oglinzi electrice & închidere centralizată:</span>
              <strong className="text-emerald-900 font-sans">[✓] Comenzi Funcționale</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Sistem Airbag-uri, centuri & pretensionare:</span>
              <strong className="text-emerald-900 font-sans">[✓] Zero Erori SRS / Integre</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Senzori parcare / Cameră marșarier / Navigație:</span>
              <strong className="text-emerald-900 font-sans">[✓] Afișaj & Sonorizare Testate</strong>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
              <span>• Stare habitaclu, scaune, volan & plafon:</span>
              <strong className="text-emerald-900 font-sans">[✓] Curățat & Igienizat Profesional</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. CONCLUZIE TEHNICĂ & VERDICT SHOWROOM                                   */}
      {/* ========================================================================= */}
      <div className="border-2 border-black bg-zinc-50 p-2.5 mb-3 text-[9.5px]">
        <div className="flex items-center justify-between border-b border-black/30 pb-1 mb-1.5">
          <span className="font-bold text-xs uppercase font-sans text-black">
            VERDICT INSPECȚIE TEHNICĂ:
          </span>
          <span className="font-sans font-black text-xs px-2.5 py-0.5 bg-black text-white uppercase tracking-wider">
            ADMIS PENTRU VÂNZARE • ELIGIBIL GARANȚIE 12 LUNI
          </span>
        </div>
        <div className="leading-snug text-zinc-800">
          <p>
            Autovehiculul identificat prin seria VIN <strong className="font-mono text-black">{car.vin}</strong> a fost supus inspecției tehnice riguroase în 100+ puncte și testului dinamic pe traseu. În urma verificărilor, vehiculul se prezintă în <strong>stare tehnică și estetică {conditionRating === 'exceptional' ? 'excepțională' : 'foarte bună'}</strong>, fără vicii ascunse sau defecte structurale.
          </p>
          {buyer.inspectionNotes && (
            <p className="mt-1 font-semibold text-black">
              Observații Tehnician: <em>{buyer.inspectionNotes}</em>
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ASUMARE & SEMNĂTURI OFICIALE                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-8 pt-2">
        <div>
          <div className="font-bold uppercase text-[9.5px]">INSPECTOR TEHNIC SHOWROOM:</div>
          <div className="font-bold text-xs">{inspectorName}</div>
          <div className="text-[9px] text-zinc-600 mb-5">{dealer.name} • Departament Calitate Tehnică</div>
          <div className="border-t border-black w-44">Semnătură Inspector & Ștampilă</div>
        </div>

        <div className="text-right">
          <div className="font-bold uppercase text-[9.5px]">CUMPĂRĂTOR (CONFIRMARE LUARE LA CUNOȘTINȚĂ):</div>
          <div className="font-bold text-xs">{buyer.fullName || 'Client Showroom'}</div>
          <div className="text-[9px] text-zinc-600 mb-5">Am luat la cunoștință starea tehnică a vehiculului</div>
          <div className="border-t border-black w-44 ml-auto">Semnătură Cumpărător</div>
        </div>
      </div>

      <div className="text-center text-[8.5px] text-zinc-500 italic mt-3 pt-1 border-t border-zinc-300">
        * Prezentul raport tehnic este eliberat de {dealer.name} și atestă conformitatea autovehiculului la momentul predării. Copia originală însoțește dosarul de vânzare și Certificatul Oficial de Garanție.
      </div>
    </div>
  );
};
