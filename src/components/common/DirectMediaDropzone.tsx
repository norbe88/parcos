import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Video, Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { getAdminAuthHeaders } from '../../utils/adminAuth';

export interface DirectMediaDropzoneProps {
  tenantSlug: string;
  mediaType: 'landing' | 'branding';
  acceptedTypes?: string; // ex: "video/mp4,video/webm" sau "image/png,image/webp,image/jpeg"
  maxSizeMb?: number;     // default 60MB pentru video, 10MB pentru imagini
  label: string;
  hint?: string;
  currentValue?: string;
  onUploadSuccess: (publicCdnUrl: string) => void;
  onUploadError?: (errorMsg: string) => void;
  className?: string;
}

export const DirectMediaDropzone: React.FC<DirectMediaDropzoneProps> = ({
  tenantSlug,
  mediaType,
  acceptedTypes = 'image/webp,image/jpeg,image/png,image/avif',
  maxSizeMb = 15,
  label,
  hint,
  currentValue,
  onUploadSuccess,
  onUploadError,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(currentValue || null);

  useEffect(() => {
    setActivePreview(currentValue || null);
  }, [currentValue]);

  const isVideo = acceptedTypes.includes('video');

  const handleFileProcess = async (file: File) => {
    setError(null);
    setSuccess(false);

    // 1. Validare dimensiune fișier
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > maxSizeMb) {
      const msg = `⚠️ Fișierul selectat (${fileSizeMb.toFixed(1)} MB) depășește limita maximă admisă de ${maxSizeMb} MB.`;
      setError(msg);
      onUploadError?.(msg);
      return;
    }

    setIsUploading(true);
    setProgress(5);
    setStatusMessage('Se generează token-ul securizat Cloudflare R2...');

    try {
      const authHeaders = getAdminAuthHeaders();

      // 2. Cere URL semnat de la backend
      const presignRes = await fetch('/api/media/presign-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          tenantSlug: tenantSlug || 'rxm',
          mediaType,
          files: [
            {
              filename: file.name,
              contentType: file.type || (isVideo ? 'video/mp4' : 'image/webp'),
            },
          ],
        }),
      });

      if (!presignRes.ok) {
        throw new Error(`Eroare server la obținerea permisiunii de upload (HTTP ${presignRes.status})`);
      }

      const presignData = await presignRes.json();

      // Tratare fallback pe VPS dacă R2 este oprit sau indisponibil
      if (!presignData.success && presignData.fallbackToVps) {
        setStatusMessage('Cloudflare R2 indisponibil. Se folosește salvarea pe server...');
        // Fallback transparent pe vechiul endpoint
        const formData = new FormData();
        formData.append('file', file);
        const vpsRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'x-car-id': `landing_${tenantSlug}`,
            ...authHeaders,
          },
          body: file,
        });

        if (vpsRes.ok) {
          const vpsData = await vpsRes.json();
          if (vpsData.url) {
            setProgress(100);
            setSuccess(true);
            setActivePreview(vpsData.url);
            onUploadSuccess(vpsData.url);
            return;
          }
        }
        throw new Error('Fallback-ul pe server a eșuat');
      }

      if (!presignData.success || !Array.isArray(presignData.results) || presignData.results.length === 0) {
        throw new Error(presignData.error || 'Nu s-a putut genera URL-ul de transfer Cloudflare R2');
      }

      const { uploadUrl, publicUrl } = presignData.results[0];

      // 3. Upload direct PUT din browser către Cloudflare R2 cu XHR Progress
      setStatusMessage('Se transmite direct către Cloudflare R2...');
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || (isVideo ? 'video/mp4' : 'image/webp'));
        xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000, immutable');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90) + 5; // 5% - 95%
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload-ul R2 a eșuat cu codul ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Eroare de rețea în timpul transferului către Cloudflare R2'));
        xhr.send(file);
      });

      // 4. Finalizare cu succes
      setProgress(100);
      setSuccess(true);
      setActivePreview(publicUrl);
      setStatusMessage('Încărcare finalizată cu succes!');
      onUploadSuccess(publicUrl);
    } catch (err: any) {
      console.error('[DirectMediaDropzone] Eroare upload:', err);
      const errMsg = err.message || 'A apărut o problemă la încărcarea fișierului.';
      setError(errMsg);
      onUploadError?.(errMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          {isVideo ? <Video className="w-3.5 h-3.5 text-amber-400" /> : <ImageIcon className="w-3.5 h-3.5 text-amber-400" />}
          <span>{label}</span>
        </label>
        {activePreview && (
          <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[200px]" title={activePreview}>
            {activePreview.startsWith('http') ? 'CDN R2 Activ' : 'Local / Static'}
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative p-4 rounded-xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
          isDragging
            ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30'
            : isUploading
            ? 'bg-[#18181c] border-amber-500/40 cursor-wait'
            : success
            ? 'bg-emerald-500/5 border-emerald-500/40 hover:border-emerald-500/60'
            : 'bg-[#151518] border-white/10 hover:border-amber-400/50 hover:bg-[#1a1a1f]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="w-full max-w-xs space-y-2.5 py-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-300 font-medium flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {statusMessage || 'Se încarcă...'}
              </span>
              <span className="font-mono font-bold text-white">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : success ? (
          <div className="flex items-center gap-2 py-1 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Fișier încărcat direct în Cloudflare R2! Click pentru a înlocui.</span>
          </div>
        ) : (
          <div className="space-y-1 py-1">
            <div className="flex items-center justify-center gap-2 text-zinc-300 group-hover:text-amber-400 transition-colors">
              <UploadCloud className="w-5 h-5" />
              <span className="text-xs font-bold">
                Trage fișierul aici sau <span className="underline decoration-amber-400/50">răsfoiește</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {hint || (isVideo ? `Format MP4 sau WebM (Max ${maxSizeMb}MB) • 0$ Egress` : `Format WebP, PNG sau JPG (Max ${maxSizeMb}MB)`)}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setError(null); }}
            className="text-red-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
