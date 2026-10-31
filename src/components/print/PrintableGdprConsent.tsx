import React from 'react';
import { VehicleItem, SEED_DEALER, DealerProfile } from '../../db/seed';
import { BuyerData } from './types';

interface PrintableGdprConsentProps {
  car?: VehicleItem | null;
  buyer: BuyerData;
  dealer?: DealerProfile;
}

export const PrintableGdprConsent: React.FC<PrintableGdprConsentProps> = ({
  car,
  buyer,
  dealer = SEED_DEALER
}) => {
  const currentDate = buyer.contractDate || new Date().toISOString().split('T')[0];
  const formattedDate = new Date(currentDate).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Sediu social și punct de lucru conform dealer / document oficial
  const legalAddress = dealer.legalAddress || dealer.address || 'jud. Cluj';
  const workLocation = dealer.showroomAddress || dealer.address || 'Cluj-Napoca';
  const dealerEmail = dealer.email || (dealer.domain ? `contact@${dealer.domain}` : 'contact@showroom.ro');
  const effectiveLogo = dealer.logoUrl || '/images/rxm-logo.png';

  return (
    <div className="printable-doc bg-white text-black p-8 sm:p-10 max-w-[210mm] mx-auto text-[11px] leading-relaxed font-serif print:p-0 print:max-w-none shadow-md print:shadow-none min-h-[270mm] flex flex-col justify-between">
      <div>
        {/* Antet Oficial Dealer */}
        <div className="border-b-2 border-black pb-3 mb-5">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={effectiveLogo} 
                alt={dealer.name} 
                className="h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-sm font-black tracking-tight uppercase leading-none font-sans text-black">
                  {dealer.name}
                </h1>
                <p className="text-[9.5px] text-zinc-700 mt-0.5 font-sans">
                  Dealer Autovehicule Rulate &bull; Showroom {dealer.serviceLocation || 'Cluj-Napoca'}
                </p>
              </div>
            </div>
            <div className="text-right text-[9px] leading-tight text-zinc-800 font-sans">
              <div><strong>C.U.I.:</strong> {dealer.cui} {dealer.regCom ? <> &bull; <strong>Reg. Com.:</strong> {dealer.regCom}</> : null}</div>
              <div><strong>Sediu Social:</strong> {legalAddress}</div>
              <div><strong>Punct de Lucru / Showroom:</strong> {workLocation}</div>
              <div><strong>Contact:</strong> {dealer.phonePrimary} &bull; {dealerEmail}</div>
            </div>
          </div>
        </div>

        {/* Titlu Document Oficial */}
        <div className="text-center my-6">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide border-b border-black pb-2 inline-block">
            ACORD PRIVIND PRELUCRAREA DATELOR CU CARACTER PERSONAL
          </h2>
          <p className="text-[10px] text-zinc-600 italic mt-1 font-sans">
            Conform Regulamentului (UE) 2016/679 (GDPR) și Legii nr. 190/2018
          </p>
        </div>

        {/* Date Identificare Cumpărător / Persoană Vizată */}
        <div className="border border-black p-3.5 mb-5 bg-zinc-50/50 print:bg-transparent">
          <div className="text-[10px] font-bold uppercase tracking-wider text-black border-b border-black/40 pb-1 mb-2 font-sans flex items-center justify-between">
            <span>Identificare Persoană Vizată (Client / Cumpărător):</span>
            <span className="font-mono text-[9px] font-normal normal-case text-zinc-600">Formular de consimțământ expres</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px]">
            <div>
              <span className="text-zinc-600">Nume și Prenume:</span>{' '}
              <strong className="text-black uppercase">{buyer.fullName || '_____________________________________'}</strong>
            </div>
            <div>
              <span className="text-zinc-600">C.N.P. / C.U.I.:</span>{' '}
              <strong className="font-mono">{buyer.cnpOrCui || '_________________________________'}</strong>
            </div>
            <div>
              <span className="text-zinc-600">Act Identitate (CI/BI):</span>{' '}
              <span>Seria <strong>{buyer.idSeries || '_____'}</strong> Nr. <strong>{buyer.idNumber || '________'}</strong></span>
            </div>
            <div>
              <span className="text-zinc-600">Telefon Contact:</span>{' '}
              <strong className="font-mono">{buyer.phone || '_________________________________'}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-600">Adresă / Domiciliu:</span>{' '}
              <strong>{buyer.address || '___________________________________________________________'}</strong>
              {buyer.county && <span>, Jud. <strong>{buyer.county}</strong></span>}
            </div>
            {car && (
              <div className="col-span-2 pt-1 border-t border-dashed border-black/30 mt-1 text-[10px] text-zinc-700">
                <span className="text-zinc-600">Referință Autovehicul Tranzacționat:</span>{' '}
                <strong>{car.brand} {car.model}</strong> ({car.year}) &bull; Serie Șasiu (VIN):{' '}
                <strong className="font-mono">{car.vin}</strong>
                {car.stockNumber && <span> &bull; Stoc: <strong className="font-mono">#{car.stockNumber}</strong></span>}
              </div>
            )}
          </div>
        </div>

        {/* Conținutul Oficial al Acordului — Textul Dealerului */}
        <div className="space-y-3.5 text-[11px] text-justify leading-relaxed">
          <p>
            Subsemnatul(a), <strong>{buyer.fullName || '_____________________________________'}</strong>, declar că am fost informat(ă) de către <strong>{dealer.name}</strong>, CUI <strong>{dealer.cui}</strong>, cu sediul social în {legalAddress}, și punct de lucru în {workLocation}, cu privire la prelucrarea datelor mele cu caracter personal.
          </p>

          <div>
            <p className="font-bold text-black mb-1.5">
              Datele furnizate de mine vor fi utilizate exclusiv pentru:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-1 text-[10.5px]">
              <li>
                <strong>întocmirea documentelor de vânzare-cumpărare</strong> (contracte de înstrăinare-dobândire, proces-verbal de predare-primire a vehiculului, certificat oficial de garanție și formalități de înmatriculare/transcriere);
              </li>
              <li>
                <strong>emiterea facturilor și a documentelor aferente</strong> (factură fiscală sau factură proformă, chitanțe, notă de calcul fiscal regim special marjă conform Art. 312 Cod Fiscal);
              </li>
              <li>
                <strong>comunicarea cu privire la tranzacția efectuată</strong> (stadiul actelor, programarea livrării autovehiculului, confirmări de plată și asistență post-vânzare);
              </li>
              <li>
                <strong>îndeplinirea obligațiilor legale ale societății</strong> (raportări fiscale către ANAF, arhivare financiar-contabilă conform legii, evidențe DITL și conformitate OUG 140/2021).
              </li>
            </ul>
          </div>

          <p>
            Am luat la cunoștință faptul că datele mele sunt prelucrate în conformitate cu <strong>Regulamentul (UE) 2016/679 (GDPR)</strong> și legislația națională aplicabilă și că beneficiez de toate drepturile prevăzute de legislația în vigoare privind protecția datelor cu caracter personal:
          </p>

          <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded text-[9.5px] leading-snug print:bg-transparent print:border-black/30 font-sans">
            <strong>Drepturile Persoanei Vizate:</strong> Dreptul de acces la date (Art. 15), dreptul de rectificare a datelor inexacte (Art. 16), dreptul la ștergerea datelor / „dreptul de a fi uitat” (Art. 17), dreptul la restricționarea prelucrării (Art. 18), dreptul la portabilitatea datelor (Art. 20) și dreptul la opoziție (Art. 21). Pentru exercitarea oricărui drept, mă pot adresa în scris operatorului <strong>{dealer.name}</strong> la sediul menționat sau la e-mail <strong>{dealerEmail}</strong>. De asemenea, beneficiez de dreptul de a depune plângere în fața <em>Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</em>.
          </div>

          <p className="font-semibold text-black pt-1">
            Prin semnarea prezentului document îmi exprim în mod expres, liber și neechivoc acordul pentru prelucrarea datelor mele în scopurile menționate mai sus.
          </p>
        </div>
      </div>

      {/* Secțiune Semnături */}
      <div className="pt-6 border-t-2 border-black mt-8">
        <div className="grid grid-cols-2 gap-8 text-[11px]">
          <div>
            <div className="font-bold uppercase tracking-wider text-black text-[10px] font-sans mb-1">
              PERSOANA VIZATĂ (CLIENT / CUMPĂRĂTOR):
            </div>
            <div className="space-y-1">
              <div>Nume și prenume: <strong className="uppercase">{buyer.fullName || '__________________________'}</strong></div>
              <div>Data: <strong>{formattedDate}</strong></div>
              <div className="pt-8">
                Semnătura: _____________________________________
              </div>
            </div>
          </div>

          <div>
            <div className="font-bold uppercase tracking-wider text-black text-[10px] font-sans mb-1">
              OPERATOR DE DATE (DEALER AUTO):
            </div>
            <div className="space-y-1">
              <div>Societatea: <strong>{dealer.name}</strong></div>
              <div>Reprezentant: <strong>Consilier Vânzări Showroom</strong></div>
              <div>Data: <strong>{formattedDate}</strong></div>
              <div className="pt-5">
                Semnătura & Ștampila: ___________________________
              </div>
            </div>
          </div>
        </div>

        {/* Subsol Conformitate */}
        <div className="mt-8 pt-2 border-t border-black/20 text-[8.5px] text-zinc-500 flex justify-between items-center font-sans">
          <span>
            Exemplar original &bull; Dosar tranzacție autovehicul {car ? `${car.brand} ${car.model} (VIN: ${car.vin})` : ''}
          </span>
          <span>
            Generat securizat prin Dealer OS &bull; {dealer.name} &bull; Conform Regulament (UE) 2016/679
          </span>
        </div>
      </div>
    </div>
  );
};
