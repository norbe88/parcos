import React from 'react';

interface PlaceholderBadgeProps {
  label: string;
  className?: string;
}

export const PlaceholderBadge: React.FC<PlaceholderBadgeProps> = ({ label, className = '' }) => {
  // Verifică dacă suntem în mediul demo / staging / local development
  const isDemoOrStaging = typeof window !== 'undefined' ? (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('staging') ||
    window.location.hostname.includes('parcos.ro') ||
    window.location.hostname.endsWith('.local')
  ) : true;

  if (!isDemoOrStaging) {
    return null;
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-dashed border-amber-500/80 bg-amber-500/10 text-amber-300 font-mono text-xs font-medium tracking-tight select-none ${className}`}
      title={`Date de confirmat cu dealerul: ${label}`}
    >
      [PLACEHOLDER: {label}]
    </span>
  );
};

export default PlaceholderBadge;
