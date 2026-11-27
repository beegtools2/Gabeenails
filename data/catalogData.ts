import { PromoDesign, NailShape, NailLength, NailSystem, StudioSettings, Appointment, PressOnItem, ServiceItem, InventoryItem, CourseItem, CatbeeKnowledgeItem, CatbeeConfig, RemovalType, RemovalServiceOption, PromoDetailBlock } from '../types';

export const INITIAL_SETTINGS: StudioSettings = {
  studioName: "GABEE STUDIO",
  slogan: "Donde el Amor y el arte se encuentran",
  instagram: "@gabeenailsart",
  whatsappNumber: "934403311",
  yapeNumber: "934 403 311",
  yapeName: "Gabriela E. - Gabee Estudio",
  plinNumber: "934 403 311",
  plinName: "Gabriela E. - Gabee Estudio",
  bcpAccount: "19302589628084",
  bcpCci: "00219310258952808415",
  bcpName: "Gabee Estudio",
  defaultPromoPrice: 60,
  defaultDepositAmount: 20,
  levelBasicTitle: "Básico (S)",
  levelBasicDesc: "Esmaltado liso o francés minimalista",
  levelBasicPrice: 50,
  levelModerateTitle: "Moderado (M)",
  levelModerateDesc: "Flores a mano alzada, lazos, cat-eye",
  levelModeratePrice: 65,
  levelComplexTitle: "Complejo (C)",
  levelComplexDesc: "Relieves 3D, cromo extremo, pedrería",
  levelComplexPrice: 85,
  stilettoExtraCost: 10,
  longNailExtraCost: 15,
  removalExtraCost: 15,
  rhinestoneExtraCost: 15,
  homeServiceExtraCost: 20,
  studioAddress: "EN ESTUDIO • JESUS MARIA (La dirección se te enviará por WhatsApp tras confirmar tu adelanto)",
  studioCity: "Jesús María, Lima",
  timezone: "America/Lima (GMT -05:00)",
  adminPassword: "1234",
  sizeStock: {
    XS: true,
    S: true,
    M: true,
    L: true,
  },
  systemDescSoftgel: "Tips de gel flexible prensado y adherido con base coat curado en cabina UV. Máxima ligereza, flexibilidad y acabado ultranatural sin olor a monómero.",
  systemDescPolygel: "Fórmula híbrida que une la durabilidad del acrílico con la flexibilidad del gel. Esculpido perfecto con dual forms o molde sin dañar la lámina ungueal.",
  systemDescBuilderGel: "Gel autonivelante de alta densidad ideal para aportar estructura, alineación de placa ungueal, capping fortalecedor y extensiones sutiles.",
  systemDescAcrilicas: "Esculpido tradicional con monómero y polvo polímero de alta gama. Máxima dureza y resistencia para longitudes pronunciadas o uñas quebradizas.",
  systemDescEsmaltadoGel: "Manicura combinada rusa profunda y esmaltado semipermanente de brillo efecto espejo con duración intacta por más de 21 días.",
  systemDescRetiro: "Retiro profesional de acrílico, polygel o softgel utilizando micromotor con fresas de carburo cerámicas que preservan la integridad de tu uña natural.",
  disabledPresencialDates: [],
  disabledPresencialTimeSlots: {},
  dayModality: {},
  pressOnDeliveryMode: 'regular',
  yapeQrImage: '',
  plinQrImage: '',
  bcpQrImage: '',
  yapeQrCode: '',
  plinQrCode: '',
  bcpQrCode: '',
  aboutBio: `Soy Gaby, el corazón y las manos detrás de Gabee Studio. Cada set es una pequeña obra de arte creada con técnica, paciencia y un profundo amor por el detalle.\n\nMi compromiso es brindarte una experiencia cercana, segura y de calidad, cuidando la salud de tus uñas mientras realzamos tu estilo con diseños elegantes y atemporales.\n\nGracias por confiar en mi trabajo y permitir que el amor y el arte se encuentren en cada una de tus citas. ♥`,
  aboutPhoto: '',
  waTemplateNuestrosServicios: `*✦ CONFIRMACIÓN DE CITA | GABEE STUDIO ✦*
*✧ Reserva:* {codigo}
──────────────────────────
*✧ Cliente:* {cliente}
*✧ WhatsApp:* {whatsapp}
*✧ Nivel del Diseño:* {nivel}
*✧ Forma de la punta:* {forma}
*✧ Largo de la Uña:* {largo}
*✧ Detalles del Diseño:* {detalles}
*✧ Fecha:* {fecha}
*✧ Hora:* {hora}
*✧ Modalidad:* {modalidad}
*✧ Dirección:* {direccion}
*✧ Referencia:* {referencia}
*✧ Cumpleaños:* {cumpleanos}
*✧ Instagram:* {instagram}
*✧ Adicionales:* {adicionales}
──────────────────────────
*✧ Monto Total:* {total}
*✧ Adelanto para separar:* {adelanto}
*✧ Saldo pendiente:* {saldo}
*✧ Método de pago:* {metodo_pago}
*✧ N° de Operación:* {operacion}
──────────────────────────
*¡Hola Gaby! Ya realicé mi pago correspondiente para agendar mi cita. ¡Muchas gracias! ♡*`,
  waTemplateRetiro: `*✦ CONFIRMACIÓN DE CITA | GABEE STUDIO ✦*
*✧ Reserva:* {codigo}
──────────────────────────
*✧ Cliente:* {cliente}
*✧ WhatsApp:* {whatsapp}
*✧ Sistema de Retiro:* {servicio}
*✧ Fecha:* {fecha}
*✧ Hora:* {hora}
*✧ Modalidad:* {modalidad}
*✧ Dirección:* {direccion}
*✧ Referencia:* {referencia}
*✧ Cumpleaños:* {cumpleanos}
*✧ Instagram:* {instagram}
*✧ Adicionales:* {adicionales}
──────────────────────────
*✧ Monto Total:* {total}
*✧ Adelanto para separar:* {adelanto}
*✧ Saldo pendiente:* {saldo}
*✧ Método de pago:* {metodo_pago}
*✧ N° de Operación:* {operacion}
──────────────────────────
*¡Hola Gaby! Ya realicé mi pago correspondiente para agendar mi cita. ¡Muchas gracias! ♡*`,
  waTemplateEsmaltado: `*✦ CONFIRMACIÓN DE CITA | GABEE STUDIO ✦*
*✧ Reserva:* {codigo}
──────────────────────────
*✧ Cliente:* {cliente}
*✧ WhatsApp:* {whatsapp}
*✧ Nivel del Diseño:* {nivel}
*✧ Detalles del Diseño:* {detalles}
*✧ Fecha:* {fecha}
*✧ Hora:* {hora}
*✧ Modalidad:* {modalidad}
*✧ Dirección:* {direccion}
*✧ Referencia:* {referencia}
*✧ Cumpleaños:* {cumpleanos}
*✧ Instagram:* {instagram}
*✧ Adicionales:* {adicionales}
──────────────────────────
*✧ Monto Total:* {total}
*✧ Adelanto para separar:* {adelanto}
*✧ Saldo pendiente:* {saldo}
*✧ Método de pago:* {metodo_pago}
*✧ N° de Operación:* {operacion}
──────────────────────────
*¡Hola Gaby! Ya realicé mi pago correspondiente para agendar mi cita. ¡Muchas gracias! ♡*`,
  waTemplateCatalogoPressOn: `*✦ CONFIRMACIÓN DE PEDIDO | GABEE STUDIO ✦*
*✧ Reserva:* {codigo}
──────────────────────────
*✧ Cliente:* {cliente}
*✧ WhatsApp:* {whatsapp}
*✧ Nombre del set:* {servicio}
*✧ Talla:* {talla}
*✧ Entrega:* {modalidad}
*✧ Dirección:* {direccion}
*✧ Referencia:* {referencia}
*✧ Cumpleaños:* {cumpleanos}
*✧ Instagram:* {instagram}
*✧ Adicionales:* {adicionales}
──────────────────────────
*✧ Monto Total:* {total}
*✧ Método de pago:* {metodo_pago}
*✧ N° de Operación:* {operacion}
──────────────────────────
*¡Hola Gaby! Te adjunto mi comprobante de pago para confirmar mi pedido. ¡Muchas gracias! ♡*`,
  waTemplatePedidoPersonalizado: `*✦ CONFIRMACIÓN DE PEDIDO PERSONALIZADO | GABEE STUDIO ✦*
*✧ Reserva:* {codigo}
──────────────────────────
*✧ Cliente:* {cliente}
*✧ WhatsApp:* {whatsapp}
*✧ Medidas (Derecha):* {medidas_der}
*✧ Medidas (Izquierda):* {medidas_izq}
*✧ Tipo de uña:* {anatomia}
*✧ Nota de salud:* {nota_salud}
*✧ Detalles del Diseño:* {detalles}
*✧ Forma de la punta:* {forma}
*✧ Largo de la Uña:* {largo}
*✧ Entrega:* {modalidad}
*✧ Dirección:* {direccion}
*✧ Referencia:* {referencia}
*✧ Cumpleaños:* {cumpleanos}
*✧ Instagram:* {instagram}
*✧ Adicionales:* {adicionales}
──────────────────────────
*✧ Monto Total:* {total}
*✧ Método de pago:* {metodo_pago}
*✧ N° de Operación:* {operacion}
──────────────────────────
*¡Hola Gaby! Te adjunto mi comprobante de pago para confirmar mi pedido. ¡Muchas gracias! ♡*`,
  waTemplatePromoSistemas: `*✦ CONFIRMACIÓN DE CITA PROMOCIONAL | GABEE STUDIO ✦*
*✧ Reserva:* {codigo}
──────────────────────────
*✧ Cliente:* {cliente}
*✧ WhatsApp:* {whatsapp}
*✧ Nivel del Diseño:* Moderado (M) - Incluido en Promoción
*✧ Forma de la punta:* {forma}
*✧ Largo de la Uña:* {largo}
*✧ Detalles del Diseño:* {detalles}
*✧ Fecha:* {fecha}
*✧ Hora:* {hora}
*✧ Modalidad:* {modalidad}
*✧ Dirección:* {direccion}
*✧ Referencia:* {referencia}
*✧ Cumpleaños:* {cumpleanos}
*✧ Instagram:* {instagram}
*✧ Adicionales:* {adicionales}
──────────────────────────
*✧ Monto Total:* {total}
*✧ Adelanto para separar:* {adelanto}
*✧ Saldo pendiente:* {saldo}
*✧ Método de pago:* {metodo_pago}
*✧ N° de Operación:* {operacion}
──────────────────────────
*¡Hola Gaby! Ya realicé mi pago correspondiente para agendar mi cita. ¡Muchas gracias! ♡*`,
  waTemplatePromoPressOn: `*✦ CONFIRMACIÓN DE PEDIDO PROMOCIONAL | GABEE STUDIO ✦*
*✧ Reserva:* {codigo}
──────────────────────────
*✧ Cliente:* {cliente}
*✧ WhatsApp:* {whatsapp}
*✧ Nombre del set:* {servicio}
*✧ Talla:* {talla}
*✧ Kit Incluido:* {kit}
*✧ Entrega:* {modalidad}
*✧ Dirección:* {direccion}
*✧ Cumpleaños:* {cumpleanos}
*✧ Instagram:* {instagram}
*✧ Adicionales:* {adicionales}
──────────────────────────
*✧ Monto Total:* {total}
*✧ Método de pago:* {metodo_pago}
*✧ N° de Operación:* {operacion}
──────────────────────────
*¡Hola Gaby! Te adjunto mi comprobante de pago para confirmar mi pedido. ¡Muchas gracias! ♡*`,
};

export const NAIL_SHAPES: NailShape[] = [
  {
    id: "almond",
    name: "Almendra | Almond",
    description: "Puntas sutilmente redondeadas que estilizan los dedos. Ideal para todo largo.",
    extraCost: 0,
    popular: true,
  },
  {
    id: "square",
    name: "Cuadrada | Square",
    description: "Líneas rectas y esquinas nítidas o semi redondeadas. Clásica y moderna.",
    extraCost: 0,
    popular: true,
  },
  {
    id: "coffin",
    name: "Coffin | Ballerina",
    description: "Cónica con punta recta horizontal. La forma favorita de las tendencias 2026.",
    extraCost: 10,
  },
  {
    id: "stiletto",
    name: "Stiletto | Punta Fina",
    description: "Punta afilada dramática y elegante. Requiere esculpido especializado.",
    extraCost: 10,
  },
];

export const NAIL_LENGTHS: NailLength[] = [
  {
    id: "length_xs",
    label: "XS | 0 - 1",
    range: "0 - 1",
    code: "(XS)",
    extraCost: 0,
    description: "Sin costo adicional",
  },
  {
    id: "length_s",
    label: "S | 2 - 3",
    range: "2 - 3",
    code: "(S)",
    extraCost: 0,
    description: "Sin costo adicional",
  },
  {
    id: "length_m",
    label: "M | 4 - 5",
    range: "4 - 5",
    code: "(M)",
    extraCost: 10,
    description: "S/. 10 adicional",
  },
  {
    id: "length_l",
    label: "L | 6 - 7",
    range: "6 - 7",
    code: "(L)",
    extraCost: 20,
    description: "S/. 20 adicional",
  },
  {
    id: "length_xl",
    label: "XL | 8 - 9",
    range: "8 - 9",
    code: "(XL)",
    extraCost: 30,
    description: "S/. 30 adicional",
  },
];

export const NAIL_SYSTEMS: NailSystem[] = [
  {
    id: "softgel",
    name: "Softgel",
    description: "Tips completos de gel prensado. Ligero, flexible y acabado ultranatural sin olor a monómero.",
    extraCost: 0,
    inPromo: true,
  },
  {
    id: "polygel",
    name: "Polygel",
    description: "Híbrido de acrílico y gel curado en lámpara LED. Resistencia superior sin dañar la uña natural.",
    extraCost: 0,
    inPromo: true,
  },
  {
    id: "builder_gel",
    name: "Builder Gel",
    description: "Gel autonivelante de alta densidad ideal para estructura, capping o extensiones con molde.",
    extraCost: 0,
    inPromo: true,
  },
  {
    id: "acrilicas",
    name: "Uñas Acrílicas",
    description: "Esculpido tradicional con monómero y polímero. Máxima dureza y resistencia para uñas largas.",
    extraCost: 20,
    inPromo: false,
  },
  {
    id: "esmaltado_gel",
    name: "Esmaltado en Gel",
    description: "Manicura rusa profunda y esmaltado semipermanente de brillo efecto espejo por 21+ días.",
    extraCost: 0,
    inPromo: false,
  },
];

export function getSystemPrices(systemId: string) {
  const norm = (systemId || '').toLowerCase();
  if (norm === 'acrilicas' || norm === 'acrylics' || norm === 'acrílicas') {
    return {
      sutil: 80,
      moderado: 100,
      complejo: 120,
    };
  }
  if (norm === 'esmaltado_gel' || norm === 'gel') {
    return {
      sutil: 40,
      moderado: 60,
      complejo: 80,
    };
  }
  // Softgel, Polygel, Builder Gel (Default)
  return {
    sutil: 60,
    moderado: 80,
    complejo: 100,
  };
}

export function getServicePrices(service?: ServiceItem | null, fallbackSystemId?: string) {
  if (service && (service.levelBasicPrice !== undefined || service.levelModeratePrice !== undefined)) {
    return {
      sutilTitle: service.levelBasicTitle || 'Sutil (S)',
      sutil: service.levelBasicPrice ?? 60,
      sutilDesc: service.levelBasicDesc || 'Esmaltado liso, unicolor o francés minimalista elegante.',
      moderadoTitle: service.levelModerateTitle || 'Moderado (M)',
      moderado: service.levelModeratePrice ?? 80,
      moderadoDesc: service.levelModerateDesc || 'Nail art a mano alzada, flores, lazos, cat-eye o cromo sutil.',
      complejoTitle: service.levelComplexTitle || 'Complejo (C)',
      complejo: service.levelComplexPrice ?? 100,
      complejoDesc: service.levelComplexDesc || 'Relieves 3D/4D de autor, cromo extremo, pedrería y texturas.',
    };
  }
  const fallback = getSystemPrices(fallbackSystemId || service?.id || 'softgel');
  return {
    sutilTitle: 'Sutil (S)',
    sutil: fallback.sutil,
    sutilDesc: 'Esmaltado liso, unicolor o francés minimalista elegante.',
    moderadoTitle: 'Moderado (M)',
    moderado: fallback.moderado,
    moderadoDesc: 'Nail art a mano alzada, flores, lazos, cat-eye o cromo sutil.',
    complejoTitle: 'Complejo (C)',
    complejo: fallback.complejo,
    complejoDesc: 'Relieves 3D/4D de autor, cromo extremo, pedrería y texturas.',
  };
}

export const DEFAULT_PROMO_DETAILS_TITLE = 'TÉRMINOS Y CONDICIONES (PROMO S/ 60)';

export const DEFAULT_PROMO_DETAILS_BLOCKS: PromoDetailBlock[] = [
  {
    id: 'detalle-diseno',
    title: '🎨 Sobre el Diseño Moderado (Incluido)',
    bulleted: false,
    content: [
      'Nuestra promoción de S/ 60 te incluye un Diseño Moderado, pensado para quienes buscan uñas hermosas, modernas y con un toque de arte especial. Este nivel abarca efectos en tendencia como el efecto espejo, perlado, cat eye, blooming y dibujos sencillos hechos a mano alzada.',
      '**Ten en cuenta:** Para mantener esta tarifa promocional, no están incluidos los relieves ni figuras en 3D (como personajes o elementos con volumen), caricaturas complejas ni pedrería. Si buscas un arte más avanzado o tridimensional, con gusto podemos agendar tu cita a través de la tarifa regular en la sección "Nuestros Servicios".',
    ].join('\n'),
  },
  {
    id: 'condiciones-servicio',
    title: '💅 Condiciones del Servicio y Preparación',
    bulleted: true,
    content: [
      '**Estado de las uñas:** Te pedimos acudir a tu cita con las uñas completamente limpias (despintadas y libres de productos anteriores). En caso de requerir retiro de algún material previo, este servicio tiene un costo adicional.',
      '**Forma de la uña:** La promoción aplica para puntas en forma Almendra o Cuadrada. Si deseas una forma diferente o especializada, se aplicará un costo adicional.',
      '**Largo de las uñas:** El largo incluido en la promo es hasta el N° 3. Si prefieres un largo mayor, se cobrará un costo adicional proporcional.',
      '**Elección del sistema:** Puedes elegir entre Soft Gel o Builder Gel. De todas formas, al iniciar la cita evaluaremos tus uñas naturales para recomendarte la técnica ideal, ya que no todos los sistemas se adaptan de la misma forma a cada tipo de uña.',
    ].join('\n'),
  },
  {
    id: 'atencion-reservas',
    title: '📍 Atención y Reservas',
    bulleted: true,
    content: [
      '**Modalidad de atención:**',
      '- **En Studio:** La tarifa base de atención inicia a partir de S/ 60. Por motivos de seguridad y privacidad, la dirección exacta de nuestro Studio te será compartida inmediatamente después de confirmar tu reserva.',
      '- **A Domicilio:** La atención a domicilio inicia desde los S/ 80, añadiendo un recargo adicional según la distancia y ubicación.',
      '**Reserva de cita:** Tu espacio se agenda obligatoriamente con el **50% de depósito previo**. El 50% restante se cancela el día de tu atención en el estudio o a domicilio.',
      '**Cancelaciones y Reprogramaciones:** Si necesitas cambiar la fecha o la hora de tu cita, te pedimos avisarnos con al menos 24 horas de anticipación para poder reprogramarte sin inconvenientes. De lo contrario, o en caso de inasistencia, el adelanto no podrá ser devuelto ni reprogramado.',
    ].join('\n'),
  },
];

export const DEFAULT_PRESS_ON_PROMO_DETAILS_TITLE = 'TÉRMINOS Y CONDICIONES (PRESS ON EN PROMOCIÓN)';

export const DEFAULT_PRESS_ON_PROMO_DETAILS_BLOCKS: PromoDetailBlock[] = [
  {
    id: 'po-sobre-diseno',
    title: '🎨 Sobre el set Press On',
    bulleted: false,
    content: [
      'Diseño exclusivo elaborado a mano con geles de alta gama y acabado vitrificado de salón.',
      'Sets listos para usar en tallas estándar (XS, S, M, L) o confeccionados a medida según la anatomía de tu uña.',
    ].join('\n'),
  },
  {
    id: 'po-modalidad-pedido',
    title: '💅 Modalidad y opciones de pedido',
    bulleted: true,
    content: [
      '**Sets Prediseñados (Stock Inmediato):** desde **S/. 50**.',
      '**Sets Personalizados a Medida:** desde **S/. 80**, confeccionados 100% a tu medida.',
      '**Calidad:** uñas de gel reforzadas de alta densidad, 100% reutilizables con el cuidado adecuado.',
    ].join('\n'),
  },
  {
    id: 'po-super-promo',
    title: '🔥 Super Promo Press On',
    bulleted: false,
    content: 'Si te llevas **2 pedidos de Press On**, te sale a **S/. 90** en total. ¡Combina tus diseños favoritos! 💕',
  },
  {
    id: 'po-kit-incluido',
    title: '🎁 Kit elemental gratis incluido',
    bulleted: true,
    content: [
      'Lima de preparación suave para uña natural.',
      'Plancheta de pegatinas adhesivas (Adhesive Tabs - 24 pcs).',
      'Pegamento líquido de alta adherencia.',
      'Repujador de madera para cutículas.',
      'Alcohol pad preparador higienizante.',
      'Set de stickers decorativos de regalo y sorpresa exclusiva de Gabee Studio.',
    ].join('\n'),
  },
  {
    id: 'po-pago-envios',
    title: '💳 Pago y envíos',
    bulleted: true,
    content: [
      'Los sets Press On se abonan al **100% por adelantado** vía Yape, Plin o Transferencia BCP.',
      'Envíos express a todo Lima y a nivel nacional por Olva Courier o Shalom, además de entrega en el estudio.',
    ].join('\n'),
  },
];

export const PROMO_CATALOG_DESIGNS: PromoDesign[] = [
  {
    id: "promo-01",
    title: "Velvet Cat-Eye con Lazos 3D y Cromo Líquido",
    collection: "Lujo & Cromo",
    description: "Brillo magnético multidimensional rosa palo con ondas orgánicas en cromo plateado líquido 3D. Inspirado en el catálogo 2026.",
    technique: "1. Preparación de cutícula y deshidratación. 2. Colocación de Softgel o Builder Gel. 3. Aplicación de esmalte magnético cat-eye rosa activado con imán cilíndrico en técnica terciopelo. 4. Esculpido de relieve 3D con gel constructor y frotado de pigmento cromo plata espejo. 5. Sellado con top coat templado anti-rayaduras.",
    level: "moderado",
    durationMinutes: 105,
    price: 60,
    image: "/src/assets/images/nail_chrome_cateye_1792392507727.jpg",
    tags: ["Cat-Eye", "Cromo 3D", "Lazos", "Tendencia 2026", "Elegante"],
    featured: true,
    active: true,
    recommendedSystem: "Softgel o Polygel",
    category: "salon",
    promoType: 'clasica',
    promoDetailsTitle: DEFAULT_PROMO_DETAILS_TITLE,
    promoDetailsBlocks: DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
  },
  {
    id: "promo-02",
    title: "Jardín Silvestre & Margaritas Micro a Mano Alzada",
    collection: "Florales & Jardín",
    description: "Base nude lechosa translúcida con margaritas botánicas y hojas verde salvia dibujadas con micropincel 00.",
    technique: "1. Manicura rusa o combinada con fresas diamantadas. 2. Base rubber lechosa (Milky Nude) para efecto translúcido. 3. Pintura manual con painting gel blanco y detalles amarillos y verde pistacho. 4. Doble curado en cabina UV/LED de 48W. 5. Top coat ultra brillante sin capa de dispersión.",
    level: "moderado",
    durationMinutes: 90,
    price: 60,
    image: "/src/assets/images/nail_floral_botanical_1792392507089.jpg",
    tags: ["Margaritas", "Milky Nude", "Botánico", "Primavera", "Almendra"],
    featured: true,
    active: true,
    recommendedSystem: "Builder Gel o Softgel",
    category: "salon",
    promoType: 'clasica',
    promoDetailsTitle: DEFAULT_PROMO_DETAILS_TITLE,
    promoDetailsBlocks: DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
  },
  {
    id: "promo-03",
    title: "Celestial Y2K con Estrellas Cromadas & Destellos",
    collection: "Y2K & Celestial Cyber",
    description: "Estrellas de cuatro puntas en relieve plateado y micro cristales sutiles sobre base nude porcelana.",
    technique: "1. Sanitización y nivelación con base de refuerzo. 2. Tono nude nude-rosé translúcido de dos capas. 3. Trazado geométrico de estrellas Y2K con gel liner de alta densidad. 4. Adhesión de micro destellos reflectivos en puntos clave. 5. Encapsulado con top coat de alto brillo.",
    level: "moderado",
    durationMinutes: 100,
    price: 60,
    image: "/src/assets/images/nail_celestial_stars_1792392507735.jpg",
    tags: ["Y2K", "Estrellas", "Destellos", "Plata", "Aesthetic"],
    featured: true,
    active: true,
    recommendedSystem: "Softgel o Polygel",
    category: "salon",
    promoType: 'clasica',
    promoDetailsTitle: DEFAULT_PROMO_DETAILS_TITLE,
    promoDetailsBlocks: DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
  },
  {
    id: "promo-04",
    title: "Amalfi Lemon Citrus & Francesa Botánica",
    collection: "Frutas Verano",
    description: "Inspirado en la Riviera italiana con limones amarillos frescos y hojas botánicas en puntas francesas micro.",
    technique: "1. Aplicación de sistema Softgel punta almendra. 2. Esmaltado base nude traslúcido. 3. Trazado de francesita asimétrica amarilla y arte a mano alzada de rodajas de limón con sombreado acuarela. 4. Top coat glass finish.",
    level: "moderado",
    durationMinutes: 100,
    price: 60,
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
    tags: ["Limones", "Amalfi", "Verano", "Frutas", "Fresca"],
    featured: false,
    active: true,
    recommendedSystem: "Softgel",
    category: "salon",
    promoType: 'clasica',
    promoDetailsTitle: DEFAULT_PROMO_DETAILS_TITLE,
    promoDetailsBlocks: DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
  },
  {
    id: "promo-05",
    title: "Coquette French con Moños Negros y Lunares",
    collection: "Coquette & Lazos",
    description: "Elegancia parisina en blanco y negro con lazos coquette, lunares micro polka dot y acabado porcelana.",
    technique: "1. Preparación de uña natural y extensión cuadrada. 2. Base semipermanente rosada neutral. 3. Francesa en corte recto o smile line. 4. Detalle de lacitos negros con puntillero y pincel de detalle. 5. Top coat anti amarillamiento.",
    level: "moderado",
    durationMinutes: 95,
    price: 60,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    tags: ["Coquette", "Polka Dot", "Lazos", "Black & White", "Cuadrada"],
    featured: false,
    active: true,
    recommendedSystem: "Polygel o Builder Gel",
    category: "salon",
    promoType: 'clasica',
    promoDetailsTitle: DEFAULT_PROMO_DETAILS_TITLE,
    promoDetailsBlocks: DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
  },
  {
    id: "promo-06",
    title: "Sea Shell Ocean & Estrellas de Mar 3D",
    collection: "Verano & Texturas",
    description: "Efecto concha marina perlada en relieve tridimensional, estrellas de mar corales y perlas miniatura.",
    technique: "1. Base aperlada nacarada. 2. Creación de acanalado tipo concha marina con gel 3D builder esculpido. 3. Aplicación de polvo aurora iridiscente. 4. Pintado a mano alzada de estrellas de mar y sellado.",
    level: "moderado",
    durationMinutes: 110,
    price: 60,
    image: "https://images.unsplash.com/photo-1519014816548-bf785122c2a2?auto=format&fit=crop&w=800&q=80",
    tags: ["Sirena", "Seashell", "Perlas", "3D Texture", "Océano"],
    featured: true,
    active: true,
    recommendedSystem: "Softgel o Builder Gel",
    category: "salon",
    promoType: 'clasica',
    promoDetailsTitle: DEFAULT_PROMO_DETAILS_TITLE,
    promoDetailsBlocks: DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
  },
  {
    id: "promo-po-01",
    title: "Set Press On Coquette Rosa & Lazos 3D",
    collection: "Press On Promo",
    description: "Set press on reutilizable con lazos coquette y base rosada con kit elemental incluido.",
    technique: "1. Confección artesanal sobre tips de alta resistencia. 2. Esmaltado gel rosado lechoso. 3. Esculpido de lazos 3D y sellado vitrificado.",
    level: "moderado",
    durationMinutes: 45,
    price: 50,
    image: "/assets/aistudio/PO_2_4dd05dab.JPG",
    tags: ["Press On", "Coquette", "Lazos", "Reutilizable"],
    featured: true,
    active: true,
    recommendedSystem: "Press On Set",
    category: "press_on",
  },
  {
    id: "promo-po-02",
    title: "Set Press On Glazed Donut & Estrellas",
    collection: "Press On Promo",
    description: "Efecto glazed donut perlado con destellos cromados y kit elemental incluido.",
    technique: "1. Base nude satinada con polvo aurora perlado. 2. Trazado de estrellas cromadas y kit elemental de aplicación.",
    level: "moderado",
    durationMinutes: 45,
    price: 50,
    image: "/assets/aistudio/PO_3_401fe5ea.JPG",
    tags: ["Press On", "Glazed Donut", "Estrellas", "Cromo"],
    featured: true,
    active: true,
    recommendedSystem: "Press On Set",
    category: "press_on",
  }
];

export const TERMS_AND_CONDITIONS = [
  {
    title: "Uñas Limpias Obligatorias",
    description: "Debe venir con las uñas LIMPIAS (despintadas, sin esmaltes ni productos previos), porque el retiro tiene un costo adicional de S/. 15.",
    badge: "Indispensable",
  },
  {
    title: "Pedrería y Cristales",
    description: "La pedrería es un costo adicional. Las imágenes del catálogo son referenciales y de inspiración; la pedrería no está incluida en el precio base de la promoción.",
    badge: "Adicional",
  },
  {
    title: "Forma de la Uña",
    description: "Puedes elegir libremente forma Cuadrada, Almendra, Coffin u Ovalada sin costo extra. Solo la forma Stiletto tiene un costo adicional de S/. 10.",
    badge: "Elección Libre",
  },
  {
    title: "Tamaño Válido en Promoción",
    description: "Puedes elegir el tamaño de tus uñas válido hasta el número #3 (S y M). Si las deseas más largas (#4 al #10 / L, XL, XXL) tiene un costo adicional.",
    badge: "Hasta #3 Incluido",
  },
  {
    title: "Sistemas Incluidos en la Promoción",
    description: "El sistema de la promoción es a elección de la clienta entre Softgel, Polygel o Builder Gel. De todas maneras se va a evaluar y recomendar cuál es el mejor ya que no todos los sistemas son para todo tipo de uña. (También realizo Acrílicas pero no están dentro de la promoción, por favor no insistir).",
    badge: "Softgel / Polygel / Builder",
  },
  {
    title: "Atención en Estudio o a Domicilio",
    description: "La atención es en mi estudio o a domicilio. Todo servicio a domicilio es desde los S/. 60 con una tarifa de movilidad adicional dependiendo de la distancia. Para pasarte mi dirección exacta, por temas de seguridad primero debes separar tu cita con el adelanto.",
    badge: "Seguridad & Ubicación",
  },
  {
    title: "Separación de Cita con Adelanto (50% Obligatorio)",
    description: "La cita se separa formalmente con un adelanto del 50% del valor del servicio o promoción elegida vía Yape, Plin o Transferencia BCP. El 50% restante se abona el día de tu atención en el estudio o a domicilio. En caso de que requieras reprogramar o cancelar tu cita, debes avisar con anticipación mínima de 24 horas para reprogramar la fecha, de lo contrario se perderá el adelanto.",
    badge: "Adelanto 50%",
  },
];

export const INITIAL_SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-101",
    code: "GNB-2026-881",
    createdAt: new Date().toISOString(),
    clientName: "Valeria Mendoza",
    clientPhone: "+51 984 552 110",
    clientInstagram: "@valeriamdz",
    serviceType: "promotion",
    promoDesignId: "promo-01",
    promoDesignTitle: "Velvet Cat-Eye con Lazos 3D y Cromo Líquido",
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: "02:30 PM",
    locationType: "studio",
    status: "confirmed",
    totalPrice: 60,
    depositRequired: 20,
    depositPaid: true,
    paymentMethod: "yape",
    notes: "Cliente puntual. Solicita sistema Polygel por uñas quebradizas.",
  },
  {
    id: "apt-102",
    code: "GNB-2026-882",
    createdAt: new Date().toISOString(),
    clientName: "Camila Torres",
    clientPhone: "+51 977 123 456",
    clientInstagram: "@cami.nailslove",
    serviceType: "promotion",
    promoDesignId: "promo-02",
    promoDesignTitle: "Jardín Silvestre & Margaritas Micro",
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    timeSlot: "11:30 AM",
    locationType: "studio",
    status: "pending_deposit",
    totalPrice: 60,
    depositRequired: 20,
    depositPaid: false,
    paymentMethod: "plin",
    notes: "Esperando comprobante de adelanto en WhatsApp.",
  },
];

export const INITIAL_PRESS_ON_ITEMS: PressOnItem[] = [
  {
    id: 'set-1',
    name: 'VELVET CAT-EYE & CROMO',
    price: 80.0,
    shortDesc: 'Diseño magnético aterciopelado con reflejos dorados y relieves 3D...',
    fullDesc:
      'Diseño magnético aterciopelado con reflejos dorados y relieves 3D cromados hechos a mano con gel de alta densidad, cruz gótica y base nude translúcida.',
    image: '/assets/aistudio/PO_2_4dd05dab.JPG',
    gallery: [
      '/assets/aistudio/PO_2_4dd05dab.JPG',
      '/src/assets/images/nail_chrome_cateye_1792392507727.jpg',
    ],
    defaultTip: 'almendra',
    includedKit: 'premium',
    stock: 3,
    isBestSeller: true,
    featuredInCarousel: true,
  },
  {
    id: 'set-2',
    name: '3D GEL SCULPTED & CELESTIAL',
    price: 60.0,
    shortDesc: 'Figuras en relieve esculpidas, estrellas de 4 puntas plateadas, micro gemas...',
    fullDesc:
      'Pétalos florales 3D turquesa esculpidos en relief con micro destellos aqua esmeralda, delicados lazos cromados, estrellas plateadas y acabado vitrificado anti-rayaduras.',
    image: '/assets/aistudio/PO_3_401fe5ea.JPG',
    gallery: [
      '/assets/aistudio/PO_3_401fe5ea.JPG',
      '/src/assets/images/nail_celestial_stars_1792392507735.jpg',
    ],
    defaultTip: 'almendra',
    includedKit: 'standard',
    stock: 2,
    isTrending: true,
    featuredInCarousel: true,
  },
  {
    id: 'set-3',
    name: 'GLAZED DONUT & FRENCH ROSE',
    price: 75.0,
    shortDesc: 'Efecto perla satinada ultra brillante inspirado en Hailey Bieber con borde...',
    fullDesc:
      'Efecto perla cromada ultra brillante inspirado en Hailey Bieber con bordes franceses micro delineados en oro y delicados acentos botánicos satinados.',
    image: '/assets/aistudio/PO_glazed_rose.jpg',
    gallery: [
      '/assets/aistudio/PO_glazed_rose.jpg',
      '/src/assets/images/nail_floral_botanical_1792392507089.jpg',
    ],
    defaultTip: 'almendra',
    includedKit: 'standard',
    stock: 5,
    featuredInCarousel: true,
  },
];

export const INITIAL_SERVICES_CATALOG: ServiceItem[] = [
  {
    id: 'softgel',
    title: 'Softgel',
    tag: 'Tips Completos de Gel',
    priceLabel: 'Desde S/. 60',
    image: '/src/assets/images/nail_chrome_cateye_1792392507727.jpg',
    description:
      'Tips de gel flexible prensado y adherido con base coat curado en cabina UV. Máxima ligereza, flexibilidad y acabado ultranatural sin olor a monómero.',
    active: true,
    featuredInCarousel: true,
    levelBasicTitle: 'Sutil (S)',
    levelBasicPrice: 60,
    levelBasicDesc: 'Esmaltado liso, unicolor o francés minimalista elegante.',
    levelModerateTitle: 'Moderado (M)',
    levelModeratePrice: 80,
    levelModerateDesc: 'Nail art a mano alzada, flores, lazos, cat-eye o cromo sutil.',
    levelComplexTitle: 'Complejo (C)',
    levelComplexPrice: 100,
    levelComplexDesc: 'Relieves 3D/4D de autor, cromo extremo, pedrería y texturas.',
  },
  {
    id: 'polygel',
    title: 'Polygel',
    tag: 'Híbrido de Alta Resistencia',
    priceLabel: 'Desde S/. 60',
    image: '/src/assets/images/nail_floral_botanical_1792392507089.jpg',
    description:
      'Fórmula híbrida que une la durabilidad del acrílico con la flexibilidad del gel. Esculpido perfecto con dual forms o molde sin dañar la lámina ungueal.',
    active: true,
    featuredInCarousel: true,
    levelBasicTitle: 'Sutil (S)',
    levelBasicPrice: 60,
    levelBasicDesc: 'Esmaltado liso o francés sutil.',
    levelModerateTitle: 'Moderado (M)',
    levelModeratePrice: 80,
    levelModerateDesc: 'Diseño intermedio a mano alzada, flores y cat-eye.',
    levelComplexTitle: 'Complejo (C)',
    levelComplexPrice: 100,
    levelComplexDesc: 'Estructura con relieves 3D, pedrería y cromo.',
  },
  {
    id: 'builder_gel',
    title: 'Builder Gel',
    tag: 'Gel de Construcción & Capping',
    priceLabel: 'Desde S/. 60',
    image: '/src/assets/images/nail_celestial_stars_1792392507735.jpg',
    description:
      'Gel autonivelante de alta densidad ideal para aportar estructura, alineación de placa ungueal, capping fortalecedor y extensiones sutiles.',
    active: true,
    featuredInCarousel: true,
    levelBasicTitle: 'Sutil (S)',
    levelBasicPrice: 60,
    levelBasicDesc: 'Capping natural o francés clásico.',
    levelModerateTitle: 'Moderado (M)',
    levelModeratePrice: 80,
    levelModerateDesc: 'Diseños a mano alzada y detalles sutiles.',
    levelComplexTitle: 'Complejo (C)',
    levelComplexPrice: 100,
    levelComplexDesc: 'Relieves y arte 3D avanzado.',
  },
  {
    id: 'acrilicas',
    title: 'Uñas Acrílicas',
    tag: 'Esculpido Estructural',
    priceLabel: 'Desde S/. 80',
    image: '/assets/aistudio/PO_3_401fe5ea.JPG',
    description:
      'Esculpido tradicional con monómero y polvo polímero de alta gama. Máxima dureza y resistencia para longitudes pronunciadas o uñas quebradizas.',
    active: true,
    featuredInCarousel: true,
    levelBasicTitle: 'Sutil (S)',
    levelBasicPrice: 80,
    levelBasicDesc: 'Esculpido liso o francés clásico.',
    levelModerateTitle: 'Moderado (M)',
    levelModeratePrice: 100,
    levelModerateDesc: 'Diseño a mano alzada y detalles cromados.',
    levelComplexTitle: 'Complejo (C)',
    levelComplexPrice: 120,
    levelComplexDesc: 'Esculpido 3D, pedrería completa y arte extremo.',
  },
  {
    id: 'esmaltado_gel',
    title: 'Esmaltado en Gel',
    tag: 'Semipermanente Ruso',
    priceLabel: 'Desde S/. 40',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
    description:
      'Manicura combinada rusa profunda y esmaltado semipermanente de brillo efecto espejo con duración intacta por más de 21 días.',
    active: true,
    featuredInCarousel: true,
    levelBasicTitle: 'Sutil (S)',
    levelBasicPrice: 40,
    levelBasicDesc: 'Manicura rusa profunda y esmaltado unicolor.',
    levelModerateTitle: 'Moderado (M)',
    levelModeratePrice: 60,
    levelModerateDesc: 'Diseño minimalista o francesa en uña natural.',
    levelComplexTitle: 'Complejo (C)',
    levelComplexPrice: 80,
    levelComplexDesc: 'Diseños combinados en todas las uñas.',
  },
  {
    id: 'retiro_sistema',
    title: 'Retiro de Sistema',
    tag: 'Técnica Segura & Cuidadosa',
    priceLabel: 'Desde S/. 20',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80',
    description:
      'Retiro profesional de acrílico, polygel o softgel utilizando micromotor con fresas de carburo cerámicas que preservan la integridad de tu uña natural.',
    active: true,
    featuredInCarousel: true,
    levelBasicTitle: 'Retiro Básico (Gel)',
    levelBasicPrice: 20,
    levelBasicDesc: 'Retiro seguro de semipermanente con fresa cerámica.',
    levelModerateTitle: 'Retiro Acrílico / Polygel',
    levelModeratePrice: 40,
    levelModerateDesc: 'Retiro completo de acrílico o polygel sin dañar la uña natural.',
    levelComplexTitle: 'Retiro + Manicura Spa',
    levelComplexPrice: 70,
    levelComplexDesc: 'Retiro completo + exfoliación y velaterapia hidratante.',
  },
];

export const INITIAL_INVENTORY_DATA: InventoryItem[] = [
  {
    id: 'inv-01',
    name: 'CREMA DE MANOS FRUTAL',
    price: 15.00,
    stock: 10,
    image: '/assets/aistudio/PO_1_f5e6a392.JPG',
    description: 'Crema hidratante de manos frutal con extractos naturales y textura ligera.',
    active: true,
    featuredInCarousel: true,
    allowBeeCoins: true,
    variants: [
      { id: 'v1', name: 'Manzana', color: '#F8A5A5', available: true },
      { id: 'v2', name: 'Pera', color: '#A4CF9E', available: true },
      { id: 'v3', name: 'Fresa', color: '#F2A0B5', available: false },
    ],
  },
  {
    id: 'inv-02',
    name: 'ACEITE DE CUTÍCULA NUTRITIVO',
    price: 18.00,
    stock: 8,
    image: '/assets/aistudio/PO_2_4dd05dab.JPG',
    description: 'Aceite de almendras y vitamina E para reparar y nutrir la cutícula profundamente.',
    active: true,
    featuredInCarousel: true,
    allowBeeCoins: true,
    variants: [
      { id: 'v1', name: 'Lavanda', color: '#C7B6E8', available: true },
      { id: 'v2', name: 'Rosa', color: '#F6B8C8', available: true },
      { id: 'v3', name: 'Coco', color: '#EAD9B8', available: false },
    ],
  },
];

export const INITIAL_COURSES_DATA: CourseItem[] = [
  {
    id: 'course-01',
    title: 'Masterclass de Softgel & Técnicas Avanzadas 2026',
    price: 120.00,
    priceLabel: 'S/. 120.00',
    image: '/src/assets/images/nail_chrome_cateye_1792392507727.jpg',
    whatYouWillLearn: [
      'Preparación perfecta de placa ungueal sin desprendimientos',
      'Técnica avanzada de aplicación de Tips Softgel',
      'Diseño en tendencia, cromo y encapsulados',
      'Estrategia de precios y marketing para tu estudio de uñas'
    ],
    description: 'Domina desde cero la técnica de Softgel más solicitada y escala tu negocio de manicura profesional.',
    hotmartUrl: 'https://hotmart.com',
    active: true,
    featuredInCarousel: true,
  },
  {
    id: 'course-02',
    title: 'Especialización en Nail Art a Mano Alzada & 3D',
    price: 150.00,
    priceLabel: 'S/. 150.00',
    image: '/src/assets/images/nail_floral_botanical_1792392507089.jpg',
    whatYouWillLearn: [
      'Manejo de micropinceles y painting gels',
      'Creación de flores botánicas, lazos y texturas',
      'Esculpido de relieves 3D/4D con gel constructor',
      'Técnicas de combinación de colores y sombras'
    ],
    description: 'Perfecciona tu trazo y lleva tus diseños artísticos al siguiente nivel de alta gama.',
    hotmartUrl: 'https://hotmart.com',
    active: true,
    featuredInCarousel: true,
  },
];

export const DEFAULT_CATBEE_CONFIG: CatbeeConfig = {
  systemPrompt: `Eres Catbee 🐾🐝, la asistente virtual oficial, cariñosa, profesional y carismática de Gabee Studio.
Directrices obligatorias:
1. Tono cálido, empático, educado y elegante. Usa emojis de forma moderada (🐾, 🐝, ✨, 💅).
2. NUNCA inventes precios, promociones o datos falsos.
3. Toda cita presencial o a domicilio se reserva obligatoriamente con el 50% de depósito previo. El 50% restante se cancela el día de tu atención en el estudio o a domicilio.
4. Los sets Press-On hechos a medida se abonan al 100% por adelantado.
5. Si la clienta realiza 3 o más consultas o pregunta por casos especiales (alergias, infecciones, novias/bodas o reclamos), ofrécele amablemente el botón de derivación a WhatsApp directo con Gabriela.`,
  whatsappDerivationThreshold: 3,
  customWelcomeMessage: `**¡Bienvenida a Gabee Studio!**\nAquí resolveremos cualquier duda que tengas sobre citas, BeeCoins y pedidos. En caso de que desees preguntar algo más en concreto, escríbelo con total confianza.`,
  whatsappHandoffTemplate: `¡Hola Gabriela! 🐾🐝

Vengo desde el asistente virtual Catbee en la web de Gabee Studio y me gustaría consultar lo siguiente:

📌 Mi consulta: {consulta}

Agradezco mucho si pueden responderme por aquí para coordinar los detalles. ¡Gracias de antemano! ✨`,
  enabled: true,
};

export const INITIAL_CATBEE_KNOWLEDGE: CatbeeKnowledgeItem[] = [
  {
    id: 'kb-agendar',
    question: '¿Cómo agendar mi cita?',
    keywords: ['agendar', 'cita', 'reserva', 'horario', 'adelanto', 'estudio', 'domicilio', 'como agendar', 'paso a paso'],
    answer: `¡Agendar tu cita en **Gabee Studio** es súper fácil y rápido! 🐾✨ Aquí tienes el paso a paso:

1. **Modalidad de Atención:** Elige si deseas tu servicio en nuestro acogedor **Studio** (Jesús María) o con atención VIP **A Domicilio**.
2. **Fecha y Horario:** Selecciona en el calendario interactivo el día y el bloque horario que mejor se acomode a ti.
3. **Cupo Congelado por 15 Minutos:** Al elegir tu horario, tu cupo quedará congelado exclusivamente para ti por **15 minutos** para que puedas completar tu reserva con total tranquilidad sin perderlo.
4. **Adelanto del 50% Obligatorio:** Realizas el depósito del **50% de adelanto** del valor total del servicio o promo (por ejemplo, para una promo de S/. 60 el adelanto es de S/. 30) por Yape, Plin o Transferencia BCP. El 50% restante se cancela el día de tu atención.
5. **Confirmación Inmediata:** Tras transferir, ingresas tu número de operación de pago en la web para validar tu cupo y el sistema generará tu **código de reserva único**.

*(Nota: En los kits Press-On hechos a medida, el pago se realiza al 100% por adelantado).*`,
    actionLabel: '📅 ¿Cómo agendar?',
    category: 'citas',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-beecoins',
    question: '¿Cómo usar mis BeeCoins?',
    keywords: ['beecoin', 'beecoins', 'monedero', 'saldo', 'fidelidad', 'sello', 'sellos', 'puntos', 'ruleta', 'como usar beecoins'],
    answer: `¡Las **BeeCoins** son nuestra moneda de fidelidad y programa de recompensas exclusivo en **Gabee Studio**! 🐝💛

• **¿Qué son?** Es un sistema de fidelidad creado para consentirte y premiar tu lealtad cada vez que cuidas tus uñas con nosotras.
• **¿Cómo se acumulan?** Ganas automáticamente **10 BeeCoins por cada S/. 1** invertido en cualquier servicio de manicura o sets de uñas Press-On. Además, ¡recibes **10 BeeCoins de regalo directo** al verificar tu correo en tu perfil!
• **Beneficios y Descuentos Exclusivos en el Estudio:**
  - **Tarjeta de Fidelidad:** Cada cita presencial te suma un sello digital. En el **Sello 5** recibes un tratamiento de belleza de regalo, y en el **Sello 10** obtienes un **50% OFF** en tu servicio o un set Press-On de autor totalmente gratis.
  - **Ruleta VIP de Cumpleaños:** En el mes de tu cumpleaños se activa tu ruleta para ganar premios exclusivos, descuentos y regalos sorpresa.
  - **Recargas con Saldo Extra:** Puedes recargar paquetes de BeeCoins en tu monedero con saldo adicional de bonificación para pagar tus citas y compras futuras con ventaja económica.`,
    actionLabel: '🐝 ¿Cómo usar BeeCoins?',
    category: 'beecoins',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-pedidos',
    question: 'Verificar mi pedido y citas',
    keywords: ['pedido', 'pedidos', 'estado', 'historial', 'mis citas', 'compra', 'seguimiento', 'verificar', 'verificar mi pedido'],
    answer: `¡Hacer seguimiento a tus citas y pedidos es súper fácil y en tiempo real! 📦🐾

Puedes ingresar a tu **perfil personal** y hacer clic en el botón central **'MIS CITAS & PEDIDOS'** para consultar toda tu información:

• **Citas en Estudio o Domicilio:** Verás el avance de tu reserva y el estado de tu adelanto (*En espera de confirmación*, *Confirmado*, *Atendido*), junto con la fecha, hora y modalidad agendada.
• **Pedidos de Press-On:** Conocerás el estado exacto de confección de tus uñas (*Recibido*, *En preparación*, *Aprobado*, *Despachado*) y tendrás acceso a tu número de guía para envíos por Olva Courier o Shalom.
• **Dejar Reseñas:** Una vez completada tu cita o entregado tu pedido, tendrás disponible el botón **'⭐ Dejar Reseña'** para calificar con estrellas y compartir tu testimonio con fotos en nuestra web.`,
    actionLabel: '📦 Verificar mi pedido',
    category: 'pedidos',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-pagos',
    question: 'Métodos de pago oficiales',
    keywords: ['pago', 'pagos', 'yape', 'plin', 'bcp', 'banco', 'transferencia', 'operacion', 'cuenta', 'metodos de pago'],
    answer: `Aceptamos los siguientes métodos de pago oficiales para tu adelanto del 50% o pedidos Press-On: 💳✨

• **Yape:** 934 403 311 (Gabriela E. - Gabee Estudio)
• **Plin:** 934 403 311 (Gabriela E. - Gabee Estudio)
• **Transferencia BCP:** 19302589628084 (Gabee Estudio)

🔒 **Confirmación Segura:** Al realizar tu transferencia o pago móvil, únicamente ingresas tu número de operación de pago en la web para validar tu cupo y generar tu código de atención de forma inmediata.`,
    actionLabel: '💳 Métodos de pago',
    category: 'pagos',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-presson',
    question: 'Uñas Press-On y Envíos',
    keywords: ['press', 'press-on', 'press on', 'talla', 'tallas', 'medir', 'envio', 'envíos', 'delivery', 'kit'],
    answer: `¡Nuestras uñas **Press-On** son una maravilla de alta gama hechas a mano! 💅🐝

• **Reutilizables y duraderas:** Hechas 100% a mano con geles profesionales y acabado vitrificado de salón.
• **Kits de colocación incluido:** Cada set incluye lima buffer, repujador de madera, toallitas desinfectantes, pegamento líquido y adhesivos gelatinosos.
• **Tallas a Medida:** Disponibles en tallas estándar (XS, S, M, L) o a tu medida exacta usando nuestra guía visual de monedas.
• **Envíos:** Envíos express a todo Lima y a nivel nacional por Olva Courier o Shalom, además de entrega en nuestro estudio. Recuerda que los sets Press-On se reservan con el 100% de pago por adelantado.`,
    actionLabel: '💅 Press-On & Envíos',
    category: 'presson',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-retiro',
    question: 'Retiro y Salud de la Uña',
    keywords: ['retiro', 'retirar', 'quitar', 'danar', 'daño', 'duele', 'salud', 'cuidado'],
    answer: `¡La salud de tus uñas naturales es nuestra prioridad #1! 🌿🐾

• **Cero dolor y cero daño:** Jamás arranques las uñas a la fuerza. En el estudio realizamos un retiro cuidadoso con fresas de cerámica y removedores nutritivos que preservan la queratina natural.
• **Cuidado posterior:** Aplicamos aceites de cutícula y bases de tratamiento restaurador.
• Si tienes un sistema anterior de otro estudio, puedes solicitar el servicio de retiro al agendar tu cita con el 50% de adelanto.`,
    actionLabel: '🌿 Retiro & Salud',
    category: 'citas',
    active: true,
    updatedAt: new Date().toISOString(),
  },
];




// ============================================================
// SERVICIOS DE RETIRO, SPA & VELATERAPIA (Modal de Reserva)
// ============================================================
export type { RemovalServiceOption };

export const REMOVAL_SERVICE_OPTIONS: RemovalServiceOption[] = [
  // Retiros independientes
  {
    id: 'gel',
    title: 'Retiro de Gel',
    price: 20,
    desc: 'Para esmaltado semipermanente o gel suave. Pulido y retiro delicado que cuida el lecho ungueal.',
    group: 'retiros',
  },
  {
    id: 'sistemas',
    title: 'Retiro de Sistemas (Polygel/Builder)',
    price: 30,
    desc: 'Para sistemas de Polygel o Builder Gel. Retiro controlado y cuidadoso que preserva tu uña natural.',
    group: 'retiros',
  },
  {
    id: 'acrilico',
    title: 'Retiro de Acrílico',
    price: 40,
    desc: 'Para acrílico tradicional, polygel grueso o extensiones esculpidas con material denso.',
    group: 'retiros',
  },
  // Spa & Velaterapia individuales
  {
    id: 'spa_express',
    title: 'Spa Express Revitalizante',
    price: 40,
    desc: 'Ideal para una hidratación profunda y revitalizadora.',
    group: 'spa',
  },
  {
    id: 'spa_velaterapia',
    title: 'Spa & Velaterapia',
    price: 50,
    desc: 'Ideal para vivir una experiencia sensorial, nutrición profunda y regeneración total de la piel.',
    group: 'spa',
  },
  // Combos Retiro + Spa (precio especial de descuento)
  {
    id: 'gel_spa',
    title: 'Retiro de Gel + Spa Express',
    price: 50,
    desc: '',
    group: 'combos',
  },
  {
    id: 'sistemas_spa',
    title: 'Retiro de Sistemas + Spa & Velaterapia',
    price: 70,
    desc: '',
    group: 'combos',
  },
  {
    id: 'acrilico_spa',
    title: 'Retiro de Acrílico + Spa & Velaterapia',
    price: 80,
    desc: '',
    group: 'combos',
  },
];
