import React from 'react';
import { useApp } from '../context/AppContext';
import { GabeeLogo } from './GabeeLogo';
import { BeeCoinIcon } from './BeeCoinIcon';
import {
  Calendar,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  PlusCircle,
  Star,
} from 'lucide-react';
import { ShowcaseCarousel } from './ShowcaseCarousel';
import { PromoCatalog } from './PromoCatalog';
import { CoursesSection } from './CoursesSection';
import { CuidadoBienestarSection } from './CuidadoBienestarSection';
import { ReviewsSection } from './ReviewsSection';

const ORIGINAL_LOGO = '/assets/aistudio/Logo original.png';

export const HeroCover: React.FC = () => {
  const {
    setCurrentView,
    openBooking,
    openFlipbook,
    openPressOnModal,
    setShowTermsModal,
    setShowAdditionalsModal,
    setIsPressOnModalOpen,
    settings,
    servicesCatalog,
    openAccountModal,
    currentUser,
  } = useApp();

  const servicesList = servicesCatalog.filter((s) => s.active !== false);

  return (
    <section id="inicio" className="relative overflow-hidden pt-3 sm:pt-4 lg:pt-8 pb-16 bg-transparent">
      {/* Decorative Subtle Warm Ambient Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-gradient-to-r from-[#DFBA68]/15 via-[#F2CFC7]/20 to-[#EAD6C9]/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Cover Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 lg:mb-14">
          {/* Logo original.png tal cual: PNG limpio con transparencia real,
              sin procesamiento de píxeles ni filtros. */}
          <div className="mb-0 flex justify-center">
            <img
              src={ORIGINAL_LOGO}
              alt="Gabee Studio - Logo Original"
              className="h-60 sm:h-80 md:h-96 w-auto max-w-full object-contain bg-transparent select-none drop-shadow-sm hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Separador ornamental con destello dorado.
              Negative top margin absorbs the PNG's transparent padding so it sits right under the visible logo. */}
          <div className="relative -mt-12 sm:-mt-16 md:-mt-20">
            <div className="flex items-center justify-center gap-3 mt-3" aria-hidden="true">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
              <span className="text-[#D4AF37] text-xs">✦</span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
            </div>
          </div>

          {/* Subtitle text: "lima, perú • @gabeenailsart • pedidos & servicios" */}
          <div className="flex items-center justify-center my-3.5 px-4">
            <p className="font-['Marcellus'] text-[#5D3704] text-xs sm:text-sm tracking-wide text-center">
              lima, perú • @gabeenailsart • pedidos & servicios
            </p>
          </div>

          {/* Minimalist Elongated BeeCoins Banner Floating Over Cream Background (solo para visitantes sin sesión) */}
          {!currentUser && (
            <div className="my-5 flex justify-center px-4">
              <button
                type="button"
                onClick={() => openAccountModal()}
                className="group relative inline-flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-[#FAF7F2]/90 via-[#F5EBE1]/95 to-[#FAF7F2]/90 backdrop-blur-md border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-[0_4px_22px_rgba(212,175,55,0.35)] transition-all duration-300 cursor-pointer shadow-xs"
              >
                <BeeCoinIcon className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                <span className="font-['Marcellus'] text-xs sm:text-sm text-[#5D3704] leading-tight tracking-tight text-left sm:text-center block">
                  ¿Quieres acumular BeeCoins y obtener beneficios exclusivos?{' '}
                  <span className="font-['Cinzel'] font-bold text-[#8C6B1C] underline decoration-[#D4AF37] group-hover:text-[#5D3704] transition-colors whitespace-nowrap">
                    Crea tu cuenta
                  </span>
                </span>
              </button>
            </div>
          )}

          {/* Strategic Action Buttons: Términos & Beneficios */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => openFlipbook('terms')}
              className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-[#FAF7F2]/90 via-[#F5EBE1]/95 to-[#FAF7F2]/90 backdrop-blur-md border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-[0_4px_22px_rgba(212,175,55,0.35)] transition-all duration-300 cursor-pointer shadow-xs"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#5D3704] group-hover:scale-110 transition-transform duration-300 shrink-0" />
              <span className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] tracking-tight">
                Términos y Condiciones
              </span>
            </button>

            <button
              type="button"
              onClick={() => openFlipbook('benefits')}
              className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-[#FAF7F2]/90 via-[#F5EBE1]/95 to-[#FAF7F2]/90 backdrop-blur-md border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-[0_4px_22px_rgba(212,175,55,0.35)] transition-all duration-300 cursor-pointer shadow-xs"
            >
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#5D3704] group-hover:scale-110 transition-transform duration-300 shrink-0" />
              <span className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] tracking-tight">
                Beneficios en Gabee Studio
              </span>
            </button>
          </div>
        </div>

        {/* Vitrina Visual: Carrusel Interactivo e Infinito Superior de Bienvenida */}
        <ShowcaseCarousel />

        {/* 2 Main Sections Grid:
            - Left/Main: "Nuestros Servicios" (6 services grid based on NstrosSs_GN_9860f43c.PNG)
            - Right/Side: "Nuestras Press On" (showing PO_2 and PO_3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* SECTION 1: NUESTROS SERVICIOS (8 cols on lg) */}
          <div
            id="servicios"
            className="scroll-mt-24 lg:col-span-8 rounded-3xl bg-white border border-[#E8DEC9] hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] p-6 sm:p-8 shadow-xs transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Header with Title */}
              <div className="mb-2">
                <h2 className="text-2xl sm:text-3xl font-['Cinzel'] font-bold text-[#5D3704] flex items-center gap-2.5">
                  <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
                  <span>Nuestros Servicios</span>
                  <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
                </h2>
              </div>

              <p className="text-base sm:text-lg font-['Marcellus'] text-[#5D3704] leading-relaxed mb-5">
                Explora nuestros servicios y agenda tu cita en breves pasos.
              </p>

              {/* 6 Services Grid (strictly image + informative text, click to book) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
                {servicesList.map((srv) => (
                  <div
                    key={srv.id}
                    onClick={() => {
                      if (srv.id === 'retiro_sistema') {
                        openBooking('removal');
                      } else if (srv.id === 'acrilicas') {
                        openBooking('custom', undefined, 'acrilicas');
                      } else {
                        openBooking('custom', undefined, srv.id);
                      }
                    }}
                    className="rounded-2xl bg-[#FAF7F2] border border-[#E9DFCE] overflow-hidden flex flex-col justify-between hover:border-[#5D3704]/60 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-2xs cursor-pointer group h-full"
                    title={`Agendar ${srv.title}`}
                  >
                    <div className="aspect-4/3 overflow-hidden bg-[#F0E6D8] relative w-full shrink-0">
                      <img
                        src={srv.image}
                        alt={srv.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-[#FAF7F2]/85 text-[#5D3704] border border-[#D5C6B1] backdrop-blur-xs text-[9px] font-['Cinzel'] font-bold px-2 py-0.5 rounded shadow-2xs">
                        {srv.tag}
                      </span>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="py-1.5 px-4 rounded-xl bg-[#F5EBE1]/95 border border-[#D4AF37] text-[#5D3704] text-xs font-['Cinzel'] font-bold tracking-wide shadow-[0_0_12px_rgba(212,175,55,0.4)] backdrop-blur-xs transition-transform duration-300 group-hover:scale-105">
                          Agendar
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-3 flex items-center justify-between gap-1.5 h-[52px] shrink-0">
                      <h3
                        className={`font-['Cinzel'] font-bold text-[#5D3704] leading-tight flex-1 min-w-0 ${
                          srv.title.length > 15
                            ? 'text-[10px] sm:text-[11px]'
                            : 'text-xs sm:text-sm'
                        }`}
                        title={srv.title}
                      >
                        {srv.title}
                      </h3>
                      <span className="text-[10px] sm:text-[11px] text-[#5D3704] font-['Cinzel'] font-bold shrink-0 whitespace-nowrap">
                        {srv.priceLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: SETS PREDISEÑADOS REUTILIZABLES (PRESS ON) */}
          <div
            id="press-on"
            className="lg:col-span-4 rounded-3xl bg-white border border-[#E8DEC9] hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] p-6 sm:p-8 shadow-xs transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-['Cinzel'] font-bold text-[#5D3704] mb-1.5 flex items-center gap-2.5">
                <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
                <span>Press On Nails</span>
                <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
              </h2>

              <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704] leading-relaxed mb-5">
                Echa un vistazo a nuestro catálogo o cotiza tu diseño favorito totalmente personalizado.
              </p>

              {/* 3 Prominent Reference Cards for the 3 Sets */}
              <div className="space-y-3 mb-6">
                <div className="rounded-2xl overflow-hidden border border-[#E6DBC9] shadow-xs relative h-72 sm:h-80 w-full bg-[#FAF7F2]">
                  <img
                    src="/assets/aistudio/PRESS ON NAILS.jpeg"
                    alt="Press On Nails - Diseños Artísticos Gabee Studio"
                    className="w-full h-full object-cover object-center select-none"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Buttons: Catálogo Press On & Pedido personalizado */}
            <div className="pt-4 border-t border-[#EFE5D7] flex flex-col sm:flex-row gap-3">
              {/* Botón Catálogo Press On (en dos líneas) */}
              <button
                type="button"
                onClick={() => openPressOnModal('catalog')}
                className="flex-1 min-h-[64px] sm:min-h-[68px] py-3 px-5 rounded-2xl bg-gradient-to-r from-[#F5EBE1] via-[#FFFDF9] to-[#F5EBE1] border-2 border-[#D4AF37] hover:border-[#B89230] text-[#5D3704] shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_22px_rgba(212,175,55,0.6)] hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <span className="font-['Cinzel'] font-bold text-xs sm:text-[13px] uppercase tracking-wider leading-tight text-[#5D3704]">Catálogo</span>
                <span className="font-['Cinzel'] font-bold text-xs sm:text-[13px] uppercase tracking-wider leading-tight text-[#5D3704]">Press On</span>
              </button>

              {/* Botón Pedido Personalizado (texto limpio y centrado) */}
              <button
                type="button"
                onClick={() => openPressOnModal('custom')}
                className="flex-1 min-h-[64px] sm:min-h-[68px] py-3 px-5 rounded-2xl bg-gradient-to-r from-[#FAF5ED] via-[#FFF8EB] to-[#FAF5ED] border-2 border-[#D4AF37] hover:border-[#B89230] text-[#5D3704] shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_22px_rgba(212,175,55,0.6)] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center text-center cursor-pointer"
              >
                <span className="font-['Cinzel'] font-bold text-xs sm:text-[13px] uppercase tracking-wider leading-snug text-[#5D3704]">Pedido Personalizado</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Promociones (7 cols) & Cuidado y Bienestar (5 cols) - Symmetric Balanced Boutique Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mt-8 mb-12">
          <div id="promociones" className="scroll-mt-24 lg:col-span-7">
            <PromoCatalog isEmbedded />
          </div>
          <div className="lg:col-span-5 space-y-6 lg:space-y-8">
            <CuidadoBienestarSection />
            <CoursesSection />
          </div>
        </div>

        {/* Row 3: Experiencia & Reseñas (Sección de Testimonios de Clientas) */}
        <ReviewsSection />
      </div>
    </section>
  );
};
