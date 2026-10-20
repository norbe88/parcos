import React, { useState } from 'react';
import { 
  MessageSquare, 
  ShieldCheck, 
  Check, 
  Copy, 
  ExternalLink, 
  Smartphone, 
  Send, 
  Sparkles, 
  CheckCheck, 
  Car, 
  CreditCard,
  Building2,
  FileCheck2,
  ArrowRight
} from 'lucide-react';

interface QuoteVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  engine: string;
  grossPriceEur: number;
  color: string;
}

const SAMPLE_VEHICLES: QuoteVehicle[] = [
  {
    id: 'audi_a6',
    brand: 'Audi',
    model: 'A6 Avant 2.0 TDI ultra',
    year: 2018,
    km: 168000,
    engine: '1968 cm³ • 190 CP • Euro 6',
    grossPriceEur: 16900,
    color: 'Gri Daytona'
  },
  {
    id: 'bmw_520d',
    brand: 'BMW',
    model: '520d Touring M Sport',
    year: 2019,
    km: 142000,
    engine: '1995 cm³ • 190 CP • Euro 6d',
    grossPriceEur: 18500,
    color: 'Negru Metalizat'
  },
  {
    id: 'dacia_duster',
    brand: 'Dacia',
    model: 'Duster 1.5 Blue dCi 4x4 Prestige',
    year: 2021,
    km: 74000,
    engine: '1461 cm³ • 115 CP • Euro 6',
    grossPriceEur: 14200,
    color: 'Portocaliu Atacama'
  }
];

export const WhatsAppQuoteSimulator: React.FC = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('audi_a6');
  const [isVatDeductible, setIsVatDeductible] = useState<boolean>(true);
  const [includeBtGuarantee, setIncludeBtGuarantee] = useState<boolean>(true);
  const [includeInspection, setIncludeInspection] = useState<boolean>(true);
  const [includeDelivery, setIncludeDelivery] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const vehicle = SAMPLE_VEHICLES.find(v => v.id === selectedVehicleId) || SAMPLE_VEHICLES[0];

  // Holding Financial Invariant: strict 21% VAT
  const vatRate = 0.21;
  const netPriceEur = Math.round(vehicle.grossPriceEur / (1 + vatRate));
  const vatAmountEur = vehicle.grossPriceEur - netPriceEur;

  // Build the WhatsApp message formatted text
  const generateMessageText = () => {
    let msg = `Bună ziua! Vă trimit oferta oficială pentru *${vehicle.brand} ${vehicle.model}* (${vehicle.year}):\n\n`;
    msg += `📍 *Specificații Principale:*\n`;
    msg += `• An Fabricație: ${vehicle.year}\n`;
    msg += `• Kilometraj real: ${vehicle.km.toLocaleString('ro-RO')} km (certificat pe factură)\n`;
    msg += `• Motorizare: ${vehicle.engine}\n`;
    msg += `• Culoare: ${vehicle.color}\n\n`;

    msg += `💶 *Preț și Regim Fiscal:*\n`;
    if (isVatDeductible) {
      msg += `• *Preț Total:* ${vehicle.grossPriceEur.toLocaleString('ro-RO')} € (TVA deductibil 21% inclus)\n`;
      msg += `• *Valoare Netă:* ${netPriceEur.toLocaleString('ro-RO')} € + TVA: ${vatAmountEur.toLocaleString('ro-RO')} €\n`;
      msg += `• Posibilitate finanțare leasing / credit persoane fizice și juridice cu 0% avans.\n\n`;
    } else {
      msg += `• *Preț Final:* ${vehicle.grossPriceEur.toLocaleString('ro-RO')} €\n`;
      msg += `• Regim special de marjă conform *Art. 312 Cod Fiscal* (fără TVA adăugat).\n\n`;
    }

    if (includeInspection) {
      msg += `🔍 *Verificare & Transparență:*\n`;
      msg += `• Garanție 12-24 luni pentru motor și cutie de viteze.\n`;
      msg += `• Raport tehnic detaliat în 120 de puncte.\n`;
      msg += `• *Verificare carVertical disponibilă în platformă*.\n\n`;
    }

    if (includeBtGuarantee) {
      msg += `🛡️ *Garanție de Rezervare (Plată Securizată Stripe / Card / Transfer):*\n`;
      msg += `• Pentru a bloca mașina în showroom timp de 48h:\n`;
      msg += `• Valoare Garanție de Rezervare: 500 € (2.500 RON)\n`;
      msg += `• Plată securizată cu cardul (Stripe) sau transfer bancar instant\n`;
      msg += `• Plata se confirmă instant și autovehiculul este marcat „REZERVAT” pe site.\n\n`;
    }

    if (includeDelivery) {
      msg += `🚚 *Livrare:* Livrăm pe platformă dedicată direct la domiciliul dumneavoastră în orice județ din România.\n\n`;
    }

    msg += `Link direct fișă showroom: https://showroom.parcos.ro/vehicul/${vehicle.id}`;
    return msg;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMessageText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(generateMessageText());
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="w-full">
      {/* Header and Commercial Proof Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono-telemetry text-emerald-300 font-semibold mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>MODUL CONVERSIE WHATSAPP // REZERVĂRI ONLINE</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
            Oferte Elegante pe WhatsApp cu Garanție de Rezervare
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 max-w-2xl leading-relaxed">
            Elimină ofertele compuse greoi pe telefon și ezitarea clienților de a trimite avans. 
            Generează în 10 secunde un mesaj profesionist cu calcul TVA deductibil și link de plată securizat.
          </p>
        </div>

        {/* Commercial Proof Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-xs font-mono-telemetry font-bold shadow-sm shadow-emerald-500/10 shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Rată de închidere cu +34% mai mare pe lead-urile din online</span>
        </div>
      </div>

      {/* Simulator Workspace: Left Controls (5 cols) + Right Phone Frame (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Controls Pane */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Vehicle Selector */}
          <div className="p-5 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-3">
              1. Alege Vehiculul din Stoc
            </label>
            <div className="space-y-2">
              {SAMPLE_VEHICLES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`w-full min-h-[48px] p-3 rounded-xl border text-left transition-all touch-manipulation flex items-center justify-between ${
                    selectedVehicleId === v.id
                      ? 'border-amber-400/80 bg-zinc-900 text-white shadow-md shadow-amber-500/10'
                      : 'border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Car className={`w-4 h-4 ${selectedVehicleId === v.id ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-xs font-bold leading-tight text-white">{v.brand} {v.model}</div>
                      <div className="text-[11px] font-mono text-zinc-400">{v.year} • {v.km.toLocaleString('ro-RO')} km</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-amber-400">
                    {v.grossPriceEur.toLocaleString('ro-RO')} €
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Options (Toggles) */}
          <div className="p-5 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl space-y-3.5">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              2. Parametri Fiscali & Garanții
            </label>

            {/* Fiscal Regime Toggle */}
            <div 
              onClick={() => setIsVatDeductible(!isVatDeductible)}
              className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/15 transition-all touch-manipulation min-h-[44px]"
            >
              <div>
                <div className="text-xs font-bold text-white">Regim TVA Deductibil (21%)</div>
                <div className="text-[11px] text-zinc-400">
                  {isVatDeductible ? 'TVA deductibil (Gross / 1.21)' : 'Regim marjă de profit conform Art. 312'}
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${isVatDeductible ? 'bg-amber-400' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-zinc-950 transition-transform ${isVatDeductible ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Cont de Garanție Toggle */}
            <div 
              onClick={() => setIncludeBtGuarantee(!includeBtGuarantee)}
              className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/15 transition-all touch-manipulation min-h-[44px]"
            >
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Garanție de Rezervare (Stripe / Card / Transfer)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-400/10 text-purple-300 border border-purple-400/30">500 €</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Link de plată securizat (card Stripe sau transfer) pentru blocarea mașinii 48h
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${includeBtGuarantee ? 'bg-emerald-400' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-zinc-950 transition-transform ${includeBtGuarantee ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Inspection & carVertical Toggle */}
            <div 
              onClick={() => setIncludeInspection(!includeInspection)}
              className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/15 transition-all touch-manipulation min-h-[44px]"
            >
              <div>
                <div className="text-xs font-bold text-white">Inspecție 120 Puncte & carVertical</div>
                <div className="text-[11px] text-zinc-400">
                  Verificare carVertical disponibilă în platformă
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${includeInspection ? 'bg-blue-400' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-zinc-950 transition-transform ${includeInspection ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Delivery Toggle */}
            <div 
              onClick={() => setIncludeDelivery(!includeDelivery)}
              className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/15 transition-all touch-manipulation min-h-[44px]"
            >
              <div>
                <div className="text-xs font-bold text-white">Livrare pe Platformă la Domiciliu</div>
                <div className="text-[11px] text-zinc-400">
                  Livrăm în toată România cu numere roșii provizorii
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${includeDelivery ? 'bg-amber-400' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-zinc-950 transition-transform ${includeDelivery ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="min-h-[48px] px-4 py-3 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-all text-xs flex items-center justify-center gap-2 touch-manipulation shadow-md shadow-amber-500/20 active:scale-[0.98]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiat în Clipboard!' : 'Copiază Text Ofertă'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="min-h-[48px] px-4 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-xs flex items-center justify-center gap-2 touch-manipulation shadow-md shadow-emerald-600/20 active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>Deschide în WhatsApp</span>
            </button>
          </div>

        </div>

        {/* Right Pane: High-Fidelity Smartphone WhatsApp Chat Frame */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[420px] rounded-[38px] border-[5px] border-zinc-800 bg-[#0b141a] shadow-2xl overflow-hidden relative">
            
            {/* Phone Speaker & Camera Notch */}
            <div className="bg-black py-2 px-6 flex items-center justify-between text-[11px] text-zinc-400 font-mono select-none">
              <span>09:41</span>
              <div className="w-20 h-4 bg-zinc-900 rounded-full mx-auto" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* WhatsApp Chat Header */}
            <div className="bg-[#1f2c34] px-4 py-2.5 flex items-center justify-between border-b border-[#2a3942]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center font-bold text-zinc-950 text-xs">
                  <Car className="w-5 h-5 text-zinc-950" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
                    <span>Consilier Vânzări Auto</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-[9px] font-black">✓</span>
                  </div>
                  <div className="text-[11px] text-[#8696a0] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>activ acum • Parc Auto Partener</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Body with WallPaper Pattern */}
            <div 
              className="p-4 space-y-3 min-h-[460px] text-xs leading-relaxed overflow-y-auto select-text"
              style={{
                backgroundColor: '#0b141a',
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                backgroundSize: '16px 16px'
              }}
            >
              {/* Date divider */}
              <div className="flex justify-center my-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#182229] text-[10px] text-[#8696a0] font-mono">
                  ASTĂZI
                </span>
              </div>

              {/* Inbound Customer Inquiry (Context) */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#202c33] text-white p-3 shadow-md">
                  <p>Bună ziua! Mai este disponibilă mașina {vehicle.brand} {vehicle.model}? Care este ultimul preț și cum se poate rezerva?</p>
                  <span className="text-[9px] text-[#8696a0] float-right mt-1">09:40</span>
                </div>
              </div>

              {/* Outbound Official Offer Message (Dynamic Live Result) */}
              <div className="flex justify-end">
                <div className="max-w-[92%] rounded-2xl rounded-tr-sm bg-[#005c4b] text-[#e9edef] p-3.5 shadow-md space-y-2 relative">
                  
                  {/* Lead Title */}
                  <div className="font-bold text-sm text-white">
                    Bună ziua! Vă trimit oferta oficială pentru *{vehicle.brand} {vehicle.model}* ({vehicle.year}):
                  </div>

                  {/* Specs Card */}
                  <div className="p-2.5 rounded-lg bg-black/20 border border-white/5 space-y-0.5 text-[11px]">
                    <div className="font-bold text-amber-300">📍 Specificații Verificate:</div>
                    <div>• An: <strong className="text-white">{vehicle.year}</strong> • {vehicle.km.toLocaleString('ro-RO')} km reali</div>
                    <div>• Motor: {vehicle.engine}</div>
                    <div>• Culoare: {vehicle.color}</div>
                  </div>

                  {/* Price Block */}
                  <div className="p-2.5 rounded-lg bg-black/20 border border-white/5 space-y-0.5 text-[11px]">
                    <div className="font-bold text-emerald-300">💶 Preț & Detalii Fiscale:</div>
                    {isVatDeductible ? (
                      <>
                        <div className="text-sm font-extrabold text-white">
                          {vehicle.grossPriceEur.toLocaleString('ro-RO')} € <span className="text-[10px] font-normal text-emerald-300">(TVA 21% deductibil inclus)</span>
                        </div>
                        <div className="text-[10px] text-zinc-300 font-mono">
                          Net: {netPriceEur.toLocaleString('ro-RO')} € + TVA: {vatAmountEur.toLocaleString('ro-RO')} €
                        </div>
                        <div className="text-[10px] text-zinc-400">Eligibil finanțare credit/leasing fără avans.</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-extrabold text-white">
                          {vehicle.grossPriceEur.toLocaleString('ro-RO')} € (Preț Final)
                        </div>
                        <div className="text-[10px] text-zinc-300">
                          Regim marjă conform Art. 312 Cod Fiscal (fără TVA adăugat).
                        </div>
                      </>
                    )}
                  </div>

                  {/* Inspection Block */}
                  {includeInspection && (
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5 text-[11px] space-y-0.5">
                      <div className="font-bold text-blue-300">🔍 Verificare Tehnică & Garanție:</div>
                      <div>• Garanție 12-24 luni motor & cutie</div>
                      <div>• Verificare carVertical disponibilă în platformă</div>
                    </div>
                  )}

                  {/* Guarantee Block */}
                  {includeBtGuarantee && (
                    <div className="p-2.5 rounded-lg bg-black/30 border border-amber-400/30 text-[11px] space-y-1">
                      <div className="font-bold text-amber-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Garanție de Rezervare (Stripe & Card):</span>
                      </div>
                      <div className="text-zinc-200">
                        Blocare stoc 48h prin Cont de Garanție: <strong>500 € (2.500 RON)</strong>
                      </div>
                      <div className="text-[9px] font-mono text-zinc-400">
                        Plată securizată Stripe / Card sau Transfer • Confirmare instantanee
                      </div>
                    </div>
                  )}

                  {/* Delivery Block */}
                  {includeDelivery && (
                    <div className="text-[10px] text-zinc-300">
                      🚚 Livrare pe platformă la domiciliu oriunde în țară.
                    </div>
                  )}

                  {/* Link Showroom */}
                  <div className="pt-1 text-[11px] text-emerald-200 underline">
                    https://showroom.parcos.ro/vehicul/{vehicle.id}
                  </div>

                  {/* Timestamp & Double Checkmarks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-[#8696a0] pt-1">
                    <span>09:41</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                  </div>

                </div>
              </div>

            </div>

            {/* WhatsApp Chat Input Bar Footer */}
            <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2 border-t border-[#2a3942]">
              <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-1.5 text-xs text-[#8696a0]">
                Răspunde clientului...
              </div>
              <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                <Send className="w-4 h-4" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
