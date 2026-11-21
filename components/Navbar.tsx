import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GabeeLogo } from './GabeeLogo';
import { BeeCoinIcon } from './BeeCoinIcon';
import {
  Calendar,
  Menu,
  X,
  Search,
  Share2,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    setShowTermsModal,
    setShowGuideModal,
    setIsCoursesModalOpen,
    setIsPressOnModalOpen,
    setShowAdditionalsModal,
    openBooking,
    settings,
    promoDesigns,
    setSelectedPromoForDetails,
    currentUser,
    openAccountModal,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Share state feedback
  const [shareSuccess, setShareSuccess] = useState(false);

  // About modal ("Más de mí")
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    if (isSearchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isSearchOpen]);

  const handleShare = async () => {
    const shareData = {
      title: 'Gabee Studio - Donde el Amor y el arte se encuentran',
      text: 'Descubre los diseños en tendencia 2026, agenda tu cita y personaliza tu set de uñas en Gabee Studio.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
      }
    } catch {
      // Ignore user cancellation
    }
  };

  const filteredDesigns = searchQuery.trim()
    ? promoDesigns.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.collection.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavClick = (sectionId: string, view: 'home' | 'promotions' | 'custom' = 'home') => {
    setMobileMenuOpen(false);
    if (currentView !== view) {
      setCurrentView(view);
      setTimeout(() => scrollToSection(sectionId), 120);
      return;
    }
    scrollToSection(sectionId);
  };

  const handleStoreNav = () => {
    setMobileMenuOpen(false);
    const target = document.getElementById('tienda') || document.getElementById('promociones') || document.getElementById('press-on');
    const doScroll = () => {
      const el = document.getElementById('tienda') || document.getElementById('promociones') || document.getElementById('press-on');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(doScroll, 120);
    } else {
      doScroll();
    }
  };

  return (
    <>
      {/* Header Old Money minimalista: beige suave translúcido, borde y delineados dorados finos */}
      <header className="sticky top-0 z-40 border-b border-[#DFC89E]/80 bg-[#F5E7C8]/65 backdrop-blur-md shadow-[0_1px_0_rgba(223,200,158,0.7)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Zona Izquierda: logo fino (enlace a inicio) */}
          <button
            type="button"
            onClick={() => handleNavClick('inicio', 'home')}
            className="shrink-0 p-1 rounded-full hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
            aria-label="Ir al inicio"
            title="Inicio"
          >
            <img
              src="/assets/aistudio/Logo_Abejita_Sin_Circulo_Gold.png"
              alt="Gabee Studio"
              className="h-12 sm:h-14 w-auto object-contain transition-all duration-300 drop-shadow-[0_0_6px_rgba(212,175,55,0.4)] group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.65)]"
              draggable={false}
            />
          </button>

          {/* Zona Central: menú en cápsula elegante */}
          <nav className="hidden lg:flex items-center gap-1 sm:gap-2 text-[12px] sm:text-[13px] font-['Cinzel'] font-bold tracking-wider text-[#5D3704] bg-gradient-to-br from-[#FAF0D9] via-[#F3E4C3] to-[#EAD6AE] px-3 sm:px-4 py-2 rounded-full border border-[#DFC89E]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_2px_rgba(93,55,4,0.05)]">
            <button
              type="button"
              onClick={() => handleNavClick('inicio', 'home')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer hover:text-[#B8942A] hover:bg-[#D4AF37]/10 ${
                currentView === 'home' ? 'text-[#8C6B1C] bg-[#D4AF37]/10' : ''
              }`}
            >
              INICIO
            </button>
            <span className="text-[#D4AF37]/60 select-none">|</span>
            <button
              type="button"
              onClick={() => handleNavClick('servicios', 'home')}
              className="px-3 py-1.5 rounded-full transition-colors cursor-pointer hover:text-[#B8942A] hover:bg-[#D4AF37]/10"
            >
              SERVICIOS
            </button>
            <span className="text-[#D4AF37]/60 select-none">|</span>
            <button
              type="button"
              onClick={handleStoreNav}
              className="px-3 py-1.5 rounded-full transition-colors cursor-pointer hover:text-[#B8942A] hover:bg-[#D4AF37]/10"
            >
              TIENDA
            </button>
            <span className="text-[#D4AF37]/60 select-none">|</span>
            <button
              type="button"
              onClick={() => handleNavClick('cursos', 'home')}
              className="px-3 py-1.5 rounded-full transition-colors cursor-pointer hover:text-[#B8942A] hover:bg-[#D4AF37]/10"
            >
              CURSOS
            </button>
            <span className="text-[#D4AF37]/60 select-none">|</span>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowAboutModal(true);
              }}
              className="px-3 py-1.5 rounded-full transition-colors cursor-pointer hover:text-[#B8942A] hover:bg-[#D4AF37]/10"
            >
              MÁS DE MÍ
            </button>
          </nav>

          {/* Zona Derecha: buscador minimalista + tarjeta VIP unificada */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Buscador: icono lupa que despliega barra flotante */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full text-[#5D3704] hover:text-[#B8942A] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
              title="Buscar diseños y servicios"
              aria-label="Buscar"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </button>

            {/* Compartir enlace (sin accesos de administración en la vista pública) */}
            <button
              type="button"
              onClick={handleShare}
              className="hidden sm:inline-flex p-2 rounded-full text-[#5D3704]/80 hover:text-[#B8942A] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
              title="Compartir enlace"
              aria-label="Compartir"
            >
              {shareSuccess ? <CheckCheck className="w-4 h-4 text-emerald-700" /> : <Share2 className="w-4 h-4" strokeWidth={1.6} />}
            </button>

            {/* Tarjeta VIP unificada: perfil + saldo en una misma cápsula */}
            {currentUser ? (
              <div className="flex items-center rounded-full border border-[#DFC89E]/85 bg-gradient-to-br from-[#FAF0D9] via-[#F3E4C3] to-[#EAD6AE] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_2px_rgba(93,55,4,0.05)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => openAccountModal('profile')}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                  title="Mi Perfil & Tarjeta VIP"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.firstName}
                      className="w-6 h-6 rounded-full object-cover border border-[#D4AF37]/60"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#F2E6D0] border border-[#DFC89E] flex items-center justify-center overflow-hidden shrink-0">
                      <GabeeLogo size="sm" showSubtitle={false} className="scale-[0.55]" />
                    </div>
                  )}
                  <span className="text-[11px] sm:text-xs font-['Cinzel'] font-bold text-[#5D3704] max-w-[72px] sm:max-w-[110px] truncate">
                    {currentUser.firstName}
                  </span>
                  <span className="text-[#C46A6A] text-[11px] leading-none">❤</span>
                </button>
                <span className="w-px self-stretch my-1.5 bg-[#D4AF37]/40" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => openAccountModal('wallet')}
                  className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                  title="Monedero & Recargas BeeCoins"
                >
                  <BeeCoinIcon className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-[11px] sm:text-xs font-bold text-[#5D3704] whitespace-nowrap">
                    {currentUser.beeCoins.toLocaleString()} BeeCoins
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAccountModal('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#DFC89E]/85 bg-gradient-to-br from-[#FAF0D9] via-[#F3E4C3] to-[#EAD6AE] text-[#5D3704] text-[11px] sm:text-xs font-['Cinzel'] font-bold hover:bg-[#D4AF37]/10 hover:text-[#B8942A] transition-colors cursor-pointer shadow-2xs"
                title="Mi Cuenta & BeeCoins"
              >
                <BeeCoinIcon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">BeeCoins / Cuenta</span>
              </button>
            )}

            {/* Mobile menu hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full border border-[#DFC89E] text-[#5D3704] hover:text-[#B8942A] hover:bg-[#D4AF37]/10 cursor-pointer transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" strokeWidth={1.6} /> : <Menu className="w-5 h-5" strokeWidth={1.6} />}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda flotante, moderna y fluida */}
        {isSearchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 sm:pt-28 bg-[#5D3704]/10 backdrop-blur-[2px] animate-fadeIn"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
          >
            <div
              className="w-full max-w-2xl rounded-2xl border border-[#DFC89E] bg-[#F3E4C3] shadow-2xl p-3 sm:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C6B1C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar diseño por nombre, técnica o estilo (ej: Cat-Eye, Coquette, Mármol, Softgel)..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#DFC89E] bg-[#F2E6D0] text-[#5D3704] text-sm font-['Marcellus'] placeholder:text-[#7A614A]/70 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#5D3704]/70 hover:text-[#B8942A] hover:bg-[#D4AF37]/10 transition-colors"
                  aria-label="Cerrar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Resultados de búsqueda */}
              {searchQuery.trim() && (
                <div className="mt-3 bg-[#F2E6D0] rounded-xl border border-[#DFC89E] p-2 shadow-sm max-h-64 overflow-y-auto">
                  {filteredDesigns.length > 0 ? (
                    filteredDesigns.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedPromoForDetails(d);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2 hover:bg-[#D4AF37]/10 rounded-lg flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <img src={d.image} alt={d.title} className="w-10 h-10 object-cover rounded-lg border border-[#D4AF37]/30" />
                        <div className="flex-1">
                          <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704] block">
                            {d.title}
                          </span>
                          <span className="font-['Marcellus'] text-[11px] text-[#7A614A]">
                            {d.collection} · S/. {d.price}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs font-['Marcellus'] text-[#7A614A]">
                      No se encontraron diseños que coincidan con &ldquo;{searchQuery}&rdquo;.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Menú móvil (accesos alineados a la nueva navegación) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#DFC89E] bg-[#F3E4C3] px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-1.5 text-xs font-['Cinzel'] font-bold text-[#5D3704] bg-[#F2E6D0] p-3 rounded-2xl border border-[#DFC89E]">
              <button type="button" onClick={() => handleNavClick('inicio', 'home')} className="text-left py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/10 hover:text-[#B8942A] transition-colors cursor-pointer">
                INICIO
              </button>
              <button type="button" onClick={() => handleNavClick('servicios', 'home')} className="text-left py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/10 hover:text-[#B8942A] transition-colors cursor-pointer">
                SERVICIOS
              </button>
              <button type="button" onClick={handleStoreNav} className="text-left py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/10 hover:text-[#B8942A] transition-colors cursor-pointer">
                TIENDA
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('cursos', 'home')}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/10 hover:text-[#B8942A] transition-colors cursor-pointer"
              >
                CURSOS
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAboutModal(true);
                }}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/10 hover:text-[#B8942A] transition-colors cursor-pointer"
              >
                MÁS DE MÍ
              </button>

              <div className="h-px bg-[#D4AF37]/25 my-1" />
              <button
                type="button"
                onClick={() => {
                  setShowTermsModal(true);
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
              >
                TÉRMINOS Y CONDICIONES
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdditionalsModal(true);
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/10 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C6B1C]" />
                <span>SERVICIOS ADICIONALES</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGuideModal(true);
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
              >
                GUÍA DE MEDIDAS
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                openBooking('promotion');
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 px-4 rounded-full bg-[#F3E4C3] border border-[#DFC89E] text-[#5D3704] text-xs font-['Cinzel'] font-bold flex items-center justify-center gap-2 hover:bg-[#D4AF37]/10 hover:text-[#B8942A] transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>AGENDAR CITA</span>
            </button>
          </div>
        )}
      </header>

      {/* Modal "Más de mí" / Conoce a Gaby */}
      {showAboutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-[#DFC89E] bg-[#F3E4C3] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.10), transparent 60%)' }} />
            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#5D3704]/70 hover:text-[#B8942A] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer z-10"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative p-7 sm:p-8 text-center">
              <h3 className="text-2xl font-['Cinzel'] font-bold text-[#5D3704]">CONOCE A LA ESPECIALISTA</h3>
              <div className="flex items-center justify-center gap-3 my-4" aria-hidden="true">
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
                <span className="text-[#D4AF37] text-xs">✦</span>
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
              </div>
              <div className="space-y-4 text-left sm:text-center">
                {settings.aboutPhoto && (
                  <div className="flex justify-center">
                    <img
                      src={settings.aboutPhoto}
                      alt="Gaby - Gabee Studio"
                      loading="eager"
                      decoding="sync"
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border border-[#D4AF37]/50 shadow-sm"
                      style={{ objectFit: 'cover', objectPosition: 'center 30%', imageRendering: '-webkit-optimize-contrast' }}
                    />
                  </div>
                )}
                <div className="text-sm font-['Marcellus'] text-[#5D3704]/90 leading-relaxed whitespace-pre-line">
                  {settings.aboutBio || 'Soy Gaby, el corazón y las manos detrás de Gabee Studio. Cada set es una pequeña obra de arte creada con técnica, paciencia y un profundo amor por el detalle.'}
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAboutModal(false);
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FFFEFA] border border-[#C89D3C] text-[#5D3704] text-xs font-['Cinzel'] font-semibold shadow-[0_4px_14px_rgba(107,67,36,0.12)] hover:bg-white hover:border-[#D4AF37] hover:text-[#8C6B1C] hover:shadow-[0_6px_18px_rgba(107,67,36,0.16)] transition-all duration-200 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar una cita</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
