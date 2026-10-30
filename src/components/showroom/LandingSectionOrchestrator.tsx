import React, { Suspense } from 'react';
import { VehicleItem } from '../../db/seed';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { DEFAULT_LANDING_CONFIG } from '../../db/dealer';

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
