import React from 'react';
import { Star, ExternalLink, MessageSquare } from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { PlaceholderBadge } from '../common/PlaceholderBadge';

export const GoogleReviewsSection: React.FC<{ dealer?: DealerProfile }> = ({ dealer = SEED_DEALER }) => {
  const mapsTargetUrl = dealer.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealer.name + ' ' + (dealer.showroomAddress || dealer.address || ''))}`;
  const configReviews = dealer.landingConfig?.reviews;

  const defaultReviews = [
    {
      author: 'Mihai Popa',
      rating: 5,
      date: 'Octombrie 2026',
      car: 'Volkswagen Passat 2.0 TDI',
      text: 'Am cumpărat un VW Passat din parcul MPI Auto. Mașina este impecabilă, procesul de finanțare a durat sub 24h, iar livrarea pe platformă la Cluj a fost promptă.'
    },
    {
      author: 'Andreea Mureșan',
      rating: 5,
      date: 'Septembrie 2026',
      car: 'Hyundai Tucson 1.6 CRDi',
      text: 'Profesionalism și maximă transparență. Raportul tehnic a fost exact cel din realitate, iar garanția Car Protect oferă siguranță deplină.'
    },
    {
      author: 'Radu Ionescu',
      rating: 5,
      date: 'August 2026',
      car: 'Dacia Duster 1.5 dCi 4x4',
      text: 'Foarte mulțumit de serviciul de trade-in. Am predat vechiul automobil și am plecat cu noul SUV în aceeași zi, fără bătăi de cap.'
    }
  ];

  const activeReviews = (configReviews && configReviews.length > 0) ? configReviews : defaultReviews;
  const isCustomMissing = !configReviews || configReviews.length === 0;

  return (
    <section 
      id="recenzii"
      aria-label="Recenzii Clienți și Evaluări Google"
      className="py-14 md:py-24 bg-[var(--surface-2,#1B2431)] text-[var(--text,#F4F6F9)] border-b border-[var(--line,rgba(255,255,255,0.08))] scroll-mt-16"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Antet Secțiune Recenzii */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--accent,#D83333)]/10 text-[var(--accent-text,#F04D4D)] text-[12px] font-montserrat font-semibold uppercase tracking-[0.14em] mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Experiențe reale</span>
            </div>
            <h2 className="font-montserrat font-extrabold text-[32px] sm:text-[40px] text-[var(--text,#F4F6F9)] leading-tight tracking-[-0.02em]">
              Ce spun clienții noștri
            </h2>
            {isCustomMissing && (
              <div className="mt-2">
                <PlaceholderBadge label="Recenzii Google" />
              </div>
            )}
          </div>

          <a
            href={mapsTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-montserrat font-bold text-[14px] text-[var(--accent-text,#F04D4D)] hover:text-[var(--accent,#D83333)] transition-colors group self-start md:self-auto"
          >
            <span>Vezi toate recenziile pe Google</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Grilă 3 Carduri Recenzii */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {activeReviews.slice(0, 3).map((rev, idx) => {
            const author = rev.author;
            const text = rev.text;
            const date = rev.date || 'Recenzie recentă';
            const car = (rev as any).car;

            return (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] flex flex-col justify-between"
              >
                <div>
                  {/* Stele Roșii --accent */}
                  <div className="flex items-center gap-1 mb-4" aria-label="5 din 5 stele">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[var(--accent,#D83333)] text-[var(--accent,#D83333)]" />
                    ))}
                  </div>

                  {/* Citat Mare 17px */}
                  <blockquote className="font-open-sans text-[16px] sm:text-[17px] leading-[1.6] text-[var(--text,#F4F6F9)] italic mb-6">
                    „{text}”
                  </blockquote>
                </div>

                <div className="pt-4 border-t border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between text-[13px]">
                  <div>
                    <div className="font-montserrat font-bold text-[var(--text,#F4F6F9)]">
                      {author}
                    </div>
                    {car && (
                      <div className="font-open-sans text-[12px] text-[var(--text-muted,#A3ABB6)]">
                        {car}
                      </div>
                    )}
                  </div>

                  <span className="font-open-sans text-[12px] text-[var(--text-muted,#A3ABB6)] tabular-nums">
                    {date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
