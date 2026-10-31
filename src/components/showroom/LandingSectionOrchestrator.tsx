import React, { Suspense } from 'react';
import { VehicleItem } from '../../db/seed';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { DEFAULT_LANDING_CONFIG } from '../../db/dealer';

import { TrustBand } from './TrustBand';
import { SpecialOffersCarousel } from './SpecialOffersCarousel';
import { VehicleCatalog } from './VehicleCatalog';
import { FinancingSection } from './FinancingSection';
import { WarrantyDepositSection } from './WarrantyDepositSection';
import { WarrantyPlansSection } from './WarrantyPlansSection';
import { ServicesSection } from './ServicesSection';
import { GoogleReviewsSection } from './GoogleReviewsSection';
import { ContactMapSection } from './ContactMapSection';

const DealerHeroAdapter = React.lazy(() => import('./DealerHeroAdapter'));

export interface LandingSectionOrchestratorProps {
  dealer: DealerProfile;
  landingConfig?: DealerLandingConfig;
  vehicles: VehicleItem[];
  publicVehicles: VehicleItem[];
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive', format?: 'tiktok' | 'youtube') => void;
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

  // Pentru mpi_signature / MPI Auto: succesiune strictă conform specificației §5
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
        <SpecialOffersCarousel 
          cars={publicVehicles}
          onSelectCar={onSelectCar}
          dealer={dealer}
          maxItems={6}
        />

        {/* 5.5 Catalogul de stoc (#catalog) */}
        {cfg.visibleSections?.vehicleCatalog !== false && (
          <VehicleCatalog
            cars={publicVehicles}
            onSelectCar={onSelectCar}
            dealer={dealer}
            landingConfig={cfg}
          />
        )}

        {/* 5.6 Finanțare (#finantare - Simulator pe --surface) */}
        {cfg.visibleSections?.financingSection !== false && (
          <FinancingSection
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
          <GoogleReviewsSection
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

  // Fallback configurabil pentru ceilalți tenanți (RXM, Top Auto)
  const s = cfg.visibleSections;
  return (
    <main className="no-print">
      {s.heroCinematic && (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
          <DealerHeroAdapter
            tenant={dealer}
            landingConfig={cfg}
            cars={publicVehicles}
            onSelectCar={(car) => onSelectCar(car, 'specs')}
            isRevealed={isRevealed}
          />
        </Suspense>
      )}

      <SpecialOffersCarousel 
        cars={publicVehicles}
        onSelectCar={onSelectCar}
        dealer={dealer}
      />

      {s.vehicleCatalog && (
        <VehicleCatalog 
          cars={publicVehicles}
          onSelectCar={onSelectCar}
          dealer={dealer}
          landingConfig={cfg}
        />
      )}

      {s.financingSection && (
        <FinancingSection 
          cars={publicVehicles}
          dealer={dealer}
        />
      )}

      <ServicesSection 
        dealer={dealer}
        landingConfig={cfg}
        showToast={showToast}
      />

      {s.googleReviewsSection && (
        <GoogleReviewsSection dealer={dealer} />
      )}

      <ContactMapSection 
        dealer={dealer}
        landingConfig={cfg}
      />
    </main>
  );
};
