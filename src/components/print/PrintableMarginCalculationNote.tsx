import React from 'react';
import { VehicleItem, SEED_DEALER, DealerProfile } from '../../db/seed';
import { BuyerData } from './types';
import { calculateVehicleFinancials } from '../../utils/helpers';

interface PrintableMarginCalculationNoteProps {
  car: VehicleItem;
  buyer: BuyerData;
  dealer?: DealerProfile;
}

export const PrintableMarginCalculationNote: React.FC<PrintableMarginCalculationNoteProps> = ({
  car,
  buyer,
  dealer = SEED_DEALER
}) => {
  const financials = calculateVehicleFinancials(car);
  const purchasePrice = car.purchasePriceEur || Math.round(car.priceEur * 0.82);
  const salePriceEur = buyer.agreedPriceEur || (car.status === 'sold' && car.soldPriceEur ? car.soldPriceEur : car.priceEur);
  const grossMarginEur = Math.max(0, salePriceEur - purchasePrice);
  
  // Regim special marjă: Baza impozabilă = Marja / 1.21; TVA colectat (21%) = Marja - Baza
  const vatRate = 0.21;
  const taxableBaseEur = grossMarginEur / (1 + vatRate);
  const collectedVatEur = grossMarginEur - taxableBaseEur;
  const netDealerProfitEur = salePriceEur - (purchasePrice + financials.totalExpensesEur);

  return (
    <div className="printable-doc bg-white text-black p-8 max-w-[210mm] mx-auto text-[11px] leading-tight font-serif print:p-0">
      <div className="text-center font-bold text-sm tracking-wide uppercase border-b-2 border-black pb-2 mb-4">
        <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
          DOCUMENT INTERN JUSTIFICATIV PENTRU CONTABILITATE
        </div>
        <div className="text-base font-extrabold mt-0.5">
          NOTĂ DE CALCUL TAXARE FISCALĂ – REGIMUL SPECIAL AL MARJEI
        </div>
        <div className="text-[10px] font-normal normal-case italic mt-0.5">
          Conform Art. 312 din Legea nr. 227/2015 privind Codul Fiscal (Bunuri second-hand)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border border-black p-2.5 mb-3 text-[10px]">
        <div>
          Operator Economic: <span className="font-bold">{dealer.name}</span><br />
          C.U.I.: <span className="font-bold font-mono">{dealer.cui}</span><br />
          Data emiterii notei: <span className="font-bold">{buyer.contractDate || new Date().toLocaleDateString('ro-RO')}</span>
        </div>
        <div>
          Vehicul Vândut: <span className="font-bold">{car.brand} {car.model}</span> ({car.year})<br />
          Serie VIN: <span className="font-mono font-bold">{car.vin}</span><br />
          Cumpărător: <span className="font-bold">{buyer.fullName || 'Persoană fizică'}</span>
        </div>
      </div>

      {/* TABEL DE CALCUL MARJĂ */}
      <table className="w-full border-collapse border border-black text-left mb-4 text-[10px]">
        <thead>
          <tr className="bg-gray-100 font-bold">
            <th className="border border-black p-2">Element de Calcul</th>
            <th className="border border-black p-2 text-right">Valoare (EUR)</th>
            <th className="border border-black p-2 text-right">Valoare (RON)</th>
            <th className="border border-black p-2">Bază Legală / Observații</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 font-semibold">1. Preț Efectiv de Vânzare (A)</td>
            <td className="border border-black p-2 text-right font-mono font-bold">{salePriceEur.toLocaleString('ro-RO')} €</td>
            <td className="border border-black p-2 text-right font-mono font-bold">{(salePriceEur * buyer.exchangeRate).toLocaleString('ro-RO')} lei</td>
            <td className="border border-black p-2">Preț facturat conform contractului</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-semibold">2. Preț de Cumpărare / Achiziție (B)</td>
            <td className="border border-black p-2 text-right font-mono font-bold">{purchasePrice.toLocaleString('ro-RO')} €</td>
            <td className="border border-black p-2 text-right font-mono font-bold">{(purchasePrice * buyer.exchangeRate).toLocaleString('ro-RO')} lei</td>
            <td className="border border-black p-2">Cost achiziție conform factură furnizor/borderou</td>
          </tr>
          <tr className="bg-gray-50 font-bold">
            <td className="border border-black p-2">3. Marja Brută a Profitului (C = A - B)</td>
            <td className="border border-black p-2 text-right font-mono text-emerald-700">{grossMarginEur.toLocaleString('ro-RO')} €</td>
            <td className="border border-black p-2 text-right font-mono text-emerald-700">{(grossMarginEur * buyer.exchangeRate).toLocaleString('ro-RO')} lei</td>
            <td className="border border-black p-2">Baza de determinare a taxei</td>
          </tr>
          <tr>
            <td className="border border-black p-2">4. Bază Impozabilă TVA (C / 1.21)</td>
            <td className="border border-black p-2 text-right font-mono">{taxableBaseEur.toFixed(2)} €</td>
            <td className="border border-black p-2 text-right font-mono">{(taxableBaseEur * buyer.exchangeRate).toFixed(2)} lei</td>
            <td className="border border-black p-2">Cotă TVA 21% aplicată pe marjă</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold">5. TVA Colectat pe Marjă (21%)</td>
            <td className="border border-black p-2 text-right font-mono font-bold text-amber-700">{collectedVatEur.toFixed(2)} €</td>
            <td className="border border-black p-2 text-right font-mono font-bold text-amber-700">{(collectedVatEur * buyer.exchangeRate).toFixed(2)} lei</td>
            <td className="border border-black p-2">TVA virat la buget de stat</td>
          </tr>
          <tr className="bg-gray-100 font-bold">
            <td className="border border-black p-2">6. Cheltuieli Înregistrate în Parc (D)</td>
            <td className="border border-black p-2 text-right font-mono">{financials.totalExpensesEur.toLocaleString('ro-RO')} €</td>
            <td className="border border-black p-2 text-right font-mono">{(financials.totalExpensesEur * buyer.exchangeRate).toLocaleString('ro-RO')} lei</td>
            <td className="border border-black p-2">RAR, transport, reparații, detailing</td>
          </tr>
          <tr className="bg-amber-100/60 font-black">
            <td className="border border-black p-2">7. Profit Net Realizat Dealer (A - B - D)</td>
            <td className="border border-black p-2 text-right font-mono text-emerald-800 text-xs">+{netDealerProfitEur.toLocaleString('ro-RO')} €</td>
            <td className="border border-black p-2 text-right font-mono text-emerald-800 text-xs">+{(netDealerProfitEur * buyer.exchangeRate).toLocaleString('ro-RO')} lei</td>
            <td className="border border-black p-2">Câștig net înainte de impozit venit/profit</td>
          </tr>
        </tbody>
      </table>

      {/* CLAUZĂ FACTURĂ */}
      <div className="border border-black p-2.5 mb-4 text-[10px] space-y-1">
        <div className="font-bold uppercase text-[10px]">
          MENȚIUNE OBLIGATORIE PE FACTURA FISCALĂ:
        </div>
        <p className="italic font-bold">
          „Regimul marjei – bunuri second-hand” (Conform art. 319 alin. 20 lit. o din Codul Fiscal). Pe factură nu se evidențiază separat taxa pe valoarea adăugată.
        </p>
      </div>

      {/* SEMNĂTURI */}
      <div className="grid grid-cols-2 gap-8 pt-4 border-t border-black text-center">
        <div>
          <div className="font-bold uppercase text-[10px]">ADMINISTRATOR:</div>
          <div className="font-bold">{dealer.name} S.R.L.</div>
          <div className="h-12 flex items-end justify-center font-cursive italic text-gray-500">
            Semnătură
          </div>
        </div>
        <div>
          <div className="font-bold uppercase text-[10px]">ÎNTOCMIT / COMPARTIMENT FINANCIAR:</div>
          <div className="font-bold">Responsabil Gestiune Stoc</div>
          <div className="h-12 flex items-end justify-center font-cursive italic text-gray-500">
            Semnătură
          </div>
        </div>
      </div>
    </div>
  );
};
