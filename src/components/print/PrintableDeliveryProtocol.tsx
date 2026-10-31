import React from 'react';
import { VehicleItem, SEED_DEALER, DealerProfile } from '../../db/seed';
import { BuyerData } from './types';
import { formatMileage } from '../../utils/helpers';

interface PrintableDeliveryProtocolProps {
  car: VehicleItem;
  buyer: BuyerData;
  dealer?: DealerProfile;
}

export const PrintableDeliveryProtocol: React.FC<PrintableDeliveryProtocolProps> = ({
  car,
  buyer,
  dealer = SEED_DEALER
}) => {
  const dealerPrefix = (dealer.slug || 'DEALER').toUpperCase().replace('_', '');

  return (
    <div className="printable-doc bg-white text-black p-8 max-w-[210mm] mx-auto text-[11px] leading-tight font-serif print:p-0">
      <div className="text-center font-bold text-sm tracking-wide uppercase border-b-2 border-black pb-2 mb-4">
        <div className="text-base font-extrabold">
          PROCES - VERBAL DE PREDARE - PRIMIRE AUTOVEHICUL
        </div>
        <div className="text-[10px] font-normal normal-case italic mt-0.5">
          Anexă la Contractul de Înstrăinare-Dobândire nr. {dealerPrefix}-{new Date().getFullYear()}-{car.id.slice(-4).toUpperCase()}
        </div>
      </div>

      <p className="mb-3 text-[10px]">
        Încheiat astăzi, <span className="font-bold">{buyer.contractDate || new Date().toLocaleDateString('ro-RO')}</span>, la punctul de lucru <span className="font-bold">{dealer.name}</span> din <span className="font-bold">{dealer.address}</span>, între:
      </p>

      <div className="grid grid-cols-2 gap-4 border border-black p-2.5 mb-3">
        <div>
          <span className="font-bold uppercase text-[10px]">PREDĂTOR (VÂNZĂTOR):</span><br />
          <span className="font-bold">{dealer.name}</span><br />
          CUI: <span className="font-mono">{dealer.cui}</span>, Cluj-Napoca
        </div>
        <div>
          <span className="font-bold uppercase text-[10px]">RECEPIENT (CUMPĂRĂTOR):</span><br />
          <span className="font-bold">{buyer.fullName || '__________________________'}</span><br />
          CNP/CUI: <span className="font-mono">{buyer.cnpOrCui || '___________________'}</span>
        </div>
      </div>

      {/* IDENTIFICARE AUTOVEHICUL */}
      <div className="border border-black p-2.5 mb-3">
        <div className="font-bold uppercase text-[10px] mb-1">
          1. IDENTIFICARE VEHICUL ȘI STARE TEHNICĂ:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            Vehicul: <span className="font-bold">{car.brand} {car.model}</span> ({car.year})<br />
            Serie Șasiu (VIN): <span className="font-mono font-bold">{car.vin}</span>
          </div>
          <div>
            Kilometraj atestat la predare: <span className="font-bold font-mono text-xs">{formatMileage(buyer.deliveryMileageKm ?? car.mileageKm)}</span><br />
            Carburant în rezervor: <span className="font-bold">{buyer.fuelLevel || 'Minim 1/4 rezervor'}</span>
          </div>
        </div>
      </div>

      {/* ACCESORII ȘI DOCUMENTE PREDATE */}
      <div className="border border-black p-2.5 mb-3">
        <div className="font-bold uppercase text-[10px] mb-1.5">
          2. ACCESORII, ECHIPAMENTE ȘI DOCUMENTE PREDATE:
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <div>
            <span className="font-bold font-mono">{buyer.keysCount !== 0 ? '[X]' : '[  ]'}</span> Număr chei originale:{' '}
            <span className="font-bold">
              {buyer.keysCustomText 
                ? buyer.keysCustomText 
                : buyer.keysCount === 1 
                  ? '1 cheie funcțională' 
                  : `${buyer.keysCount ?? 2} chei funcționale`}
            </span>
          </div>
          <div>
            <span className="font-bold font-mono">{buyer.hasRegistrationCertificate !== false ? '[X]' : '[  ]'}</span> Certificat Înmatriculare (Talon) original / străin
            {buyer.hasRegistrationCertificate === false && <span className="italic font-bold ml-1 text-gray-700">(Lipsă / Urmează)</span>}
          </div>
          <div>
            <span className="font-bold font-mono">{buyer.hasCivOrOriginDocs !== false ? '[X]' : '[  ]'}</span> Carte de Identitate Vehicul (CIV) / Proveniență
            {buyer.hasCivOrOriginDocs === false && <span className="italic font-bold ml-1 text-gray-700">(Lipsă / Urmează)</span>}
          </div>
          <div>
            <span className="font-bold font-mono">{buyer.hasTaxInvoice !== false ? '[X]' : '[  ]'}</span> Factură Fiscală emisă de vânzător
            {buyer.hasTaxInvoice === false && <span className="italic font-bold ml-1 text-gray-700">(Nepredată)</span>}
          </div>
          <div>
            <span className="font-bold font-mono">{buyer.hasWarrantyCertificate !== false ? '[X]' : '[  ]'}</span> Certificat de Garanție (12 luni / 10.000 km)
            {buyer.hasWarrantyCertificate === false && <span className="italic font-bold ml-1 text-gray-700">(Fără Garanție)</span>}
          </div>
          <div>
            <span className="font-bold font-mono">{buyer.hasMedicalKitTriangles !== false ? '[X]' : '[  ]'}</span> Trusă medicală, triunghiuri reflectorizante, stingător
            {buyer.hasMedicalKitTriangles === false && <span className="italic font-bold ml-1 text-gray-700">(Lipsă)</span>}
          </div>
          <div>
            <span className="font-bold font-mono">{buyer.hasSpareWheelOrKit !== false ? '[X]' : '[  ]'}</span> Roată de rezervă / Kit etanșare pană și cric
            {buyer.hasSpareWheelOrKit === false && <span className="italic font-bold ml-1 text-gray-700">(Lipsă)</span>}
          </div>
          <div>
            <span className="font-bold font-mono">{buyer.hasMountedTiresGoodCondition !== false ? '[X]' : '[  ]'}</span> Set anvelope montate (stare bună de rulare)
            {buyer.hasMountedTiresGoodCondition === false && <span className="italic font-bold ml-1 text-gray-700">(Uzură)</span>}
          </div>
          {buyer.hasUserManualServiceBook !== false && (
            <div className="col-span-2">
              <span className="font-bold font-mono">[X]</span> Manual utilizare / Carte service / Istoric mentenanță
            </div>
          )}
        </div>
        {buyer.deliveryNotes && (
          <div className="mt-2 pt-1.5 border-t border-black/30 text-[9.5px]">
            <span className="font-bold uppercase">Mențiuni specifice predare / Alte accesorii: </span>
            <span className="italic">{buyer.deliveryNotes}</span>
          </div>
        )}
      </div>

      {/* DECLARAȚII */}
      <div className="border border-black p-2.5 mb-4 text-[10px] space-y-1.5">
        <div className="font-bold uppercase">
          3. DECLARAȚIA CUMPĂRĂTORULUI:
        </div>
        <p>
          Subsemnatul cumpărător confirm că am examinat vizual și mecanic autovehiculul, am efectuat proba de traseu și am verificat conformitatea seriilor de caroserie și motor.
        </p>
        <p>
          Confirm primirea tuturor documentelor menționate și mă oblig să efectuez transcrierea dreptului de proprietate în termenul legal de 90 de zile conform legii rutiere.
        </p>
      </div>

      {/* SEMNĂTURI */}
      <div className="grid grid-cols-2 gap-8 pt-4 border-t border-black text-center">
        <div>
          <div className="font-bold uppercase text-[10px]">AM PREDAT AUTOVEHICULUL:</div>
          <div className="font-bold">{dealer.name} S.R.L.</div>
          <div className="h-16 flex items-end justify-center font-cursive italic text-gray-500">
            Semnătura și ștampila vânzător
          </div>
        </div>
        <div>
          <div className="font-bold uppercase text-[10px]">AM PRELUAT AUTOVEHICULUL:</div>
          <div className="font-bold">{buyer.fullName || '__________________________'}</div>
          <div className="h-16 flex items-end justify-center font-cursive italic text-gray-500">
            Semnătura cumpărător
          </div>
        </div>
      </div>
    </div>
  );
};
