/**
 * RXM AUTO MOBILE — Generator Standardizat Documente & PDF
 * Nomenclator unic pentru denumirea fișierelor și export 1-Click PDF / Print
 */

export type DocumentType = 
  | 'contract'
  | 'proforma'
  | 'tax_invoice'
  | 'fiscal'
  | 'warranty' 
  | 'protocol' 
  | 'margin' 
  | 'technical_inspection'
  | 'inspection'
  | 'window_sticker' 
  | 'vehicle_sheet'
  | 'gdpr';

export interface DocumentNamingParams {
  docType: DocumentType | string;
  brand: string;
  model: string;
  stockNumber?: string;
  vin?: string;
  date?: string;
  invoiceNumber?: string;
}

/**
 * Curăță diacriticele și caracterele speciale pentru compatibilitate maximă OS (Windows/iOS/Android)
 */
export function sanitizeFilenamePart(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimină diacriticele
    .replace(/[ăâ]/gi, 'a')
    .replace(/[î]/gi, 'i')
    .replace(/[șş]/gi, 's')
    .replace(/[țţ]/gi, 't')
    .replace(/[\\/:*?"<>|#%&{}\\$!'@+`=]/g, '') // Caractere interzise în denumiri de fișiere
    .trim()
    .replace(/\s+/g, '-') // Spațiile devin cratimă
    .replace(/-+/g, '-'); // Reduce cratimele duplicate
}

/**
 * Returnează eticheta standard a tipului de document
 */
export function getDocumentTypeLabel(docType: DocumentType | string): string {
  switch (docType) {
    case 'contract':
      return 'Contract-Vanzare-Cumparare';
    case 'tax_invoice':
    case 'fiscal':
      return 'Factura-Fiscala';
    case 'proforma':
      return 'Factura-Proforma';
    case 'warranty':
      return 'Certificat-Garantie';
    case 'protocol':
      return 'Proces-Verbal-Predare-Primire';
    case 'margin':
      return 'Nota-Calcul-Fiscal-Marja';
    case 'technical_inspection':
    case 'inspection':
      return 'Raport-Inspectie-Tehnica';
    case 'window_sticker':
      return 'Fisa-Parbriz-Showroom';
    case 'vehicle_sheet':
      return 'Fisa-Vehicul';
    case 'gdpr':
      return 'Acord-GDPR-Prelucrare-Date';
    default:
      return sanitizeFilenamePart(docType) || 'Document-Auto';
  }
}

/**
 * Denumire standardizată oficială conform specificației RXM:
 * [Tip-Document]_[Marca]-[Model]_[Referinta-Stoc-sau-VIN]_[Data]
 * Exemplu: Certificat-Garantie_BMW-X5_CVN-10023_2026-10-13
 */
export function getStandardDocumentFileName({
  docType,
  brand,
  model,
  stockNumber,
  vin,
  date,
  invoiceNumber
}: DocumentNamingParams): string {
  const cleanDoc = getDocumentTypeLabel(docType);
  const cleanBrand = sanitizeFilenamePart(brand || 'Auto');
  const cleanModel = sanitizeFilenamePart(model || 'Vehicul');
  
  // Referință: stockNumber (CVN-xxxxx) preferat, altfel serie factură sau ultimele 6 cifre VIN
  let cleanRef = '';
  if (stockNumber && stockNumber.trim()) {
    cleanRef = sanitizeFilenamePart(stockNumber);
  } else if (invoiceNumber && invoiceNumber.trim()) {
    cleanRef = sanitizeFilenamePart(invoiceNumber);
  } else if (vin && vin.trim()) {
    cleanRef = `VIN-${sanitizeFilenamePart(vin.slice(-6).toUpperCase())}`;
  } else {
    cleanRef = 'RXM';
  }

  const cleanDate = sanitizeFilenamePart(date || new Date().toISOString().split('T')[0]);

  return `${cleanDoc}_${cleanBrand}-${cleanModel}_${cleanRef}_${cleanDate}`;
}

/**
 * Declanșează printarea nativă a browserului setând document.title pe denumirea standard.
 * Astfel, opțiunea "Salvare ca PDF" / "Microsoft Print to PDF" din browser sugerează automat
 * numele corect de fișier cu marca, modelul, referința și tipul de document!
 */
export function printWithDocumentTitle(fileName: string): void {
  const previousTitle = document.title;
  try {
    document.title = fileName;
    window.print();
  } finally {
    // Restaurăm titlul paginii după închiderea dialogului de print
    setTimeout(() => {
      document.title = previousTitle;
    }, 1500);
  }
}

/**
 * Descarcă direct un element DOM ca fișier PDF salvat în browser (Downloads).
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  fileName: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
  }
): Promise<void> {
  const cleanFileName = `${fileName.replace(/\.pdf$/i, '')}.pdf`;

  try {
    // Import dinamic pentru a nu încărca bundle-ul inițial
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html2pdfModule: any = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [6, 6, 6, 6] as [number, number, number, number],
      filename: cleanFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        letterRendering: true,
        ignoreElements: (element: Element) => {
          return element.classList?.contains('no-print') || element.hasAttribute('data-html2canvas-ignore');
        }
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: options?.orientation || 'portrait'
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.html2pdf__page-break'
      }
    };

    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.warn('html2pdf direct save failed, falling back to print dialog with standard title:', err);
    // Fallback sigur la print dialog cu document.title setat
    printWithDocumentTitle(fileName);
  }
}
