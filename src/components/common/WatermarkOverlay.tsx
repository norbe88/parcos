import React from 'react';

export interface WatermarkOverlayProps {
  /**
   * Varianta de afișare a watermark-ului:
   * - 'card': carduri showroom (fără badge inferior pentru a evita suprapunerea peste preț)
   * - 'gallery': galeria principală din modal (badge inferior dreapta)
   * - 'lightbox': vizualizator fullscreen 4K (badge + filigran diagonal)
   * - 'banner': hero spotlight sau bannere mari (fără badge inferior pentru a evita suprapunerea peste butoane)
   */
  variant?: 'card' | 'gallery' | 'lightbox' | 'banner';
  /** Text opțional de suprascriere; implicit branding-ul de partener licitații */
  text?: string;
  /** Afișare filigran diagonal central semi-transparent */
  showDiagonal?: boolean;
  className?: string;
}

export const WATERMARK_OFFICIAL_TEXT = 'RXM AUTO MOBILE • CLUJ-NAPOCA • 0748 892 937';

/**
 * WatermarkOverlay — Eliminat conform standardului Dark Luxury RXM Automobile.
 * Fotografiile oficiale se afișează 100% curate și profesionale, fără filigran diagonal („filament”) sau overlay textil peste caroserie.
 */
export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = () => {
  return null;
};
