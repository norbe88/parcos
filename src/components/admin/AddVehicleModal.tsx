import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, ShieldCheck, RotateCcw, Trash2, Edit3, Check, Loader2 } from 'lucide-react';
import { VehicleItem, VehicleAuditEntry } from '../../db/seed';
import { extractOlxId } from '../../utils/helpers';

// Subcomponente Wizard
import { CivScanHero, ScanPresetKey, ScanCountryKey, ScanSource } from './add-vehicle/CivScanHero';
import { StepTechData } from './add-vehicle/StepTechData';
import { StepPriceVat } from './add-vehicle/StepPriceVat';
import { StepFeatures } from './add-vehicle/StepFeatures';
import { StepMediaUpload } from './add-vehicle/StepMediaUpload';
import { MarketPriceComparatorModal } from '../modals/MarketPriceComparatorModal';

// Motor OCR Real & Parser Directiva 1999/37/CE
import { processVehicleDocumentOcr } from '../../utils/documentOcrEngine';
import { ParsedVehicleDocument, DocOriginCountry } from '../../utils/documentOcrParser';
import { batchApplyWatermark } from '../../utils/watermarkEngine';
import { getAllAvailableFeatures } from '../../utils/featuresCatalogService';
import { categorizeFeatures } from '../../utils/vehicleDescriptionGenerator';

// Netcup VPS & 1-Button Publish Services
import { uploadCarImagesBatch } from '../../services/cloudMediaStorage';
import { vehicleRepository } from '../../services/vehicleRepository';
import { normalizeBrand } from '../../utils/brandNormalizer';
import { sanitizePublicOcrError } from '../../services/demoOcrService';
import { DealerProfile } from '../../db/types';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCar: (car: VehicleItem) => void;
  editCar?: VehicleItem | null;
  onUpdateCar?: (car: VehicleItem) => void;
  showToast: (msg: string) => void;
  dealer?: DealerProfile | null;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onAddCar,
  editCar = null,
  onUpdateCar,
  showToast,
  dealer = null
}) => {
  const isEditing = !!editCar;
  const dealerSlug = dealer?.slug || editCar?.dealerSlug || 'rxm';
  const dealerPrefix = dealerSlug === 'mpi_auto' ? 'MPI' : dealerSlug === 'top_auto' ? 'ALD' : (dealer?.name ? dealer.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() : 'RXM');
  const draftStorageKey = `${dealerSlug}_vehicle_draft_in_progress`;

  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1);
  const [carDraftId, setCarDraftId] = useState<string>(() => `car-${dealerSlug}-${Date.now()}`);

  // Stare 1-Button Publish Cloud
  const [publishState, setPublishState] = useState<{
    isPublishing: boolean;
    stage: 'idle' | 'uploading_photos' | 'saving_record' | 'success' | 'error';
    progressCurrent: number;
    progressTotal: number;
    errorMessage?: string;
  }>({
    isPublishing: false,
    stage: 'idle',
    progressCurrent: 0,
    progressTotal: 0,
  });

  // Câmpuri Formular Listare Vehicul (Inițializate curat, fără date reziduale)
  const [docOriginCountry, setDocOriginCountry] = useState<DocOriginCountry>('DE');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newVersionTrim, setNewVersionTrim] = useState('');
  const [newYear, setNewYear] = useState(2020);
  const [newMileage, setNewMileage] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newVatDeductible, setNewVatDeductible] = useState(false);
  const [newFuel, setNewFuel] = useState<'Diesel' | 'Benzină' | 'Hibrid' | 'Electric'>('Benzină');
  const [newTransmission, setNewTransmission] = useState<'Automată' | 'Manuală'>('Automată');
  const [newDrivetrain, setNewDrivetrain] = useState<'4x4 / AWD' | 'Față' | 'Spate'>('Față');
  const [powerKw, setPowerKw] = useState<number>(0);
  const [newPowerHp, setNewPowerHp] = useState<number>(0);
  const [newEngineCc, setNewEngineCc] = useState<number>(0);
  const [newBodyType, setNewBodyType] = useState<'SUV' | 'Sedan' | 'Coupe' | 'Break' | 'Hatchback'>('Hatchback');
  const [newColor, setNewColor] = useState('');
  const [newVin, setNewVin] = useState('');
  const [isVinPublic, setIsVinPublic] = useState(false);
  const [newCivNumber, setNewCivNumber] = useState('');
  const [hasRedPlates, setHasRedPlates] = useState(false);
  const [redPlatesExpiresAt, setRedPlatesExpiresAt] = useState('');
  const [itpExpiresAt, setItpExpiresAt] = useState('');
  const [rarAppointmentDate, setRarAppointmentDate] = useState('');
  const [newWarranty, setNewWarranty] = useState<12 | 24 | 36>(12);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newTiktokUrl, setNewTiktokUrl] = useState('');
  const [newOlxUrl, setNewOlxUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [equipmentSheetText, setEquipmentSheetText] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Faruri LED', 'Senzori Parcare Față/Spate', 'Climatronic Automat', 'Navigație Mare', 'Scaune Încălzite'
  ]);

  // Stare Scanare Inteligentă CIV (Motor OCR Real)
  const [isScanningCiv, setIsScanningCiv] = useState(false);
  const [civScanStep, setCivScanStep] = useState<string>('');
  const [civScanProgress, setCivScanProgress] = useState(0);
  const [parsedDocReview, setParsedDocReview] = useState<ParsedVehicleDocument | null>(null);
  const [isCivCollapsed, setIsCivCollapsed] = useState(false);

  // Stare Upload Fotografii WebP & Galerie
  const [newImages, setNewImages] = useState<string[]>([]);
  const [autoBranding, setAutoBranding] = useState<boolean>(true);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Stare Modal Comparator Preț Piață (Nod Sami S9 GSM)
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);

  // 🚦 Stare Intenție Publicare & Protecție Ieșire Date Nesalvate (Tichetele 01, 02, 03)
  const [publicIntentStatus, setPublicIntentStatus] = useState<'in_stock' | 'preparing'>('in_stock');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 🔄 Populează datele complete dacă suntem în modul Editare Anunț
  useEffect(() => {
    if (isOpen && editCar) {
      setCarDraftId(editCar.id);
      setDocOriginCountry(editCar.docOriginCountry || 'DE');
      setNewBrand(editCar.brand || '');
      setNewModel(editCar.model || '');
      setNewVersionTrim(editCar.versionTrim || '');
      setNewYear(editCar.year || 2020);
      setNewMileage(editCar.mileageKm !== undefined ? String(editCar.mileageKm) : '');
      setNewPrice(editCar.priceEur !== undefined ? String(editCar.priceEur) : '');
      setNewVatDeductible(!!editCar.vatDeductible);
      setNewFuel(editCar.fuelType || 'Benzină');
      setNewTransmission(editCar.transmission || 'Automată');
      setNewDrivetrain(editCar.drivetrain || 'Față');
      setNewPowerHp(editCar.powerHp || 0);
      setPowerKw(Math.round((editCar.powerHp || 0) * 0.7457));
      setNewEngineCc(editCar.engineCc || 0);
      setNewBodyType(editCar.bodyType || 'Hatchback');
      setNewColor(editCar.color || '');
      setNewVin(editCar.vin || '');
      setIsVinPublic(!!editCar.isVinPublic);
      setNewCivNumber(editCar.civSeries || '');
      setHasRedPlates(!!editCar.hasRedPlates);
      setRedPlatesExpiresAt(editCar.redPlatesExpiresAt || '');
      setItpExpiresAt(editCar.itpExpiresAt || '');
      setRarAppointmentDate(editCar.rarAppointmentDate || '');
      setNewWarranty(editCar.warrantyMonths || 12);
      setNewVideoUrl(editCar.videoUrl || '');
      setNewTiktokUrl(editCar.tiktokUrl || '');
      setNewOlxUrl(editCar.olxUrl || '');
      setNewDescription(editCar.description || '');
      setEquipmentSheetText(editCar.equipmentSheetText || '');
      const allFeats = [
        ...(editCar.features?.safety || []),
        ...(editCar.features?.comfort || []),
        ...(editCar.features?.multimedia || [])
      ];
      setSelectedFeatures(allFeats.length > 0 ? allFeats : []);
      setNewImages(editCar.images || []);
      setPublicIntentStatus(editCar.status === 'preparing' ? 'preparing' : 'in_stock');
      setIsCivCollapsed(true);
      setFormStep(1);
      setShowExitConfirm(false);
      setPublishState({
        isPublishing: false,
        stage: 'idle',
        progressCurrent: 0,
        progressTotal: 0,
      });
    } else if (isOpen && !editCar) {
      setCarDraftId(`car-${dealerSlug}-${Date.now()}`);
      setIsCivCollapsed(false);
    }
  }, [isOpen, editCar, dealerSlug]);

  const isFormDirty = isEditing
    ? (
        newBrand !== editCar.brand ||
        newModel !== editCar.model ||
        newVersionTrim !== (editCar.versionTrim || '') ||
        newMileage !== String(editCar.mileageKm || '') ||
        newPrice !== String(editCar.priceEur || '') ||
        newYear !== editCar.year ||
        newFuel !== editCar.fuelType ||
        newTransmission !== editCar.transmission ||
        newDrivetrain !== editCar.drivetrain ||
        newPowerHp !== editCar.powerHp ||
        newEngineCc !== editCar.engineCc ||
        newBodyType !== editCar.bodyType ||
        newColor !== editCar.color ||
        newVin !== editCar.vin ||
        newVatDeductible !== !!editCar.vatDeductible
      )
    : !!(newBrand || newModel || newVin || newPrice || newImages.length > 0);

  // 🛡️ Protecție Draft Volatil în sessionStorage (anti-refresh accidental) - doar pentru mașini noi
  useEffect(() => {
    if (isEditing || !isFormDirty) return;
    try {
      sessionStorage.setItem(draftStorageKey, JSON.stringify({
        brand: newBrand, model: newModel, vin: newVin, price: newPrice, year: newYear
      }));
    } catch (_) {}
  }, [newBrand, newModel, newVin, newPrice, newYear, isFormDirty, isEditing, draftStorageKey]);

  // ⌨️ Interceptare tasta Escape cu protecție date nesalvate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFormDirty) {
          setShowExitConfirm(true);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFormDirty, onClose]);

  // Listă Dotări disponibile pentru selecție rapidă (Catalog Unificat & Persistent)
  const [availableFeatures, setAvailableFeatures] = useState<string[]>(() => getAllAvailableFeatures());

  useEffect(() => {
    const handleFeaturesUpdated = () => {
      setAvailableFeatures(getAllAvailableFeatures());
    };
    window.addEventListener('rxm_features_updated', handleFeaturesUpdated);
    return () => {
      window.removeEventListener('rxm_features_updated', handleFeaturesUpdated);
    };
  }, []);

  // Ștergere completă a formularului (Clear / Reset All Fields)
  const handleResetForm = () => {
    setNewBrand('');
    setNewModel('');
    setNewVersionTrim('');
    setNewYear(2020);
    setNewMileage('');
    setNewPrice('');
    setNewVatDeductible(false);
    setNewFuel('Benzină');
    setNewTransmission('Automată');
    setNewDrivetrain('Față');
    setPowerKw(0);
    setNewPowerHp(0);
    setNewEngineCc(0);
    setNewBodyType('Hatchback');
    setNewColor('');
    setNewVin('');
    setNewCivNumber('');
    setNewDescription('');
    setEquipmentSheetText('');
    setSelectedFeatures([]);
    setNewImages([]);
    setNewVideoUrl('');
    setNewTiktokUrl('');
    setNewOlxUrl('');
    setAutoBranding(true);
    setParsedDocReview(null);
    setCivScanStep('');
    setCivScanProgress(0);
    setIsCivCollapsed(false);
    setCarDraftId(`car-${dealerSlug}-${Date.now()}`);
    setPublicIntentStatus('in_stock');
    setShowExitConfirm(false);
    try { sessionStorage.removeItem(draftStorageKey); } catch (_) {}
    showToast('🧹 Toate câmpurile formularului au fost golite complet.');
  };

  const toggleFeature = (feat: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    );
  };

  // Scanare Reală Documente (Cameră / Fișier / Mostră Test) conform Directivei 1999/37/CE & US Title
  const handleTriggerCivScan = async (source: ScanSource, countryKey: ScanCountryKey = 'AUTO') => {
    setIsScanningCiv(true);
    setCivScanProgress(10);

    if (source.type === 'file') {
      try {
        // Resetare preventivă a câmpurilor vechi pentru a evita persistența datelor eronate
        setNewBrand('');
        setNewModel('');
        setNewVersionTrim('');
        setNewVin('');
        setNewCivNumber('');
        setPowerKw(0);
        setNewPowerHp(0);
        setNewEngineCc(0);
        setNewColor('');
        setNewDescription('');
        setEquipmentSheetText('');

        const ocrResult = await processVehicleDocumentOcr(source.file, {
          countryHint: countryKey,
          rotation: source.rotation,
          onProgress: (p, msg) => {
            setCivScanProgress(p);
            setCivScanStep(msg);
          }
        });

        const doc = ocrResult.parsedDoc;
        setParsedDocReview(doc);

        const resolvedHp = doc.powerHp || (doc.powerKw ? Math.round(doc.powerKw * 1.35962) : 0);
        const resolvedKw = doc.powerKw || (doc.powerHp ? Math.round(doc.powerHp / 1.35962) : 0);

        if (doc.docOriginCountry) setDocOriginCountry(doc.docOriginCountry);
        if (doc.brand) setNewBrand(normalizeBrand(doc.brand));
        if (doc.model) setNewModel(doc.model);
        if (doc.versionTrim) {
          setNewVersionTrim(doc.versionTrim);
        } else if (doc.model) {
          setNewVersionTrim(`${doc.model}${resolvedHp ? ` ${resolvedHp} CP` : ''}`);
        }
        if (doc.year) setNewYear(doc.year);
        if (doc.mileageKm) setNewMileage(doc.mileageKm.toString());
        if (resolvedKw) setPowerKw(resolvedKw);
        if (resolvedHp) setNewPowerHp(resolvedHp);
        if (doc.engineCc) setNewEngineCc(doc.engineCc);
        if (doc.fuelType) setNewFuel(doc.fuelType);
        if (doc.color) setNewColor(doc.color);
        if (doc.vin) setNewVin(doc.vin);
        if (doc.civNumber) setNewCivNumber(doc.civNumber);
        if (doc.bodyType) setNewBodyType(doc.bodyType);
        if (doc.drivetrain) setNewDrivetrain(doc.drivetrain);
        if (doc.transmission) setNewTransmission(doc.transmission);

        // Descriere automată bazată pe datele extrase
        if (doc.brand && doc.model) {
          setNewDescription(
            `${doc.brand} ${doc.model} (${doc.year || 'An ' + newYear}) înmatriculat cu documente verificate (${doc.docOriginCountry}). ` +
            `TVA deductibil (21%), garanție conformitate 12 luni, istoric transparent și posibilitate finanțare avantajoasă.`
          );
        }

        setFormStep(1);
        setIsCivCollapsed(true);
        showToast(`🎉 Document scanat! Date extrase: ${doc.brand || ''} ${doc.model || ''} • VIN ${doc.maskedVin} • ${doc.powerHp ? doc.powerHp + ' CP' : ''}`);
      } catch (err: any) {
        console.error('Eroare procesare OCR:', err);
        showToast(`⚠️ ${sanitizePublicOcrError(err?.message || 'Nu s-a putut procesa documentul optic.')}`);
      } finally {
        setIsScanningCiv(false);
      }
      return;
    }

    // Mostre Test Demo 1-Click (fără fișier local)
    const presetKey = source.presetKey;
    if (countryKey === 'AUTO') {
      setCivScanStep('📸 Analiză optică & clasificare automată antet document (steme / emitent)...');
    } else if (countryKey === 'AT' || presetKey === 'nissan') {
      setCivScanStep('📸 Calibrare optică Zulassungsbescheinigung Austria (KFG 1967)...');
    } else if (countryKey === 'OTHER') {
      setCivScanStep('📸 Calibrare optică format internațional (Olanda / Belgia / SUA Title)...');
    } else {
      setCivScanStep(`📸 Calibrare optică & detectare margini document [${countryKey}]...`);
    }

    setTimeout(() => {
      setCivScanProgress(45);
      if (countryKey === 'AUTO') {
        setCivScanStep('🌍 Format detectat automat • Extragere date principale...');
      } else if (countryKey === 'AT' || presetKey === 'nissan') {
        setCivScanStep('🇦🇹 Decodare Zulassungsbescheinigung Austria (KFG 1967) & Serie VIN...');
      } else if (countryKey === 'OTHER' || presetKey === 'ford') {
        setCivScanStep('🔍 Recunoaștere document SUA & decodare serie VIN...');
      } else {
        setCivScanStep(`🔍 Extragere Serie Șasiu (VIN) & An Fabricație...`);
      }
    }, 400);

    setTimeout(() => {
      setCivScanProgress(75);
      if (countryKey === 'AUTO' || presetKey === 'volvo') {
        setCivScanStep('⚙️ Calculare putere motor (CP), cilindree, protecție VIN...');
      } else if (countryKey === 'AT' || presetKey === 'nissan') {
        setCivScanStep('⚙️ Conversie putere 81 kW ➔ 110 CP, verificare cod K9K & emisii CO2...');
      } else if (countryKey === 'OTHER' || presetKey === 'ford') {
        setCivScanStep('⚙️ Conversie Odometru (Mile → Km) & Putere motor (CP)...');
      } else {
        setCivScanStep(`⚙️ Extragere date motor (CP), cilindree și combustibil...`);
      }
    }, 800);

    setTimeout(() => {
      setCivScanProgress(100);
      setCivScanStep('✅ Date extrase și completate automat din CIV / Talon!');

      if (presetKey === 'nissan' || countryKey === 'AT') {
        setDocOriginCountry('AT');
        setNewBrand('Nissan');
        setNewModel('Qashqai');
        setNewVersionTrim('1.5 dCi J11 Acenta (110 CP)');
        setNewYear(2015);
        setNewMileage('148500');
        setNewPrice('11900');
        setNewFuel('Diesel');
        setNewTransmission('Manuală');
        setNewDrivetrain('Față');
        setPowerKw(81);
        setNewPowerHp(110);
        setNewEngineCc(1461);
        setNewBodyType('SUV');
        setNewColor('Alb');
        setNewVin('SJNFAAJ11U1120210');
        setNewCivNumber('AT-202676');
        setNewVatDeductible(false);
        setNewVideoUrl('');
        setNewTiktokUrl('');
        setSelectedFeatures(['Climatronic Automat', 'Navigație Mare', 'Senzori Parcare Față/Spate', 'Faruri LED', 'Pilot Automat', 'Geamuri Fumurii']);
        setEquipmentSheetText('Pachet Dotări Austria (Zulassungsbescheinigung Teil I / KFG 1967):\n- Motorizare 1.5 dCi K9K (110 CP / 81 kW, Euro 5b)\n- Consum mixt omologat 3.8 l/100km, emisii CO2 99 g/km\n- Jante aliaj 16" (215/65 R16)\n- Climatizare automată dual-zone & asistență plecare din rampă');
        setNewDescription('Nissan Qashqai J11 1.5 dCi Acenta (110 CP) importat recent din Austria (Zulassungsbescheinigung Teil I verificat conform KFG 1967, Uniqa St. Johann / Salzburg). Emisii 99 g CO2/km, consum redus 3.8 l/100km, revizii la zi, stare tehnică excelentă.');
        setParsedDocReview({
          docOriginCountry: 'AT',
          brand: 'Nissan',
          model: 'Qashqai',
          versionTrim: '1.5 dCi J11 Acenta (110 CP)',
          year: 2015,
          registrationDate: '09.04.2015',
          firstRegistrationDate: '09.04.2015',
          vin: 'SJNFAAJ11U1120210',
          isVinValid: true,
          maskedVin: 'SJN••••••••••0210',
          civNumber: 'AT-202676',
          powerKw: 81,
          powerHp: 110,
          engineCc: 1461,
          fuelType: 'Diesel',
          color: 'Alb',
          bodyType: 'SUV',
          transmission: 'Manuală',
          drivetrain: 'Față',
          confidenceScore: 98,
          extractedCodes: {
            'E': 'SJNFAAJ11U1120210',
            'B': '09.04.2015',
            'D.1': 'NISSAN',
            'D.3': 'QASHQAI',
            'P.1': '1461',
            'P.2': '81 kW (110 CP)',
            'P.3': 'Diesel',
            'R': 'WEISS',
            'A': 'AT-202676'
          },
          recognizedFieldsCount: 9,
          rawText: 'Zulassungsbescheinigung Teil I (KFG 1967) UNIQA St. Johann/Pongau',
          warnings: []
        });
      } else if (presetKey === 'volvo' || (countryKey === 'AUTO' && presetKey !== 'bmw' && presetKey !== 'audi' && presetKey !== 'jeep' && presetKey !== 'vw' && presetKey !== 'ford' && presetKey !== 'nissan')) {
        setDocOriginCountry('NL');
        setNewBrand('Volvo');
        setNewModel('XC60');
        setNewVersionTrim('2.0 B4 Mild Hybrid Geartronic Inscription AWD');
        setNewYear(2021);
        setNewMileage('118500');
        setNewPrice('29900');
        setNewFuel('Hibrid');
        setNewTransmission('Automată');
        setNewDrivetrain('4x4 / AWD');
        setPowerKw(145);
        setNewPowerHp(197);
        setNewEngineCc(1969);
        setNewBodyType('SUV');
        setNewColor('Crystal White Pearl');
        setNewVin('YV1UZ25KDM1849102');
        setNewCivNumber('NL9481028');
        setNewVatDeductible(true);
        setNewVideoUrl('');
        setNewTiktokUrl('');
        setSelectedFeatures(['Plafon Panoramic', 'Faruri Full LED', 'Distronic ACC', 'Camere 360°', 'Scaune Încălzite', 'Ventilație Scaune', 'Sistem Audio Premium (Bose/Logic 7)', 'Portbagaj Electric', 'Apple CarPlay & Android Auto']);
        setEquipmentSheetText('Pachet Dotări Olanda (Kentekencard RDW - Directiva 1999/37/CE):\n- Plafon panoramic din sticlă cu jaluzea solară\n- Faruri Full LED Active High Beam (Thor Hammer)\n- Sistem audio Harman Kardon Premium Sound\n- Camere 360° Surround View & Pilot Assist ACC');
        setNewDescription('Volvo XC60 B4 AWD Inscription importat recent din Olanda (istoric complet verificat RDW, Directiva 1999/37/CE). TVA deductibil (21%), tracțiune integrală, pachet complet de asistență la conducere și garanție 12 luni.');
      } else if (presetKey === 'ford' || countryKey === 'OTHER') {
        setDocOriginCountry('US');
        setNewBrand('Ford');
        setNewModel('Mustang');
        setNewVersionTrim('5.0 V8 GT Premium Fastback (10-Speed Auto)');
        setNewYear(2019);
        setNewMileage('72400');
        setNewPrice('31500');
        setNewFuel('Benzină');
        setNewTransmission('Automată');
        setNewDrivetrain('Spate');
        setPowerKw(331);
        setNewPowerHp(450);
        setNewEngineCc(5038);
        setNewBodyType('Coupe');
        setNewColor('Velocity Blue Metallic');
        setNewVin('1FA6P8CF9K5183920');
        setNewCivNumber('US8821941');
        setNewVatDeductible(false);
        setNewVideoUrl('');
        setNewTiktokUrl('');
        setSelectedFeatures(['Faruri Full LED', 'Sistem Audio Premium (Bose/Logic 7)', 'Apple CarPlay & Android Auto', 'Scaune Încălzite', 'Ventilație Scaune', 'Keyless Entry & Start', 'Camere 360°']);
        setEquipmentSheetText('Pachet Dotări SUA (Certificate of Title - State of Florida):\n- Motor 5.0 V8 Coyote 450 CP\n- Transmisie automată 10 trepte SelectShift\n- Evacuare activă cu mod Quad Exhaust\n- Pachet Premium Digital Cockpit 12 inch');
        setNewDescription('Ford Mustang GT Premium 5.0 V8 importat din SUA (Certificate of Title verificat, kilometraj convertit din 45.000 mile în 72.400 km). Istoric curat CarFax, omologare RAR finalizată, stare mecanică excelentă.');
      } else if (presetKey === 'bmw') {
        setDocOriginCountry('DE');
        setNewBrand('BMW');
        setNewModel('Seria 5');
        setNewVersionTrim('520d Steptronic Luxury Line (F10 LCI)');
        setNewYear(2018);
        setNewMileage('162000');
        setNewPrice('16900');
        setNewFuel('Diesel');
        setNewTransmission('Automată');
        setNewDrivetrain('Spate');
        setPowerKw(140);
        setNewPowerHp(190);
        setNewEngineCc(1995);
        setNewBodyType('Sedan');
        setNewColor('Negru Safir Metalizat');
        setNewVin('WBA5A51030D128914');
        setNewCivNumber('A12894109');
        setNewVatDeductible(false);
        setNewVideoUrl('');
        setNewTiktokUrl('');
        setSelectedFeatures(['Faruri Full LED', 'Soft Close', 'Virtual Cockpit', 'Head-Up Display (HUD)', 'Scaune Încălzite', 'Climatronic 2 Zone', 'Distronic ACC']);
        setEquipmentSheetText('Pachet Dotări Germania (Zulassungsbescheinigung):\n- Faruri Full LED Adaptive\n- Soft Close uși & portbagaj\n- Virtual Cockpit & HUD\n- Pachet Scaune Confort cu încălzire');
        setNewDescription('BMW Seria 5 520d Luxury Line importat recent din Germania (Zulassungsbescheinigung verificat), certificat RAR, carte de identitate CIV eliberată. Istoric verificabil, garanție 12 luni, stare mecanică și estetică excelentă.');
      } else if (presetKey === 'audi') {
        setDocOriginCountry('FR');
        setNewBrand('Audi');
        setNewModel('A4');
        setNewVersionTrim('2.0 TDI S-Tronic S-Line Avant');
        setNewYear(2019);
        setNewMileage('148000');
        setNewPrice('18500');
        setNewFuel('Diesel');
        setNewTransmission('Automată');
        setNewDrivetrain('Față');
        setPowerKw(140);
        setNewPowerHp(190);
        setNewEngineCc(1968);
        setNewBodyType('Break');
        setNewColor('Gri Daytona Perlat');
        setNewVin('WAUZZZF45KA092144');
        setNewCivNumber('B88201943');
        setNewVatDeductible(true);
        setNewVideoUrl('');
        setNewTiktokUrl('');
        setSelectedFeatures(['Faruri Full LED', 'Pachet M-Sport / S-Line / R-Line', 'Virtual Cockpit', 'Apple CarPlay & Android Auto', 'Scaune Încălzite', 'Senzori Parcare F/S']);
        setEquipmentSheetText('Pachet Dotări Franța (Carte Grise):\n- Pachet exterior & interior S-Line\n- Bord digital Virtual Cockpit\n- Scaune sport încălzite\n- Faruri Full LED');
        setNewDescription('Audi A4 Avant S-Line 2.0 TDI 190 CP cu TVA deductibil (21%). Carte Grise Franța completată, revizii la zi în rețeaua Audi, finanțare în rate fixe.');
      } else if (presetKey === 'jeep') {
        setDocOriginCountry('IT');
        setNewBrand('Jeep');
        setNewModel('Grand Cherokee');
        setNewVersionTrim('3.0 V6 MultiJet II Overland 4x4 (Panoramic / Nappa)');
        setNewYear(2015);
        setNewMileage('200000');
        setNewPrice('14490');
        setNewFuel('Diesel');
        setNewTransmission('Automată');
        setNewDrivetrain('4x4 / AWD');
        setPowerKw(184);
        setNewPowerHp(250);
        setNewEngineCc(2987);
        setNewBodyType('SUV');
        setNewColor('Negru Diamond Crystal');
        setNewVin('1C4RJFBM7FC581224');
        setNewCivNumber('IT7741029');
        setNewVatDeductible(false);
        setNewVideoUrl('');
        setNewTiktokUrl('');
        setSelectedFeatures(['Plafon Panoramic', 'Scaune Încălzite', 'Ventilație Scaune', 'Faruri Bi-Xenon Adaptive', 'Keyless Entry & Start']);
        setEquipmentSheetText('Pachet Dotări Italia (Carta di Circolazione):\n- Suspensie pneumatică Quadra-Lift\n- Tapițerie piele Nappa Overland\n- Plafon panoramic CommandView');
        setNewDescription('Jeep Grand Cherokee Overland 3.0 V6 250 CP importat din Italia (Carta di Circolazione verificată). Nivel de echipare maxim, tracțiune integrală cu reductor.');
      } else {
        setDocOriginCountry('RO');
        setNewBrand('Volkswagen');
        setNewModel('Tiguan');
        setNewVersionTrim('2.0 TDI 4Motion DSG Highline');
        setNewYear(2020);
        setNewMileage('119000');
        setNewPrice('21900');
        setNewFuel('Diesel');
        setNewTransmission('Automată');
        setNewDrivetrain('4x4 / AWD');
        setPowerKw(140);
        setNewPowerHp(190);
        setNewEngineCc(1968);
        setNewBodyType('SUV');
        setNewColor('Alb Pure White');
        setNewVin('WVGZZZ5NZLW039281');
        setNewCivNumber('C55920199');
        setNewVatDeductible(true);
        setNewVideoUrl('');
        setNewTiktokUrl('');
        setSelectedFeatures(['Plafon Panoramic', 'Faruri Full LED', 'Distronic ACC', 'Camere 360°', 'Portbagaj Electric', 'Scaune Încălzite']);
        setEquipmentSheetText('Pachet Dotări România (CIV RAR & Talon):\n- Faruri Full LED & Camere 360°\n- Plafon panoramic glisant\n- Tracțiune integrală 4Motion');
        setNewDescription('Volkswagen Tiguan 4Motion Highline 4x4 înmatriculat în România (CIV RAR eliberată). TVA deductibil (21%), tracțiune integrală, bord digital, trapă panoramică.');
      }

      setIsScanningCiv(false);
      setIsCivCollapsed(true);
      showToast('🎉 Document scanat! Datele tehnice au fost convertite armonizat și formularul completat.');
    }, 1200);
  };

  // 💾 Salvare Rapidă la Pasul 2 (Persistență Bază de Date — Fără fotografii obligatorii)
  const handleQuickSave = async () => {
    if (editCar) {
      return handleCreateCar();
    }
    if (!newModel || !newPrice || parseFloat(newPrice) <= 0) {
      showToast('⚠️ Completați cel puțin Modelul și Prețul pentru salvare.');
      return;
    }
    const rawCui = (dealer?.cui || 'RO48482214').replace(/[^0-9]/g, '') || '48482214';
    const resolvedVin = newVin || `RO${rawCui}${dealerPrefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const resolvedStockNumber = `${dealerPrefix}-${resolvedVin.slice(-4).toUpperCase()}`;
    const created: VehicleItem = {
      id: carDraftId,
      dealerSlug: dealerSlug,
      stockNumber: resolvedStockNumber,
      brand: normalizeBrand(newBrand) || 'Brand',
      model: newModel,
      versionTrim: newVersionTrim || `${newModel} ${newPowerHp ? `${newPowerHp} CP` : ''}`.trim(),
      year: Number(newYear) || 2020,
      mileageKm: Number(newMileage) || 0,
      priceEur: Number(newPrice),
      vatDeductible: newVatDeductible,
      fuelType: newFuel,
      transmission: newTransmission,
      powerHp: Number(newPowerHp) || 0,
      engineCc: Number(newEngineCc) || 0,
      bodyType: newBodyType,
      drivetrain: newDrivetrain,
      color: newColor || 'Nedefinit',
      vin: resolvedVin,
      isVinPublic: isVinPublic,
      docOriginCountry: docOriginCountry,
      equipmentSheetText: equipmentSheetText || '',
      olxUrl: newOlxUrl ? newOlxUrl.trim() : undefined,
      olxId: extractOlxId(newOlxUrl) || undefined,
      olxStatus: 'unlinked',
      olxDiscrepancy: 'none',
      warrantyMonths: newWarranty,
      status: publicIntentStatus,
      stockEntryDate: new Date().toISOString().split('T')[0],
      hasRedPlates: hasRedPlates,
      redPlatesExpiresAt: hasRedPlates && redPlatesExpiresAt ? redPlatesExpiresAt : undefined,
      itpExpiresAt: itpExpiresAt || undefined,
      rarAppointmentDate: rarAppointmentDate || undefined,
      images: [],
      videoUrl: newVideoUrl.trim() || undefined,
      tiktokUrl: newTiktokUrl.trim() || undefined,
      features: (() => {
        const cat = categorizeFeatures(selectedFeatures);
        return {
          safety: cat.safety,
          comfort: [...cat.comfort, ...cat.dynamic],
          multimedia: cat.tech
        };
      })(),
      description: newDescription || `${newBrand} ${newModel} — date complete în curs de actualizare.`
    };

    try {
      const result = await vehicleRepository.saveVehicle(created, dealerSlug);
      onAddCar(result.vehicle);
      onClose();
      setFormStep(1);
      handleResetForm();
      setShowExitConfirm(false);
      try { sessionStorage.removeItem(draftStorageKey); } catch (_) {}
      showToast(
        publicIntentStatus === 'preparing'
          ? `🟡 ${created.brand} ${created.model} a fost salvat ca «În Pregătire» în baza de date!`
          : `🎉 ${created.brand} ${created.model} a fost salvat ca «În Stoc» în baza de date!`
      );
    } catch (err) {
      console.error('Eroare salvare vehicul în baza de date:', err);
      onAddCar(created);
      onClose();
      showToast(`⚠️ Salvarea în baza de date a eșuat, dar vehiculul a fost adăugat temporar.`);
    }
  };

  // Salvare Mașină (Nouă sau Editată) din Formular (1-Button Publish / Update)
  const handleCreateCar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newModel || !newPrice) {
      showToast('⚠️ Vă rugăm să completați cel puțin Modelul și Prețul mașinii.');
      return;
    }

    setPublishState({
      isPublishing: true,
      stage: 'uploading_photos',
      progressCurrent: 0,
      progressTotal: newImages.length,
    });
    setIsUploadingPhotos(true);
    setUploadProgress(10);

    const rawCui = (dealer?.cui || 'RO48482214').replace(/[^0-9]/g, '') || '48482214';
    const resolvedVin = newVin || (editCar?.vin ?? `RO${rawCui}${dealerPrefix}${Math.floor(1000 + Math.random() * 9000)}`);
    const resolvedStockNumber = editCar?.stockNumber || `${dealerPrefix}-${resolvedVin.slice(-4).toUpperCase()}`;
    const resolvedStatus = (editCar && (editCar.status === 'sold' || editCar.status === 'reserved'))
      ? editCar.status
      : publicIntentStatus;

    try {
      // ── Pas 1: Upload fotografii pe Serverul VPS / Cloud ──
      let cdnImages: string[] = [];
      if (newImages.length > 0) {
        cdnImages = await uploadCarImagesBatch(
          carDraftId,
          newImages,
          dealerSlug,
          (curr, total, pct) => {
            setUploadProgress(pct);
            setPublishState(prev => ({
              ...prev,
              progressCurrent: curr,
              progressTotal: total,
            }));
          }
        );
      } else {
        cdnImages = editCar ? (editCar.images || []) : [];
        setUploadProgress(90);
      }

      // ── Pas 2: Audit log pentru modificări (Mod Editare) ──
      const auditLog: VehicleAuditEntry[] = editCar ? [...(editCar.auditLog || [])] : [];
      if (editCar) {
        const changes: string[] = [];
        const normBrand = normalizeBrand(newBrand);
        if (normBrand !== editCar.brand) changes.push(`Marcă: "${editCar.brand}" → "${normBrand}"`);
        if (newModel !== editCar.model) changes.push(`Model: "${editCar.model}" → "${newModel}"`);
        if ((newVersionTrim || '') !== (editCar.versionTrim || '')) changes.push(`Versiune: "${editCar.versionTrim || 'N/A'}" → "${newVersionTrim || 'N/A'}"`);
        if (Number(newMileage) !== editCar.mileageKm) changes.push(`Kilometraj: ${editCar.mileageKm.toLocaleString('ro-RO')} km → ${Number(newMileage).toLocaleString('ro-RO')} km`);
        if (Number(newPrice) !== editCar.priceEur) changes.push(`Preț: ${editCar.priceEur.toLocaleString('ro-RO')} € → ${Number(newPrice).toLocaleString('ro-RO')} €`);
        if (Number(newYear) !== editCar.year) changes.push(`An: ${editCar.year} → ${newYear}`);
        if (newFuel !== editCar.fuelType) changes.push(`Combustibil: ${editCar.fuelType} → ${newFuel}`);
        if (newTransmission !== editCar.transmission) changes.push(`Cutie: ${editCar.transmission} → ${newTransmission}`);
        if (Number(newPowerHp) !== editCar.powerHp) changes.push(`Putere: ${editCar.powerHp} CP → ${newPowerHp} CP`);
        if (Number(newEngineCc) !== editCar.engineCc) changes.push(`Cilindree: ${editCar.engineCc} cm³ → ${newEngineCc} cm³`);
        if (newColor !== editCar.color) changes.push(`Culoare: "${editCar.color}" → "${newColor}"`);
        if (newVin !== editCar.vin) changes.push(`VIN: "${editCar.vin}" → "${newVin}"`);
        if (newVatDeductible !== !!editCar.vatDeductible) changes.push(`TVA: ${editCar.vatDeductible ? 'Deductibil 21%' : 'Regim Marjă'} → ${newVatDeductible ? 'Deductibil 21%' : 'Regim Marjă'}`);

        auditLog.unshift({
          id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          action: 'specs_updated',
          author: `Admin ${dealer?.name || 'Showroom'}`,
          title: 'Anunț vehicul editat',
          details: changes.length > 0 ? changes.join('; ') : 'Specificații actualizate din panoul administrativ.'
        });
      }

      // ── Pas 3: Construim VehicleItem cu URL-uri finale ──
      const savedCar: VehicleItem = {
        ...(editCar || {}),
        id: carDraftId,
        dealerSlug: dealerSlug || editCar?.dealerSlug || 'rxm',
        stockNumber: resolvedStockNumber,
        brand: normalizeBrand(newBrand),
        model: newModel,
        versionTrim: newVersionTrim || `${newModel} ${newPowerHp} CP`,
        year: Number(newYear),
        mileageKm: Number(newMileage) || 0,
        priceEur: Number(newPrice),
        vatDeductible: newVatDeductible,
        fuelType: newFuel,
        transmission: newTransmission,
        powerHp: Number(newPowerHp) || 190,
        engineCc: Number(newEngineCc) || 1995,
        bodyType: newBodyType,
        drivetrain: newDrivetrain,
        color: newColor || 'Negru Metalizat',
        vin: resolvedVin,
        isVinPublic: isVinPublic,
        docOriginCountry: docOriginCountry,
        civSeries: newCivNumber || editCar?.civSeries,
        equipmentSheetText: equipmentSheetText,
        olxUrl: newOlxUrl ? newOlxUrl.trim() : undefined,
        olxId: extractOlxId(newOlxUrl) || editCar?.olxId,
        olxStatus: newOlxUrl ? 'active' : (editCar?.olxStatus || 'unlinked'),
        olxDiscrepancy: 'none',
        lastOlxSyncAt: newOlxUrl ? new Date().toISOString() : editCar?.lastOlxSyncAt,
        warrantyMonths: newWarranty,
        status: resolvedStatus,
        stockEntryDate: editCar?.stockEntryDate || new Date().toISOString().split('T')[0],
        hasRedPlates: hasRedPlates,
        redPlatesExpiresAt: hasRedPlates && redPlatesExpiresAt ? redPlatesExpiresAt : undefined,
        itpExpiresAt: itpExpiresAt || undefined,
        rarAppointmentDate: rarAppointmentDate || undefined,
        images: cdnImages.length > 0 ? cdnImages : (editCar?.images || []),
        videoUrl: newVideoUrl.trim() || undefined,
        tiktokUrl: newTiktokUrl.trim() || undefined,
        features: (() => {
          const cat = categorizeFeatures(selectedFeatures);
          return {
            safety: cat.safety,
            comfort: [...cat.comfort, ...cat.dynamic],
            multimedia: cat.tech
          };
        })(),
        description: newDescription || `${newBrand} ${newModel} în stare excelentă, certificat RAR, carte de identitate CIV eliberată. Garanție inclusă.`,
        auditLog
      };

      // ── Pas 4: Salvare cloud + local simultan via vehicleRepository ──
      setPublishState(prev => ({ ...prev, stage: 'saving_record' }));
      const result = await vehicleRepository.saveVehicle(savedCar, dealerSlug);

      // ── Pas 5: Callback către App.tsx ──
      if (editCar && onUpdateCar) {
        onUpdateCar(result.vehicle);
      } else {
        onAddCar(result.vehicle);
      }

      // ── Pas 6: Toast de succes diferențiat ──
      setPublishState(prev => ({ ...prev, stage: 'success', isPublishing: false }));
      setIsUploadingPhotos(false);
      setUploadProgress(100);

      if (editCar) {
        showToast(`✓ Anunțul pentru ${savedCar.brand} ${savedCar.model} a fost actualizat cu succes pe server!`);
      } else if (result.storageDestination === 'cloud') {
        showToast(
          resolvedStatus === 'preparing'
            ? `🟡 Mașina ${savedCar.brand} ${savedCar.model} a fost salvată ca «În Pregătire» în baza de date! Puteți printa fișa A4 de parbriz.`
            : `🎉 ${savedCar.brand} ${savedCar.model} este acum LIVE pe site pentru toți vizitatorii!`
        );
      } else {
        showToast(
          resolvedStatus === 'preparing'
            ? `🟡 Mașina ${savedCar.brand} ${savedCar.model} a fost salvată ca «În Pregătire» în baza de date! Puteți printa fișa A4 de parbriz.`
            : `🎉 ${savedCar.brand} ${savedCar.model} a fost salvată ca «În Stoc» în baza de date!`
        );
      }

      // Cleanup
      onClose();
      setFormStep(1);
      if (!editCar) {
        handleResetForm();
      }
      setShowExitConfirm(false);
      try { sessionStorage.removeItem(draftStorageKey); } catch (_) {}
    } catch (err) {
      console.error('Eroare salvare mașină:', err);
      setPublishState(prev => ({ ...prev, stage: 'error', isPublishing: false, errorMessage: String(err) }));
      showToast('⚠️ A apărut o problemă la salvare. Modificările au fost salvate temporar.');
      setIsUploadingPhotos(false);

      if (editCar && onUpdateCar) {
        onUpdateCar({
          ...editCar,
          brand: normalizeBrand(newBrand) || editCar.brand,
          model: newModel,
          versionTrim: newVersionTrim,
          mileageKm: Number(newMileage) || editCar.mileageKm,
          priceEur: Number(newPrice) || editCar.priceEur,
        });
      } else {
        onAddCar({
          id: carDraftId,
          stockNumber: resolvedStockNumber,
          brand: normalizeBrand(newBrand),
          model: newModel,
          versionTrim: newVersionTrim || `${newModel} ${newPowerHp} CP`,
          year: Number(newYear),
          mileageKm: Number(newMileage) || 0,
          priceEur: Number(newPrice),
          vatDeductible: newVatDeductible,
          fuelType: newFuel,
          transmission: newTransmission,
          powerHp: Number(newPowerHp) || 190,
          engineCc: Number(newEngineCc) || 1995,
          bodyType: newBodyType,
          drivetrain: newDrivetrain,
          color: newColor || 'Negru Metalizat',
          vin: resolvedVin,
          warrantyMonths: newWarranty,
          status: resolvedStatus,
          images: newImages,
          features: { safety: [], comfort: [], multimedia: [] },
          description: newDescription || ''
        });
      }
    }
  };

  // 🔒 Lock background scroll pe body când modalul este deschis (previne rubber-banding pe iOS)
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={() => isFormDirty ? setShowExitConfirm(true) : onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0.5rem))] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121215] border border-white/[0.12] text-white w-full max-w-3xl max-h-[92vh] max-h-[92dvh] sm:max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-4 sm:p-6 relative my-auto animate-in zoom-in-95 duration-150"
      >
        <button 
          onClick={() => isFormDirty ? setShowExitConfirm(true) : onClose()}
          aria-label="Închide formularul"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors touch-manipulation active:scale-95 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5 pb-2.5 border-b border-white/[0.08] pr-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 ${
              editCar 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              {editCar ? <Edit3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {editCar ? (
                  <>
                    <span>Editează Anunț:</span>
                    <span className="text-amber-400 font-serif">{editCar.brand} {editCar.model}</span>
                    {editCar.versionTrim && (
                      <span className="text-xs text-zinc-400 font-normal hidden md:inline">({editCar.versionTrim})</span>
                    )}
                  </>
                ) : (
                  'Adăugare Mașină în Showroom'
                )}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {editCar ? (
                  <>
                    Ref: <span className="font-mono text-amber-300 font-semibold">{editCar.stockNumber || editCar.id}</span> • Modifică specificațiile, kilometrajul, versiunea, prețul sau dotările.
                  </>
                ) : (
                  'Înrolare stoc • Import automat din talon / CIV sau introducere manuală.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Buton Salvează Modificările Direct din Header în Mod Editare */}
            {editCar && (
              <button
                type="button"
                onClick={() => handleCreateCar()}
                disabled={publishState.isPublishing || !newModel || !newPrice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                title="Salvează modificările aduse anunțului direct"
              >
                {publishState.isPublishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Se salvează...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Salvează Modificările</span>
                  </>
                )}
              </button>
            )}

            {/* 🚦 Selector Status Vehicul: În Stoc vs În Pregătire */}
            <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-xl border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setPublicIntentStatus('in_stock')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  publicIntentStatus === 'in_stock'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-sm'
                    : 'bg-transparent border-transparent text-zinc-400 hover:text-white'
                }`}
                title="Mașina va fi salvată «În Stoc» în showroom"
              >
                <span>🟢</span>
                <span>În Stoc</span>
              </button>
              <button
                type="button"
                onClick={() => setPublicIntentStatus('preparing')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  publicIntentStatus === 'preparing'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-sm'
                    : 'bg-transparent border-transparent text-zinc-400 hover:text-white'
                }`}
                title="Mașina va fi salvată «În Pregătire» (service, cosmetică, RAR)"
              >
                <span>🟡</span>
                <span>În Pregătire</span>
              </button>
            </div>

            {editCar ? (
              <button
                type="button"
                onClick={() => {
                  setNewBrand(editCar.brand || '');
                  setNewModel(editCar.model || '');
                  setNewVersionTrim(editCar.versionTrim || '');
                  setNewYear(editCar.year || 2020);
                  setNewMileage(editCar.mileageKm !== undefined ? String(editCar.mileageKm) : '');
                  setNewPrice(editCar.priceEur !== undefined ? String(editCar.priceEur) : '');
                  setNewVatDeductible(!!editCar.vatDeductible);
                  setNewFuel(editCar.fuelType || 'Benzină');
                  setNewTransmission(editCar.transmission || 'Automată');
                  setNewDrivetrain(editCar.drivetrain || 'Față');
                  setNewPowerHp(editCar.powerHp || 0);
                  setPowerKw(Math.round((editCar.powerHp || 0) * 0.7457));
                  setNewEngineCc(editCar.engineCc || 0);
                  setNewBodyType(editCar.bodyType || 'Hatchback');
                  setNewColor(editCar.color || '');
                  setNewVin(editCar.vin || '');
                  setIsVinPublic(!!editCar.isVinPublic);
                  setNewCivNumber(editCar.civSeries || '');
                  setHasRedPlates(!!editCar.hasRedPlates);
                  setRedPlatesExpiresAt(editCar.redPlatesExpiresAt || '');
                  setItpExpiresAt(editCar.itpExpiresAt || '');
                  setRarAppointmentDate(editCar.rarAppointmentDate || '');
                  setNewWarranty(editCar.warrantyMonths || 12);
                  setNewVideoUrl(editCar.videoUrl || '');
                  setNewTiktokUrl(editCar.tiktokUrl || '');
                  setNewOlxUrl(editCar.olxUrl || '');
                  setNewDescription(editCar.description || '');
                  setEquipmentSheetText(editCar.equipmentSheetText || '');
                  const allFeats = [
                    ...(editCar.features?.safety || []),
                    ...(editCar.features?.comfort || []),
                    ...(editCar.features?.multimedia || [])
                  ];
                  setSelectedFeatures(allFeats.length > 0 ? allFeats : []);
                  setNewImages(editCar.images || []);
                  showToast('🔄 Datele au fost resetate la valorile originale ale mașinii.');
                }}
                title="Resetează modificările nesalvate"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10 active:scale-95 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetForm}
                title="Golește toate câmpurile formularului"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/25 active:scale-95 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>Golește</span>
              </button>
            )}
          </div>
        </div>

        {/* 📸 HERO SECȚIUNE: SCANARE INTELIGENTĂ CIV (OCR REAL) */}
        <CivScanHero 
          onScan={handleTriggerCivScan}
          isScanning={isScanningCiv}
          scanStep={civScanStep}
          scanProgress={civScanProgress}
          onResetForm={handleResetForm}
          isCollapsed={isCivCollapsed}
          onToggleCollapse={() => setIsCivCollapsed(prev => !prev)}
          summaryText={
            parsedDocReview
              ? `${parsedDocReview.brand || newBrand || 'Vehicul'} ${parsedDocReview.model || newModel || ''} • VIN ${parsedDocReview.maskedVin || newVin} • ${parsedDocReview.powerHp || newPowerHp ? (parsedDocReview.powerHp || newPowerHp) + ' CP' : ''} (${parsedDocReview.confidenceScore || 95}% Încredere)`
              : newBrand && newModel
                ? `${newBrand} ${newModel} • VIN ${newVin || 'Completat'} • ${newPowerHp ? newPowerHp + ' CP' : ''}`
                : undefined
          }
        />

        {/* 📋 REZUMAT DATE EXTRASE DIN DOCUMENT */}
        {parsedDocReview && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Date Extrase cu Succes din Document ({parsedDocReview.confidenceScore}% Încredere)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  title="Golește toate câmpurile formularului"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Golește formularul</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParsedDocReview(null)}
                  className="text-[10px] text-zinc-400 hover:text-white"
                >
                  Închide rezumat
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-300 font-mono">
              <div>
                <span className="text-zinc-500">VIN: </span>
                <span className="font-bold text-white">{parsedDocReview.maskedVin}</span>
              </div>
              <div>
                <span className="text-zinc-500">Putere: </span>
                <span className="font-bold text-white">{parsedDocReview.powerHp ? `${parsedDocReview.powerHp} CP (${parsedDocReview.powerKw} kW)` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500">Cilindree: </span>
                <span className="font-bold text-white">{parsedDocReview.engineCc ? `${parsedDocReview.engineCc} cm³` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500">An Fabricație: </span>
                <span className="font-bold text-white">{parsedDocReview.year || 'N/A'}</span>
              </div>
            </div>

            {parsedDocReview.warnings.length > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[10px] text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Atenție: {parsedDocReview.warnings.join(' • ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Pasi Formular (Navigare Segmentată 4 Etape) */}
        <div className="mb-5 p-1 rounded-2xl bg-black/60 border border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button 
            type="button"
            onClick={() => setFormStep(1)} 
            className={`min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold touch-manipulation active:scale-[0.98] cursor-pointer ${
              formStep === 1 
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="truncate">1. Date Tehnice</span>
          </button>
          <button 
            type="button"
            onClick={() => setFormStep(2)} 
            className={`min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold touch-manipulation active:scale-[0.98] cursor-pointer ${
              formStep === 2 
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="truncate">2. Preț & TVA 21%</span>
          </button>

          <button 
            type="button"
            onClick={() => setFormStep(3)} 
            className={`min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold touch-manipulation active:scale-[0.98] cursor-pointer ${
              formStep === 3 
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="truncate">3. Dotări ({selectedFeatures.length})</span>
          </button>
          <button 
            type="button"
            onClick={() => setFormStep(4)} 
            className={`min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold touch-manipulation active:scale-[0.98] cursor-pointer ${
              formStep === 4 
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="truncate">4. Poze {newImages.length > 0 ? `(${newImages.length})` : ''} & Video</span>
          </button>
        </div>

        {/* Formular Propriu-Zis */}
        <form onSubmit={handleCreateCar} className="space-y-4 text-xs">
          
          {/* PASUL 1: DATE TEHNICE */}
          {formStep === 1 && (
            <StepTechData 
              newBrand={newBrand}
              setNewBrand={setNewBrand}
              newModel={newModel}
              setNewModel={setNewModel}
              newVersionTrim={newVersionTrim}
              setNewVersionTrim={setNewVersionTrim}
              newYear={newYear}
              setNewYear={setNewYear}
              newMileage={newMileage}
              setNewMileage={setNewMileage}
              newPowerHp={newPowerHp}
              setNewPowerHp={setNewPowerHp}
              powerKw={powerKw}
              setPowerKw={setPowerKw}
              newEngineCc={newEngineCc}
              setNewEngineCc={setNewEngineCc}
              newFuel={newFuel}
              setNewFuel={setNewFuel}
              newTransmission={newTransmission}
              setNewTransmission={setNewTransmission}
              newDrivetrain={newDrivetrain}
              setNewDrivetrain={setNewDrivetrain}
              newBodyType={newBodyType}
              setNewBodyType={setNewBodyType}
              newVin={newVin}
              setNewVin={setNewVin}
              isVinPublic={isVinPublic}
              setIsVinPublic={setIsVinPublic}
              docOriginCountry={docOriginCountry}
              setDocOriginCountry={setDocOriginCountry}
              newCivNumber={newCivNumber}
              setNewCivNumber={setNewCivNumber}
              hasRedPlates={hasRedPlates}
              setHasRedPlates={setHasRedPlates}
              redPlatesExpiresAt={redPlatesExpiresAt}
              setRedPlatesExpiresAt={setRedPlatesExpiresAt}
              itpExpiresAt={itpExpiresAt}
              setItpExpiresAt={setItpExpiresAt}
              rarAppointmentDate={rarAppointmentDate}
              setRarAppointmentDate={setRarAppointmentDate}
              onNext={() => setFormStep(2)}
            />
          )}

          {/* PASUL 2: PREȚ & TVA 21% & FINANȚARE */}
          {formStep === 2 && (
            <StepPriceVat 
              newPrice={newPrice}
              setNewPrice={setNewPrice}
              newWarranty={newWarranty}
              setNewWarranty={setNewWarranty}
              newVatDeductible={newVatDeductible}
              setNewVatDeductible={setNewVatDeductible}
              carDraftId={carDraftId}
              carBrand={newBrand}
              carModel={newModel}
              newModel={newModel}
              carVersionTrim={newVersionTrim}
              carYear={newYear}
              carMileage={newMileage}
              carTransmission={newTransmission}
              carFuel={newFuel}
              onOpenComparator={() => setIsComparatorOpen(true)}
              onPrev={() => setFormStep(1)}
              onNext={() => setFormStep(3)}
              onQuickSave={handleQuickSave}
            />
          )}

          {/* PASUL 3: DOTĂRI & ECHIPARE */}
          {formStep === 3 && (
            <StepFeatures 
              selectedFeatures={selectedFeatures}
              toggleFeature={toggleFeature}
              availableFeatures={availableFeatures}
              onFeaturesUpdated={(updated) => setAvailableFeatures(updated)}
              equipmentSheetText={equipmentSheetText}
              setEquipmentSheetText={setEquipmentSheetText}
              newDescription={newDescription}
              setNewDescription={setNewDescription}
              carBrand={newBrand}
              carModel={newModel}
              carVersionTrim={newVersionTrim}
              setCarVersionTrim={setNewVersionTrim}
              carYear={newYear}
              carMileage={newMileage}
              carFuel={newFuel}
              carTransmission={newTransmission}
              carPowerHp={newPowerHp}
              carEngineCc={newEngineCc}
              carDrivetrain={newDrivetrain}
              vatDeductible={newVatDeductible}
              warrantyMonths={newWarranty}
              showToast={showToast}
              onPrev={() => setFormStep(2)}
              onNext={() => setFormStep(4)}
            />
          )}

          {/* PASUL 4: FOTOGRAFII, VIDEO TIKTOK & DESCRIERE */}
          {formStep === 4 && (
            <StepMediaUpload 
              carId={carDraftId}
              newTiktokUrl={newTiktokUrl}
              setNewTiktokUrl={setNewTiktokUrl}
              newVideoUrl={newVideoUrl}
              setNewVideoUrl={setNewVideoUrl}
              newOlxUrl={newOlxUrl}
              setNewOlxUrl={setNewOlxUrl}
              newDescription={newDescription}
              setNewDescription={setNewDescription}
              isUploadingPhotos={isUploadingPhotos}
              uploadProgress={uploadProgress}
              onPrev={() => setFormStep(3)}
              autoBranding={autoBranding}
              setAutoBranding={setAutoBranding}
              images={newImages}
              setImages={setNewImages}
              showToast={showToast}
              publishStage={publishState.stage}
              publishProgress={{ current: publishState.progressCurrent, total: publishState.progressTotal }}
              vehicleStatus={publicIntentStatus}
            />
          )}

        </form>

        {/* Modal Comparator Preț Piață (Nod Sami S9 GSM) pentru mașina în curs de adăugare */}
        <MarketPriceComparatorModal
          isOpen={isComparatorOpen}
          car={{
            id: carDraftId,
            stockNumber: 'NOU',
            brand: normalizeBrand(newBrand) || 'Brand',
            model: newModel || 'Model',
            versionTrim: newVersionTrim || '',
            year: newYear || 2018,
            mileageKm: Number(newMileage) || 160000,
            priceEur: Number(newPrice) || 0,
            status: 'in_stock',
            transmission: newTransmission as any,
            fuelType: newFuel as any,
            bodyType: newBodyType as any,
            drivetrain: newDrivetrain as any,
            powerHp: newPowerHp || 150,
            engineCc: newEngineCc || 1995,
            color: newColor || 'Negru',
            vin: newVin || `${dealerPrefix}-DRAFT-0000`,
            images: [],
            features: {
              safety: selectedFeatures.filter(f => /Senzor|Asistent|Camera|Distronic|Lane|LED|Xenon/i.test(f)),
              comfort: selectedFeatures.filter(f => /Scaun|Climatronic|Plafon|Trapa|Masaj|Piele|Keyless/i.test(f)),
              multimedia: selectedFeatures.filter(f => /Virtual|Cockpit|Navig|Audio|CarPlay|Bose|Logic/i.test(f))
            },
            description: newDescription || '',
            warrantyMonths: newWarranty,
            vatDeductible: newVatDeductible
          }}
          onClose={() => setIsComparatorOpen(false)}
          onApplyPrice={(price) => {
            setNewPrice(price.toString());
            setIsComparatorOpen(false);
            showToast(`Prețul a fost setat automat din piață la: ${price.toLocaleString('ro-RO')} €`);
          }}
          showToast={showToast}
        />

        {/* ⚠️ Dialog Protecție Date Nesalvate la Închidere (Ticket 03) */}
        {showExitConfirm && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          >
            <div className="bg-[#1a1a1d] border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150 text-left">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-white text-base mb-1">Date nesalvate</h4>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                    Aveți modificări nesalvate în formular. Dacă ieșiți acum, datele completate se vor pierde definitiv.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    handleQuickSave();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-semibold text-xs sm:text-sm hover:bg-emerald-500/30 transition-colors cursor-pointer"
                >
                  💾 Salvează Vehiculul
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    handleResetForm();
                    try { sessionStorage.removeItem('rxm_vehicle_draft_in_progress'); } catch (_) {}
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 font-semibold text-xs sm:text-sm hover:bg-rose-500/25 transition-colors cursor-pointer"
                >
                  🗑️ Renunță & Închide
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ← Continuă Editarea
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
