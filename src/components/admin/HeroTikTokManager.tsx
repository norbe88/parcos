import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Star, Play, ArrowUp, ArrowDown, ExternalLink, 
  Search, Check, Film, Eye, Edit3, X, Save 
} from 'lucide-react';
import { VehicleItem } from '../../db/seed';
import { getStockNumber, parseTikTokUrl, isTikTokVideoUrl } from '../../utils/helpers';

interface HeroTikTokManagerProps {
  cars: VehicleItem[];
  onTogglePinHero: (carId: string) => void;
  onMovePinnedOrder: (carId: string, direction: 'up' | 'down') => void;
  onUpdateTikTokInfo: (carId: string, tiktokUrl: string, tiktokViews?: string) => void;
  showToast: (msg: string) => void;
}

export const HeroTikTokManager: React.FC<HeroTikTokManagerProps> = ({
  cars,
  onTogglePinHero,
  onMovePinnedOrder,
  onUpdateTikTokInfo,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editViews, setEditViews] = useState('');

  // Separare mașini fixate și dinamice
  const pinnedCars = useMemo(() => {
    return cars
      .filter(c => c.isHeroPinned)
      .sort((a, b) => (a.heroOrder || 999) - (b.heroOrder || 999));
  }, [cars]);

  const dynamicCars = useMemo(() => {
    return cars
      .filter(c => !c.isHeroPinned)
      .sort((a, b) => {
        // Prioritizează cele cu TikTok URL valid, apoi anul cel mai nou
        const hasTtA = isTikTokVideoUrl(a.tiktokUrl) ? 1 : 0;
        const hasTtB = isTikTokVideoUrl(b.tiktokUrl) ? 1 : 0;
        if (hasTtA !== hasTtB) return hasTtB - hasTtA;
        return b.year - a.year;
      });
  }, [cars]);

  // Filtrare căutare
  const filteredCars = useMemo(() => {
    if (!searchTerm.trim()) return cars;
    const term = searchTerm.toLowerCase();
    return cars.filter(c => 
      c.brand.toLowerCase().includes(term) ||
      c.model.toLowerCase().includes(term) ||
      getStockNumber(c).toLowerCase().includes(term)
    );
  }, [cars, searchTerm]);

  const handleStartEdit = (car: VehicleItem) => {
    setEditingCarId(car.id);
    setEditUrl(car.tiktokUrl || '');
    setEditViews(car.tiktokViews || '');
  };

  const handleSaveEdit = (carId: string) => {
    onUpdateTikTokInfo(carId, editUrl, editViews);
    setEditingCarId(null);
    showToast('✅ Link-ul și statisticile TikTok au fost actualizate!');
  };

  return (
    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      
      {/* Antet Secțiune Manager */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> RXM-TIK-01 • Panou Control Hero Spotlight
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-[#fe2c55]" />
            Gestiune Recomandări Video & Ordine TikTok Hero
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Fixează mașinile dorite în caruselul principal din Hero (`Pin to Top`) în ordinea preferată. Clipurile nefixate se afișează dinamic (cele mai noi primele).
          </p>
        </div>

        {/* Căutare rapidă */}
        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Caută model sau #Ref..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 touch-manipulation"
          />
        </div>
      </div>

      {/* KPI-uri Rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-amber-300 font-medium">Fixate în Hero (Pinned)</div>
            <div className="text-2xl font-black text-amber-400 font-mono">{pinnedCars.length}</div>
          </div>
          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Clipuri TikTok Înrolate</div>
            <div className="text-2xl font-black text-white font-mono">
              {cars.filter(c => isTikTokVideoUrl(c.tiktokUrl)).length}
            </div>
          </div>
          <Play className="w-6 h-6 text-[#fe2c55] fill-[#fe2c55]" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Dinamice în Rotație</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{dynamicCars.length}</div>
          </div>
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* SECȚIUNEA 1: Mașini Fixate În Top (Hero Pinned) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Vehicule Fixate Manual în Hero ({pinnedCars.length})</span>
          </h3>
          <span className="text-[11px] text-zinc-400">
            Apar primele în caruselul Hero Spotlight în ordinea indicată
          </span>
        </div>

        {pinnedCars.length === 0 ? (
          <div className="p-6 rounded-xl bg-black/30 border border-dashed border-white/10 text-center text-xs text-zinc-400">
            Niciun vehicul nu este fixat momentan. Apasă pe butonul <strong className="text-amber-300">★ Fixează în Hero</strong> de pe orice mașină de mai jos.
          </div>
        ) : (
          <div className="space-y-2">
            {pinnedCars.map((car, idx) => {
              const stockRef = getStockNumber(car);
              const ttParsed = parseTikTokUrl(car.tiktokUrl);

              return (
                <div 
                  key={car.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/30 hover:border-amber-500/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-amber-500 text-black font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <img 
                      src={car.images[0]} 
                      alt={car.model} 
                      className="w-14 h-10 rounded-lg object-cover bg-zinc-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs truncate">
                          {car.brand} {car.model}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 bg-black/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                          #{stockRef}
                        </span>
                        {car.tiktokViews && (
                          <span className="text-[10px] font-mono text-[#fe2c55] bg-[#fe2c55]/10 px-1.5 py-0.2 rounded border border-[#fe2c55]/30">
                            {car.tiktokViews} vizualizări
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {car.priceEur.toLocaleString('ro-RO')} € • {car.year} • {car.powerHp} CP
                      </div>
                    </div>
                  </div>

                  {/* Acțiuni Ordine & Debifare */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => onMovePinnedOrder(car.id, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-20 transition-colors"
                      title="Mută mai sus în ordinea Hero"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => onMovePinnedOrder(car.id, 'down')}
                      disabled={idx === pinnedCars.length - 1}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-20 transition-colors"
                      title="Mută mai jos în ordinea Hero"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit TikTok */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(car)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 transition-colors"
                      title="Editează Link TikTok"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Test link */}
                    {car.tiktokUrl && (
                      <a
                        href={car.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-black/40 hover:bg-[#fe2c55]/20 text-zinc-300 hover:text-white transition-colors"
                        title="Deschide în TikTok"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Unpin Button */}
                    <button
                      type="button"
                      onClick={() => onTogglePinHero(car.id)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>Anulează Fixarea</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECȚIUNEA 2: Toate Mașinile Din Stoc (Opțiuni Pin to Top & Configurare TikTok) */}
      <div className="pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-[#fe2c55] fill-[#fe2c55]" />
            <span>Catalog Integral Stoc Dealer ({filteredCars.length})</span>
          </h3>
          <span className="text-[11px] text-zinc-400">
            Apasă pe stea pentru a include oricare mașină în Hero Spotlight
          </span>
        </div>

        <div className="overflow-x-auto touch-manipulation scrollbar-thin">
          <table className="w-full text-left text-xs text-zinc-300 min-w-[680px]">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Cod Stoc</th>
                <th className="py-2.5 px-3">Vehicul</th>
                <th className="py-2.5 px-3">Preț</th>
                <th className="py-2.5 px-3">Prezentare TikTok</th>
                <th className="py-2.5 px-3">Status Hero</th>
                <th className="py-2.5 px-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredCars.map(car => {
                const stockRef = getStockNumber(car);
                const isEditing = editingCarId === car.id;

                return (
                  <tr key={car.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-300 text-xs whitespace-nowrap">
                      #{stockRef}
                    </td>

                    <td className="py-3 px-3 flex items-center gap-2.5">
                      <img 
                        src={car.images[0]} 
                        alt={car.model} 
                        className="w-10 h-7 rounded-md object-cover bg-zinc-800"
                      />
                      <div>
                        <div className="font-bold text-white text-xs">{car.brand} {car.model}</div>
                        <div className="text-[10px] text-zinc-400">{car.year} • {car.powerHp} CP</div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                      {car.priceEur.toLocaleString('ro-RO')} €
                    </td>

                    <td className="py-3 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2 min-w-[280px]">
                          <input
                            type="text"
                            placeholder="URL Video TikTok..."
                            value={editUrl}
                            onChange={e => setEditUrl(e.target.value)}
                            className="bg-[#18181b] border border-white/20 rounded px-2 py-1 text-[11px] text-white flex-1 outline-none focus:border-amber-400"
                          />
                          <input
                            type="text"
                            placeholder="Vizualizări (ex: 34.2K)"
                            value={editViews}
                            onChange={e => setEditViews(e.target.value)}
                            className="bg-[#18181b] border border-white/20 rounded px-2 py-1 text-[11px] text-white w-24 outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(car.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Salvează"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCarId(null)}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white"
                            title="Anulează"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : isTikTokVideoUrl(car.tiktokUrl) ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <Play className="w-3 h-3 fill-emerald-400" />
                            <span>Clip Asociat</span>
                          </span>
                          {car.tiktokViews && (
                            <span className="text-[10px] font-mono text-[#fe2c55] bg-[#fe2c55]/10 px-1.5 py-0.2 rounded border border-[#fe2c55]/30">
                              {car.tiktokViews}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(car)}
                            className="text-[10px] text-zinc-400 hover:text-amber-300 underline ml-1"
                          >
                            Editează
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(car)}
                          className="text-[10px] text-zinc-400 hover:text-amber-300 flex items-center gap-1 py-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Adaugă link TikTok</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {car.isHeroPinned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-300" />
                          <span>Fixat (#{car.heroOrder || 1})</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">
                          Rotativ Dinamic
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onTogglePinHero(car.id)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 touch-manipulation active:scale-95 ${
                          car.isHeroPinned
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/5 hover:bg-white/15 text-white border border-white/10'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${car.isHeroPinned ? 'fill-amber-300 text-amber-300' : 'text-zinc-400'}`} />
                        <span>{car.isHeroPinned ? 'Hero Pinned ✓' : 'Hero Reel ★'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
