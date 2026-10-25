import React from 'react';
import { DealerLandingConfig, DealerProfile } from '../../db/types';
import { VehicleItem } from '../../db/seed';
import { HeroSpotlight } from './HeroSpotlight';

// ShowroomVideoIntro este importat lazy pentru a nu mări bundle-ul inițial dacă dealerul folosește spotlight:
const ShowroomVideoIntro = React.lazy(() =>
  import('../saas/showcase/ShowroomVideoIntro').then(m => ({ default: m.ShowroomVideoIntro }))
);

export const DealerBannerHero: React.FC<{
  tenant: DealerProfile;
  landingConfig: DealerLandingConfig;
  headline: string;
}> = ({ tenant, landingConfig, headline }) => {
  const { hero, customBadges } = landingConfig;
  const rawWa = tenant.whatsappNumber ? tenant.whatsappNumber.replace(/[^0-9]/g, '') : '';
  const cleanWa = rawWa ? (rawWa.startsWith('40') ? rawWa : rawWa.startsWith('0') ? `40${rawWa.slice(1)}` : `40${rawWa}`) : '';

  return (
    <section aria-label={`${tenant.name} — Hero Banner`} className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-24 bg-[#09090b]">
      {customBadges && customBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {customBadges.map(badge => (
            <span key={badge} className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
              {badge}
            </span>
          ))}
        </div>
      )}
      <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-6">
        {headline}
      </h1>
      {hero.subheadline && <p className="text-lg text-zinc-400 max-w-2xl mb-10">{hero.subheadline}</p>}
      <div className="flex flex-col sm:flex-row gap-4">
        {cleanWa && (
          <a 
            href={`https://wa.me/${cleanWa}`} 
            target="_blank" 
            rel="noreferrer"
            className="px-8 py-4 rounded-2xl font-bold text-black bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-all"
          >
            {hero.primaryCtaText || 'Contactează-ne pe WhatsApp'}
          </a>
        )}
        <a href="#stoc" className="px-8 py-4 rounded-2xl font-bold text-white border border-white/20 hover:border-white/40 transition-all">
          Explorează Stocul ↓
        </a>
      </div>
    </section>
  );
};

export interface DealerHeroAdapterProps {
  tenant: DealerProfile;
  landingConfig: DealerLandingConfig;
  videoSrc?: string;
  webmSrc?: string;
  posterSrc?: string;
  lastFrameSrc?: string;
  onExploreClick?: () => void;
  cars: VehicleItem[];
  onSelectCar: (car: VehicleItem) => void;
  isRevealed?: boolean;
}

export const DealerHeroAdapter: React.FC<DealerHeroAdapterProps> = ({
  tenant,
  landingConfig,
  videoSrc,
  webmSrc,
  posterSrc,
  lastFrameSrc,
  onExploreClick,
  cars,
  onSelectCar,
  isRevealed = true,
}) => {
  const { hero } = landingConfig;
  const headlineFinal = hero.headline || `${tenant.name} — Autovehicule Rulate Premium`;

  switch (hero.type) {
    case 'video_loop':
      // ShowroomVideoIntro este showcase-ul demonstrativ ParcOS SaaS (Porsche, Audi RS7, telemetrie SaaS).
      // Pentru showroom-ul RXM Automobile sau orice dealer fără URL video dedicat (hero.videoUrl),
      // randăm întotdeauna HeroSpotlight cu mașinile reale din stocul dealerului:
      if (!hero.videoUrl || tenant.slug === 'rxm') {
        return (
          <HeroSpotlight
            cars={cars}
            onSelectCar={onSelectCar}
            dealer={tenant}
            isRevealed={isRevealed}
          />
        );
      }
      return (
        <React.Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
          <ShowroomVideoIntro
            videoSrc={hero.videoUrl ?? videoSrc}
            webmSrc={webmSrc}
            posterSrc={hero.posterUrl ?? posterSrc}
            lastFrameSrc={lastFrameSrc}
            onExploreClick={onExploreClick}
          />
        </React.Suspense>
      );
    case 'spotlight':
      return (
        <HeroSpotlight
          cars={cars}
          onSelectCar={onSelectCar}
          dealer={tenant}
          isRevealed={isRevealed}
        />
      );
    case 'banner':
      return <DealerBannerHero tenant={tenant} landingConfig={landingConfig} headline={headlineFinal} />;
    default:
      return (
        <HeroSpotlight
          cars={cars}
          onSelectCar={onSelectCar}
          dealer={tenant}
          isRevealed={isRevealed}
        />
      );
  }
};

export default DealerHeroAdapter;
