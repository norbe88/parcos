import React from 'react';
import { MapPin, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../../db/seed';
import { getStockNumber } from '../../../utils/helpers';

interface DetailTestDriveTabProps {
  car: VehicleItem;
  tdDate: string;
  setTdDate: (date: string) => void;
  tdTimeSlot: string;
  setTdTimeSlot: (slot: string) => void;
  tdName: string;
  setTdName: (name: string) => void;
  tdPhone: string;
  setTdPhone: (phone: string) => void;
  tdGdprConsent?: boolean;
  setTdGdprConsent?: (consent: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  dealer?: typeof SEED_DEALER;
}

export const DetailTestDriveTab: React.FC<DetailTestDriveTabProps> = ({
  car,
  tdDate,
  setTdDate,
  tdTimeSlot,
  setTdTimeSlot,
  tdName,
  setTdName,
  tdPhone,
  setTdPhone,
  tdGdprConsent = false,
  setTdGdprConsent,
  onSubmit,
  dealer = SEED_DEALER
}) => {
  const stockRef = getStockNumber(car);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Informații Locație Showroom */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <MapPin className="w-4 h-4" /> Locație Showroom & Test Drive: {dealer.address}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={dealer.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealer.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
            >
              <span>Google Maps</span>
            </a>
            <a 
              href={dealer.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(dealer.address)}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
            >
              <span>Waze</span>
            </a>
          </div>
        </div>
        <p className="text-[11px] text-zinc-300">
          Programează o vizionare fizică și o sesiune de test drive cu autoturismul <strong>{car.brand} {car.model} [Ref: {stockRef}]</strong>. Pregătim mașina igienizată, numerele de probă și cheile înainte de sosirea ta!
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-black/40 p-4 sm:p-5 rounded-xl border border-white/06">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="td-date" className="block text-zinc-400 mb-1 font-medium">Data Dorită pentru Test Drive</label>
            <input 
              id="td-date"
              aria-label="Data dorită pentru test drive"
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={tdDate}
              onChange={e => setTdDate(e.target.value)}
              className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-medium text-base sm:text-xs touch-manipulation"
            />
          </div>

          <div>
            <label htmlFor="td-timeslot" className="block text-zinc-400 mb-1 font-medium">Interval Orar (Luni - Sâmbătă)</label>
            <select 
              id="td-timeslot"
              aria-label="Interval orar test drive"
              value={tdTimeSlot}
              onChange={e => setTdTimeSlot(e.target.value)}
              className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-medium text-base sm:text-xs touch-manipulation"
            >
              <option value="09:00 - 10:30">09:00 - 10:30 (Dimineața)</option>
              <option value="11:00 - 12:30">11:00 - 12:30 (Prânz)</option>
              <option value="13:30 - 15:00">13:30 - 15:00 (După-amiaza)</option>
              <option value="15:30 - 17:00">15:30 - 17:00 (După-amiaza)</option>
              <option value="17:00 - 18:30">17:00 - 18:30 (Seara)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="td-name" className="block text-zinc-400 mb-1 font-medium">Nume & Prenume *</label>
            <input 
              id="td-name"
              aria-label="Nume și prenume solicitant test drive"
              type="text" 
              required
              placeholder="Numele tău complet"
              value={tdName}
              onChange={e => setTdName(e.target.value)}
              className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-medium text-base sm:text-xs touch-manipulation"
            />
          </div>

          <div>
            <label htmlFor="td-phone" className="block text-zinc-400 mb-1 font-medium">Număr de Telefon (Confirmare WhatsApp) *</label>
            <input 
              id="td-phone"
              aria-label="Număr de telefon confirmare WhatsApp"
              type="tel" 
              required
              placeholder="Ex: 0748 123 456"
              value={tdPhone}
              onChange={e => setTdPhone(e.target.value)}
              className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-medium font-mono text-base sm:text-xs touch-manipulation"
            />
          </div>
        </div>

        {/* 🛡️ Bifă Obligatorie Consimțământ GDPR (ANSPDCP / Regulamentul UE 2016/679) */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              required
              checked={tdGdprConsent}
              onChange={e => setTdGdprConsent?.(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#18181b] text-amber-500 focus:ring-amber-400/30 focus:ring-offset-0 focus:ring-2 cursor-pointer shrink-0 accent-amber-500"
            />
            <span className="text-[11.5px] text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
              Am citit și sunt de acord cu prelucrarea datelor mele cu caracter personal (nume, număr de telefon) în scopul confirmării sesiunii de test drive, conform{' '}
              <a 
                href="/termeni-si-conditii#date-personale" 
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState(null, '', '/termeni-si-conditii#date-personale');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }} 
                className="text-amber-400 hover:underline font-medium"
              >
                Politicii de Confidențialitate
              </a>.
            </span>
          </label>
        </div>

        {/* Buton Principal Confirmare WhatsApp */}
        <div className="pt-2">
          <button 
            type="submit"
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/30 touch-manipulation active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmă Programarea Test Drive pe WhatsApp</span>
          </button>
          <p className="text-[11px] text-zinc-400 text-center mt-2 leading-relaxed">
            Consilierul {dealer.name} va confirma disponibilitatea mașinii și pregătește autoturismul pentru ora solicitată.
          </p>
        </div>
      </form>
    </div>
  );
};
