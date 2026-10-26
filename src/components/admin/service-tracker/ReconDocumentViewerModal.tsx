import React, { useState, useEffect } from 'react';
import { 
  Receipt, ZoomIn, ZoomOut, RotateCw, X, Download, Eye, Sparkles 
} from 'lucide-react';

export interface PreviewDocumentData {
  url: string;
  title: string;
  type: string;
  sizeKb: number;
  compressionRatio?: number;
}

interface ReconDocumentViewerModalProps {
  doc: PreviewDocumentData | null;
  onClose: () => void;
}

export const ReconDocumentViewerModal: React.FC<ReconDocumentViewerModalProps> = ({
  doc,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  // Resetare transformări la schimbarea documentului
  useEffect(() => {
    if (doc) {
      setZoomLevel(1);
      setRotation(0);
      setIsHighContrast(false);
    }
  }, [doc]);

  // Ascultare tasta ESC pentru închidere rapidă
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!doc) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 🧭 Antet Viewer */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
            <Receipt className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold truncate">{doc.title}</h4>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
              <span className="font-medium text-cyan-300">{doc.type}</span>
              <span>•</span>
              <span>{doc.sizeKb} KB</span>
              {typeof doc.compressionRatio === 'number' && doc.compressionRatio > 0 && (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  (Claritate 100% • -{doc.compressionRatio}% optimizat)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 🛠️ Comenzi Viewer & Manipulare Optică */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 4))}
            title="Mărește (Zoom in până la 400%)"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
            title="Micșorează (Zoom out)"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setRotation(prev => (prev + 90) % 360)}
            title="Rotește 90° (pentru CIV / taloane orientate greșit)"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsHighContrast(prev => !prev)}
            title="Comută Mod Contrast Înalt (Pentru bonuri șterse și text slab)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isHighContrast 
                ? 'bg-amber-500 text-black shadow-sm' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            Contrast +
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Descarcă originalul de înaltă rezoluție"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors hidden sm:flex items-center"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 ml-1 transition-colors"
            title="Închide fereastra (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🖼️ Canvas Imagine cu Zoom, Rotație și Filtru de Lizibilitate */}
      <div 
        className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto p-4 my-2 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            transition: 'transform 0.15s ease-out'
          }}
          className="max-h-[75vh] flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <img
            src={doc.url}
            alt={doc.title}
            className={`rounded-lg shadow-2xl object-contain max-h-[70vh] border border-zinc-700 transition-all ${
              isHighContrast ? 'contrast-150 brightness-110 grayscale' : ''
            }`}
          />
        </div>
      </div>

      {/* ℹ️ Subsol Telemetrie */}
      <div className="text-zinc-400 text-xs flex items-center gap-4 bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800">
        <span>Zoom: <strong>{Math.round(zoomLevel * 100)}%</strong></span>
        <span>•</span>
        <span>Rotație: <strong>{rotation}°</strong></span>
        <span>•</span>
        <span className="hidden sm:inline">Apasă ESC sau click în fundal pentru a reveni.</span>
      </div>
    </div>
  );
};
