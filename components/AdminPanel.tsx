import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ImageLightbox } from './ImageLightbox';
import { ADMIN_PASSWORD_MAX_LENGTH, ADMIN_PASSWORD_MIN_LENGTH, ADMIN_SESSION_ENDPOINT } from '../data/adminSession';
import { formatLocalIsoDate, getLocalTomorrowIso, formatHumanLocalDate } from '../utils/dateUtils';
import {
  PromoDesign,
  Appointment,
  StudioSettings,
  DesignLevel,
  AppointmentStatus,
  PressOnItem,
  TipType,
  ServiceItem,
  UserProfile,
  InventoryItem,
  InventoryVariant,
  StoreOrder,
  CourseItem,
  ReviewItem,
  CatbeeKnowledgeItem,
  CatbeeConfig,
  RemovalServiceOption,
  RemovalType,
  PromoType,
  PressOnStructure,
  PromoDetailBlock,
  normalizePromoType,
} from '../types';
import {
  DEFAULT_CATBEE_CONFIG,
  INITIAL_CATBEE_KNOWLEDGE,
  REMOVAL_SERVICE_OPTIONS,
  NAIL_SHAPES,
  NAIL_LENGTHS,
  DEFAULT_PROMO_DETAILS_TITLE,
  DEFAULT_PROMO_DETAILS_BLOCKS,
  DEFAULT_PRESS_ON_PROMO_DETAILS_TITLE,
  DEFAULT_PRESS_ON_PROMO_DETAILS_BLOCKS,
} from '../data/catalogData';
import { AdditionalItem } from '../data/additionalsData';
import { GabeeLogo } from './GabeeLogo';
import { BeeCoinIcon } from './BeeCoinIcon';
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storageUtils';
import { compressImage } from '../utils/imageUtils';
import {
  ShieldCheck,
  Calendar,
  Layers,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Upload,
  Edit2,
  Eye,
  EyeOff,
  DollarSign,
  Save,
  X,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle,
  RotateCcw,
  User,
  MapPin,
  Tag,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Gift,
  CreditCard,
  Copy,
  ShoppingCart,
  Package,
  GraduationCap,
  Star,
  Play,
  Film,
  Video,
  Image as ImageIcon,
  Bot,
  Brain,
  HelpCircle,
} from 'lucide-react';

const SERVICE_SYSTEM_LABELS: Record<string, string> = {
  esmaltado_gel: 'Esmaltado en Gel',
  polygel: 'Polygel',
  softgel: 'Soft Gel',
  builder_gel: 'Builder Gel',
  builder: 'Builder Gel',
  acrilicas: 'Uñas Acrílicas',
};

const SiteImagesSettings = React.lazy(() => import('./SiteImagesSettings'));

interface AdminPanelProps {
  /** Cierra la sesión de administrador y vuelve a la tienda pública (/). */
  onExitAdmin?: () => void | Promise<void>;
  onSessionExpired: () => void;
  imagePreviewOnly: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExitAdmin, onSessionExpired, imagePreviewOnly }) => {
  const {
    appointments,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    clearCancelledAppointments,
    promoDesigns,
    addPromoDesign,
    updatePromoDesign,
    deletePromoDesign,
    pressOnCatalog,
    addPressOnItem,
    updatePressOnItem,
    deletePressOnItem,
    resetPressOnCatalog,
    servicesCatalog,
    addServiceItem,
    updateServiceItem,
    deleteServiceItem,
    resetServicesCatalog,
    additionalsList,
    addAdditionalItem,
    updateAdditionalItem,
    deleteAdditionalItem,
    resetAdditionalsList,
    settings,
    updateSettings,
    resetSettings,
    setIsAdmin,
    setCurrentView,
    spreadsheetId,
    spreadsheetUrl,
    isSyncingSheets,
    connectGoogleSheets,
    syncAllToGoogleSheets,
    rechargeRequests,
    approveBeeCoinRecharge,
    rejectBeeCoinRecharge,
    allUsers,
    deleteUserAccount,
    updateUserCoinsAndVisits,
    updateUserProfile,
    inventoryList,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    resetInventoryList,
    storeOrders,
    createStoreOrder,
    updateStoreOrderStatus,
    updateStoreOrder,
    deleteStoreOrder,
    coursesList,
    addCourseItem,
    updateCourseItem,
    deleteCourseItem,
    resetCoursesList,
    reviewsList,
    addReviewItem,
    updateReviewItem,
    deleteReviewItem,
    resetReviewsList,
    catbeeConfig,
    updateCatbeeConfig,
    resetCatbeeConfig,
    catbeeKnowledge,
    addCatbeeKnowledge,
    updateCatbeeKnowledge,
    deleteCatbeeKnowledge,
    resetCatbeeKnowledge,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'appointments' | 'catalog' | 'presson' | 'services' | 'inventory' | 'courses' | 'reviews' | 'store_orders' | 'additionals' | 'settings' | 'sheets' | 'user_accounts' | 'loyalty_vip' | 'catbee'>('appointments');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchClient, setSearchClient] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingStoreOrderId, setEditingStoreOrderId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState<string>('');
  const [editClientPhone, setEditClientPhone] = useState<string>('');
  const [editDeliveryType, setEditDeliveryType] = useState<'delivery' | 'pickup'>('pickup');

  // Orders list derived directly from global React memory state
  const displayStoreOrders = useMemo<StoreOrder[]>(() => {
    if (!Array.isArray(storeOrders)) return [];
    const list = [...storeOrders];
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [storeOrders]);

  // Store Orders Filter, Search & Manual Order Modal State
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState<boolean>(false);
  const [manualClientName, setManualClientName] = useState<string>('');
  const [manualClientPhone, setManualClientPhone] = useState<string>('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'yape' | 'plin' | 'bcp' | 'mixed'>('yape');
  const [manualOperationNumber, setManualOperationNumber] = useState<string>('');
  const [manualOrderItems, setManualOrderItems] = useState<Record<string, number>>({});

  const filteredStoreOrders = useMemo<StoreOrder[]>(() => {
    return displayStoreOrders.filter((ord: StoreOrder) => {
      // Status filter
      if (orderStatusFilter !== 'all') {
        if (orderStatusFilter === 'confirmed') {
          if (ord.status !== 'confirmed' && ord.status !== 'approved') return false;
        } else if (orderStatusFilter === 'shipped') {
          if (!['shipped', 'despachado'].includes(String(ord.status))) return false;
        } else if (orderStatusFilter === 'delivered') {
          if (!['delivered', 'completed'].includes(String(ord.status))) return false;
        } else if (orderStatusFilter === 'packing') {
          if (ord.status !== 'packing') return false;
        } else if (ord.status !== orderStatusFilter) {
          return false;
        }
      }
      // Search query filter (client name, code, phone, operation number)
      if (orderSearchQuery.trim() !== '') {
        const query = orderSearchQuery.toLowerCase().trim();
        const nameMatch = ord.clientName?.toLowerCase().includes(query);
        const codeMatch = ord.code?.toLowerCase().includes(query);
        const phoneMatch = ord.clientPhone?.toLowerCase().includes(query);
        const opMatch = ord.operationNumber?.toLowerCase().includes(query);
        if (!nameMatch && !codeMatch && !phoneMatch && !opMatch) return false;
      }
      return true;
    });
  }, [displayStoreOrders, orderStatusFilter, orderSearchQuery]);

  // Catbee Brain & Configuration State
  const [catbeePromptDraft, setCatbeePromptDraft] = useState<string>(catbeeConfig.systemPrompt);
  const [catbeeWelcomeDraft, setCatbeeWelcomeDraft] = useState<string>(catbeeConfig.customWelcomeMessage);
  const [catbeeWhatsappTemplateDraft, setCatbeeWhatsappTemplateDraft] = useState<string>(
    catbeeConfig.whatsappHandoffTemplate || DEFAULT_CATBEE_CONFIG.whatsappHandoffTemplate
  );
  const [catbeeThresholdDraft, setCatbeeThresholdDraft] = useState<number>(catbeeConfig.whatsappDerivationThreshold);
  const [catbeeEnabledDraft, setCatbeeEnabledDraft] = useState<boolean>(catbeeConfig.enabled);

  // Sync drafts when catbeeConfig changes in context
  useEffect(() => {
    setCatbeePromptDraft(catbeeConfig.systemPrompt);
    setCatbeeWelcomeDraft(catbeeConfig.customWelcomeMessage);
    setCatbeeWhatsappTemplateDraft(
      catbeeConfig.whatsappHandoffTemplate || DEFAULT_CATBEE_CONFIG.whatsappHandoffTemplate
    );
    setCatbeeThresholdDraft(catbeeConfig.whatsappDerivationThreshold);
    setCatbeeEnabledDraft(catbeeConfig.enabled);
  }, [catbeeConfig]);

  // Catbee Knowledge (Q&A) filter & modal state
  const [knowledgeSearch, setKnowledgeSearch] = useState<string>('');
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState<string>('all');
  const [showKnowledgeModal, setShowKnowledgeModal] = useState<boolean>(false);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(null);
  const [knowledgeForm, setKnowledgeForm] = useState<{
    question: string;
    keywords: string;
    answer: string;
    actionLabel: string;
    category: 'citas' | 'beecoins' | 'pedidos' | 'pagos' | 'presson' | 'general';
    active: boolean;
  }>({
    question: '',
    keywords: '',
    answer: '',
    actionLabel: '',
    category: 'citas',
    active: true,
  });

  // Expandable accordion row state for User Accounts
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [draftUserCoins, setDraftUserCoins] = useState<number>(0);
  const [draftUserVisits, setDraftUserVisits] = useState<number>(0);
  const [draftUserBirthDate, setDraftUserBirthDate] = useState<string>('');

  // Manual User Coins & Visits edit modal state
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    coins: number;
    visits: number;
    birthDate: string;
  } | null>(null);

  // In-app deletion confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'appointment' | 'promo' | 'additional' | 'cancelled' | 'reset_settings' | 'reset_additionals' | 'presson' | 'reset_presson' | 'service' | 'reset_services' | 'inventory' | 'reset_inventory' | 'course' | 'reset_courses';
    id?: string;
    title?: string;
  } | null>(null);








  // Modal State 1: Promotional System Modal (Grabar/Modificar Sistema en Promoción)
  const [showPromoSistemaModal, setShowPromoSistemaModal] = useState(false);
  const [editingPromoSistemaId, setEditingPromoSistemaId] = useState<string | null>(null);
  const [promoSistemaForm, setPromoSistemaForm] = useState<{
    title: string;
    collection: string;
    description: string;
    price: number;
    image: string;
    recommendedSystem: string;
    featured: boolean;
    active: boolean;
    allowedSystems: {
      polygel: boolean;
      softgel: boolean;
      builder: boolean;
      acrilicas: boolean;
      esmaltado_gel: boolean;
    };
    allowedLevels: {
      sencillo: boolean;
      moderado: boolean;
      complejo: boolean;
    };
    promoType: PromoType;
    companionAllowedSystems: {
      polygel: boolean;
      softgel: boolean;
      builder: boolean;
      acrilicas: boolean;
      esmaltado_gel: boolean;
    };
    companionAllowedLevels: {
      sencillo: boolean;
      moderado: boolean;
      complejo: boolean;
    };
    companionOptions: string;
    promoDetailsTitle: string;
    promoDetailsBlocks: PromoDetailBlock[];
  }>({
    title: '',
    collection: 'Sistema Profesional',
    description: '',
    price: 60,
    image: '',
    recommendedSystem: 'Softgel o Polygel',
    featured: false,
    active: true,
    allowedSystems: { polygel: true, softgel: true, builder: true, acrilicas: false, esmaltado_gel: false },
    allowedLevels: { sencillo: false, moderado: true, complejo: false },
    promoType: 'clasica',
    companionAllowedSystems: { polygel: true, softgel: true, builder: true, acrilicas: false, esmaltado_gel: false },
    companionAllowedLevels: { sencillo: false, moderado: true, complejo: false },
    companionOptions: '',
    promoDetailsTitle: DEFAULT_PROMO_DETAILS_TITLE,
    promoDetailsBlocks: DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
  });

  // Diseños Press On activos que pueden participar en una Promo Duo
  const pressOnDuoDesignOptions = useMemo(
    () =>
      promoDesigns.filter(
        (design) =>
          design.active !== false &&
          (design.category === 'press_on' || (design.collection || '').toLowerCase().includes('press on'))
      ),
    [promoDesigns]
  );

  // Modal State 2: Promotional Press-On Modal (Grabar/Modificar Press On en Promoción)
  const [showPromoPressOnModal, setShowPromoPressOnModal] = useState(false);
  const [editingPromoPressOnId, setEditingPromoPressOnId] = useState<string | null>(null);
  const [promoPressOnForm, setPromoPressOnForm] = useState<{
    title: string;
    collection: string;
    description: string;
    fullDesc: string;
    price: number;
    image: string;
    defaultTip: TipType;
    includedKit: 'elemental' | 'standard' | 'premium';
    stock: number;
    sizeStock: { XS: boolean; S: boolean; M: boolean; L: boolean };
    isTrending: boolean;
    isBestSeller: boolean;
    featured: boolean;
    active: boolean;
    promoDetailsTitle: string;
    promoDetailsBlocks: PromoDetailBlock[];
    pressOnStructure: PressOnStructure;
    duoDesignIds: string[];
  }>({
    title: '',
    collection: 'Press On Promoción',
    description: '',
    fullDesc: '',
    price: 50,
    image: '',
    defaultTip: 'almendra',
    includedKit: 'elemental',
    stock: 5,
    sizeStock: { XS: true, S: true, M: true, L: true },
    isTrending: false,
    isBestSeller: false,
    featured: false,
    active: true,
    promoDetailsTitle: DEFAULT_PRESS_ON_PROMO_DETAILS_TITLE,
    promoDetailsBlocks: DEFAULT_PRESS_ON_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
    pressOnStructure: 'individual',
    duoDesignIds: pressOnDuoDesignOptions.map((design) => design.id),
  });

  // Appointment Modal State (Grabar / Modificar Cita)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [appointmentForm, setAppointmentForm] = useState<{
    clientName: string;
    clientPhone: string;
    clientInstagram: string;
    serviceType: 'promotion' | 'custom' | 'removal';
    promoDesignTitle: string;
    date: string;
    timeSlot: string;
    locationType: 'studio' | 'home';
    homeAddress: string;
    status: AppointmentStatus;
    totalPrice: number;
    depositRequired: number;
    depositPaid: boolean;
    paymentMethod: 'yape' | 'plin' | 'bcp';
    notes: string;
  }>({
    clientName: '',
    clientPhone: '',
    clientInstagram: '',
    serviceType: 'promotion',
    promoDesignTitle: promoDesigns[0]?.title || 'Tendencia 2026',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '02:30 PM',
    locationType: 'studio',
    homeAddress: '',
    status: 'confirmed',
    totalPrice: 60,
    depositRequired: 20,
    depositPaid: true,
    paymentMethod: 'yape',
    notes: '',
  });

  // Additional Services Form State (100% autoconfigurable in Admin)
  const [showAdditionalModal, setShowAdditionalModal] = useState(false);
  const [editingAdditionalId, setEditingAdditionalId] = useState<string | null>(null);
  const [additionalForm, setAdditionalForm] = useState<{
    name: string;
    category: 'spa' | 'mantenimiento' | 'tamano' | 'formas' | 'disenos' | 'nailart';
    categoryLabel: string;
    description: string;
    price: number;
    unitLabel: string;
    badge: string;
    active: boolean;
    targetSection: 'servicios' | 'press_on' | 'both';
  }>({
    name: '',
    category: 'spa',
    categoryLabel: 'Spa de Uñas',
    description: '',
    price: 20,
    unitLabel: '',
    badge: '',
    active: true,
    targetSection: 'both',
  });

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Press On Modal State (Grabar / Modificar Sets del Catálogo Press On)
  const [showPressOnModal, setShowPressOnModal] = useState(false);
  const [editingPressOnId, setEditingPressOnId] = useState<string | null>(null);
  const [pressOnForm, setPressOnForm] = useState<{
    name: string;
    price: number;
    defaultTip: TipType;
    shortDesc: string;
    fullDesc: string;
    image: string;
    includedKit: 'standard' | 'premium';
    sizeStock: { XS: boolean; S: boolean; M: boolean; L: boolean };
    stock: number;
    isTrending: boolean;
    isBestSeller: boolean;
    featuredInCarousel: boolean;
  }>({
    name: '',
    price: 75,
    defaultTip: 'almendra',
    shortDesc: '',
    fullDesc: '',
    image: '',
    includedKit: 'standard',
    sizeStock: { XS: true, S: true, M: true, L: true },
    stock: 5,
    isTrending: false,
    isBestSeller: false,
    featuredInCarousel: true,
  });

  // Inventory Modal State
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [inventoryForm, setInventoryForm] = useState<{
    name: string;
    price: number;
    stock: number;
    image: string;
    description: string;
    active: boolean;
    featuredInCarousel: boolean;
    allowBeeCoins: boolean;
    variants: InventoryVariant[];
  }>({
    name: '',
    price: 25,
    stock: 10,
    image: '',
    description: '',
    active: true,
    featuredInCarousel: true,
    allowBeeCoins: true,
    variants: [],
  });

  // Schedule & Availability Modal State (Gestión de Días y Tiempos)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'disabled_days' | 'crafting_times'>('disabled_days');
  const [tempDisabledDates, setTempDisabledDates] = useState<string[]>([]);
  const [tempDisabledTimeSlots, setTempDisabledTimeSlots] = useState<Record<string, string[]>>({});
  const [tempDayModality, setTempDayModality] = useState<Record<string, 'studio' | 'home' | 'both'>>({});
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => getLocalTomorrowIso());
  const [tempDeliveryMode, setTempDeliveryMode] = useState<'regular' | 'high_demand' | 'preorder'>('regular');
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(new Date());

  const handleOpenScheduleModal = () => {
    setTempDisabledDates(settings.disabledPresencialDates || []);
    setTempDisabledTimeSlots(settings.disabledPresencialTimeSlots || {});
    setTempDayModality(settings.dayModality || {});
    setTempDeliveryMode(settings.pressOnDeliveryMode || 'regular');
    setCalendarViewMonth(new Date());
    setSelectedCalendarDate(getLocalTomorrowIso());
    setShowScheduleModal(true);
  };

  const handleToggleDisabledDate = (dateIso: string) => {
    setTempDisabledDates((prev) =>
      prev.includes(dateIso) ? prev.filter((d) => d !== dateIso) : [...prev, dateIso]
    );
  };

  const handleToggleDisabledTimeSlot = (dateIso: string, slot: string) => {
    setTempDisabledTimeSlots((prev) => {
      const currentSlots = prev[dateIso] || [];
      const updated = currentSlots.includes(slot)
        ? currentSlots.filter((s) => s !== slot)
        : [...currentSlots, slot];
      return {
        ...prev,
        [dateIso]: updated,
      };
    });
  };

  const handleSaveScheduleSettings = () => {
    updateSettings({
      disabledPresencialDates: tempDisabledDates,
      disabledPresencialTimeSlots: tempDisabledTimeSlots,
      dayModality: tempDayModality,
      pressOnDeliveryMode: tempDeliveryMode,
    });
    triggerToast('✓ Disponibilidad y tiempos de entrega guardados correctamente.');
    setShowScheduleModal(false);
  };

  // Services Modal State (Grabar / Modificar Servicios Principales)
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<{
    title: string;
    tag: string;
    priceLabel: string;
    image: string;
    description: string;
    active: boolean;
    levelBasicTitle: string;
    levelBasicPrice: number;
    levelBasicDesc: string;
    levelModerateTitle: string;
    levelModeratePrice: number;
    levelModerateDesc: string;
    levelComplexTitle: string;
    levelComplexPrice: number;
    levelComplexDesc: string;
    featuredInCarousel: boolean;
    removalOptions: RemovalServiceOption[];
  }>({
    title: '',
    tag: 'Tips Completos de Gel',
    priceLabel: 'Desde S/. 60',
    image: '',
    description: '',
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
    removalOptions: REMOVAL_SERVICE_OPTIONS,
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<StudioSettings>({ ...settings });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Show Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // =========================================================
  // CATBEE AI ASSISTANT CONFIGURATION & KNOWLEDGE HANDLERS
  // =========================================================
  const handleSaveCatbeeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateCatbeeConfig({
      systemPrompt: catbeePromptDraft,
      customWelcomeMessage: catbeeWelcomeDraft,
      whatsappHandoffTemplate: catbeeWhatsappTemplateDraft,
      whatsappDerivationThreshold: Number(catbeeThresholdDraft) || 3,
      enabled: catbeeEnabledDraft,
    });
    triggerToast('✓ Configuración y reglas del cerebro de Catbee guardadas con éxito.');
  };

  const handleResetCatbeeConfigDefaults = () => {
    if (window.confirm('¿Deseas restablecer el prompt y directrices de Catbee a los valores por defecto?')) {
      resetCatbeeConfig();
      setCatbeePromptDraft(DEFAULT_CATBEE_CONFIG.systemPrompt);
      setCatbeeWelcomeDraft(DEFAULT_CATBEE_CONFIG.customWelcomeMessage);
      setCatbeeWhatsappTemplateDraft(DEFAULT_CATBEE_CONFIG.whatsappHandoffTemplate);
      setCatbeeThresholdDraft(DEFAULT_CATBEE_CONFIG.whatsappDerivationThreshold);
      setCatbeeEnabledDraft(DEFAULT_CATBEE_CONFIG.enabled);
      triggerToast('✓ Configuración de Catbee restablecida.');
    }
  };

  const handleOpenAddKnowledge = (item?: CatbeeKnowledgeItem) => {
    if (item) {
      setEditingKnowledgeId(item.id);
      setKnowledgeForm({
        question: item.question,
        keywords: item.keywords.join(', '),
        answer: item.answer,
        actionLabel: item.actionLabel || '',
        category: item.category || 'general',
        active: item.active !== false,
      });
    } else {
      setEditingKnowledgeId(null);
      setKnowledgeForm({
        question: '',
        keywords: '',
        answer: '',
        actionLabel: '',
        category: 'citas',
        active: true,
      });
    }
    setShowKnowledgeModal(true);
  };

  const handleSaveKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledgeForm.question.trim() || !knowledgeForm.answer.trim()) {
      alert('Por favor completa la pregunta clave y la respuesta oficial de Catbee.');
      return;
    }

    const parsedKeywords = knowledgeForm.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (editingKnowledgeId) {
      updateCatbeeKnowledge(editingKnowledgeId, {
        question: knowledgeForm.question.trim(),
        keywords: parsedKeywords,
        answer: knowledgeForm.answer.trim(),
        actionLabel: knowledgeForm.actionLabel.trim() || undefined,
        category: knowledgeForm.category,
        active: knowledgeForm.active,
      });
      triggerToast('✓ Conocimiento actualizado en el cerebro de Catbee.');
    } else {
      addCatbeeKnowledge({
        question: knowledgeForm.question.trim(),
        keywords: parsedKeywords,
        answer: knowledgeForm.answer.trim(),
        actionLabel: knowledgeForm.actionLabel.trim() || undefined,
        category: knowledgeForm.category,
        active: knowledgeForm.active,
      });
      triggerToast('✓ Nuevo conocimiento registrado en el cerebro de Catbee.');
    }

    setShowKnowledgeModal(false);
  };

  const handleDeleteKnowledge = (id: string, question: string) => {
    if (window.confirm(`¿Estás segura de eliminar "${question}" del cerebro de Catbee?`)) {
      deleteCatbeeKnowledge(id);
      triggerToast('✓ Conocimiento eliminado de la base de datos.');
    }
  };

  const handleToggleKnowledgeActive = (item: CatbeeKnowledgeItem) => {
    updateCatbeeKnowledge(item.id, { active: !item.active });
    triggerToast(item.active ? 'Conocimiento pausado temporalmente.' : '✓ Conocimiento activado para Catbee.');
  };

  const handleResetKnowledgeDefaults = () => {
    if (window.confirm('¿Deseas restaurar la base de conocimientos oficial predeterminada de Catbee?')) {
      resetCatbeeKnowledge();
      triggerToast('✓ Base de conocimientos inicial de Catbee restaurada.');
    }
  };


  // Filtered Appointments
  const renderAppointmentDetails = (apt: Appointment) => {
    const studioAddress = 'Av. Arnaldo Márquez 1165 N°168';
    const addressValue = apt.locationType === 'studio'
      ? studioAddress
      : (apt.homeAddress || apt.pressOnDetails?.address || '');
    const referenceValue = (apt.homeReference || apt.pressOnDetails?.reference || '').trim();
    const additionalsText = (apt.additionals || [])
      .map((id) => additionalsList.find((a) => a.id === id)?.name || id)
      .join(', ');
    const modalityText = apt.locationType === 'studio' ? 'En Studio' : 'A Domicilio';

    if (apt.serviceType === 'promotion') {
      if (apt.pressOnDetails) {
        const setName = apt.pressOnDetails.setName || apt.promoDesignTitle || 'Set de Promoción';
        return (
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDCE] text-[11px] space-y-1 mt-1 font-['Marcellus']">
            <p>• <strong>Nombre del Set:</strong> {setName}</p>
            {apt.pressOnDetails.size && <p>• <strong>Talla:</strong> {apt.pressOnDetails.size}</p>}
            {apt.pressOnDetails.kit && <p>• <strong>Kit:</strong> {apt.pressOnDetails.kit}</p>}
            {additionalsText && <p>• <strong>Adicionales:</strong> {additionalsText}</p>}
            <p>• <strong>Modalidad:</strong> {modalityText}</p>
            <p>• <strong>Dirección:</strong> {addressValue || (apt.locationType === 'home' ? 'Sin dirección' : studioAddress)}</p>
            {referenceValue && <p>• <strong>Referencia:</strong> {referenceValue}</p>}
          </div>
        );
      }
      const cd = apt.customDetails;
      return (
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDCE] text-[11px] space-y-1 mt-1 font-['Marcellus']">
          <p>• <strong>Servicio:</strong> {apt.promoDesignTitle || apt.serviceName || 'Promoción'}</p>
          {apt.promoType === '2x1' && apt.promoCompanion && (
            <>
              <p>• <strong>Estructura:</strong> Promo 2x1 (2 personas · 1 reserva)</p>
              <p>• <strong>Persona 1 (Titular):</strong> {apt.clientName}</p>
              <p>• <strong>Acompañante 2x1 · Nombre completo:</strong> {apt.promoCompanion.name || 'Sin nombre'}</p>
              <p>• <strong>Acompañante 2x1 · Número:</strong> {apt.promoCompanion.phone || 'Sin teléfono'}</p>
              <p>
                • <strong>Acompañante 2x1 · Elección:</strong>{' '}
                {SERVICE_SYSTEM_LABELS[apt.promoCompanion.system] || apt.promoCompanion.system}{' '}
                · {apt.promoCompanion.level === 'sencillo' ? 'Sutil (S)' : apt.promoCompanion.level === 'complejo' ? 'Complejo (C)' : 'Moderado (M)'}
              </p>
            </>
          )}
          {cd?.system && <p>• <strong>Sistema:</strong> {SERVICE_SYSTEM_LABELS[cd.system] || cd.system}</p>}
          {cd?.level && <p>• <strong>Nivel:</strong> {cd.level === 'sencillo' ? 'Sutil (S)' : cd.level === 'complejo' ? 'Complejo (C)' : 'Moderado (M)'}</p>}
          {cd?.shape && <p>• <strong>Forma:</strong> {NAIL_SHAPES.find((s) => s.id === cd.shape)?.name || cd.shape}</p>}
          {cd?.lengthId && <p>• <strong>Largo:</strong> {NAIL_LENGTHS.find((l) => l.id === cd.lengthId)?.range?.replace(' - ', ' | ') || cd.lengthId}</p>}
          {cd?.customNotes && <p>• <strong>Detalles del Diseño:</strong> "{cd.customNotes}"</p>}
          {apt.notes && <p>• <strong>Notas de la Clienta:</strong> "{apt.notes}"</p>}
          {additionalsText && <p>• <strong>Adicionales:</strong> {additionalsText}</p>}
          <p>• <strong>Modalidad:</strong> {modalityText}</p>
          <p>• <strong>Dirección:</strong> {addressValue || studioAddress}</p>
          {referenceValue && <p>• <strong>Referencia:</strong> {referenceValue}</p>}
        </div>
      );
    }

    if (apt.pressOnDetails) {
      if (apt.pressOnDetails.mode === 'catalog') {
        return (
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDCE] text-[11px] space-y-1 mt-1 font-['Marcellus']">
            <p>• <strong>Nombre del Set:</strong> {apt.pressOnDetails.setName || 'Set Press On'}</p>
            {apt.pressOnDetails.size && <p>• <strong>Talla:</strong> {apt.pressOnDetails.size}</p>}
            {apt.pressOnDetails.kit && <p>• <strong>Kit:</strong> {apt.pressOnDetails.kit}</p>}
            {additionalsText && <p>• <strong>Adicionales:</strong> {additionalsText}</p>}
            <p>• <strong>Modalidad:</strong> {modalityText}</p>
            <p>• <strong>Dirección:</strong> {addressValue || studioAddress}</p>
            {referenceValue && <p>• <strong>Referencia:</strong> {referenceValue}</p>}
          </div>
        );
      }
      return (
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDCE] text-[11px] space-y-1 mt-1 font-['Marcellus']">
          <p>• <strong>Nombre del Set:</strong> Pedido Personalizado</p>
          {apt.pressOnDetails.rightHandSizes && (
            <p>• <strong>Medidas Der (cm):</strong> P:{apt.pressOnDetails.rightHandSizes.thumb} | I:{apt.pressOnDetails.rightHandSizes.index} | M:{apt.pressOnDetails.rightHandSizes.middle} | A:{apt.pressOnDetails.rightHandSizes.ring} | Me:{apt.pressOnDetails.rightHandSizes.pinky}</p>
          )}
          {apt.pressOnDetails.leftHandSizes && (
            <p>• <strong>Medidas Izq (cm):</strong> P:{apt.pressOnDetails.leftHandSizes.thumb} | I:{apt.pressOnDetails.leftHandSizes.index} | M:{apt.pressOnDetails.leftHandSizes.middle} | A:{apt.pressOnDetails.leftHandSizes.ring} | Me:{apt.pressOnDetails.leftHandSizes.pinky}</p>
          )}
          {apt.pressOnDetails.nailAnatomy && <p>• <strong>Anatomía:</strong> {apt.pressOnDetails.nailAnatomy.toUpperCase()}</p>}
          {apt.pressOnDetails.healthNotes && <p>• <strong>Nota de Salud:</strong> "{apt.pressOnDetails.healthNotes}"</p>}
          {apt.pressOnDetails.customModificationNotes && <p>• <strong>Detalles del Diseño:</strong> "{apt.pressOnDetails.customModificationNotes}"</p>}
          {apt.pressOnDetails.customShape && <p>• <strong>Forma:</strong> {apt.pressOnDetails.customShape.toUpperCase()}</p>}
          {apt.pressOnDetails.customLength && <p>• <strong>Largo:</strong> {apt.pressOnDetails.customLength.toUpperCase()}</p>}
          {apt.pressOnDetails.kit && <p>• <strong>Kit:</strong> {apt.pressOnDetails.kit}</p>}
          {additionalsText && <p>• <strong>Adicionales:</strong> {additionalsText}</p>}
          <p>• <strong>Modalidad:</strong> {modalityText}</p>
          <p>• <strong>Dirección:</strong> {addressValue || studioAddress}</p>
          {referenceValue && <p>• <strong>Referencia:</strong> {referenceValue}</p>}
        </div>
      );
    }

    if (apt.serviceType === 'removal') {
      const removalTitle = REMOVAL_SERVICE_OPTIONS.find((o) => o.id === apt.removalDetails?.type)?.title || apt.serviceName || 'Retiro de Sistema';
      return (
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDCE] text-[11px] space-y-1 mt-1 font-['Marcellus']">
          <p>• <strong>Servicio:</strong> {removalTitle}</p>
          {additionalsText && <p>• <strong>Adicionales:</strong> {additionalsText}</p>}
          <p>• <strong>Modalidad:</strong> {modalityText}</p>
          <p>• <strong>Dirección:</strong> {addressValue || studioAddress}</p>
          {referenceValue && <p>• <strong>Referencia:</strong> {referenceValue}</p>}
        </div>
      );
    }

    const cd = apt.customDetails;
    const systemLabel = cd?.system ? (SERVICE_SYSTEM_LABELS[cd.system] || cd.system) : '';
    const isEsmaltado = cd?.system === 'esmaltado_gel';
    return (
      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDCE] text-[11px] space-y-1 mt-1 font-['Marcellus']">
        <p>• <strong>Servicio:</strong> {isEsmaltado ? 'Esmaltado en gel' : (systemLabel || apt.serviceName || 'Nuestros Servicios')}</p>
        {!isEsmaltado && cd?.level && <p>• <strong>Nivel:</strong> {cd.level === 'sencillo' ? 'Sutil (S)' : cd.level === 'complejo' ? 'Complejo (C)' : 'Moderado (M)'}</p>}
        {!isEsmaltado && cd?.shape && <p>• <strong>Forma:</strong> {NAIL_SHAPES.find((s) => s.id === cd.shape)?.name || cd.shape}</p>}
        {!isEsmaltado && cd?.lengthId && <p>• <strong>Largo:</strong> {NAIL_LENGTHS.find((l) => l.id === cd.lengthId)?.range?.replace(' - ', ' | ') || cd.lengthId}</p>}
        {cd?.customNotes && <p>• <strong>Detalles del Diseño:</strong> "{cd.customNotes}"</p>}
        {apt.notes && <p>• <strong>Notas de la Clienta:</strong> "{apt.notes}"</p>}
        {additionalsText && <p>• <strong>Adicionales:</strong> {additionalsText}</p>}
        <p>• <strong>Modalidad:</strong> {modalityText}</p>
        <p>• <strong>Dirección:</strong> {addressValue || studioAddress}</p>
        {referenceValue && <p>• <strong>Referencia:</strong> {referenceValue}</p>}
      </div>
    );
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSearch =
      apt.clientName.toLowerCase().includes(searchClient.toLowerCase()) ||
      apt.clientPhone.includes(searchClient) ||
      apt.code.toLowerCase().includes(searchClient.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Users List for user_accounts and loyalty_vip tabs
  const filteredUsersList = allUsers.filter((u) => {
    if (!searchClient.trim()) return true;
    const q = searchClient.toLowerCase().trim();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const insta = (u.instagram || '').toLowerCase();
    return fullName.includes(q) || phone.includes(q) || email.includes(q) || insta.includes(q);
  });

  // =====================
  // CITAS (GRABAR & MODIFICAR)
  // =====================
  const handleOpenNewAppointment = () => {
    setEditingAppointmentId(null);
    setAppointmentForm({
      clientName: '',
      clientPhone: '+51 ',
      clientInstagram: '',
      serviceType: 'promotion',
      promoDesignTitle: promoDesigns[0]?.title || 'Tendencia 2026',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '02:30 PM',
      locationType: 'studio',
      homeAddress: '',
      status: 'confirmed',
      totalPrice: settings.defaultPromoPrice,
      depositRequired: settings.defaultDepositAmount,
      depositPaid: true,
      paymentMethod: 'yape',
      notes: '',
    });
    setShowAppointmentModal(true);
  };

  const handleOpenEditAppointment = (apt: Appointment) => {
    setEditingAppointmentId(apt.id);
    setAppointmentForm({
      clientName: apt.clientName,
      clientPhone: apt.clientPhone,
      clientInstagram: apt.clientInstagram || '',
      serviceType: apt.serviceType,
      promoDesignTitle: apt.promoDesignTitle || (apt.serviceType === 'promotion' ? 'Promo Catálogo' : 'Set Personalizado'),
      date: apt.date,
      timeSlot: apt.timeSlot,
      locationType: apt.locationType,
      homeAddress: apt.homeAddress || '',
      status: apt.status,
      totalPrice: apt.totalPrice,
      depositRequired: apt.depositRequired,
      depositPaid: apt.depositPaid,
      paymentMethod: apt.paymentMethod,
      notes: apt.notes || '',
    });
    setShowAppointmentModal(true);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentForm.clientName.trim() || !appointmentForm.clientPhone.trim()) {
      alert('Ingresa el nombre y teléfono de la clienta.');
      return;
    }

    if (editingAppointmentId) {
      // Modificar cita existente
      updateAppointment(editingAppointmentId, {
        clientName: appointmentForm.clientName.trim(),
        clientPhone: appointmentForm.clientPhone.trim(),
        clientInstagram: appointmentForm.clientInstagram.trim() || undefined,
        serviceType: appointmentForm.serviceType,
        promoDesignTitle: appointmentForm.serviceType === 'promotion' ? appointmentForm.promoDesignTitle : undefined,
        date: appointmentForm.date,
        timeSlot: appointmentForm.timeSlot,
        locationType: appointmentForm.locationType,
        homeAddress: appointmentForm.locationType === 'home' ? appointmentForm.homeAddress.trim() : undefined,
        status: appointmentForm.status,
        totalPrice: Number(appointmentForm.totalPrice),
        depositRequired: Number(appointmentForm.depositRequired),
        depositPaid: appointmentForm.depositPaid,
        paymentMethod: appointmentForm.paymentMethod,
        notes: appointmentForm.notes.trim() || undefined,
      });
      triggerToast('✓ Cita modificada y guardada correctamente.');
    } else {
      // Grabar nueva cita
      createAppointment({
        clientName: appointmentForm.clientName.trim(),
        clientPhone: appointmentForm.clientPhone.trim(),
        clientInstagram: appointmentForm.clientInstagram.trim() || undefined,
        serviceType: appointmentForm.serviceType,
        promoDesignTitle: appointmentForm.serviceType === 'promotion' ? appointmentForm.promoDesignTitle : undefined,
        date: appointmentForm.date,
        timeSlot: appointmentForm.timeSlot,
        locationType: appointmentForm.locationType,
        homeAddress: appointmentForm.locationType === 'home' ? appointmentForm.homeAddress.trim() : undefined,
        status: appointmentForm.status,
        totalPrice: Number(appointmentForm.totalPrice),
        depositRequired: Number(appointmentForm.depositRequired),
        depositPaid: appointmentForm.depositPaid,
        paymentMethod: appointmentForm.paymentMethod,
        notes: appointmentForm.notes.trim() || undefined,
      });
      triggerToast('✓ Nueva cita registrada en la agenda exitosamente.');
    }
    setShowAppointmentModal(false);
  };

  // =====================
  // CATÁLOGO DE PROMOCIONES (SISTEMAS & PRESS-ON INDEPENDIENTES)
  // =====================
  const handleOpenAddPromoSistema = (promoToEdit?: PromoDesign) => {
    if (promoToEdit) {
      setEditingPromoSistemaId(promoToEdit.id);
      setPromoSistemaForm({
        title: promoToEdit.title,
        collection: promoToEdit.collection || 'Sistema Profesional',
        description: promoToEdit.description || '',
        price: promoToEdit.price || 60,
        image: promoToEdit.image || '',
        recommendedSystem: promoToEdit.recommendedSystem || 'Softgel o Polygel',
        featured: !!promoToEdit.featured,
        active: promoToEdit.active !== false,
        allowedSystems: promoToEdit.allowedSystems
          ? { ...promoToEdit.allowedSystems, esmaltado_gel: promoToEdit.allowedSystems.esmaltado_gel === true }
          : { polygel: true, softgel: true, builder: true, acrilicas: false, esmaltado_gel: false },
        allowedLevels: promoToEdit.allowedLevels || { sencillo: false, moderado: true, complejo: false },
        promoType: normalizePromoType(promoToEdit.promoType),
        companionAllowedSystems: promoToEdit.companionAllowedSystems
          ? {
              ...promoToEdit.companionAllowedSystems,
              esmaltado_gel: promoToEdit.companionAllowedSystems.esmaltado_gel === true,
            }
          : { polygel: true, softgel: true, builder: true, acrilicas: false, esmaltado_gel: false },
        companionAllowedLevels: promoToEdit.companionAllowedLevels || { sencillo: false, moderado: true, complejo: false },
        companionOptions: promoToEdit.companionOptions || '',
        promoDetailsTitle: promoToEdit.promoDetailsTitle || DEFAULT_PROMO_DETAILS_TITLE,
        promoDetailsBlocks:
          promoToEdit.promoDetailsBlocks && promoToEdit.promoDetailsBlocks.length > 0
            ? promoToEdit.promoDetailsBlocks.map((block) => ({ ...block }))
            : DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
      });
    } else {
      setEditingPromoSistemaId(null);
      setPromoSistemaForm({
        title: '',
        collection: 'Sistema Profesional',
        description: 'Elegante sistema promocional con manicura combinada rusa y acabado vitrificado.',
        price: 60,
        image: '/src/assets/images/nail_chrome_cateye_1792392507727.jpg',
        recommendedSystem: 'Softgel o Polygel',
        featured: false,
        active: true,
        allowedSystems: { polygel: true, softgel: true, builder: true, acrilicas: false, esmaltado_gel: false },
        allowedLevels: { sencillo: false, moderado: true, complejo: false },
        promoType: 'clasica',
        companionAllowedSystems: { polygel: true, softgel: true, builder: true, acrilicas: false, esmaltado_gel: false },
        companionAllowedLevels: { sencillo: false, moderado: true, complejo: false },
        companionOptions: '',
        promoDetailsTitle: DEFAULT_PROMO_DETAILS_TITLE,
        promoDetailsBlocks: DEFAULT_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
      });
    }
    setShowPromoSistemaModal(true);
  };

  const handleSavePromoSistema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoSistemaForm.title.trim() || !promoSistemaForm.image.trim()) {
      alert('Por favor ingresa el nombre del servicio y una imagen.');
      return;
    }

    if (editingPromoSistemaId) {
      updatePromoDesign(editingPromoSistemaId, {
        title: promoSistemaForm.title.trim(),
        collection: promoSistemaForm.collection.trim(),
        description: promoSistemaForm.description.trim(),
        price: Number(promoSistemaForm.price) || 60,
        image: promoSistemaForm.image.trim(),
        recommendedSystem: promoSistemaForm.recommendedSystem.trim(),
        featured: promoSistemaForm.featured,
        active: promoSistemaForm.active,
        category: 'salon',
        allowedSystems: promoSistemaForm.allowedSystems,
        allowedLevels: promoSistemaForm.allowedLevels,
        promoType: promoSistemaForm.promoType,
        companionAllowedSystems: promoSistemaForm.companionAllowedSystems,
        companionAllowedLevels: promoSistemaForm.companionAllowedLevels,
        companionOptions: promoSistemaForm.companionOptions.trim(),
        promoDetailsTitle: promoSistemaForm.promoDetailsTitle.trim(),
        promoDetailsBlocks: promoSistemaForm.promoDetailsBlocks
          .map((block) => ({ ...block, title: block.title.trim(), content: block.content.trim() }))
          .filter((block) => block.title.trim() !== '' || block.content.trim() !== ''),
      });
      triggerToast('✓ Sistema en promoción modificado correctamente.');
    } else {
      addPromoDesign({
        title: promoSistemaForm.title.trim(),
        collection: promoSistemaForm.collection.trim() || 'Sistema Profesional',
        description: promoSistemaForm.description.trim(),
        technique: 'Preparación rusa + Colocación de sistema + Esmaltado en gel + Sellado vitrificado',
        level: 'moderado',
        durationMinutes: 90,
        price: Number(promoSistemaForm.price) || 60,
        image: promoSistemaForm.image.trim(),
        tags: ['Promoción', 'Sistema', promoSistemaForm.collection.trim()],
        recommendedSystem: promoSistemaForm.recommendedSystem.trim() || 'Softgel o Polygel',
        featured: promoSistemaForm.featured,
        active: promoSistemaForm.active,
        category: 'salon',
        allowedSystems: promoSistemaForm.allowedSystems,
        allowedLevels: promoSistemaForm.allowedLevels,
        promoType: promoSistemaForm.promoType,
        companionAllowedSystems: promoSistemaForm.companionAllowedSystems,
        companionAllowedLevels: promoSistemaForm.companionAllowedLevels,
        companionOptions: promoSistemaForm.companionOptions.trim(),
        promoDetailsTitle: promoSistemaForm.promoDetailsTitle.trim(),
        promoDetailsBlocks: promoSistemaForm.promoDetailsBlocks
          .map((block) => ({ ...block, title: block.title.trim(), content: block.content.trim() }))
          .filter((block) => block.title.trim() !== '' || block.content.trim() !== ''),
      });
      triggerToast('✓ Nuevo sistema en promoción grabado e ingresado al catálogo.');
    }
    setShowPromoSistemaModal(false);
  };

  const handlePromoSistemaImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 0.8);
        setPromoSistemaForm((prev) => ({ ...prev, image: compressed }));
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPromoSistemaForm((prev) => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Promotional Press-On Handlers
  const handleOpenAddPromoPressOn = (promoToEdit?: PromoDesign) => {
    if (promoToEdit) {
      setEditingPromoPressOnId(promoToEdit.id);
      setPromoPressOnForm({
        title: promoToEdit.title,
        collection: promoToEdit.collection || 'Press On Promoción',
        description: promoToEdit.description || '',
        fullDesc: promoToEdit.fullDesc || promoToEdit.description || '',
        price: promoToEdit.price || 50,
        image: promoToEdit.image || '',
        defaultTip: promoToEdit.defaultTip || 'almendra',
        includedKit: promoToEdit.includedKit || 'elemental',
        stock: promoToEdit.stock !== undefined ? promoToEdit.stock : 5,
        sizeStock: promoToEdit.sizeStock || { XS: true, S: true, M: true, L: true },
        isTrending: !!promoToEdit.isTrending,
        isBestSeller: !!promoToEdit.isBestSeller,
        featured: !!promoToEdit.featured,
        active: promoToEdit.active !== false,
        promoDetailsTitle: promoToEdit.promoDetailsTitle || DEFAULT_PRESS_ON_PROMO_DETAILS_TITLE,
        promoDetailsBlocks:
          promoToEdit.promoDetailsBlocks && promoToEdit.promoDetailsBlocks.length > 0
            ? promoToEdit.promoDetailsBlocks.map((block) => ({ ...block }))
            : DEFAULT_PRESS_ON_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
        pressOnStructure: promoToEdit.pressOnStructure === 'duo' ? 'duo' : 'individual',
        duoDesignIds:
          promoToEdit.duoDesignIds && promoToEdit.duoDesignIds.length > 0
            ? [...promoToEdit.duoDesignIds]
            : pressOnDuoDesignOptions.filter((design) => design.id !== promoToEdit.id).map((design) => design.id),
      });
    } else {
      setEditingPromoPressOnId(null);
      setPromoPressOnForm({
        title: '',
        collection: 'Press On Promoción',
        description: 'Set reutilizable hecho a mano con acabado vitrificado.',
        fullDesc: 'Diseño exclusivo elaborado artesanalmente a medida con geles de alta gama.',
        price: 50,
        image: '/assets/aistudio/PO_2_4dd05dab.JPG',
        defaultTip: 'almendra',
        includedKit: 'elemental',
        stock: 5,
        sizeStock: { XS: true, S: true, M: true, L: true },
        isTrending: false,
        isBestSeller: false,
        featured: false,
        active: true,
        promoDetailsTitle: DEFAULT_PRESS_ON_PROMO_DETAILS_TITLE,
        promoDetailsBlocks: DEFAULT_PRESS_ON_PROMO_DETAILS_BLOCKS.map((block) => ({ ...block })),
        pressOnStructure: 'individual',
        duoDesignIds: pressOnDuoDesignOptions.map((design) => design.id),
      });
    }
    setShowPromoPressOnModal(true);
  };

  const handleSavePromoPressOn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoPressOnForm.title.trim() || !promoPressOnForm.image.trim()) {
      alert('Por favor ingresa el nombre del set y una imagen.');
      return;
    }
    if (promoPressOnForm.pressOnStructure === 'duo' && promoPressOnForm.duoDesignIds.length === 0) {
      alert('Por favor selecciona al menos un diseño Press On participante en el Duo.');
      return;
    }

    if (editingPromoPressOnId) {
      updatePromoDesign(editingPromoPressOnId, {
        title: promoPressOnForm.title.trim(),
        collection: promoPressOnForm.collection.trim(),
        description: promoPressOnForm.description.trim(),
        fullDesc: promoPressOnForm.description.trim(),
        price: Number(promoPressOnForm.price) || 50,
        image: promoPressOnForm.image.trim(),
        defaultTip: promoPressOnForm.defaultTip,
        includedKit: promoPressOnForm.includedKit,
        stock: Number(promoPressOnForm.stock) || 0,
        sizeStock: promoPressOnForm.sizeStock,
        isTrending: promoPressOnForm.isTrending,
        isBestSeller: promoPressOnForm.isBestSeller,
        featured: promoPressOnForm.featured,
        active: promoPressOnForm.active,
        category: 'press_on',
        promoDetailsTitle: promoPressOnForm.promoDetailsTitle.trim(),
        promoDetailsBlocks: promoPressOnForm.promoDetailsBlocks
          .map((block) => ({ ...block, title: block.title.trim(), content: block.content.trim() }))
          .filter((block) => block.title.trim() !== '' || block.content.trim() !== ''),
        pressOnStructure: promoPressOnForm.pressOnStructure,
        duoDesignIds: promoPressOnForm.pressOnStructure === 'duo' ? [...promoPressOnForm.duoDesignIds] : [],
      });
      triggerToast('✓ Set Press On en promoción modificado correctamente.');
    } else {
      addPromoDesign({
        title: promoPressOnForm.title.trim(),
        collection: promoPressOnForm.collection.trim() || 'Press On Promoción',
        description: promoPressOnForm.description.trim(),
        fullDesc: promoPressOnForm.description.trim(),
        technique: 'Set reutilizable elaborado a mano + Kit de regalo',
        level: 'moderado',
        durationMinutes: 30,
        price: Number(promoPressOnForm.price) || 50,
        image: promoPressOnForm.image.trim(),
        tags: ['Press On', 'Promoción'],
        recommendedSystem: 'Press On Reutilizable',
        defaultTip: promoPressOnForm.defaultTip,
        includedKit: promoPressOnForm.includedKit,
        stock: Number(promoPressOnForm.stock) || 5,
        sizeStock: promoPressOnForm.sizeStock,
        isTrending: promoPressOnForm.isTrending,
        isBestSeller: promoPressOnForm.isBestSeller,
        featured: promoPressOnForm.featured,
        active: promoPressOnForm.active,
        category: 'press_on',
        promoDetailsTitle: promoPressOnForm.promoDetailsTitle.trim(),
        promoDetailsBlocks: promoPressOnForm.promoDetailsBlocks
          .map((block) => ({ ...block, title: block.title.trim(), content: block.content.trim() }))
          .filter((block) => block.title.trim() !== '' || block.content.trim() !== ''),
        pressOnStructure: promoPressOnForm.pressOnStructure,
        duoDesignIds: promoPressOnForm.pressOnStructure === 'duo' ? [...promoPressOnForm.duoDesignIds] : [],
      });
      triggerToast('✓ Nuevo set Press On promocional grabado e ingresado al catálogo.');
    }
    setShowPromoPressOnModal(false);
  };

  const handlePromoPressOnImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 0.8);
        setPromoPressOnForm((prev) => ({ ...prev, image: compressed }));
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPromoPressOnForm((prev) => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // =====================
  // SERVICIOS ADICIONALES (GRABAR & MODIFICAR)
  // =====================
  const handleOpenAddAdditional = (itemToEdit?: AdditionalItem) => {
    if (itemToEdit) {
      setEditingAdditionalId(itemToEdit.id);
      setAdditionalForm({
        name: itemToEdit.name,
        category: itemToEdit.category,
        categoryLabel: itemToEdit.categoryLabel,
        description: itemToEdit.description,
        price: itemToEdit.price,
        unitLabel: itemToEdit.unitLabel || '',
        badge: itemToEdit.badge || '',
        active: itemToEdit.active !== false,
        targetSection: itemToEdit.targetSection || 'both',
      });
    } else {
      setEditingAdditionalId(null);
      setAdditionalForm({
        name: '',
        category: 'spa',
        categoryLabel: 'Spa de Uñas',
        description: 'Servicio adicional complementario de alta calidad.',
        price: 20,
        unitLabel: 'Por set',
        badge: '',
        active: true,
        targetSection: 'both',
      });
    }
    setShowAdditionalModal(true);
  };

  const handleSaveAdditional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!additionalForm.name.trim()) {
      alert('Por favor ingresa el nombre del servicio adicional.');
      return;
    }

    if (editingAdditionalId) {
      updateAdditionalItem(editingAdditionalId, {
        ...additionalForm,
        badge: additionalForm.badge.trim(),
        price: Number(additionalForm.price),
      });
      triggerToast('✓ Servicio adicional modificado correctamente.');
    } else {
      addAdditionalItem({
        ...additionalForm,
        badge: additionalForm.badge.trim(),
        price: Number(additionalForm.price),
      });
      triggerToast('✓ Nuevo servicio adicional registrado.');
    }
    setShowAdditionalModal(false);
  };

  // =====================
  // PRESS ON NAILS CATÁLOGO (GRABAR & MODIFICAR)
  // =====================
  const handleOpenAddPressOn = (itemToEdit?: PressOnItem) => {
    if (itemToEdit) {
      setEditingPressOnId(itemToEdit.id);
      setPressOnForm({
        name: itemToEdit.name,
        price: itemToEdit.price,
        defaultTip: itemToEdit.defaultTip,
        shortDesc: itemToEdit.shortDesc,
        fullDesc: itemToEdit.fullDesc,
        image: itemToEdit.image,
        includedKit: itemToEdit.includedKit || (itemToEdit.price >= 80 ? 'premium' : 'standard'),
        sizeStock: itemToEdit.sizeStock || { XS: true, S: true, M: true, L: true },
        stock: itemToEdit.stock !== undefined ? itemToEdit.stock : 5,
        isTrending: !!itemToEdit.isTrending,
        isBestSeller: !!itemToEdit.isBestSeller,
        featuredInCarousel: itemToEdit.featuredInCarousel !== undefined ? itemToEdit.featuredInCarousel : true,
      });
    } else {
      setEditingPressOnId(null);
      setPressOnForm({
        name: '',
        price: 75,
        defaultTip: 'almendra',
        shortDesc: 'Diseño artesanal reutilizable hecho a mano...',
        fullDesc: 'Diseño exclusivo elaborado artesanalmente a medida con geles de alta gama y acabado vitrificado.',
        image: '/assets/aistudio/PO_2_4dd05dab.JPG',
        includedKit: 'standard',
        sizeStock: { XS: true, S: true, M: true, L: true },
        stock: 5,
        isTrending: false,
        isBestSeller: false,
        featuredInCarousel: true,
      });
    }
    setShowPressOnModal(true);
  };

  const handleSavePressOn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pressOnForm.name.trim() || !pressOnForm.image.trim()) {
      alert('Por favor ingresa el nombre del set y una imagen.');
      return;
    }

    if (editingPressOnId) {
      updatePressOnItem(editingPressOnId, {
        name: pressOnForm.name.trim(),
        price: Number(pressOnForm.price),
        defaultTip: pressOnForm.defaultTip,
        shortDesc: pressOnForm.shortDesc.trim(),
        fullDesc: pressOnForm.fullDesc.trim(),
        image: pressOnForm.image.trim(),
        gallery: [pressOnForm.image.trim()],
        includedKit: pressOnForm.includedKit,
        sizeStock: pressOnForm.sizeStock,
        stock: Number(pressOnForm.stock) || 0,
        isTrending: pressOnForm.isTrending,
        isBestSeller: pressOnForm.isBestSeller,
        featuredInCarousel: pressOnForm.featuredInCarousel,
      });
      triggerToast('✓ Set de Press On modificado correctamente.');
    } else {
      addPressOnItem({
        name: pressOnForm.name.trim(),
        price: Number(pressOnForm.price),
        defaultTip: pressOnForm.defaultTip,
        shortDesc: pressOnForm.shortDesc.trim() || 'Diseño artesanal exclusivo...',
        fullDesc: pressOnForm.fullDesc.trim() || pressOnForm.shortDesc.trim(),
        image: pressOnForm.image.trim(),
        gallery: [pressOnForm.image.trim()],
        includedKit: pressOnForm.includedKit,
        sizeStock: pressOnForm.sizeStock,
        stock: Number(pressOnForm.stock) || 5,
        isTrending: pressOnForm.isTrending,
        isBestSeller: pressOnForm.isBestSeller,
        featuredInCarousel: pressOnForm.featuredInCarousel,
      });
      triggerToast('✓ Nuevo set grabado y añadido al catálogo Press On.');
    }
    setShowPressOnModal(false);
  };

  // =====================
  // INVENTARIO (GRABAR & MODIFICAR)
  // =====================
  const handleOpenAddInventory = (itemToEdit?: InventoryItem) => {
    if (itemToEdit) {
      setEditingInventoryId(itemToEdit.id);
      setInventoryForm({
        name: itemToEdit.name,
        price: itemToEdit.price,
        stock: itemToEdit.stock,
        image: itemToEdit.image,
        description: itemToEdit.description || '',
        active: itemToEdit.active !== false,
        featuredInCarousel: itemToEdit.featuredInCarousel !== undefined ? itemToEdit.featuredInCarousel : true,
        allowBeeCoins: itemToEdit.allowBeeCoins !== false,
        variants: itemToEdit.variants || [],
      });
    } else {
      setEditingInventoryId(null);
      setInventoryForm({
        name: '',
        price: 25,
        stock: 10,
        image: '',
        description: '',
        active: true,
        featuredInCarousel: true,
        allowBeeCoins: true,
        variants: [],
      });
    }
    setShowInventoryModal(true);
  };

  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryForm.name.trim()) {
      alert('Ingresa el nombre del producto de inventario.');
      return;
    }

    const updates: Partial<InventoryItem> = {
      name: inventoryForm.name.trim(),
      price: Number(inventoryForm.price) || 0,
      stock: Number(inventoryForm.stock) || 0,
      image: inventoryForm.image && inventoryForm.image.trim() !== '' ? inventoryForm.image.trim() : '/assets/aistudio/PO_1_f5e6a392.JPG',
      description: inventoryForm.description.trim(),
      active: inventoryForm.active,
      featuredInCarousel: inventoryForm.featuredInCarousel,
      allowBeeCoins: inventoryForm.allowBeeCoins,
      variants: inventoryForm.variants.map((v) => ({ ...v })).filter((v) => v.name.trim() !== ''),
    };

    if (editingInventoryId) {
      updateInventoryItem(editingInventoryId, updates);
      triggerToast('✓ Producto de inventario modificado correctamente.');
    } else {
      addInventoryItem({
        name: updates.name || 'Nuevo Producto',
        price: updates.price || 0,
        stock: updates.stock || 0,
        image: updates.image || '/assets/aistudio/PO_1_f5e6a392.JPG',
        description: updates.description || '',
        active: updates.active !== false,
        featuredInCarousel: updates.featuredInCarousel !== false,
        allowBeeCoins: updates.allowBeeCoins !== false,
        variants: updates.variants || [],
      });
      triggerToast('✓ Nuevo producto registrado en inventario.');
    }
    
    setShowInventoryModal(false);
  };

  const handleInventoryImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 0.75);
        setInventoryForm((prev) => ({ ...prev, image: compressed }));
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setInventoryForm((prev) => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // =====================
  // CURSOS & ESPECIALIZACIONES (GRABAR & MODIFICAR)
  // =====================
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    price: 120,
    priceLabel: 'S/. 120.00',
    image: '',
    whatYouWillLearnText: '',
    description: '',
    hotmartUrl: 'https://hotmart.com',
    active: true,
    featuredInCarousel: true,
  });

  const handleOpenAddCourse = (itemToEdit?: CourseItem) => {
    if (itemToEdit) {
      setEditingCourseId(itemToEdit.id);
      setCourseForm({
        title: itemToEdit.title,
        price: itemToEdit.price,
        priceLabel: itemToEdit.priceLabel || `S/. ${itemToEdit.price.toFixed(2)}`,
        image: itemToEdit.image,
        whatYouWillLearnText: (itemToEdit.whatYouWillLearn || []).join('\n'),
        description: itemToEdit.description || '',
        hotmartUrl: itemToEdit.hotmartUrl || 'https://hotmart.com',
        active: itemToEdit.active !== false,
        featuredInCarousel: itemToEdit.featuredInCarousel !== false,
      });
    } else {
      setEditingCourseId(null);
      setCourseForm({
        title: '',
        price: 120,
        priceLabel: 'S/. 120.00',
        image: '',
        whatYouWillLearnText: 'Preparación perfecta de uña natural\nTécnica avanzada y aplicación\nDiseño y sellado profesional',
        description: 'Descripción detallada de la especialización profesional...',
        hotmartUrl: 'https://hotmart.com',
        active: true,
        featuredInCarousel: true,
      });
    }
    setShowCourseModal(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim()) {
      alert('Por favor ingresa el título del curso o especialización.');
      return;
    }

    const whatArr = courseForm.whatYouWillLearnText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updates = {
      title: courseForm.title.trim(),
      price: Number(courseForm.price) || 0,
      priceLabel: courseForm.priceLabel.trim() || `S/. ${Number(courseForm.price || 0).toFixed(2)}`,
      image: courseForm.image && courseForm.image.trim() !== '' ? courseForm.image.trim() : '/src/assets/images/nail_chrome_cateye_1792392507727.jpg',
      whatYouWillLearn: whatArr,
      description: courseForm.description.trim(),
      hotmartUrl: courseForm.hotmartUrl.trim() || 'https://hotmart.com',
      active: courseForm.active,
      featuredInCarousel: courseForm.featuredInCarousel,
    };

    if (editingCourseId) {
      updateCourseItem(editingCourseId, updates);
      triggerToast('✓ Curso / Especialización modificado correctamente.');
    } else {
      addCourseItem(updates);
      triggerToast('✓ Nuevo curso grabado y añadido al catálogo.');
    }
    setShowCourseModal(false);
  };

  const handleCourseImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 0.75);
        setCourseForm((prev) => ({ ...prev, image: compressed }));
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCourseForm((prev) => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // =====================
  // EXPERIENCIA & RESEÑAS (MODAL A: RESEÑA CLIENTA / MODAL B: VIDEO STUDIO)
  // =====================
  // Modal A: Reseña de Clienta
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<{
    clientName: string;
    comment: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    serviceName: string;
    rating: number;
    active: boolean;
  }>({
    clientName: '',
    comment: '',
    mediaUrl: '',
    mediaType: 'image',
    serviceName: 'Softgel + Nail Art',
    rating: 5,
    active: true,
  });

  const handleOpenAddReview = (reviewToEdit?: ReviewItem) => {
    if (reviewToEdit) {
      setEditingReviewId(reviewToEdit.id);
      setReviewForm({
        clientName: reviewToEdit.clientName || '',
        comment: reviewToEdit.comment || '',
        mediaUrl: reviewToEdit.mediaUrl || '',
        mediaType: 'image',
        serviceName: reviewToEdit.serviceName || 'Softgel + Nail Art',
        rating: reviewToEdit.rating || 5,
        active: reviewToEdit.active !== false,
      });
    } else {
      setEditingReviewId(null);
      setReviewForm({
        clientName: '',
        comment: '',
        mediaUrl: '',
        mediaType: 'image',
        serviceName: 'Softgel + Nail Art',
        rating: 5,
        active: true,
      });
    }
    setShowReviewModal(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.clientName.trim()) {
      alert('Ingresa el nombre de la clienta.');
      return;
    }
    if (!reviewForm.comment.trim()) {
      alert('Ingresa el comentario o testimonio de la clienta.');
      return;
    }

    const updates: Partial<ReviewItem> = {
      clientName: reviewForm.clientName.trim(),
      comment: reviewForm.comment.trim(),
      mediaUrl: reviewForm.mediaUrl.trim(),
      mediaType: 'image',
      serviceName: reviewForm.serviceName.trim() || undefined,
      rating: Number(reviewForm.rating) || 5,
      active: reviewForm.active,
    };

    if (editingReviewId) {
      updateReviewItem(editingReviewId, updates);
      triggerToast('✓ Reseña de clienta modificada correctamente.');
    } else {
      addReviewItem(updates as Omit<ReviewItem, 'id' | 'createdAt'>);
      triggerToast('✓ Nueva reseña guardada exitosamente.');
    }
    setShowReviewModal(false);
  };

  const handleReviewMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 0.8);
        setReviewForm((prev) => ({
          ...prev,
          mediaUrl: compressed,
          mediaType: 'image',
        }));
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReviewForm((prev) => ({
            ...prev,
            mediaUrl: reader.result as string,
            mediaType: 'image',
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handlePressOnImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPressOnForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // =====================
  // CATÁLOGO DE NUESTROS SERVICIOS (GRABAR & MODIFICAR)
  // =====================
  const handleOpenAddService = (itemToEdit?: ServiceItem) => {
    if (itemToEdit) {
      setEditingServiceId(itemToEdit.id);
      setServiceForm({
        title: itemToEdit.title,
        tag: itemToEdit.tag,
        priceLabel: itemToEdit.priceLabel,
        image: itemToEdit.image,
        description: itemToEdit.description,
        active: itemToEdit.active !== false,
        featuredInCarousel: itemToEdit.featuredInCarousel !== undefined ? itemToEdit.featuredInCarousel : true,
        levelBasicTitle: itemToEdit.levelBasicTitle || 'Sutil (S)',
        levelBasicPrice: itemToEdit.levelBasicPrice !== undefined ? itemToEdit.levelBasicPrice : 60,
        levelBasicDesc: itemToEdit.levelBasicDesc || 'Esmaltado liso, unicolor o francés minimalista elegante.',
        levelModerateTitle: itemToEdit.levelModerateTitle || 'Moderado (M)',
        levelModeratePrice: itemToEdit.levelModeratePrice !== undefined ? itemToEdit.levelModeratePrice : 80,
        levelModerateDesc: itemToEdit.levelModerateDesc || 'Nail art a mano alzada, flores, lazos, cat-eye o cromo sutil.',
        levelComplexTitle: itemToEdit.levelComplexTitle || 'Complejo (C)',
        levelComplexPrice: itemToEdit.levelComplexPrice !== undefined ? itemToEdit.levelComplexPrice : 100,
        levelComplexDesc: itemToEdit.levelComplexDesc || 'Relieves 3D/4D de autor, cromo extremo, pedrería y texturas.',
        removalOptions: itemToEdit.removalOptions && itemToEdit.removalOptions.length > 0 ? itemToEdit.removalOptions : REMOVAL_SERVICE_OPTIONS,
      });
    } else {
      setEditingServiceId(null);
      setServiceForm({
        title: '',
        tag: 'Sistema Profesional',
        priceLabel: 'Desde S/. 60',
        image: '/src/assets/images/nail_chrome_cateye_1792392507727.jpg',
        description: 'Descripción detallada del servicio y beneficios...',
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
        removalOptions: REMOVAL_SERVICE_OPTIONS,
      });
    }
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title.trim() || !serviceForm.image.trim()) {
      alert('Por favor ingresa el nombre del servicio y una imagen.');
      return;
    }

    if (editingServiceId) {
      updateServiceItem(editingServiceId, {
        title: serviceForm.title.trim(),
        tag: serviceForm.tag.trim(),
        priceLabel: serviceForm.priceLabel.trim(),
        image: serviceForm.image.trim(),
        description: serviceForm.description.trim(),
        active: serviceForm.active,
        featuredInCarousel: serviceForm.featuredInCarousel,
        levelBasicTitle: serviceForm.levelBasicTitle.trim(),
        levelBasicPrice: Number(serviceForm.levelBasicPrice) || 0,
        levelBasicDesc: serviceForm.levelBasicDesc.trim(),
        levelModerateTitle: serviceForm.levelModerateTitle.trim(),
        levelModeratePrice: Number(serviceForm.levelModeratePrice) || 0,
        levelModerateDesc: serviceForm.levelModerateDesc.trim(),
        levelComplexTitle: serviceForm.levelComplexTitle.trim(),
        levelComplexPrice: Number(serviceForm.levelComplexPrice) || 0,
        levelComplexDesc: serviceForm.levelComplexDesc.trim(),
        removalOptions: serviceForm.removalOptions,
      });
      triggerToast('✓ Servicio y tarifas por nivel modificados correctamente.');
    } else {
      addServiceItem({
        title: serviceForm.title.trim(),
        tag: serviceForm.tag.trim(),
        priceLabel: serviceForm.priceLabel.trim(),
        image: serviceForm.image.trim(),
        description: serviceForm.description.trim(),
        active: serviceForm.active,
        featuredInCarousel: serviceForm.featuredInCarousel,
        levelBasicTitle: serviceForm.levelBasicTitle.trim() || 'Sutil (S)',
        levelBasicPrice: Number(serviceForm.levelBasicPrice) || 60,
        levelBasicDesc: serviceForm.levelBasicDesc.trim(),
        levelModerateTitle: serviceForm.levelModerateTitle.trim() || 'Moderado (M)',
        levelModeratePrice: Number(serviceForm.levelModeratePrice) || 80,
        levelModerateDesc: serviceForm.levelModerateDesc.trim(),
        levelComplexTitle: serviceForm.levelComplexTitle.trim() || 'Complejo (C)',
        levelComplexPrice: Number(serviceForm.levelComplexPrice) || 100,
        levelComplexDesc: serviceForm.levelComplexDesc.trim(),
        removalOptions: serviceForm.removalOptions,
      });
      triggerToast('✓ Nuevo servicio grabado con sus tarifas por nivel.');
    }
    setShowServiceModal(false);
  };

  const handleServiceImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setServiceForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper: actualiza un campo de una opción de retiro/spa/combo dentro del formulario de servicio
  const updateRemovalOption = (id: RemovalType, patch: Partial<RemovalServiceOption>) => {
    setServiceForm((p) => ({
      ...p,
      removalOptions: (p.removalOptions || []).map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'yapeQrImage' | 'plinQrImage' | 'bcpQrImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // =====================
  // CONFIGURACIÓN (GRABAR & RESTABLECER)
  // =====================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingSettings) return;
    if (newAdminPassword && !imagePreviewOnly) {
      setIsSavingSettings(true);
      try {
        const response = await fetch(ADMIN_SESSION_ENDPOINT, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newAdminPassword }),
        });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        if (response.status === 400) {
          triggerToast(`⚠ Usa una contraseña de ${ADMIN_PASSWORD_MIN_LENGTH} a ${ADMIN_PASSWORD_MAX_LENGTH} caracteres.`);
          return;
        }
        if (response.status !== 204) throw new Error('Admin password change failed');
        setNewAdminPassword('');
        setShowAdminPassword(false);
      } catch {
        triggerToast('⚠ No se pudo cambiar la contraseña del panel. Inténtalo de nuevo.');
        return;
      } finally {
        setIsSavingSettings(false);
      }
    }
    updateSettings(settingsForm);
    triggerToast(newAdminPassword ? '✓ Configuración guardada. La nueva contraseña ya está activa.' : '✓ Configuración guardada.');
  };

  // =====================
  // CONFIRMED DELETION DISPATCH
  // =====================
  const handleConfirmAction = () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'appointment' && deleteConfirmation.id) {
      deleteAppointment(deleteConfirmation.id);
      triggerToast('✓ Cita eliminada permanentemente.');
    } else if (deleteConfirmation.type === 'promo' && deleteConfirmation.id) {
      deletePromoDesign(deleteConfirmation.id);
      triggerToast('✓ Diseño eliminado del catálogo.');
    } else if (deleteConfirmation.type === 'presson' && deleteConfirmation.id) {
      deletePressOnItem(deleteConfirmation.id);
      triggerToast('✓ Set eliminado del catálogo Press On.');
    } else if (deleteConfirmation.type === 'service' && deleteConfirmation.id) {
      deleteServiceItem(deleteConfirmation.id);
      triggerToast('✓ Servicio eliminado del catálogo.');
    } else if (deleteConfirmation.type === 'additional' && deleteConfirmation.id) {
      deleteAdditionalItem(deleteConfirmation.id);
      triggerToast('✓ Servicio adicional eliminado.');
    } else if (deleteConfirmation.type === 'cancelled') {
      clearCancelledAppointments();
      triggerToast('✓ Todas las citas canceladas fueron eliminadas.');
    } else if (deleteConfirmation.type === 'reset_presson') {
      resetPressOnCatalog();
      triggerToast('✓ Catálogo original de 3 sets Press On restaurado.');
    } else if (deleteConfirmation.type === 'reset_services') {
      resetServicesCatalog();
      triggerToast('✓ Catálogo de 6 servicios originales restaurado.');
    } else if (deleteConfirmation.type === 'reset_additionals') {
      resetAdditionalsList();
      triggerToast('✓ Lista de adicionales restaurada a valores por defecto.');
    } else if (deleteConfirmation.type === 'inventory' && deleteConfirmation.id) {
      deleteInventoryItem(deleteConfirmation.id);
      triggerToast('✓ Producto eliminado permanentemente del inventario.');
    } else if (deleteConfirmation.type === 'reset_inventory') {
      resetInventoryList();
      triggerToast('✓ Inventario restaurado a valores por defecto.');
    } else if (deleteConfirmation.type === 'course' && deleteConfirmation.id) {
      deleteCourseItem(deleteConfirmation.id);
      triggerToast('✓ Curso eliminado permanentemente.');
    } else if (deleteConfirmation.type === 'reset_courses') {
      resetCoursesList();
      triggerToast('✓ Catálogo de cursos restaurado.');
    } else if (deleteConfirmation.type === 'reset_settings') {
      resetSettings();
      setSettingsForm({ ...settings });
      setNewAdminPassword('');
      triggerToast('✓ Ajustes restaurados a los valores iniciales.');
    }
    setDeleteConfirmation(null);
  };

  return (

    <div className="py-8 lg:py-12 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 animate-bounce duration-300">
            <div className="bg-[#2E2016] text-[#FAF7F2] px-5 py-3 rounded-2xl shadow-xl border border-[#D4AF37]/50 flex items-center gap-2.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#E6C665]" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Top Header of Admin Console */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E8DEC9]">
          <div className="flex items-center gap-3.5">
            <GabeeLogo size="sm" />
            <div>
              <span className="text-[10px] font-brand uppercase tracking-widest text-[#947D68]">
                Panel de Administración Oficial
              </span>
              <h2 className="text-2xl font-display font-bold text-[#302117]">
                Gestión de Gabee Estudio
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Google Sheets Connection Status Badge */}
            {spreadsheetUrl ? (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                title="Abrir hoja de cálculo en Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Sheets Conectado</span>
                <ExternalLink className="w-3 h-3 text-emerald-700" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('sheets')}
                className="py-1.5 px-3 rounded-xl bg-[#F4EFE6] border border-[#DFCBB5] text-[#7A614A] text-xs font-medium flex items-center gap-1.5 hover:bg-[#EAE0D0] transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#B89230]" />
                <span>Configurar Google Sheets</span>
              </button>
            )}



            <button
              type="button"
              onClick={() => {
                if (onExitAdmin) {
                  void Promise.resolve(onExitAdmin()).catch(() => triggerToast('⚠ No se pudo cerrar la sesión. Inténtalo de nuevo.'));
                  return;
                }
                setIsAdmin(false);
                setCurrentView('home');
              }}
              className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#5A4535] hover:bg-[#F0E8DC] transition-colors cursor-pointer"
            >
              Cerrar sesión y volver a la tienda
            </button>
          </div>
        </div>

        {/* Internal Notification Banner for Gaby when pending recharges exist */}
        {rechargeRequests.filter((r) => r.status === 'pending').length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FDFBF7] border border-[#C5A059] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#C5A059] flex items-center justify-center shrink-0 shadow-2xs">
                <BeeCoinIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704] flex items-center gap-2">
                  <span>🔔 Recargas de BeeCoins por Validar</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#C5A059] text-[10px] text-[#8C6B1C] font-mono font-bold">
                    {rechargeRequests.filter((r) => r.status === 'pending').length} pendientes
                  </span>
                </h4>
                <p className="font-['Marcellus'] text-xs text-[#5D3704]/80">
                  Una clienta ha registrado su número de operación. Puedes aprobarlo inmediatamente para sumarle sus BeeCoins.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('user_accounts')}
              className="py-2 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] hover:bg-[#F2E5D5] text-xs font-['Cinzel'] font-bold whitespace-nowrap cursor-pointer shadow-2xs transition-all"
            >
              Ver y Validar Recargas →
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-[#E8DFC9] pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'appointments'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#C89D3C]" />
            <span>Gestión de Citas ({appointments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store_orders')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'store_orders'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-[#C89D3C]" />
            <span>Gestión de Pedidos ({displayStoreOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('user_accounts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'user_accounts'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <User className="w-4 h-4 text-[#C89D3C]" />
            <span>Cuentas & Recargas</span>
            {rechargeRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F2] border border-[#C5A059] text-[#8C6B1C] animate-pulse">
                🔔 {rechargeRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('loyalty_vip')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'loyalty_vip'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C89D3C]" />
            <span>Control VIP & Fidelidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-[#C89D3C]" />
            <span>Catálogo de Promociones ({promoDesigns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presson')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'presson'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C89D3C]" />
            <span>Catálogo Press On ({pressOnCatalog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'services'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C89D3C]" />
            <span>Catálogo de Nuestros Servicios ({servicesCatalog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('additionals')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'additionals'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C89D3C]" />
            <span>Servicios Adicionales ({additionalsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Package className="w-4 h-4 text-[#C89D3C]" />
            <span>Gestión de Inventario ({inventoryList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'courses'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-[#C89D3C]" />
            <span>Especializaciones & Cursos ({coursesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Star className="w-4 h-4 text-[#C89D3C]" />
            <span>Experiencia & Reseñas ({reviewsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Settings className="w-4 h-4 text-[#C89D3C]" />
            <span>Configuración y Tarifas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catbee')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'catbee'
                ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-bold'
                : 'text-[#6C5747] hover:bg-[#F2ECE2] border border-transparent'
            }`}
          >
            <Bot className="w-4 h-4 text-[#C89D3C]" />
            <span>Configuración de Catbee ({catbeeKnowledge.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sheets'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-400 font-bold shadow-xs'
                : 'text-emerald-900 bg-emerald-50/60 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Spreadsheet {spreadsheetId ? '✓' : '(Conectar)'}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: Appointments Management (Grabar, Modificar, Eliminar) */}
        {/* ========================================================= */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Top Action Bar: Register Manual Appointment & Clean Cancelled */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E7DDCE] shadow-2xs">
              <div className="flex items-center gap-2 overflow-x-auto">
                {['all', 'pending_deposit', 'confirmed', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap transition-all ${
                      statusFilter === st
                        ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                        : 'bg-[#FAF7F2] text-[#7A6655] hover:bg-[#F2ECE2] border border-transparent'
                    }`}
                  >
                    {st === 'all' && `Todas (${appointments.length})`}
                    {st === 'pending_deposit' && `Pendiente Adelanto (${appointments.filter(a => a.status === 'pending_deposit').length})`}
                    {st === 'confirmed' && `Confirmadas (${appointments.filter(a => a.status === 'confirmed').length})`}
                    {st === 'completed' && `Atendidas (${appointments.filter(a => a.status === 'completed').length})`}
                    {st === 'cancelled' && `Canceladas (${appointments.filter(a => a.status === 'cancelled').length})`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por clienta o código..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-[#DDD1BF] bg-[#FAF7F2] text-[#302117] focus:outline-none focus:ring-1 focus:ring-[#C29D38] w-full sm:w-56"
                />

                <button
                  type="button"
                  onClick={handleOpenNewAppointment}
                  className="py-2 px-3.5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer transition-all"
                  title="Grabar y registrar nueva cita en la agenda"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>Registrar Cita Manual</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenScheduleModal}
                  className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-[10px] sm:text-xs font-['Cinzel'] font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer transition-all"
                  title="Gestionar disponibilidad de días presenciales y tiempos de confección Press On"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>Días y Tiempos</span>
                </button>


              </div>
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E7DDCE] text-xs text-[#7B6756] space-y-2">
                <Calendar className="w-8 h-8 text-[#C4B29E] mx-auto" />
                <p>No hay citas que coincidan con el filtro seleccionado.</p>
                <button
                  type="button"
                  onClick={handleOpenNewAppointment}
                  className="text-xs font-semibold text-[#8C6B1C] hover:underline"
                >
                  + Registrar una nueva cita aquí
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl bg-white border border-[#E7DDCE] shadow-2xs hover:border-[#D5C6B1] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[#8C6B1C] bg-[#FAF4EB] px-2 py-0.5 rounded border border-[#E8DFC9]">
                          #{apt.code}
                        </span>

                        {/* Badge de Sección / Origen */}
                        {apt.serviceType === 'promotion' ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                            PROMOCIONES
                          </span>
                        ) : apt.pressOnDetails ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                            PRESS ON NAILS
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF4EB] text-[#5D3704] border border-[#C5A059]/50">
                            NUESTROS SERVICIOS
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : apt.status === 'pending_deposit'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                              : apt.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {apt.status === 'confirmed' && '✓ Adelanto verificado / Confirmado'}
                          {apt.status === 'pending_deposit' && '⏳ En espera de confirmación'}
                          {apt.status === 'completed' && 'Atendido'}
                          {apt.status === 'cancelled' && 'Cancelado'}
                        </span>

                        {apt.paymentOperationNumber && (
                          <span className="text-[10px] font-mono text-[#5D3704] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#DDD1BF]">
                            N° Op: <strong>{apt.paymentOperationNumber}</strong>
                          </span>
                        )}

                        <span className="text-[11px] text-[#917E6F] font-mono ml-auto lg:ml-0">
                          Reg: {new Date(apt.createdAt).toLocaleDateString('es-PE')}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-[#2F2016]">
                        {apt.clientName}{' '}
                        {apt.clientInstagram && (
                          <span className="text-xs font-normal text-[#8A7563]">
                            ({apt.clientInstagram})
                          </span>
                        )}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6F5B4D]">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#8C6B1C]" />
                          <span>{apt.date} · {apt.timeSlot}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#8C6B1C]" />
                          <span>{apt.clientPhone}</span>
                        </span>

                        <span>
                          Modalidad: <strong>{apt.locationType === 'studio' ? 'En Estudio' : `A Domicilio (${apt.homeAddress || 'Sin dirección'})`}</strong>
                        </span>
                      </div>

                      <div className="text-xs text-[#7A6655] pt-1 space-y-1">
                        {renderAppointmentDetails(apt)}
                      </div>

                          {/* Display Voucher Photo if present */}
                        {apt.voucherPhoto && (
                          <div className="pt-1.5 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Comprobante de Pago:</span>
                            <button
                              type="button"
                              onClick={() => setLightboxImage(apt.voucherPhoto || null)}
                              className="w-12 h-12 rounded-lg overflow-hidden border-2 border-emerald-600 bg-gray-100 hover:scale-110 transition-transform shrink-0 shadow-2xs cursor-pointer"
                              title="Ver comprobante de pago en pantalla completa"
                            >
                              <img src={apt.voucherPhoto} alt="Comprobante de Pago" className="w-full h-full object-cover" />
                            </button>
                          </div>
                        )}

                        {/* Thumbnails of attached photos if available */}
                        {(apt.photos?.length || 0) > 0 && (
                          <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-[#8C6B1C] uppercase">Fotos Adjuntas:</span>
                            {apt.photos?.map((photoUrl, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setLightboxImage(photoUrl)}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-[#D5C6B1] bg-gray-100 hover:scale-110 transition-transform shrink-0 cursor-pointer"
                                title="Ver foto adjunta en pantalla completa"
                              >
                                <img src={photoUrl} alt="Foto adjunta" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}

                      </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#F2ECE2]">
                      <div className="text-left sm:text-right text-xs space-y-1">
                        <span className="text-[#887463] block">Total S/. {apt.totalPrice.toFixed(2)}</span>
                        <span className="font-bold font-mono text-[#8C6B1C] block">
                          Adelanto: S/. {apt.depositRequired} ({apt.paymentMethod.toUpperCase()})
                        </span>
                        {apt.depositPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                            ✓ Adelanto verificado / Confirmado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                            ⏳ Adelanto pendiente de revisión
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 3 Botones Directos de Gestión en Columna (Ahorro de Espacio Horizontal) */}
                        <div className="flex flex-col gap-1 w-28 sm:w-32 shrink-0">
                          {/* Botón 1: Confirmar (para validar la cita tras revisar el depósito) */}
                          <button
                            type="button"
                            onClick={() => {
                              updateAppointmentStatus(apt.id, 'confirmed', true);
                              triggerToast(`✓ Cita #${apt.code} confirmada (Adelanto validado).`);
                            }}
                            className={`w-full py-1.5 px-2 rounded-xl text-[10.5px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 ${
                              apt.status === 'confirmed'
                                ? 'bg-[#EFE4D6] border border-[#C5A059] text-[#5D3704] font-bold shadow-xs'
                                : 'bg-[#FAF4EB] hover:bg-[#F2E5D5] text-[#5D3704] border border-[#D5C6B1] hover:border-[#C5A059]'
                            }`}
                            title="Confirmar cita tras revisar el adelanto o depósito"
                          >
                            <Check className="w-3.5 h-3.5 text-[#8C6B1C]" />
                            <span>Confirmar</span>
                          </button>

                          {/* Botón 2: Atendido (para marcar cuando la clienta ya recibió su servicio en el estudio o su pedido) */}
                          <button
                            type="button"
                            onClick={() => {
                              updateAppointmentStatus(apt.id, 'completed');
                              triggerToast(`✓ Cita #${apt.code} marcada como atendida.`);
                            }}
                            className={`w-full py-1.5 px-2 rounded-xl text-[10.5px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 ${
                              apt.status === 'completed'
                                ? 'bg-[#EFE4D6] border border-[#C5A059] text-[#5D3704] font-bold shadow-xs'
                                : 'bg-[#FAF4EB] hover:bg-[#F2E5D5] text-[#5D3704] border border-[#D5C6B1] hover:border-[#C5A059]'
                            }`}
                            title="Marcar cuando la clienta ya fue atendida en estudio o recibió su pedido"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#8C6B1C]" />
                            <span>Atendido</span>
                          </button>

                          {/* Botón 3: Cancelar (acción directa sin ventanas emergentes) */}
                          <button
                            type="button"
                            onClick={() => {
                              updateAppointmentStatus(apt.id, 'cancelled');
                              triggerToast(`✓ Cita #${apt.code} cancelada.`);
                            }}
                            className={`w-full py-1.5 px-2 rounded-xl text-[10.5px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 ${
                              apt.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border border-rose-300 font-bold'
                                : 'bg-[#FAF4EB] hover:bg-rose-50 hover:text-rose-800 text-[#5D3704] border border-[#D5C6B1] hover:border-rose-300'
                            }`}
                            title="Anular cita"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </div>

                        {/* Botones Laterales Esenciales: WhatsApp, Lápiz, Tacho Rojo */}
                        <div className="flex flex-col gap-1 shrink-0">
                          {/* WhatsApp direct chat */}
                          <a
                            href={`https://wa.me/${apt.clientPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                            title="Contactar clienta por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Modificar Cita (Lápiz) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditAppointment(apt)}
                            className="p-1.5 rounded-lg border border-[#DDD1BF] bg-[#FAF4EB] text-[#5C493B] hover:bg-[#F2ECE2] transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                            title="Modificar datos de la cita si hubo un error"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#8C6B1C]" />
                          </button>

                          {/* Eliminar Cita (Tacho Rojo) */}
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmation({
                                type: 'appointment',
                                id: apt.id,
                                title: `¿Eliminar permanentemente la cita #${apt.code} de ${apt.clientName}?`,
                              })
                            }
                            className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                            title="Eliminar cita definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB GESTIÓN DE INVENTARIO (AUTÓNOMO)                       */}
        {/* ========================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E7DDCE] shadow-2xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]">
                    Gabee Studio · Control de Stock & Productos
                  </span>
                </div>
                <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                  Gestión de Inventario (Cuidado & Bienestar)
                </h3>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                  Autogestiona stock, precios, visibilidad y presencia en el carrusel de Cuidado y Bienestar.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirmation({
                      type: 'reset_inventory',
                      title: '¿Deseas restaurar la lista de productos por defecto de Cuidado y Bienestar?',
                    })
                  }
                  className="py-2 px-3 rounded-xl border border-[#D5C6B1] bg-white hover:bg-[#F2ECE2] text-[#695444] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restaurar inventario a valores originales"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddInventory()}
                  className="py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C89D3C]" />
                  <span>+ Registrar Producto</span>
                </button>
              </div>
            </div>

            {/* PRODUCT INVENTORY LIST & STOCK MANAGEMENT */}
            {inventoryList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E7DDCE] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#DDD1BF] flex items-center justify-center mx-auto text-[#5D3704]">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  No hay productos registrados en inventario
                </h4>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] max-w-sm mx-auto">
                  Haz clic en &quot;Registrar Producto&quot; para añadir aceites de cutícula, cremas hidratantes o exfoliantes.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddInventory()}
                    className="py-2 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer hover:bg-[#F2E5D5]"
                  >
                    + Registrar Producto
                  </button>
                  <button
                    type="button"
                    onClick={() => resetInventoryList()}
                    className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] hover:bg-[#F2ECE2] cursor-pointer"
                  >
                    Restaurar Valores Originales
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventoryList.map((item) => {
                  const isOutOfStock = (item.stock ?? 0) <= 0;
                  const isHidden = item.active === false || isOutOfStock;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-3xl bg-white border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                        isHidden ? 'border-dashed border-[#D5C6B1] opacity-75' : 'border-[#E7DDCE]'
                      }`}
                    >
                      <div>
                        {/* Thumbnail photo with badges */}
                        <div className="relative aspect-4/3 bg-[#F0E6D8] overflow-hidden">
                          <img
                            src={item.image || '/assets/aistudio/PO_1_f5e6a392.JPG'}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/assets/aistudio/PO_1_f5e6a392.JPG';
                            }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#5D3704] font-['Cinzel'] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#D5C6B1] shadow-xs">
                            S/. {item.price.toFixed(2)}
                          </div>

                          <div
                            className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded font-['Cinzel'] font-bold text-[10px] uppercase shadow-xs ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : item.stock <= 3
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {isOutOfStock ? 'Agotado (Oculto)' : `Stock: ${item.stock} un.`}
                          </div>

                          {isHidden && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs text-white text-[10px] font-['Cinzel'] font-bold py-1 text-center">
                              {isOutOfStock ? 'Oculto por Stock 0' : 'Desactivado (Oculto en Tienda & Inicio)'}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-2">
                          <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704] leading-snug">
                            {item.name}
                          </h4>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[#8C6B1C]">
                              S/. {item.price.toFixed(2)}
                            </span>
                            {item.allowBeeCoins !== false ? (
                              <span className="text-[10px] font-mono text-[#8C6B1C] bg-[#FAF4EB] px-2 py-0.5 rounded-full border border-[#D4AF37]/50 flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                                <span>{Math.round(item.price * 1000).toLocaleString('es-PE')} BeeCoins</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-['Cinzel'] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                💵 Solo Soles
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs font-['Marcellus'] text-[#5D3704]/80 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {/* Direct Stock Stepper controls */}
                          <div className="pt-2 flex items-center justify-between border-t border-[#F2ECE4]">
                            <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#7A6655]">
                              Ajustar Stock Rápido:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStock = Math.max(0, (item.stock ?? 0) - 1);
                                  updateInventoryItem(item.id, { stock: nextStock });
                                  triggerToast(`Stock de "${item.name}": ${nextStock} un.`);
                                }}
                                className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#DDD1BF] text-[#5D3704] hover:bg-[#F2ECE2] flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                title="Disminuir 1 unidad"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs px-2 py-0.5 bg-[#FAF7F2] rounded border border-[#E7DDCE] text-[#5D3704]">
                                {item.stock}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStock = (item.stock ?? 0) + 1;
                                  updateInventoryItem(item.id, { stock: nextStock });
                                  triggerToast(`Stock de "${item.name}": ${nextStock} un.`);
                                }}
                                className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#DDD1BF] text-[#5D3704] hover:bg-[#F2ECE2] flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                title="Aumentar 1 unidad"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions: Toggle Active, Carousel, Edit, Delete */}
                      <div className="p-4 pt-0">
                        <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const nextActive = item.active === false ? true : false;
                                updateInventoryItem(item.id, { active: nextActive });
                                triggerToast(
                                  nextActive
                                    ? '✓ Producto visible en la tienda e inicio.'
                                    : '✓ Producto desactivado y ocultado.'
                                );
                              }}
                              className="text-xs text-[#7B6756] hover:text-[#2E2017] flex items-center gap-1 cursor-pointer"
                              title={item.active !== false ? 'Clic para ocultar' : 'Clic para mostrar'}
                            >
                              {item.active !== false ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-[11px] font-medium text-emerald-700">Activo</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="text-[11px] font-medium text-amber-700">Oculto</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const newStatus = item.featuredInCarousel === false;
                                updateInventoryItem(item.id, { featuredInCarousel: newStatus });
                                triggerToast(
                                  newStatus
                                    ? '✓ Producto destacado en el Carrusel de Inicio.'
                                    : 'Producto quitado del Carrusel.'
                                );
                              }}
                              className={`text-[10px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                item.featuredInCarousel !== false
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                                  : 'bg-gray-100 text-gray-500 border-gray-300 opacity-60'
                              }`}
                              title={
                                item.featuredInCarousel !== false
                                  ? 'Destacado en vitrina (Clic para quitar)'
                                  : 'No destacado (Clic para incluir en carrusel)'
                              }
                            >
                              {item.featuredInCarousel !== false ? '✨ Carrusel ON' : 'Carrusel OFF'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAddInventory(item)}
                              className="py-1.5 px-3 rounded-lg border border-[#DDD1BF] text-[#5D3704] hover:bg-[#F2ECE2] text-xs font-['Cinzel'] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Modificar producto"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#5D3704]" />
                              <span>Modificar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirmation({
                                  type: 'inventory',
                                  id: item.id,
                                  title: `¿Estás segura de eliminar "${item.name}" permanentemente del inventario?`,
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: ESPECIALIZACIONES & CURSOS (ADMIN AUTÓNOMO)         */}
        {/* ========================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E7DDCE] shadow-2xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]">
                    Gabee Studio · Formación Profesional & Masterclasses
                  </span>
                </div>
                <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                  Gestión de Especializaciones & Cursos
                </h3>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                  Autogestiona portadas, temarios, precios y enlaces a tus páginas de venta en Hotmart.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirmation({
                      type: 'reset_courses',
                      title: '¿Deseas restaurar la lista de cursos y especializaciones a los valores por defecto?',
                    })
                  }
                  className="py-2 px-3 rounded-xl border border-[#D5C6B1] bg-white hover:bg-[#F2ECE2] text-[#695444] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restaurar cursos a valores originales"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Cursos</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddCourse()}
                  className="py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C89D3C]" />
                  <span>+ Registrar Curso</span>
                </button>
              </div>
            </div>

            {/* COURSES LIST & CARDS */}
            {coursesList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E7DDCE] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#DDD1BF] flex items-center justify-center mx-auto text-[#5D3704]">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  No hay especializaciones ni cursos registrados
                </h4>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] max-w-sm mx-auto">
                  Haz clic en &quot;Registrar Curso&quot; para añadir tu primera masterclass o curso profesional de uñas con venta en Hotmart.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddCourse()}
                    className="py-2 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer hover:bg-[#F2E5D5]"
                  >
                    + Registrar Curso
                  </button>
                  <button
                    type="button"
                    onClick={() => resetCoursesList()}
                    className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] hover:bg-[#F2ECE2] cursor-pointer"
                  >
                    Restaurar Cursos Originales
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesList.map((course) => {
                  const isHidden = course.active === false;

                  return (
                    <div
                      key={course.id}
                      className={`rounded-3xl bg-white border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                        isHidden ? 'border-dashed border-[#D5C6B1] opacity-75' : 'border-[#E7DDCE]'
                      }`}
                    >
                      <div>
                        {/* Course Image Preview */}
                        <div className="relative aspect-4/3 bg-[#F0E6D8] overflow-hidden">
                          <img
                            src={course.image || '/src/assets/images/nail_chrome_cateye_1792392507727.jpg'}
                            alt={course.title}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/src/assets/images/nail_chrome_cateye_1792392507727.jpg';
                            }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#5D3704] font-['Cinzel'] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#D5C6B1] shadow-xs font-mono">
                            {course.priceLabel || `S/. ${course.price.toFixed(2)}`}
                          </div>

                          <div className="absolute top-2.5 left-2.5 bg-[#FAF7F2]/90 text-[#5D3704] font-['Cinzel'] font-bold text-[10px] px-2.5 py-0.5 rounded border border-[#D5C6B1] backdrop-blur-xs uppercase shadow-2xs flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-[#C89D3C]" />
                            <span>Hotmart</span>
                          </div>

                          {isHidden && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs text-white text-[10px] font-['Cinzel'] font-bold py-1 text-center">
                              Desactivado (Oculto en Tienda & Inicio)
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-3">
                          <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704] leading-snug line-clamp-2">
                            {course.title}
                          </h4>

                          {course.description && (
                            <p className="text-xs font-['Marcellus'] text-[#5D3704]/80 leading-relaxed line-clamp-2">
                              {course.description}
                            </p>
                          )}

                          {/* Temario (Lo que aprenderás) */}
                          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                            <div className="pt-2 border-t border-[#F2ECE4] space-y-1">
                              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#7A6655] block">
                                Lo que aprenderás:
                              </span>
                              <div className="space-y-1">
                                {course.whatYouWillLearn.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5 text-[11px] font-['Marcellus'] text-[#5D3704]">
                                    <span className="text-[#C89D3C] text-[10px] leading-tight">✦</span>
                                    <span className="line-clamp-1">{item}</span>
                                  </div>
                                ))}
                                {course.whatYouWillLearn.length > 3 && (
                                  <span className="text-[10px] text-[#8C6B1C] font-semibold block">
                                    +{course.whatYouWillLearn.length - 3} lecciones más
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Hotmart URL Link display */}
                          {course.hotmartUrl && (
                            <div className="pt-2 border-t border-[#F2ECE4] flex items-center gap-1.5 text-[11px] text-[#8C6B1C]">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <a
                                href={course.hotmartUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate hover:underline font-mono text-[10.5px]"
                                title={course.hotmartUrl}
                              >
                                {course.hotmartUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions: Toggle Active, Carousel, Edit, Delete */}
                      <div className="p-4 pt-0">
                        <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const nextActive = course.active === false ? true : false;
                                updateCourseItem(course.id, { active: nextActive });
                                triggerToast(
                                  nextActive
                                    ? '✓ Curso activado y visible en Inicio.'
                                    : '✓ Curso ocultado de la web.'
                                );
                              }}
                              className="text-xs text-[#7B6756] hover:text-[#2E2017] flex items-center gap-1 cursor-pointer"
                              title={course.active !== false ? 'Clic para ocultar' : 'Clic para mostrar'}
                            >
                              {course.active !== false ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-[11px] font-medium text-emerald-700">Activo</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="text-[11px] font-medium text-amber-700">Oculto</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const newStatus = course.featuredInCarousel === false;
                                updateCourseItem(course.id, { featuredInCarousel: newStatus });
                                triggerToast(
                                  newStatus
                                    ? '✓ Curso destacado en el Carrusel de Inicio.'
                                    : 'Curso quitado del Carrusel.'
                                );
                              }}
                              className={`text-[10px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                course.featuredInCarousel !== false
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                                  : 'bg-gray-100 text-gray-500 border-gray-300 opacity-60'
                              }`}
                              title={
                                course.featuredInCarousel !== false
                                  ? 'Destacado en vitrina (Clic para quitar)'
                                  : 'No destacado (Clic para incluir en carrusel)'
                              }
                            >
                              {course.featuredInCarousel !== false ? '✨ Carrusel ON' : 'Carrusel OFF'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAddCourse(course)}
                              className="py-1.5 px-3 rounded-lg border border-[#DDD1BF] text-[#5D3704] hover:bg-[#F2ECE2] text-xs font-['Cinzel'] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Modificar curso"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#5D3704]" />
                              <span>Modificar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirmation({
                                  type: 'course',
                                  id: course.id,
                                  title: `¿Estás segura de eliminar permanentemente el curso "${course.title}"?`,
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Eliminar curso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB GESTIÓN DE PEDIDOS (AUTÓNOMO)                          */}
        {/* ========================================================= */}
        {activeTab === 'store_orders' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E7DDCE] shadow-2xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]">
                    Gabee Studio · Tienda Online
                  </span>
                </div>
                <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                  Gestión de Pedidos de Tienda Online
                </h3>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                  Verifica los pedidos solicitados por clientas, vouchers de pago y confirma las compras.
                </p>
              </div>
            </div>

            {/* Filter Tabs Bar, Search Input & Manual Order Registration Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E7DDCE] shadow-2xs">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Todas', count: displayStoreOrders.length },
                  { id: 'pending', label: 'Verificación', count: displayStoreOrders.filter((o) => o.status === 'pending').length },
                  { id: 'confirmed', label: 'Confirmados', count: displayStoreOrders.filter((o) => o.status === 'confirmed' || o.status === 'approved').length },
                  { id: 'packing', label: 'Empaquetando', count: displayStoreOrders.filter((o) => o.status === 'packing').length },
                  { id: 'shipped', label: 'Enviados/Listos', count: displayStoreOrders.filter((o) => o.status === 'shipped' || o.status === 'despachado').length },
                  { id: 'delivered', label: 'Entregados', count: displayStoreOrders.filter((o) => o.status === 'delivered' || o.status === 'completed').length },
                  { id: 'cancelled', label: 'Cancelados', count: displayStoreOrders.filter((o) => o.status === 'cancelled').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap transition-all ${
                      orderStatusFilter === tab.id
                        ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                        : 'bg-[#FAF7F2] text-[#7A6655] hover:bg-[#F2ECE2] border border-transparent'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por clienta o código..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-[#DDD1BF] bg-[#FAF7F2] text-[#302117] focus:outline-none focus:ring-1 focus:ring-[#C29D38] w-full sm:w-52"
                />

                <button
                  type="button"
                  onClick={() => setIsManualOrderModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-['Cinzel'] font-bold text-[#5C3A1E] bg-[#FAF4E6] hover:bg-[#FFFDF8] border border-[#C89D3C]/60 hover:border-[#B88A38] transition-all cursor-pointer shadow-[0_2px_10px_rgba(107,67,36,0.10)] hover:shadow-[0_4px_14px_rgba(107,67,36,0.14)] flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Pedido Manual</span>
                </button>
              </div>
            </div>

            {/* STORE ORDERS LIST */}
            {filteredStoreOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E7DDCE] text-xs text-[#7B6756] space-y-3">
                <ShoppingCart className="w-8 h-8 text-[#C4B29E] mx-auto" />
                <p className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  {orderSearchQuery || orderStatusFilter !== 'all'
                    ? 'No se encontraron pedidos con los filtros aplicados.'
                    : 'No hay pedidos registrados en la tienda online todavía.'}
                </p>
                <p className="font-['Marcellus'] text-xs text-[#7A6655]">
                  Cuando una clienta adquiera productos o se registre un pedido manual, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredStoreOrders.map((ord: StoreOrder) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-white border border-[#E7DDCE] shadow-2xs hover:border-[#D5C6B1] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[#8C6B1C] bg-[#FAF5ED] px-2.5 py-0.5 rounded-lg border border-[#E5D7C5]">
                          {ord.code.startsWith('TG') ? ord.code : `TG26_${ord.code}`}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${
                            ord.status === 'confirmed' || ord.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : ord.status === 'packing'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : ord.status === 'shipped' || ord.status === 'despachado'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : ord.status === 'delivered' || ord.status === 'completed'
                              ? 'bg-[#FEF7D6] text-[#8C6B1C] border-[#D4AF37]'
                              : ord.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-[#FEFCE8] text-[#854D0E] border-[#FDE047] font-bold'
                          }`}
                        >
                          {(ord.status === 'confirmed' || ord.status === 'approved') && '✓ Pedido Confirmado'}
                          {ord.status === 'packing' && '📦 Empaquetando'}
                          {(ord.status === 'shipped' || ord.status === 'despachado') && '⊙ Enviado / Listo'}
                          {(ord.status === 'delivered' || ord.status === 'completed') && '✓ Entregado'}
                          {ord.status === 'cancelled' && '✕ Cancelado'}
                          {ord.status === 'pending' && '⏳ Verificación del pedido'}
                        </span>

                        <span className="text-[11px] text-[#887463] font-mono">
                          Reg: {new Date(ord.createdAt).toLocaleString('es-PE')}
                        </span>
                      </div>

                      <h4 className="font-['Cinzel'] font-bold text-base text-[#3D2314] tracking-wide uppercase pt-0.5">
                        {ord.clientName}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6F5B4D]">
                        <span className="flex items-center gap-1 font-medium text-[#3D2314]">
                          <Phone className="w-3.5 h-3.5 text-[#8C6B1C]" />
                          <span>{ord.clientPhone || 'Sin teléfono'}</span>
                        </span>

                        <span>
                          Método de Pago: <strong className="text-[#3D2314]">{ord.paymentMethod.toUpperCase()}</strong>
                        </span>

                        {ord.operationNumber && (
                          <span className="font-mono text-[#3D2314]">
                            N° Op: <strong>{ord.operationNumber}</strong>
                          </span>
                        )}

                        {ord.beeCoinsUsed > 0 && (
                          <span className="text-[#8C6B1C] font-semibold">
                            BeeCoins: <strong>{ord.beeCoinsUsed}</strong>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#6F5B4D] space-y-1 pt-1">
                        <p className="font-semibold text-[#3D2314]">
                          Productos solicitados:
                        </p>
                        <ul className="pl-3 space-y-0.5 font-['Marcellus'] text-[#4A3728]">
                          {ord.items.map((it, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="text-[#8C6B1C] font-bold">•</span>
                              <span>{it.quantity}x {it.productName.toUpperCase()} — S/. {(it.price * it.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>

                        {ord.voucherPhoto && (
                          <div className="pt-2 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Voucher:</span>
                            <button
                              type="button"
                              onClick={() => setLightboxImage(ord.voucherPhoto || null)}
                              className="w-12 h-12 rounded-lg overflow-hidden border-2 border-emerald-600 bg-gray-100 hover:scale-110 transition-transform cursor-pointer shadow-2xs"
                            >
                              <img src={ord.voucherPhoto} alt="Voucher" className="w-full h-full object-cover" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financials & Action Buttons Column Layout matching botonshito_59d5522a.png */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#F2ECE2]">
                      <div className="text-left sm:text-right text-xs space-y-1">
                        <span className="text-[#887463] block font-medium">Total Pagado</span>
                        <span className="font-bold font-['Cinzel'] text-[#8C6B1C] text-base block">
                          S/. {ord.totalSoles.toFixed(2)}
                        </span>
                        {ord.status === 'confirmed' || ord.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            ✓ Confirmado
                          </span>
                        ) : ord.status === 'packing' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                            📦 Empaquetando
                          </span>
                        ) : ord.status === 'shipped' || ord.status === 'despachado' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-300">
                            ⊙ Enviado / Listo
                          </span>
                        ) : ord.status === 'delivered' || ord.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C6B1C] bg-[#FEF7D6] px-2.5 py-0.5 rounded-full border border-[#D4AF37]">
                            ✓ Entregado
                          </span>
                        ) : ord.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300">
                            ✕ Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-[#FEFCE8] px-2.5 py-0.5 rounded-full border border-[#FDE047]">
                            ⏳ En verificación
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Stack 1: 3 Status Action Pills (Confirmar, Entregado, Cancelar) */}
                        <div className="flex flex-col gap-1.5 w-36 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              updateStoreOrderStatus(ord.id, 'confirmed');
                              triggerToast(`✓ Pedido #${ord.code} confirmado.`);
                            }}
                            className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 ${
                              ord.status === 'confirmed' || ord.status === 'approved'
                                ? 'bg-[#EFE4D6] border border-[#C5A059] text-[#5D3704] font-bold shadow-xs'
                                : 'bg-[#FAF4EB] hover:bg-[#F2E5D5] text-[#5D3704] border border-[#D5C6B1] hover:border-[#C5A059]'
                            }`}
                            title="Confirmar pedido"
                          >
                            <Check className="w-3.5 h-3.5 text-[#8C6B1C]" />
                            <span>CONFIRMAR</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateStoreOrderStatus(ord.id, 'packing');
                              triggerToast(`✓ Pedido #${ord.code} en empaquetado.`);
                            }}
                            className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 ${
                              ord.status === 'packing'
                                ? 'bg-amber-50 border border-amber-300 text-amber-900 font-bold shadow-xs'
                                : 'bg-[#FAF4EB] hover:bg-amber-50 text-[#5D3704] border border-[#D5C6B1] hover:border-amber-300'
                            }`}
                            title="Marcar como empaquetando"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-[#8C6B1C]" />
                            <span>EMPAQUETANDO</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateStoreOrderStatus(ord.id, 'shipped');
                              triggerToast(`✓ Pedido #${ord.code} marcado como enviado/listo para recojo.`);
                            }}
                            className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 ${
                              ord.status === 'shipped' || ord.status === 'despachado'
                                ? 'bg-[#EFE4D6] border border-[#C5A059] text-[#5D3704] font-bold shadow-xs'
                                : 'bg-[#FAF4EB] hover:bg-[#F2E5D5] text-[#5D3704] border border-[#D5C6B1] hover:border-[#C5A059]'
                            }`}
                            title="Marcar como enviado o listo para recojo"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#8C6B1C]" />
                            <span>ENVIADO/LISTO</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateStoreOrderStatus(ord.id, 'delivered');
                              triggerToast(`✓ Pedido #${ord.code} marcado como entregado.`);
                            }}
                            className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 ${
                              ord.status === 'delivered' || ord.status === 'completed'
                                ? 'bg-[#EFE4D6] border border-[#C5A059] text-[#5D3704] font-bold shadow-xs'
                                : 'bg-[#FAF4EB] hover:bg-[#F2E5D5] text-[#5D3704] border border-[#D5C6B1] hover:border-[#C5A059]'
                            }`}
                            title="Marcar como entregado"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#8C6B1C]" />
                            <span>ENTREGADO</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateStoreOrderStatus(ord.id, 'cancelled');
                              triggerToast(`✓ Pedido #${ord.code} cancelado.`);
                            }}
                            className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 ${
                              ord.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border border-rose-300 font-bold'
                                : 'bg-[#FAF4EB] hover:bg-rose-50 hover:text-rose-800 text-[#5D3704] border border-[#D5C6B1] hover:border-rose-300'
                            }`}
                            title="Cancelar pedido"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>CANCELAR</span>
                          </button>
                        </div>

                        {/* Stack 2: 3 Icon Action Buttons (WhatsApp Green, Pencil Marfil, Trash Pink) */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <a
                            href={`https://wa.me/51${(ord.clientPhone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                            title="Contactar clienta por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-white" />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingStoreOrderId(ord.id);
                              setEditClientName(ord.clientName);
                              setEditClientPhone(ord.clientPhone);
                              setEditDeliveryType(ord.deliveryType === 'delivery' ? 'delivery' : 'pickup');
                            }}
                            className="p-2 rounded-xl border border-[#D5C6B1] bg-[#FAF4EB] text-[#5C493B] hover:bg-[#F2ECE2] transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                            title="Modificar datos del pedido"
                          >
                            <Edit2 className="w-4 h-4 text-[#8C6B1C]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              deleteStoreOrder(ord.id);
                              triggerToast('✓ Pedido eliminado de la lista.');
                            }}
                            className="p-2 rounded-xl border border-[#FCA5A5] bg-[#FFE8EC] text-[#E11D48] hover:bg-[#FCD3DE] transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="w-4 h-4 text-[#E11D48]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Modal o Fila de Edición de Pedido si está abierto */}
                    {editingStoreOrderId === ord.id && (
                      <div className="mt-3 p-4 bg-[#FAF7F2] rounded-2xl border-2 border-[#D4AF37] space-y-3 animate-fadeIn w-full">
                        <div className="flex items-center justify-between">
                          <h5 className="font-['Cinzel'] font-bold text-xs uppercase text-[#5D3704]">
                            Editar Datos del Pedido #{ord.code}
                          </h5>
                          <button
                            type="button"
                            onClick={() => setEditingStoreOrderId(null)}
                            className="p-1 hover:bg-[#F5EBE1] rounded-full text-[#5D3704]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="font-['Cinzel'] font-bold text-[10px] text-[#5D3704] block mb-1">Nombre de la Clienta:</label>
                            <input
                              type="text"
                              value={editClientName}
                              onChange={(e) => setEditClientName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#D4AF37]/50 text-[#5D3704]"
                            />
                          </div>
                          <div>
                            <label className="font-['Cinzel'] font-bold text-[10px] text-[#5D3704] block mb-1">Teléfono / Celular:</label>
                            <input
                              type="text"
                              value={editClientPhone}
                              onChange={(e) => setEditClientPhone(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#D4AF37]/50 text-[#5D3704]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="font-['Cinzel'] font-bold text-[10px] text-[#5D3704] block mb-1">Modalidad de entrega (afecta el seguimiento):</label>
                            <select
                              value={editDeliveryType}
                              onChange={(e) => setEditDeliveryType(e.target.value as 'delivery' | 'pickup')}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#D4AF37]/50 text-[#5D3704]"
                            >
                              <option value="pickup">Recojo en Studio</option>
                              <option value="delivery">Envío a Domicilio</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStoreOrderId(null)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#D4AF37]/40 text-[#5D3704] font-['Cinzel'] font-bold text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateStoreOrder(ord.id, {
                                clientName: editClientName.trim() || ord.clientName,
                                clientPhone: editClientPhone.trim() || ord.clientPhone,
                                deliveryType: editDeliveryType,
                              });
                              setEditingStoreOrderId(null);
                              triggerToast('✓ Datos del pedido actualizados con éxito.');
                            }}
                            className="px-4 py-1.5 rounded-xl bg-[#F5EBE1] hover:bg-[#ebdccf] border border-[#D4AF37] text-[#5D3704] font-['Cinzel'] font-bold text-xs"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: Promos Catalog Management (Grabar, Modificar, Eliminar) */}
        {/* ========================================================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-display font-bold text-[#302117]">
                  Diseños de la Sección Promociones
                </h3>
                <p className="text-xs text-[#7A6655]">
                  Agrega nuevos ítems a promociones (Sistemas o Press On), ajusta tarifas, fotos y descripciones.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddPromoPressOn()}
                  className="py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C89D3C]" />
                  <span>+ AGREGAR NUEVO DISEÑO PRESS ON</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddPromoSistema()}
                  className="py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C89D3C]" />
                  <span>+ AGREGAR NUEVO SISTEMA</span>
                </button>
              </div>
            </div>

            {promoDesigns.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E7DDCE] p-8 shadow-xs">
                <Sparkles className="w-8 h-8 text-[#C5A059] mx-auto mb-3 opacity-70" />
                <p className="text-sm font-bold text-[#302117]">El Catálogo de Promociones está absolutamente limpio y vacío.</p>
                <p className="text-xs text-[#7A6655] mt-1 max-w-md mx-auto leading-relaxed">
                  Utiliza los botones superiores "+ AGREGAR NUEVO DISEÑO PRESS ON" o "+ AGREGAR NUEVO SISTEMA" para ingresar únicamente tus nuevos registros promocionales.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {promoDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="rounded-2xl bg-white border border-[#E7DDCE] overflow-hidden shadow-2xs flex flex-col justify-between hover:border-[#D0BFAC] transition-all"
                  >
                    <div className="relative h-48 bg-[#F2ECE2] overflow-hidden">
                      <img
                        src={design.image}
                        alt={design.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 text-[#8C6B1C] font-mono font-bold text-xs px-2.5 py-1 rounded-md shadow-xs">
                        S/. {design.price}
                      </div>

                      <div className="absolute top-2 left-2 flex gap-1">
                        <div className="bg-[#2D1F16]/80 text-[#FAF7F2] text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs">
                          {design.collection}
                        </div>
                        <div className="bg-[#C5A059]/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs uppercase">
                          {design.category === 'press_on' ? 'PRESS ON PROMO' : 'SISTEMA PROMO'}
                        </div>
                      </div>

                      {!design.active && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                          Inactivo (Oculto en Catálogo)
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-[#8C7664] font-medium mb-1">
                          <span>{design.category === 'press_on' ? 'Set Reutilizable' : (design.recommendedSystem || 'Sistema Profesional')}</span>
                          <span>{design.category === 'press_on' ? 'Kit Elemental Gratis' : 'Promo'}</span>
                        </div>

                        <h4 className="font-bold text-sm text-[#302117]">
                          {design.title}
                        </h4>

                        <p className="text-[11px] text-[#715E4E] line-clamp-2 mt-1.5 leading-relaxed">
                          {design.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {design.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] bg-[#FAF4EB] text-[#785E47] border border-[#EADFCB] px-1.5 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Actions: Activar/Ocultar, Carrusel On/Off, Modificar, Eliminar */}
                      <div className="pt-3 mt-3 border-t border-[#F2ECE2] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updatePromoDesign(design.id, { active: !design.active });
                              triggerToast(
                                design.active ? 'Diseño ocultado en el catálogo.' : 'Diseño activado en el catálogo.'
                              );
                            }}
                            className="text-xs text-[#7B6756] hover:text-[#2E2017] flex items-center gap-1 cursor-pointer"
                            title={design.active ? 'Ocultar en catálogo' : 'Mostrar en catálogo'}
                          >
                            {design.active ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] font-medium">Activo</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-[11px] font-medium">Oculto</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = !design.featured;
                              updatePromoDesign(design.id, { featured: newStatus });
                              triggerToast(
                                newStatus
                                  ? '✓ Diseño promocional destacado en el Carrusel de Inicio.'
                                  : 'Diseño promocional quitado del Carrusel.'
                              );
                            }}
                            className={`text-[10px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                              design.featured
                                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                                : 'bg-gray-100 text-gray-500 border-gray-300 opacity-60'
                            }`}
                            title={
                              design.featured
                                ? 'Destacado en carrusel (Clic para quitar)'
                                : 'No destacado (Clic para incluir en carrusel)'
                            }
                          >
                            {design.featured ? '✨ Carrusel ON' : 'Carrusel OFF'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              design.category === 'press_on'
                                ? handleOpenAddPromoPressOn(design)
                                : handleOpenAddPromoSistema(design)
                            }
                            className="p-1.5 rounded-lg border border-[#DDD1BF] text-[#5C493B] hover:bg-[#F2ECE2] cursor-pointer"
                            title="Modificar item promocional"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#8C6B1C]" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmation({
                                type: 'promo',
                                id: design.id,
                                title: `¿Eliminar el item "${design.title}" del catálogo de promociones?`,
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer"
                            title="Eliminar item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}</div>
        )}

        {/* ========================================================= */}
        {/* TAB PRESS ON: Catálogo Press On Nails (Autogestión Admin) */}
        {/* ========================================================= */}
        {activeTab === 'presson' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]">
                    Gabee Studio · Sets Reutilizables
                  </span>
                </div>
                <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                  Gestión del Catálogo Press On Nails
                </h3>
                <p className="text-xs font-['Marcellus'] text-[#7A6655]">
                  Autogestiona las fotos, precios, tipo de punta sugerida y descripciones de tus sets artesanales a medida.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirmation({
                      type: 'reset_presson',
                      title: '¿Deseas restaurar los 3 sets originales del catálogo Press On? (Velvet Cat-Eye, 3D Gel Sculpted y Glazed Donut)',
                    })
                  }
                  className="py-2.5 px-3.5 rounded-xl border border-[#D5C6B1] bg-white hover:bg-[#F2ECE2] text-[#695444] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restaurar los 3 sets iniciales"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Originales (3 Sets)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddPressOn()}
                  className="py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C89D3C]" />
                  <span>Agregar Nuevo Set Press On (Grabar)</span>
                </button>
              </div>
            </div>

            {pressOnCatalog.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E7DDCE] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#DDD1BF] flex items-center justify-center mx-auto text-[#5D3704]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  No hay sets en el catálogo Press On
                </h4>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] max-w-sm mx-auto">
                  Haz clic en &quot;Agregar Nuevo Set Press On&quot; o restaura los 3 sets originales para comenzar.
                </p>
                <button
                  type="button"
                  onClick={() => resetPressOnCatalog()}
                  className="py-2 px-4 bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] rounded-xl text-xs font-['Cinzel'] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Restaurar 3 Sets Originales
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pressOnCatalog.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-3xl bg-white border border-[#E7DDCE] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Preview with Badges */}
                      <div className="relative aspect-4/3 bg-[#F0E6D8] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#5D3704] font-['Cinzel'] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#D5C6B1] shadow-xs">
                          S/. {item.price.toFixed(2)}
                        </div>
                        <div className="absolute top-2.5 left-2.5 bg-[#5D3704]/90 text-white font-['Cinzel'] font-bold text-[10px] px-2.5 py-0.5 rounded backdrop-blur-xs uppercase">
                          Set #{idx + 1} · {item.defaultTip}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2.5">
                        <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704] leading-snug">
                          {item.name}
                        </h4>

                        <div className="space-y-1">
                          <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#7A6655] block">
                            Descripción Corta (Tarjeta):
                          </span>
                          <p className="text-xs font-['Marcellus'] text-[#5D3704]/80 leading-relaxed">
                            {item.shortDesc}
                          </p>
                        </div>

                        {item.fullDesc && (
                          <div className="space-y-1 pt-1 border-t border-[#F5EBE1]">
                            <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#7A6655] block">
                              Descripción Detallada:
                            </span>
                            <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/70 line-clamp-2 leading-relaxed">
                              {item.fullDesc}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0">
                      <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704]">
                            Punta: <span className="capitalize">{item.defaultTip}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = item.featuredInCarousel === false;
                              updatePressOnItem(item.id, { featuredInCarousel: newStatus });
                              triggerToast(newStatus ? '✓ Set destacado en el Carrusel de Inicio.' : 'Set quitado del Carrusel.');
                            }}
                            className={`text-[10px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                              item.featuredInCarousel !== false
                                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                                : 'bg-gray-100 text-gray-500 border-gray-300 opacity-60'
                            }`}
                            title={item.featuredInCarousel !== false ? 'Destacado en vitrina (Clic para quitar)' : 'No destacado (Clic para incluir en carrusel)'}
                          >
                            {item.featuredInCarousel !== false ? '✨ Carrusel ON' : 'Carrusel OFF'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAddPressOn(item)}
                            className="py-1.5 px-3 rounded-lg border border-[#DDD1BF] text-[#5D3704] hover:bg-[#F2ECE2] text-xs font-['Cinzel'] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Modificar set e imagen"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#5D3704]" />
                            <span>Modificar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmation({
                                type: 'presson',
                                id: item.id,
                                title: `¿Estás segura de eliminar el set "${item.name}" del catálogo Press On?`,
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Eliminar set"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2.5: Services Catalog Management (Nuestros Servicios) */}
        {/* ========================================================= */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]">
                    Gabee Studio · Servicios de Aplicación
                  </span>
                </div>
                <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                  Catálogo de Nuestros Servicios
                </h3>
                <p className="text-xs font-['Marcellus'] text-[#7A6655]">
                  Autogestiona las fotos, títulos, etiquetas superiores, precios base y descripciones explicativas de tus sistemas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirmation({
                      type: 'reset_services',
                      title: '¿Deseas restaurar el catálogo original de 6 servicios principales?',
                    })
                  }
                  className="py-2.5 px-3.5 rounded-xl border border-[#D5C6B1] bg-white hover:bg-[#F2ECE2] text-[#695444] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restaurar los 6 servicios originales"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Servicios Originales</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddService()}
                  className="py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C89D3C]" />
                  <span>Agregar Nuevo Servicio (Grabar)</span>
                </button>
              </div>
            </div>

            {servicesCatalog.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E7DDCE] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#DDD1BF] flex items-center justify-center mx-auto text-[#5D3704]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  No hay servicios registrados en el catálogo
                </h4>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] max-w-sm mx-auto">
                  Haz clic en &quot;Agregar Nuevo Servicio&quot; o restaura los servicios originales.
                </p>
                <button
                  type="button"
                  onClick={() => resetServicesCatalog()}
                  className="py-2 px-4 bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] rounded-xl text-xs font-['Cinzel'] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Restaurar Servicios Originales
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicesCatalog.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-3xl bg-white border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                      item.active === false ? 'opacity-60 border-dashed border-[#D5C6B1]' : 'border-[#E7DDCE]'
                    }`}
                  >
                    <div>
                      {/* Image Preview with Badges */}
                      <div className="relative aspect-4/3 bg-[#F0E6D8] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#5D3704] font-['Cinzel'] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#D5C6B1] shadow-xs">
                          {item.priceLabel}
                        </div>
                        <div className="absolute top-2.5 left-2.5 bg-[#FAF7F2]/85 text-[#5D3704] font-['Cinzel'] font-bold text-[10px] px-2.5 py-0.5 rounded border border-[#D5C6B1] backdrop-blur-xs uppercase shadow-2xs">
                          {item.tag}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2.5">
                        <h4 className="font-['Cinzel'] font-bold text-base text-[#5D3704] leading-snug">
                          {item.title}
                        </h4>

                        <div className="space-y-1">
                          <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#7A6655] block">
                            Descripción (Modal de Reserva):
                          </span>
                          <p className="text-xs font-['Marcellus'] text-[#5D3704]/80 leading-relaxed line-clamp-3">
                            {item.description}
                          </p>
                        </div>

                        {/* Tarifas de los 3 niveles del servicio */}
                        <div className="pt-2 border-t border-[#F2ECE4] space-y-1">
                          <span className="text-[9.5px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#7A6655] block">
                            Tarifas por Nivel (Configuradas):
                          </span>
                          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                            <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#DDD1BF] text-[#5D3704]">
                              {item.levelBasicTitle || 'Sutil'}: <strong>S/. {item.levelBasicPrice ?? 60}</strong>
                            </span>
                            <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#DDD1BF] text-[#5D3704]">
                              {item.levelModerateTitle || 'Moderado'}: <strong>S/. {item.levelModeratePrice ?? 80}</strong>
                            </span>
                            <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#DDD1BF] text-[#5D3704]">
                              {item.levelComplexTitle || 'Complejo'}: <strong>S/. {item.levelComplexPrice ?? 100}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0">
                      <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateServiceItem(item.id, { active: item.active === false ? true : false });
                              triggerToast(
                                item.active === false ? 'Servicio activado en la página.' : 'Servicio ocultado de la página.'
                              );
                            }}
                            className="text-xs text-[#7B6756] hover:text-[#2E2017] flex items-center gap-1 cursor-pointer"
                          >
                            {item.active !== false ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] font-medium text-emerald-700">Activo</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-[11px] font-medium text-amber-700">Oculto</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = item.featuredInCarousel === false;
                              updateServiceItem(item.id, { featuredInCarousel: newStatus });
                              triggerToast(newStatus ? '✓ Servicio destacado en el Carrusel de Inicio.' : 'Servicio quitado del Carrusel.');
                            }}
                            className={`text-[10px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                              item.featuredInCarousel !== false
                                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                                : 'bg-gray-100 text-gray-500 border-gray-300 opacity-60'
                            }`}
                            title={item.featuredInCarousel !== false ? 'Destacado en vitrina (Clic para quitar)' : 'No destacado (Clic para incluir en carrusel)'}
                          >
                            {item.featuredInCarousel !== false ? '✨ Carrusel ON' : 'Carrusel OFF'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAddService(item)}
                            className="py-1.5 px-3 rounded-lg border border-[#DDD1BF] text-[#5D3704] hover:bg-[#F2ECE2] text-xs font-['Cinzel'] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Modificar servicio"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#5D3704]" />
                            <span>Modificar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmation({
                                type: 'service',
                                id: item.id,
                                title: `¿Estás segura de eliminar el servicio "${item.title}" del catálogo?`,
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Eliminar servicio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ========================================================= */}
        {/* TAB 3: Additional Services Management (Autoconfigurable Admin) */}
        {/* ========================================================= */}
        {activeTab === 'additionals' && (

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-display font-bold text-[#302117]">
                  Gestor de Servicios Adicionales & Complementos
                </h3>
                <p className="text-xs text-[#7A6655]">
                  Añade nuevos servicios, oculta o activa existentes, modifica descripciones y actualiza precios al instante.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirmation({
                      type: 'reset_additionals',
                      title: '¿Restablecer la lista de servicios adicionales a los valores por defecto?',
                    })
                  }
                  className="py-2.5 px-3.5 rounded-xl border border-[#D5C6B1] bg-white hover:bg-[#F2ECE2] text-[#695444] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Adicionales</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddAdditional()}
                  className="py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C89D3C]" />
                  <span>Agregar Servicio Adicional</span>
                </button>
              </div>
            </div>

            {/* Additionals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {additionalsList.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl bg-white border shadow-2xs flex flex-col justify-between transition-all ${
                    item.active === false ? 'opacity-60 border-dashed border-[#D5C6B1]' : 'border-[#E7DDCE] hover:border-[#D0BFAC]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F5EBE1] text-[#5D3704] px-2 py-0.5 rounded">
                        {item.categoryLabel || item.category}
                      </span>
                      <span className="font-mono font-bold text-sm text-[#5D3704]">
                        S/. {item.price}.00
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[#302117] mt-1">
                      {item.name}
                    </h4>

                    <p className="text-xs text-[#715E4E] mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.unitLabel && (
                      <span className="text-[10px] text-[#8C7664] block mt-1.5">
                        Unidad: {item.unitLabel}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#F2ECE2] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        updateAdditionalItem(item.id, { active: item.active === false ? true : false });
                        triggerToast(
                          item.active === false ? 'Servicio adicional activado.' : 'Servicio adicional ocultado.'
                        );
                      }}
                      className="text-xs text-[#7B6756] hover:text-[#2E2017] flex items-center gap-1 cursor-pointer"
                      title={item.active === false ? 'Mostrar adicional' : 'Ocultar adicional'}
                    >
                      {item.active !== false ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px] font-medium text-emerald-700">Activo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] font-medium text-amber-700">Oculto</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAddAdditional(item)}
                        className="p-1.5 rounded-lg border border-[#DDD1BF] text-[#5C493B] hover:bg-[#F2ECE2] cursor-pointer"
                        title="Modificar servicio"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#8C6B1C]" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmation({
                            type: 'additional',
                            id: item.id,
                            title: `¿Eliminar permanentemente el servicio adicional "${item.name}"?`,
                          })
                        }
                        className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer"
                        title="Eliminar servicio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: Studio Settings (Grabar, Modificar, Restablecer) */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <React.Suspense fallback={<p role="status" className="text-xs text-[#7A6655]">Cargando gestión de imágenes…</p>}>
              <SiteImagesSettings onSessionExpired={onSessionExpired} previewOnly={imagePreviewOnly} />
            </React.Suspense>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#E7DDCE] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE7DC] pb-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-[#302117]">
                    Ajustes Generales del Estudio & Control de Stock
                  </h3>
                  <p className="text-xs text-[#7A6655]">
                    Modifica la dirección del local, los datos de pago, la contraseña del panel y la disponibilidad de stock de tallas Press On.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingSettings}
                    onClick={() =>
                      setDeleteConfirmation({
                        type: 'reset_settings',
                        title: '¿Restablecer todas las configuraciones a los valores iniciales?',
                      })
                    }
                    className="py-2.5 px-3.5 rounded-xl border border-[#D5C6B1] bg-white hover:bg-[#F2ECE2] text-[#695444] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Valores Iniciales</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="py-2.5 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                    <span>{isSavingSettings ? 'Guardando…' : 'Guardar Cambios (Grabar)'}</span>
                  </button>
                </div>
              </div>

              {/* 1. Dirección del Estudio y seguridad de acceso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-2">
                  <label className="block text-xs font-bold text-[#5D3704] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C89D3C]" />
                    <span>Dirección del Estudio *</span>
                  </label>
                  <p className="text-[11px] text-[#7A6655]">
                    Dirección que se muestra a las clientas que eligen recojo o cita presencial.
                  </p>
                  <input
                    type="text"
                    required
                    value={settingsForm.studioAddress}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, studioAddress: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-medium text-[#2E2017]"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-2">
                  <label
                    htmlFor="admin-password-setting"
                    className="block text-xs font-bold text-[#5D3704] flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C89D3C]" />
                    <span>Contraseña del Panel /admin</span>
                  </label>
                  <p className="text-[11px] text-[#7A6655] leading-relaxed">
                    {imagePreviewOnly
                      ? 'El cambio de contraseña está disponible cuando se configura el acceso privado al panel.'
                      : `Déjala en blanco para conservar la actual. Para cambiarla, ingresa una nueva de al menos ${ADMIN_PASSWORD_MIN_LENGTH} caracteres y guarda los cambios.`}
                  </p>
                  <div className="relative">
                    <input
                      id="admin-password-setting"
                      type={showAdminPassword ? 'text' : 'password'}
                      minLength={ADMIN_PASSWORD_MIN_LENGTH}
                      maxLength={ADMIN_PASSWORD_MAX_LENGTH}
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      disabled={isSavingSettings || imagePreviewOnly}
                      autoComplete="new-password"
                      className="w-full p-2.5 pr-10 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#8C6B1C] hover:bg-[#D4AF37]/10 cursor-pointer"
                      aria-label={showAdminPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-2">
                  <label className="block text-xs font-bold text-[#5D3704] flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#C89D3C]" />
                    <span>WhatsApp del Estudio (Recepción de Pedidos) *</span>
                  </label>
                  <p className="text-[11px] text-[#7A6655]">
                    Número oficial al que llegarán todos los agendamientos y pedidos Press On.
                  </p>
                  <input
                    type="text"
                    required
                    value={settingsForm.whatsappNumber || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                    }
                    placeholder="934403311"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>
              </div>

              {/* 2. Datos Bancarios (Yape, Plin, BCP) */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-4">
                <h4 className="text-sm font-bold text-[#5D3704] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C89D3C]" />
                  <span>Datos Bancarios para Recepción de Pagos (Yape, Plin & BCP)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Yape */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                    <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded inline-block">Yape & Plin (Unificado)</span>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5D3704] mb-0.5">Número Celular Yape / Plin</label>
                      <input
                        type="text"
                        value={settingsForm.yapeNumber}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, yapeNumber: e.target.value, plinNumber: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5D3704] mb-0.5">Titular de Yape / Plin</label>
                      <input
                        type="text"
                        value={settingsForm.yapeName}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, yapeName: e.target.value, plinName: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg"
                      />
                    </div>
                    <div className="pt-2 border-t border-[#DFD1BD] space-y-2">
                      <label className="block text-[11px] font-bold text-[#5D3704] mb-0.5">Imagen del QR Oficial Yape / Plin</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={settingsForm.yapeQrImage || ''}
                          onChange={(e) => setSettingsForm((p) => ({ ...p, yapeQrImage: e.target.value, plinQrImage: e.target.value }))}
                          placeholder="Link o URL del QR de Yape/Plin"
                          className="flex-1 p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono text-[11px]"
                        />
                        <label className="py-1.5 px-3 rounded-lg bg-[#FAF7F2] border border-[#C5A059] text-[#5D3704] text-[11px] font-bold font-['Cinzel'] hover:bg-[#F2E5D5] transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-[#C89D3C]" />
                          <span>Subir QR</span>
                          <input
                            type="file"
                            accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const result = await compressImage(file, 900, 0.9);
                                  if (result) {
                                    setSettingsForm((p) => ({ ...p, yapeQrImage: result, plinQrImage: result }));
                                    triggerToast('✔ Imagen QR cargada. Recuerda guardar cambios (Grabar).');
                                  }
                                } catch {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const res = event.target?.result as string;
                                    if (res) {
                                      setSettingsForm((p) => ({ ...p, yapeQrImage: res, plinQrImage: res }));
                                      triggerToast('✔ Imagen QR cargada. Recuerda guardar cambios (Grabar).');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      {/* Vista previa miniatura con filtro cálido y botón para quitar */}
                      {settingsForm.yapeQrImage && (
                        <div className="flex items-center gap-2.5 pt-1.5">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-[#D4AF37] p-1 bg-[#FAF4EB] shrink-0 shadow-2xs">
                            <img
                              src={settingsForm.yapeQrImage}
                              alt="Vista previa QR Oficial"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div className="text-[10.5px] text-[#7A6655] space-y-1">
                            <span className="font-bold text-[#5D3704] block">✓ QR Oficial cargado</span>
                            <button
                              type="button"
                              onClick={() => setSettingsForm((p) => ({ ...p, yapeQrImage: '', plinQrImage: '' }))}
                              className="text-rose-700 hover:underline font-semibold cursor-pointer text-[10px]"
                            >
                              Remover esta imagen
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-[#7A6655] italic leading-tight">
                        * Puedes subir un archivo (PNG/JPG) o pegar un link. Esta imagen reemplazará automáticamente el QR en todas las pantallas de pago del sitio.
                      </p>
                    </div>
                  </div>

                  {/* Plin */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                    <span className="text-xs font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded inline-block">Plin (Mismo número Yape)</span>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5D3704] mb-0.5">Número Celular Plin</label>
                      <input
                        type="text"
                        value={settingsForm.plinNumber || settingsForm.yapeNumber}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, plinNumber: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5D3704] mb-0.5">Titular de Plin</label>
                      <input
                        type="text"
                        value={settingsForm.plinName || settingsForm.yapeName}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, plinName: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* BCP */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                    <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded inline-block">BCP Transferencia</span>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5D3704] mb-0.5">N° Cuenta BCP</label>
                      <input
                        type="text"
                        value={settingsForm.bcpAccount}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, bcpAccount: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5D3704] mb-0.5">CCI BCP</label>
                      <input
                        type="text"
                        value={settingsForm.bcpCci}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, bcpCci: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5D3704] mb-0.5">Titular BCP</label>
                      <input
                        type="text"
                        value={settingsForm.bcpName}
                        onChange={(e) => setSettingsForm((p) => ({ ...p, bcpName: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2b. Más de mí (Biografía y Fotografía) */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-4">
                <h4 className="text-sm font-bold text-[#5D3704] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#C89D3C]" />
                  <span>Más de mí (Biografía y Fotografía)</span>
                </h4>
                <p className="text-xs text-[#7A6655]">
                  Gestiona la presentación que se muestra en la ventana modal &quot;Más de mí&quot; del sitio para generar confianza con tus clientas.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">Texto de Biografía / Historia *</label>
                    <textarea
                      rows={6}
                      value={settingsForm.aboutBio || ''}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, aboutBio: e.target.value }))}
                      placeholder="Escribe aquí tu presentación, historia y lo que quieres transmitir a tus clientas..."
                      className="w-full p-3 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#2E2017] font-['Marcellus'] leading-relaxed"
                    />
                    <p className="text-[10px] text-[#7A6655] italic">Puedes usar saltos de línea para separar párrafos.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#5D3704]">Fotografía Personal (URL o archivo)</label>
                    <input
                      type="text"
                      value={settingsForm.aboutPhoto || ''}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, aboutPhoto: e.target.value }))}
                      placeholder="Link o URL de tu foto"
                      className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#2E2017]"
                    />
                    <label className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] text-[11px] font-bold font-['Cinzel'] hover:bg-[#F2E5D5] transition-colors cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>Subir foto</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const result = await compressImage(file, 900, 0.85);
                              if (result) setSettingsForm((prev) => ({ ...prev, aboutPhoto: result }));
                            } catch {
                              // no bloquear: intentar lectura directa como respaldo
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const res = event.target?.result as string;
                                if (res) setSettingsForm((prev) => ({ ...prev, aboutPhoto: res }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {settingsForm.aboutPhoto ? (
                      <div className="pt-1 space-y-1.5">
                        <img src={settingsForm.aboutPhoto} alt="Foto Más de mí" className="w-full h-28 object-cover rounded-xl border border-[#D4AF37]/50 bg-[#FAF7F2]" />
                        <button type="button" onClick={() => setSettingsForm((p) => ({ ...p, aboutPhoto: '' }))} className="text-[10px] text-rose-700 hover:underline font-semibold cursor-pointer">Remover foto</button>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl border border-dashed border-[#D4AF37]/50 bg-white/70 flex items-center justify-center text-[11px] text-[#7A6655] font-['Marcellus'] text-center px-3">
                        Sin foto seleccionada
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Plantillas de Mensajes de WhatsApp */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-4">
                <h4 className="text-sm font-bold text-[#5D3704] flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#C89D3C]" />
                  <span>Plantillas de Mensajes de WhatsApp</span>
                </h4>
                <p className="text-xs text-[#7A6655]">
                  Edita libremente el texto, emojis y estructura de cada plantilla. Usa las etiquetas dinámicas para que el sistema inyecte los datos automáticamente.
                </p>
                <div className="p-3 rounded-xl bg-white/80 border border-[#D4AF37]/40 text-[10.5px] text-[#5D3704] font-['Marcellus'] leading-relaxed">
                  <strong className="font-['Cinzel'] text-[#8C6B1C]">Etiquetas disponibles:</strong>{' '}
                  {['{codigo}','{cliente}','{whatsapp}','{servicio}','{nivel}','{forma}','{largo}','{detalles}','{talla}','{kit}','{medidas_der}','{medidas_izq}','{anatomia}','{fecha}','{hora}','{modalidad}','{direccion}','{referencia}','{cumpleanos}','{instagram}','{adicionales}','{total}','{adelanto}','{saldo}','{metodo_pago}','{operacion}'].join('  ')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">Nuestros Servicios (General)</label>
                    <textarea rows={12} value={settingsForm.waTemplateNuestrosServicios || ''} onChange={(e) => setSettingsForm((p) => ({ ...p, waTemplateNuestrosServicios: e.target.value }))} className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-[10px] font-mono text-[#2E2017] leading-snug" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">Retiro de Sistema</label>
                    <textarea rows={12} value={settingsForm.waTemplateRetiro || ''} onChange={(e) => setSettingsForm((p) => ({ ...p, waTemplateRetiro: e.target.value }))} className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-[10px] font-mono text-[#2E2017] leading-snug" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">Esmaltado en Gel</label>
                    <textarea rows={12} value={settingsForm.waTemplateEsmaltado || ''} onChange={(e) => setSettingsForm((p) => ({ ...p, waTemplateEsmaltado: e.target.value }))} className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-[10px] font-mono text-[#2E2017] leading-snug" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">Catálogo Press On</label>
                    <textarea rows={12} value={settingsForm.waTemplateCatalogoPressOn || ''} onChange={(e) => setSettingsForm((p) => ({ ...p, waTemplateCatalogoPressOn: e.target.value }))} className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-[10px] font-mono text-[#2E2017] leading-snug" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">Pedido Personalizado</label>
                    <textarea rows={12} value={settingsForm.waTemplatePedidoPersonalizado || ''} onChange={(e) => setSettingsForm((p) => ({ ...p, waTemplatePedidoPersonalizado: e.target.value }))} className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-[10px] font-mono text-[#2E2017] leading-snug" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">Promociones: Sistemas</label>
                    <textarea rows={12} value={settingsForm.waTemplatePromoSistemas || ''} onChange={(e) => setSettingsForm((p) => ({ ...p, waTemplatePromoSistemas: e.target.value }))} className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-[10px] font-mono text-[#2E2017] leading-snug" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">Promociones: Press On</label>
                    <textarea rows={12} value={settingsForm.waTemplatePromoPressOn || ''} onChange={(e) => setSettingsForm((p) => ({ ...p, waTemplatePromoPressOn: e.target.value }))} className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-[10px] font-mono text-[#2E2017] leading-snug" />
                  </div>
                </div>
              </div>

              {/* 3. Descripciones Explicativas de Sistemas en Promoción */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-4">
                <h4 className="text-sm font-bold text-[#5D3704] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C89D3C]" />
                  <span>Descripciones de Sistemas en Promoción (Modal de Reserva)</span>
                </h4>
                <p className="text-xs text-[#7A6655]">
                  Personaliza las descripciones que ven las clientas al seleccionar Polygel, Soft Gel o Builder Gel en el agendamiento de promociones.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">
                      Descripción de Polygel
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.systemDescPolygel || ''}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, systemDescPolygel: e.target.value }))
                      }
                      placeholder="Esculpido o nivelación con hibridación de gel de alta densidad..."
                      className="w-full p-2 rounded-lg border border-[#DDD1BF] bg-[#FAF7F2]/50 text-xs text-[#2E2017]"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">
                      Descripción de Soft Gel
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.systemDescSoftgel || ''}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, systemDescSoftgel: e.target.value }))
                      }
                      placeholder="Tips 100% de gel flexible prensado y adheridos con base coat..."
                      className="w-full p-2 rounded-lg border border-[#DDD1BF] bg-[#FAF7F2]/50 text-xs text-[#2E2017]"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-1.5">
                    <label className="block text-xs font-bold text-[#5D3704]">
                      Descripción de Builder Gel
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.systemDescBuilderGel || ''}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, systemDescBuilderGel: e.target.value }))
                      }
                      placeholder="Nivelación y refuerzo sobre uña natural o extensión..."
                      className="w-full p-2 rounded-lg border border-[#DDD1BF] bg-[#FAF7F2]/50 text-xs text-[#2E2017]"
                    />
                  </div>
                </div>
              </div>

            </div>
          </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: Google Spreadsheet (Hojas de Cálculo) */}
        {/* ========================================================= */}
        {activeTab === 'sheets' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#E7DDCE] shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFE7DC]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-brand uppercase tracking-widest text-[#947D68] block">
                      Google Workspace · Sheets API
                    </span>
                    <h3 className="text-xl font-display font-bold text-[#302117]">
                      Google Spreadsheet Oficial
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {spreadsheetUrl ? (
                    <>
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>Abrir en Google Sheets</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          await syncAllToGoogleSheets();
                          triggerToast('¡Datos sincronizados exitosamente con Google Sheets!');
                        }}
                        disabled={isSyncingSheets}
                        className="py-2 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#C89D3C] ${isSyncingSheets ? 'animate-spin' : ''}`} />
                        <span>{isSyncingSheets ? 'Sincronizando...' : 'Sincronizar Todo'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await connectGoogleSheets();
                        triggerToast('¡Hoja de cálculo creada y conectada exitosamente!');
                      }}
                      disabled={isSyncingSheets}
                      className="py-2.5 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isSyncingSheets ? 'Creando Hoja de Cálculo...' : 'Crear y Conectar Google Spreadsheet'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Connection Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE0D0]">
                  <span className="text-[10px] text-[#86715F] block uppercase font-bold tracking-wider">
                    Estado de Conexión
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${spreadsheetId ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <span className="font-semibold text-[#302117]">
                      {spreadsheetId ? 'Conectado a Google Sheets' : 'Pendiente de Conexión'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE0D0]">
                  <span className="text-[10px] text-[#86715F] block uppercase font-bold tracking-wider">
                    Nombre del Archivo
                  </span>
                  <span className="font-semibold text-[#302117] block mt-1 truncate">
                    Gabee Nail Art - Gestión & Catálogo 2026
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE0D0]">
                  <span className="text-[10px] text-[#86715F] block uppercase font-bold tracking-wider">
                    Auto-Sincronización
                  </span>
                  <span className="font-semibold text-emerald-700 block mt-1">
                    {spreadsheetId ? 'Activa (Registra citas y fotos al instante)' : 'Inactiva'}
                  </span>
                </div>
              </div>
            </div>

            {/* Overview of 3 Worksheets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-white border border-[#E7DDCE] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Pestaña 1
                  </span>
                  <span className="text-[11px] font-semibold text-[#8C6B1C] font-mono">
                    {appointments.length} citas
                  </span>
                </div>
                <h4 className="font-display font-bold text-base text-[#302117]">
                  Citas_Agenda
                </h4>
                <p className="text-xs text-[#715D4E] leading-relaxed">
                  Almacena el código de reserva, nombre de la clienta, teléfono de WhatsApp, Instagram, servicio, fecha, hora, modalidad (estudio o domicilio), estado, costo total y adelanto del 50%.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E7DDCE] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Pestaña 2
                  </span>
                  <span className="text-[11px] font-semibold text-[#8C6B1C] font-mono">
                    18 parámetros
                  </span>
                </div>
                <h4 className="font-display font-bold text-base text-[#302117]">
                  Configuracion_Admin
                </h4>
                <p className="text-xs text-[#715D4E] leading-relaxed">
                  Guarda todos los ajustes del negocio: precio base de promoción (S/. {settings.defaultPromoPrice}), monto de adelanto (S/. {settings.defaultDepositAmount}), recargos de stiletto, números y titulares de Yape y Plin, y WhatsApp.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E7DDCE] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Pestaña 3
                  </span>
                  <span className="text-[11px] font-semibold text-[#8C6B1C] font-mono">
                    {promoDesigns.length} fotos
                  </span>
                </div>
                <h4 className="font-display font-bold text-base text-[#302117]">
                  Catalogo_Fotos
                </h4>
                <p className="text-xs text-[#715D4E] leading-relaxed">
                  Guarda todas las fotos e imágenes del catálogo oficial con sus URLs directas, colecciones, descripción estética, técnica de manicura paso a paso y precio promocional de S/. 60.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: CUENTAS REGISTRADAS & BEECOINS WALLET & RULETA DE CUMPLEAÑOS LOGS */}
        {/* ========================================================= */}
        {activeTab === 'user_accounts' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Registered Users Table */}
            {/* Cuentas Registradas & Saldos BeeCoins */}
            <div className="p-6 rounded-3xl bg-white border border-[#E7DDCE] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE7DC]">
                <div>
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                    Base de Datos de Clientes
                  </span>
                  <h3 className="text-xl font-['Cinzel'] font-bold text-[#302117] flex items-center gap-2">
                    <User className="w-5 h-5 text-[#C89D3C]" />
                    <span>Cuentas Registradas & Saldos BeeCoins</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="🔎 Buscar clienta por nombre o celular..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-[#DDD1BF] bg-[#FAF7F2] text-[#302117] focus:outline-none focus:ring-1 focus:ring-[#C29D38] w-full sm:w-64"
                  />
                  <span className="text-xs font-mono font-bold bg-[#FAF7F2] px-3 py-1 rounded-xl border border-[#E7DDCE] text-[#5D3704] shrink-0">
                    Total: {filteredUsersList.length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-[#5D3704] font-['Cinzel'] font-bold border-b border-[#E7DDCE]">
                      <th className="p-3">Clienta</th>
                      <th className="p-3">Contacto</th>
                      <th className="p-3">Cumpleaños</th>
                      <th className="p-3">BeeCoins</th>
                      <th className="p-3">Visitas Reg.</th>
                      <th className="p-3">Estatus</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE7DC] font-['Marcellus'] text-[#302117]">
                    {filteredUsersList.map((usr) => {
                      const isExpanded = expandedUserId === usr.id;
                      const usrRecharges = rechargeRequests.filter(
                        (r) => r.userId === usr.id || r.userPhone === usr.phone || (usr.email && r.userEmail === usr.email)
                      );
                      const pendingRecharges = usrRecharges.filter((r) => r.status === 'pending');
                      const approvedRecharges = usrRecharges.filter((r) => r.status === 'approved');

                      const toggleUserExpand = () => {
                        if (isExpanded) {
                          setExpandedUserId(null);
                        } else {
                          setExpandedUserId(usr.id);
                          setDraftUserCoins(usr.beeCoins || 0);
                          setDraftUserVisits(usr.visitsCount || 0);
                          setDraftUserBirthDate(usr.birthDate || '');
                        }
                      };

                      return (
                        <React.Fragment key={usr.id}>
                          <tr
                            onClick={toggleUserExpand}
                            className={`cursor-pointer transition-colors ${
                              isExpanded ? 'bg-[#FAF7F2] font-semibold' : 'hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-md bg-[#F5EBE1] text-[#8C6B1C] shrink-0">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </span>
                                <div>
                                  <span className="font-bold block text-sm text-[#5D3704]">{usr.firstName} {usr.lastName}</span>
                                  <span className="text-[10px] text-[#7A614A]">Reg: {new Date(usr.createdAt).toLocaleDateString('es-PE')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="block font-mono text-xs">{usr.phone}</span>
                              <span className="text-[10px] text-[#7A614A]">{usr.email}</span>
                              {usr.instagram && <span className="text-[10px] text-[#8C6B1C] block">@{usr.instagram.replace('@', '')}</span>}
                            </td>
                            <td className="p-3 font-mono font-bold text-[#5D3704]">
                              {usr.birthDate || 'No registrada'}
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-xs text-[#5D3704] bg-[#FDFBF7] px-2.5 py-1 rounded-lg border border-[#C5A059] inline-flex items-center gap-1.5 shadow-2xs">
                                <BeeCoinIcon className="w-3.5 h-3.5" />
                                <span>{usr.beeCoins || 0}</span>
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-xs text-[#5D3704]">
                              {usr.visitsCount || 0} visitas
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-['Cinzel'] font-bold border uppercase ${
                                  (usr.visitsCount || 0) >= 4
                                    ? 'bg-[#FDFBF7] text-[#8C6B1C] border-[#C5A059] ring-1 ring-[#C5A059]/40'
                                    : 'bg-gray-100 text-gray-700 border-gray-300'
                                }`}>
                                  {(usr.visitsCount || 0) >= 4 ? '👑 VIP' : 'Regular'}
                                </span>
                                {pendingRecharges.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                    ⚡ {pendingRecharges.length} Recarga Pendiente
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleUserExpand();
                                }}
                                className={`py-1.5 px-3 rounded-xl border text-xs font-['Cinzel'] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ml-auto ${
                                  isExpanded
                                    ? 'bg-[#5D3704] text-[#FAF7F2] border-[#5D3704]'
                                    : 'bg-[#FDFBF7] text-[#5D3704] border-[#C5A059] hover:bg-[#F2E5D5]'
                                }`}
                              >
                                <span>{isExpanded ? 'Cerrar Ficha' : 'Gestionar Ficha'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* SUBPANEL DESPLEGABLE DE LA CLIENTA */}
                          {isExpanded && (
                            <tr className="bg-[#FAF7F2]/90 animate-fadeIn">
                              <td colSpan={7} className="p-4 sm:p-5 border-b-2 border-[#C5A059]">
                                <div className="bg-white rounded-3xl p-5 border-2 border-[#C5A059]/50 shadow-md space-y-5">
                                  
                                  {/* CABECERA DE LA FICHA */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE7DC] pb-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-9 h-9 rounded-2xl bg-[#5D3704] text-[#FAF7F2] flex items-center justify-center font-bold text-base shadow-xs">
                                        {usr.firstName.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="text-base font-['Cinzel'] font-bold text-[#5D3704]">
                                          Ficha Integrada: {usr.firstName} {usr.lastName}
                                        </h4>
                                        <span className="text-[11px] font-['Marcellus'] text-[#7A614A]">
                                          Celular: {usr.phone} {usr.email ? `• ${usr.email}` : ''} {usr.instagram ? `• @${usr.instagram.replace('@', '')}` : ''}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className={`px-3 py-1 rounded-xl text-xs font-['Cinzel'] font-bold border ${
                                        draftUserVisits >= 4
                                          ? 'bg-[#FDFBF7] text-[#8C6B1C] border-[#C5A059]'
                                          : 'bg-gray-100 text-gray-600 border-gray-300'
                                      }`}>
                                        {draftUserVisits >= 4 ? '👑 Cliente VIP' : 'Cliente Regular'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* TRES BLOQUES PRINCIPALES */}
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    
                                    {/* 1. EDICIÓN DE DATOS & SALDOS */}
                                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E3D6C3] space-y-3 shadow-2xs">
                                      <div className="flex items-center gap-2 pb-2 border-b border-[#E8DEC9]">
                                        <User className="w-4 h-4 text-[#8C6B1C]" />
                                        <h5 className="font-['Cinzel'] font-bold text-xs text-[#5D3704] uppercase tracking-wider">
                                          1. Edición de Datos & Saldos
                                        </h5>
                                      </div>

                                      {/* Campo BeeCoins */}
                                      <div>
                                        <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                                          Saldo de BeeCoins (Puntos Acumulados)
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                          <div className="relative flex-1">
                                            <input
                                              type="number"
                                              value={draftUserCoins}
                                              onChange={(e) => {
                                                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                setDraftUserCoins(isNaN(val) ? 0 : val);
                                              }}
                                              className="w-full pl-8 pr-2 py-2 bg-white border border-[#C5A059] rounded-xl font-mono text-xs font-bold text-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704]"
                                            />
                                            <BeeCoinIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2" />
                                          </div>
                                          <div className="flex gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => setDraftUserCoins((prev) => prev + 100)}
                                              className="py-1 px-1.5 rounded-lg bg-white border border-[#C5A059] text-[10px] font-bold text-[#5D3704] hover:bg-[#F2E5D5] cursor-pointer shadow-2xs"
                                            >
                                              +100
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setDraftUserCoins((prev) => Math.max(0, prev - 50))}
                                              className="py-1 px-1.5 rounded-lg bg-white border border-[#C5A059] text-[10px] font-bold text-[#5D3704] hover:bg-[#F2E5D5] cursor-pointer shadow-2xs"
                                            >
                                              -50
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setDraftUserCoins(0)}
                                              className="py-1 px-1.5 rounded-lg bg-white border border-rose-300 text-[10px] font-bold text-rose-700 hover:bg-rose-50 cursor-pointer shadow-2xs"
                                            >
                                              Poner a 0
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Campo Visitas */}
                                      <div>
                                        <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                                          Visitas Regulares (4 Visitas = Estatus VIP)
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min={0}
                                            value={draftUserVisits}
                                            onChange={(e) => setDraftUserVisits(Math.max(0, Number(e.target.value) || 0))}
                                            className="flex-1 px-3 py-2 bg-white border border-[#C5A059] rounded-xl font-mono text-xs font-bold text-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704]"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setDraftUserVisits((prev) => prev + 1)}
                                            className="py-2 px-3 rounded-xl bg-white border border-[#C5A059] text-xs font-bold text-[#5D3704] hover:bg-[#F2E5D5] cursor-pointer shrink-0 shadow-2xs"
                                          >
                                            +1 Visita
                                          </button>
                                        </div>
                                      </div>

                                      {/* Campo Cumpleaños */}
                                      <div>
                                        <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                                          Fecha de Cumpleaños (Editable)
                                        </label>
                                        <input
                                          type="date"
                                          value={draftUserBirthDate}
                                          onChange={(e) => setDraftUserBirthDate(e.target.value)}
                                          className="w-full px-3 py-2 bg-white border border-[#C5A059] rounded-xl font-mono text-xs font-bold text-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704]"
                                        />
                                      </div>

                                      {/* Botón Guardar con degradación/ascenso VIP automático */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const isVip = draftUserVisits >= 4;
                                          const stampsCount = draftUserVisits <= 10 ? draftUserVisits : ((draftUserVisits - 1) % 10) + 1;
                                          const updatedUser: UserProfile = {
                                            ...usr,
                                            beeCoins: draftUserCoins,
                                            visitsCount: draftUserVisits,
                                            stampsCount,
                                            isVip,
                                            birthDate: draftUserBirthDate,
                                          };
                                          updateUserProfile(updatedUser);
                                          triggerToast(`✓ ¡Datos y saldo de ${usr.firstName} actualizados (${isVip ? 'Estatus VIP 👑' : 'Estatus Regular'})!`);
                                        }}
                                        className="w-full py-2.5 px-4 rounded-xl bg-[#5D3704] hover:bg-[#432702] text-[#FAF7F2] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                                      >
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Guardar Cambios</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`¿Estás segura de eliminar permanentemente la cuenta de ${usr.firstName} ${usr.lastName}? Esta acción no se puede deshacer.`)) {
                                            deleteUserAccount(usr.id);
                                            triggerToast(`✓ Cuenta de ${usr.firstName} eliminada permanentemente.`);
                                            setExpandedUserId(null);
                                          }
                                        }}
                                        className="w-full py-2 px-3 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-[10.5px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1.5"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Eliminar Cuenta de Clienta</span>
                                      </button>
                                    </div>

                                    {/* 2. HISTORIAL DE RULETA VIP (SUBMÓDULO ANTIFRAUDE INTEGRADO) */}
                                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E3D6C3] space-y-3 shadow-2xs">
                                      <div className="flex items-center gap-2 pb-2 border-b border-[#E8DEC9]">
                                        <Sparkles className="w-4 h-4 text-[#8C6B1C]" />
                                        <h5 className="font-['Cinzel'] font-bold text-xs text-[#5D3704] uppercase tracking-wider">
                                          2. Historial Ruleta VIP (Antifraude)
                                        </h5>
                                      </div>

                                      <div className="space-y-2.5 font-['Marcellus'] text-xs text-[#5D3704]">
                                        <div className="p-3 bg-white rounded-xl border border-[#E3D6C3] space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-[#7A614A]">Estado del Giro:</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                              usr.rouletteSpun
                                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            }`}>
                                              {usr.rouletteSpun ? '🔒 Giro Efectuado' : '⏳ Disponible para girar'}
                                            </span>
                                          </div>

                                          <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-[#7A614A]">Premio Obtenido:</span>
                                            <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">
                                              {usr.roulettePrize || 'Aún no ha girado'}
                                            </span>
                                          </div>

                                          <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-[#7A614A]">Token Antifraude:</span>
                                            <span className="font-mono text-xs font-bold text-[#8C6B1C]">
                                              {usr.rouletteToken || (usr.rouletteSpun ? 'VIP-TOKEN-REGISTRADO' : 'Sin token')}
                                            </span>
                                          </div>
                                        </div>

                                        {usr.rouletteSpun ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (confirm(`¿Resetear el giro de ruleta de ${usr.firstName} para que pueda volver a girar?`)) {
                                                const updatedUser: UserProfile = {
                                                  ...usr,
                                                  rouletteSpun: false,
                                                  roulettePrize: undefined,
                                                  rouletteToken: undefined,
                                                };
                                                updateUserProfile(updatedUser);
                                                triggerToast(`✓ Ruleta de ${usr.firstName} reiniciada con éxito.`);
                                              }
                                            }}
                                            className="w-full py-2 px-3 rounded-xl bg-white border border-[#C5A059] text-[#5D3704] hover:bg-[#F2E5D5] text-[10px] font-['Cinzel'] font-bold uppercase transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 mt-2"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5 text-[#8C6B1C]" />
                                            <span>Reiniciar Giro (Habilitar Ruleta)</span>
                                          </button>
                                        ) : (
                                          <p className="text-[10px] text-[#7A614A] italic leading-tight pt-1">
                                            La clienta podrá girar la ruleta exactamente 1 vez el día de su cumpleaños desde su perfil.
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* 3. GESTIÓN DE PASARELA DE PAGOS (RECARGAS DETALLADAS DEL CLIENTE) */}
                                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E3D6C3] space-y-3 shadow-2xs">
                                      <div className="flex items-center justify-between pb-2 border-b border-[#E8DEC9]">
                                        <div className="flex items-center gap-2">
                                          <BeeCoinIcon className="w-4 h-4" />
                                          <h5 className="font-['Cinzel'] font-bold text-xs text-[#5D3704] uppercase tracking-wider">
                                            3. Pasarela de Recargas
                                          </h5>
                                        </div>
                                        {pendingRecharges.length > 0 && (
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                            {pendingRecharges.length} por validar
                                          </span>
                                        )}
                                      </div>

                                      <div className="space-y-3">
                                        {/* RECARGAS PENDIENTES CON MÁXIMO DETALLE */}
                                        {pendingRecharges.length > 0 ? (
                                          <div className="space-y-2.5">
                                            <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-amber-900 block">
                                              ⚡ Solicitudes Pendientes de Aprobación:
                                            </span>
                                            {pendingRecharges.map((req) => (
                                              <div key={req.id} className="p-3.5 bg-amber-50/90 rounded-2xl border-2 border-amber-300 space-y-2.5 text-xs shadow-xs animate-fadeIn">
                                                {/* Paquete y Monto en Soles */}
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <span className="font-['Cinzel'] font-black text-xs text-[#5D3704] block">
                                                      {req.packageName}
                                                    </span>
                                                    <span className="font-mono font-bold text-[#8C6B1C] text-xs inline-flex items-center gap-1 mt-0.5">
                                                      <BeeCoinIcon className="w-3.5 h-3.5" /> +{req.coinsAmount} BeeCoins
                                                    </span>
                                                  </div>
                                                  <span className="font-mono font-black text-sm text-[#5D3704] bg-white px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs">
                                                    S/. {req.priceSoles}.00
                                                  </span>
                                                </div>

                                                {/* N° de Operación / Código de Comprobante Resaltado y Copiable */}
                                                <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2 shadow-2xs">
                                                  <div>
                                                    <span className="text-[9px] uppercase font-bold text-amber-800 block">
                                                      N° Operación / Código Comprobante:
                                                    </span>
                                                    <span className="font-mono font-black text-sm text-[#5D3704] tracking-wider select-all">
                                                      {req.operationNumber}
                                                    </span>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      navigator.clipboard.writeText(req.operationNumber);
                                                      triggerToast(`N° de Operación ${req.operationNumber} copiado.`);
                                                    }}
                                                    className="py-1 px-2.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2E5D5] text-[#5D3704] border border-[#C5A059] text-[10px] font-['Cinzel'] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                                    title="Copiar N° de Operación"
                                                  >
                                                    <Copy className="w-3.5 h-3.5 text-[#8C6B1C]" />
                                                    <span>Copiar</span>
                                                  </button>
                                                </div>

                                                {/* Fecha y Hora Exacta de la Solicitud */}
                                                <div className="flex items-center gap-1.5 text-[10.5px] text-[#7A614A] bg-amber-100/60 p-2 rounded-xl border border-amber-200/80">
                                                  <Clock className="w-3.5 h-3.5 text-[#8C6B1C] shrink-0" />
                                                  <span>
                                                    Fecha y Hora: <strong>{new Date(req.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })} a las {new Date(req.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</strong>
                                                  </span>
                                                </div>

                                                {/* Botones Interactivos de Acción */}
                                                <div className="flex gap-2 pt-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      approveBeeCoinRecharge(req.id);
                                                      const newCoinsAmount = (draftUserCoins || usr.beeCoins || 0) + req.coinsAmount;
                                                      setDraftUserCoins(newCoinsAmount);
                                                      triggerToast(`✓ ¡Recarga aprobada y +${req.coinsAmount} BeeCoins acreditados a ${usr.firstName}!`);
                                                    }}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-[#5D3704] text-[#FAF7F2] hover:bg-[#432702] text-xs font-['Cinzel'] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                                  >
                                                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                                                    <span>Aprobar / Acreditar Recarga</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      rejectBeeCoinRecharge(req.id);
                                                      triggerToast('Solicitud de recarga rechazada.');
                                                    }}
                                                    className="py-2 px-3 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-[10px] font-['Cinzel'] font-bold uppercase cursor-pointer transition-all"
                                                  >
                                                    Rechazar
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="p-3.5 bg-white rounded-xl border border-[#E3D6C3] text-center text-xs text-[#7A614A] space-y-1">
                                            <span className="block font-['Cinzel'] font-bold text-[#5D3704]">Sin recargas pendientes</span>
                                            <span className="block text-[10px]">Todas las solicitudes de esta clienta están validadas al día.</span>
                                          </div>
                                        )}

                                        {/* HISTORIAL DETALLADO DE RECARGAS ACREDITADAS */}
                                        {approvedRecharges.length > 0 && (
                                          <div className="pt-2 border-t border-[#E8DEC9] space-y-2">
                                            <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                                              Historial de Recargas Acreditadas ({approvedRecharges.length}):
                                            </span>
                                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                                              {approvedRecharges.map((rec) => (
                                                <div key={rec.id} className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] space-y-1 shadow-2xs">
                                                  <div className="flex justify-between items-center font-bold text-emerald-950">
                                                    <span className="flex items-center gap-1">
                                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                      <span>{rec.packageName}</span>
                                                    </span>
                                                    <span className="font-mono text-[#5D3704]">S/. {rec.priceSoles}.00</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] text-[#7A614A]">
                                                    <span className="font-mono font-bold">N° Op: {rec.operationNumber}</span>
                                                    <span className="text-emerald-700 font-bold font-mono">+{rec.coinsAmount} BeeCoins</span>
                                                  </div>
                                                  <div className="text-[9.5px] text-[#7A614A] flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-[#8C6B1C]" />
                                                    <span>{new Date(rec.createdAt).toLocaleDateString('es-PE')} - {new Date(rec.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {filteredUsersList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-xs text-[#7A614A]">
                          No hay clientas registradas que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: CONTROL VIP & TARJETA DE FIDELIDAD (10 CASILLAS) */}
        {/* ========================================================= */}
        {activeTab === 'loyalty_vip' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Digital Loyalty Card Replica & Manual Stamp Controls */}
            <div className="p-6 rounded-3xl bg-white border border-[#E7DDCE] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE7DC]">
                <div>
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                    Gestión Privada de Fidelización
                  </span>
                  <h3 className="text-xl font-['Cinzel'] font-bold text-[#302117] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#C89D3C]" />
                    <span>Control de Tarjeta de Fidelidad (10 Casillas)</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="🔎 Buscar clienta por nombre o celular..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-[#DDD1BF] bg-[#FAF7F2] text-[#302117] focus:outline-none focus:ring-1 focus:ring-[#C29D38] w-full sm:w-64"
                  />
                  <span className="text-xs font-mono font-bold bg-[#FAF7F2] px-3 py-1 rounded-xl border border-[#E7DDCE] text-[#5D3704] shrink-0">
                    Total: {filteredUsersList.length}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {filteredUsersList.map((usr) => {
                  const stamps = usr.stampsCount || 0;
                  const consecutive = usr.consecutivePromoMonths || 0;

                  return (
                    <div key={usr.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7DDCE] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DEC9] pb-2.5">
                        <div>
                          <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                            {usr.firstName} {usr.lastName} <span className="font-['Marcellus'] text-xs text-[#7A614A]">({usr.phone})</span>
                          </h4>
                          <span className="text-[11px] font-['Marcellus'] text-[#5D3704]/80">
                            {usr.visitsCount || 0} visitas totales • {consecutive} mes(es) seguidos en promo
                          </span>
                        </div>

                        {/* Manual Stamp & Promo Month Controls (Translucent warm brown glassmorphism style) */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newStamps = Math.max(0, (usr.stampsCount || 0) - 1);
                              const newVisits = Math.max(0, (usr.visitsCount || 0) - 1);
                              const isVipNow = newVisits >= 4;
                              updateUserProfile({ ...usr, stampsCount: newStamps, visitsCount: newVisits, isVip: isVipNow });
                              triggerToast(`-1 sello quitado a ${usr.firstName}.`);
                            }}
                            className="py-1.5 px-3 rounded-xl bg-[#5D3704]/10 backdrop-blur-xs border border-[#C5A059]/50 hover:bg-[#5D3704]/20 text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1"
                          >
                            - Quitar Sello
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newStamps = Math.min(10, (usr.stampsCount || 0) + 1);
                              const newVisits = (usr.visitsCount || 0) + 1;
                              const isVipNow = newVisits >= 4;
                              updateUserProfile({ ...usr, stampsCount: newStamps, visitsCount: newVisits, isVip: isVipNow, consecutivePromoMonths: 0 });
                              triggerToast(`+1 sello añadido a ${usr.firstName}.`);
                            }}
                            className="py-1.5 px-3 rounded-xl bg-[#5D3704]/10 backdrop-blur-xs border border-[#C5A059]/50 hover:bg-[#5D3704]/20 text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1"
                          >
                            + Añadir Sello
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newCons = (usr.consecutivePromoMonths || 0) + 1;
                              const newStamps = newCons >= 2 ? 0 : usr.stampsCount;
                              const newVisits = newCons >= 2 ? 0 : (usr.visitsCount || 0);
                              const isVipNow = newVisits >= 4;
                              updateUserProfile({ ...usr, consecutivePromoMonths: newCons, stampsCount: newStamps, visitsCount: newVisits, isVip: isVipNow });
                              triggerToast(`+1 Mes Promo registrado para ${usr.firstName}.`);
                            }}
                            className="py-1.5 px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] hover:bg-[#F2E5D5] text-xs font-['Cinzel'] font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1"
                          >
                            + Registrar Mes Promo ({consecutive})
                          </button>

                          {consecutive > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                updateUserProfile({ ...usr, consecutivePromoMonths: 0 });
                                triggerToast(`Contador promo reiniciado para ${usr.firstName}.`);
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold border border-gray-300 cursor-pointer"
                            >
                              Reiniciar Contador
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Integrated Promo Month Warning Status Badge */}
                      {consecutive >= 1 && (
                        <div className="p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-900 font-['Marcellus']">
                          ⏸️ <strong>Beneficios Pausados ({consecutive} mes promo):</strong> La clienta tiene activo el aviso de pausa por promoción y se mostrará en su perfil.
                        </div>
                      )}

                      {/* 10 Stamps Cards Visual */}
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {Array.from({ length: 10 }).map((_, idx) => {
                          const sNum = idx + 1;
                          const isStamped = stamps >= sNum;
                          const isReward5 = sNum === 5;
                          const isReward10 = sNum === 10;

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                                isStamped
                                  ? 'bg-[#E8A5B0]/25 text-[#7A3E4A] border-[#C97B8B] shadow-xs'
                                  : 'bg-white text-[#5D3704]/60 border-[#DFD1BD]'
                              }`}
                            >
                              <span className="font-['Cinzel'] font-bold text-xs">{sNum}</span>
                              <span className="text-[8px] font-['Cinzel'] font-bold mt-0.5 block truncate max-w-full">
                                {isReward5 ? '🎁 Regalo' : isReward10 ? '🎉 50% OFF' : `Sello ${sNum}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Rule Badges */}
                      <div className="flex flex-wrap gap-2 text-[10px] font-['Marcellus'] text-[#5D3704]">
                        <span className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
                          <strong>Regla 5.ª cita:</strong> Regalo de producto físico del inventario.
                        </span>
                        <span className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                          <strong>Regla 10.ª cita:</strong> 50% de descuento en cualquier servicio o Kit Press-On gratis de regalo (hasta S/. 100).
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredUsersList.length === 0 && (
                  <p className="text-center py-6 text-xs text-[#7A614A]">
                    No hay clientas registradas que coincidan con la búsqueda.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1A: PROMOTIONAL SYSTEM MODAL (GRABAR & MODIFICAR SISTEMAS) */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* MODAL 1A: PROMOTIONAL SYSTEM MODAL (GRABAR & MODIFICAR SISTEMAS) */}
      {/* ========================================================= */}
      {showPromoSistemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8DEC9] bg-[#F5EFE6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C29D38]" />
                <h3 className="text-lg font-display font-bold text-[#302117]">
                  {editingPromoSistemaId ? 'Modificar Sistema en Promoción' : 'Grabar Nuevo Sistema en Promoción'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoSistemaModal(false)}
                className="p-1.5 text-[#7A6655] hover:text-[#2E2017] rounded-lg hover:bg-[#EAE0D0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromoSistema} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* ESTRUCTURA DE LA PROMOCIÓN (SOLO 2 BOTONES) */}
              <div className="p-4 rounded-2xl border border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#F5EBE1] space-y-2 shadow-2xs">
                <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                  Estructura de la Promoción *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { id: 'clasica' as PromoType, label: 'Promo Clásica', desc: 'Individual · sistemas, niveles y precio' },
                    { id: '2x1' as PromoType, label: 'Promo 2x1', desc: 'Dos personas en una sola reserva' },
                  ]).map((type) => {
                    const isActive = promoSistemaForm.promoType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setPromoSistemaForm((p) => ({ ...p, promoType: type.id }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col ${
                          isActive
                            ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.3)] text-[#5D3704]'
                            : 'bg-white/80 border-[#DFD1BD] hover:border-[#D4AF37] text-[#7A6655]'
                        }`}
                      >
                        <span className={`font-['Cinzel'] font-bold text-xs ${isActive ? 'text-[#5D3704]' : 'text-[#8C7664]'}`}>
                          {type.label}
                        </span>
                        <span className="text-[9px] font-['Marcellus'] leading-snug mt-0.5 opacity-80">{type.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Input - Styled in luxury rounded card border-[#DFD1BD] hover:border-[#D4AF37] rounded-2xl bg-white/80 */}
              <div className="p-4 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-3 transition-colors">
                <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                  Foto del Sistema (URL o Subir Archivo) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="https://... o sube una imagen"
                    value={promoSistemaForm.image}
                    onChange={(e) => setPromoSistemaForm((p) => ({ ...p, image: e.target.value }))}
                    className="flex-1 p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704]"
                  />
                  <label className="py-2.5 px-3.5 rounded-xl border border-[#D4AF37]/60 bg-[#FDFBF7] text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer hover:bg-[#F2E5D5] flex items-center gap-1.5 shrink-0 shadow-2xs transition-all">
                    <Upload className="w-3.5 h-3.5 text-[#C89D3C]" />
                    <span>Subir</span>
                    <input
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                      onChange={handlePromoSistemaImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {promoSistemaForm.image && (
                  <div className="h-36 rounded-xl overflow-hidden border border-[#DDD1BF] bg-[#F0E9DF]">
                    <img
                      src={promoSistemaForm.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Title & Collection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Polygel Promocional / Soft Gel Set Estilo"
                    value={promoSistemaForm.title}
                    onChange={(e) => setPromoSistemaForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                  />
                </div>

                <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704]">Etiqueta Superior</label>
                  <input
                    type="text"
                    placeholder="Ej: Sistema Profesional"
                    value={promoSistemaForm.collection}
                    onChange={(e) => setPromoSistemaForm((p) => ({ ...p, collection: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704]"
                  />
                </div>
              </div>

              {/* Allowed Systems Toggles & Price */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-[#DFD1BD] bg-white/80 space-y-2">
                  <label className="block font-['Cinzel'] font-bold text-xs text-[#5D3704]">
                    Sistemas Permitidos en esta Promoción (Toggles)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'polygel', label: 'POLYGEL' },
                      { id: 'softgel', label: 'SOFT GEL' },
                      { id: 'builder', label: 'BUILDER GEL' },
                      { id: 'acrilicas', label: 'ACRÍLICAS' },
                      { id: 'esmaltado_gel', label: 'ESMALTADO EN GEL' },
                    ].map((sys) => {
                      const isEnabled = promoSistemaForm.allowedSystems[sys.id as keyof typeof promoSistemaForm.allowedSystems];
                      return (
                        <button
                          key={sys.id}
                          type="button"
                          onClick={() =>
                            setPromoSistemaForm((p) => ({
                              ...p,
                              allowedSystems: {
                                ...p.allowedSystems,
                                [sys.id]: !isEnabled,
                              },
                            }))
                          }
                          className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer text-xs font-['Cinzel'] font-bold flex flex-col items-center justify-center ${
                            isEnabled
                              ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.3)] text-[#5D3704]'
                              : 'bg-white/80 border-[#DFD1BD] text-[#8C7664] line-through opacity-60 hover:opacity-80'
                          }`}
                        >
                          <span className={isEnabled ? '' : 'line-through'}>{sys.label}</span>
                          <span className="text-[9px] font-sans no-underline font-semibold block mt-0.5">
                            {isEnabled ? 'Permitido ✓' : 'Oculto ✕'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-['Marcellus'] text-[#7A6655] block">
                    Activa o desactiva los sistemas que la clienta podrá seleccionar en la ventana de reserva.
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                    {promoSistemaForm.promoType === '2x1' ? 'Precio Promocional 2x1 (S/.) *' : 'Precio Fijo Promoción (S/.) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={promoSistemaForm.price}
                    onChange={(e) => setPromoSistemaForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>
              </div>

              {/* NIVELES DE COMPLEJIDAD EN PROMOCIÓN (SELECCIÓN INTERACTIVA POR PROMOCIÓN) */}
              <div className="p-4 rounded-2xl border border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#F5EBE1] space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#8C6B1C] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Niveles de Complejidad Permitidos (Toggles)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#5D3704] bg-white/90 px-2.5 py-0.5 rounded-full border border-[#D4AF37]">
                    S/. {promoSistemaForm.price}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'sencillo',
                      label: 'SUTIL (S)',
                      desc: 'Diseños clásicos y elegantes, con detalles minimalistas muy al estilo old money.',
                    },
                    {
                      id: 'moderado',
                      label: 'MODERADO (M)',
                      desc: 'Diseños a mano alzada y detalles más especializados, incorporando efectos atemporales.',
                    },
                    {
                      id: 'complejo',
                      label: 'COMPLEJO (C)',
                      desc: 'Diseños más elaborados a mano alzada, decoraciones en tendencia, texturas en 3D y efectos únicos con acabados de primera.',
                    },
                  ].map((lvl) => {
                    const isEnabled = promoSistemaForm.allowedLevels[lvl.id as keyof typeof promoSistemaForm.allowedLevels];
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() =>
                          setPromoSistemaForm((p) => ({
                            ...p,
                            allowedLevels: {
                              ...p.allowedLevels,
                              [lvl.id]: !isEnabled,
                            },
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col ${
                          isEnabled
                            ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.3)] text-[#5D3704]'
                            : 'bg-white/80 border-[#DFD1BD] text-[#8C7664] opacity-60 hover:opacity-80'
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className={`font-['Cinzel'] font-bold text-xs ${
                            isEnabled ? 'text-[#5D3704]' : 'text-[#8C7664] line-through'
                          }`}>
                            ✦ {lvl.label}
                          </span>
                          <span className="text-[9px] font-sans font-semibold block mt-0.5 no-underline">
                            {isEnabled ? 'Permitido ✓' : 'Oculto ✕'}
                          </span>
                        </div>
                        <p className={`text-[10px] font-['Marcellus'] leading-relaxed mt-1 ${
                          isEnabled ? 'text-[#6F5B4D]' : 'text-[#8C7664]'
                        }`}>
                          {lvl.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] font-['Marcellus'] text-[#7A6655] block">
                  Activa los niveles de diseño que la clienta podrá elegir al reservar esta promoción (el precio fijo aplica a todos los niveles habilitados).
                </span>
              </div>

              {/* COMPLEMENTO 2x1: CONFIGURACIÓN DE LA 2.ª PERSONA (ACOMPAÑANTE) */}
              {promoSistemaForm.promoType === '2x1' && (
                <div className="p-4 rounded-2xl border border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#F5EBE1] space-y-3 shadow-2xs">
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#8C6B1C] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Persona 2 · Acompañante (misma reserva)</span>
                  </span>

                  <div className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/80 space-y-1">
                    <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                      Sistemas permitidos para la acompañante
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'polygel', label: 'POLYGEL' },
                        { id: 'softgel', label: 'SOFT GEL' },
                        { id: 'builder', label: 'BUILDER GEL' },
                        { id: 'acrilicas', label: 'ACRÍLICAS' },
                        { id: 'esmaltado_gel', label: 'ESMALTADO EN GEL' },
                      ].map((sys) => {
                        const isEnabled = promoSistemaForm.companionAllowedSystems[sys.id as keyof typeof promoSistemaForm.companionAllowedSystems];
                        return (
                          <button
                            key={sys.id}
                            type="button"
                            onClick={() =>
                              setPromoSistemaForm((p) => ({
                                ...p,
                                companionAllowedSystems: { ...p.companionAllowedSystems, [sys.id]: !isEnabled },
                              }))
                            }
                            className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer text-[10px] font-['Cinzel'] font-bold flex flex-col items-center justify-center ${
                              isEnabled
                                ? 'bg-[#5D3704]/10 border-[#D4AF37] text-[#5D3704]'
                                : 'bg-white/80 border-[#DFD1BD] text-[#8C7664] line-through opacity-60 hover:opacity-80'
                            }`}
                          >
                            {sys.label}
                            <span className="text-[8px] font-sans no-underline font-semibold block mt-0.5">
                              {isEnabled ? 'Permitido ✓' : 'Oculto ✕'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/80 space-y-1">
                    <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                      Niveles de complejidad permitidos para la acompañante
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'sencillo', label: 'SUTIL (S)' },
                        { id: 'moderado', label: 'MODERADO (M)' },
                        { id: 'complejo', label: 'COMPLEJO (C)' },
                      ].map((lvl) => {
                        const isEnabled = promoSistemaForm.companionAllowedLevels[lvl.id as keyof typeof promoSistemaForm.companionAllowedLevels];
                        return (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() =>
                              setPromoSistemaForm((p) => ({
                                ...p,
                                companionAllowedLevels: { ...p.companionAllowedLevels, [lvl.id]: !isEnabled },
                              }))
                            }
                            className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer text-[10px] font-['Cinzel'] font-bold ${
                              isEnabled
                                ? 'bg-[#5D3704]/10 border-[#D4AF37] text-[#5D3704]'
                                : 'bg-white/80 border-[#DFD1BD] text-[#8C7664] line-through opacity-60 hover:opacity-80'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                  Descripción Detallada (Para modal de reserva)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe lo que incluye el servicio promocional..."
                  value={promoSistemaForm.description}
                  onChange={(e) => setPromoSistemaForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed"
                />
              </div>

              {/* DETALLES Y TÉRMINOS DE LA PROMOCIÓN ( conectado al modal público "Detalles de la promo" ) */}
              <div className="p-4 rounded-2xl border border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#F5EBE1] space-y-3 shadow-2xs">
                <div className="flex items-center gap-1.5 border-b border-[#5D3704]/15 pb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#5D3704]">
                    Detalles y Términos de la Promoción
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/80 space-y-1">
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704]">Título principal</label>
                  <input
                    type="text"
                    value={promoSistemaForm.promoDetailsTitle}
                    onChange={(e) => setPromoSistemaForm((p) => ({ ...p, promoDetailsTitle: e.target.value }))}
                    placeholder="Ej: TÉRMINOS Y CONDICIONES (PROMO S/ 60)"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                  />
                </div>

                <div className="space-y-2">
                  {promoSistemaForm.promoDetailsBlocks.map((block, idx) => (
                    <div key={block.id} className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#8C6B1C]">
                          Bloque {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPromoSistemaForm((p) => ({
                              ...p,
                              promoDetailsBlocks: p.promoDetailsBlocks.filter((_, i) => i !== idx),
                            }))
                          }
                          className="p-1.5 rounded-lg text-[#A65B5B] hover:bg-[#F7E9E9] cursor-pointer transition-colors"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={block.title}
                        onChange={(e) =>
                          setPromoSistemaForm((p) => ({
                            ...p,
                            promoDetailsBlocks: p.promoDetailsBlocks.map((b, i) => (i === idx ? { ...b, title: e.target.value } : b)),
                          }))
                        }
                        placeholder="Título del bloque"
                        className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                      />
                      <textarea
                        rows={3}
                        value={block.content}
                        onChange={(e) =>
                          setPromoSistemaForm((p) => ({
                            ...p,
                            promoDetailsBlocks: p.promoDetailsBlocks.map((b, i) => (i === idx ? { ...b, content: e.target.value } : b)),
                          }))
                        }
                        placeholder="Texto o viñetas (una por línea). Usa **negrita** para resaltar."
                        className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed"
                      />
                      <label className="flex items-center gap-2 text-[10px] font-['Marcellus'] text-[#7A6655] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!block.bulleted}
                          onChange={(e) =>
                            setPromoSistemaForm((p) => ({
                              ...p,
                              promoDetailsBlocks: p.promoDetailsBlocks.map((b, i) => (i === idx ? { ...b, bulleted: e.target.checked } : b)),
                            }))
                          }
                          className="w-3.5 h-3.5 accent-[#5D3704] rounded"
                        />
                        Mostrar como lista de viñetas
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPromoSistemaForm((p) => ({
                      ...p,
                      promoDetailsBlocks: [
                        ...p.promoDetailsBlocks,
                        { id: `block_${Date.now()}`, title: '', content: '', bulleted: false },
                      ],
                    }))
                  }
                  className="w-full py-2.5 px-4 rounded-xl border border-[#C89D3C]/60 bg-[#FAF4E6] hover:bg-[#FFFDF8] text-[#5C3A1E] text-xs font-['Cinzel'] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>+ Añadir bloque</span>
                </button>
              </div>

              {/* INTERACTIVE SELECTION CARDS WITH FINE GOLDEN BORDER (NO CHECKBOXES / NO BRACKET TEXT - REQUERIMIENTO 7 & 8) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8DEC9]">
                <button
                  type="button"
                  onClick={() => setPromoSistemaForm((p) => ({ ...p, featured: !p.featured }))}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    promoSistemaForm.featured
                      ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.3)] text-[#5D3704]'
                      : 'bg-white/80 border-[#DFD1BD] hover:border-[#D4AF37] text-[#7A6655]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-['Cinzel'] font-bold text-xs block">✨ Destacar en Inicio</span>
                    <span className="text-[10px] font-['Marcellus'] block opacity-80">Muestra en vitrina superior</span>
                  </div>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    promoSistemaForm.featured ? 'bg-[#5D3704] text-white border-[#D4AF37]' : 'border-[#CBD5E1] bg-white'
                  }`}>
                    {promoSistemaForm.featured ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPromoSistemaForm((p) => ({ ...p, active: !p.active }))}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    promoSistemaForm.active
                      ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.3)] text-[#5D3704]'
                      : 'bg-white/80 border-[#DFD1BD] hover:border-[#D4AF37] text-[#7A6655]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-['Cinzel'] font-bold text-xs block">🌟 Promoción Activa</span>
                    <span className="text-[10px] font-['Marcellus'] block opacity-80">Visible en el catálogo público</span>
                  </div>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    promoSistemaForm.active ? 'bg-[#5D3704] text-white border-[#D4AF37]' : 'border-[#CBD5E1] bg-white'
                  }`}>
                    {promoSistemaForm.active ? '✓' : ''}
                  </span>
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPromoSistemaModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-[#D5C6B1] text-xs font-['Cinzel'] font-bold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>{editingPromoSistemaId ? 'Guardar Modificación' : 'Grabar Servicio Promoción'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1B: PROMOTIONAL PRESS-ON MODAL (GRABAR & MODIFICAR PRESS ON) */}
      {/* ========================================================= */}
      {showPromoPressOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8DEC9] bg-[#F5EFE6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C29D38]" />
                <h3 className="text-lg font-display font-bold text-[#302117]">
                  {editingPromoPressOnId ? 'Modificar Diseño Press On en Promoción' : 'Grabar Nuevo Diseño Press On en Promoción'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoPressOnModal(false)}
                className="p-1.5 text-[#7A6655] hover:text-[#2E2017] rounded-lg hover:bg-[#EAE0D0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromoPressOn} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* ESTRUCTURA DE LA PROMOCIÓN (SOLO 2 BOTONES) */}
              <div className="p-4 rounded-2xl border border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#F5EBE1] space-y-2 shadow-2xs">
                <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                  Estructura de la Promoción *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { id: 'individual' as PressOnStructure, label: 'Press On Individual', desc: '1 set · tallas, precio individual y kit de regalo' },
                    { id: 'duo' as PressOnStructure, label: 'Press On Duo', desc: 'Promo Duo Press On · 2 sets a precio único' },
                  ]).map((structure) => {
                    const isActive = promoPressOnForm.pressOnStructure === structure.id;
                    return (
                      <button
                        key={structure.id}
                        type="button"
                        onClick={() =>
                          setPromoPressOnForm((p) => ({
                            ...p,
                            pressOnStructure: structure.id,
                            title:
                              structure.id === 'duo' && !p.title.trim()
                                ? 'Promo Duo Press On · 2 Sets'
                                : p.title,
                            price: structure.id === 'duo' && p.pressOnStructure !== 'duo' ? 80 : p.price,
                            includedKit: structure.id === 'duo' && p.pressOnStructure !== 'duo' ? 'elemental' : p.includedKit,
                            duoDesignIds:
                              structure.id === 'duo' && p.duoDesignIds.length === 0
                                ? pressOnDuoDesignOptions
                                    .filter((design) => design.id !== editingPromoPressOnId)
                                    .map((design) => design.id)
                                : p.duoDesignIds,
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col ${
                          isActive
                            ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.3)] text-[#5D3704]'
                            : 'bg-white/80 border-[#DFD1BD] hover:border-[#D4AF37] text-[#7A6655]'
                        }`}
                      >
                        <span className={`font-['Cinzel'] font-bold text-xs ${isActive ? 'text-[#5D3704]' : 'text-[#8C7664]'}`}>
                          {structure.label}
                        </span>
                        <span className="text-[9px] font-['Marcellus'] leading-snug mt-0.5 opacity-80">{structure.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Input - Styled in luxury rounded card border-[#DFD1BD] hover:border-[#D4AF37] rounded-2xl bg-white/80 */}
              <div className="p-4 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-3 transition-colors">
                <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                  {promoPressOnForm.pressOnStructure === 'duo'
                    ? 'Foto Promocional del Duo (URL o Subir Archivo) *'
                    : 'Foto del Set (URL o Subir Archivo) *'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="https://... o sube una imagen"
                    value={promoPressOnForm.image}
                    onChange={(e) => setPromoPressOnForm((p) => ({ ...p, image: e.target.value }))}
                    className="flex-1 p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704]"
                  />
                  <label className="py-2.5 px-3.5 rounded-xl border border-[#D4AF37]/60 bg-[#FDFBF7] text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer hover:bg-[#F2E5D5] flex items-center gap-1.5 shrink-0 shadow-2xs transition-all">
                    <Upload className="w-3.5 h-3.5 text-[#C89D3C]" />
                    <span>Subir</span>
                    <input
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                      onChange={handlePromoPressOnImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {promoPressOnForm.image && (
                  <div className="h-36 rounded-xl overflow-hidden border border-[#DDD1BF] bg-[#F0E9DF]">
                    <img
                      src={promoPressOnForm.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Title & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                    {promoPressOnForm.pressOnStructure === 'duo' ? 'Nombre de la Promoción *' : 'Nombre del Set *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={promoPressOnForm.pressOnStructure === 'duo' ? 'Ej: Promo Duo Press On · 2 Sets' : 'Ej: Pink Bows Press On'}
                    value={promoPressOnForm.title}
                    onChange={(e) => setPromoPressOnForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                  />
                </div>

                <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                    {promoPressOnForm.pressOnStructure === 'duo'
                      ? 'Precio Único del Duo (S/.) *'
                      : 'Precio Promocional (S/.) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={promoPressOnForm.price}
                    onChange={(e) => setPromoPressOnForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>
              </div>

              {promoPressOnForm.pressOnStructure === 'individual' && (
                <>
                  {/* Tip & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                      <label className="block font-['Cinzel'] font-bold text-[#5D3704]">Punta Sugerida</label>
                      <select
                        value={promoPressOnForm.defaultTip}
                        onChange={(e) => setPromoPressOnForm((p) => ({ ...p, defaultTip: e.target.value as TipType }))}
                        className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704] font-['Cinzel']"
                      >
                        <option value="almendra">Almendra (Almond)</option>
                        <option value="coffin">Coffin / Ballerina</option>
                        <option value="square">Cuadrada (Square)</option>
                        <option value="stiletto">Stiletto</option>
                      </select>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                      <label className="block font-['Cinzel'] font-bold text-[#5D3704]">Stock Disponible</label>
                      <input
                        type="number"
                        value={promoPressOnForm.stock}
                        onChange={(e) => setPromoPressOnForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                        className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Kit Incluido de Regalo Selector (Admin Configurable) */}
              <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    {promoPressOnForm.pressOnStructure === 'duo'
                      ? 'Kit Incluido de Regalo para Ambos Sets *'
                      : 'Kit Incluido de Regalo *'}
                  </span>
                </label>
                <select
                  value={promoPressOnForm.includedKit || 'elemental'}
                  onChange={(e) => setPromoPressOnForm((p) => ({ ...p, includedKit: e.target.value as 'elemental' | 'standard' | 'premium' }))}
                  className="w-full p-2.5 rounded-xl border border-[#D4AF37]/60 bg-white text-xs text-[#5D3704] font-['Cinzel'] font-bold focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-colors"
                >
                  <option value="elemental">Kit Elemental (Valor S/. 10 - Incluido Gratis)</option>
                  <option value="standard">Kit Standard (Valor S/. 20 - Incluido Gratis)</option>
                  <option value="premium">Kit Premium (Valor S/. 25 - Incluido Gratis)</option>
                </select>
                <p className="text-[10px] font-['Marcellus'] text-[#7A614A] pt-1">
                  {promoPressOnForm.pressOnStructure === 'duo'
                    ? 'El kit seleccionado se incluirá gratis en cada uno de los 2 sets del Duo.'
                    : 'El kit seleccionado aparecerá automáticamente marcado con precio "S/. 0.00 (¡INCLUIDO GRATIS!)" para la clienta al elegir su talla y kit.'}
                </p>
              </div>

              {promoPressOnForm.pressOnStructure === 'individual' && (
                <>
                  {/* Sizes Available - Interactive luxury cards with golden borders */}
                  <div className="p-4 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-2 transition-colors">
                    <label className="block font-['Cinzel'] font-bold text-[#5D3704]">Disponibilidad de Tallas</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['XS', 'S', 'M', 'L'] as const).map((sz) => {
                        const isAvail = promoPressOnForm.sizeStock?.[sz] ?? true;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() =>
                              setPromoPressOnForm((p) => ({
                                ...p,
                                sizeStock: { ...p.sizeStock, [sz]: !isAvail },
                              }))
                            }
                            className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer font-['Cinzel'] font-bold text-xs flex flex-col items-center justify-center ${
                              isAvail
                                ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.3)] text-[#5D3704]'
                                : 'bg-white/80 border-[#DFD1BD] text-[#8C7664] line-through opacity-60'
                            }`}
                          >
                            <span>Talla {sz}</span>
                            <span className="text-[9px] font-sans no-underline font-semibold block mt-0.5">
                              {isAvail ? 'Disponible ✓' : 'Agotado ✕'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {promoPressOnForm.pressOnStructure === 'duo' && (
                <div className="p-4 rounded-2xl border border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#F5EBE1] space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 border-b border-[#5D3704]/15 pb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#5D3704]">
                      Diseños Press On participantes del Duo *
                    </span>
                  </div>
                  <p className="text-[10px] font-['Marcellus'] text-[#7A614A]">
                    Activa o desactiva los diseños Press On que la clienta podrá elegir libremente en el Set 1 y en el Set 2 (puede repetir diseño).
                  </p>

                  {pressOnDuoDesignOptions.filter((design) => design.id !== editingPromoPressOnId).length === 0 ? (
                    <p className="text-[11px] font-['Marcellus'] text-[#A65B5B] bg-white/80 rounded-xl border border-[#DFD1BD] p-3">
                      No hay diseños Press On activos disponibles. Crea primero los sets individuales que participarán en el Duo.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                      {pressOnDuoDesignOptions
                        .filter((design) => design.id !== editingPromoPressOnId)
                        .map((design) => {
                          const isChecked = promoPressOnForm.duoDesignIds.includes(design.id);
                          return (
                            <button
                              key={design.id}
                              type="button"
                              onClick={() =>
                                setPromoPressOnForm((p) => ({
                                  ...p,
                                  duoDesignIds: isChecked
                                    ? p.duoDesignIds.filter((id) => id !== design.id)
                                    : [...p.duoDesignIds, design.id],
                                }))
                              }
                              className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-white border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                                  : 'bg-white/70 border-[#DFD1BD] hover:border-[#D4AF37]'
                              }`}
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#DFD1BD] bg-[#F0E9DF] shrink-0">
                                <img src={design.image} alt={design.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-['Cinzel'] font-bold text-[11px] text-[#5D3704] leading-snug line-clamp-2">
                                  {design.title}
                                </p>
                                <p className="text-[9px] font-['Marcellus'] text-[#7A614A] mt-0.5">
                                  S/. {design.price} · {design.active !== false ? 'Activo' : 'Inactivo'}
                                </p>
                              </div>
                              {isChecked ? (
                                <CheckCircle2 className="w-4 h-4 text-[#C89D3C] shrink-0" />
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-[#C5A059]/60 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Descripción (único campo) */}
              <div className="p-3.5 rounded-2xl border border-[#DFD1BD] hover:border-[#D4AF37] bg-white/80 space-y-1 transition-colors">
                <label className="block font-['Cinzel'] font-bold text-[#5D3704]">Descripción</label>
                <textarea
                  rows={3}
                  placeholder={promoPressOnForm.pressOnStructure === 'duo' ? 'Detalles del pack Duo, promoción y beneficios...' : 'Detalles del set, técnicas y geles...'}
                  value={promoPressOnForm.description}
                  onChange={(e) => setPromoPressOnForm((p) => ({ ...p, description: e.target.value, fullDesc: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                />
              </div>

              {/* DETALLES Y TÉRMINOS DE LA PROMOCIÓN ( conectado al modal público "Detalles de la promo" ) */}
              <div className="p-4 rounded-2xl border border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#F5EBE1] space-y-3 shadow-2xs">
                <div className="flex items-center gap-1.5 border-b border-[#5D3704]/15 pb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#5D3704]">
                    Detalles y Términos de la Promoción
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/80 space-y-1">
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704]">Título principal</label>
                  <input
                    type="text"
                    value={promoPressOnForm.promoDetailsTitle}
                    onChange={(e) => setPromoPressOnForm((p) => ({ ...p, promoDetailsTitle: e.target.value }))}
                    placeholder="Ej: TÉRMINOS Y CONDICIONES (PRESS ON EN PROMOCIÓN)"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                  />
                </div>

                <div className="space-y-2">
                  {promoPressOnForm.promoDetailsBlocks.map((block, idx) => (
                    <div key={block.id} className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#8C6B1C]">
                          Bloque {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPromoPressOnForm((p) => ({
                              ...p,
                              promoDetailsBlocks: p.promoDetailsBlocks.filter((_, i) => i !== idx),
                            }))
                          }
                          className="p-1.5 rounded-lg text-[#A65B5B] hover:bg-[#F7E9E9] cursor-pointer transition-colors"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={block.title}
                        onChange={(e) =>
                          setPromoPressOnForm((p) => ({
                            ...p,
                            promoDetailsBlocks: p.promoDetailsBlocks.map((b, i) => (i === idx ? { ...b, title: e.target.value } : b)),
                          }))
                        }
                        placeholder="Título del bloque"
                        className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                      />
                      <textarea
                        rows={3}
                        value={block.content}
                        onChange={(e) =>
                          setPromoPressOnForm((p) => ({
                            ...p,
                            promoDetailsBlocks: p.promoDetailsBlocks.map((b, i) => (i === idx ? { ...b, content: e.target.value } : b)),
                          }))
                        }
                        placeholder="Texto o viñetas (una por línea). Usa **negrita** para resaltar."
                        className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed"
                      />
                      <label className="flex items-center gap-2 text-[10px] font-['Marcellus'] text-[#7A6655] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!block.bulleted}
                          onChange={(e) =>
                            setPromoPressOnForm((p) => ({
                              ...p,
                              promoDetailsBlocks: p.promoDetailsBlocks.map((b, i) => (i === idx ? { ...b, bulleted: e.target.checked } : b)),
                            }))
                          }
                          className="w-3.5 h-3.5 accent-[#5D3704] rounded"
                        />
                        Mostrar como lista de viñetas
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPromoPressOnForm((p) => ({
                      ...p,
                      promoDetailsBlocks: [
                        ...p.promoDetailsBlocks,
                        { id: `block_${Date.now()}`, title: '', content: '', bulleted: false },
                      ],
                    }))
                  }
                  className="w-full py-2.5 px-4 rounded-xl border border-[#C89D3C]/60 bg-[#FAF4E6] hover:bg-[#FFFDF8] text-[#5C3A1E] text-xs font-['Cinzel'] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>+ Añadir bloque</span>
                </button>
              </div>

              {/* INTERACTIVE SELECTION CARDS WITH FINE GOLDEN BORDER (NO CHECKBOXES / NO BRACKET TEXT - REQUERIMIENTO 7 & 8) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8DEC9]">
                <button
                  type="button"
                  onClick={() => setPromoPressOnForm((p) => ({ ...p, isTrending: !p.isTrending }))}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    promoPressOnForm.isTrending
                      ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.3)] text-[#5D3704]'
                      : 'bg-white/80 border-[#DFD1BD] hover:border-[#D4AF37] text-[#7A6655]'
                  }`}
                >
                  <span className="font-['Cinzel'] font-bold text-xs">◈ Tendencia Coreana</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    promoPressOnForm.isTrending ? 'bg-[#5D3704] text-white border-[#D4AF37]' : 'border-[#CBD5E1] bg-white'
                  }`}>
                    {promoPressOnForm.isTrending ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPromoPressOnForm((p) => ({ ...p, isBestSeller: !p.isBestSeller }))}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    promoPressOnForm.isBestSeller
                      ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.3)] text-[#5D3704]'
                      : 'bg-white/80 border-[#DFD1BD] hover:border-[#D4AF37] text-[#7A6655]'
                  }`}
                >
                  <span className="font-['Cinzel'] font-bold text-xs">✧ Más Vendido</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    promoPressOnForm.isBestSeller ? 'bg-[#5D3704] text-white border-[#D4AF37]' : 'border-[#CBD5E1] bg-white'
                  }`}>
                    {promoPressOnForm.isBestSeller ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPromoPressOnForm((p) => ({ ...p, featured: !p.featured }))}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    promoPressOnForm.featured
                      ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.3)] text-[#5D3704]'
                      : 'bg-white/80 border-[#DFD1BD] hover:border-[#D4AF37] text-[#7A6655]'
                  }`}
                >
                  <span className="font-['Cinzel'] font-bold text-xs">✨ Destacar en Inicio</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    promoPressOnForm.featured ? 'bg-[#5D3704] text-white border-[#D4AF37]' : 'border-[#CBD5E1] bg-white'
                  }`}>
                    {promoPressOnForm.featured ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPromoPressOnForm((p) => ({ ...p, active: !p.active }))}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    promoPressOnForm.active
                      ? 'bg-[#5D3704]/10 border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.3)] text-[#5D3704]'
                      : 'bg-white/80 border-[#DFD1BD] hover:border-[#D4AF37] text-[#7A6655]'
                  }`}
                >
                  <span className="font-['Cinzel'] font-bold text-xs">🌟 Promoción Activa</span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    promoPressOnForm.active ? 'bg-[#5D3704] text-white border-[#D4AF37]' : 'border-[#CBD5E1] bg-white'
                  }`}>
                    {promoPressOnForm.active ? '✓' : ''}
                  </span>
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPromoPressOnModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-[#D5C6B1] text-xs font-['Cinzel'] font-bold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>{editingPromoPressOnId ? 'Guardar Modificación' : 'Grabar Press On Promoción'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT APPOINTMENT (GRABAR & MODIFICAR CITAS) */}
      {/* ========================================================= */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8DEC9] bg-[#F5EFE6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C29D38]" />
                <h3 className="text-lg font-display font-bold text-[#302117]">
                  {editingAppointmentId ? 'Modificar Cita de la Agenda' : 'Grabar Nueva Cita en la Agenda'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAppointmentModal(false)}
                className="p-1.5 text-[#7A6655] hover:text-[#2E2017] rounded-lg hover:bg-[#EAE0D0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">
                    Nombre de la Clienta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Luciana Morales"
                    value={appointmentForm.clientName}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, clientName: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">
                    Teléfono WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+51 987 654 321"
                    value={appointmentForm.clientPhone}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, clientPhone: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">
                    Instagram de la Clienta (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="@usuario"
                    value={appointmentForm.clientInstagram}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, clientInstagram: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Tipo de Servicio</label>
                  <select
                    value={appointmentForm.serviceType}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, serviceType: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  >
                    <option value="promotion">Promoción Catálogo (S/. 60)</option>
                    <option value="custom">Servicio Personalizado</option>
                    <option value="removal">Retiro de Sistema & Spa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#48372A] mb-1">
                  Detalle / Diseño Seleccionado
                </label>
                {appointmentForm.serviceType === 'promotion' ? (
                  <select
                    value={appointmentForm.promoDesignTitle}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, promoDesignTitle: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  >
                    {promoDesigns.map((d) => (
                      <option key={d.id} value={d.title}>
                        {d.title} ({d.collection})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Ej: Set Almendra Polygel con Lazos y Cristales"
                    value={appointmentForm.promoDesignTitle}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, promoDesignTitle: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Fecha de la Cita</label>
                  <input
                    type="date"
                    required
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Horario (Lima GMT -05)</label>
                  <select
                    value={appointmentForm.timeSlot}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, timeSlot: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="07:30 PM">07:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Modalidad</label>
                  <select
                    value={appointmentForm.locationType}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, locationType: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  >
                    <option value="studio">En Estudio (Surco)</option>
                    <option value="home">A Domicilio</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Estado de la Cita</label>
                  <select
                    value={appointmentForm.status}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, status: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-semibold"
                  >
                    <option value="pending_deposit">Esperando Adelanto</option>
                    <option value="confirmed">Confirmada (Adelanto OK)</option>
                    <option value="completed">Atendida</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>

              {appointmentForm.locationType === 'home' && (
                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Dirección a Domicilio</label>
                  <input
                    type="text"
                    placeholder="Distrito, Calle, Número y Referencia"
                    value={appointmentForm.homeAddress}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, homeAddress: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Total (S/.)</label>
                  <input
                    type="number"
                    value={appointmentForm.totalPrice}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, totalPrice: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Adelanto (S/.)</label>
                  <input
                    type="number"
                    value={appointmentForm.depositRequired}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, depositRequired: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#48372A] mb-1">Medio Adelanto</label>
                  <select
                    value={appointmentForm.paymentMethod}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, paymentMethod: e.target.value as any }))}
                    className="w-full p-2 rounded-xl border border-[#DDD1BF] bg-white text-xs uppercase"
                  >
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="bcp">BCP (Transferencia)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="depositPaidCheck"
                  checked={appointmentForm.depositPaid}
                  onChange={(e) => setAppointmentForm((p) => ({ ...p, depositPaid: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230]"
                />
                <label htmlFor="depositPaidCheck" className="text-xs font-semibold text-[#302117] cursor-pointer">
                  Adelanto verificado y recibido en cuenta bancaria
                </label>
              </div>

              <div>
                <label className="block font-semibold text-[#48372A] mb-1">
                  Notas Especiales de la Clienta
                </label>
                <textarea
                  rows={2}
                  placeholder="Preferencias de color, diseño previo, requerimientos especiales..."
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>{editingAppointmentId ? 'Guardar Modificación de Cita' : 'Grabar Cita en Agenda'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL PRESS ON: ADD / EDIT SET PRESS ON (ADMIN) */}
      {/* ========================================================= */}
      {showPressOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowPressOnModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#5D3704] hover:bg-[#EAE0D0] rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704] block">
                Catálogo Press On Nails
              </span>
              <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                {editingPressOnId ? 'Modificar Set e Imagen' : 'Agregar Nuevo Set al Catálogo'}
              </h3>
              <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                Configura la foto del set, precio, tipo de punta sugerida y descripciones.
              </p>
            </div>

            <form onSubmit={handleSavePressOn} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Image Upload & Preview */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD1BF] space-y-3">
                <label className="block font-semibold text-[#5D3704]">
                  Foto del Set (Autoconfigurable desde dispositivo o URL) *
                </label>
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-2xl border border-[#DDD1BF] overflow-hidden bg-[#F0E6D8] shrink-0 relative">
                    {pressOnForm.image ? (
                      <img src={pressOnForm.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#5D3704]/60 text-center p-1 font-['Cinzel']">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="py-2.5 px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>Subir Foto del Dispositivo</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        onChange={handlePressOnImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={pressOnForm.image}
                      onChange={(e) => setPressOnForm((p) => ({ ...p, image: e.target.value }))}
                      placeholder="O pega el link/URL de la imagen aquí"
                      className="w-full p-2 text-xs bg-[#FAF7F2] border border-[#DDD1BF] rounded-xl text-[#5D3704]"
                    />
                  </div>
                </div>
              </div>

              {/* Set Name */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Nombre del Set *</label>
                <input
                  type="text"
                  required
                  value={pressOnForm.name}
                  onChange={(e) => setPressOnForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: VELVET CAT-EYE & CROMO"
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                />
              </div>

              {/* Price & Suggested Tip & Included Kit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Precio (S/.) *</label>
                  <input
                    type="number"
                    required
                    min={20}
                    step={5}
                    value={pressOnForm.price}
                    onChange={(e) => setPressOnForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Punta Sugerida</label>
                  <select
                    value={pressOnForm.defaultTip}
                    onChange={(e) => setPressOnForm((p) => ({ ...p, defaultTip: e.target.value as TipType }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704] font-['Cinzel']"
                  >
                    <option value="almendra">Almendra (Almond)</option>
                    <option value="stiletto">Stiletto</option>
                    <option value="coffin">Coffin (Bailarina)</option>
                    <option value="square">Square (Cuadrada)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Kit Incluido de Regalo *</label>
                  <select
                    value={pressOnForm.includedKit || 'standard'}
                    onChange={(e) => setPressOnForm((p) => ({ ...p, includedKit: e.target.value as 'standard' | 'premium' }))}
                    className="w-full p-2.5 rounded-xl border border-[#D4AF37]/60 bg-white text-xs text-[#5D3704] font-['Cinzel'] font-bold focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-colors"
                  >
                    <option value="standard">Kit Standard (Incluido Gratis)</option>
                    <option value="premium">Kit Premium (Incluido Gratis)</option>
                  </select>
                </div>
              </div>

              {/* Stock & Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-2xl border border-[#DDD1BF]">
                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pressOnForm.stock}
                    onChange={(e) => setPressOnForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="pressOnTrending"
                    checked={pressOnForm.isTrending}
                    onChange={(e) => setPressOnForm((p) => ({ ...p, isTrending: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#B89230]"
                  />
                  <label htmlFor="pressOnTrending" className="text-xs font-semibold text-[#5D3704] cursor-pointer">
                    ◈ Tendencia Coreana
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="pressOnBestSeller"
                    checked={pressOnForm.isBestSeller}
                    onChange={(e) => setPressOnForm((p) => ({ ...p, isBestSeller: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#B89230]"
                  />
                  <label htmlFor="pressOnBestSeller" className="text-xs font-semibold text-[#5D3704] cursor-pointer">
                    ✧ Más Vendido
                  </label>
                </div>
              </div>

              {/* Size Stock Management for this Set */}
              <div className="p-3 bg-white rounded-2xl border border-[#DDD1BF] space-y-2">
                <label className="block font-semibold text-[#5D3704] text-xs">
                  Disponibilidad de Tallas para este Set (Stock) *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['XS', 'S', 'M', 'L'] as const).map((sz) => {
                    const isAvail = pressOnForm.sizeStock?.[sz] ?? true;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() =>
                          setPressOnForm((p) => ({
                            ...p,
                            sizeStock: {
                              ...p.sizeStock,
                              [sz]: !isAvail,
                            },
                          }))
                        }
                        className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer text-xs font-['Cinzel'] font-bold flex flex-col items-center justify-center ${
                          isAvail
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-rose-50 border-rose-300 text-rose-800 line-through opacity-70'
                        }`}
                      >
                        <span>Talla {sz}</span>
                        <span className="text-[9px] font-sans no-underline font-semibold block mt-0.5">
                          {isAvail ? 'Disponible ✓' : 'Agotado ✕'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">
                  Descripción Corta (Visible en tarjeta de catálogo) *
                </label>
                <input
                  type="text"
                  required
                  value={pressOnForm.shortDesc}
                  onChange={(e) => setPressOnForm((p) => ({ ...p, shortDesc: e.target.value }))}
                  placeholder="Ej: Diseño magnético aterciopelado con reflejos dorados y relieves 3D..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">
                  Descripción Completa (Detalles, materiales, geles)
                </label>
                <textarea
                  rows={3}
                  value={pressOnForm.fullDesc}
                  onChange={(e) => setPressOnForm((p) => ({ ...p, fullDesc: e.target.value }))}
                  placeholder="Detalles sobre materiales, geles de alta densidad, relieves 3D, cruz gótica o acabados..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                />
              </div>

              {/* Destacar en Carrusel de Inicio */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F5EBE1] border border-[#D4AF37]/50">
                <input
                  type="checkbox"
                  id="pressOnCarouselCheck"
                  checked={pressOnForm.featuredInCarousel}
                  onChange={(e) => setPressOnForm((p) => ({ ...p, featuredInCarousel: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                />
                <label htmlFor="pressOnCarouselCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5 flex-wrap">
                  <span className="font-['Cinzel'] font-bold">✨ Destacar en Carrusel de Inicio</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Mostrar en la vitrina interactiva superior de bienvenida)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPressOnModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>{editingPressOnId ? 'Guardar Modificación' : 'Grabar Set en Catálogo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD / EDIT SERVICIO ADICIONAL (ADMIN) */}
      {/* ========================================================= */}
      {showAdditionalModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAdditionalModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#5D3704] hover:bg-[#EAE0D0] rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
              {editingAdditionalId ? 'Modificar Servicio Adicional' : 'Nuevo Servicio Adicional'}
            </h3>
            <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5 mb-4">
              Configura el concepto, categoría y precio en soles.
            </p>

            <form onSubmit={handleSaveAdditional} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  value={additionalForm.name}
                  onChange={(e) => setAdditionalForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Retiro de acrílico, Par de dijes 🎀, Baño de Parafina..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Precio (S/.) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1}
                  value={additionalForm.price}
                  onChange={(e) => setAdditionalForm((p) => ({ ...p, price: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Categoría *</label>
                <select
                  value={additionalForm.targetSection || 'both'}
                  onChange={(e) =>
                    setAdditionalForm((p) => ({
                      ...p,
                      targetSection: e.target.value as 'servicios' | 'press_on' | 'both',
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-semibold text-[#5D3704]"
                >
                  <option value="both">S & P (Servicios & Press On - Aplica en Ambas Secciones)</option>
                  <option value="servicios">Servicios (Aplica únicamente a 'Nuestros Servicios')</option>
                  <option value="press_on">Press On (Aplica únicamente al flujo 'Press On')</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Descripción Informativa</label>
                <textarea
                  rows={2}
                  value={additionalForm.description}
                  onChange={(e) => setAdditionalForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Breve descripción del procedimiento o materiales..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Etiqueta de Servicio Adicional (Opcional)</label>
                  <input
                    type="text"
                    value={additionalForm.categoryLabel}
                    onChange={(e) => setAdditionalForm((p) => ({ ...p, categoryLabel: e.target.value }))}
                    placeholder="Ej: Mantenimiento & Retiros, Diseños con Sistema..."
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Distintivo / Badge (Opcional)</label>
                  <input
                    type="text"
                    value={additionalForm.badge}
                    onChange={(e) => setAdditionalForm((p) => ({ ...p, badge: e.target.value }))}
                    placeholder="Ej: Popular, Tendencia, Frecuente..."
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="additionalActiveCheck"
                  checked={additionalForm.active}
                  onChange={(e) => setAdditionalForm((p) => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#5D3704]"
                />
                <label htmlFor="additionalActiveCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer">
                  Activo (Visible para las clientas en el modal de adicionales y agendamiento)
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdditionalModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>Guardar Servicio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL SERVICES: ADD / EDIT SERVICE (ADMIN) */}
      {/* ========================================================= */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowServiceModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#5D3704] hover:bg-[#EAE0D0] rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704] block">
                Catálogo de Nuestros Servicios
              </span>
              <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                {editingServiceId ? 'Modificar Servicio' : 'Agregar Nuevo Servicio'}
              </h3>
              <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                Configura la foto, título, etiqueta, precio base y descripción detallada del sistema.
              </p>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Image Upload & Preview */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD1BF] space-y-3">
                <label className="block font-semibold text-[#5D3704]">
                  Foto del Servicio (Subir desde archivo o pegando URL) *
                </label>
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-2xl border border-[#DDD1BF] overflow-hidden bg-[#F0E6D8] shrink-0 relative">
                    {serviceForm.image ? (
                      <img src={serviceForm.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#5D3704]/60 text-center p-1 font-['Cinzel']">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="py-2.5 px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>Subir Foto del Dispositivo</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        onChange={handleServiceImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={serviceForm.image}
                      onChange={(e) => setServiceForm((p) => ({ ...p, image: e.target.value }))}
                      placeholder="O pega el link/URL de la imagen aquí"
                      className="w-full p-2 text-xs bg-[#FAF7F2] border border-[#DDD1BF] rounded-xl text-[#5D3704]"
                    />
                  </div>
                </div>
              </div>

              {/* Service Title */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Softgel, Polygel, Kapping Gel..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                />
              </div>

              {/* Tag & Price Label */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Etiqueta Superior *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.tag}
                    onChange={(e) => setServiceForm((p) => ({ ...p, tag: e.target.value }))}
                    placeholder="Ej: Tips Completos de Gel"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Precio Base / Etiqueta *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.priceLabel}
                    onChange={(e) => setServiceForm((p) => ({ ...p, priceLabel: e.target.value }))}
                    placeholder="Ej: Desde S/. 60"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">
                  Descripción Detallada (Aparece dentro del Modal de Reserva) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Explica las características del sistema, materiales, durabilidad y ventajas..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                />
              </div>

              {/* Tarifas: interfaz dedicada para RETIRO DE SISTEMA Y SPA / niveles para los demás servicios */}
              {editingServiceId && (servicesCatalog.find((s) => s.id === editingServiceId)?.title || '').toLowerCase().includes('retiro') ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#E8DEC9] pb-2">
                    <Sparkles className="w-4 h-4 text-[#C89D3C]" />
                    <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704] uppercase">
                      Configuración de Retiro, Spa & Velaterapia
                    </span>
                  </div>
                  <p className="text-[10px] font-['Marcellus'] text-[#7A6655] -mt-2">
                    Estos nombres, precios y descripciones se muestran directamente en el modal de reserva de retiros de la clienta.
                  </p>

                  {/* a) Retiros Individuales */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                      a) Retiros Individuales (Nombre, Precio y Descripción)
                    </span>
                    {(serviceForm.removalOptions || []).filter((o) => o.group === 'retiros').map((opt) => (
                      <div key={opt.id} className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Nombre *</label>
                            <input
                              type="text"
                              value={opt.title}
                              onChange={(e) => updateRemovalOption(opt.id, { title: e.target.value })}
                              className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-['Cinzel'] font-bold text-[#5D3704]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Precio (S/.) *</label>
                            <input
                              type="number"
                              value={opt.price}
                              onChange={(e) => updateRemovalOption(opt.id, { price: Number(e.target.value) })}
                              className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono font-bold text-[#5D3704]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Descripción *</label>
                          <textarea
                            rows={2}
                            value={opt.desc}
                            onChange={(e) => updateRemovalOption(opt.id, { desc: e.target.value })}
                            className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* b) Servicios de Spa */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                      b) Servicios de Spa (Nombre, Precio y Descripción)
                    </span>
                    {(serviceForm.removalOptions || []).filter((o) => o.group === 'spa').map((opt) => (
                      <div key={opt.id} className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Nombre *</label>
                            <input
                              type="text"
                              value={opt.title}
                              onChange={(e) => updateRemovalOption(opt.id, { title: e.target.value })}
                              className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-['Cinzel'] font-bold text-[#5D3704]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Precio (S/.) *</label>
                            <input
                              type="number"
                              value={opt.price}
                              onChange={(e) => updateRemovalOption(opt.id, { price: Number(e.target.value) })}
                              className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono font-bold text-[#5D3704]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Descripción *</label>
                          <textarea
                            rows={2}
                            value={opt.desc}
                            onChange={(e) => updateRemovalOption(opt.id, { desc: e.target.value })}
                            className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* c) Combos Especiales */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                      c) Combos Especiales (Nombre y Precio)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(serviceForm.removalOptions || []).filter((o) => o.group === 'combos').map((opt) => (
                        <div key={opt.id} className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Nombre del Combo *</label>
                            <input
                              type="text"
                              value={opt.title}
                              onChange={(e) => updateRemovalOption(opt.id, { title: e.target.value })}
                              className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-['Cinzel'] font-bold text-[#5D3704]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Precio Especial (S/.) *</label>
                            <input
                              type="number"
                              value={opt.price}
                              onChange={(e) => updateRemovalOption(opt.id, { price: Number(e.target.value) })}
                              className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono font-bold text-[#5D3704]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-['Marcellus'] text-[#7A6655] block">
                      Los combos se muestran en la sección "PRECIO ESPECIAL" del modal de reserva (sin descripción, solo nombre y precio).
                    </span>
                  </div>
                </div>
              ) : (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-3.5">
                <div className="flex items-center gap-2 border-b border-[#E8DEC9] pb-2">
                  <Sparkles className="w-4 h-4 text-[#C89D3C]" />
                  <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704] uppercase">
                    Configuración de los 3 Niveles de Complejidad & Precios
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Nivel Sutil */}
                  <div className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                    <span className="text-xs font-bold text-[#5D3704] block border-b border-[#F0E6D8] pb-1 font-['Cinzel']">
                      Nivel Sutil
                    </span>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Nombre del Nivel *</label>
                      <input
                        type="text"
                        required
                        value={serviceForm.levelBasicTitle}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelBasicTitle: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Precio (S/.) *</label>
                      <input
                        type="number"
                        required
                        value={serviceForm.levelBasicPrice}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelBasicPrice: Number(e.target.value) }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono font-bold text-[#5D3704]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Descripción *</label>
                      <textarea
                        rows={2}
                        required
                        value={serviceForm.levelBasicDesc}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelBasicDesc: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                      />
                    </div>
                  </div>

                  {/* Nivel Moderado */}
                  <div className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                    <span className="text-xs font-bold text-[#5D3704] block border-b border-[#F0E6D8] pb-1 font-['Cinzel']">
                      Nivel Moderado
                    </span>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Nombre del Nivel *</label>
                      <input
                        type="text"
                        required
                        value={serviceForm.levelModerateTitle}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelModerateTitle: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Precio (S/.) *</label>
                      <input
                        type="number"
                        required
                        value={serviceForm.levelModeratePrice}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelModeratePrice: Number(e.target.value) }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono font-bold text-[#5D3704]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Descripción *</label>
                      <textarea
                        rows={2}
                        required
                        value={serviceForm.levelModerateDesc}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelModerateDesc: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                      />
                    </div>
                  </div>

                  {/* Nivel Complejo */}
                  <div className="p-3 bg-white rounded-xl border border-[#DFD1BD] space-y-2">
                    <span className="text-xs font-bold text-[#5D3704] block border-b border-[#F0E6D8] pb-1 font-['Cinzel']">
                      Nivel Complejo
                    </span>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Nombre del Nivel *</label>
                      <input
                        type="text"
                        required
                        value={serviceForm.levelComplexTitle}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelComplexTitle: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Precio (S/.) *</label>
                      <input
                        type="number"
                        required
                        value={serviceForm.levelComplexPrice}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelComplexPrice: Number(e.target.value) }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg font-mono font-bold text-[#5D3704]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#5D3704] mb-0.5">Descripción *</label>
                      <textarea
                        rows={2}
                        required
                        value={serviceForm.levelComplexDesc}
                        onChange={(e) => setServiceForm((p) => ({ ...p, levelComplexDesc: e.target.value }))}
                        className="w-full p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="serviceActiveCheck"
                  checked={serviceForm.active}
                  onChange={(e) => setServiceForm((p) => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230]"
                />
                <label htmlFor="serviceActiveCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer">
                  Visible e interactivo en la sección &quot;NUESTROS SERVICIOS&quot;
                </label>
              </div>

              {/* Destacar en Carrusel de Inicio */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F5EBE1] border border-[#D4AF37]/50">
                <input
                  type="checkbox"
                  id="serviceCarouselCheck"
                  checked={serviceForm.featuredInCarousel}
                  onChange={(e) => setServiceForm((p) => ({ ...p, featuredInCarousel: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                />
                <label htmlFor="serviceCarouselCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5 flex-wrap">
                  <span className="font-['Cinzel'] font-bold">✨ Destacar en Carrusel de Inicio</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Mostrar en la vitrina interactiva superior de bienvenida)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>{editingServiceId ? 'Guardar Modificación' : 'Grabar Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3.5: GESTIÓN DE DISPONIBILIDAD & TIEMPOS DE ENTREGA */}
      {/* ========================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E8DEC9] bg-[#F5EFE6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#5D3704]" />
                <h3 className="text-base sm:text-lg font-['Cinzel'] font-bold text-[#5D3704]">
                  Gestión de Disponibilidad & Tiempos de Entrega
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 text-[#7A6655] hover:text-[#2E2017] rounded-lg hover:bg-[#EAE0D0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex border-b border-[#E8DEC9] bg-[#EFE7DC] px-4 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleTab('disabled_days')}
                className={`py-2 px-4 rounded-t-xl text-xs font-['Cinzel'] font-bold transition-all cursor-pointer ${
                  scheduleTab === 'disabled_days'
                    ? 'bg-[#FAF7F2] text-[#5D3704] border-t-2 border-[#5D3704] shadow-xs'
                    : 'text-[#7A6655] hover:bg-[#E2D7C7]'
                }`}
              >
                📅 Días Libres (Citas Presenciales)
              </button>
              <button
                type="button"
                onClick={() => setScheduleTab('crafting_times')}
                className={`py-2 px-4 rounded-t-xl text-xs font-['Cinzel'] font-bold transition-all cursor-pointer ${
                  scheduleTab === 'crafting_times'
                    ? 'bg-[#FAF7F2] text-[#5D3704] border-t-2 border-[#5D3704] shadow-xs'
                    : 'text-[#7A6655] hover:bg-[#E2D7C7]'
                }`}
              >
                📦 Tiempos de Confección (Press On Nails)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-[#5D3704]">
              {scheduleTab === 'disabled_days' ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-[#F5EBE1] border border-[#D5C6B1] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-['Cinzel'] font-bold block text-xs">
                        Gestión Dual: Bloqueo de Días y Horarios Específicos
                      </span>
                      <p className="font-['Marcellus'] text-[11px] text-[#5D3704]/80">
                        Selecciona cualquier fecha en el calendario para inhabilitar el día completo o gestionar sus bloques horarios individuales.
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-[#D5C6B1] shrink-0">
                      {tempDisabledDates.length} Días Enteros Bloqueados
                    </span>
                  </div>

                  {/* 2 Months Calendar Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0, 1].map((offset) => {
                      const d = new Date(calendarViewMonth.getFullYear(), calendarViewMonth.getMonth() + offset, 1);
                      const year = d.getFullYear();
                      const month = d.getMonth();
                      const monthName = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDayOfWeek = new Date(year, month, 1).getDay();

                      return (
                        <div key={offset} className="bg-white p-3.5 rounded-2xl border border-[#E3D6C3] space-y-2">
                          <h4 className="font-['Cinzel'] font-bold text-center text-xs uppercase text-[#5D3704] pb-1 border-b border-[#E8DEC9]">
                            {monthName}
                          </h4>

                          <div className="grid grid-cols-7 gap-1 text-center font-['Cinzel'] font-bold text-[9px] text-[#7A6655] py-1">
                            <span>Do</span>
                            <span>Lu</span>
                            <span>Ma</span>
                            <span>Mi</span>
                            <span>Ju</span>
                            <span>Vi</span>
                            <span>Sá</span>
                          </div>

                          <div className="grid grid-cols-7 gap-1 text-center font-mono">
                            {/* Empty offset cells */}
                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                              <div key={`empty-${i}`} className="h-7" />
                            ))}

                            {/* Month Days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const dayNum = i + 1;
                              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                              const isDisabled = tempDisabledDates.includes(iso);
                              const isSelected = selectedCalendarDate === iso;
                              const disabledSlotCount = (tempDisabledTimeSlots[iso] || []).length;

                              return (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCalendarDate(iso);
                                  }}
                                  className={`h-8 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer border relative ${
                                    isDisabled
                                      ? 'bg-rose-100 border-rose-400 text-rose-800 line-through font-bold shadow-2xs'
                                      : isSelected
                                      ? 'bg-[#5D3704] text-white border-[#5D3704] ring-2 ring-[#C29D38]'
                                      : 'bg-[#FAF7F2] hover:bg-[#F5EBE1] border-[#E3D6C3] text-[#5D3704]'
                                  }`}
                                  title={
                                    isDisabled
                                      ? 'Día Libre (Bloqueado por completo)'
                                      : disabledSlotCount > 0
                                      ? `${disabledSlotCount} horario(s) bloqueado(s)`
                                      : 'Fecha seleccionada'
                                  }
                                >
                                  <span>{dayNum}</span>
                                  {!isDisabled && disabledSlotCount > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute bottom-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Panel de Control de Horarios para la Fecha Seleccionada */}
                  {selectedCalendarDate && (
                    <div className="p-4 rounded-2xl bg-white border border-[#5D3704]/25 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E6D8] pb-2.5">
                        <div>
                          <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C] uppercase tracking-wider block">
                            Control de Horarios Específicos para:
                          </span>
                          <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704] flex items-center gap-2 flex-wrap">
                            <span>📅 {selectedCalendarDate} <span className="capitalize font-['Marcellus'] font-normal text-xs text-[#8C6B1C]">({formatHumanLocalDate(selectedCalendarDate)})</span></span>
                            {tempDisabledDates.includes(selectedCalendarDate) && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono">
                                ¡Día Completo Bloqueado!
                              </span>
                            )}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleDisabledDate(selectedCalendarDate)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-['Cinzel'] font-bold transition-all cursor-pointer border ${
                            tempDisabledDates.includes(selectedCalendarDate)
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                              : 'bg-rose-700 hover:bg-rose-800 text-white border-rose-800'
                          }`}
                        >
                          {tempDisabledDates.includes(selectedCalendarDate)
                            ? '✓ Habilitar Día Completo'
                            : '🚫 Bloquear Día Completo (Cerrado)'}
                        </button>
                      </div>

                      {/* Toggles de Bloqueo de Horarios Individuales */}
                      <div>
                        <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#7A6655] block mb-2">
                          Marcar / Desmarcar Horarios Bloqueados Individuales para esta fecha:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                          {['07:00 AM', '09:30 AM', '12:00 PM', '02:30 PM', '05:00 PM', '07:30 PM'].map((slot) => {
                            const isSlotDisabled = (tempDisabledTimeSlots[selectedCalendarDate] || []).includes(slot);
                            const isDayDisabled = tempDisabledDates.includes(selectedCalendarDate);

                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isDayDisabled}
                                onClick={() => handleToggleDisabledTimeSlot(selectedCalendarDate, slot)}
                                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-between gap-1 ${
                                  isDayDisabled
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                    : isSlotDisabled
                                    ? 'bg-rose-100 border-rose-400 text-rose-800 line-through'
                                    : 'bg-[#FAF7F2] hover:bg-[#F5EBE1] border-[#E3D6C3] text-[#5D3704]'
                                }`}
                              >
                                <span>{slot}</span>
                                <span className="text-[10px] font-['Cinzel']">
                                  {isDayDisabled ? 'Cerrado' : isSlotDisabled ? '🚫 Bloqueado' : '✓ Libre'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Modalidad de Atención por Fecha */}
                      <div className="space-y-2 pt-2 border-t border-[#F0E6D8]">
                        <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#7A6655] block">
                          Modalidad de Atención para esta fecha:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'both', label: '✨ Ambos' },
                            { id: 'studio', label: '🏢 Solo Estudio' },
                            { id: 'home', label: '🚗 Solo Domicilio' },
                          ].map((opt) => {
                            const current = tempDayModality[selectedCalendarDate] || 'both';
                            const isActive = current === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setTempDayModality((prev) => ({ ...prev, [selectedCalendarDate]: opt.id as 'studio' | 'home' | 'both' }))}
                                className={`py-2 px-2 rounded-xl border text-[10px] font-['Cinzel'] font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-[#5D3704] text-white border-[#5D3704] ring-1 ring-[#C29D38]'
                                    : 'bg-[#FAF7F2] hover:bg-[#F5EBE1] border-[#E3D6C3] text-[#5D3704]'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {tempDisabledDates.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setTempDisabledDates([])}
                        className="text-[11px] font-['Cinzel'] text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Desbloquear todos los días enteros</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 2: TIEMPOS DE CONFECCIÓN PRESS ON */
                <div className="space-y-4">
                  <div className="p-3 bg-[#F5EBE1] border border-[#D5C6B1] rounded-2xl">
                    <span className="font-['Cinzel'] font-bold block text-xs mb-1">
                      Modo Activo de Confección & Entregas (Press On Nails)
                    </span>
                    <p className="font-['Marcellus'] text-[11px] text-[#5D3704]/80 leading-relaxed">
                      Selecciona el margen de tiempo activo para confeccionar y despachar los sets artesanasles. El banner correspondiente se actualizará de forma dinámica en la web de la clienta.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Modo 1: Regular */}
                    <label
                      onClick={() => setTempDeliveryMode('regular')}
                      className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        tempDeliveryMode === 'regular'
                          ? 'border-[#5D3704] bg-[#FAF7F2] ring-2 ring-[#5D3704]/30 shadow-xs'
                          : 'border-[#E3D6C3] bg-white hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-mode"
                        checked={tempDeliveryMode === 'regular'}
                        onChange={() => setTempDeliveryMode('regular')}
                        className="mt-1 accent-[#5D3704]"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">
                            1. Modo Regular (3 a 7 días hábiles) - [Por defecto]
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Estándar
                          </span>
                        </div>
                        <p className="font-['Marcellus'] text-xs text-[#5D3704]/80 leading-snug">
                          Plazos habituales de elaboración (3 a 7 días hábiles) sin mostrar banners adicionales de demora.
                        </p>
                      </div>
                    </label>

                    {/* Modo 2: Alta Demanda */}
                    <label
                      onClick={() => setTempDeliveryMode('high_demand')}
                      className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        tempDeliveryMode === 'high_demand'
                          ? 'border-[#5D3704] bg-[#FAF7F2] ring-2 ring-[#5D3704]/30 shadow-xs'
                          : 'border-[#E3D6C3] bg-white hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-mode"
                        checked={tempDeliveryMode === 'high_demand'}
                        onChange={() => setTempDeliveryMode('high_demand')}
                        className="mt-1 accent-[#5D3704]"
                      />
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">
                            2. Modo Alta Demanda (7 a 12 días hábiles)
                          </span>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            Con Aviso
                          </span>
                        </div>
                        <p className="font-['Marcellus'] text-xs text-[#5D3704]/80 leading-snug">
                          Muestra un aviso destacado de alta demanda por alto volumen de pedidos.
                        </p>
                        <div className="p-2.5 bg-amber-50 border border-amber-300/80 rounded-xl text-[11px] font-['Marcellus'] text-amber-900 leading-relaxed">
                          🔥 <strong>¡Aviso de Alta Demanda!:</strong> Debido a un alto volumen de pedidos, el tiempo estimado de confección y despacho es de 7 a 12 días hábiles. ¡Gracias por tu preferencia y confianza en mi trabajo! 💖
                        </div>
                      </div>
                    </label>

                    {/* Modo 3: Pre-Orden / Descanso */}
                    <label
                      onClick={() => setTempDeliveryMode('preorder')}
                      className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        tempDeliveryMode === 'preorder'
                          ? 'border-[#5D3704] bg-[#FAF7F2] ring-2 ring-[#5D3704]/30 shadow-xs'
                          : 'border-[#E3D6C3] bg-white hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-mode"
                        checked={tempDeliveryMode === 'preorder'}
                        onChange={() => setTempDeliveryMode('preorder')}
                        className="mt-1 accent-[#5D3704]"
                      />
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">
                            3. Modo Pre-Orden / Descanso (10 a 15 días hábiles)
                          </span>
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            Pre-Orden
                          </span>
                        </div>
                        <p className="font-['Marcellus'] text-xs text-[#5D3704]/80 leading-snug">
                          Muestra aviso de días de descanso/capacitación programando entregas de 10 a 15 días hábiles.
                        </p>
                        <div className="p-2.5 bg-purple-50 border border-purple-300/80 rounded-xl text-[11px] font-['Marcellus'] text-purple-900 leading-relaxed">
                          🔥 <strong>¡Aviso de Pre-Orden!:</strong> Estamos en días de descanso/capacitación. Tu set se confeccionará y despachará con un margen de 10 a 15 días hábiles. ¡Gracias por tu preferencia y confianza en mi trabajo! 💖
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E8DEC9] bg-[#F5EFE6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveScheduleSettings}
                className="py-2.5 px-6 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4 text-[#C89D3C]" />
                <span>Guardar Disponibilidad y Tiempos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL INVENTARIO: ADD / EDIT INVENTORY ITEM (ADMIN)       */}
      {/* ========================================================= */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowInventoryModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#5D3704] hover:bg-[#EAE0D0] rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704] block">
                Módulo de Inventario & Stock
              </span>
              <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                {editingInventoryId ? 'Modificar Producto de Inventario' : 'Registrar Nuevo Producto'}
              </h3>
              <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                Configura la foto miniatura, nombre, precio y cantidad física en stock.
              </p>
            </div>

            <form onSubmit={handleSaveInventory} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Image Upload & Preview */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD1BF] space-y-3">
                <label className="block font-semibold text-[#5D3704]">
                  Foto Miniatura del Producto *
                </label>

                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-2xl border border-[#DDD1BF] overflow-hidden bg-[#F0E6D8] shrink-0 relative shadow-2xs">
                    {inventoryForm.image ? (
                      <img
                        src={inventoryForm.image}
                        alt="Preview"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/aistudio/PO_1_f5e6a392.JPG';
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-[#5D3704]/60 text-center p-1 font-['Cinzel']">
                        <span>Sin imagen</span>
                        <span className="text-[9px] text-[#8C6B1C] mt-0.5">(Usará por defecto)</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <label className="py-2.5 px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>Subir Foto del Dispositivo</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        onChange={handleInventoryImageFileChange}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={inventoryForm.image}
                      onChange={(e) => setInventoryForm((p) => ({ ...p, image: e.target.value }))}
                      placeholder="Ingresa o pega directamente la URL de la imagen aquí"
                      className="w-full p-2 text-xs bg-[#FAF7F2] border border-[#DDD1BF] rounded-xl text-[#5D3704]"
                    />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={inventoryForm.name}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Aceite de Cutícula Rosa & Almendras"
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Precio (S/.) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={inventoryForm.price}
                    onChange={(e) => setInventoryForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Cantidad en Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={inventoryForm.stock}
                    onChange={(e) => setInventoryForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  value={inventoryForm.description}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Detalle sobre el insumo, presentación o uso..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                />
              </div>

              {/* Variantes / Fragancias del Producto */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="block font-semibold text-[#5D3704]">Variantes (Fragancias, Colores o Sabores)</label>
                    <p className="text-[10.5px] font-['Marcellus'] text-[#7A6655] mt-0.5">
                      Cada variante se mostrará como botón en la tienda. Puedes deshabilitarla para marcarla como Agotada.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInventoryForm((p) => ({ ...p, variants: [...p.variants, { id: 'v' + Date.now(), name: '', color: '#D4AF37', available: true }] }))}
                    className="shrink-0 py-1.5 px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] text-[11px] font-bold font-['Cinzel'] hover:bg-[#F2E5D5] transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C89D3C]" />
                    <span>Añadir</span>
                  </button>
                </div>

                {inventoryForm.variants.length === 0 ? (
                  <div className="w-full py-3 px-3 rounded-xl border border-dashed border-[#D4AF37]/50 bg-white/70 text-center text-[11px] text-[#7A6655] font-['Marcellus']">
                    Sin variantes configuradas para este producto.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inventoryForm.variants.map((v, idx) => (
                      <div key={v.id} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#DDD1BF]">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => setInventoryForm((p) => ({ ...p, variants: p.variants.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))}
                          placeholder="Nombre (Manzana, Lavanda, Pera...)"
                          className="flex-1 min-w-0 p-2 text-xs border border-[#DDD1BF] rounded-lg text-[#5D3704]"
                        />
                        <input
                          type="color"
                          value={v.color || '#D4AF37'}
                          onChange={(e) => setInventoryForm((p) => ({ ...p, variants: p.variants.map((x, i) => i === idx ? { ...x, color: e.target.value } : x) }))}
                          className="w-9 h-9 rounded-lg border border-[#DDD1BF] bg-white cursor-pointer p-1"
                          title="Color distintivo"
                        />
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5D3704] cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={v.available}
                            onChange={(e) => setInventoryForm((p) => ({ ...p, variants: p.variants.map((x, i) => i === idx ? { ...x, available: e.target.checked } : x) }))}
                            className="w-3.5 h-3.5 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                          />
                          {v.available ? 'Disponible' : 'Agotado'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setInventoryForm((p) => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }))}
                          className="shrink-0 p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Eliminar variante"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Opción de Canje con BeeCoins (Regla fija: 1 Sol = 1,000 BeeCoins en tienda física) */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] hover:border-[#D4AF37] space-y-2.5 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="inventoryAllowBeeCoins" className="font-semibold text-xs text-[#5D3704] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="inventoryAllowBeeCoins"
                      checked={inventoryForm.allowBeeCoins}
                      onChange={(e) => setInventoryForm((p) => ({ ...p, allowBeeCoins: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                    />
                    <span className="font-['Cinzel'] font-bold">¿Permitir pago con BeeCoins?</span>
                  </label>
                  {inventoryForm.allowBeeCoins ? (
                    <span className="text-[10px] font-['Cinzel'] font-bold bg-[#FAF4EB] text-[#8C6B1C] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/50 shadow-2xs">
                      💎 Canje Habilitado
                    </span>
                  ) : (
                    <span className="text-[10px] font-['Cinzel'] font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full border border-gray-300">
                      💵 Solo Soles / Efectivo
                    </span>
                  )}
                </div>

                {inventoryForm.allowBeeCoins ? (
                  <div className="p-2.5 rounded-xl bg-white border border-[#DDD1BF] text-[11px] font-['Marcellus'] text-[#5D3704] flex items-center justify-between">
                    <span>Equivalente en puntos (1 Sol = 1,000 BeeCoins):</span>
                    <strong className="font-mono text-xs text-[#8C6B1C] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{Math.round((Number(inventoryForm.price) || 0) * 1000).toLocaleString('es-PE')} BeeCoins</span>
                    </strong>
                  </div>
                ) : (
                  <p className="text-[10.5px] font-['Marcellus'] text-[#7A6655] italic">
                    Este producto solo se venderá en Soles (efectivo/transferencia) y no mostrará la insignia de BeeCoins en la tienda.
                  </p>
                )}
              </div>

              {/* Destacar en Carrusel de Inicio */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F5EBE1] border border-[#D4AF37]/50">
                <input
                  type="checkbox"
                  id="inventoryCarouselCheck"
                  checked={inventoryForm.featuredInCarousel}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, featuredInCarousel: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                />
                <label htmlFor="inventoryCarouselCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5 flex-wrap">
                  <span className="font-['Cinzel'] font-bold">✨ Destacar en Carrusel de Inicio</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Mostrar en la vitrina interactiva superior de bienvenida)</span>
                </label>
              </div>

              {/* Estado Activo en Tienda & Inicio */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#DFD1BD]">
                <input
                  type="checkbox"
                  id="inventoryActiveCheck"
                  checked={inventoryForm.active}
                  onChange={(e) => setInventoryForm((p) => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                />
                <label htmlFor="inventoryActiveCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5 flex-wrap">
                  <span className="font-['Cinzel'] font-bold">Producto Activo en Tienda & Inicio</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Si se desmarca, se ocultará de la tienda online y de la página principal)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>{editingInventoryId ? 'Guardar Modificación' : 'Registrar en Inventario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CURSOS: ADD / EDIT COURSE ITEM (ADMIN)               */}
      {/* ========================================================= */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowCourseModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#5D3704] hover:bg-[#EAE0D0] rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704] block">
                Módulo de Cursos & Especializaciones
              </span>
              <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704]">
                {editingCourseId ? 'Modificar Especialización / Curso' : 'Registrar Nuevo Curso'}
              </h3>
              <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                Configura la foto de portada, título, temario, precio y enlace oficial de Hotmart.
              </p>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Image Upload & Preview */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DDD1BF] space-y-3">
                <label className="block font-semibold text-[#5D3704]">
                  Foto de Portada del Curso *
                </label>

                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-2xl border border-[#DDD1BF] overflow-hidden bg-[#F0E6D8] shrink-0 relative shadow-2xs">
                    {courseForm.image ? (
                      <img
                        src={courseForm.image}
                        alt="Preview"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/src/assets/images/nail_chrome_cateye_1792392507727.jpg';
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-[#5D3704]/60 text-center p-1 font-['Cinzel']">
                        <span>Sin portada</span>
                        <span className="text-[9px] text-[#8C6B1C] mt-0.5">(Usará por defecto)</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <label className="py-2.5 px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>Subir Foto del Dispositivo</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        onChange={handleCourseImageFileChange}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={courseForm.image}
                      onChange={(e) => setCourseForm((p) => ({ ...p, image: e.target.value }))}
                      placeholder="Ingresa o pega directamente la URL de la portada"
                      className="w-full p-2 text-xs bg-[#FAF7F2] border border-[#DDD1BF] rounded-xl text-[#5D3704]"
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Título del Curso o Especialización *</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Masterclass Soft Gel & Polygel Profesional"
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                />
              </div>

              {/* Price & Price Label */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Precio Numérico (S/.) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={courseForm.price}
                    onChange={(e) => setCourseForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#5D3704] mb-1">Etiqueta de Precio Visible</label>
                  <input
                    type="text"
                    value={courseForm.priceLabel}
                    onChange={(e) => setCourseForm((p) => ({ ...p, priceLabel: e.target.value }))}
                    placeholder="Ej: S/. 120.00"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono font-bold text-[#5D3704]"
                  />
                </div>
              </div>

              {/* Hotmart URL */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>Enlace de Venta en Hotmart *</span>
                </label>
                <input
                  type="url"
                  required
                  value={courseForm.hotmartUrl}
                  onChange={(e) => setCourseForm((p) => ({ ...p, hotmartUrl: e.target.value }))}
                  placeholder="https://pay.hotmart.com/... o https://hotmart.com/..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono text-[#5D3704]"
                />
              </div>

              {/* Temario / Lo que aprenderás */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">
                  Temario: Lo que aprenderás (Escribe 1 punto o lección por cada línea)
                </label>
                <textarea
                  rows={3}
                  value={courseForm.whatYouWillLearnText}
                  onChange={(e) => setCourseForm((p) => ({ ...p, whatYouWillLearnText: e.target.value }))}
                  placeholder="Preparación perfecta de la uña natural&#10;Técnica de nivelación y aplicación rápida&#10;Sellado duradero y esmaltado impecable"
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-[#5D3704] mb-1">Descripción del Programa (Opcional)</label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Información adicional sobre el acceso de por vida, certificado oficial o comunidad..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                />
              </div>

              {/* Destacar en Carrusel de Inicio */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F5EBE1] border border-[#D4AF37]/50">
                <input
                  type="checkbox"
                  id="courseCarouselCheck"
                  checked={courseForm.featuredInCarousel}
                  onChange={(e) => setCourseForm((p) => ({ ...p, featuredInCarousel: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                />
                <label htmlFor="courseCarouselCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5 flex-wrap">
                  <span className="font-['Cinzel'] font-bold">✨ Destacar en Carrusel de Inicio</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Mostrar en la vitrina interactiva superior)</span>
                </label>
              </div>

              {/* Estado Activo en Tienda & Inicio */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#DFD1BD]">
                <input
                  type="checkbox"
                  id="courseActiveCheck"
                  checked={courseForm.active}
                  onChange={(e) => setCourseForm((p) => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                />
                <label htmlFor="courseActiveCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5 flex-wrap">
                  <span className="font-['Cinzel'] font-bold">Curso Activo en Web & Inicio</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Si se desmarca, se ocultará de la lista de cursos en la página principal)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span>{editingCourseId ? 'Guardar Modificación' : 'Registrar Curso'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: EXPERIENCIA & RESEÑAS MANAGEMENT                     */}
      {/* ========================================================= */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E7DDCE] shadow-2xs">
            <div>
              <h3 className="font-['Cinzel'] font-bold text-base text-[#5D3704] flex items-center gap-2">
                <Star className="w-4 h-4 text-[#C89D3C]" />
                <span>Gestión de Experiencia & Moderación de Reseñas ({reviewsList.length})</span>
              </h3>
              <p className="font-['Marcellus'] text-xs text-[#7A6655] mt-0.5">
                Solo se publican reseñas reales enviadas por una clienta desde su pedido o cita. No hay reseñas de ejemplo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddReview()}
                className="py-2 px-3.5 rounded-xl bg-[#5D3704]/15 hover:bg-[#5D3704]/25 border border-[#D4AF37] text-[#5D3704] text-xs font-['Cinzel'] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all shrink-0 hover:shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              >
                <Plus className="w-4 h-4 text-[#5D3704]" />
                <span>+ Agregar Reseña / Testimonio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetReviewsList();
                  triggerToast('✓ Todas las reseñas se eliminaron de forma permanente. Solo aparecerán nuevas reseñas reales.');
                }}
                className="py-2 px-3 rounded-xl border border-[#D5C6B1] bg-[#FAF7F2] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                title="Eliminar permanentemente todas las reseñas guardadas (no se volverán a crear reseñas ficticias)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8C6B1C]" />
                <span className="hidden sm:inline">Vaciar reseñas</span>
              </button>
            </div>
          </div>

          {/* 1. SECCIÓN DE MODERACIÓN: RESEÑAS PENDIENTES DE APROBACIÓN */}
          {(() => {
            const pendingReviews = reviewsList.filter((r) => r.status === 'pending' || r.active === false);
            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border-2 border-[#D4AF37] space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#FAF4EB] border border-[#D4AF37] text-[#8C6B1C]">
                      <Clock className="w-5 h-5 text-[#C89D3C]" />
                    </span>
                    <div>
                      <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704] uppercase flex items-center gap-2">
                        <span>Reseñas Recibidas / Pendientes de Aprobación</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#5D3704] text-[#FAF7F2] text-xs font-mono">
                          {pendingReviews.length}
                        </span>
                      </h4>
                      <p className="font-['Marcellus'] text-xs text-[#5D3704]/80">
                        Testimonios enviados por las clientas desde su historial. Revisa y aprueba para publicar en la página principal.
                      </p>
                    </div>
                  </div>
                </div>

                {pendingReviews.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/80 border border-amber-200 text-center text-xs font-['Marcellus'] text-[#5D3704]/70">
                    ✓ No hay reseñas pendientes por moderar en este momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingReviews.map((rev) => {
                      const hasMedia = Boolean(rev.mediaUrl && rev.mediaUrl.trim() !== '' && rev.mediaUrl !== 'none' && rev.mediaUrl !== 'no-image' && rev.mediaUrl !== 'undefined' && rev.mediaUrl !== '/assets/aistudio/PO_1_f5e6a392.JPG');
                      return (
                        <div
                          key={rev.id}
                          className="p-4 rounded-2xl bg-white border border-[#D4AF37] shadow-sm flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            {hasMedia ? (
                              <>
                                <div className="relative aspect-16/9 rounded-xl bg-black overflow-hidden border border-[#D4AF37]/50">
                                  <img src={rev.mediaUrl} alt={rev.clientName} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex items-center justify-between">
                                  <h5 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                                    {rev.clientName}
                                  </h5>
                                  <div className="flex items-center gap-0.5">
                                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                      <Star key={i} className="w-3.5 h-3.5 fill-[#FDE047] text-[#FDE047] drop-shadow-[0_0_6px_rgba(253,224,71,0.6)]" />
                                    ))}
                                  </div>
                                </div>

                                {rev.serviceName && (
                                  <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8DEC9] inline-block">
                                    {rev.serviceName}
                                  </span>
                                )}

                                <p className="font-['Marcellus'] text-xs text-[#5D3704] italic bg-[#FAF7F2] p-2.5 rounded-xl border border-[#DFD1BD]/50">
                                  "{rev.comment}"
                                </p>
                              </>
                            ) : (
                              /* Reseña sin imagen: Comienza directo con etiqueta del servicio, estrellas, comentario y nombre */
                              <div className="space-y-2">
                                {/* 1. Etiqueta del servicio */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#E8DEC9] inline-block">
                                    {rev.serviceName || 'Servicio Gabee Studio'}
                                  </span>
                                  <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                    Pendiente
                                  </span>
                                </div>

                                {/* 2. Estrellas */}
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-[#FDE047] text-[#FDE047] drop-shadow-[0_0_6px_rgba(253,224,71,0.6)]" />
                                  ))}
                                </div>

                                {/* 3. Comentario */}
                                <p className="font-['Marcellus'] text-xs text-[#5D3704] italic bg-[#FAF7F2] p-2.5 rounded-xl border border-[#DFD1BD]/50">
                                  "{rev.comment}"
                                </p>

                                {/* 4. Nombre */}
                                <div className="pt-0.5">
                                  <h5 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                                    {rev.clientName}
                                  </h5>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-end gap-2 border-t border-amber-200">
                            <button
                              type="button"
                              onClick={() => {
                                updateReviewItem(rev.id, { status: 'approved', active: true });
                                triggerToast(`✓ Reseña de ${rev.clientName} aprobada y publicada en la web.`);
                              }}
                              className="py-1.5 px-3.5 rounded-xl bg-[#5D3704]/20 hover:bg-[#5D3704]/30 text-[#5D3704] border border-[#D4AF37] text-xs font-['Cinzel'] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                              <span>APROBAR & PUBLICAR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                deleteReviewItem(rev.id);
                                triggerToast(`✓ Reseña descartada.`);
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-['Cinzel'] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>RECHAZAR</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. RESEÑAS PUBLICADAS EN LA WEB */}
          <div className="space-y-3">
            <h4 className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#8C6B1C] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Reseñas Publicadas en la Web ({reviewsList.filter(r => r.active !== false && r.status !== 'pending').length})</span>
            </h4>

            {reviewsList.filter(r => r.active !== false && r.status !== 'pending').length === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-10 px-6 bg-[#FAF7F2]/70 rounded-2xl border border-[#E7DDCE] space-y-2 shadow-2xs">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#FAF4EB] border border-[#D4AF37]/50 mb-1">
                  <Sparkles className="w-5 h-5 text-[#C89D3C]" />
                </span>
                <p className="font-['Cinzel'] font-bold text-sm text-[#5D3704] tracking-wide">
                  Aún no hay reseñas publicadas
                </p>
                <p className="font-['Marcellus'] text-xs text-[#7A6655] leading-relaxed max-w-md mx-auto">
                  Por el momento todavía no hay reseñas publicadas. Aquí solo aparecerán testimonios
                  reales cuando una clienta los envíe por un pedido o cita.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviewsList.filter(r => r.active !== false && r.status !== 'pending').map((rev) => {
                  const hasMedia = Boolean(rev.mediaUrl && rev.mediaUrl.trim() !== '' && rev.mediaUrl !== 'none' && rev.mediaUrl !== 'no-image' && rev.mediaUrl !== 'undefined' && rev.mediaUrl !== '/assets/aistudio/PO_1_f5e6a392.JPG');
                  return (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-white border border-[#E7DDCE] shadow-2xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-3">
                        {hasMedia ? (
                          <>
                            {/* Media Preview & Badges */}
                            <div className="relative aspect-16/9 rounded-xl bg-[#F0E6D8] overflow-hidden border border-[#E3D6C3] flex items-center justify-center">
                              <img
                                src={rev.mediaUrl}
                                alt={rev.clientName}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 bg-white/80 text-[#5D3704] border border-[#C5A059]/40 text-[9px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                <ImageIcon className="w-2.5 h-2.5 text-[#C89D3C]" />
                                {(rev.mediaUrl && (rev.mediaUrl.toLowerCase().includes('.gif') || rev.mediaUrl.startsWith('data:image/gif'))) ? 'GIF Animado' : 'Imagen'}
                              </span>
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9.5px] font-['Cinzel'] font-bold uppercase shadow-2xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Publicada
                              </span>
                            </div>

                            {/* Title / Name & Service */}
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                                  {rev.clientName}
                                </h4>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-[#FDE047] text-[#FDE047] drop-shadow-[0_0_6px_rgba(253,224,71,0.6)]" />
                                  ))}
                                </div>
                              </div>

                              {rev.serviceName && (
                                <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8DEC9] inline-block mt-1">
                                  {rev.serviceName}
                                </span>
                              )}
                            </div>

                            {/* Comment */}
                            <p className="font-['Marcellus'] text-xs text-[#5D3704]/90 leading-relaxed line-clamp-3 italic">
                              "{rev.comment}"
                            </p>
                          </>
                        ) : (
                          /* Reseña sin imagen: Comienza directo con etiqueta del servicio, estrellas, comentario y nombre */
                          <div className="space-y-2.5">
                            {/* 1. Etiqueta del servicio */}
                            <div className="flex items-center justify-between gap-2">
                              {rev.serviceName ? (
                                <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#E8DEC9] inline-block">
                                  {rev.serviceName}
                                </span>
                              ) : (
                                <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#E8DEC9] inline-block">
                                  Servicio Gabee Studio
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-['Cinzel'] font-bold uppercase shadow-2xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Publicada
                              </span>
                            </div>

                            {/* 2. Estrellas */}
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-[#FDE047] text-[#FDE047] drop-shadow-[0_0_6px_rgba(253,224,71,0.6)]" />
                              ))}
                            </div>

                            {/* 3. Comentario */}
                            <p className="font-['Marcellus'] text-xs text-[#5D3704]/90 leading-relaxed italic bg-[#FAF7F2]/60 p-2.5 rounded-xl border border-[#DFD1BD]/40">
                              "{rev.comment}"
                            </p>

                            {/* 4. Nombre */}
                            <div className="pt-0.5">
                              <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                                {rev.clientName}
                              </h4>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-[#E7DDCE] flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAddReview(rev)}
                          className="py-1.5 px-3 rounded-lg border border-[#D5C6B1] bg-[#FDFBF7] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#C89D3C]" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteReviewItem(rev.id)}
                          className="py-1.5 px-2.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: CONFIGURACIÓN DE CATBEE (CEREBRO & ASISTENTE IA)     */}
      {/* ========================================================= */}
      {activeTab === 'catbee' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div
            className="p-6 rounded-3xl border-2 border-[#D4AF37] relative overflow-hidden shadow-sm"
            style={{
              backgroundColor: '#FAF7F2',
              backgroundImage: 'var(--site-window-pattern)',
              backgroundSize: '200px auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] bg-[#FAF4EB] overflow-hidden shrink-0 shadow-md flex items-center justify-center">
                  <img
                    src="/assets/aistudio/gatobeja_transparent.png"
                    alt="Catbee"
                    style={{ objectFit: 'cover', objectPosition: 'center', transform: 'scale(1.1)' }}
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] bg-[#FAF7F2]/90 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/50">
                      Cerebro & Asistente Virtual IA
                    </span>
                    <span className="text-xs">🐾🐝</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-['Cinzel'] font-bold text-[#5D3704] mt-0.5">
                    Configuración de Catbee
                  </h3>
                  <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5 max-w-xl">
                    Administra la personalidad, directrices generales del sistema y la base de conocimientos oficial (Q&A) que Catbee utiliza para responder a las clientas en tiempo real.
                  </p>
                </div>
              </div>

              {/* Status and Metrics Badges */}
              <div className="flex flex-wrap items-center gap-2 bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-[#D4AF37]/50 shadow-2xs">
                <div className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E0D3C1] text-center">
                  <span className="text-[10px] text-[#7A6655] block font-['Marcellus']">Conocimientos</span>
                  <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">{catbeeKnowledge.length} registros</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-700 block font-['Marcellus']">Activos</span>
                  <span className="font-['Cinzel'] font-bold text-xs text-emerald-800">{catbeeKnowledge.filter((k) => k.active).length} activos</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E0D3C1] text-center">
                  <span className="text-[10px] text-[#7A6655] block font-['Marcellus']">Derivación WhatsApp</span>
                  <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">{catbeeConfig.whatsappDerivationThreshold} preguntas</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECCIÓN 1: CAJA DE REGLAS DEL SISTEMA (PROMPT GENERAL)    */}
          {/* ========================================================= */}
          <div className="p-6 rounded-3xl bg-[#FAF7F2] border-2 border-[#D4AF37] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8DEC9] pb-4">
              <div>
                <h4 className="font-['Cinzel'] font-bold text-base text-[#5D3704] flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#C89D3C]" />
                  <span>Reglas del Sistema & Personalidad de Catbee</span>
                </h4>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                  Edita la personalidad, tono, prohibición de inventar precios y reglas de atención obligatorias que rigen el comportamiento de la IA.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetCatbeeConfigDefaults}
                className="py-1.5 px-3 rounded-xl border border-[#D5C6B1] bg-white hover:bg-[#F2ECE2] text-[#5D3704] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                title="Restablecer valores por defecto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C89D3C]" />
                <span>Restablecer Directrices</span>
              </button>
            </div>

            <form onSubmit={handleSaveCatbeeConfig} className="space-y-4">
              {/* Prompt General / Textarea */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-xs text-[#5D3704] mb-1.5 flex items-center justify-between">
                  <span>Directrices del Sistema & Prompt General *</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#8C6B1C] normal-case">
                    (Regla del 50% de adelanto, tono amable, no inventar precios)
                  </span>
                </label>
                <textarea
                  rows={7}
                  required
                  value={catbeePromptDraft}
                  onChange={(e) => setCatbeePromptDraft(e.target.value)}
                  placeholder="Escribe las directrices de personalidad y comportamiento de Catbee..."
                  className="w-full p-3.5 rounded-2xl border border-[#D5C6B1] bg-white text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed focus:outline-none focus:border-[#5D3704] shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mensaje de bienvenida inicial */}
                <div>
                  <label className="block font-['Cinzel'] font-bold text-xs text-[#5D3704] mb-1.5">
                    Mensaje de Bienvenida Inicial en Chat
                  </label>
                  <textarea
                    rows={3}
                    value={catbeeWelcomeDraft}
                    onChange={(e) => setCatbeeWelcomeDraft(e.target.value)}
                    placeholder="Mensaje que saluda a la clienta al abrir el chat..."
                    className="w-full p-2.5 rounded-xl border border-[#D5C6B1] bg-white text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed focus:outline-none focus:border-[#5D3704] shadow-2xs"
                  />
                </div>

                {/* Controles de umbral y estado */}
                <div className="space-y-3.5 bg-white/70 p-4 rounded-2xl border border-[#E8DEC9]">
                  <div>
                    <label className="block font-['Cinzel'] font-bold text-xs text-[#5D3704] mb-1">
                      Umbral de Derivación a WhatsApp (N° de Consultas)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={catbeeThresholdDraft}
                      onChange={(e) => setCatbeeThresholdDraft(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-[#D5C6B1] bg-white text-xs font-bold text-[#5D3704]"
                    />
                    <span className="text-[10.5px] font-['Marcellus'] text-[#7A6655] mt-1 block">
                      Catbee ofrecerá el botón directo a WhatsApp tras esta cantidad de preguntas o ante dudas complejas.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-[#E8DEC9]">
                    <input
                      type="checkbox"
                      id="catbeeEnabledToggle"
                      checked={catbeeEnabledDraft}
                      onChange={(e) => setCatbeeEnabledDraft(e.target.checked)}
                      className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                    />
                    <label htmlFor="catbeeEnabledToggle" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5">
                      <span className="font-['Cinzel'] font-bold">Burbuja de Catbee Activa en la Web</span>
                      <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Visible para todas las clientas)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Plantilla del mensaje al derivar a WhatsApp */}
              <div className="p-4 rounded-2xl bg-white/70 border border-[#E8DEC9]">
                <label className="block font-['Cinzel'] font-bold text-xs text-[#5D3704] mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span>PLANTILLA DE MENSAJE AL DERIVAR A WHATSAPP</span>
                  <span className="text-[10.5px] font-['Marcellus'] text-[#8C6B1C] normal-case">
                    Se usa al presionar «Hablar por WhatsApp» 🐾🐝
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={catbeeWhatsappTemplateDraft}
                  onChange={(e) => setCatbeeWhatsappTemplateDraft(e.target.value)}
                  placeholder="Escribe el mensaje que Catbee enviará a WhatsApp al derivar a Gabriela..."
                  className="w-full p-3.5 rounded-2xl border border-[#D5C6B1] bg-white text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed focus:outline-none focus:border-[#5D3704] shadow-2xs"
                />
                <p className="text-[10.5px] font-['Marcellus'] text-[#7A6655] mt-1.5 leading-relaxed">
                  Variables disponibles: <code className="font-bold text-[#8C6B1C]">{'{consulta}'}</code> o{' '}
                  <code className="font-bold text-[#8C6B1C]">{'{resumen}'}</code> (última consulta de la clienta) y{' '}
                  <code className="font-bold text-[#8C6B1C]">{'{nombre}'}</code> (nombre de la clienta, si inició sesión).
                  Se reemplazan automáticamente; cualquier variable sin valor se elimina para no dejar texto roto.
                </p>
              </div>

              {/* Guardar Configuración Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-2xl bg-[#5D3704] hover:bg-[#432702] border border-[#D4AF37] text-white text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>Guardar Configuración de Catbee</span>
                </button>
              </div>
            </form>
          </div>

          {/* ========================================================= */}
          {/* SECCIÓN 2: Q&A DINÁMICO (BASE DE CONOCIMIENTOS OFICIAL)   */}
          {/* ========================================================= */}
          <div className="p-6 rounded-3xl bg-[#FAF7F2] border-2 border-[#D4AF37] shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#E8DEC9] pb-4">
              <div>
                <h4 className="font-['Cinzel'] font-bold text-base text-[#5D3704] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#C89D3C]" />
                  <span>Preguntas Frecuentes y Respuestas Oficiales (Q&A Dinámico)</span>
                </h4>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] mt-0.5">
                  Alimenta el cerebro de Catbee con conocimientos verificados: reglas de citas, BeeCoins, seguimiento de pedidos, métodos de pago o políticas de Press-On.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetKnowledgeDefaults}
                  className="py-2 px-3 rounded-xl border border-[#D5C6B1] bg-white hover:bg-[#F2ECE2] text-[#5D3704] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Restaurar conocimientos predeterminados"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C89D3C]" />
                  <span className="hidden sm:inline">Restaurar Iniciales</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddKnowledge()}
                  className="py-2.5 px-4 rounded-2xl bg-[#5D3704] hover:bg-[#432702] border border-[#D4AF37] text-white text-xs font-['Cinzel'] font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>+ Agregar Nuevo Conocimiento</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E0D3C1]">
              <div className="flex-1">
                <input
                  type="text"
                  value={knowledgeSearch}
                  onChange={(e) => setKnowledgeSearch(e.target.value)}
                  placeholder="Buscar por pregunta clave o palabra disparadora..."
                  className="w-full py-1.5 px-3 text-xs bg-[#FAF7F2] border border-[#D5C6B1] rounded-xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/50 focus:outline-none focus:border-[#5D3704]"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'citas', label: 'Citas & Horarios' },
                  { id: 'beecoins', label: 'BeeCoins' },
                  { id: 'pedidos', label: 'Pedidos' },
                  { id: 'pagos', label: 'Pagos' },
                  { id: 'presson', label: 'Press-On' },
                  { id: 'general', label: 'General' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setKnowledgeCategoryFilter(cat.id)}
                    className={`py-1 px-2.5 rounded-lg text-[11px] font-['Cinzel'] font-bold whitespace-nowrap cursor-pointer transition-all ${
                      knowledgeCategoryFilter === cat.id
                        ? 'bg-[#5D3704] text-white shadow-2xs'
                        : 'bg-[#FAF7F2] text-[#5D3704] hover:bg-[#F2ECE2] border border-[#E0D3C1]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q&A Knowledge Grid */}
            {catbeeKnowledge.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#D4AF37]/60 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF4EB] border border-[#D4AF37] text-[#C89D3C] flex items-center justify-center mx-auto">
                  <Brain className="w-6 h-6" />
                </div>
                <h5 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  No hay conocimientos registrados en Catbee
                </h5>
                <p className="text-xs font-['Marcellus'] text-[#7A6655] max-w-md mx-auto">
                  Haz clic en "+ Agregar Nuevo Conocimiento" o en "Restaurar Iniciales" para dotar a Catbee de respuestas oficiales para tus clientas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {catbeeKnowledge
                  .filter((item) => {
                    if (knowledgeCategoryFilter !== 'all' && item.category !== knowledgeCategoryFilter) {
                      return false;
                    }
                    if (!knowledgeSearch.trim()) return true;
                    const q = knowledgeSearch.toLowerCase().trim();
                    const inQuestion = item.question.toLowerCase().includes(q);
                    const inKeywords = (item.keywords || []).some((kw) => kw.toLowerCase().includes(q));
                    const inAnswer = item.answer.toLowerCase().includes(q);
                    return inQuestion || inKeywords || inAnswer;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 bg-white ${
                        item.active
                          ? 'border-[#D4AF37]/50 shadow-2xs hover:shadow-md hover:border-[#D4AF37]'
                          : 'border-gray-200 opacity-60 bg-gray-50/80'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Header: Category Badge + Status + Actions */}
                        <div className="flex items-center justify-between gap-2 border-b border-[#E8DEC9] pb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#D4AF37] text-[#5D3704]">
                              {item.category || 'general'}
                            </span>
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                                item.active
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-300'
                              }`}
                            >
                              {item.active ? 'Activo' : 'Pausado'}
                            </span>
                            {item.actionLabel && (
                              <span className="text-[10px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full bg-[#5D3704]/10 text-[#5D3704] border border-[#5D3704]/20 flex items-center gap-1">
                                <span>Chip:</span>
                                <strong>{item.actionLabel}</strong>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleKnowledgeActive(item)}
                              className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                item.active
                                  ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                  : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                              }`}
                              title={item.active ? 'Desactivar respuesta' : 'Activar respuesta'}
                            >
                              {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAddKnowledge(item)}
                              className="p-1.5 rounded-lg border border-[#D5C6B1] bg-[#FDFBF7] hover:bg-[#F2E5D5] text-[#5D3704] text-xs cursor-pointer transition-colors"
                              title="Editar conocimiento"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#C89D3C]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKnowledge(item.id, item.question)}
                              className="p-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs cursor-pointer transition-colors"
                              title="Eliminar conocimiento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Title */}
                        <h5 className="font-['Cinzel'] font-bold text-sm text-[#5D3704] leading-snug">
                          {item.question}
                        </h5>

                        {/* Keywords Pills */}
                        {item.keywords && item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C]">Disparadores:</span>
                            {item.keywords.map((kw, i) => (
                              <span
                                key={i}
                                className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E0D3C1] text-[#7A6655]"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Answer Box */}
                        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DEC9] text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line custom-scrollbar">
                          {item.answer}
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-2 border-t border-[#E8DEC9] flex items-center justify-between text-[10px] font-['Marcellus'] text-[#7A6655]">
                        <span>ID: {item.id}</span>
                        <span>Actualizado: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Reciente'}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL A: ADD / EDIT CLIENT REVIEW (ADMIN)                 */}
      {/* ========================================================= */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border-2 border-[#D4AF37] rounded-3xl max-w-lg w-full shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E8DEC9] p-4 sm:px-6 shrink-0 bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[#D4AF37] fill-[#FFF066]" />
                <h3 className="font-['Cinzel'] font-bold text-base text-[#5D3704]">
                  {editingReviewId ? 'Editar Reseña de Clienta' : 'Agregar Nueva Reseña de Clienta'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 text-[#5D3704] hover:bg-[#F2E5D5] rounded-full cursor-pointer transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body (Internal scrollbar) */}
            <form onSubmit={handleSaveReview} className="p-5 sm:p-6 space-y-4 text-xs font-['Marcellus'] overflow-y-auto custom-scrollbar flex-1">
              {/* Client Name */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">Nombre de la Clienta *</label>
                <input
                  type="text"
                  required
                  value={reviewForm.clientName}
                  onChange={(e) => setReviewForm((p) => ({ ...p, clientName: e.target.value }))}
                  placeholder="Ej: Valeria Mendoza"
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                />
              </div>

              {/* Service Name */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">Servicio Recibido (Opcional)</label>
                <input
                  type="text"
                  value={reviewForm.serviceName}
                  onChange={(e) => setReviewForm((p) => ({ ...p, serviceName: e.target.value }))}
                  placeholder="Ej: Softgel + Nail Art Complejo"
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704]"
                />
              </div>

              {/* Comment / Description */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">Comentario o Testimonio *</label>
                <textarea
                  rows={3}
                  required
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="Escribe el testimonio o comentario de la clienta..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704] leading-relaxed"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">Calificación (Estrellas)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm((p) => ({ ...p, rating: star }))}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 transition-all ${
                          star <= reviewForm.rating
                            ? 'fill-[#FFF066] text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-[#5D3704] ml-2">{reviewForm.rating} / 5</span>
                </div>
              </div>

              {/* Media Upload / Image URL */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                  Foto o GIF Animado de la Clienta (Opcional)
                </label>
                <div className="p-2 bg-white rounded-2xl border border-[#C5A059]/40 flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-[#FAF7F2] border border-[#E8DEC9] overflow-hidden flex items-center justify-center shrink-0 relative">
                    {reviewForm.mediaUrl ? (
                      <img src={reviewForm.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400 text-center font-['Cinzel']">Sin imagen/GIF</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <label className="py-2 px-3 rounded-xl bg-[#5D3704]/15 border border-[#D4AF37] hover:bg-[#5D3704]/25 text-[#5D3704] font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#5D3704]" />
                      <span>Cargar Foto o GIF 🎬</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        onChange={handleReviewMediaFileChange}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={reviewForm.mediaUrl}
                      onChange={(e) => setReviewForm((p) => ({ ...p, mediaUrl: e.target.value }))}
                      placeholder="O pega directamente la URL de la foto o GIF animado..."
                      className="w-full p-2 text-xs bg-[#FAF7F2] border border-[#DDD1BF] rounded-xl text-[#5D3704]"
                    />
                  </div>
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#DFD1BD]">
                <input
                  type="checkbox"
                  id="reviewActiveCheck"
                  checked={reviewForm.active}
                  onChange={(e) => setReviewForm((p) => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                />
                <label htmlFor="reviewActiveCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5">
                  <span className="font-['Cinzel'] font-bold">Reseña Visible en Web Principal</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Oculta si se desmarca)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#5D3704]/20 hover:bg-[#5D3704]/30 border border-[#D4AF37] text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#5D3704]" />
                  <span>{editingReviewId ? 'Guardar Cambios' : 'Registrar Reseña'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT CATBEE KNOWLEDGE (Q&A DINÁMICO)         */}
      {/* ========================================================= */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border-2 border-[#D4AF37] rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#C89D3C]" />
                <h3 className="font-['Cinzel'] font-bold text-base text-[#5D3704]">
                  {editingKnowledgeId ? 'Editar Conocimiento de Catbee' : 'Agregar Nuevo Conocimiento a Catbee'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKnowledgeModal(false)}
                className="p-1.5 text-[#5D3704] hover:bg-[#F2E5D5] rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKnowledge} className="space-y-4 text-xs font-['Marcellus']">
              {/* Question */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                  Pregunta Clave / Título del Tema *
                </label>
                <input
                  type="text"
                  required
                  value={knowledgeForm.question}
                  onChange={(e) => setKnowledgeForm((p) => ({ ...p, question: e.target.value }))}
                  placeholder="Ej: ¿Cuánto tiempo dura el sistema Softgel?"
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                  Palabras Clave / Disparadores (Separadas por comas) *
                </label>
                <input
                  type="text"
                  required
                  value={knowledgeForm.keywords}
                  onChange={(e) => setKnowledgeForm((p) => ({ ...p, keywords: e.target.value }))}
                  placeholder="Ej: duracion softgel, cuanto dura, desprendimiento, mantenimiento"
                  className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-mono text-[#5D3704]"
                />
                <span className="text-[10.5px] text-[#7A6655] mt-1 block">
                  Cualquier mensaje de la clienta que contenga alguna de estas palabras disparará esta respuesta oficial.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Categoría
                  </label>
                  <select
                    value={knowledgeForm.category}
                    onChange={(e) => setKnowledgeForm((p) => ({ ...p, category: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Cinzel'] font-bold text-[#5D3704]"
                  >
                    <option value="citas">Citas & Horarios</option>
                    <option value="beecoins">BeeCoins & Recompensas</option>
                    <option value="pedidos">Pedidos & Seguimiento</option>
                    <option value="pagos">Métodos de Pago & Adelanto</option>
                    <option value="presson">Catálogo Press-On & Envíos</option>
                    <option value="general">Información General</option>
                  </select>
                </div>

                {/* Quick Action Button Label */}
                <div>
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Botón Rápido en Chat (Opcional)
                  </label>
                  <input
                    type="text"
                    value={knowledgeForm.actionLabel}
                    onChange={(e) => setKnowledgeForm((p) => ({ ...p, actionLabel: e.target.value }))}
                    placeholder="Ej: 💅 ¿Cuánto dura el Softgel?"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704]"
                  />
                  <span className="text-[10px] text-[#7A6655] mt-0.5 block">
                    Si lo completas, aparecerá como sugerencia interactiva en el chat.
                  </span>
                </div>
              </div>

              {/* Official Answer */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1 flex items-center justify-between">
                  <span>Respuesta Oficial de Catbee *</span>
                  <span className="text-[10px] text-[#8C6B1C] normal-case">
                    Soporta negritas con **texto**, viñetas y emojis
                  </span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={knowledgeForm.answer}
                  onChange={(e) => setKnowledgeForm((p) => ({ ...p, answer: e.target.value }))}
                  placeholder="Redacta la respuesta oficial con tono amable, elegante y preciso..."
                  className="w-full p-3 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704] leading-relaxed"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#E8DEC9]">
                <input
                  type="checkbox"
                  id="knowledgeActiveCheck"
                  checked={knowledgeForm.active}
                  onChange={(e) => setKnowledgeForm((p) => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#B89230] accent-[#B89230] cursor-pointer"
                />
                <label htmlFor="knowledgeActiveCheck" className="text-xs font-semibold text-[#5D3704] cursor-pointer flex items-center gap-1.5">
                  <span className="font-['Cinzel'] font-bold">Respuesta Activa en Chat de Catbee</span>
                  <span className="text-[11px] font-['Marcellus'] text-[#7A6655]">(Si se desmarca, Catbee no usará este conocimiento)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8DEC9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowKnowledgeModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] cursor-pointer hover:bg-[#F2ECE2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#5D3704] hover:bg-[#432702] border border-[#D4AF37] text-white text-xs font-['Cinzel'] font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{editingKnowledgeId ? 'Guardar Cambios' : 'Registrar Conocimiento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: IN-APP CONFIRMATION MODAL (ELIMINAR SEGURO) */}
      {/* ========================================================= */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E3D6C3] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h4 className="text-base font-display font-bold text-[#302117]">
              Confirmar Acción
            </h4>

            <p className="text-xs text-[#6F5B4D] leading-relaxed">
              {deleteConfirmation.title}
            </p>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="py-2 px-4 rounded-xl border border-[#D5C6B1] text-xs font-semibold text-[#574334] hover:bg-[#F2ECE2] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="py-2 px-5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Continuar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registro Manual de Pedidos */}
      {isManualOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border-2 border-[#D4AF37] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-[#F5EBE1] border-b border-[#E8DEC9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#8C6B1C]" />
                <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  Registrar Nuevo Pedido Manual
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsManualOrderModalOpen(false)}
                className="p-1 hover:bg-[#EBDCCB] rounded-full text-[#5D3704] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualClientName.trim()) {
                  triggerToast('Por favor ingresa el nombre de la clienta.');
                  return;
                }

                const itemsToBuy = Object.entries(manualOrderItems)
                  .filter(([_, qty]) => qty > 0)
                  .map(([prodId, qty]) => {
                    const prod = inventoryList.find((p) => p.id === prodId);
                    return {
                      productId: prodId,
                      productName: prod ? prod.name : 'Producto Gabee',
                      price: prod ? prod.price : 0,
                      quantity: qty,
                      image: prod ? prod.image : '',
                    };
                  });

                if (itemsToBuy.length === 0) {
                  triggerToast('Selecciona al menos un producto del inventario.');
                  return;
                }

                const totalSolesCalculated = itemsToBuy.reduce((sum, item) => sum + item.price * item.quantity, 0);

                createStoreOrder({
                  userId: `manual-${Date.now()}`,
                  clientName: manualClientName.trim(),
                  clientPhone: manualClientPhone.trim() || 'Sin teléfono',
                  clientEmail: '',
                  items: itemsToBuy,
                  totalSoles: totalSolesCalculated,
                  beeCoinsUsed: 0,
                  paymentMethod: manualPaymentMethod,
                  operationNumber: manualOperationNumber.trim() || undefined,
                });

                triggerToast(`✓ Pedido manual registrado para ${manualClientName.trim()}. Stock actualizado.`);
                setIsManualOrderModalOpen(false);
                setManualClientName('');
                setManualClientPhone('');
                setManualOperationNumber('');
                setManualOrderItems({});
              }}
              className="p-5 space-y-4 overflow-y-auto text-xs font-['Marcellus']"
            >
              {/* Client Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Nombre de Clienta *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualClientName}
                    onChange={(e) => setManualClientName(e.target.value)}
                    placeholder="Ej. Rosa Polo / Maria Silva"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704] focus:ring-1 focus:ring-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={manualClientPhone}
                    onChange={(e) => setManualClientPhone(e.target.value)}
                    placeholder="Ej. 923547594"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704] focus:ring-1 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              {/* Payment Method & Operation Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs text-[#5D3704]"
                  >
                    <option value="yape">YAPE</option>
                    <option value="plin">PLIN</option>
                    <option value="bcp">BCP Transferencia</option>
                    <option value="mixed">Pago Mixto / Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    N° Operación (Opcional)
                  </label>
                  <input
                    type="text"
                    value={manualOperationNumber}
                    onChange={(e) => setManualOperationNumber(e.target.value)}
                    placeholder="Ej. 3223455"
                    className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white font-mono text-xs text-[#5D3704] focus:ring-1 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              {/* Inventory Product Selection */}
              <div>
                <label className="block font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                  Selección de Productos del Inventario *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {inventoryList.map((prod) => {
                    const selectedQty = manualOrderItems[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        className="p-2.5 rounded-xl bg-white border border-[#E7DDCE] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={prod.image || '/assets/aistudio/PO_1_f5e6a392.JPG'}
                            alt={prod.name}
                            className="w-9 h-9 rounded-lg object-cover border border-[#E7DDCE] shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#3D2314] block truncate">
                              {prod.name}
                            </span>
                            <span className="text-[10.5px] text-[#8C6B1C] block">
                              S/. {prod.price.toFixed(2)} • Stock: {prod.stock || 0} u.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setManualOrderItems((prev) => {
                                const current = prev[prod.id] || 0;
                                if (current <= 1) {
                                  const copy = { ...prev };
                                  delete copy[prod.id];
                                  return copy;
                                }
                                return { ...prev, [prod.id]: current - 1 };
                              });
                            }}
                            className="w-6 h-6 rounded-lg border border-[#DDD1BF] bg-[#FAF7F2] text-[#5D3704] font-bold flex items-center justify-center hover:bg-[#F2ECE2]"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs text-[#5D3704]">
                            {selectedQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setManualOrderItems((prev) => ({
                                ...prev,
                                [prod.id]: (prev[prod.id] || 0) + 1,
                              }));
                            }}
                            className="w-6 h-6 rounded-lg border border-[#C5A059] bg-[#FAF5ED] text-[#5D3704] font-bold flex items-center justify-center hover:bg-[#F2E5D5]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation & Submit Button */}
              <div className="pt-3 border-t border-[#E8DEC9] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#7A6655] block">Total a Cobrar:</span>
                  <span className="font-['Cinzel'] font-bold text-base text-[#8C6B1C]">
                    S/.{' '}
                    {Object.entries(manualOrderItems)
                      .reduce((sum, [pId, qty]) => {
                        const p = inventoryList.find((it) => it.id === pId);
                        return sum + (p ? p.price : 0) * qty;
                      }, 0)
                      .toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManualOrderModalOpen(false)}
                    className="py-2 px-3.5 rounded-xl border border-[#DDD1BF] text-xs font-semibold text-[#5D3704] hover:bg-[#F2ECE2]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-[#FAF4E6] hover:bg-[#FFFDF8] border border-[#C89D3C]/60 hover:border-[#B88A38] text-[#5C3A1E] text-xs font-['Cinzel'] font-bold shadow-[0_2px_10px_rgba(107,67,36,0.10)] hover:shadow-[0_4px_14px_rgba(107,67,36,0.14)] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Check className="w-3.5 h-3.5 text-[#8C6B1C]" />
                    <span>Guardar y Descontar Stock</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Vouchers & Attached Photos */}
      <ImageLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
