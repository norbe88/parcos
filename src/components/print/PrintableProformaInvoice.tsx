import React from 'react';
import { VehicleItem, SEED_DEALER, DealerProfile } from '../../db/seed';
import { BuyerData } from './types';

export interface PrintableProformaInvoiceProps {
  car: VehicleItem;
  buyer: BuyerData;
  dealer?: DealerProfile;
  invoiceType?: 'proforma' | 'fiscal'; // 'proforma' (default) sau 'fiscal' (factură fiscală definitivă)
  billingType?: 'full_car' | 'deposit'; // 'full_car' (preț total autoturism) sau 'deposit' (avans rezervare)
  depositAmountEur?: number;
  salesRegime?: 'margin_scheme' | 'standard'; // 'margin_scheme' (Art. 312) sau 'standard' (TVA 21%)
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
}

export const PrintableProformaInvoice: React.FC<PrintableProformaInvoiceProps> = ({
  car,
  buyer,
  dealer = SEED_DEALER,
  invoiceType = 'proforma',
  billingType = 'deposit',
  depositAmountEur = 500,
  salesRegime,
  invoiceNumber,
  issueDate,
  dueDate
}) => {
  const currentYear = new Date().getFullYear();
  const isFiscal = invoiceType === 'fiscal';
  const isFullCar = billingType === 'full_car';

  // Număr document determinat dinamic
  const defaultInvoiceNumber = isFiscal
    ? (buyer.invoiceNumber || `${dealer.name.split(' ')[0]}-FT-${currentYear}-${car.stockNumber || car.vin.slice(-4).toUpperCase()}`)
    : `${dealer.name.split(' ')[0]}-PRF-${currentYear}-${car.stockNumber || car.vin.slice(-4).toUpperCase()}`;
  const effectiveInvoiceNumber = invoiceNumber || defaultInvoiceNumber;

  // Regim Fiscal: "margin_scheme" (Art. 312 - fără TVA separat afișat) vs "standard" (TVA deductibil 21%)
  // Standardul în operarea dealerilor second-hand este Regimul Marjei (Art. 312)
  const effectiveRegime = salesRegime || 'margin_scheme';
  const isMarginScheme = effectiveRegime === 'margin_scheme';

  // Date financiare
  const exchangeRate = buyer.exchangeRate || 4.9750;
  const totalCarPriceEur = buyer.agreedPriceEur || car.priceEur;
  const billedAmountEur = isFullCar ? totalCarPriceEur : depositAmountEur;
  const billedAmountRon = Math.round(billedAmountEur * exchangeRate);

  // Strict 21% TVA Invariant (calculat doar când regimul este standard)
  const billedAmountEurNet = Number((billedAmountEur / 1.21).toFixed(2));
  const vatEur = Number((billedAmountEur - billedAmountEurNet).toFixed(2));
  const billedAmountRonNet = Number((billedAmountRon / 1.21).toFixed(2));
  const vatRon = Number((billedAmountRon - billedAmountRonNet).toFixed(2));

  // Date calendaristice
  const today = issueDate ? new Date(issueDate) : new Date();
  const calculatedDueDate = dueDate 
    ? new Date(dueDate) 
    : (() => {
        const d = new Date(today);
        d.setDate(d.getDate() + (isFiscal ? 0 : 5));
        return d;
      })();

  return (
    <div className="printable-doc bg-white text-black p-8 max-w-[210mm] mx-auto text-[11px] leading-tight font-serif print:p-0">
      {/* HEADER FACTURĂ */}
      <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
        <div>
          <div className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
            <span>{isFiscal ? 'FACTURĂ FISCALĂ' : 'FACTURĂ PROFORMĂ'}</span>
            <span className="text-[10px] font-sans font-extrabold px-2 py-0.5 border border-black bg-zinc-100 uppercase tracking-normal">
              {isMarginScheme ? 'Regimul Marjei' : 'TVA 21% Deductibil'}
            </span>
          </div>
          <div className="text-xs font-bold text-zinc-800 mt-0.5">
            {isFiscal 
              ? (isFullCar ? 'FACTURĂ DE LIVRARE & TRANSFER PROPRIETATE AUTOVEHICUL' : 'FACTURĂ FISCALĂ AVANS REZERVARE AUTOVEHICUL')
              : (isFullCar ? 'DECONTARE BANCARĂ / LEASING ACHIZIȚIE AUTOVEHICUL' : 'AVANS & GARANȚIE DE REZERVARE VEHICUL')
            }
          </div>
          <div className="text-[10.5px] text-zinc-700 mt-1">
            Seria: <strong className="font-mono text-black font-bold">{effectiveInvoiceNumber}</strong>
          </div>
        </div>

        <div className="text-right text-[10px] space-y-0.5">
          <div>Data emiterii: <strong className="font-mono">{today.toLocaleDateString('ro-RO')}</strong></div>
          <div>Data scadenței: <strong className="font-mono">{calculatedDueDate.toLocaleDateString('ro-RO')}</strong></div>
          <div>Curs BNR referință: <strong className="font-mono">{exchangeRate} RON/EUR</strong></div>
        </div>
      </div>

      {/* FURNIZOR & CLIENT */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 mb-4 text-[10.5px]">
        <div>
          <div className="font-bold uppercase text-[10.5px] border-b border-black/30 pb-0.5 mb-1.5 text-zinc-900">
            FURNIZOR (VÂNZĂTOR):
          </div>
          <div className="space-y-1">
            <div className="font-extrabold text-sm text-black">{dealer.name}</div>
            <div>CUI / CIF: <strong className="font-mono">{dealer.cui}</strong></div>
            <div>Nr. Reg. Comerțului: <strong className="font-mono">{dealer.regCom}</strong></div>
            <div>Sediu social: <span>{dealer.legalAddress}</span></div>
            <div>Showroom & Parc: <span>{dealer.showroomAddress}</span></div>
            <div className="pt-1 text-[10px]">
              Cont Bancar: <strong className="font-mono font-bold">{dealer.bankName}</strong>{dealer.bankBranch ? ` (${dealer.bankBranch})` : ''}<br />
              IBAN RON: <strong className="font-mono text-[10.5px]">{dealer.ibanRon}</strong>
              {dealer.ibanEur && (
                <div>IBAN EUR: <strong className="font-mono text-[10.5px]">{dealer.ibanEur}</strong></div>
              )}
            </div>
            <div>Telefon: <strong className="font-mono">{dealer.phonePrimary}</strong></div>
          </div>
        </div>

        <div>
          <div className="font-bold uppercase text-[10.5px] border-b border-black/30 pb-0.5 mb-1.5 text-zinc-900">
            CLIENT (CUMPĂRĂTOR):
          </div>
          <div className="space-y-1">
            <div className="font-extrabold text-sm text-black">{buyer.fullName || 'Client Cumpărător'}</div>
            <div>CNP / CUI: <strong className="font-mono">{buyer.cnpOrCui || '___________________'}</strong></div>
            <div>Act Identitate: CI Seria <strong className="font-mono">{buyer.idSeries || '____'}</strong> Nr. <strong className="font-mono">{buyer.idNumber || '______'}</strong></div>
            <div>Adresă: <span>{buyer.address || '___________________________'}</span></div>
            <div>Județ / Oraș: <span>{buyer.county || 'Cluj'}</span></div>
            <div>Telefon mobil: <strong className="font-mono">{buyer.phone || '___________________'}</strong></div>
          </div>
        </div>
      </div>

      {/* VEHICUL REZERVAT INFO */}
      <div className="bg-zinc-50 border border-zinc-300 p-2.5 mb-3.5 text-[10.5px]">
        <div className="font-bold text-[10.5px] uppercase text-zinc-800 mb-1">
          IDENTIFICARE VEHICUL TRANZACȚIONAT:
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div>
            <strong className="font-bold text-black font-sans">{car.brand} {car.model} {car.versionTrim}</strong> ({car.year})
          </div>
          <div>
            Serie VIN: <strong className="font-bold text-black">{car.vin}</strong>
          </div>
          <div>
            Preț total agreat: <strong className="font-bold text-black">{totalCarPriceEur.toLocaleString('ro-RO')} €</strong>
          </div>
        </div>
      </div>

      {/* TABEL FACTURARE (DINAMIC CONFORM PROMPT AGENT TVA MARJĂ / ART. 312 vs REGIM NORMAL 21%) */}
      {isMarginScheme ? (
        /* ========================================================================= */
        /* 1. REGIMUL MARJEI (Art. 312 Cod Fiscal): INTERZISĂ EVIDENȚIEREA TVA-ULUI */
        /* ========================================================================= */
        <div className="border border-black mb-2.5">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-b border-black text-black uppercase font-bold text-[9.5px]">
                <th className="p-2 border-r border-black w-8 text-center">Nr.</th>
                <th className="p-2 border-r border-black">Denumire Servicii / Produse</th>
                <th className="p-2 border-r border-black w-14 text-center">U.M.</th>
                <th className="p-2 border-r border-black w-14 text-center">Cant.</th>
                <th className="p-2 border-r border-black w-36 text-right">Preț Unitar</th>
                <th className="p-2 w-36 text-right">Valoare Totală</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-300">
                <td className="p-2 border-r border-black text-center font-mono">1</td>
                <td className="p-2 border-r border-black font-sans">
                  {isFullCar ? (
                    <div>
                      <strong className="block font-bold text-[11px]">
                        Vânzare Autovehicul Rulat: {car.brand} {car.model} {car.versionTrim || ''}
                      </strong>
                      <span className="text-[9px] text-zinc-600 block mt-0.5 font-mono">
                        VIN: {car.vin} • An: {car.year} • Km la livrare: {(buyer.deliveryMileageKm ?? car.mileageKm).toLocaleString('ro-RO')} km
                        {car.civSeries ? ` • Serie CIV: ${car.civSeries}` : ''}
                      </span>
                      <span className="text-[9px] font-extrabold text-black block mt-1 uppercase tracking-wider bg-zinc-100 px-1.5 py-0.5 border border-zinc-300 w-fit">
                        Regimul marjei - bunuri second-hand
                      </span>
                    </div>
                  ) : (
                    <div>
                      <strong className="block font-bold text-[11px]">Garanție de Rezervare Autovehicul Rulat</strong>
                      <span className="text-[9px] text-zinc-600 block mt-0.5">
                        Autoturism {car.brand} {car.model}, VIN: {car.vin}. Sumă avans reținută din prețul total de {totalCarPriceEur.toLocaleString('ro-RO')} €.
                        Rest de plată la livrare: {(totalCarPriceEur - depositAmountEur).toLocaleString('ro-RO')} €.
                      </span>
                      <span className="text-[9px] font-extrabold text-black block mt-1 uppercase tracking-wider bg-zinc-100 px-1.5 py-0.5 border border-zinc-300 w-fit">
                        Regimul marjei - bunuri second-hand
                      </span>
                    </div>
                  )}
                </td>
                <td className="p-2 border-r border-black text-center">Buc</td>
                <td className="p-2 border-r border-black text-center font-mono">1</td>
                <td className="p-2 border-r border-black text-right font-mono font-bold text-[11px]">
                  {billedAmountEur.toFixed(2)} €<br />
                  <span className="text-[9px] font-normal text-zinc-600">({billedAmountRon.toLocaleString('ro-RO')} lei)</span>
                </td>
                <td className="p-2 text-right font-mono font-bold text-[11.5px] text-black">
                  {billedAmountEur.toFixed(2)} €<br />
                  <span className="text-[9px] font-normal text-zinc-600">({billedAmountRon.toLocaleString('ro-RO')} lei)</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-zinc-50 font-bold text-xs border-t-2 border-black">
                <td colSpan={5} className="p-2 text-right uppercase border-r border-black">
                  {isFullCar ? 'TOTAL DE PLATĂ FACTURĂ:' : 'TOTAL DE PLATĂ (AVANS REZERVARE):'}
                </td>
                <td className="p-2 text-right font-mono text-sm text-black font-black">
                  {billedAmountEur.toLocaleString('ro-RO')} €<br />
                  <span className="text-[10px] font-bold text-zinc-800">({billedAmountRon.toLocaleString('ro-RO')} RON)</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. REGIM NORMAL DE TVA: ITEMIZARE STRICTĂ 21% TVA                          */
        /* ========================================================================= */
        <div className="border border-black mb-2.5">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-b border-black text-black uppercase font-bold text-[9.5px]">
                <th className="p-2 border-r border-black w-8 text-center">Nr.</th>
                <th className="p-2 border-r border-black">Denumire Servicii / Produse</th>
                <th className="p-2 border-r border-black w-14 text-center">U.M.</th>
                <th className="p-2 border-r border-black w-14 text-center">Cant.</th>
                <th className="p-2 border-r border-black w-24 text-right">Preț Fără TVA</th>
                <th className="p-2 border-r border-black w-16 text-center">Cota TVA</th>
                <th className="p-2 border-r border-black w-20 text-right">Valoare TVA</th>
                <th className="p-2 w-24 text-right">Total cu TVA</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-300">
                <td className="p-2 border-r border-black text-center font-mono">1</td>
                <td className="p-2 border-r border-black font-sans">
                  {isFullCar ? (
                    <div>
                      <strong className="block font-bold text-[11px]">
                        Vânzare Autovehicul (TVA 21% Deductibil): {car.brand} {car.model} {car.versionTrim || ''}
                      </strong>
                      <span className="text-[9px] text-zinc-600 block mt-0.5 font-mono">
                        VIN: {car.vin} • An: {car.year} • Km la livrare: {(buyer.deliveryMileageKm ?? car.mileageKm).toLocaleString('ro-RO')} km
                        {car.civSeries ? ` • Serie CIV: ${car.civSeries}` : ''}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <strong className="block font-bold text-[11px]">Garanție de Rezervare Autovehicul (TVA 21% Deductibil)</strong>
                      <span className="text-[9px] text-zinc-600 block mt-0.5">
                        Autoturism {car.brand} {car.model}, VIN: {car.vin}. Sumă avans reținută din prețul total de {totalCarPriceEur.toLocaleString('ro-RO')} €.
                        Rest de plată la livrare: {(totalCarPriceEur - depositAmountEur).toLocaleString('ro-RO')} €.
                      </span>
                    </div>
                  )}
                </td>
                <td className="p-2 border-r border-black text-center">Buc</td>
                <td className="p-2 border-r border-black text-center font-mono">1</td>
                <td className="p-2 border-r border-black text-right font-mono">
                  {billedAmountEurNet.toFixed(2)} €<br />
                  <span className="text-[8.5px] text-zinc-500">({billedAmountRonNet.toFixed(2)} lei)</span>
                </td>
                <td className="p-2 border-r border-black text-center font-mono font-bold">
                  21%
                </td>
                <td className="p-2 border-r border-black text-right font-mono">
                  {vatEur.toFixed(2)} €<br />
                  <span className="text-[8.5px] text-zinc-500">({vatRon.toFixed(2)} lei)</span>
                </td>
                <td className="p-2 text-right font-mono font-bold text-xs">
                  {billedAmountEur.toFixed(2)} €<br />
                  <span className="text-[9.5px] text-zinc-700">({billedAmountRon.toLocaleString('ro-RO')} lei)</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-zinc-50 font-bold text-xs border-t-2 border-black">
                <td colSpan={6} className="p-2 text-right uppercase border-r border-black">
                  {isFullCar ? 'TOTAL DE PLATĂ FACTURĂ:' : 'TOTAL DE PLATĂ (AVANS REZERVARE):'}
                </td>
                <td className="p-2 text-right font-mono border-r border-black text-[10.5px]">
                  {vatEur.toFixed(2)} €
                </td>
                <td className="p-2 text-right font-mono text-sm text-black font-black">
                  {billedAmountEur.toLocaleString('ro-RO')} €<br />
                  <span className="text-[10px] font-bold text-zinc-800">({billedAmountRon.toLocaleString('ro-RO')} RON)</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* CLAUZĂ OBLIGATORIE LEGALĂ */}
      <div className="border border-black bg-zinc-100 p-2 text-center text-[10px] font-bold tracking-wide uppercase mb-3">
        {isMarginScheme ? (
          <span>Scutit de evidențierea distinctă a TVA conform Art. 312 Cod Fiscal • „Regimul marjei - bunuri second-hand”</span>
        ) : (
          <span>Operațiune supusă cotei standard de TVA 21% • TVA Deductibil conform Codului Fiscal</span>
        )}
      </div>

      {/* CLAUZE DE PLATĂ & CONT BANCAR */}
      <div className="border border-black p-3 mb-4 text-[9.5px] space-y-1.5 leading-normal">
        <div className="font-bold uppercase text-[10px] text-zinc-900">
          TERMENI, CONDIȚII ȘI MODALITATE DE PLATĂ:
        </div>
        <div>
          1. <strong>Virament Bancar & Cont Vânzător:</strong> Fondurile se virează în contul societății deschis la <strong>{dealer.bankName}</strong> (IBAN RON: <span className="font-mono font-bold">{dealer.ibanRon}</span>{dealer.ibanEur ? ` / IBAN EUR: ${dealer.ibanEur}` : ''}), cu mențiunea <em>„{isFiscal ? 'Plată factură fiscală' : (isFullCar ? 'Decontare achiziție autoturism' : 'Avans rezervare')} {car.brand} {car.model} VIN {car.vin.slice(-6)}"</em>.
        </div>
        <div>
          2. <strong>Regim Fiscal & Deducere:</strong> {isMarginScheme ? (
            <>Autovehiculul este comercializat în <strong>Regimul marjei - bunuri second-hand</strong> conform Art. 312 din Legea 227/2015 privind Codul Fiscal (TVA inclus și nedeductibil). Nu se acordă drept de deducere a TVA cumpărătorului.</>
          ) : (
            <>Autovehiculul este comercializat în <strong>Regim Normal de TVA 21% deductibil</strong> conform Codului Fiscal. Cumpărătorul persoană juridică poate deduce TVA-ul în condițiile legii.</>
          )}
        </div>
        <div>
          3. <strong>Transferul Proprietății & Livrare:</strong> Proprietatea asupra autovehiculului se transferă definitiv cumpărătorului doar la momentul confirmării achitării integrale a prețului și semnării Procesului-Verbal de Predare-Primire.
        </div>
        <div className="text-[8.5px] text-zinc-500 italic pt-0.5">
          * Factura circulă fără ștampilă și semnătură conform prevederilor Art. 319 alin. (29) din Legea nr. 227/2015 privind Codul Fiscal.
        </div>
      </div>

      {/* SEMNĂTURI */}
      <div className="grid grid-cols-2 gap-8 pt-3">
        <div>
          <div className="font-bold uppercase text-[10px]">EMIS DE (FURNIZOR):</div>
          <div className="font-bold text-xs">{dealer.name}</div>
          <div className="text-[9px] text-zinc-500 mb-6">Consilier Vânzări / Împuternicit</div>
          <div className="border-t border-black w-40">Semnătură & Ștampilă</div>
        </div>

        <div className="text-right">
          <div className="font-bold uppercase text-[10px]">CUMPĂRĂTOR (CONFIRMARE PRIMIRE):</div>
          <div className="font-bold text-xs">{buyer.fullName || 'Client'}</div>
          <div className="text-[9px] text-zinc-500 mb-6">{isFiscal ? 'Am primit factura și bunul' : 'Acceptat condițiile de plată'}</div>
          <div className="border-t border-black w-40 ml-auto">Semnătură</div>
        </div>
      </div>
    </div>
  );
};
