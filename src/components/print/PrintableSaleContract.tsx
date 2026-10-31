import React from 'react';
import { VehicleItem, SEED_DEALER, DealerProfile } from '../../db/seed';
import { BuyerData } from './types';
import { formatMileage } from '../../utils/helpers';

interface PrintableSaleContractProps {
  car: VehicleItem;
  buyer: BuyerData;
  dealer?: DealerProfile;
}

export const PrintableSaleContract: React.FC<PrintableSaleContractProps> = ({
  car,
  buyer,
  dealer = SEED_DEALER
}) => {
  const currentYear = new Date().getFullYear();
  const dealerPrefix = (dealer.slug || 'DEALER').toUpperCase().replace('_', '');
  const contractNumber = `${dealerPrefix}-VC-${currentYear}-${car.id.slice(-4).toUpperCase()}`;

  return (
    <div className="printable-doc bg-white text-black p-8 max-w-[210mm] mx-auto text-[11px] leading-tight font-serif print:p-0">
      {/* HEADER OFICIAL */}
      <div className="text-center font-bold text-sm tracking-wide uppercase border-b-2 border-black pb-2 mb-3">
        <div className="text-base font-extrabold tracking-tight">
          CONTRACT DE VÂNZARE - CUMPĂRARE
        </div>
        <div className="text-xs font-bold tracking-normal mt-0.5">
          PENTRU UN AUTOVEHICUL FOLOSIT (RULAT)
        </div>
        <div className="text-[10px] font-normal normal-case italic mt-0.5">
          Seria {contractNumber} din data de {buyer.contractDate || new Date().toLocaleDateString('ro-RO')}
        </div>
      </div>

      <p className="mb-2 text-[10.5px]">
        Încheiat astăzi, <span className="font-bold">{buyer.contractDate || new Date().toLocaleDateString('ro-RO')}</span>, la sediul/punctul de lucru <span className="font-bold">{dealer.name}</span> din <span className="font-bold">{dealer.address}</span>, între:
      </p>

      {/* PĂRȚILE CONTRACTANTE */}
      <div className="grid grid-cols-2 gap-3 border border-black p-2.5 mb-2.5 text-[10px]">
        <div>
          <div className="font-bold uppercase text-[10.5px] border-b border-black/30 pb-0.5 mb-1 text-zinc-900">
            1. VÂNZĂTOR:
          </div>
          <div className="space-y-0.5">
            <div>Denumire: <strong className="font-bold">{dealer.name}</strong></div>
            <div>Cod Unic de Înregistrare (CUI): <strong className="font-mono">{dealer.cui}</strong></div>
            <div>Nr. Reg. Com.: <strong className="font-mono">{dealer.regCom}</strong></div>
            <div>Sediu social: <span>{dealer.legalAddress}</span></div>
            <div>Bancă: <strong>{dealer.bankName}</strong>{dealer.bankBranch ? ` (${dealer.bankBranch})` : ''}</div>
            <div>Cont IBAN: <strong className="font-mono text-[9.5px]">{dealer.ibanRon}</strong></div>
            <div>Telefon contact: <strong className="font-mono">{dealer.phonePrimary}</strong></div>
            <div>Reprezentat legal prin: <strong>Administrator</strong></div>
          </div>
        </div>

        <div>
          <div className="font-bold uppercase text-[10.5px] border-b border-black/30 pb-0.5 mb-1 text-zinc-900">
            2. CUMPĂRĂTOR:
          </div>
          <div className="space-y-0.5">
            <div>Nume / Denumire: <strong className="font-bold">{buyer.fullName || '__________________________'}</strong></div>
            <div>CNP / CUI: <strong className="font-mono">{buyer.cnpOrCui || '___________________'}</strong></div>
            <div>Act Identitate: CI Seria <strong className="font-mono">{buyer.idSeries || '____'}</strong> Nr. <strong className="font-mono">{buyer.idNumber || '______'}</strong></div>
            <div>Adresă domiciliu / Sediu: <span>{buyer.address || '___________________________'}</span></div>
            <div>Județ / Sector: <span>{buyer.county || 'Cluj'}</span></div>
            <div>Telefon mobil: <strong className="font-mono">{buyer.phone || '___________________'}</strong></div>
          </div>
        </div>
      </div>

      {/* OBIECTUL CONTRACTULUI */}
      <div className="border border-black p-2.5 mb-2.5 text-[10px]">
        <div className="font-bold uppercase text-[10.5px] mb-1 text-zinc-900">
          ART. 1 — OBIECTUL CONTRACTULUI
        </div>
        <p className="mb-1.5 leading-normal">
          Vânzătorul vinde, iar Cumpărătorul cumpără autovehiculul rulat individualizat prin următoarele caracteristici tehnice și de identificare:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 bg-zinc-50 border border-zinc-300 p-2 text-[10px]">
          <div>Marcă: <strong className="font-bold">{car.brand}</strong></div>
          <div>Model & Echipare: <strong className="font-bold">{car.model} {car.versionTrim}</strong></div>
          <div>An Fabricație: <strong className="font-mono font-bold">{car.year}</strong></div>
          
          <div className="col-span-2">
            Serie Șasiu (VIN): <strong className="font-mono font-bold text-[10.5px] tracking-wide">{car.vin}</strong>
          </div>
          <div>Rulaj atestat: <strong className="font-mono font-bold">{formatMileage(buyer.deliveryMileageKm ?? car.mileageKm)}</strong></div>

          <div>Capacitate cilindrică: <strong className="font-mono">{car.engineCc ? `${car.engineCc} cm³` : '-'}</strong></div>
          <div>Putere motor: <strong className="font-mono">{car.powerHp} CP</strong></div>
          <div>Carburant: <strong>{car.fuelType}</strong></div>

          <div>Transmisie: <strong>{car.transmission}</strong></div>
          <div>Culoare caroserie: <strong>{car.color || '-'}</strong></div>
          <div>Serie CIV: <strong className="font-mono">{car.civSeries || '-'}</strong></div>
        </div>
      </div>

      {/* PREȚUL ȘI MODALITATEA DE PLATĂ */}
      <div className="border border-black p-2.5 mb-2.5 text-[10px]">
        <div className="font-bold uppercase text-[10.5px] mb-1 text-zinc-900">
          ART. 2 — PREȚUL ȘI MODALITATEA DE PLATĂ
        </div>
        <div className="space-y-1">
          <div>
            1. Prețul total și definitiv convenit pentru vânzarea autovehiculului este de:{' '}
            <strong className="font-mono text-xs font-extrabold">{buyer.agreedPriceEur.toLocaleString('ro-RO')} EUR</strong>
            {' '}(echivalentul a <strong className="font-mono text-xs font-bold">{buyer.agreedPriceRon.toLocaleString('ro-RO')} RON</strong>, calculat la cursul convenit de <strong className="font-mono">{buyer.exchangeRate} RON/EUR</strong>).
          </div>
          <div>
            2. Regim fiscal aplicabil: <strong>{car.vatDeductible ? 'TVA DEDUCTIBIL 21% (inclus în preț conform Codului Fiscal)' : 'REGIMUL SPECIAL AL MARJEI DE PROFIT conform Art. 312 din Legea 227/2015 privind Codul Fiscal (TVA nedeductibil)'}</strong>.
          </div>
          <div>
            3. Plata se efectuează prin virament bancar în contul Vânzătorului deschis la {dealer.bankName} (IBAN: {dealer.ibanRon}), sau prin intermediul unei instituții de finanțare partenere (Leasing / Credit Auto).
          </div>
        </div>
      </div>

      {/* OBLIGAȚIILE PĂRȚILOR & GARANȚIE */}
      <div className="border border-black p-2.5 mb-2.5 text-[9.5px] leading-tight space-y-1">
        <div className="font-bold uppercase text-[10px] text-zinc-900">
          ART. 3 — DECLARAȚII, CONFORMITATE ȘI GARANȚIE
        </div>
        <div>
          • <strong>Vânzătorul declară și garantează</strong> că vehiculul este proprietatea sa exclusivă, nu este gajat, ipotecat, sechestrat sau urmărit silit și este liber de orice sarcini juridice sau fiscale.
        </div>
        <div>
          • <strong>Kilometraj atestat:</strong> Vânzătorul certifică exactitatea kilometrajului specificat pe baza verificărilor tehnice și a istoricului disponibil.
        </div>
        <div>
          • <strong>Garanție de conformitate:</strong> Autovehiculul beneficiază de garanție de conformitate conform Certificatului de Garanție anexat (12 luni motor și cutie de viteze în limita condițiilor stipulate).
        </div>
        <div>
          • <strong>Predarea bunului:</strong> Predarea autovehiculului, a celor 2 rânduri de chei (sau conform fișei) și a documentelor se consemnează în Procesul-Verbal de Predare-Primire anexat.
        </div>
      </div>

      {/* SEMNĂTURILE PĂRȚILOR */}
      <div className="grid grid-cols-2 gap-6 pt-3 mt-1">
        <div className="text-center">
          <div className="font-bold uppercase text-[10px] text-zinc-800">VÂNZĂTOR:</div>
          <div className="font-bold text-[10.5px] mt-0.5">{dealer.name}</div>
          <div className="text-[9px] text-zinc-500 italic mb-7">Prin reprezentant legal / ștampilă</div>
          <div className="border-t border-black w-40 mx-auto">Semnătură</div>
        </div>

        <div className="text-center">
          <div className="font-bold uppercase text-[10px] text-zinc-800">CUMPĂRĂTOR:</div>
          <div className="font-bold text-[10.5px] mt-0.5">{buyer.fullName || 'Client'}</div>
          <div className="text-[9px] text-zinc-500 italic mb-7">Am citit și acceptat clauzele</div>
          <div className="border-t border-black w-40 mx-auto">Semnătură</div>
        </div>
      </div>

      <div className="text-[8.5px] text-zinc-500 text-center mt-3 border-t border-zinc-200 pt-1">
        Exemplar original întocmit în 2 exemplare cu valoare juridică egală, câte unul pentru fiecare parte contractantă.
      </div>
    </div>
  );
};
