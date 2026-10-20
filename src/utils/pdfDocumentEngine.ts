// =========================================================================
// RXM AUTOMOBILE — Motor Procesare Documente PDF (PDF.js + Canvas Renderer)
// Permite extragerea textului digital și randarea paginilor PDF pe Canvas
// pentru recunoaștere OCR (Gemini Vision / Tesseract) și previzualizare
// =========================================================================

import * as pdfjsLib from 'pdfjs-dist';

// Configurare worker oficial PDF.js
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (err) {
      console.warn('[PDF.js] Nu s-a putut seta calea către worker:', err);
    }
  }
}

export interface PdfProcessingResult {
  pageCanvas: HTMLCanvasElement;
  pageBlob: Blob;
  previewDataUrl: string;
  extractedText: string;
  totalPages: number;
}

/**
 * Verifică dacă o sursă este un document PDF (după MIME type sau extensie)
 */
export function isPdfDocument(source: File | Blob | string | null | undefined): boolean {
  if (!source) return false;
  if (typeof source === 'string') {
    return source.toLowerCase().includes('application/pdf') || source.toLowerCase().endsWith('.pdf');
  }
  if (source instanceof File) {
    return source.type === 'application/pdf' || source.name.toLowerCase().endsWith('.pdf');
  }
  return source.type === 'application/pdf';
}

/**
 * Randează prima pagină (sau primele două pagini compuse) a unui fișier PDF
 * într-un obiect File JPEG în browser la rezoluție înaltă (scale 2.0 pentru OCR).
 * Convertește fișierul identic cu logica de producție din AutoLicit (pdfConverter.ts).
 */
export async function convertPdfToImage(file: File): Promise<File> {
  if (!isPdfDocument(file)) {
    return file;
  }

  const arrayBuffer = await file.arrayBuffer();

  // Încărcare document PDF
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  // Randăm pagina 1 la scară 2.0 (calitate înaltă pentru OCR)
  const page1 = await pdf.getPage(1);
  const viewport1 = page1.getViewport({ scale: 2.0 });

  // Dacă avem cel puțin 2 pagini (exemplu: Față + Spate CIV / Talon), randăm ambele pagini compus
  if (numPages >= 2) {
    try {
      const page2 = await pdf.getPage(2);
      const viewport2 = page2.getViewport({ scale: 2.0 });

      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = Math.max(Math.round(viewport1.width), Math.round(viewport2.width));
      compositeCanvas.height = Math.round(viewport1.height + viewport2.height);

      const ctx = compositeCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

        // Pagina 1
        const canvas1 = document.createElement('canvas');
        canvas1.width = Math.round(viewport1.width);
        canvas1.height = Math.round(viewport1.height);
        const ctx1 = canvas1.getContext('2d');
        if (ctx1) {
          ctx1.fillStyle = '#ffffff';
          ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
          await page1.render({ canvas: canvas1, canvasContext: ctx1, viewport: viewport1 } as any).promise;
          ctx.drawImage(canvas1, 0, 0);
        }

        // Pagina 2 (plasată dedesubt pentru document complet CIV Față + Spate)
        const canvas2 = document.createElement('canvas');
        canvas2.width = Math.round(viewport2.width);
        canvas2.height = Math.round(viewport2.height);
        const ctx2 = canvas2.getContext('2d');
        if (ctx2) {
          ctx2.fillStyle = '#ffffff';
          ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
          await page2.render({ canvas: canvas2, canvasContext: ctx2, viewport: viewport2 } as any).promise;
          ctx.drawImage(canvas2, 0, Math.round(viewport1.height));
        }

        return new Promise<File>((resolve, reject) => {
          compositeCanvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Conversia PDF în Blob compus a eșuat.'));
              const newFileName = file.name.replace(/\.[^/.]+$/, '') + '_converted.jpg';
              resolve(new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() }));
            },
            'image/jpeg',
            0.92
          );
        });
      }
    } catch (twoPageErr) {
      console.warn('[PDF.js] Nu s-au putut randa ambele pagini compus, se revine la Pagina 1:', twoPageErr);
    }
  }

  // Randare doar Pagina 1 (standard)
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport1.width);
  canvas.height = Math.round(viewport1.height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Nu s-a putut crea contextul Canvas 2D pentru conversia PDF.');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page1.render({
    canvas,
    canvasContext: ctx,
    viewport: viewport1
  } as any).promise;

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Conversia Canvas PDF în Blob JPEG a eșuat.'));
        const newFileName = file.name.replace(/\.[^/.]+$/, '') + '_converted.jpg';
        resolve(new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() }));
      },
      'image/jpeg',
      0.92
    );
  });
}

/**
 * Randează prima pagină a unui PDF pe un element Canvas HTML5
 * și extrage textul digital integrat din document (dacă există)
 */
export async function processPdfDocument(
  pdfSource: File | Blob,
  pageNumber: number = 1
): Promise<PdfProcessingResult> {
  const arrayBuffer = await pdfSource.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  // 1. Extragere text digital integrat din primele pagini (până la 3 pagini)
  let extractedText = '';
  for (let i = 1; i <= Math.min(totalPages, 3); i++) {
    try {
      const p = await pdfDoc.getPage(i);
      const textContent = await p.getTextContent();
      const pageString = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      extractedText += `\n--- PAGINA ${i} ---\n` + pageString + '\n';
    } catch (e) {
      console.warn(`[PDF.js] Nu s-a putut citi textul paginii ${i}:`, e);
    }
  }

  // 2. Randare pe Canvas a paginii țintă la rezoluție înaltă (scale 2.0 pentru claritate OCR)
  const targetPageIdx = Math.max(1, Math.min(pageNumber, totalPages));
  const page = await pdfDoc.getPage(targetPageIdx);
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Nu s-a putut inițializa contextul Canvas 2D pentru randarea documentului PDF.');
  }

  // Fundal alb mat
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas,
    canvasContext: ctx,
    viewport
  } as any).promise;

  const previewDataUrl = canvas.toDataURL('image/jpeg', 0.88);

  const pageBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export Blob eșuat din Canvas PDF'))),
      'image/jpeg',
      0.92
    );
  });

  return {
    pageCanvas: canvas,
    pageBlob,
    previewDataUrl,
    extractedText: extractedText.trim(),
    totalPages
  };
}

/**
 * Generează un Canvas de fallback pentru PDF în cazul în care motorul PDF.js nu poate rula
 */
export function createPdfFallbackCanvas(fileName: string = 'Document CIV.pdf'): { canvas: HTMLCanvasElement; blob: Blob; previewUrl: string } {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e11d48';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('DOCUMENT PDF AUTO', 120, 300);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '36px monospace';
    ctx.fillText('Directiva 1999/37/CE • CIV / Talon', 120, 380);

    ctx.fillStyle = '#ffffff';
    ctx.font = '32px sans-serif';
    ctx.fillText(`Fișier: ${fileName}`, 120, 480);
    ctx.fillText('Procesare automată document...', 120, 560);
  }

  const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
  return {
    canvas,
    blob: new Blob(['pdf-fallback'], { type: 'image/jpeg' }),
    previewUrl
  };
}
