export interface BuyerData {
  fullName: string;
  cnpOrCui: string;
  idSeries: string;
  idNumber: string;
  address: string;
  county: string;
  phone: string;
  agreedPriceEur: number;
  agreedPriceRon: number;
  exchangeRate: number;
  contractDate: string;
  invoiceNumber?: string;
  deliveryMileageKm?: number;
  warrantyStartDate?: string;
  // Accesorii & Documente Predate (Proces-Verbal Predare-Primire)
  keysCount?: number;
  keysCustomText?: string;
  hasRegistrationCertificate?: boolean;
  hasCivOrOriginDocs?: boolean;
  hasTaxInvoice?: boolean;
  hasWarrantyCertificate?: boolean;
  hasMedicalKitTriangles?: boolean;
  hasSpareWheelOrKit?: boolean;
  hasMountedTiresGoodCondition?: boolean;
  hasUserManualServiceBook?: boolean;
  fuelLevel?: string;
  deliveryNotes?: string;
  // Date Inspecție Tehnică Showroom (100+ Puncte)
  inspectorName?: string;
  inspectionDate?: string;
  tireTreadFrontMm?: number;
  tireTreadRearMm?: number;
  brakePadsFrontPct?: number;
  brakePadsRearPct?: number;
  paintThicknessMicronsAvg?: number;
  obdScanResult?: 'clean' | 'minor' | 'warning';
  generalConditionRating?: 'exceptional' | 'foarte_buna' | 'buna';
  inspectionNotes?: string;
}
