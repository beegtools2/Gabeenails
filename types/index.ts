export type ServiceType = 'promotion' | 'custom' | 'removal';

export type DesignLevel = 'sencillo' | 'moderado' | 'complejo';

export type PromoType = 'clasica' | '2x1';

export type PressOnStructure = 'individual' | 'duo';

/** Respaldo seguro: cualquier promo antigua guardada como "Todo Incluido" se trata como Clásica. */
export const normalizePromoType = (value?: string | null): PromoType => (value === '2x1' ? '2x1' : 'clasica');

export interface PromoSystemFlags {
  polygel: boolean;
  softgel: boolean;
  builder: boolean;
  acrilicas: boolean;
  esmaltado_gel?: boolean;
}

export interface PromoLevelFlags {
  sencillo: boolean;
  moderado: boolean;
  complejo: boolean;
}

export interface PromoDetailBlock {
  id: string;
  title: string;
  content: string;
  bulleted?: boolean;
}

export type RemovalType =
  | 'gel'
  | 'sistemas'
  | 'acrilico'
  | 'spa_express'
  | 'spa_velaterapia'
  | 'gel_spa'
  | 'sistemas_spa'
  | 'acrilico_spa';

export interface PromoDesign {
  id: string;
  title: string;
  collection: string;
  description: string;
  technique: string;
  level: DesignLevel;
  durationMinutes: number;
  price: number;
  image: string;
  tags: string[];
  featured?: boolean;
  active: boolean;
  recommendedSystem: string;
  category?: 'salon' | 'press_on';
  defaultTip?: TipType;
  includedKit?: 'elemental' | 'standard' | 'premium';
  sizeStock?: {
    XS: boolean;
    S: boolean;
    M: boolean;
    L: boolean;
  };
  stock?: number;
  isTrending?: boolean;
  isBestSeller?: boolean;
  fullDesc?: string;
  allowedSystems?: {
    polygel: boolean;
    softgel: boolean;
    builder: boolean;
    acrilicas: boolean;
    esmaltado_gel?: boolean;
  };
  allowedLevels?: PromoLevelFlags;
  promoType?: PromoType;
  companionAllowedSystems?: PromoSystemFlags;
  companionAllowedLevels?: PromoLevelFlags;
  companionOptions?: string;
  promoDetailsTitle?: string;
  promoDetailsBlocks?: PromoDetailBlock[];
  pressOnStructure?: PressOnStructure;
  duoDesignIds?: string[];
}

export interface NailShape {
  id: string;
  name: string;
  description: string;
  extraCost: number;
  popular?: boolean;
}

export interface NailLength {
  id: string;
  label: string;
  range: string;
  code: string;
  extraCost: number;
  description: string;
}

export interface NailSystem {
  id: string;
  name: string;
  description: string;
  extraCost: number;
  inPromo: boolean;
}

export interface CustomServiceConfig {
  level: DesignLevel;
  system: string;
  shape: string;
  lengthId: string;
  addons: {
    rhinestones: boolean;
    previousRemoval: boolean;
    stilettoShape: boolean;
    homeService: boolean;
  };
  referenceImage?: string;
  referenceImages?: string[];
  customNotes?: string;
  calculatedPrice: number;
}

export interface RemovalConfig {
  type: RemovalType;
  spaManicure: boolean;
}

export type AppointmentStatus = 'pending_deposit' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  code: string;
  createdAt: string;
  clientName: string;
  clientPhone: string;
  clientInstagram?: string;
  birthDate?: string;
  serviceType: ServiceType;
  promoDesignId?: string;
  promoDesignTitle?: string;
  promoType?: PromoType;
  promoCompanion?: {
    name: string;
    phone?: string;
    system: string;
    level: DesignLevel;
    price?: number;
  };
  customDetails?: CustomServiceConfig;
  removalDetails?: RemovalConfig;
  date: string;
  timeSlot: string;
  isSpecialSchedule?: boolean;
  specialScheduleFee?: number;
  locationType: 'studio' | 'home';
  homeAddress?: string;
  homeReference?: string;
  status: AppointmentStatus;
  totalPrice: number;
  depositRequired: number;
  depositPaid: boolean;
  paymentMethod: 'yape' | 'plin' | 'bcp';
  pressOnDetails?: {
    mode: 'catalog' | 'custom';
    setName?: string;
    size?: string;
    kit?: string;
    rightHandSizes?: { thumb: string; index: string; middle: string; ring: string; pinky: string };
    leftHandSizes?: { thumb: string; index: string; middle: string; ring: string; pinky: string };
    nailAnatomy?: string;
    healthNotes?: string;
    customShape?: string;
    customLength?: string;
    customModificationNotes?: string;
    naturalHandPhotos?: string[];
    dreamDesignPhotos?: string[];
    deliveryType?: 'studio' | 'delivery';
    address?: string;
    district?: string;
    department?: string;
    departmentProvince?: string;
    reference?: string;
  };
  additionals?: string[];
  photos?: string[];
  voucherPhoto?: string;
  paymentOperationNumber?: string;
  notes?: string;
  clientEmail?: string;
  serviceName?: string;
  reviewSubmitted?: boolean;
}

export interface StudioSettings {
  studioName: string;
  slogan: string;
  instagram: string;
  whatsappNumber: string;
  yapeNumber: string;
  yapeName: string;
  plinNumber: string;
  plinName: string;
  bcpAccount: string;
  bcpCci: string;
  bcpName: string;
  defaultPromoPrice: number;
  defaultDepositAmount: number;
  levelBasicTitle: string;
  levelBasicDesc: string;
  levelBasicPrice: number;
  levelModerateTitle: string;
  levelModerateDesc: string;
  levelModeratePrice: number;
  levelComplexTitle: string;
  levelComplexDesc: string;
  levelComplexPrice: number;
  stilettoExtraCost: number;
  longNailExtraCost: number;
  removalExtraCost: number;
  rhinestoneExtraCost: number;
  homeServiceExtraCost: number;
  studioAddress: string;
  studioCity: string;
  timezone: string;
  /** Contraseña del panel /admin, editable en "Configuración y Tarifas". */
  adminPassword: string;
  sizeStock?: {
    XS: boolean;
    S: boolean;
    M: boolean;
    L: boolean;
  };
  systemDescSoftgel?: string;
  systemDescPolygel?: string;
  systemDescBuilderGel?: string;
  systemDescAcrilicas?: string;
  systemDescEsmaltadoGel?: string;
  systemDescRetiro?: string;
  disabledPresencialDates?: string[];
  disabledPresencialTimeSlots?: Record<string, string[]>;
  dayModality?: Record<string, 'studio' | 'home' | 'both'>;
  pressOnDeliveryMode?: 'regular' | 'high_demand' | 'preorder';
  yapeQrImage?: string;
  plinQrImage?: string;
  bcpQrImage?: string;
  yapeQrCode?: string;
  plinQrCode?: string;
  bcpQrCode?: string;
  aboutBio?: string;
  aboutPhoto?: string;
  // Plantillas de WhatsApp (7 flujos independientes)
  waTemplateNuestrosServicios?: string;
  waTemplateRetiro?: string;
  waTemplateEsmaltado?: string;
  waTemplateCatalogoPressOn?: string;
  waTemplatePedidoPersonalizado?: string;
  waTemplatePromoSistemas?: string;
  waTemplatePromoPressOn?: string;
}

export type TipType = 'almendra' | 'stiletto' | 'coffin' | 'square';
export type SizeType = 'XS' | 'S' | 'M' | 'L';
export type KitType = 'Elemental' | 'Standard' | 'Premium';
export type DeliveryOption = 'studio' | 'delivery';

export interface ServiceItem {
  id: string;
  title: string;
  tag: string;
  priceLabel: string;
  image: string;
  description: string;
  active?: boolean;
  featuredInCarousel?: boolean;
  levelBasicTitle?: string;
  levelBasicPrice?: number;
  levelBasicDesc?: string;
  levelModerateTitle?: string;
  levelModeratePrice?: number;
  levelModerateDesc?: string;
  levelComplexTitle?: string;
  levelComplexPrice?: number;
  levelComplexDesc?: string;
  removalOptions?: RemovalServiceOption[];
}

export interface RemovalServiceOption {
  id: RemovalType;
  title: string;
  price: number;
  desc: string;
  group: 'retiros' | 'spa' | 'combos';
}

export interface PressOnItem {
  id: string;
  name: string;
  price: number;
  shortDesc: string;
  fullDesc: string;
  image: string;
  gallery: string[];
  defaultTip: TipType;
  includedKit?: 'standard' | 'premium';
  sizeStock?: {
    XS: boolean;
    S: boolean;
    M: boolean;
    L: boolean;
  };
  stock?: number;
  isTrending?: boolean;
  isBestSeller?: boolean;
  featuredInCarousel?: boolean;
}

export interface InventoryVariant {
  id: string;
  name: string;
  color?: string;
  available: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  description?: string;
  active?: boolean;
  featuredInCarousel?: boolean;
  allowBeeCoins?: boolean;
  variants?: InventoryVariant[];
}

export interface CourseItem {
  id: string;
  title: string;
  price: number;
  priceLabel?: string;
  image: string;
  whatYouWillLearn: string[];
  description?: string;
  hotmartUrl: string;
  active?: boolean;
  featuredInCarousel?: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password?: string;
  instagram?: string;
  birthDate: string;
  avatarUrl?: string;
  beeCoins: number;
  isVip: boolean;
  visitsCount: number;
  stampsCount: number;
  consecutivePromoMonths: number;
  promoPauseHistory: { month: string; promoTitle: string; date: string }[];
  rouletteSpun: boolean;
  roulettePrize?: string;
  rouletteToken?: string;
  createdAt: string;
  address?: string;
  department?: string;
  province?: string;
  departmentProvince?: string;
  district?: string;
  reference?: string;
  isEmailVerified?: boolean;
  verificationToken?: string;
}

export interface BeeCoinTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'purchase';
  amount: number;
  description: string;
  date: string;
}

export interface BeeCoinPackage {
  id: string;
  coins: number;
  priceSoles: number;
  popular?: boolean;
}

export type RechargeStatus = 'pending' | 'approved' | 'rejected';

export type StoreOrderTrackingStatus = 'verification' | 'confirmed' | 'packing' | 'shipped';

export interface BeeCoinRechargeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  packageId: string;
  packageName: string;
  coinsAmount: number;
  priceSoles: number;
  operationNumber: string;
  paymentMethod?: 'yape' | 'plin' | 'bcp';
  status: RechargeStatus;
  createdAt: string;
}

export interface StoreOrderItem {
  productId: string;
  productName: string;
  name?: string;
  variantName?: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  tipShape?: string;
}

export interface StoreOrder {
  id: string;
  code: string;
  createdAt: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  items: StoreOrderItem[];
  totalSoles: number;
  totalAmount?: number;
  beeCoinsUsed: number;
  paymentMethod: 'yape' | 'plin' | 'bcp' | 'beecoins' | 'mixed';
  operationNumber?: string;
  voucherPhoto?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'delivered' | 'despachado' | 'approved' | 'packing' | 'shipped';
  deliveryType?: 'delivery' | 'pickup';
  reviewSubmitted?: boolean;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewItem {
  id: string;
  clientName: string;
  comment: string;
  mediaUrl?: string;
  mediaType?: 'image';
  serviceName?: string;
  rating?: number;
  createdAt: string;
  active: boolean;
  status?: ReviewStatus;
  userId?: string;
  userEmail?: string;
  appointmentId?: string;
  orderId?: string;
}

export interface CatbeeKnowledgeItem {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  actionLabel?: string;
  category?: 'citas' | 'beecoins' | 'pedidos' | 'pagos' | 'presson' | 'general';
  active: boolean;
  updatedAt: string;
}

export interface CatbeeConfig {
  systemPrompt: string;
  whatsappDerivationThreshold: number;
  customWelcomeMessage: string;
  whatsappHandoffTemplate: string;
  enabled: boolean;
}



