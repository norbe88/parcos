import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Facebook, Instagram, Copy, Check, Download, ExternalLink, 
  Sparkles, Smartphone, CheckCircle2, AlertTriangle, Layers, 
  Settings, ShieldCheck, RefreshCw, Send, Image as ImageIcon,
  ChevronLeft, ChevronRight, Hash, MessageCircle, FileText, Globe
} from 'lucide-react';
import { VehicleItem, DealerProfile, DealerSocialIntegration } from '../../db/types';
import { SEED_DEALER } from '../../db/dealer';
import { getStockNumber, normalizeCarImageUrl } from '../../utils/helpers';
import { 
  generateFacebookPostCopy, 
  generateInstagramCaption, 
  generateAutovitOlxCopy,
  formatVatPriceSummary,
  getCanonicalCarShareUrl
} from '../../utils/socialCopyGenerator';
import { 
  publishToFacebookPage, 
  publishToInstagramCarousel, 
  validateMetaConfig 
} from '../../utils/metaGraphPublisher';
import { applyWatermarkToBlob } from '../../utils/watermarkEngine';

interface VehicleSocialPostModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  showToast: (msg: string) => void;
  dealer?: DealerProfile;
  onUpdateSocialIntegration?: (integration: DealerSocialIntegration) => void;
}

type ActiveTab = 'facebook' | 'instagram' | 'autovit_olx' | 'media' | 'api_settings';

export const VehicleSocialPostModal: React.FC<VehicleSocialPostModalProps> = ({
  isOpen,
  car,
  onClose,
  showToast,
  dealer = SEED_DEALER,
  onUpdateSocialIntegration
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('facebook');
  const [fbText, setFbText] = useState('');
  const [igCaption, setIgCaption] = useState('');
  const [olxCopy, setOlxCopy] = useState({ title: '', olxText: '', autovitText: '' });
  const [copiedChannel, setCopiedChannel] = useState<'fb' | 'ig' | 'olx' | 'autovit' | 'title' | 'link' | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activePreviewImgIdx, setActivePreviewImgIdx] = useState(0);

  // Stare descărcare lot cu watermark-logo aplicat pe loc
  const [isWatermarkingBatch, setIsWatermarkingBatch] = useState(false);
  const [watermarkProgress, setWatermarkProgress] = useState<{ current: number; total: number } | null>(null);

  // Stare pentru Direct Meta API
  const [isPublishingFb, setIsPublishingFb] = useState(false);
  const [isPublishingIg, setIsPublishingIg] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<{
    fb?: { success: boolean; url?: string; error?: string };
    ig?: { success: boolean; url?: string; error?: string };
  }>({});

  // Setări locale Meta API (salvate în profilul dealerului / localStorage)
  const initialSocial = dealer?.socialIntegration;
  const [metaSettings, setMetaSettings] = useState<DealerSocialIntegration>(
    initialSocial || {
      metaEnabled: false,
      facebookPageId: '61550788350781',
      facebookPageAccessToken: '',
      instagramBusinessAccountId: '',
      autoAddWatermarkPlates: true
    }
  );

  // Sincronizare la deschidere / selectare mașină
  useEffect(() => {
    if (car) {
      const fbData = generateFacebookPostCopy(car, dealer);
      const igData = generateInstagramCaption(car, dealer);
      const olxData = generateAutovitOlxCopy(car, dealer);
      setFbText(fbData.fullCopy);
      setIgCaption(igData.fullCaption);
      setOlxCopy(olxData);
      setSelectedImages(car.images || []);
      setActivePreviewImgIdx(0);
      setPublishFeedback({});
    }
  }, [car, dealer]);

  // Actualizare setări când se schimbă dealerul
  useEffect(() => {
    if (dealer.socialIntegration) {
      setMetaSettings(dealer.socialIntegration);
    }
  }, [dealer.socialIntegration]);

  if (!isOpen || !car) return null;

  const stockRef = getStockNumber(car);
  const shareUrl = getCanonicalCarShareUrl(car.id);
  const metaValidation = validateMetaConfig(metaSettings);

  // 📋 Copiere în clipboard cu dublu fallback
  const handleCopyText = async (channel: 'fb' | 'ig' | 'olx' | 'autovit' | 'title') => {
    let textToCopy = '';
    if (channel === 'fb') textToCopy = fbText;
    else if (channel === 'ig') textToCopy = igCaption;
    else if (channel === 'olx') textToCopy = olxCopy.olxText;
    else if (channel === 'autovit') textToCopy = olxCopy.autovitText;
    else if (channel === 'title') textToCopy = olxCopy.title;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedChannel(channel);
      const messages: Record<string, string> = {
        fb: '✓ Textul pentru Facebook a fost copiat în clipboard!',
        ig: '✓ Caption-ul pentru Instagram a fost copiat în clipboard!',
        olx: '✓ Descrierea pentru OLX a fost copiată în clipboard!',
        autovit: '✓ Descrierea pentru Autovit a fost copiată în clipboard!',
        title: '✓ Titlul optimizat a fost copiat în clipboard!'
      };
      showToast(messages[channel] || '✓ Copiat în clipboard!');
      setTimeout(() => setCopiedChannel(null), 2500);
    } catch {
      showToast('Eroare la copierea în clipboard.');
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedChannel('link');
      showToast('✓ Link-ul direct al mașinii a fost copiat!');
      setTimeout(() => setCopiedChannel(null), 2500);
    } catch {
      showToast('Eroare la copiere.');
    }
  };

  // ⬇️ Descărcare pachet de fotografii HD CU WATERMARK & LOGO FIRMĂ APLICAT PE LOC
  const handleDownloadPhotosWithWatermark = async (platformName: 'Facebook' | 'Instagram' | 'Autovit' | 'OLX' | 'General' = 'General') => {
    if (selectedImages.length === 0) {
      showToast('Selectează cel puțin o fotografie pentru descărcare.');
      return;
    }

    setIsWatermarkingBatch(true);
    setWatermarkProgress({ current: 0, total: selectedImages.length });
    showToast(`🎨 Se aplică watermark-ul & logo-ul oficial pentru ${platformName}...`);

    try {
      const cleanBrand = car.brand.replace(/\s+/g, '_');
      const cleanModel = car.model.replace(/\s+/g, '_');

      for (let i = 0; i < selectedImages.length; i++) {
        const imgSrc = selectedImages[i];
        setWatermarkProgress({ current: i + 1, total: selectedImages.length });

        try {
          const blob = await applyWatermarkToBlob(
            imgSrc,
            {
              color: 'white',
              opacity: 0.92,
              scaleRatio: 0.22,
              dealerName: dealer.name
            },
            'image/jpeg',
            0.92
          );

          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${cleanBrand}_${cleanModel}_${stockRef}_${platformName.toLowerCase()}_foto_${i + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

          if (i < selectedImages.length - 1) {
            await new Promise(r => setTimeout(r, 220));
          }
        } catch (err) {
          console.warn(`Eroare watermark la imaginea ${i + 1}:`, err);
        }
      }

      showToast(`✓ Pachetul de ${selectedImages.length} fotografii cu watermark-logo pentru ${platformName} a fost descărcat!`);
    } catch (err) {
      console.error(err);
      showToast('A apărut o problemă la procesarea fotografiilor.');
    } finally {
      setIsWatermarkingBatch(false);
      setWatermarkProgress(null);
    }
  };

  // ⬇️ Descărcare pachet de fotografii originale
  const handleDownloadAllPhotos = async () => {
    if (selectedImages.length === 0) {
      showToast('Selectează cel puțin o fotografie pentru descărcare.');
      return;
    }

    showToast(`Se inițiază descărcarea a ${selectedImages.length} fotografii originale...`);

    selectedImages.forEach((imgSrc, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = normalizeCarImageUrl(imgSrc);
        const cleanBrand = car.brand.replace(/\s+/g, '_');
        const cleanModel = car.model.replace(/\s+/g, '_');
        link.download = `${cleanBrand}_${cleanModel}_${stockRef}_original_${idx + 1}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });
  };

  // 📲 Partajare Nativă prin Web Share API (Pe telefoane / tablete)
  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      showToast('Dispozitivul curent nu suportă Web Share API. Folosește butoanele de copiere.');
      return;
    }

    try {
      // Încercare de conversie a primelor imagini în fișiere Blob
      const files: File[] = [];
      const imagesToShare = selectedImages.slice(0, 4);

      for (let i = 0; i < imagesToShare.length; i++) {
        try {
          const res = await fetch(imagesToShare[i]);
          const blob = await res.blob();
          const file = new File([blob], `${car.brand}_${car.model}_${i + 1}.jpg`, { type: blob.type || 'image/jpeg' });
          files.push(file);
        } catch {
          // Continuă chiar dacă fetch-ul unei imagini eșuează din cauza CORS
        }
      }

      const activeText = activeTab === 'instagram' ? igCaption : fbText;
      const shareData: ShareData = {
        title: `${car.brand} ${car.model} (${car.year}) • RXM Automobile`,
        text: activeText,
        url: shareUrl
      };

      if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
        shareData.files = files;
      }

      await navigator.share(shareData);
      showToast('✓ Panoul nativ de partajare a fost deschis!');
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        showToast('Partajarea a fost anulată sau a apărut o problemă.');
      }
    }
  };

  // 🚀 Publicare directă pe Facebook Page prin Meta API
  const handlePublishMetaFacebook = async () => {
    if (!metaSettings.facebookPageId || !metaSettings.facebookPageAccessToken) {
      setActiveTab('api_settings');
      showToast('Configurează mai întâi Token-ul și ID-ul paginii Facebook.');
      return;
    }

    setIsPublishingFb(true);
    showToast('🚀 Se trimite postarea către Meta Facebook...');

    const res = await publishToFacebookPage({
      pageId: metaSettings.facebookPageId,
      accessToken: metaSettings.facebookPageAccessToken,
      message: fbText,
      imageUrls: selectedImages
    });

    setIsPublishingFb(false);

    if (res.success) {
      setPublishFeedback(prev => ({ ...prev, fb: { success: true, url: res.postUrl } }));
      showToast('🎉 Postarea a fost publicată cu succes pe Pagina de Facebook!');
    } else {
      setPublishFeedback(prev => ({ ...prev, fb: { success: false, error: res.error } }));
      showToast(`Eroare Facebook: ${res.error || 'Necunoscută'}`);
    }
  };

  // 🚀 Publicare directă Carusel pe Instagram Business prin Meta API
  const handlePublishMetaInstagram = async () => {
    if (!metaSettings.instagramBusinessAccountId || !metaSettings.facebookPageAccessToken) {
      setActiveTab('api_settings');
      showToast('Configurează mai întâi ID-ul de Instagram Business și Token-ul de acces.');
      return;
    }

    setIsPublishingIg(true);
    showToast('🚀 Se creează caruselul pe Instagram...');

    const res = await publishToInstagramCarousel({
      igUserId: metaSettings.instagramBusinessAccountId,
      accessToken: metaSettings.facebookPageAccessToken,
      caption: igCaption,
      imageUrls: selectedImages.slice(0, 10)
    });

    setIsPublishingIg(false);

    if (res.success) {
      setPublishFeedback(prev => ({ ...prev, ig: { success: true, url: res.postUrl } }));
      showToast('🎉 Caruselul a fost publicat cu succes pe Instagram!');
    } else {
      setPublishFeedback(prev => ({ ...prev, ig: { success: false, error: res.error } }));
      showToast(`Eroare Instagram: ${res.error || 'Necunoscută'}`);
    }
  };

  const handleSaveApiSettings = () => {
    if (onUpdateSocialIntegration) {
      onUpdateSocialIntegration(metaSettings);
    }
    showToast('✓ Setările Meta Graph API au fost salvate!');
  };

  const toggleImageSelection = (imgUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imgUrl) ? prev.filter(u => u !== imgUrl) : [...prev, imgUrl]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92dvh] sm:max-h-[94vh] bg-[#121215] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Antet Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-pink-500/10 via-purple-500/05 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-blue-500/20 border border-white/15 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Studio Postare Social Media (Meta)
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Ref: {stockRef}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {car.brand} {car.model} {car.versionTrim || ''} • {car.year} • {car.priceEur.toLocaleString('ro-RO')} € {car.vatDeductible ? '(TVA 21%)' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Buton Web Share pe mobil */}
            <button
              type="button"
              onClick={handleNativeShare}
              title="Partajează Nativ pe Telefon"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Partajează Nativ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bară Navigare Tab-uri */}
        <div className="px-4 sm:px-6 pt-3 border-b border-white/[0.08] bg-black/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('facebook')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'facebook'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Facebook className="w-4 h-4" />
            <span>1. Facebook Post</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instagram')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'instagram'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Instagram className="w-4 h-4" />
            <span>2. Instagram Carusel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('autovit_olx')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'autovit_olx'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Autovit & OLX Pro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>4. Galerie & Watermark ({selectedImages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api_settings')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'api_settings'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>5. Conexiune Meta API</span>
          </button>
        </div>

        {/* Corp Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: FACEBOOK POST */}
          {activeTab === 'facebook' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Coloana Stânga: Editor Text Facebook */}
              <div className="lg:col-span-7 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-400" />
                    <span>Descriere Generată pentru Facebook:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const fbData = generateFacebookPostCopy(car, dealer);
                      setFbText(fbData.fullCopy);
                      showToast('Descrierea Facebook a fost regenerată!');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Resetează textul
                  </button>
                </div>

                <textarea
                  value={fbText}
                  onChange={(e) => setFbText(e.target.value)}
                  rows={14}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 resize-y"
                  placeholder="Textul postării de Facebook..."
                />

                {/* Butoane Acțiune Facebook */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText('fb')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      copiedChannel === 'fb'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-blue-600/15 hover:bg-blue-600/25 border-blue-500/30 text-blue-300 hover:text-white'
                    }`}
                  >
                    {copiedChannel === 'fb' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedChannel === 'fb' ? 'Text Copiat!' : 'Copiază Text FB'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPhotosWithWatermark('Facebook')}
                    disabled={isWatermarkingBatch}
                    className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Descarcă pozele cu watermark & logo-ul oficial al firmei pentru Facebook"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>{isWatermarkingBatch && watermarkProgress ? `Descărcare (${watermarkProgress.current}/${watermarkProgress.total})...` : 'Poze cu Logo FB'}</span>
                  </button>

                  <a
                    href="https://business.facebook.com/latest/composer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                    <span>Meta Composer</span>
                  </a>
                </div>

                {/* Direct Meta Facebook Publishing (dacă este activat) */}
                {metaSettings.metaEnabled && metaValidation.canPublishFb && (
                  <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Publicare Automată Hands-Free (Graph API):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handlePublishMetaFacebook}
                        disabled={isPublishingFb}
                        className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {isPublishingFb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isPublishingFb ? 'Se publică...' : 'Publică pe Pagina FB'}</span>
                      </button>
                    </div>

                    {publishFeedback.fb && (
                      <div className={`text-xs p-2 rounded-lg ${publishFeedback.fb.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                        {publishFeedback.fb.success ? (
                          <div className="flex items-center justify-between">
                            <span>✓ Postarea este live pe Facebook!</span>
                            {publishFeedback.fb.url && (
                              <a href={publishFeedback.fb.url} target="_blank" rel="noopener noreferrer" className="underline font-bold flex items-center gap-1">
                                Vezi postarea <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span>Eroare: {publishFeedback.fb.error}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Coloana Dreapta: Mockup Previzualizare Facebook */}
              <div className="lg:col-span-5 bg-white/[0.02] border border-white/08 rounded-xl p-4 flex flex-col space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-white/08">
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                    RXM
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">{dealer.name}</div>
                    <div className="text-[10px] text-zinc-500">Chiar acum • 🌐 Public</div>
                  </div>
                </div>

                <div className="text-xs text-zinc-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line font-sans scrollbar-thin">
                  {fbText.slice(0, 320)}...
                </div>

                {/* Previzualizare Foto Grilă */}
                {selectedImages.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-white/10 aspect-video relative bg-black/50">
                    <img 
                      src={normalizeCarImageUrl(selectedImages[0])} 
                      alt={car.brand} 
                      className="w-full h-full object-cover" 
                    />
                    {selectedImages.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white border border-white/15">
                        +{selectedImages.length - 1} fotografii
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 text-[11px] text-zinc-400 border-t border-white/08 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> TVA 21% & Cont de Garanție incluse
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Copiază Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTAGRAM CARUSEL */}
          {activeTab === 'instagram' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Coloana Stânga: Editor Caption Instagram */}
              <div className="lg:col-span-7 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>Caption Generat pentru Instagram:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const igData = generateInstagramCaption(car, dealer);
                      setIgCaption(igData.fullCaption);
                      showToast('Caption-ul Instagram a fost regenerat!');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Resetează caption
                  </button>
                </div>

                <textarea
                  value={igCaption}
                  onChange={(e) => setIgCaption(e.target.value)}
                  rows={14}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500/50 resize-y"
                  placeholder="Caption pentru Instagram..."
                />

                {/* Butoane Acțiune Instagram */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText('ig')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      copiedChannel === 'ig'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-amber-500/15 hover:from-pink-500/25 border-pink-500/30 text-pink-300 hover:text-white'
                    }`}
                  >
                    {copiedChannel === 'ig' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedChannel === 'ig' ? 'Caption Copiat!' : 'Copiază Caption IG'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPhotosWithWatermark('Instagram')}
                    disabled={isWatermarkingBatch}
                    className="py-2.5 px-3 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Descarcă pozele cu watermark & logo-ul oficial al firmei pentru Instagram"
                  >
                    <Download className="w-4 h-4 text-pink-400" />
                    <span>{isWatermarkingBatch && watermarkProgress ? `Descărcare (${watermarkProgress.current}/${watermarkProgress.total})...` : 'Poze cu Logo IG'}</span>
                  </button>

                  <a
                    href="https://www.instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                    <span>Deschide IG Web</span>
                  </a>
                </div>

                {/* Direct Meta Instagram Publishing (dacă este activat) */}
                {metaSettings.metaEnabled && metaValidation.canPublishIg && (
                  <div className="p-3 bg-pink-950/20 border border-pink-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                        <span>Publicare Carusel Direct (Instagram Graph API):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handlePublishMetaInstagram}
                        disabled={isPublishingIg}
                        className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {isPublishingIg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isPublishingIg ? 'Se publică...' : 'Publică Carusel IG'}</span>
                      </button>
                    </div>

                    {publishFeedback.ig && (
                      <div className={`text-xs p-2 rounded-lg ${publishFeedback.ig.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                        {publishFeedback.ig.success ? (
                          <div className="flex items-center justify-between">
                            <span>✓ Caruselul a fost publicat pe Instagram!</span>
                            {publishFeedback.ig.url && (
                              <a href={publishFeedback.ig.url} target="_blank" rel="noopener noreferrer" className="underline font-bold flex items-center gap-1">
                                Vezi postarea <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span>Eroare: {publishFeedback.ig.error}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Coloana Dreapta: Mockup Previzualizare Carusel Instagram */}
              <div className="lg:col-span-5 bg-white/[0.02] border border-white/08 rounded-xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/08">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-[2px]">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-[10px] text-white">
                        RXM
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">rxmautomobile</div>
                      <div className="text-[10px] text-zinc-500">Cluj-Napoca, România</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {selectedImages.length > 0 ? `${activePreviewImgIdx + 1}/${Math.min(10, selectedImages.length)}` : ''}
                  </span>
                </div>

                {/* Previzualizare Carusel cu Butoane de Navigare */}
                {selectedImages.length > 0 ? (
                  <div className="relative rounded-xl overflow-hidden aspect-square bg-black border border-white/10 group">
                    <img 
                      src={normalizeCarImageUrl(selectedImages[activePreviewImgIdx] || selectedImages[0])} 
                      alt={car.brand} 
                      className="w-full h-full object-cover" 
                    />
                    {selectedImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActivePreviewImgIdx(prev => (prev > 0 ? prev - 1 : selectedImages.length - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-80 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePreviewImgIdx(prev => (prev < selectedImages.length - 1 ? prev + 1 : 0))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-80 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl bg-white/[0.02] border border-white/08 flex items-center justify-center text-xs text-zinc-500">
                    Nicio fotografie selectată
                  </div>
                )}

                <div className="text-xs text-zinc-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line font-sans scrollbar-thin">
                  {igCaption.slice(0, 260)}...
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOVIT & OLX PRO */}
          {activeTab === 'autovit_olx' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Coloana Stânga: Editor Titlu & Descriere Autovit / OLX */}
              <div className="lg:col-span-7 space-y-3 flex flex-col">
                {/* Titlu Anunț Optimizat */}
                <div className="p-3 bg-white/[0.02] border border-white/08 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Titlu Anunț Recomandat (Autovit / OLX):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyText('title')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedChannel === 'title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedChannel === 'title' ? 'Copiat!' : 'Copiază Titlul'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={olxCopy.title}
                    onChange={(e) => setOlxCopy(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#18181c] border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Descriere Anunț OLX & Autovit */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Descriere Structurată (TVA 21% Deductibil & Specificații):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const refreshed = generateAutovitOlxCopy(car, dealer);
                      setOlxCopy(refreshed);
                      showToast('Descrierea OLX / Autovit a fost regenerată!');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Resetează textul
                  </button>
                </div>

                <textarea
                  value={olxCopy.olxText}
                  onChange={(e) => setOlxCopy(prev => ({ ...prev, olxText: e.target.value }))}
                  rows={13}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 resize-y"
                  placeholder="Textul anunțului pentru OLX și Autovit..."
                />

                {/* Banner Descărcare Poze Watermark Logo Firmă pentru Autovit & OLX */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-blue-950/20 to-black/40 border border-emerald-500/30 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-white">
                        Pachet Fotografii cu Watermark & Logo Firmă
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      {selectedImages.length} poze gata
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    Arde direct sigla oficială {dealer.name} în colțul dreapta-jos la rezoluție HD pentru a preveni furtul de poze pe OLX și Autovit.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownloadPhotosWithWatermark('OLX')}
                    disabled={isWatermarkingBatch}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isWatermarkingBatch ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Se aplică watermark-ul ({watermarkProgress?.current || 0}/{watermarkProgress?.total || 0})...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-white" />
                        <span>Descarcă Poze cu Watermark-Logo (pentru OLX & Autovit)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Butoane Acțiune Rapide Copiere & Deschidere Portaluri */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText('olx')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      copiedChannel === 'olx'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-emerald-600/15 hover:bg-emerald-600/25 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {copiedChannel === 'olx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiază OLX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyText('autovit')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      copiedChannel === 'autovit'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-blue-600/15 hover:bg-blue-600/25 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    {copiedChannel === 'autovit' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiază Autovit</span>
                  </button>

                  <a
                    href="https://www.olx.ro/adaugare/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    <span>OLX Adăugare</span>
                  </a>

                  <a
                    href="https://www.autovit.ro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Autovit Dealer</span>
                  </a>
                </div>
              </div>

              {/* Coloana Dreapta: Mockup Previzualizare Card Marketplace */}
              <div className="lg:col-span-5 bg-white/[0.02] border border-white/08 rounded-xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/08">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs">
                      OLX
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">Anunț Promovat Market</div>
                      <div className="text-[10px] text-zinc-400">Preț: {car.priceEur.toLocaleString('ro-RO')} € {car.vatDeductible ? '(TVA 21% deductibil)' : ''}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Autovit & OLX
                  </span>
                </div>

                {/* Previzualizare Foto cu Watermark Emulat */}
                {selectedImages.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-white/10 aspect-video relative bg-black/60 group">
                    <img 
                      src={normalizeCarImageUrl(selectedImages[0])} 
                      alt={car.brand} 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Badge Watermark vizibil */}
                    <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1.5 shadow-lg">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-[9px] font-black text-black">
                        R
                      </div>
                      <span className="text-[10px] font-bold text-white tracking-wide">
                        {dealer.name}
                      </span>
                    </div>

                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300 border border-white/10">
                      Foto 1 din {selectedImages.length}
                    </div>
                  </div>
                )}

                <div className="text-xs text-zinc-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line font-sans scrollbar-thin p-2.5 rounded-lg bg-black/30 border border-white/05">
                  <div className="font-bold text-white pb-1">{olxCopy.title}</div>
                  {olxCopy.olxText.slice(0, 360)}...
                </div>

                <div className="pt-2 text-[11px] text-zinc-400 border-t border-white/08 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Invarianță TVA 21% & Garanție de Participare incluse</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Locație: {dealer.showroomAddress || dealer.address || 'Showroom Oficial'} • {dealer.phonePrimary || dealer.whatsappNumber}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GALERIE & PACHET FOTO */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/08 p-3.5 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Selectează Imaginile pentru Postare / Descărcare:</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Selectate: {selectedImages.length} din {car.images.length} fotografii (Instagram permite max 10 în carusel).
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedImages(car.images || [])}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Selectează Toate
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImages(car.images?.slice(0, 10) || [])}
                    className="py-1.5 px-3 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Top 10 (IG Carusel)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadAllPhotos}
                    className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Originale HD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPhotosWithWatermark('General')}
                    disabled={isWatermarkingBatch}
                    className="py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>{isWatermarkingBatch && watermarkProgress ? `Descărcare (${watermarkProgress.current}/${watermarkProgress.total})...` : 'Pachet cu Watermark Logo'}</span>
                  </button>
                </div>
              </div>

              {/* Grilă Selecție Fotografii */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {car.images.map((imgSrc, idx) => {
                  const isSelected = selectedImages.includes(imgSrc);
                  const isFirstTen = idx < 10;

                  return (
                    <div
                      key={imgSrc}
                      onClick={() => toggleImageSelection(imgSrc)}
                      className={`relative rounded-xl overflow-hidden aspect-video border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-amber-400 ring-1 ring-amber-400/50 shadow-lg' 
                          : 'border-white/10 opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img 
                        src={normalizeCarImageUrl(imgSrc)} 
                        alt={`Foto ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                      
                      {/* Badge Ordine / Index */}
                      <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-white/20">
                        #{idx + 1}
                      </div>

                      {/* Badge Carusel Instagram */}
                      {isFirstTen && (
                        <div className="absolute bottom-1.5 left-1.5 bg-pink-600/90 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                          IG {idx + 1}
                        </div>
                      )}

                      {/* Indicator Bifare */}
                      <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-amber-400 text-black' : 'bg-black/60 text-white/50 border border-white/30'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: CONEXIUNE META GRAPH API (SETTINGS) */}
          {activeTab === 'api_settings' && (
            <div className="max-w-2xl mx-auto space-y-4 bg-white/[0.02] border border-white/08 p-5 rounded-2xl">
              <div className="flex items-center gap-3 pb-3 border-b border-white/08">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Configurare Conexiune Meta Graph API v19.0</h4>
                  <p className="text-xs text-zinc-400">
                    Activează publicarea cu 1 click direct pe paginile oficiale de Facebook & Instagram ale parcului.
                  </p>
                </div>
              </div>

              {/* Toggle Activare */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/06">
                <div>
                  <div className="text-xs font-bold text-white">Activează Publicarea Automată Meta</div>
                  <div className="text-[11px] text-zinc-400">Afișează butoanele de publicare instant în tab-urile FB și IG.</div>
                </div>
                <input
                  type="checkbox"
                  checked={metaSettings.metaEnabled || false}
                  onChange={(e) => setMetaSettings(prev => ({ ...prev, metaEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Câmp Facebook Page ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Facebook Page ID:</label>
                <input
                  type="text"
                  value={metaSettings.facebookPageId || ''}
                  onChange={(e) => setMetaSettings(prev => ({ ...prev, facebookPageId: e.target.value.trim() }))}
                  placeholder="Ex: 61550788350781"
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Câmp Instagram Business Account ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Instagram Business Account ID:</label>
                <input
                  type="text"
                  value={metaSettings.instagramBusinessAccountId || ''}
                  onChange={(e) => setMetaSettings(prev => ({ ...prev, instagramBusinessAccountId: e.target.value.trim() }))}
                  placeholder="Ex: 17841400000000000"
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-pink-400"
                />
              </div>

              {/* Câmp Page Access Token */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Facebook Page Access Token (Permanent / Long-Lived):
                </label>
                <input
                  type="password"
                  value={metaSettings.facebookPageAccessToken || ''}
                  onChange={(e) => setMetaSettings(prev => ({ ...prev, facebookPageAccessToken: e.target.value.trim() }))}
                  placeholder="EAA..."
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <p className="text-[10px] text-zinc-500">
                  Token-ul este stocat exclusiv în browserul local al dealerului și nu este transmis către terți.
                </p>
              </div>

              {/* Buton Salvare */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveApiSettings}
                  className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvează Configurația Meta</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="font-mono text-amber-400 font-bold">Showroom: {dealer.name}</span>
            <span>•</span>
            <span>Preț: {car.priceEur.toLocaleString('ro-RO')} €</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
            >
              Închide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
