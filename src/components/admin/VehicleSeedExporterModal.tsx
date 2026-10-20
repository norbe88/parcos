import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Download, FileCode, FolderArchive, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { VehicleItem } from '../../db/types';
import { getMediaBlob } from '../../utils/mediaVaultDb';

interface VehicleSeedExporterModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const VehicleSeedExporterModal: React.FC<VehicleSeedExporterModalProps> = ({
  isOpen,
  car,
  onClose,
  showToast
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Nume folder canonic pe disk: public/cars/{folderName}/
  const folderName = useMemo(() => {
    if (!car) return 'car_export';
    const cleanBrand = (car.brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanModel = (car.model || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanStock = (car.stockNumber || car.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `RXM_${cleanBrand}_${cleanModel}_${cleanStock}`;
  }, [car]);

  // Generare cod TypeScript pregătit pentru SEED_VEHICLES în src/db/vehicles.ts
  const generatedTsCode = useMemo(() => {
    if (!car) return '';

    const imageCount = (car.images || []).length;
    const canonicalImagePaths = Array.from({ length: Math.max(1, imageCount) }, (_, i) => {
      const idxStr = String(i + 1).padStart(2, '0');
      return `      "/cars/${folderName}/image_${idxStr}.webp?v=clean_v3"`;
    }).join(',\n');

    const cleanDesc = (car.description || `${car.brand} ${car.model} în stare remarcabilă. Garanție inclusă.`)
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ');

    return `  {
    id: "${car.id}",
    stockNumber: "${car.stockNumber || 'RXM-5000'}",
    brand: "${car.brand}",
    model: "${car.model}",
    versionTrim: "${car.versionTrim || car.model}",
    year: ${car.year || 2020},
    mileageKm: ${car.mileageKm || 150000},
    priceEur: ${car.priceEur || 10000},
    vatDeductible: ${Boolean(car.vatDeductible)},
    fuelType: "${car.fuelType || 'Diesel'}",
    transmission: "${car.transmission || 'Automată'}",
    powerHp: ${car.powerHp || 150},
    engineCc: ${car.engineCc || 1995},
    bodyType: "${car.bodyType || 'SUV'}",
    drivetrain: "${car.drivetrain || 'Față'}",
    color: "${car.color || 'Gri Metalizat'}",
    vin: "${car.vin || 'RO48482214RXM9999'}",
    warrantyMonths: ${car.warrantyMonths || 12},
    status: "${car.status || 'in_stock'}",
    images: [
${canonicalImagePaths}
    ],
    features: {
      safety: ${JSON.stringify(car.features?.safety || ["Front Assist", "Pilot automat", "Faruri LED", "ISOFIX"])},
      comfort: ${JSON.stringify(car.features?.comfort || ["Dublu Climatronic", "Scaune încălzite", "Volan piele"])},
      multimedia: ${JSON.stringify(car.features?.multimedia || ["Navigație 3D", "Bluetooth", "Apple CarPlay"])}
    },
    description: "${cleanDesc}"
  },`;
  }, [car, folderName]);

  if (!isOpen || !car) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedTsCode);
      setCopied(true);
      showToast?.('✓ Codul TypeScript a fost copiat în clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast?.('⚠️ Nu s-a putut copia automat. Selectați codul manual.');
    }
  };

  const handleDownloadImages = async () => {
    if (!car.images || car.images.length === 0) {
      showToast?.('⚠️ Această mașină nu are fotografii de descărcat.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      for (let i = 0; i < car.images.length; i++) {
        const imgKey = car.images[i];
        const idxStr = String(i + 1).padStart(2, '0');
        const filename = `image_${idxStr}.webp`;

        let blobToDownload: Blob | null = null;

        if (imgKey.startsWith('rxm-media://')) {
          blobToDownload = await getMediaBlob(imgKey);
        } else {
          // Descărcare din cale statică existentă
          const res = await fetch(imgKey);
          blobToDownload = await res.blob();
        }

        if (blobToDownload) {
          const downloadUrl = URL.createObjectURL(blobToDownload);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        }

        setDownloadProgress(Math.round(((i + 1) / car.images.length) * 100));
        // Pauză mică pentru a permite browserului să declanșeze descărcarea fără popup blocker
        await new Promise(r => setTimeout(r, 180));
      }

      showToast?.(`✓ S-au descărcat ${car.images.length} fotografii WebP pentru folderul ${folderName}!`);
    } catch (err) {
      console.error('Eroare la descărcarea fotografiilor:', err);
      showToast?.('⚠️ A apărut o problemă la descărcarea unor imagini.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#121215] border border-white/[0.12] text-white w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-4 sm:p-6 relative space-y-4">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Export Permanent pentru Producție & Git Deploy</span>
              </h2>
              <p className="text-xs text-zinc-400">
                {car.brand} {car.model} ({car.year}) • {car.images?.length || 0} fotografii WebP
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ghid Rapid în 3 Pași */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Cum faci mașina permanentă și imună la orice deploy:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-zinc-300 font-mono text-[11px]">
            <li>Apasă <strong className="text-white">„Descarcă Imaginile WebP”</strong> și pune fișierele în folderul <span className="text-amber-400 bg-black/40 px-1 py-0.5 rounded">public/cars/{folderName}/</span></li>
            <li>Apasă <strong className="text-white">„Copiază Codul TypeScript”</strong> și lipește blocul în <span className="text-amber-400 bg-black/40 px-1 py-0.5 rounded">src/db/vehicles.ts</span></li>
            <li>Rulează comanda <strong className="text-emerald-400">git commit & push</strong> (/cp). Mașina va fi vizibilă pentru toți clienții fără pierderi de date!</li>
          </ol>
        </div>

        {/* Butoane Acțiuni Rapide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadImages}
            disabled={isDownloading || !car.images?.length}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/15 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>
              {isDownloading 
                ? `Descărcare imagini... ${downloadProgress}%` 
                : `Descarcă ${car.images?.length || 0} Fotografii WebP`}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copiat în Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiază Codul TypeScript</span>
              </>
            )}
          </button>
        </div>

        {/* Zona Vizualizare Cod TypeScript Generat */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-mono">
            <span>Fragment TypeScript pentru src/db/vehicles.ts:</span>
            <span>Target: public/cars/{folderName}/</span>
          </div>
          <div className="relative">
            <pre className="p-3.5 rounded-xl bg-[#09090b] border border-white/10 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[260px] scrollbar-thin select-all">
              {generatedTsCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
};
