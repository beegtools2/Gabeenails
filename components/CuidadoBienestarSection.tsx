import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag } from 'lucide-react';

export const CuidadoBienestarSection: React.FC = () => {
  const { inventoryList, setIsStoreModalOpen } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeProducts = inventoryList.filter((item) => item.active !== false && (item.stock ?? 0) > 0);

  // Carrusel automático fluido cada 5 segundos con transición suave
  useEffect(() => {
    if (activeProducts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeProducts.length]);

  const safeIndex = activeProducts.length > 0 ? currentIndex % activeProducts.length : 0;
  const currentProduct = activeProducts[safeIndex];

  if (activeProducts.length === 0) {
    return (
      <div id="tienda" className="scroll-mt-24 rounded-3xl bg-white border border-[#E8DEC9] hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] p-5 sm:p-6 shadow-xs transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="text-center mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-['Cinzel'] font-bold text-[#5D3704] tracking-tight flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
              <span>CUIDADO & BIENESTAR</span>
              <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
            </h2>
            <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704] mt-1 leading-relaxed text-center">
              Aquí tenemos los mejores productos de cuidado y belleza para ti.
            </p>
          </div>
          <div className="py-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] text-[#7A6655] text-xs font-['Marcellus'] text-center">
            Próximamente nuevos productos de cuidado y bienestar en stock. ♥
          </div>
        </div>

        {/* Botón intacto */}
        <button
          type="button"
          onClick={() => setIsStoreModalOpen(true)}
          className="w-full mt-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#F5EBE1] via-[#FFFDF9] to-[#F5EBE1] border-2 border-[#D4AF37] hover:border-[#B89230] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_22px_rgba(212,175,55,0.6)] hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-[#C89D3C]" />
          <span>Ver Catálogo</span>
        </button>
      </div>
    );
  }

  return (
    <div id="tienda" className="scroll-mt-24 rounded-3xl bg-white border border-[#E8DEC9] hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] p-5 sm:p-6 shadow-xs transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Encabezado: Título y Descripción */}
        <div className="text-center mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-['Cinzel'] font-bold text-[#5D3704] tracking-tight flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
            <span>CUIDADO & BIENESTAR</span>
            <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
          </h2>

          <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704] mt-1 leading-relaxed text-center">
            Aquí tenemos los mejores productos de cuidado y belleza para ti.
          </p>
        </div>

        {/* Carrusel automático con fotografía a pantalla completa (full bleed) sin marcos interiores */}
        <div
          onClick={() => setIsStoreModalOpen(true)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden cursor-pointer group shadow-sm bg-[#F5EFE6]"
          title="Haz clic para ver el catálogo y comprar"
        >
          {activeProducts.map((product, idx) => {
            const isCurrent = idx === safeIndex;
            return (
              <div
                key={product.id || idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                <img
                  src={product.image || '/assets/aistudio/PO_1_f5e6a392.JPG'}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/aistudio/PO_1_f5e6a392.JPG';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out select-none"
                />

                {/* Transición suave entre imágenes */}
              </div>
            );
          })}

          {/* Etiqueta flotante superior tipo pastilla centrada, translúcida clara con borde fino dorado */}
          {currentProduct && (
            <div className="absolute top-3 sm:top-3.5 left-1/2 -translate-x-1/2 z-20 max-w-[88%] pointer-events-none flex justify-center">
              <div className="px-4 py-1.5 rounded-full bg-[#FAF7F2]/85 backdrop-blur-md border border-[#D4AF37]/70 text-[#5D3704] font-['Cinzel'] font-bold text-[11px] sm:text-xs tracking-wider shadow-[0_2px_10px_rgba(93,55,4,0.12)] whitespace-nowrap truncate text-center">
                <span className="truncate">{currentProduct.name}</span>
              </div>
            </div>
          )}

          {/* Indicadores sutiles de posición para cuando hay más de un producto */}
          {activeProducts.length > 1 && (
            <div className="absolute bottom-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-[#FAF7F2]/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D4AF37]/30 shadow-xs">
              {activeProducts.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(dotIdx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    dotIdx === safeIndex ? 'w-4 bg-[#8C6239]' : 'w-1.5 bg-[#8C6239]/35 hover:bg-[#8C6239]/70'
                  }`}
                  aria-label={`Ver producto ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botón inferior intacto */}
      <button
        type="button"
        onClick={() => setIsStoreModalOpen(true)}
        className="w-full mt-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#F5EBE1] via-[#FFFDF9] to-[#F5EBE1] border-2 border-[#D4AF37] hover:border-[#B89230] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_22px_rgba(212,175,55,0.6)] hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
      >
        <ShoppingBag className="w-4 h-4 text-[#C89D3C]" />
        <span>Ver Catálogo</span>
      </button>
    </div>
  );
};
