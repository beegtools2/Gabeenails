export interface AdditionalItem {
  id: string;
  category: 'spa' | 'mantenimiento' | 'tamano' | 'formas' | 'disenos' | 'nailart';
  categoryLabel: string;
  name: string;
  description: string;
  price: number;
  unitLabel?: string;
  badge?: string;
  active?: boolean;
  targetSection?: 'servicios' | 'press_on' | 'both';
}

export const ADDITIONALS_DATA: AdditionalItem[] = [
  // Spa de Uñas
  {
    id: 'spa-parafina',
    category: 'spa',
    categoryLabel: 'Spa de Uñas',
    name: 'Baño de Parafina',
    description: 'Hidratación profunda térmica para manos resecas, cutículas y suavidad terciopelo.',
    price: 30,
    badge: 'Popular',
    active: true,
  },
  {
    id: 'spa-manos',
    category: 'spa',
    categoryLabel: 'Spa de Uñas',
    name: 'SPA de Manos Completo',
    description: 'Exfoliación con sales minerales, mascarilla de colágeno, toallas calientes y masaje revitalizante.',
    price: 50,
    badge: 'Recomendado',
    active: true,
  },
  {
    id: 'spa-pedicure',
    category: 'spa',
    categoryLabel: 'Spa de Uñas',
    name: 'Pedicure SPA Integral',
    description: 'Cuidado completo de pies, retiro de durezas, exfoliación intensiva, hidratación y esmaltado.',
    price: 85,
    active: true,
  },

  // Mantenimiento & Retiros
  {
    id: 'mant-gel',
    category: 'mantenimiento',
    categoryLabel: 'Mantenimiento & Retiros',
    name: 'Retiro de gel',
    description: 'Retiro cuidadoso con micromotor y brocas cerámicas sin dañar la lámina ungueal.',
    price: 20,
    badge: 'Frecuente',
    active: true,
  },
  {
    id: 'mant-acrilico',
    category: 'mantenimiento',
    categoryLabel: 'Mantenimiento & Retiros',
    name: 'Retiro de acrílico',
    description: 'Disolución y limado técnico de sistemas acrílicos o polygel.',
    price: 40,
    active: true,
  },
  {
    id: 'mant-tradicional',
    category: 'mantenimiento',
    categoryLabel: 'Mantenimiento & Retiros',
    name: 'Retiro de esmalte tradicional',
    description: 'Limpieza suave sin agentes abrasivos para uñas naturales.',
    price: 5,
    active: true,
  },

  // Tamaño (Largo)
  {
    id: 'tamano-4',
    category: 'tamano',
    categoryLabel: 'Largo de Uña',
    name: 'Largo #4',
    description: 'Extensión moderada elegante para destacar nail art.',
    price: 10,
    active: true,
  },
  {
    id: 'tamano-5',
    category: 'tamano',
    categoryLabel: 'Largo de Uña',
    name: 'Largo #5',
    description: 'Longitud pronunciada estilizada de impacto.',
    price: 20,
    active: true,
  },
  {
    id: 'tamano-6',
    category: 'tamano',
    categoryLabel: 'Largo de Uña',
    name: 'Largo #6+',
    description: 'Longitud XXL para estilos de máxima presencia y pasarela.',
    price: 30,
    active: true,
  },

  // Formas
  {
    id: 'forma-stiletto',
    category: 'formas',
    categoryLabel: 'Formas Especiales',
    name: 'Punta Stiletto',
    description: 'Punta afilada de precisión simétrica esculpida a mano.',
    price: 10,
    active: true,
  },

  // Diseños con Sistema
  {
    id: 'diseno-babyboomer',
    category: 'disenos',
    categoryLabel: 'Diseños con Sistema',
    name: 'Baby Boomer',
    description: 'Degradado ombré suave entre blanco lechoso y tono nude natural.',
    price: 10,
    badge: 'Tendencia',
    active: true,
  },
  {
    id: 'diseno-babyglitter',
    category: 'disenos',
    categoryLabel: 'Diseños con Sistema',
    name: 'Baby Glitter',
    description: 'Destellos encapsulados translúcidos con microglitter de brillo fino.',
    price: 10,
    active: true,
  },
  {
    id: 'diseno-acrilicas-color',
    category: 'disenos',
    categoryLabel: 'Diseños con Sistema',
    name: 'Acrílicas de Color',
    description: 'Estructuración directa con polímeros pigmentados de alta cobertura.',
    price: 20,
    active: true,
  },
  {
    id: 'diseno-encapsulado',
    category: 'disenos',
    categoryLabel: 'Diseños con Sistema',
    name: 'Encapsulado',
    description: 'Incrustación de láminas de oro, flores deshidratadas o conchas marinas en gel cristal.',
    price: 20,
    active: true,
  },
  {
    id: 'diseno-marmol',
    category: 'disenos',
    categoryLabel: 'Diseños con Sistema',
    name: 'Efecto Mármol',
    description: 'Veteado cuarzo orgánico y vetas de oro dibujadas a mano.',
    price: 25,
    active: true,
  },
  {
    id: 'diseno-reversa',
    category: 'disenos',
    categoryLabel: 'Diseños con Sistema',
    name: 'Técnica Reversa',
    description: 'Almendra esculpida con bisel y sonrisa ultra definida de alta competencia.',
    price: 30,
    active: true,
  },

  // Nail Art & Extras
  {
    id: 'art-cromo',
    category: 'nailart',
    categoryLabel: 'Nail Art & Efectos',
    name: 'Efecto Cromo / Espejo Líquido',
    description: 'Pigmento reflectivo plateado, dorado o rose gold de alto brillo.',
    price: 15,
    unitLabel: 'Set completo',
    active: true,
  },
  {
    id: 'art-pedreria',
    category: 'nailart',
    categoryLabel: 'Nail Art & Efectos',
    name: 'Pack/10 de Pedrería & Cristales',
    description: 'Gemas facetadas y cristales de alta calidad sellados con gel constructor.',
    price: 15,
    unitLabel: 'Pack 10 unidades',
    badge: 'Popular',
    active: true,
  },
  {
    id: 'art-dijes',
    category: 'nailart',
    categoryLabel: 'Nail Art & Efectos',
    name: 'Par de dijes 🎀',
    description: 'Par de moños o dijes coquette de resina o metal noble.',
    price: 5,
    unitLabel: 'Par',
    active: true,
  },
  {
    id: 'art-3d-4d',
    category: 'nailart',
    categoryLabel: 'Nail Art & Efectos',
    name: 'Par de 3D o 4D',
    description: 'Esculpido tridimensional en plastilina gel o acrílico en relieve.',
    price: 10,
    unitLabel: 'Par',
    active: true,
  },
];
