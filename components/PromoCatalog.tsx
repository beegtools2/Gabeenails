import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { PromoDesign } from '../types';
import {
  DEFAULT_PROMO_DETAILS_TITLE,
  DEFAULT_PROMO_DETAILS_BLOCKS,
  DEFAULT_PRESS_ON_PROMO_DETAILS_TITLE,
  DEFAULT_PRESS_ON_PROMO_DETAILS_BLOCKS,
} from '../data/catalogData';
import { GabeeBeeMark } from './GabeeBeeMark';
import {
  Search,
  Sparkles,
  Calendar,
  Info,
  Clock,
  Check,
  X,
  Gift,
  Home,
  MapPin,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export interface PromoCatalogProps {
  isEmbedded?: boolean;
}

const renderPromoRichText = (text: string): React.ReactNode => {
  return text.split('**').map((part, idx) =>
    idx % 2 === 1 ? <strong key={idx}>{part}</strong> : <React.Fragment key={idx}>{part}</React.Fragment>
  );
};

export const PromoCatalog: React.FC<PromoCatalogProps> = ({ isEmbedded = false }) => {
  const {
    promoDesigns,
    openBooking,
    openPromoPressOnModal,
    selectedPromoForDetails,
    setSelectedPromoForDetails,
    settings,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const PROMO_CATEGORIES = ['TODOS', 'SISTEMA', 'PRESS ON'];

  const handleOpenPressOnPromo = (design: PromoDesign) => {
    // Open dedicated Promo Press-On modal (100% isolated flow)
    openPromoPressOnModal(design);
  };

  // All active promo designs combined by default
  const activeDesigns = useMemo(() => {
    return promoDesigns.filter((d) => d.active !== false);
  }, [promoDesigns]);

  // Filtered designs
  const filteredDesigns = useMemo(() => {
    return activeDesigns.filter((d) => {
      const isPressOn = d.category === 'press_on' || Boolean(d.collection?.toLowerCase().includes('press on'));
      let matchesCategory = true;
      if (activeCategory === 'SISTEMA') {
        matchesCategory = !isPressOn;
      } else if (activeCategory === 'PRESS ON') {
        matchesCategory = isPressOn;
      }

      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeDesigns, activeCategory, searchQuery]);

  const content = (
    <div className={`rounded-3xl bg-white border border-[#E8DEC9] hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] shadow-xs transition-all duration-300 ${isEmbedded ? 'p-5 sm:p-6 lg:p-7' : 'p-6 sm:p-8 md:p-10'}`}>
      
      {/* Section Header */}
      <div className="text-center mb-6">
        <h2 className={`${isEmbedded ? 'text-xl sm:text-2xl md:text-3xl' : 'text-2xl sm:text-3xl md:text-4xl'} font-['Cinzel'] font-bold text-[#5D3704] tracking-tight flex items-center justify-center gap-2 sm:gap-3`}>
          <span className="text-sm sm:text-base text-[#D4AF37]">✦</span>
          <span>PROMOCIONES</span>
          <span className="text-sm sm:text-base text-[#D4AF37]">✦</span>
        </h2>
        <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704] mt-1.5 max-w-3xl mx-auto leading-relaxed">
          Aprovecha nuestras promociones exclusivas del mes y asegura tu cita antes de que se agoten los cupos. ¡En unos simples pasos podrás tener tus uñitas soñadas!
        </p>
      </div>

          {/* Filter Toolbar (Search + Category Tabs with Translucent Brownish Background and Illuminated Gold Glow Border) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
            {/* Interactive Category Segmented Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PROMO_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-xs font-['Cinzel'] font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#5D3704]/25 text-[#5D3704] border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)] font-bold'
                      : 'bg-[#5D3704]/10 text-[#5D3704] hover:bg-[#5D3704]/20 border border-[#D4AF37]/60 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.25)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[260px] max-w-sm">
              <Search className="w-4 h-4 text-[#5D3704] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por estilo, técnica o flor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#DDD1BF] text-[#5D3704] placeholder:text-[#5D3704]/60 focus:outline-none focus:ring-2 focus:ring-[#C29D38]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D3704] hover:text-[#5D3704]/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Unified Combined Grid of All Promotional Items */}
          {filteredDesigns.length === 0 ? (
            <div className="text-center py-16 bg-[#FAF7F2] rounded-2xl border border-[#E6DCce]">
              <p className="text-sm font-medium text-[#5D3704]">No se encontraron diseños con ese filtro.</p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('TODOS');
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-2 text-xs font-semibold text-[#5D3704] underline decoration-[#C29D38]"
              >
                Restablecer búsqueda
              </button>
            </div>
          ) : (
            <div className={`grid ${isEmbedded ? 'grid-cols-1 sm:grid-cols-2 gap-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
              {filteredDesigns.map((design) => {
                const isPressOn = design.category === 'press_on' || design.collection.toLowerCase().includes('press on');
                return (
                  <div
                    key={design.id}
                    className="rounded-2xl bg-[#FAF7F2] border border-[#E7DDCE] shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-[#D4AF37]/60"
                  >
                    {/* Image Container */}
                    <div
                      className={`relative ${isEmbedded ? 'h-48 sm:h-52' : 'h-60'} bg-[#F3EDE3] overflow-hidden cursor-pointer`}
                      onClick={() => setSelectedPromoForDetails(design)}
                    >
                      <img
                        src={design.image}
                        alt={design.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Image Hover Overlay: "Detalles de la promo" */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-xs font-medium flex items-center gap-1.5 drop-shadow-md font-['Cinzel']">
                          <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Detalles de la promo</span>
                        </span>
                      </div>

                      {/* Dynamic Admin Floating Badges ONLY (Stock, Trending, BestSeller) positioned at the TOP inside the image with soft translucent light-brown style */}
                      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
                        {design.stock !== undefined && design.stock > 0 && design.stock <= 10 && (
                          <div className="bg-[#FAF7F2]/85 backdrop-blur-md text-[#5D3704] text-[10px] font-['Cinzel'] font-bold px-2.5 py-1 rounded-full shadow-xs border border-[#D4AF37]/60">
                            🔥 ¡Solo quedan {design.stock} unidades!
                          </div>
                        )}
                        {design.isTrending && (
                          <div className="bg-[#FAF7F2]/85 backdrop-blur-md text-[#5D3704] text-[10px] font-['Cinzel'] font-bold px-2.5 py-1 rounded-full shadow-xs border border-[#D4AF37]/60 ml-auto">
                            ✨ Tendencia Coreana
                          </div>
                        )}
                        {design.isBestSeller && !design.isTrending && (
                          <div className="bg-[#FAF7F2]/85 backdrop-blur-md text-[#5D3704] text-[10px] font-['Cinzel'] font-bold px-2.5 py-1 rounded-full shadow-xs border border-[#D4AF37]/60 ml-auto">
                            👑 Más Vendido
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Body Content - Horizontal, Minimalist Layout Below Image */}
                    <div className="p-4 bg-[#FAF7F2] flex items-center justify-between gap-3 border-t border-[#E7DDCE]">
                      {/* Left: Main Name and Price */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-bold text-sm sm:text-base text-[#5D3704] group-hover:text-[#8D6B19] transition-colors cursor-pointer leading-tight font-['Cinzel'] truncate uppercase"
                          onClick={() => setSelectedPromoForDetails(design)}
                          title={design.title}
                        >
                          {design.title}
                        </h3>
                        <div className="mt-0.5 text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                          S/. {design.price}
                        </div>
                      </div>

                      {/* Right: Small aesthetic action button */}
                      <div className="shrink-0">
                        {isPressOn ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPressOnPromo(design)}
                            className="py-1.5 px-3.5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs transition-all uppercase tracking-wider cursor-pointer"
                          >
                            Elegir
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBooking('promotion', design.id)}
                            className="py-1.5 px-3.5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs transition-all uppercase tracking-wider cursor-pointer"
                          >
                            Agendar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
  );

  return (
    <>
      {isEmbedded ? (
        <div className="w-full h-full">{content}</div>
      ) : (
        <section className="py-8 lg:py-12 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {content}
          </div>
        </section>
      )}

      {/* Promo Details Modal (Exact viewport centering matching BookingModal / Personaliza tu set) */}
      {selectedPromoForDetails && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedPromoForDetails(null)}
        >
          {/* Floating Modal Window with Translucent Golden Bee Pattern */}
          <div
            className="relative border border-[#5D3704]/20 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            style={{
              backgroundColor: '#FAF7F2',
              backgroundImage: 'var(--site-window-pattern)',
              backgroundSize: '240px auto',
              backgroundRepeat: 'repeat',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Soft Translucent Glassmorphism Veil Over Bee Pattern */}
            <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-md pointer-events-none" />

            {/* Modal Header (Franja superior con patrón de abejas) */}
            <div
              className="relative z-10 p-5 sm:p-6 border-b border-[#5D3704]/20 flex items-center justify-between gap-4 shrink-0"
              style={{
                backgroundColor: '#FAF7F2',
                backgroundImage: 'var(--site-window-pattern)',
                backgroundSize: '200px auto',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
              }}
            >
              <div className="flex items-center gap-3 bg-[#FAF7F2]/90 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-[#5D3704]/20">
                <GabeeBeeMark size="sm" />
                <div>
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]/90 block">
                    {selectedPromoForDetails.collection} · {selectedPromoForDetails.category === 'press_on' || selectedPromoForDetails.collection.toLowerCase().includes('press on') ? 'Set Press On' : 'Sistema Profesional'}
                  </span>
                  <h3 className="text-base sm:text-lg font-['Cinzel'] font-bold text-[#5D3704] leading-tight">
                    {selectedPromoForDetails.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPromoForDetails(null)}
                className="p-2 text-[#5D3704] bg-[#F5EBE1] hover:bg-[#ebdccf] rounded-full shadow-2xs transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5 text-[#5D3704]" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5 text-xs text-[#5D3704]">
              {/* Photo Banner */}
              <div className="relative h-60 rounded-2xl overflow-hidden border border-[#E8DFC9] bg-[#EFE8DD] shrink-0">
                <img
                  src={selectedPromoForDetails.image}
                  alt={selectedPromoForDetails.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Detailed Breakdown Conditionals */}
              {selectedPromoForDetails.category === 'press_on' || selectedPromoForDetails.collection.toLowerCase().includes('press on') ? (
                /* PRESS-ON PROMO CONTENT - DETALLES Y TÉRMINOS EDITABLES DESDE ADMIN */
                (() => {
                  const promoTitle = selectedPromoForDetails.promoDetailsTitle || DEFAULT_PRESS_ON_PROMO_DETAILS_TITLE;
                  const promoBlocks =
                    selectedPromoForDetails.promoDetailsBlocks && selectedPromoForDetails.promoDetailsBlocks.length > 0
                      ? selectedPromoForDetails.promoDetailsBlocks
                      : DEFAULT_PRESS_ON_PROMO_DETAILS_BLOCKS;
                  return (
                    <div className="space-y-3">
                      {/* Description Box for Press On */}
                      <div className="p-4 rounded-xl bg-white/80 border border-[#EAE1D2] backdrop-blur-xs">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5D3704] mb-1.5 flex items-center gap-1.5 font-['Cinzel']">
                          <Sparkles className="w-3.5 h-3.5 text-[#C29D38]" />
                          <span>¿De qué se trata este diseño?</span>
                        </h4>
                        <p className="text-[#5D3704]/90 leading-relaxed text-xs font-['Marcellus']">
                          {selectedPromoForDetails.description || 'Diseño exclusivo de autor elaborado con geles de alta gama.'}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-white/85 border border-[#5D3704]/20 space-y-4 shadow-2xs backdrop-blur-xs">
                        <div className="border-b border-[#5D3704]/15 pb-2">
                          <h5 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] tracking-wide flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-[#D4AF37]" />
                            {promoTitle}
                          </h5>
                        </div>

                        {promoBlocks.map((block) => {
                          const lines = block.content.split('\n').filter((line) => line.trim() !== '');
                          return (
                            <div
                              key={block.id}
                              className="space-y-1.5 pt-3 border-t border-[#5D3704]/15 first:border-0 first:pt-0"
                            >
                              {block.title && (
                                <h6 className="font-['Cinzel'] font-bold text-xs text-[#5D3704] flex items-center gap-1.5">
                                  <span>{block.title}</span>
                                </h6>
                              )}
                              {block.bulleted ? (
                                <ul className="text-xs font-['Marcellus'] text-[#5D3704]/90 space-y-2 pl-1 leading-relaxed">
                                  {lines.map((line, idx) => (
                                    <li key={idx}>• {renderPromoRichText(line)}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-xs font-['Marcellus'] text-[#5D3704]/90 leading-relaxed space-y-1.5">
                                  {lines.map((line, idx) => (
                                    <p key={idx}>{renderPromoRichText(line)}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* SALON SYSTEM PROMO CONTENT - DETALLES Y TÉRMINOS EDITABLES DESDE ADMIN */
                (() => {
                  const promoTitle = selectedPromoForDetails.promoDetailsTitle || DEFAULT_PROMO_DETAILS_TITLE;
                  const promoBlocks =
                    selectedPromoForDetails.promoDetailsBlocks && selectedPromoForDetails.promoDetailsBlocks.length > 0
                      ? selectedPromoForDetails.promoDetailsBlocks
                      : DEFAULT_PROMO_DETAILS_BLOCKS;
                  return (
                    <div className="p-5 rounded-2xl bg-white/85 border border-[#5D3704]/20 space-y-4 shadow-2xs backdrop-blur-xs">
                      <div className="border-b border-[#5D3704]/15 pb-2">
                        <h5 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] tracking-wide">
                          {promoTitle}
                        </h5>
                      </div>

                      {promoBlocks.map((block) => {
                        const lines = block.content.split('\n').filter((line) => line.trim() !== '');
                        return (
                          <div
                            key={block.id}
                            className="space-y-1.5 pt-3 border-t border-[#5D3704]/15 first:border-0 first:pt-0"
                          >
                            {block.title && (
                              <h6 className="font-['Cinzel'] font-bold text-xs text-[#5D3704] flex items-center gap-1.5">
                                <span>{block.title}</span>
                              </h6>
                            )}
                            {block.bulleted ? (
                              <ul className="text-xs font-['Marcellus'] text-[#5D3704]/90 space-y-2 pl-1 leading-relaxed">
                                {lines.map((line, idx) => (
                                  <li key={idx}>• {renderPromoRichText(line)}</li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-xs font-['Marcellus'] text-[#5D3704]/90 leading-relaxed space-y-1.5">
                                {lines.map((line, idx) => (
                                  <p key={idx}>{renderPromoRichText(line)}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer (Fixed on bee texture) */}
            <div
              className="relative z-10 p-4 border-t border-[#5D3704]/20 flex items-center justify-between gap-3 shrink-0"
              style={{
                backgroundColor: '#FAF7F2',
                backgroundImage: 'var(--site-window-pattern)',
                backgroundSize: '200px auto',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedPromoForDetails(null)}
                className="py-2.5 px-4 rounded-xl border border-[#5D3704]/20 bg-[#F5EBE1] text-xs font-['Cinzel'] font-bold text-[#5D3704] hover:bg-[#ebdccf] cursor-pointer"
              >
                Cerrar
              </button>

              {selectedPromoForDetails.category === 'press_on' || selectedPromoForDetails.collection.toLowerCase().includes('press on') ? (
                <button
                  type="button"
                  onClick={() => {
                    const design = selectedPromoForDetails;
                    setSelectedPromoForDetails(null);
                    handleOpenPressOnPromo(design);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-xs flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#5D3704]" />
                  <span>ELEGIR</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedPromoForDetails.id;
                    setSelectedPromoForDetails(null);
                    openBooking('promotion', id);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-xs flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#5D3704]" />
                  <span>AGENDAR</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
