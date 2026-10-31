import React, { Suspense } from 'react';
import { VehicleItem } from '../../db/seed';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { DEFAULT_LANDING_CONFIG } from '../../db/dealer';

// MPI Auto Bespoke Components (§5)
import { TrustBand } from './TrustBand';
import { MpiSpecialOffersCarousel } from './MpiSpecialOffersCarousel';
import { MpiVehicleCatalog } from './MpiVehicleCatalog';
import { MpiFinancingSection } from './MpiFinancingSection';
import { WarrantyDepositSection } from './WarrantyDepositSection';
import { WarrantyPlansSection } from './WarrantyPlansSection';
import { ServicesSection } from './ServicesSection';
import { MpiGoogleReviewsSection } from './MpiGoogleReviewsSection';
import { ContactMapSection } from './ContactMapSection';

// RXM Automobile Bespoke Components (Exact Original Registry)
import { VehicleCatalog } from './VehicleCatalog';
import { WhyChooseUs } from './WhyChooseUs';
import { FinancingSection } from './FinancingSection';
import { BuyBackSection } from './BuyBackSection';
import { CustomOrderSection } from './CustomOrderSection';
import { GoogleReviewsSection } from './GoogleReviewsSection';

const DealerHeroAdapter = React.lazy(() => import('./DealerHeroAdapter'));

export interface LandingSectionOrchestratorProps {
  dealer: DealerProfile;
  landingConfig?: DealerLandingConfig;
  vehicles: VehicleItem[];
  publicVehicles: VehicleItem[];
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines', format?: 'tiktok' | 'youtube') => void;
  showToast: (msg: string) => void;
  isRevealed?: boolean;
}

export const LandingSectionOrchestrator: React.FC<LandingSectionOrchestratorProps> = ({
  dealer,
  landingConfig: lc,
  vehicles,
  publicVehicles,
  onSelectCar,
  showToast,
  isRevealed = true,
}) => {
  const cfg = lc ?? DEFAULT_LANDING_CONFIG;
  const isMpi = dealer.slug === 'mpi_auto' || dealer.themePreset === 'mpi_signature';

  // 🏁 1. Pentru mpi_signature / MPI Auto: succesiune strictă conform specificației §5
  if (isMpi) {
    return (
      <main className="no-print">
        {/* 5.2 Hero (6/6 Split + Căutare Compactă) */}
        {cfg.visibleSections?.heroCinematic !== false && (
          <Suspense fallback={<div className="min-h-screen bg-[var(--bg,#0B0F16)]" />}>
            <DealerHeroAdapter
              tenant={dealer}
              landingConfig={cfg}
              cars={publicVehicles}
              onSelectCar={(car) => onSelectCar(car, 'specs')}
              isRevealed={isRevealed}
            />
          </Suspense>
        )}

        {/* 5.3 Bandă de încredere (#2E3643 + Parteneri) */}
        <TrustBand 
          dealer={dealer} 
          totalCarsCount={publicVehicles.length}
          landingConfig={cfg} 
        />

        {/* 5.4 Oferte Speciale (Un singur carusel + Notă Omnibus) */}
        <MpiSpecialOffersCarousel 
          cars={publicVehicles}
          onSelectCar={onSelectCar}
          dealer={dealer}
          maxItems={6}
        />

        {/* 5.5 Catalogul de stoc (#catalog) */}
        {cfg.visibleSections?.vehicleCatalog !== false && (
          <MpiVehicleCatalog
            cars={publicVehicles}
            onSelectCar={onSelectCar}
            dealer={dealer}
            landingConfig={cfg}
          />
        )}

        {/* 5.6 Finanțare (#finantare - Simulator pe --surface) */}
        {cfg.visibleSections?.financingSection !== false && (
          <MpiFinancingSection
            cars={publicVehicles}
            dealer={dealer}
          />
        )}

        {/* 5.7 Cont de Garanție (#cont-garantie) */}
        <WarrantyDepositSection
          dealer={dealer}
          landingConfig={cfg}
        />

        {/* 5.8 Garanție Extinsă MPI Car Protect (#garantie) */}
        <WarrantyPlansSection
          dealer={dealer}
          landingConfig={cfg}
        />

        {/* 5.9 Servicii & Buy-Back (#servicii) */}
        <ServicesSection
          dealer={dealer}
          landingConfig={cfg}
          showToast={showToast}
        />

        {/* 5.10 Recenzii Clienți (#recenzii) */}
        {cfg.visibleSections?.googleReviewsSection !== false && (
          <MpiGoogleReviewsSection
            dealer={dealer}
          />
        )}

        {/* 5.11 Contact și Hartă Showroom (#contact) */}
        <ContactMapSection
          dealer={dealer}
          landingConfig={cfg}
        />
      </main>
    );
  }

  // 🏆 2. Pentru RXM Automobile & alți tenanți: LAYOUT ORIGINAL RXM INTEGRAL RESTAURAT
  const s = cfg.visibleSections;

  const defaultOrder = [
    'HERO_SPOTLIGHT',
    'VEHICLE_CATALOG',
    'FINANCING',
    'BUY_BACK',
    'GOOGLE_REVIEWS',
    'WHY_CHOOSE_US',
    'CUSTOM_ORDER',
  ];
  const activeOrder = (dealer.config as any)?.layout?.sectionsOrder || defaultOrder;

  const registry: Record<string, React.ReactNode> = {
    HERO_SPOTLIGHT: s.heroCinematic ? (
      <Suspense key="HERO_SPOTLIGHT" fallback={<div className="min-h-screen bg-[#09090b]" />}>
        <DealerHeroAdapter
          tenant={dealer}
          landingConfig={cfg}
          cars={publicVehicles}
          onSelectCar={(car) => onSelectCar(car, 'specs')}
          isRevealed={isRevealed}
        />
      </Suspense>
    ) : null,
    VEHICLE_CATALOG: s.vehicleCatalog ? (
      <VehicleCatalog 
        key="VEHICLE_CATALOG"
        cars={publicVehicles}
        onSelectCar={onSelectCar}
        dealer={dealer}
        landingConfig={cfg}
      />
    ) : null,
    FINANCING: s.financingSection ? (
      <FinancingSection 
        key="FINANCING"
        cars={publicVehicles}
        dealer={dealer}
      />
    ) : null,
    BUY_BACK: s.buyBackSection ? (
      <BuyBackSection 
        key="BUY_BACK"
        cars={publicVehicles}
        dealer={dealer}
        showToast={showToast}
      />
    ) : null,
    GOOGLE_REVIEWS: s.googleReviewsSection ? (
      <GoogleReviewsSection key="GOOGLE_REVIEWS" dealer={dealer} />
    ) : null,
    WHY_CHOOSE_US: s.whyChooseUs ? (
      <WhyChooseUs key="WHY_CHOOSE_US" dealer={dealer} />
    ) : null,
    CUSTOM_ORDER: s.customOrderSection ? (
      <CustomOrderSection 
        key="CUSTOM_ORDER"
        dealer={dealer}
        showToast={showToast}
      />
    ) : null,
  };

  return (
    <main className="no-print">
      {activeOrder.map((sectionKey: string) => registry[sectionKey] || null)}
    </main>
  );
};

export default LandingSectionOrchestrator;
