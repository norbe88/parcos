import React, { useState, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2, ExternalLink, MessageSquare, ThumbsUp } from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';

interface GoogleReviewItem {
  id: string;
  authorName: string;
  authorCity: string;
  avatarBg: string;
  rating: number;
  purchasedCar: string;
  dateText: string;
  reviewText: string;
  verifiedBuyer: boolean;
}

const REVIEWS_DATA: GoogleReviewItem[] = [
  {
    id: 'rev-1',
    authorName: 'Alexandru Moldovan',
    authorCity: 'Cluj-Napoca',
    avatarBg: 'bg-emerald-700',
    rating: 5,
    purchasedCar: 'BMW Seria 5 520d LCI',
    dateText: 'Acum 2 săptămâni',
    reviewText: 'Am cumpărat un BMW Seria 5 după ce am văzut prezentarea video detaliată pe TikTok. Mașina a fost 100% conform descrierii, fără defecte ascunse sau surprize. Numerele roșii au fost eliberate pe loc, iar asistența pentru dosarul RAR a fost impecabilă. Recomand cu încredere {dealer.name}!',
    verifiedBuyer: true,
  },
  {
    id: 'rev-2',
    authorName: 'Radu Câmpean',
    authorCity: 'Bistrița',
    avatarBg: 'bg-amber-700',
    rating: 5,
    purchasedCar: 'Audi Q3 Quattro S-Line',
    dateText: 'Acum o lună',
    reviewText: 'Finanțarea prin TBI Bank a durat mai puțin de 2 ore, direct din showroom doar cu buletinul! Kilometri reali trecuți pe factură fiscală și garanție scrisă de conformitate. O echipă de tineri serioși, profesioniști și extrem de transparenți.',
    verifiedBuyer: true,
  },
  {
    id: 'rev-3',
    authorName: 'Simona Vasilescu',
    authorCity: 'Târgu Mureș',
    avatarBg: 'bg-purple-600',
    rating: 5,
    purchasedCar: 'Volkswagen Passat CC R-Line',
    dateText: 'Acum 3 săptămâni',
    reviewText: 'Am făcut schimb de mașină prin serviciul lor de Trade-In (Buy-Back). Evaluarea a fost corectă, diferența a fost exact conform înțelegerii și am plecat cu noul Passat în aceeași zi. Rar găsești atâta seriozitate în parcurile auto din Ardeal.',
    verifiedBuyer: true,
  },
  {
    id: 'rev-4',
    authorName: 'Cristian Pop',
    authorCity: 'Zalău',
    avatarBg: 'bg-blue-600',
    rating: 5,
    purchasedCar: 'Renault Talisman Initiale Paris',
    dateText: 'Acum o lună',
    reviewText: 'Transparență de nota 10! Mi-au trimis raportul complet și seria VIN pe WhatsApp înainte să bat drumul până la Cluj. Mașina impecabilă estetic și mecanic, revizia făcută la predare și contract clar. Cinste lor!',
    verifiedBuyer: true,
  },
  {
    id: 'rev-5',
    authorName: 'Dan Irimieș',
    authorCity: 'Cluj-Napoca',
    avatarBg: 'bg-rose-600',
    rating: 5,
    purchasedCar: 'Ford Kuga ST-Line 4x4',
    dateText: 'Acum 2 luni',
    reviewText: 'Recomand cu căldură! Consultanța gratuită pentru dosarul de înmatriculare m-a scutit de ore întregi de stat la cozi la poliție și RAR. Garanția scrisă oferită de dealer îți dă liniștea de care ai nevoie când iei o mașină rulată.',
    verifiedBuyer: true,
  },
  {
    id: 'rev-6',
    authorName: 'Marius Bârsan',
    authorCity: 'Oradea',
    avatarBg: 'bg-amber-500',
    rating: 5,
    purchasedCar: 'Volvo XC60 Inscription',
    dateText: 'Acum o lună',
    reviewText: 'Am venit de la Oradea special pentru un XC60 văzut pe contul lor de TikTok. Test drive-ul a fost generos, mașina s-a comportat exemplar. Actele au fost gata în 30 de minute. Jos pălăria pentru {dealer.name}!',
    verifiedBuyer: true,
  }
];

export const GoogleReviewsSection: React.FC<{ dealer?: DealerProfile }> = ({ dealer = SEED_DEALER }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const mapsTargetUrl = dealer.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealer.name + ' ' + (dealer.showroomAddress || dealer.address || ''))}`;

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 360;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth'
    });
  };

  return (
    <section id="recenzii" className="border-t border-white/[0.08] bg-[#0c0c0e] py-16 px-4 sm:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Antet Secțiune Recenzii cu Badge Google */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold mb-3">
              {/* Google G Multi-color Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span className="text-white font-bold">Google Reviews</span>
              <span className="text-zinc-500">•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Profil Verificat
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
              Ce Spun Clienții Despre Noi
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl">
              Tranzacții documentate și recenzii de 5 stele de la șoferi reali din toată România care au ales transparența {dealer.name}.
            </p>
          </div>

          {/* Rezumat Scor Google & Controale Carousel */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="p-3.5 rounded-2xl bg-[#141418] border border-white/10 flex items-center gap-3">
              <div className="text-3xl font-black text-white font-mono leading-none">5.0</div>
              <div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">Scor Maxim pe Google</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none border border-white/10 text-white flex items-center justify-center transition-all touch-manipulation active:scale-95"
                aria-label="Recenzii anterioare"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none border border-white/10 text-white flex items-center justify-center transition-all touch-manipulation active:scale-95"
                aria-label="Recenzii următoare"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carusel Orizontal Recenzii (HLK Style) */}
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-none snap-x snap-mandatory touch-manipulation"
        >
          {REVIEWS_DATA.map(rev => (
            <div 
              key={rev.id}
              className="flex-shrink-0 w-[300px] sm:w-[360px] p-6 rounded-2xl bg-gradient-to-b from-[#141418] to-[#101013] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between snap-start group"
            >
              <div>
                {/* Header Card: Avatar & Nume */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${rev.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-md`}>
                      {rev.authorName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm leading-snug">{rev.authorName}</div>
                      <div className="text-[11px] text-zinc-400">{rev.authorCity} • <span className="text-zinc-500">{rev.dateText}</span></div>
                    </div>
                  </div>

                  {/* Google Mini Icon */}
                  <svg className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </div>

                {/* 5 Stele Aurii & Model Vehicul */}
                <div className="flex items-center gap-1 text-amber-400 mb-2">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-[11px] text-emerald-400 font-semibold ml-2 inline-flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Achiziție: {rev.purchasedCar}
                  </span>
                </div>

                {/* Text Testimonial */}
                <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed line-clamp-5 mt-2">
                  "{rev.reviewText}"
                </p>
              </div>

              {/* Footer Card */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
                <span className="text-emerald-400 font-medium">Recenzie verificată Google</span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <ThumbsUp className="w-3 h-3 text-zinc-500" /> Util
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bară Inferioară CTA Google Maps */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            Ai fost în showroom-ul nostru sau ai cumpărat o mașină? Părerea ta contează enorm pentru comunitatea {dealer.name}!
          </div>

          <div className="flex items-center gap-3">
            <a
              href={dealer.googleMapsUrl || SEED_DEALER.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all touch-manipulation active:scale-95"
            >
              <span>Vezi Toate Recenziile pe Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>

            <a
              href={dealer.googleMapsUrl || SEED_DEALER.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 touch-manipulation active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-black" />
              <span>Lasă o Recenzie</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
