import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const FloatingBackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 450);
    };
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside
      aria-label="Revenire rapidă la începutul showroom-ului"
      className={`fixed right-4 sm:right-6 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-[5.25rem] z-40 no-print transition-all duration-300 ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
          : 'opacity-0 translate-y-3 scale-90 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        className="group flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#121215]/95 hover:bg-[#1a1a20] text-zinc-300 hover:text-amber-400 border border-white/10 hover:border-amber-500/40 shadow-xl shadow-black/60 backdrop-blur-md transition-all active:scale-95 touch-manipulation cursor-pointer"
        title="Înapoi la începutul showroom-ului"
        aria-label="Revenire la începutul showroom-ului"
      >
        <ArrowUp className="w-5 h-5 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </aside>
  );
};
