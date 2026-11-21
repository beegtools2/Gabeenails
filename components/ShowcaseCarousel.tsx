import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceItem, PressOnItem, InventoryItem, PromoDesign } from '../types';
import { Sparkles, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

export type ShowcaseItemType = 'service' | 'press_on' | 'inventory' | 'promo';

export interface ShowcaseCardData {
  id: string;
  type: ShowcaseItemType;
  title: string;
  categoryLabel: string;
  image: string;
  originalItem: ServiceItem | PressOnItem | InventoryItem | PromoDesign;
}

/** Mezcla Fisher-Yates. Se ejecuta únicamente en el cliente. */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Mezcla el orden de las categorías y de sus ítems, y los intercala tipo round-robin. */
function buildInterleavedItems(cards: ShowcaseCardData[]): ShowcaseCardData[] {
  const categoryOrder: ShowcaseItemType[] = ['service', 'inventory', 'promo', 'press_on'];
  const grouped: Record<ShowcaseItemType, ShowcaseCardData[]> = {
    service: [],
    inventory: [],
    promo: [],
    press_on: [],
  };

  cards.forEach((card) => {
    if (grouped[card.type]) grouped[card.type].push(card);
  });

  const shuffledGroups = shuffleArray(categoryOrder).map((type) => shuffleArray(grouped[type]));
  const result: ShowcaseCardData[] = [];

  for (let index = 0; result.length < cards.length; index++) {
    let added = false;
    for (const group of shuffledGroups) {
      if (index < group.length) {
        result.push(group[index]);
        added = true;
      }
    }
    if (!added) break;
  }

  return result;
}

export const ShowcaseCarousel: React.FC = () => {
  const {
    servicesCatalog,
    pressOnCatalog,
    inventoryList,
    promoDesigns,
    openBooking,
    openPressOnModal,
    setSelectedPromoForDetails,
    openPromoPressOnModal,
    setIsStoreModalOpen,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  // Collect all items configured to be featured in the carousel (orden determinista inicial)
  const buildFeaturedCards = (): ShowcaseCardData[] => {
    const cards: ShowcaseCardData[] = [];

    // 0. Featured Promo Designs (CARRUSEL ON in Admin Panel)
    promoDesigns
      .filter((d) => d.active !== false && d.featured === true)
      .forEach((d) => {
        const isPressOn = d.category === 'press_on' || d.collection?.toLowerCase().includes('press on');
        cards.push({
          id: `promo-${d.id}`,
          type: 'promo',
          title: d.title,
          categoryLabel: isPressOn ? 'PRESS ON PROMO' : (d.collection ? d.collection.toUpperCase() : 'SISTEMA PROMO'),
          image: d.image,
          originalItem: d,
        });
      });

    // 1. Featured Services
    servicesCatalog
      .filter((s) => s.active !== false && s.featuredInCarousel !== false)
      .forEach((s) => {
        cards.push({
          id: `srv-${s.id}`,
          type: 'service',
          title: s.title,
          categoryLabel: s.tag ? s.tag.toUpperCase() : 'SERVICIO SALÓN',
          image: s.image,
          originalItem: s,
        });
      });

    // 2. Featured Press On Sets
    pressOnCatalog
      .filter((p) => p.featuredInCarousel !== false)
      .forEach((p) => {
        cards.push({
          id: `po-${p.id}`,
          type: 'press_on',
          title: p.name,
          categoryLabel: `PRESS ON · ${p.defaultTip.toUpperCase()}`,
          image: p.image,
          originalItem: p,
        });
      });

    // 3. Featured Inventory Items (Tienda / Cuidado & Bienestar)
    inventoryList
      .filter((i) => i.active !== false && (i.stock ?? 0) > 0 && i.featuredInCarousel !== false)
      .forEach((i) => {
        cards.push({
          id: `inv-${i.id}`,
          type: 'inventory',
          title: i.name,
          categoryLabel: 'CUIDADO & SPA',
          image: i.image,
          originalItem: i,
        });
      });

    return cards;
  };

  const baseCards = buildFeaturedCards();
  const baseSignature = baseCards.map((card) => card.id).join('|');

  // El orden aleatorio se genera solo en el cliente tras el montaje, evitando
  // cualquier hydration mismatch entre el render del servidor y del navegador.
  const [carouselState, setCarouselState] = useState<{
    signature: string;
    items: ShowcaseCardData[];
  } | null>(null);

  useEffect(() => {
    const cards = buildFeaturedCards();
    setCarouselState({
      signature: cards.map((card) => card.id).join('|'),
      items: buildInterleavedItems(cards),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSignature]);

  const activeItems = carouselState?.signature === baseSignature ? carouselState.items : baseCards;

  // Triple items for continuous infinite scroll loop
  const displayItems = activeItems.length > 0 ? [...activeItems, ...activeItems, ...activeItems] : [];

  // Handle card click according to item type
  const handleCardClick = (card: ShowcaseCardData) => {
    if (dragDistance > 8) {
      return;
    }

    if (card.type === 'promo') {
      const promo = card.originalItem as PromoDesign;
      const isPressOn = promo.category === 'press_on' || promo.collection?.toLowerCase().includes('press on');
      if (isPressOn) {
        openPromoPressOnModal(promo);
      } else {
        setSelectedPromoForDetails(promo);
      }
    } else if (card.type === 'service') {
      const srv = card.originalItem as ServiceItem;
      if (srv.id === 'retiro_sistema') {
        openBooking('removal');
      } else if (srv.id === 'acrilicas') {
        openBooking('custom', undefined, 'acrilicas');
      } else {
        openBooking('custom', undefined, srv.id);
      }
    } else if (card.type === 'press_on') {
      const po = card.originalItem as PressOnItem;
      const idx = pressOnCatalog.findIndex((p) => p.id === po.id);
      openPressOnModal('catalog', idx >= 0 ? idx : 0, 1);
    } else if (card.type === 'inventory') {
      // Abrir directamente el catálogo/tienda web (sin WhatsApp)
      setIsStoreModalOpen(true);
    }
  };

  // Continuous auto-scroll animation frame (paused ONLY when hovered)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || displayItems.length === 0) return;

    let animationFrameId: number;
    const speed = 0.65; // Smooth slow marquee speed

    const animate = () => {
      if (!isHovered && !isDragging && container) {
        container.scrollLeft += speed;

        const oneThird = container.scrollWidth / 3;
        if (container.scrollLeft >= oneThird * 2) {
          container.scrollLeft -= oneThird;
        } else if (container.scrollLeft <= 0) {
          container.scrollLeft += oneThird;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered, isDragging, displayItems.length]);

  // Initial scroll position to the middle third for smooth bidirectional wrapping
  useEffect(() => {
    const container = containerRef.current;
    if (container && container.scrollLeft === 0 && container.scrollWidth > 0) {
      const oneThird = container.scrollWidth / 3;
      if (oneThird > 0) {
        container.scrollLeft = oneThird;
      }
    }
  }, [displayItems.length]);

  // Mouse Drag Handlers with inertia and continuous smooth scrolling during drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeftState(containerRef.current.scrollLeft);
    setDragDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    setDragDistance(Math.abs(walk));
    containerRef.current.scrollLeft = scrollLeftState - walk;

    const oneThird = containerRef.current.scrollWidth / 3;
    if (containerRef.current.scrollLeft >= oneThird * 2) {
      containerRef.current.scrollLeft -= oneThird;
      setScrollLeftState(containerRef.current.scrollLeft);
      setStartX(x);
    } else if (containerRef.current.scrollLeft <= 0) {
      containerRef.current.scrollLeft += oneThird;
      setScrollLeftState(containerRef.current.scrollLeft);
      setStartX(x);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
  };

  // Touch Swipe Handlers
  const touchStartXRef = useRef(0);
  const touchScrollLeftRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    touchStartXRef.current = e.touches[0].pageX - containerRef.current.offsetLeft;
    touchScrollLeftRef.current = containerRef.current.scrollLeft;
    setDragDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - touchStartXRef.current) * 1.5;
    setDragDistance(Math.abs(walk));
    containerRef.current.scrollLeft = touchScrollLeftRef.current - walk;

    const oneThird = containerRef.current.scrollWidth / 3;
    if (containerRef.current.scrollLeft >= oneThird * 2) {
      containerRef.current.scrollLeft -= oneThird;
      touchScrollLeftRef.current = containerRef.current.scrollLeft;
      touchStartXRef.current = x;
    } else if (containerRef.current.scrollLeft <= 0) {
      containerRef.current.scrollLeft += oneThird;
      touchScrollLeftRef.current = containerRef.current.scrollLeft;
      touchStartXRef.current = x;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Manual smooth arrow scrolling buttons
  const scrollStep = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const offset = direction === 'left' ? -300 : 300;
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-14 sm:mb-16">
      {/* Header clean and despejado */}
      <div className="mb-6 px-4 sm:px-2 max-w-3xl">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
          <h2 className="text-2xl sm:text-3xl font-['Cinzel'] font-bold text-[#5D3704] tracking-tight">
            TENDENCIAS & NAIL ART
          </h2>
          <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
        </div>
        <p className="text-xs sm:text-sm font-['Marcellus'] text-[#7A6655] leading-relaxed">
          Explora nuestras últimas tendencias, sets exclusivos y el cuidado de tu belleza a un solo paso.<br />
          Selecciona tu estilo y permítenos engreírte.
        </p>
      </div>

      {/* Infinite Horizontal Carousel Track */}
      <div
        className="relative group/carousel overflow-hidden py-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Soft edge fade gradients */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-[#FAF7F2] to-transparent z-20" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l from-[#FAF7F2] to-transparent z-20" />

        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none scroll-smooth select-none cursor-grab active:cursor-grabbing px-4 sm:px-6 py-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayItems.map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              onClick={() => handleCardClick(card)}
              className="relative w-[230px] sm:w-[260px] h-[330px] sm:h-[370px] shrink-0 rounded-3xl overflow-visible border-none bg-[#2A1810] shadow-[0_6px_18px_rgba(93,55,4,0.10)] hover:shadow-[0_0_18px_rgba(255,236,170,0.55),0_0_36px_rgba(212,175,55,0.45),0_12px_30px_rgba(212,175,55,0.20)] transition-shadow duration-500 ease-out cursor-pointer group flex flex-col justify-end"
            >
              {/* High-Resolution Photography (recorte propio para esquinas redondeadas) */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl bg-[#2D1F16]">
                <img
                  src={card.image}
                  alt={card.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 filter brightness-[0.96] group-hover:brightness-100"
                  loading="lazy"
                />
                {/* Subtle top-to-bottom vignette for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/55 transition-colors duration-500" />
              </div>

              {/* Nombre directo sobre la imagen (sin recuadro, sin recorte) */}
              <div className="relative z-10 px-5 pb-7 pt-14 overflow-visible">
                <h3
                  className="font-['Great_Vibes'] text-white/95 text-[26px] sm:text-[30px] leading-[1.35] tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] [text-shadow:0_0_10px_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.55)] overflow-visible"
                  title={card.title}
                >
                  {card.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};
