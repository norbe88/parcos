import React from 'react';
import { MapPin, Clock, Phone, MessageCircle, Mail, ExternalLink, Navigation } from 'lucide-react';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { resolveDealerContact } from '../../utils/helpers';
import { PlaceholderBadge } from '../common/PlaceholderBadge';

interface ContactMapSectionProps {
  dealer: DealerProfile;
  landingConfig?: DealerLandingConfig;
}

export const ContactMapSection: React.FC<ContactMapSectionProps> = ({
  dealer,
  landingConfig
}) => {
  const contact = resolveDealerContact(dealer);
  const mapConfig = landingConfig?.map;

  const displayAddress = dealer.showroomAddress || dealer.address || `${dealer.city || 'Cluj-Napoca'}, jud. ${dealer.county || 'Cluj'}`;
  const googleMapsUrl = dealer.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealer.name + ' ' + displayAddress)}`;
  const wazeUrl = dealer.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(displayAddress)}`;

  // Iframe Embed URL fallback
  const mapEmbedUrl = mapConfig?.embedUrl || `https://maps.google.com/maps?q=${encodeURIComponent(displayAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const isMapMissing = !mapConfig?.embedUrl;

  return (
    <section 
      id="contact"
      aria-label="Contact Showroom și Localizare"
      className="py-14 md:py-24 bg-[var(--bg,#0B0F16)] text-[var(--text,#F4F6F9)] border-b border-[var(--line,rgba(255,255,255,0.08))] scroll-mt-16"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Stânga: Date de Contact Complete (6 Cols) */}
          <div className="lg:col-span-6">
            <div className="font-montserrat font-semibold text-[12px] uppercase tracking-[0.16em] text-[var(--accent-text,#F04D4D)] mb-2">
              Contact & Locație
            </div>
            <h2 className="font-montserrat font-extrabold text-[32px] sm:text-[40px] text-[var(--text,#F4F6F9)] leading-tight tracking-[-0.02em] mb-4">
              Vino să testezi mașina în showroom
            </h2>
            <p className="font-open-sans text-[15px] sm:text-[16px] text-[var(--text-muted,#A3ABB6)] leading-relaxed mb-8">
              Echipa noastră de consultanți te așteaptă la parcul auto pentru verificare tehnică, test drive gratuit și asistență dedicată pentru finanțare.
            </p>

            <div className="space-y-4 mb-8">
              {/* Adresă */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--accent-text,#F04D4D)] shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)]">
                    Adresă showroom
                  </h3>
                  <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] mt-0.5">
                    {displayAddress}
                  </p>
                </div>
              </div>

              {/* Program */}
              {dealer.openingHours && (
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--metal,#C9CED6)] shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)]">
                      Program de lucru
                    </h3>
                    <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] mt-0.5">
                      {dealer.openingHours}
                    </p>
                  </div>
                </div>
              )}

              {/* Telefon Vânzări & Finanțare */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--metal,#C9CED6)] shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)]">
                    Telefoane utile
                  </h3>
                  <div className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] mt-0.5 space-y-1">
                    {contact.salesPhone && (
                      <div>
                        Vânzări: <a href={`tel:${contact.salesPhoneClean}`} className="text-[var(--text,#F4F6F9)] font-semibold hover:text-[var(--accent-text,#F04D4D)] transition-colors tabular-nums">{contact.salesPhone}</a>
                      </div>
                    )}
                    {contact.financePhone && (
                      <div>
                        Finanțare & Rate: <a href={`tel:${contact.financePhoneClean}`} className="text-[var(--text,#F4F6F9)] font-semibold hover:text-[var(--accent-text,#F04D4D)] transition-colors tabular-nums">{contact.financePhone}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              {dealer.email && (
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--metal,#C9CED6)] shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)]">
                      Adresă e-mail
                    </h3>
                    <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] mt-0.5">
                      <a href={`mailto:${dealer.email}`} className="text-[var(--text,#F4F6F9)] hover:text-[var(--accent-text,#F04D4D)] transition-colors">{dealer.email}</a>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Butoane Navigație: Google Maps & Waze */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-12 px-6 rounded-[var(--r-md,14px)] bg-[var(--accent,#D83333)] hover:bg-[var(--accent-hover,#C02828)] text-white font-montserrat font-bold text-[14px] flex items-center justify-center gap-2 shadow-[var(--shadow-cta)] transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span>Deschide în Google Maps</span>
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-12 px-6 rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[14px] flex items-center justify-center gap-2 border border-[var(--line,rgba(255,255,255,0.08))] transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Deschide în Waze</span>
              </a>
            </div>
          </div>

          {/* Dreapta: Hartă Google Maps Embed (6 Cols) */}
          <div className="lg:col-span-6">
            <div className="relative w-full aspect-[4/3] rounded-[var(--r-lg,24px)] overflow-hidden border border-[var(--line,rgba(255,255,255,0.12))] shadow-[var(--shadow-card)] bg-[var(--surface-2,#1B2431)]">
              <iframe
                title={`Locație Showroom ${dealer.name}`}
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
              {isMapMissing && (
                <div className="absolute top-4 right-4 z-10">
                  <PlaceholderBadge label="Coordonate hartă" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
