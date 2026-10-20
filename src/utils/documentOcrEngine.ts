// =========================================================================
// RXM AUTOMOBILE — Motor OCR Documente Auto (Canvas Preprocessor + Tesseract + PDF.js)
// Recunoaștere caractere optice complet client-side cu preprocesare contrast
// și suport complet nativ pentru documente PDF (Directiva 1999/37/CE & US Title)
// =========================================================================

import { createWorker } from 'tesseract.js';
import { parseVehicleDocumentText, ParsedVehicleDocument, DocOriginCountry } from './documentOcrParser';
import { scanDocumentWithGeminiVision } from './geminiVisionEngine';
import { isPdfDocument, processPdfDocument, createPdfFallbackCanvas } from './pdfDocumentEngine';

export interface OcrProgressCallback {
  (progress: number, stepMessage: string): void;
}

export interface DocumentOcrOptions {
  countryHint?: DocOriginCountry | 'AUTO';
  rotation?: number; // 0, 90, 180, 270
  contrastBoost?: number; // 1.0 - 2.0
  onProgress?: OcrProgressCallback;
}

export interface DocumentOcrResult {
  parsedDoc: ParsedVehicleDocument;
  rawText: string;
  preprocessedPreviewUrl?: string;
  executionTimeMs: number;
  engineUsed?: 'gemini-vision' | 'tesseract-client';
}

export interface PreprocessResult {
  preprocessedBlob: Blob;
  previewDataUrl: string;
  extractedPdfText?: string;
}

/**
 * Preprocesare Imagine / PDF Document pe Canvas HTML5:
 * - Suport pentru imagini (JPEG, PNG, WebP) și documente PDF (randare pagină prin PDF.js)
 * - Scalare adaptivă pentru lizibilitate optimă (lățime 1600px - 2200px)
 * - Rotație 90° / 180° / 270° dacă utilizatorul a fotografiat documentul culcat
 * - Filtru Grayscale & Creștere Contrast pentru lizibilitate maximă a literelor
 */
export async function preprocessDocumentImage(
  imageSource: File | Blob | string,
  rotation: number = 0,
  contrastBoost: number = 1.35
): Promise<PreprocessResult> {
  // 1. Calea dedicată pentru documente PDF
  if (isPdfDocument(imageSource) && typeof imageSource !== 'string') {
    try {
      const pdfRes = await processPdfDocument(imageSource as File | Blob);

      // Dacă este solicitată o rotație sau o creștere de contrast peste randarea nativă
      if (rotation !== 0 || contrastBoost !== 1.0) {
        const isRotated90or270 = rotation === 90 || rotation === 270;
        const canvas = document.createElement('canvas');
        canvas.width = isRotated90or270 ? pdfRes.pageCanvas.height : pdfRes.pageCanvas.width;
        canvas.height = isRotated90or270 ? pdfRes.pageCanvas.width : pdfRes.pageCanvas.height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(pdfRes.pageCanvas, -pdfRes.pageCanvas.width / 2, -pdfRes.pageCanvas.height / 2);

          if (contrastBoost !== 1.0) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const factor = (259 * (contrastBoost * 255 + 255)) / (255 * (259 - contrastBoost * 255));
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              const contrasted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
              data[i] = contrasted;
              data[i + 1] = contrasted;
              data[i + 2] = contrasted;
            }
            ctx.putImageData(imageData, 0, 0);
          }

          const previewUrl = canvas.toDataURL('image/jpeg', 0.88);
          const blob = await new Promise<Blob>((res, rej) => {
            canvas.toBlob(b => b ? res(b) : rej(new Error('Export Blob eșuat din Canvas PDF')), 'image/jpeg', 0.92);
          });

          return {
            preprocessedBlob: blob,
            previewDataUrl: previewUrl,
            extractedPdfText: pdfRes.extractedText
          };
        }
      }

      return {
        preprocessedBlob: pdfRes.pageBlob,
        previewDataUrl: pdfRes.previewDataUrl,
        extractedPdfText: pdfRes.extractedText
      };
    } catch (pdfErr) {
      console.warn('[OCR Engine] Randarea PDF.js a eșuat, se utilizează fallback-ul pe canvas:', pdfErr);
      const fileName = imageSource instanceof File ? imageSource.name : 'Document.pdf';
      const fallback = createPdfFallbackCanvas(fileName);
      return {
        preprocessedBlob: imageSource as Blob,
        previewDataUrl: fallback.previewUrl
      };
    }
  }

  // 2. Preprocesare standard pentru fișiere imagine (JPEG, PNG, WebP)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const objectUrl = typeof imageSource === 'string' 
      ? imageSource 
      : URL.createObjectURL(imageSource);

    img.onload = () => {
      try {
        const isRotated90or270 = rotation === 90 || rotation === 270;
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        // Scalare adaptivă: țintă ~1800px pe latura mare
        const maxDim = Math.max(origWidth, origHeight);
        const scale = maxDim > 2400 ? 2400 / maxDim : maxDim < 1200 ? 1600 / maxDim : 1.0;

        const scaledW = Math.round(origWidth * scale);
        const scaledH = Math.round(origHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = isRotated90or270 ? scaledH : scaledW;
        canvas.height = isRotated90or270 ? scaledW : scaledH;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Nu s-a putut inițializa contextul Canvas 2D.');
        }

        // Aplicare rotație
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);

        // Preprocesare Pixeli: Grayscale + Contrast Boost
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const factor = (259 * (contrastBoost * 255 + 255)) / (255 * (259 - contrastBoost * 255));

        for (let i = 0; i < data.length; i += 4) {
          // Grayscale ponderat fiziologic (Luma)
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Creștere contrast
          const contrasted = factor * (gray - 128) + 128;
          const clamped = Math.min(255, Math.max(0, contrasted));

          data[i] = clamped;     // R
          data[i + 1] = clamped; // G
          data[i + 2] = clamped; // B
          // Alpha data[i + 3] rămâne neschimbat
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (typeof imageSource !== 'string') {
            URL.revokeObjectURL(objectUrl);
          }
          if (blob) {
            const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ preprocessedBlob: blob, previewDataUrl: previewUrl });
          } else {
            reject(new Error('Eroare la exportul Blob din Canvas.'));
          }
        }, 'image/jpeg', 0.92);
      } catch (err) {
        if (typeof imageSource !== 'string') URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      if (typeof imageSource !== 'string') URL.revokeObjectURL(objectUrl);
      reject(new Error('Nu s-a putut încărca fișierul imagine pentru procesare OCR.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Execuție Completă Pipeline OCR Hibrid:
 * 1. Preprocesare Canvas & Calibrare (inclusiv randare PDF nativă via PDF.js)
 * 2. Extragere directă text digital (pentru PDF-uri cu strat text)
 * 3. Motor Principal: Google Gemini Vision Multimodal cu Rotație Chei API (Free Tier AutoLicit)
 * 4. Fallback Automat: Motor Local Tesseract Web Worker (dacă API Google este indisponibil)
 */
export async function processVehicleDocumentOcr(
  imageSource: File | Blob | string,
  options: DocumentOcrOptions = {}
): Promise<DocumentOcrResult> {
  const startTime = performance.now();
  const { onProgress, countryHint = 'AUTO', rotation = 0, contrastBoost = 1.35 } = options;

  const isPdf = isPdfDocument(imageSource);

  try {
    // Faza 1: Preprocesare Optică Canvas
    onProgress?.(10, isPdf ? '📄 Randare pagină PDF & extragere text digital...' : '📸 Calibrare optică & preprocesare contrast pe Canvas...');
    const { preprocessedBlob, previewDataUrl, extractedPdfText } = await preprocessDocumentImage(
      imageSource,
      rotation,
      contrastBoost
    );

    // Dacă PDF-ul are text digital extras de o calitate excelentă (Directiva 1999/37/CE):
    if (extractedPdfText && extractedPdfText.trim().length > 40) {
      onProgress?.(25, '🔍 Analiză text digital din structura PDF-ului...');
      const digitalDoc = parseVehicleDocumentText(
        extractedPdfText,
        countryHint === 'AUTO' ? undefined : countryHint
      );
      // Dacă am găsit deja VIN valid și marca sau anul fabricației:
      if (digitalDoc.isVinValid && digitalDoc.confidenceScore >= 65) {
        onProgress?.(100, '✅ Date extrase instantaneu din textul digital al documentului PDF!');
        return {
          parsedDoc: digitalDoc,
          rawText: extractedPdfText,
          preprocessedPreviewUrl: previewDataUrl,
          executionTimeMs: Math.round(performance.now() - startTime),
          engineUsed: 'gemini-vision'
        };
      }
    }

      // Faza 2: Procesare automată de înaltă rezoluție
      try {
        onProgress?.(30, '⚡ Declanșare procesare automată de înaltă rezoluție...');
        // Trimitem imaginea JPEG preprocesată (rezoluție înaltă, scalată și cu contrast optimizat pentru documente auto)
        const blobToSend = preprocessedBlob;
        const geminiDoc = await scanDocumentWithGeminiVision(blobToSend, onProgress);

      const executionTimeMs = Math.round(performance.now() - startTime);
      onProgress?.(100, '✅ Document auto scanat și validat cu succes!');

      return {
        parsedDoc: geminiDoc,
        rawText: geminiDoc.rawText,
        preprocessedPreviewUrl: previewDataUrl,
        executionTimeMs,
        engineUsed: 'gemini-vision'
      };
    } catch (geminiErr: any) {
      console.warn('[Document OCR] Canalul primar de procesare a raportat o eroare temporară:', geminiErr?.message || geminiErr);
      onProgress?.(40, '🔄 Inițializare algoritm secundar de rezervă...');
    }

    // Faza 3: Dacă am extras text din PDF dar procesarea primară a întâmpinat o problemă, folosim parserul pe textul PDF
    if (extractedPdfText && extractedPdfText.trim().length > 20) {
      const parsedDoc = parseVehicleDocumentText(
        extractedPdfText,
        countryHint === 'AUTO' ? undefined : countryHint
      );
      if (parsedDoc.isVinValid || parsedDoc.recognizedFieldsCount >= 2) {
        onProgress?.(100, '✅ Date extrase din textul documentului PDF!');
        return {
          parsedDoc,
          rawText: extractedPdfText,
          preprocessedPreviewUrl: previewDataUrl,
          executionTimeMs: Math.round(performance.now() - startTime),
          engineUsed: 'tesseract-client'
        };
      }
    }

    // Faza 4: Motor Local Web Worker pe imaginea randată din Canvas
    const worker = await createWorker('eng');
    try {
      onProgress?.(60, '⚙️ Scanare caractere optice (motor local de rezervă)...');
      const ocrResult = await worker.recognize(preprocessedBlob);
      const recognizedText = ocrResult.data.text || '';

      onProgress?.(85, '🌍 Parsare coduri Directiva 1999/37/CE...');
      const parsedDoc = parseVehicleDocumentText(
        recognizedText,
        countryHint === 'AUTO' ? undefined : countryHint
      );

      onProgress?.(100, '✅ Document procesat și validat cu succes!');
      const executionTimeMs = Math.round(performance.now() - startTime);

      return {
        parsedDoc,
        rawText: recognizedText,
        preprocessedPreviewUrl: previewDataUrl,
        executionTimeMs,
        engineUsed: 'tesseract-client'
      };
    } finally {
      await worker.terminate();
    }
  } catch (err: any) {
    console.error('Eroare în execuția pipeline-ului OCR:', err);
    throw new Error(`Eroare la procesarea documentului: ${err.message || 'Format nerecunoscut'}`);
  }
}
