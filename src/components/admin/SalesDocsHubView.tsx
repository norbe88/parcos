import React, { useState } from 'react';
import { 
  FileText, ScanLine, Car, CheckCircle2, ShieldCheck, 
  Printer, ArrowRight, UserCheck, Sparkles, Building2, Landmark, 
  FileCheck, Shield, ChevronRight, Search
} from 'lucide-react';
import { VehicleItem, DealerProfile, SEED_DEALER } from '../../db/seed';
import { ClientIdOcrScanner } from '../modals/ClientIdOcrScanner';
import { ParsedClientIdDocument } from '../../utils/clientIdOcrEngine';
import { getStockNumber } from '../../utils/helpers';

interface SalesDocsHubViewProps {
  cars: VehicleItem[];
  dealer?: DealerProfile;
  onOpenSalesDocs: (
    car: VehicleItem, 
    initialTab?: 'proforma' | 'protocol' | 'warranty' | 'inspection' | 'margin' | 'contract' | 'gdpr',
    initialBuyer?: any
  ) => void;
  showToast: (msg: string) => void;
}

export const SalesDocsHubView: React.FC<SalesDocsHubViewProps> = ({
  cars,
  dealer = SEED_DEALER,
  onOpenSalesDocs,
  showToast
}) => {
  const [selectedCarId, setSelectedCarId] = useState<string>(cars.find(c => c.status === 'in_stock')?.id || cars[0]?.id || '');
  const [scannedBuyer, setScannedBuyer] = useState<ParsedClientIdDocument | null>(null);
  const [searchCarQuery, setSearchCarQuery] = useState('');

  const selectedCar = cars.find(c => c.id === selectedCarId) || cars[0];

  const inStockCars = cars.filter(c => {
    if (searchCarQuery.trim()) {
      const q = searchCarQuery.toLowerCase();
      const sn = getStockNumber(c).toLowerCase();
      return (
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.vin.toLowerCase().includes(q) ||
        sn.includes(q)
      );
    }
    return c.status === 'in_stock' || c.status === 'reserved';
  });

  const handleIdScanSuccess = (data: ParsedClientIdDocument) => {
    setScannedBuyer(data);
    showToast(`✓ Date buletin extrase cu succes pentru: ${data.fullName} (CNP: ${data.cnp})`);
  };

  const handleOpenDoc = (tab: 'proforma' | 'protocol' | 'warranty' | 'inspection' | 'margin' | 'contract' | 'gdpr') => {
    if (!selectedCar) {
      showToast('⚠️ Vă rugăm să selectați un autovehicul din listă.');
      return;
    }

    const buyerData = scannedBuyer ? {
      buyerName: scannedBuyer.fullName,
      buyerCnp: scannedBuyer.cnp,
      buyerAddress: scannedBuyer.address || `${scannedBuyer.city || ''}, Jud. ${scannedBuyer.county || ''}`,
      buyerIdSeries: scannedBuyer.idSeries,
      buyerIdNumber: scannedBuyer.idNumber,
      buyerIssuedBy: scannedBuyer.issuingAuthority || 'SPCLEP'
    } : undefined;

    onOpenSalesDocs(selectedCar, tab, buyerData);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Antet Secțiune */}
      <div className="pb-6 border-b border-white/[0.08]">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <FileText className="w-3.5 h-3.5" /> Centru Acte Oficiale & 1-Click Scanner Buletin
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Centru Acte Vânzare & Conformitate
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Generează contracte DITL, proforme garanție rezervare, procese verbale și certificate de garanție gata de printat conform legislației ANAF și regimului Marjă Art. 312.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* PASUL 1: SCANNER BULETIN OCR CLIENT                                      */}
      {/* ========================================================================= */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Pasul 1: Scanner Buletin Cumpărător (Scanare Automată)</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                  GDPR Compliant &bull; RAM Only
                </span>
              </div>
              <p className="text-xs text-zinc-400">Încarcă fotografia sau scanează buletinul cumpărătorului pentru autocompletare instantanee în toate cele 7 documente.</p>
            </div>
          </div>
        </div>

        {/* Componenta Scanner */}
        <ClientIdOcrScanner 
          onSuccess={handleIdScanSuccess}
          showToast={showToast}
        />

        {/* Date cumpărător scanate */}
        {scannedBuyer && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Date Cumpărător Active:
              </div>
              <div className="text-white font-bold text-sm">
                {scannedBuyer.fullName} &bull; <span className="font-mono text-zinc-300">CNP: {scannedBuyer.cnp}</span>
              </div>
              <div className="text-zinc-400 text-[11px]">
                CI Seria {scannedBuyer.idSeries} Nr {scannedBuyer.idNumber} emis de {scannedBuyer.issuingAuthority || 'SPCLEP'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScannedBuyer(null)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-medium transition-all self-start sm:self-auto cursor-pointer"
            >
              Curăță Datele
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PASUL 2: SELECTARE VEHICUL DIN STOC & GENERATOR ACTE                     */}
      {/* ========================================================================= */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Pasul 2: Selectează Autovehiculul din Stoc</h2>
              <p className="text-xs text-zinc-400">Alege mașina pentru care dorești tipărirea sau descărcarea dosarului complet de vânzare.</p>
            </div>
          </div>

          {/* Căutare rapidă vehicul */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchCarQuery}
              onChange={(e) => setSearchCarQuery(e.target.value)}
              placeholder="Caută model sau serie șasiu..."
              className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Selector Vehicule (Scroll Orizontal / Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
          {inStockCars.map(c => {
            const isSelected = selectedCar?.id === c.id;
            const sn = getStockNumber(c);

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCarId(c.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/06 hover:bg-white/[0.06] text-zinc-400 hover:text-white'
                }`}
              >
                <img 
                  src={c.images[0]} 
                  alt={c.model} 
                  className="w-12 h-9 rounded-lg object-cover bg-zinc-800 border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{c.brand} {c.model}</span>
                    <span className="text-[9.5px] font-mono text-amber-300">#{sn}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {c.priceEur.toLocaleString('ro-RO')} € &bull; {c.year} &bull; VIN: {c.vin.slice(-6)}
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Carduri Generare 7 Documente Oficiale */}
        {selectedCar && (
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Generează 1-Click pentru {selectedCar.brand} {selectedCar.model} (#{getStockNumber(selectedCar)}):
              </span>
              <span className="text-xs text-amber-400 font-bold font-mono">
                Preț: {selectedCar.priceEur.toLocaleString('ro-RO')} €
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  tab: 'contract' as const,
                  title: 'Contract Vânzare DITL',
                  desc: 'Modelul oficial tipizat ITL-054 conform Art. 312 / TVA 21%',
                  badge: 'Oficial DITL'
                },
                {
                  tab: 'proforma' as const,
                  title: 'Factură Proformă Garanție',
                  desc: 'Rezervare și virament în Contul de Garanție (Banca Transilvania)',
                  badge: 'Cont Garanție'
                },
                {
                  tab: 'protocol' as const,
                  title: 'Proces Verbal Predare',
                  desc: 'Predare-primire vehicul, număr chei și kilometraj certificat',
                  badge: 'Predare Showroom'
                },
                {
                  tab: 'warranty' as const,
                  title: 'Certificat de Garanție',
                  desc: 'Garanție comercială conformă de până la 36 luni',
                  badge: 'Garanție 36 Luni'
                },
                {
                  tab: 'inspection' as const,
                  title: 'Fișă Inspecție Tehnică',
                  desc: 'Verificare multipunct în service partener la livrare',
                  badge: 'Inspecție RAR'
                },
                {
                  tab: 'margin' as const,
                  title: 'Notă Calcul Marjă Art. 312',
                  desc: 'Calcul profit net & evidență contabilă regim special',
                  badge: 'Art. 312 Fiscal'
                },
                {
                  tab: 'gdpr' as const,
                  title: 'Acord Prelucrare Date GDPR',
                  desc: 'Consimțământ conform Regulament (UE) 2016/679 & Legea 190/2018',
                  badge: 'GDPR Oficial'
                }
              ].map(doc => (
                <button
                  key={doc.tab}
                  type="button"
                  onClick={() => handleOpenDoc(doc.tab)}
                  className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-amber-500/40 text-left transition-all group cursor-pointer flex flex-col justify-between min-h-[110px]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">
                        {doc.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/25 text-amber-300">
                        {doc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {doc.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:underline mt-2">
                    <Printer className="w-3.5 h-3.5" />
                    <span>Deschide & Tipărește Documentul</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
