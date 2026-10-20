import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * Opțiuni pentru generarea codului QR
 */
export interface QrCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

// Cache în memorie pentru a evita recalcularea aceluiași QR code
const qrCache = new Map<string, string>();

/**
 * Generează un Data URL (base64 PNG) pentru un text sau URL dat.
 * Rulare 100% offline, fără conexiune la internet și fără servicii externe.
 */
export async function generateQrCodeDataUrl(
  text: string, 
  options: QrCodeOptions = {}
): Promise<string> {
  if (!text) return '';

  const width = options.width || 300;
  const margin = options.margin !== undefined ? options.margin : 1;
  const darkColor = options.color?.dark || '#000000';
  const lightColor = options.color?.light || '#ffffff';

  const cacheKey = `${text}_${width}_${margin}_${darkColor}_${lightColor}`;
  if (qrCache.has(cacheKey)) {
    return qrCache.get(cacheKey)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: 'M'
    });
    qrCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Eroare la generarea codului QR local:', err);
    return '';
  }
}

/**
 * Generează un string SVG nativ pentru un text sau URL dat.
 * Ideal pentru print de înaltă rezoluție (vectorial).
 */
export async function generateQrCodeSvg(
  text: string,
  options: QrCodeOptions = {}
): Promise<string> {
  if (!text) return '';

  const margin = options.margin !== undefined ? options.margin : 1;
  const darkColor = options.color?.dark || '#000000';
  const lightColor = options.color?.light || '#ffffff';

  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      margin,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: 'M'
    });
    return svgString;
  } catch (err) {
    console.error('Eroare la generarea codului QR SVG:', err);
    return '';
  }
}

/**
 * Hook React pentru obținerea instantanee / asincronă a unui QR Code DataURL 100% offline.
 */
export function useQrCodeDataUrl(text: string, options: QrCodeOptions = {}): string {
  const width = options.width || 300;
  const margin = options.margin !== undefined ? options.margin : 1;
  const darkColor = options.color?.dark || '#000000';
  const lightColor = options.color?.light || '#ffffff';
  const cacheKey = `${text}_${width}_${margin}_${darkColor}_${lightColor}`;

  const [dataUrl, setDataUrl] = useState<string>(() => qrCache.get(cacheKey) || '');

  useEffect(() => {
    let isMounted = true;
    if (text) {
      generateQrCodeDataUrl(text, options).then(url => {
        if (isMounted && url) {
          setDataUrl(url);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [text, width, margin, darkColor, lightColor]);

  return dataUrl;
}
