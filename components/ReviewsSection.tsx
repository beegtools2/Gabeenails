import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, Quote, CheckCircle2, Maximize2, Sparkles } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';

export const ReviewsSection: React.FC = () => {
  const { reviewsList } = useApp();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});

  const activeReviews = reviewsList.filter((r) => r.active !== false && r.status !== 'pending');

  const isMediaValid = (url?: string | null, id?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (
      trimmed === '' ||
      trimmed === 'none' ||
      trimmed === 'no-image' ||
      trimmed === 'null' ||
      trimmed === 'undefined' ||
      trimmed === '/assets/aistudio/PO_1_f5e6a392.JPG'
    ) {
      return false;
    }
    if (id && brokenImageIds[id]) {
      return false;
    }
    return true;
  };

  return (
    <div id="resenas" className="mt-12 mb-16 px-2 sm:px-4">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-['Cinzel'] font-bold text-[#5D3704] flex items-center justify-center gap-2 sm:gap-3 tracking-wide">
          <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.7)] select-none">✦</span>
          <span>EXPERIENCIA & RESEÑAS</span>
          <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.7)] select-none">✦</span>
        </h2>
        <div className="flex items-center justify-center gap-3 mt-3 mb-3" aria-hidden="true">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
          <span className="text-[#D4AF37] text-xs">✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
        </div>
        <p className="font-['Marcellus'] text-sm sm:text-base text-[#5D3704] leading-relaxed">
          Opiniones de nuestras clientas fieles en Gabee Studio.
        </p>
      </div>

      {activeReviews.length === 0 ? (
        /* Empty state: solo reseñas reales, sin catálogo semilla ni ejemplos */
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-12 text-center rounded-3xl bg-[#FAF7F2]/70 border border-[#E8DEC9] shadow-2xs">
          <p className="font-['Marcellus'] text-xs sm:text-sm text-[#7A6655] leading-relaxed max-w-md mx-auto">
            Por el momento no tenemos reseñas publicadas. Nos ayudarías mucho si dejas tu reseña luego de tu cita o pedido. ¡Gracias abejita!
          </p>
        </div>
      ) : (
        /* Grid of Client Reviews */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {activeReviews.map((rev) => {
          const hasMedia = isMediaValid(rev.mediaUrl, rev.id);

          return (
            <div
              key={rev.id}
              className="rounded-3xl bg-[#FAF7F2] border border-[#E8DEC9] hover:border-[#D4AF37] shadow-xs hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Media Container (SOLO se crea y renderiza si hasMedia es estrictamente true) */}
              {hasMedia ? (
                <div
                  className="relative aspect-4/3 w-full bg-[#F0E6D8] overflow-hidden cursor-pointer group/media"
                  onClick={() => rev.mediaUrl && setLightboxImage(rev.mediaUrl)}
                >
                  <img
                    src={rev.mediaUrl}
                    alt={rev.clientName || 'Reseña de clienta en Gabee Studio'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={() => {
                      setBrokenImageIds((prev) => ({ ...prev, [rev.id]: true }));
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="p-2 rounded-full bg-[#FAF7F2]/90 border border-[#D4AF37] text-[#5D3704] shadow-md backdrop-blur-xs">
                      <Maximize2 className="w-4 h-4 text-[#5D3704]" />
                    </span>
                  </div>

                  {rev.serviceName && (
                    <span className="absolute top-2.5 left-2.5 bg-[#FAF7F2]/90 text-[#5D3704] border border-[#D5C6B1] backdrop-blur-xs text-[10px] font-['Cinzel'] font-bold px-2.5 py-1 rounded-full shadow-2xs">
                      {rev.serviceName}
                    </span>
                  )}

                  {rev.mediaUrl && (rev.mediaUrl.toLowerCase().includes('.gif') || rev.mediaUrl.startsWith('data:image/gif')) && (
                    <span className="absolute top-2.5 right-2.5 bg-[#5D3704]/85 text-[#FAF7F2] border border-[#D4AF37] backdrop-blur-xs text-[9px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      GIF Animado ✨
                    </span>
                  )}
                </div>
              ) : null}

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* 1. Etiqueta del servicio (Si NO tiene foto/GIF, comienza directo aquí con diseño elegante y limpio) */}
                  {!hasMedia && rev.serviceName && (
                    <div>
                      <span className="inline-flex items-center gap-1.5 bg-[#FAF4EB] text-[#5D3704] border border-[#D4AF37]/50 text-[10.5px] font-['Cinzel'] font-bold px-3 py-1 rounded-full shadow-2xs tracking-wide">
                        <Sparkles className="w-3 h-3 text-[#C89D3C]" />
                        <span>{rev.serviceName}</span>
                      </span>
                    </div>
                  )}

                  {/* 2. Rating Stars - Soft Glowing Yellow */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#FDE047] text-[#FDE047] drop-shadow-[0_0_8px_rgba(253,224,71,0.65)]" />
                    ))}
                  </div>

                  {/* 3. Comment */}
                  {rev.comment && (
                    <div className="relative">
                      <Quote className="w-5 h-5 text-[#C5A059]/30 absolute -top-1 -left-1 rotate-180 pointer-events-none" />
                      <p className="font-['Marcellus'] text-xs sm:text-sm text-[#5D3704] leading-relaxed pl-3 italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Footer con Nombre de la Clienta */}
                <div className="pt-3 border-t border-[#E8DEC9] flex items-center justify-between">
                  <div>
                    <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                      {rev.clientName}
                    </h4>
                    <span className="text-[10px] font-['Marcellus'] text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Clienta Verificada 👑</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
          altText="Reseña de Clienta · Gabee Studio"
        />
      )}
    </div>
  );
};
