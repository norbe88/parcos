import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, MessageCircle, FileText, ChevronDown, Edit3, Save } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../../db/seed';
import { getWhatsAppVinRequestUrl, formatMileage } from '../../../utils/helpers';
import { isInvalidCorruptedFeature } from '../../../utils/featuresCatalogService';

interface DetailSpecsTabProps {
  car: VehicleItem;
  viewMode?: 'showroom' | 'admin';
  onUpdateDescription?: (carId: string, description: string) => void;
}

export const DetailSpecsTab: React.FC<DetailSpecsTabProps> = ({ 
  car, 
  viewMode = 'showroom', 
  onUpdateDescription 
}) => {
  const [showFullSheet, setShowFullSheet] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(car.description || '');
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  useEffect(() => {
    setDescInput(car.description || '');
    setIsEditingDesc(false);
  }, [car.id, car.description]);

  const cleanSafety = (car.features?.safety || []).filter(f => !isInvalidCorruptedFeature(f));
  const cleanComfort = (car.features?.comfort || []).filter(f => !isInvalidCorruptedFeature(f));
  const cleanMultimedia = (car.features?.multimedia || []).filter(f => !isInvalidCorruptedFeature(f));
  const totalFeatures = cleanSafety.length + cleanComfort.length + cleanMultimedia.length;

  return (
    <div className="space-y-4">
      {/* 4 Căsuțe Specificații Tehnice Cheie */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.02] p-3.5 rounded-xl border border-white/06">
        <div>
          <span className="text-zinc-400 block text-[11px]">Kilometraj Real Factură:</span>
          <strong className="text-white font-mono text-sm">{formatMileage(car.mileageKm)}</strong>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">Motorizare / Putere:</span>
          <strong className="text-white text-sm">{car.powerHp} CP ({car.engineCc} cmc)</strong>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">Transmisie & Cutie:</span>
          <strong className="text-white text-sm">{car.transmission}</strong>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">Sistem Tracțiune:</span>
          <strong className="text-white text-sm">{car.drivetrain}</strong>
        </div>
      </div>

      {/* 🛡️ Card Identificare Șasiu (VIN Privacy-First: Exclusiv la Cerere pe WhatsApp) */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Serie Șasiu (VIN) & Raport Tehnic:
            </span>
            <span className="text-[10px] text-amber-400/90 font-mono">Disponibilă la cerere</span>
          </div>
          <p className="text-[11.5px] text-zinc-300 leading-relaxed">
            Pentru siguranța tranzacțiilor și prevenirea copierii anunțurilor, seria completă de șasiu și raportul de verificare se eliberează instant la cerere pe WhatsApp.
          </p>
        </div>
        <a
          href={getWhatsAppVinRequestUrl(car, SEED_DEALER.whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs transition-all touch-manipulation active:scale-95 shadow-sm flex-shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Solicită Seria VIN pe WhatsApp</span>
        </a>
      </div>

      {/* Dotări & Echipamente Cheie */}
      <div>
        <div className="font-semibold text-white mb-2 flex items-center justify-between text-xs">
          <span>Dotări & Echipamente Principale:</span>
          <span className="text-[11px] text-zinc-400">
            {totalFeatures} opționale validate
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {cleanSafety.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
          {cleanComfort.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
          {cleanMultimedia.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 📄 Fișă Tehnică & Echipare Completă din Fabrică (Acordeon Expandabil) */}
      {car.equipmentSheetText && (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
          <button
            type="button"
            onClick={() => setShowFullSheet(!showFullSheet)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Fișă Tehnică & Toate Dotările din Fabrică</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showFullSheet ? 'rotate-180 text-amber-400' : ''}`} />
          </button>
          {showFullSheet && (
            <div className="px-3.5 pb-3.5 pt-2 border-t border-white/06 text-[11px] font-mono text-zinc-300 whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto">
              {car.equipmentSheetText}
            </div>
          )}
        </div>
      )}

      {/* Descriere Editorială Showroom & Editare Admin */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/06 text-zinc-300 leading-relaxed text-xs">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/06">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Descriere Editorială Showroom
          </span>
          {viewMode === 'admin' && onUpdateDescription && !isEditingDesc && (
            <button
              type="button"
              onClick={() => {
                setDescInput(car.description || '');
                setIsEditingDesc(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all cursor-pointer touch-manipulation active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Editează Descrierea</span>
            </button>
          )}
        </div>

        {isEditingDesc ? (
          <div className="space-y-2.5 mt-2">
            <textarea
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              rows={7}
              className="w-full p-3 rounded-xl bg-black/70 border border-amber-500/40 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-sans shadow-inner resize-y"
              placeholder="Introduceți descrierea editorială a mașinii..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDescInput(car.description || '');
                  setIsEditingDesc(false);
                }}
                disabled={isSavingDesc}
                className="px-3 py-1.5 rounded-lg bg-white/05 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!onUpdateDescription) return;
                  setIsSavingDesc(true);
                  try {
                    await onUpdateDescription(car.id, descInput);
                    setIsEditingDesc(false);
                  } finally {
                    setIsSavingDesc(false);
                  }
                }}
                disabled={isSavingDesc}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95 touch-manipulation"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDesc ? 'Se salvează...' : 'Salvează Descrierea'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-line text-zinc-300">
            {car.description || <span className="text-zinc-500 italic">Nicio descriere adăugată pentru acest vehicul.</span>}
          </div>
        )}
      </div>

      {/* Clauză Legală Drepturi de Autor & Protecție Recoltare Date (Legea nr. 8/1996) - Poziționată la baza modalului (VehicleDetailModal.tsx) sub fluxul de lead */}
    </div>
  );
};
