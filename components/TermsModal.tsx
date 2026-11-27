import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SiteImage } from '../context/SiteImagesContext';
import { GabeeLogo } from './GabeeLogo';
import {
  X,
  BookOpen,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const TERMINOS_IMAGES = [
  { image: 'terms-1', title: 'Portada - Términos y Condiciones Gabee Studio' },
  { image: 'terms-2', title: 'Política - Diseño Cotizado, Tardanza y Cancelación' },
  { image: 'terms-3', title: 'Normas - Uñas Personalizadas, Acompañantes y Tiempo' },
  { image: 'terms-4', title: 'Tener en Cuenta - Adherencia, Hongos y Salud Ungueal' },
] as const;

const BENEFICIOS_IMAGES = [
  { image: 'benefits-1', title: 'Beneficios en Gabee Studio' },
  { image: 'benefits-2', title: 'Garantía del Servicio' },
  { image: 'benefits-3', title: 'Mantenimiento Puntual' },
] as const;

export const TermsModal: React.FC = () => {
  const { showTermsModal, setShowTermsModal, flipbookType, openBooking, setCurrentView, currentView } = useApp();
  const [activeTab, setActiveTab] = useState<'terms' | 'benefits'>('terms');
  const [pageIndex, setPageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (flipbookType) setActiveTab(flipbookType);
  }, [flipbookType]);

  useEffect(() => {
    if (showTermsModal) {
      setMounted(true);
      setPageIndex(0);
      setEntered(false);
      const t = setTimeout(() => setEntered(true), 30);
      return () => clearTimeout(t);
    } else {
      setEntered(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [showTermsModal]);

  useEffect(() => {
    setPageIndex(0);
    setEntered(false);
    const t = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(t);
  }, [activeTab]);

  if (!showTermsModal && !mounted) return null;

  const currentImages = activeTab === 'terms' ? TERMINOS_IMAGES : BENEFICIOS_IMAGES;
  const totalPages = currentImages.length;
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;

  const turnPage = (dir: 'next' | 'prev') => {
    if (dir === 'next' && !canNext) return;
    if (dir === 'prev' && !canPrev) return;
    setFading(true);
    setTimeout(() => {
      setPageIndex((i) => (dir === 'next' ? i + 1 : i - 1));
      setFading(false);
    }, 260);
  };

  // Shared refined button style: thin gold border, cream background, subtle glow on hover
  const refinedBtn =
    'px-3 py-1.5 rounded-full text-[11px] font-[\'Cinzel\'] font-bold transition-all cursor-pointer border border-[#D4AF37]/45 bg-[#FAF7F2]/85 backdrop-blur-md text-[#5D3704] shadow-[0_2px_10px_rgba(212,175,55,0.12)] hover:border-[#D4AF37] hover:bg-[#F5EBE1] hover:shadow-[0_4px_18px_rgba(212,175,55,0.28)] hover:scale-[1.02] active:scale-95';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md transition-opacity duration-300 ${
        showTermsModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setShowTermsModal(false)}
    >
      {/* Minimal elegant close button floating top-right */}
      <button
        type="button"
        onClick={() => setShowTermsModal(false)}
        className="absolute top-3 right-3 sm:top-5 sm:right-5 z-[60] p-2 rounded-full bg-[#FAF7F2]/90 backdrop-blur-md border border-[#D4AF37]/45 text-[#5D3704] shadow-[0_2px_10px_rgba(212,175,55,0.15)] hover:border-[#D4AF37] hover:bg-[#F5EBE1] hover:shadow-[0_4px_16px_rgba(212,175,55,0.3)] transition-all cursor-pointer hover:scale-105 active:scale-95"
        aria-label="Cerrar"
        title="Cerrar"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Lookbook viewer floating cleanly (no container box) */}
      <div
        className={`relative flex flex-col items-center gap-4 transition-all duration-500 ease-out ${
          showTermsModal && entered ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.92]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slide (single clean plate) */}
        <div className="relative">
          <SiteImage
            imageKey={currentImages[pageIndex].image}
            alt={currentImages[pageIndex].title}
            className={`block w-auto h-auto max-w-[92vw] max-h-[78vh] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45),0_0_24px_rgba(212,175,55,0.18)] border border-[#D4AF37]/30 bg-[#FAF7F2] select-none transition-opacity duration-300 ${
              fading ? 'opacity-0' : 'opacity-100'
            }`}
            draggable={false}
          />
        </div>

        {/* Minimal floating controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`${refinedBtn} ${activeTab === 'terms' ? 'bg-[#D4AF37]/90 text-[#5D3704] border-[#D4AF37] shadow-[0_4px_16px_rgba(212,175,55,0.3)]' : ''}`}
            >
              <BookOpen className="w-3 h-3 inline mr-1" />
              Términos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('benefits')}
              className={`${refinedBtn} ${activeTab === 'benefits' ? 'bg-[#D4AF37]/90 text-[#5D3704] border-[#D4AF37] shadow-[0_4px_16px_rgba(212,175,55,0.3)]' : ''}`}
            >
              <Star className="w-3 h-3 inline mr-1" />
              Beneficios
            </button>
          </div>

          <span className="text-white/80 text-[11px] font-['Marcellus'] px-2">
            {pageIndex + 1} / {totalPages} · {currentImages[pageIndex].title}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => turnPage('prev')}
              disabled={!canPrev || fading}
              className={refinedBtn}
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => turnPage('next')}
              disabled={!canNext || fading}
              className={refinedBtn}
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowTermsModal(false);
              // Smooth scroll to "Nuestros Servicios" section
              const scrollToServicios = () => {
                const el = document.getElementById('servicios');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              };
              if (currentView !== 'home') {
                setCurrentView('home');
                setTimeout(scrollToServicios, 120);
              } else {
                scrollToServicios();
              }
            }}
            className="py-1.5 px-3 rounded-full bg-[#FAF7F2]/85 backdrop-blur-md border border-[#D4AF37]/45 text-[#5D3704] text-[11px] font-['Cinzel'] font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_2px_10px_rgba(212,175,55,0.12)] hover:border-[#D4AF37] hover:bg-[#F5EBE1] hover:shadow-[0_6px_24px_rgba(212,175,55,0.45)] hover:scale-[1.02] transition-all active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5" />
            Agendar Cita
          </button>
        </div>
      </div>
    </div>
  );
};
