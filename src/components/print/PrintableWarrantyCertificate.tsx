import React from 'react';
import { VehicleItem, SEED_DEALER, DealerProfile } from '../../db/seed';
import { BuyerData } from './types';
import { formatMileage } from '../../utils/helpers';

interface PrintableWarrantyCertificateProps {
  car: VehicleItem;
  buyer: BuyerData;
  dealer?: DealerProfile;
}

export const PrintableWarrantyCertificate: React.FC<PrintableWarrantyCertificateProps> = ({
  car,
  buyer,
  dealer = SEED_DEALER
}) => {
  const dealerPrefix = (dealer.slug || 'DEALER').toUpperCase().replace('_', '');
  const currentDate = buyer.contractDate || new Date().toISOString().split('T')[0];
  const warrantyStartDate = buyer.warrantyStartDate || currentDate;
  const invoiceNumber = buyer.invoiceNumber || `${dealerPrefix}-FT-${new Date().getFullYear()}-${car.stockNumber || car.vin.slice(-4).toUpperCase()}`;
  const formattedMileage = formatMileage(buyer.deliveryMileageKm || car.mileageKm);
  const effectiveLogo = dealer.logoUrl || '/images/rxm-logo.png';
  const legalAddress = dealer.legalAddress || dealer.address || 'jud. Cluj';

  return (
    <div className="printable-doc bg-white text-black max-w-[210mm] mx-auto text-[10.5px] leading-snug font-serif print:p-0 print:max-w-none">
      
      {/* ========================================================================= */}
      {/* 📄 PAGINA 1: ANTET, DATELE CERTIFICATULUI, ASUMARE & PUNCTUL 1 DE GARANȚIE */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-7 print:p-5 bg-white border border-zinc-300 print:border-none shadow-md print:shadow-none min-h-[260mm] max-h-[268mm] flex flex-col justify-between overflow-hidden">
        <div>
          {/* Antet Oficial Dealer */}
          <div className="border-b-2 border-black pb-2 mb-2.5">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src={effectiveLogo} 
                  alt={dealer.name} 
                  className="h-10 object-contain"
                  onError={(e) => {
                    // Fallback la text dacă imaginea nu este încărcată
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h1 className="text-sm font-black tracking-tight uppercase leading-none font-sans text-black">
                    {dealer.name}
                  </h1>
                  <p className="text-[9.5px] text-zinc-700 mt-0.5 font-sans">
                    Dealer Autovehicule Rulate • Showroom Vânzări {dealer.serviceLocation || 'Cluj-Napoca'}
                  </p>
                </div>
              </div>
              <div className="text-right text-[9px] leading-tight text-zinc-800 font-sans">
                <div><strong>Sediu Social:</strong> {legalAddress}</div>
                <div>{dealer.regCom ? <><strong>Reg. Com.:</strong> {dealer.regCom} &bull; </> : null}<strong>C.U.I.:</strong> {dealer.cui.replace(/^RO/, '')}</div>
                <div><strong>Showroom:</strong> {dealer.showroomAddress || dealer.address}</div>
                <div><strong>Tel:</strong> {dealer.phonePrimary} {dealer.phoneSecondary ? `/ ${dealer.phoneSecondary}` : ''}</div>
              </div>
            </div>
          </div>

          {/* Mesaj de Întâmpinare & Cadru Legal */}
          <div className="bg-zinc-50 border border-zinc-200 p-2 mb-2 text-[9.5px] text-justify leading-snug">
            <p className="font-bold text-[10px] mb-0.5 tracking-wide">STIMATE CLIENT!</p>
            <p>
              Societatea comercială <strong>{dealer.name}</strong> cu sediul în {legalAddress}, {dealer.regCom ? <>înregistrată la Registrul Comerţului <strong>{dealer.regCom}</strong>, </> : null}având C.U.I.: <strong>{dealer.cui.replace(/^RO/, '')}</strong> în calitate de vânzător/comerciant, acordă o garanţie pentru autovehiculul achiziţionat de dumneavoastră, pentru un termen de <strong>1 an sau 10.000 km</strong>, garanția se aplică de la data cumpărării acestuia, se acordă o singură dată şi nu este transmisibilă.
            </p>
            <p className="mt-0.5">
              Vă felicităm pentru achiziționarea unui autovehicul al firmei noastre. Ne face plăcere să vă oferim serviciile noastre şi vă dorim să beneficiaţi cu plăcere de noul autoturism.
            </p>
            <p className="mt-0.5">
              Pentru a avea siguranţa menţinerii calităţii autoturismului dumneavoastră pentru o perioadă îndelungată, este recomandat să realizaţi operaţiunile de întreţinere ale acestuia în cadrul unui service autorizat agreat de dumneavoastră.
            </p>
            <p className="mt-0.5 font-semibold text-zinc-900">
              Garanţia se acordă în condiţiile Legii nr. 449/2003 privind vânzarea produselor şi garanţiile asociate acestora și O.U.G. nr. 140/2021.
            </p>
          </div>

          {/* Titlu Certificat */}
          <div className="text-center my-1.5">
            <h2 className="text-sm font-extrabold uppercase tracking-wider border-y border-black py-0.5">
              CERTIFICAT DE GARANŢIE
            </h2>
          </div>

          {/* Datele Certificatului (Autocompletare dinamică) */}
          <div className="border border-black p-2.5 my-2">
            <div className="font-bold uppercase text-[10px] border-b border-black pb-0.5 mb-1.5 tracking-wide flex justify-between items-center">
              <span>Datele certificatului</span>
              <span className="font-mono text-[9px] text-zinc-600 font-normal">SERIE: {dealerPrefix}-GAR-{car.vin.slice(-6)}</span>
            </div>

            <div className="grid grid-cols-1 gap-1 text-[10px]">
              <div className="flex items-baseline justify-between border-b border-dotted border-zinc-400 pb-0.5">
                <span className="font-semibold text-zinc-700 w-44">Nume cumpărător:</span>
                <span className="font-bold flex-1 text-black font-sans">{buyer.fullName || '__________________________________________________'}</span>
              </div>

              <div className="flex items-baseline justify-between border-b border-dotted border-zinc-400 pb-0.5">
                <span className="font-semibold text-zinc-700 w-44">C.N.P. / C.U.I.:</span>
                <span className="font-mono font-bold flex-1 text-black">{buyer.cnpOrCui || '__________________________________________________'}</span>
              </div>

              <div className="flex items-baseline justify-between border-b border-dotted border-zinc-400 pb-0.5">
                <span className="font-semibold text-zinc-700 w-44">Marca / Model:</span>
                <span className="font-bold flex-1 text-black">{car.brand} {car.model} {car.versionTrim ? `(${car.versionTrim})` : ''}</span>
              </div>

              <div className="flex items-baseline justify-between border-b border-dotted border-zinc-400 pb-0.5">
                <span className="font-semibold text-zinc-700 w-44">Seria Şasiu (VIN):</span>
                <span className="font-mono font-bold tracking-wider flex-1 text-black">{car.vin}</span>
              </div>

              <div className="flex items-baseline justify-between border-b border-dotted border-zinc-400 pb-0.5">
                <span className="font-semibold text-zinc-700 w-44">Data începerii garanţiei:</span>
                <span className="font-bold flex-1 text-black">{warrantyStartDate}</span>
              </div>

              <div className="flex items-baseline justify-between border-b border-dotted border-zinc-400 pb-0.5">
                <span className="font-semibold text-zinc-700 w-44">Conform factură nr.:</span>
                <span className="font-mono font-bold flex-1 text-black">{invoiceNumber}</span>
              </div>

              <div className="flex items-baseline justify-between pb-0.5">
                <span className="font-semibold text-zinc-700 w-44">KM (la livrare):</span>
                <span className="font-mono font-bold flex-1 text-black">{formattedMileage}</span>
              </div>
            </div>
          </div>

          {/* Clauză Termen Garanție Oficial */}
          <div className="bg-zinc-100 border border-zinc-300 p-1.5 my-1.5 text-center text-[10px] font-semibold">
            Pentru acest autoturism asigurăm o garanţie de <span className="font-black text-black underline">1 an sau 10.000 de km</span> începând din momentul livrării autoturismului, conform facturii, bonului fiscal şi al certificatului de garanţie.
          </div>

          {/* Bloc Semnături Intermediar Livrare */}
          <div className="grid grid-cols-2 gap-8 my-2 text-center text-[9.5px]">
            <div>
              <div className="font-bold uppercase">Semnătura şi ştampila vânzătorului</div>
              <div className="text-[8.5px] text-zinc-600 font-sans">{dealer.name}</div>
              <div className="h-8 flex items-end justify-center font-cursive italic text-zinc-400 text-xs">
                (L.S. Vânzător)
              </div>
              <div className="border-t border-dotted border-zinc-500 w-3/4 mx-auto pt-0.5"></div>
            </div>
            <div>
              <div className="font-bold uppercase">Semnătura client</div>
              <div className="text-[8.5px] text-zinc-600 font-sans">{buyer.fullName || 'Cumpărător'}</div>
              <div className="h-8 flex items-end justify-center font-cursive italic text-zinc-400 text-xs">
                (Semnătură Cumpărător)
              </div>
              <div className="border-t border-dotted border-zinc-500 w-3/4 mx-auto pt-0.5"></div>
            </div>
          </div>

          <div className="text-right text-[9.5px] text-zinc-700 mb-1.5 font-mono">
            Data semnării: <strong>{currentDate}</strong>
          </div>

          {/* Secțiunea 1: Punct de Garanție - Acoperire Tehnică */}
          <div className="border-t-2 border-black pt-1.5 text-[9.5px] leading-snug">
            <div className="font-bold text-[10px] uppercase mb-0.5">
              Punct de garanţie &mdash; Garanţia autoturismului
            </div>

            <p className="mb-0.5 font-semibold text-[9.5px]">
              1. Pentru prezentul autoturism second-hand oferim garanţie pentru capacitatea funcţională a următoarelor elemente, în conformitate cu următoarele condiţii:
            </p>

            <div className="space-y-1 pl-2 border-l-2 border-zinc-400 my-1">
              <div>
                <strong>MOTOR:</strong> Bloc motor, pistoane, cămăşi, bielă, arbore cotit.
                <div className="text-[9px] text-red-800 font-bold mt-0.5">
                  !!! Nu sunt cuprinse în garanţie accesoriile blocului motor (electromotor, alternator, turbosuflantă, injectoare, freon, climă, compresor climă, distribuţie motor, pompă servodirecţie, etc.).
                </div>
              </div>

              <div>
                <strong>CUTIE DE VITEZE MANUALĂ ŞI AUTOMATĂ:</strong> Carcasa cutiei de viteze, precum şi toate elementele interioare.
                <div className="text-[9px] text-red-800 font-bold mt-0.5">
                  !!! Nu sunt cuprinse în garanţie elementele de legătură dintre motor şi cutia de viteze (rulment de presiune, placă de presiune, disc de ambreaj, volantă, etc.).
                </div>
              </div>
            </div>

            <p className="mt-1 text-[9px] text-zinc-800">
              <strong>Unitate service agreată:</strong> Garanţia se acordă numai în unitatea de service a vânzătorului/comerciantului ({dealer.serviceLocation || 'jud. Cluj, Loc. Cluj-Napoca'}).
              Pentru a beneficia de garanţia acordată, orice intervenţie asupra motorului şi a cutiei de viteze se va efectua doar în unitatea de service agreată de vânzător. În cazul în care sunt defecţiuni la motor sau la cutia de viteze şi reparaţia presupune costuri foarte mari, sau acestea nu se mai pot repara, vânzătorul înlocuieşte motorul sau cutia de viteze cu altele de acelaşi tip şi aceeaşi normă europeană, într-un termen de <strong>maxim 90 zile</strong>.
            </p>
          </div>
        </div>

        {/* Footer Pagina 1 */}
        <div className="pt-1.5 border-t border-zinc-300 flex justify-between items-center text-[8.5px] text-zinc-500 font-sans">
          <span>{dealer.name} • Certificat de Garanție Oficial (1 An / 10.000 KM)</span>
          <span>Pagina 1 din 2</span>
        </div>
      </div>

      {/* Separator Vizual pe Ecran (Ascuns la Print & Ignorat la Export PDF) */}
      <div 
        data-html2canvas-ignore="true" 
        className="no-print my-4 flex items-center justify-center gap-3 select-none"
      >
        <div className="h-px bg-zinc-400 flex-1" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 bg-zinc-200 px-3 py-1 rounded-full shadow-sm font-sans">
          PAGINA 2 DIN 2 &mdash; CONDIȚII, EXCLUDERI & OBSERVAȚII SERVICE
        </span>
        <div className="h-px bg-zinc-400 flex-1" />
      </div>

      {/* Forțare Page Break la Tipărire & Generator PDF */}
      <div 
        className="html2pdf__page-break print:block" 
        style={{ pageBreakBefore: 'always', breakBefore: 'page', height: 0, margin: 0, padding: 0, border: 'none' }} 
      />

      {/* ========================================================================= */}
      {/* 📄 PAGINA 2: EXCLUDERI, OBLIGAȚIILE CUMPĂRĂTORULUI & CASETA SERVICE      */}
      {/* ========================================================================= */}
      <div 
        className="p-6 sm:p-7 print:p-5 bg-white border border-zinc-300 print:border-none shadow-md print:shadow-none min-h-[260mm] max-h-[268mm] flex flex-col justify-between overflow-hidden"
        style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
      >
        <div>
          {/* Antet Pagina 2 */}
          <div className="border-b border-black pb-1 mb-2 flex justify-between items-center text-[9px] font-sans">
            <span className="font-bold uppercase tracking-wide">{dealer.name}</span>
            <span className="font-mono text-zinc-700">Factura nr. {invoiceNumber} • VIN: {car.vin}</span>
            <span className="font-semibold text-zinc-800">Pagina 2 din 2</span>
          </div>

          {/* Secțiunea 2: Ce Nu Oferim Garanție (Consumabile & Întreținere) */}
          <div className="mb-1.5 text-[9.5px] leading-snug">
            <div className="font-bold text-[10px] uppercase mb-0.5">
              2. Nu oferim garanţia pentru:
            </div>
            <ul className="space-y-0.5 pl-2 list-none text-[9px]">
              <li>
                <strong>a)</strong> garnituri, manşoane de garnituri, simeringuri, furtune şi ţevi, inele de etanşare pe arbore, bujii şi bujii incandescente, carburanţi, ulei, grăsimi şi alţi lubrifianţi, exceptând situaţia în care utilizarea acestora este necesară din punct de vedere tehnic ca o consecinţă a apariţiei unei defecţiuni acoperite prin garanţie la nivelul unuia din elementele menţionate la punctul 1.
              </li>
              <li>
                <strong>b)</strong> sistemul de frânare (plăcuţe, discuri şi etrieri de frână), deoarece ţine de revizia periodică a autoturismului, acestea fiind consumabile.
              </li>
              <li>
                <strong>c)</strong> sistemul de direcţie (braţe, bucşe, bielete, pivoţi);
              </li>
              <li>
                <strong>d)</strong> sistemul de suspensie (telescoape, arcuri);
              </li>
              <li>
                <strong>e)</strong> elemente de caroserie, parbriz, lunetă, geamuri.
              </li>
            </ul>
          </div>

          {/* Secțiunea 3: Excluderi Suplimentare (Exploatare neconformă, Ride-Sharing etc.) */}
          <div className="mb-1.5 text-[9.5px] leading-snug">
            <div className="font-bold text-[10px] uppercase mb-0.5">
              3. În mod suplimentar, garanţia nu acoperă defecţiunile:
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pl-2 text-[9px] leading-tight">
              <div><strong>a)</strong> datorate accidentelor (eveniment exterior imediat, brusc prin forţă mecanică).</div>
              <div><strong>b)</strong> incendii, explozii, furt, grindină, trăsnet, cutremur sau inundaţie.</div>
              <div><strong>c)</strong> modificarea construcţiei iniţiale (tuning, accesorii neautorizate).</div>
              <div><strong>d)</strong> utilizarea de combustibili necorespunzători / contaminați.</div>
              <div><strong>e)</strong> participarea la curse auto, competiții sau teste de performanță.</div>
              <div><strong>f)</strong> activități de <strong>taxi, ride-sharing</strong> (Uber, Bolt, BlackCab etc.).</div>
              <div><strong>g)</strong> activități de <strong>școală de șoferi</strong> sau închirieri auto contra cost.</div>
              <div><strong>h)</strong> tractări, remorcări peste limitele admise sau exploatare excesivă.</div>
              <div><strong>i)</strong> efectuarea reviziilor la intervale <strong>mai mari de 10.000 km</strong>.</div>
              <div><strong>j)</strong> continuarea utilizării autovehiculului după apariția unei avarii.</div>
              <div className="col-span-2"><strong>k)</strong> deteriorări cauzate de neglijență, vandalism, fenomene naturale sau avarii secundare.</div>
            </div>
          </div>

          {/* Obligațiile Cumpărătorului (Revizie 7 Zile Lucrătoare - Clauză Cheie) */}
          <div className="border-2 border-black p-2 my-1.5 bg-amber-50/40 text-[9px] leading-snug">
            <div className="font-bold text-[9.5px] uppercase tracking-wide text-black mb-0.5">
              OBLIGAŢIILE CUMPĂRĂTORULUI (CONDIȚIE ELIMINATORIE):
            </div>
            <p className="text-justify font-medium">
              Cumpărătorul are obligaţia, pentru a beneficia de prezentul certificat de garanţie, ca în termen de <strong>7 zile lucrătoare</strong> de la data achiziţionării autoturismului, să efectueze în orice <strong>SERVICE AUTORIZAT R.A.R.</strong>, înlocuirea distribuţiei motor, schimbul de ulei, antigel, lichid de frână (cutie, motor, grupuri, casetă de transfer), filtre şi accesorii şi <strong>să păstreze facturile şi bonurile</strong> rezultate în urma schimburilor făcute. În caz contrar, cumpărătorul nu va beneficia de prezentul certificat de garanţie al autoturismului.
            </p>
          </div>

          {/* Caseta Service Autorizat (Pentru Completare / Ștampilă) */}
          <div className="border border-black p-2 my-1.5 text-[9.5px]">
            <div className="font-bold uppercase text-[9.5px] border-b border-black pb-0.5 mb-1.5 tracking-wide flex justify-between items-center">
              <span>OBSERVAŢII SERVICE AUTORIZAT!</span>
              <span className="text-[8.5px] font-normal italic">(Completat la revizia obligatorie de 7 zile)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-1.5 text-[9px]">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-zinc-700">Denumire service:</span>
                <span className="border-b border-dotted border-black flex-1 h-3.5"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-zinc-700">Data reviziei:</span>
                <span className="border-b border-dotted border-black flex-1 h-3.5"></span>
              </div>
            </div>

            <div className="mb-1 text-[9px]">
              <span className="font-semibold text-zinc-700">Alte observaţii / Piese înlocuite:</span>
              <div className="border-b border-dotted border-black h-3.5 mt-0.5"></div>
              <div className="border-b border-dotted border-black h-3.5 mt-0.5"></div>
            </div>

            <div className="text-right pt-0.5 text-[9px]">
              <span className="font-semibold text-zinc-700 mr-2">Semnătura şi ştampila service:</span>
              <span className="inline-block border-b border-dotted border-black w-44 h-3.5"></span>
            </div>
          </div>

          {/* Nu Fac Obiectul Garanției */}
          <div className="bg-zinc-100 border border-zinc-300 p-1.5 my-1 text-[8.5px] leading-snug">
            <div className="font-bold uppercase mb-0.5 text-[9px]">Nu fac obiectul garanţiei:</div>
            <div className="space-y-0.5">
              <div>◼ Costurile pentru lucrările de testare, măsurare şi reglare, în măsura în care acestea nu sunt în legătură cu o defecţiune acoperită de garanţie.</div>
              <div>◼ Costurile de remorcare sau de transport pe platformă.</div>
            </div>
          </div>

          {/* Semnături Finale Asumare Contractuală */}
          <div className="grid grid-cols-2 gap-8 pt-1.5 border-t-2 border-black text-center text-[9.5px]">
            <div>
              <div className="font-bold uppercase">EMITENT GARANȚIE (VÂNZĂTOR):</div>
              <div className="font-bold text-[10px]">{dealer.name}</div>
              <div className="text-[8.5px] text-zinc-600 font-sans">Departament Tehnic & Garanții</div>
              <div className="h-8 flex items-end justify-center font-cursive italic text-zinc-400 text-xs">
                (Semnătură & Ștampilă)
              </div>
              <div className="border-t border-dotted border-zinc-500 w-3/4 mx-auto pt-0.5"></div>
            </div>
            <div>
              <div className="font-bold uppercase">CUMPĂRĂTOR (AM LUAT LA CUNOȘTINȚĂ):</div>
              <div className="font-bold text-[10px]">{buyer.fullName || '__________________________'}</div>
              <div className="text-[8.5px] text-zinc-600 font-sans">Am primit 1 exemplar original</div>
              <div className="h-8 flex items-end justify-center font-cursive italic text-zinc-400 text-xs">
                (Semnătură Cumpărător)
              </div>
              <div className="border-t border-dotted border-zinc-500 w-3/4 mx-auto pt-0.5"></div>
            </div>
          </div>
        </div>

        {/* Footer Pagina 2 */}
        <div className="pt-1.5 border-t border-zinc-300 flex justify-between items-center text-[8.5px] text-zinc-500 font-sans mt-1">
          <span>{dealer.name} • Certificat de Garanție Conform Legea 449/2003</span>
          <span>Pagina 2 din 2</span>
        </div>
      </div>

    </div>
  );
};
