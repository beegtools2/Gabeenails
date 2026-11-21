import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GabeeBeeMark } from './GabeeBeeMark';
import { ImageLightbox } from './ImageLightbox';
import {
  X,
  Ruler,
  CheckCircle2,
  Gift,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Truck,
  Store,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  Upload,
  RotateCcw,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Camera,
  Info,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

import { PressOnItem, TipType, SizeType, KitType, DeliveryOption } from '../types';
import { INITIAL_PRESS_ON_ITEMS } from '../data/catalogData';
import { BeeCoinsFooterBadge } from './BeeCoinsFooterBadge';
import { LossAversionWidget } from './LossAversionWidget';
import { calculateBirthdayDiscount } from '../utils/birthdayDiscountUtils';
import { renderWhatsAppTemplate, getWhatsAppTemplate } from '../utils/whatsappTemplateUtils';
import { BirthdayDiscountButton } from './BirthdayDiscountButton';
import { OperationCodeInput } from './OperationCodeInput';
import { validateOperationCode } from '../utils/validationUtils';
import gatobejaImg from '../assets/images/gatobeja_mascot_transparent.png';

interface PressOnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type PressOnStep = 1 | 2 | 3 | 4;

const ALL_SIZE_CHARTS: {
  key: TipType;
  title: string;
  description: string;
  rows: { finger: string; xs: string; s: string; m: string; l: string }[];
}[] = [
  {
    key: 'almendra',
    title: 'Tabla I: Punta Almendra',
    description: 'Guía de referencia para saber escoger tu talla:',
    rows: [
      { finger: 'Pulgar', xs: '1.5 cm (3)', s: '1.6 cm (2)', m: '1.7 cm (1)', l: '1.8 cm (0)' },
      { finger: 'Índice', xs: '1.1 cm (6)', s: '1.2 cm (5)', m: '1.3 cm (4)', l: '1.4 cm (3)' },
      { finger: 'Medio', xs: '1.2 cm (5)', s: '1.3 cm (4)', m: '1.4 cm (3)', l: '1.5 cm (2)' },
      { finger: 'Anular', xs: '1.1 cm (6)', s: '1.2 cm (5)', m: '1.3 cm (4)', l: '1.4 cm (3)' },
      { finger: 'Meñique', xs: '0.8 cm (11)', s: '0.9 cm (10)', m: '1.0 cm (9)', l: '1.1 cm (8)' },
    ],
  },
  {
    key: 'stiletto',
    title: 'Tabla II: Punta Stiletto',
    description: 'Guía de referencia para saber escoger tu talla:',
    rows: [
      { finger: 'Pulgar', xs: '1.5 cm (3)', s: '1.6 cm (2)', m: '1.7 cm (1)', l: '1.8 cm (0)' },
      { finger: 'Índice', xs: '1.1 cm (6)', s: '1.2 cm (5)', m: '1.3 cm (4)', l: '1.4 cm (3)' },
      { finger: 'Medio', xs: '1.2 cm (5)', s: '1.3 cm (4)', m: '1.4 cm (3)', l: '1.5 cm (2)' },
      { finger: 'Anular', xs: '1.1 cm (6)', s: '1.2 cm (5)', m: '1.3 cm (4)', l: '1.4 cm (3)' },
      { finger: 'Meñique', xs: '0.9 cm (9)', s: '1.0 cm (8)', m: '1.1 cm (7)', l: '1.2 cm (6)' },
    ],
  },
  {
    key: 'coffin',
    title: 'Tabla III: Punta Coffin | Ballerina',
    description: 'Guía de referencia para saber escoger tu talla:',
    rows: [
      { finger: 'Pulgar', xs: '1.5 cm (3)', s: '1.6 cm (2)', m: '1.7 cm (1)', l: '1.8 cm (0)' },
      { finger: 'Índice', xs: '1.1 cm (7)', s: '1.2 cm (6)', m: '1.3 cm (5)', l: '1.4 cm (4)' },
      { finger: 'Medio', xs: '1.2 cm (6)', s: '1.3 cm (5)', m: '1.4 cm (4)', l: '1.5 cm (3)' },
      { finger: 'Anular', xs: '1.1 cm (7)', s: '1.2 cm (6)', m: '1.3 cm (5)', l: '1.4 cm (4)' },
      { finger: 'Meñique', xs: '0.8 cm (11)', s: '0.9 cm (10)', m: '1.0 cm (9)', l: '1.1 cm (8)' },
    ],
  },
  {
    key: 'square',
    title: 'Tabla IV: Punta Cuadrada | Square',
    description: 'Guía de referencia para saber escoger tu talla:',
    rows: [
      { finger: 'Pulgar', xs: '1.5 cm (3)', s: '1.6 cm (2)', m: '1.7 cm (1)', l: '1.8 cm (0)' },
      { finger: 'Índice', xs: '1.1 cm (8)', s: '1.2 cm (7)', m: '1.3 cm (6)', l: '1.4 cm (4)' },
      { finger: 'Medio', xs: '1.2 cm (7)', s: '1.3 cm (6)', m: '1.4 cm (5)', l: '1.5 cm (3)' },
      { finger: 'Anular', xs: '1.1 cm (8)', s: '1.2 cm (7)', m: '1.3 cm (6)', l: '1.4 cm (4)' },
      { finger: 'Meñique', xs: '0.8 cm (11)', s: '0.9 cm (11)', m: '1.0 cm (10)', l: '1.1 cm (9)' },
    ],
  },
];

const SIZE_CHARTS_DATA: Record<
  TipType,
  {
    title: string;
    description: string;
    rows: { finger: string; xs: string; s: string; m: string; l: string }[];
  }
> = ALL_SIZE_CHARTS.reduce((acc, curr) => {
  acc[curr.key] = {
    title: curr.title,
    description: curr.description,
    rows: curr.rows,
  };
  return acc;
}, {} as Record<TipType, { title: string; description: string; rows: { finger: string; xs: string; s: string; m: string; l: string }[] }>);

const TIP_INFO: Record<TipType, { name: string; desc: string }> = {
  almendra: {
    name: 'Punta Almendra',
    desc: 'Alarga ópticamente los dedos, acabado sofisticado y natural.',
  },
  coffin: {
    name: 'Punta Coffin (Bailarina)',
    desc: 'Lados angulados con punta recta plana, silueta en tendencia.',
  },
  stiletto: {
    name: 'Punta Stiletto (+S/. 10)',
    desc: 'Extremo afilado y audaz con gran presencia vanguardista.',
  },
  square: {
    name: 'Punta Cuadrada (Square)',
    desc: 'Líneas limpias, simétricas y esquinas definidas de corte clásico.',
  },
};

const PRESS_ON_STORAGE_KEY = 'gabee_press_on_catalog_v2';

export const PressOnModal: React.FC<PressOnModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    pressOnInitialTab,
    pressOnInitialSetIdx,
    pressOnInitialStep,
    isAdmin,
    currentView,
    pressOnCatalog,
    addPressOnItem,
    updatePressOnItem,
    deletePressOnItem,
    resetPressOnCatalog,
    selectedPressOnPromoItem,
    setSelectedPressOnPromoItem,
    additionalsList,
    createAppointment,
    currentUser,
    recordOperationCode,
  } = useApp();

  // Mode: 'catalog' vs 'custom'
  const [activeTabMode, setActiveTabMode] = useState<'catalog' | 'custom'>('catalog');

  // Dynamic catalog from AppContext (synchronized with AdminPanel)
  const catalogItems = pressOnCatalog && pressOnCatalog.length > 0 ? pressOnCatalog : INITIAL_PRESS_ON_ITEMS;

  // Admin In-Modal Management State (ONLY active if isAdmin AND currentView === 'admin')
  const [adminMode, setAdminMode] = useState(false);

  // Edit / Add Item Modal State (Admin)
  const [editingItem, setEditingItem] = useState<PressOnItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [itemFormName, setItemFormName] = useState('');
  const [itemFormPrice, setItemFormPrice] = useState<number>(75);
  const [itemFormShortDesc, setItemFormShortDesc] = useState('');
  const [itemFormFullDesc, setItemFormFullDesc] = useState('');
  const [itemFormImage, setItemFormImage] = useState('');
  const [itemFormTip, setItemFormTip] = useState<TipType>('almendra');

  // Lightbox Zoom Modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // ==========================================
  // CATALOG FLOW STATE
  // ==========================================
  // Step 1: ELIGE TU SET
  // Step 2: ELIGE TU TALLA Y KIT
  // Step 3: MODALIDAD DE ENTREGA Y TUS DATOS
  // Step 4: PAGO Y CONFIRMACIÓN
  const [step, setStep] = useState<PressOnStep>(1);
  const [selectedSetIndex, setSelectedSetIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<SizeType | ''>('');
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [selectedKit, setSelectedKit] = useState<KitType | ''>('');

  // ==========================================
  // CUSTOM ORDER FLOW STATE (PEDIDO PERSONALIZADO)
  // ==========================================
  // customStep 1: ENVÍA TU TALLA
  // customStep 2: PERSONALIZA TU DISEÑO
  // Then advances to step 3 (MODALIDAD DE ENTREGA Y TUS DATOS) and step 4 (PAGO Y CONFIRMACIÓN)
  const [customStep, setCustomStep] = useState<1 | 2>(1);
  const [rightHandSizes, setRightHandSizes] = useState({
    thumb: '',
    index: '',
    middle: '',
    ring: '',
    pinky: '',
  });
  const [leftHandSizes, setLeftHandSizes] = useState({
    thumb: '',
    index: '',
    middle: '',
    ring: '',
    pinky: '',
  });
  const [naturalHandPhotos, setNaturalHandPhotos] = useState<string[]>([]);
  const [nailAnatomy, setNailAnatomy] = useState<'plana' | 'convexa' | 'concava' | ''>('');
  const [healthNotes, setHealthNotes] = useState('');

  // Custom Step 2 State
  const [dreamDesignPhotos, setDreamDesignPhotos] = useState<string[]>([]);
  const [customShape, setCustomShape] = useState<TipType>('almendra');
  const [customLength, setCustomLength] = useState<string>('xs');
  const [customModificationNotes, setCustomModificationNotes] = useState('');

  // Common Customer & Delivery Data (Collected in Step 3)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryOption>('studio');
  const [departmentProvince, setDepartmentProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Additionals Selection & Accordion
  const [selectedAdditionals, setSelectedAdditionals] = useState<string[]>([]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Step 4 / Confirmation: Payment
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bcp'>('yape');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [generatedOrderCode, setGeneratedOrderCode] = useState('');
  const [paymentOperationNumber, setPaymentOperationNumber] = useState('');
  const [voucherPhoto, setVoucherPhoto] = useState<string | null>(null);

  // 20-Minute Reservation Timer (1200 seconds)
  const [timerSeconds, setTimerSeconds] = useState<number>(1200);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Aviso emergente temporal (toast) para validaciones del flujo Press On
  const [validationToast, setValidationToast] = useState<string | null>(null);
  const validationToastTimer = useRef<number | null>(null);

  const showValidationToast = (message: string, durationMs: number) => {
    if (validationToastTimer.current) window.clearTimeout(validationToastTimer.current);
    setValidationToast(message);
    validationToastTimer.current = window.setTimeout(() => {
      setValidationToast(null);
      validationToastTimer.current = null;
    }, durationMs);
  };

  useEffect(() => {
    return () => {
      if (validationToastTimer.current) window.clearTimeout(validationToastTimer.current);
    };
  }, []);

  // Reset form state function (called on close or expiration)
  const resetAllFormState = () => {
    if (validationToastTimer.current) window.clearTimeout(validationToastTimer.current);
    validationToastTimer.current = null;
    setValidationToast(null);
    setSelectedPressOnPromoItem(null);
    setStep(1);
    setCustomStep(1);
    setSelectedSetIndex(0);
    setSelectedSize('');
    setSelectedKit('');
    setRightHandSizes({ thumb: '', index: '', middle: '', ring: '', pinky: '' });
    setLeftHandSizes({ thumb: '', index: '', middle: '', ring: '', pinky: '' });
    setNaturalHandPhotos([]);
    setNailAnatomy('');
    setHealthNotes('');
    setDreamDesignPhotos([]);
    setCustomShape('almendra');
    setCustomLength('xs');
    setCustomModificationNotes('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setInstagram('');
    setBirthDate('');
    setDeliveryType('studio');
    setDepartmentProvince('');
    setDistrict('');
    setAddress('');
    setReference('');
    setSpecialNotes('');
    setSelectedAdditionals([]);
    setPaymentOperationNumber('');
    setVoucherPhoto(null);
    setOrderConfirmed(false);
    setGeneratedOrderCode('');
    setTimerSeconds(1200);
    setIsTimerActive(false);
  };

  // Start timer when entering step 2 (Catalog) or custom mode
  useEffect(() => {
    if (isOpen && !orderConfirmed) {
      if (activeTabMode === 'catalog' && step >= 2) {
        setIsTimerActive(true);
      } else if (activeTabMode === 'custom') {
        setIsTimerActive(true);
      }
    }
  }, [step, activeTabMode, orderConfirmed, isOpen]);

  // Timer countdown handler (20-minute reservation timer)
  useEffect(() => {
    let interval: any = null;
    if (isOpen && isTimerActive && timerSeconds > 0 && !orderConfirmed) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds <= 0 && isTimerActive && !orderConfirmed) {
      // Pause visual counter without affecting any persistent database records or appointments
      setIsTimerActive(false);
      setTimerSeconds(1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isTimerActive, timerSeconds, orderConfirmed]);

  // Autocompletado inteligente global desde la cuenta activa de la clienta
  useEffect(() => {
    if (isOpen && currentUser) {
      if (currentUser.firstName) setFirstName(currentUser.firstName);
      if (currentUser.lastName) setLastName(currentUser.lastName);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.instagram) setInstagram(currentUser.instagram);
      if (currentUser.birthDate) setBirthDate(currentUser.birthDate);
      if (currentUser.departmentProvince || currentUser.department) {
        setDepartmentProvince(currentUser.departmentProvince || currentUser.department || 'Lima');
      }
      if (currentUser.district) setDistrict(currentUser.district);
      if (currentUser.address) setAddress(currentUser.address);
      if (currentUser.reference) setReference(currentUser.reference);
    }
  }, [isOpen, currentUser, step, activeTabMode]);

  // Autocompletado de dirección y distrito de inmediato al seleccionar envío a domicilio
  useEffect(() => {
    if (deliveryType === 'delivery' && currentUser) {
      if (currentUser.departmentProvince || currentUser.department) {
        setDepartmentProvince(currentUser.departmentProvince || currentUser.department || 'Lima');
      }
      if (currentUser.district) setDistrict(currentUser.district);
      if (currentUser.address) setAddress(currentUser.address);
      if (currentUser.reference) setReference(currentUser.reference);
    }
  }, [deliveryType, currentUser]);

  // Filtered Additionals for Press On
  const pressOnAdditionals = useMemo(() => {
    return additionalsList.filter(
      (item) => item.active !== false && (!item.targetSection || item.targetSection === 'press_on' || item.targetSection === 'both')
    );
  }, [additionalsList]);

  // Save catalog changes to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(PRESS_ON_STORAGE_KEY, JSON.stringify(catalogItems));
    } catch (e) {
      console.warn('Could not save press on catalog to localStorage:', e);
    }
  }, [catalogItems]);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      resetAllFormState();
      const initialTab = pressOnInitialTab || 'catalog';
      setActiveTabMode(initialTab);
      const initialIdx = pressOnInitialSetIdx ?? 0;
      setSelectedSetIndex(initialIdx);
      if (pressOnInitialStep && pressOnInitialStep >= 1 && pressOnInitialStep <= 4) {
        setStep(pressOnInitialStep as PressOnStep);
      }
      if (isAdmin && currentView === 'admin') setAdminMode(true);
      else setAdminMode(false);
    }
  }, [isOpen, pressOnInitialTab, pressOnInitialSetIdx, pressOnInitialStep, isAdmin, currentView]);

  const currentSet = useMemo<PressOnItem>(() => {
    if (selectedPressOnPromoItem) {
      if ('defaultTip' in selectedPressOnPromoItem && selectedPressOnPromoItem.defaultTip) {
        return selectedPressOnPromoItem as PressOnItem;
      }
      const promo = selectedPressOnPromoItem as any;
      return {
        id: promo.id || `promo-${Date.now()}`,
        name: promo.title || promo.name || 'Set Promocional Press On',
        price: promo.price || 50,
        shortDesc: promo.description || 'Diseño exclusivo en promoción de mes.',
        fullDesc: promo.fullDesc || promo.description || 'Set de 10 uñas Press On reutilizables hechas a mano con geles de alta gama.',
        image: promo.image || '/assets/aistudio/PO_2_4dd05dab.JPG',
        gallery: [promo.image || '/assets/aistudio/PO_2_4dd05dab.JPG'],
        defaultTip: (promo.defaultTip as TipType) || 'almendra',
        stock: promo.stock,
        isTrending: promo.isTrending,
        isBestSeller: promo.isBestSeller,
        includedKit: promo.includedKit || 'elemental',
      };
    }
    return catalogItems[selectedSetIndex] || catalogItems[0] || INITIAL_PRESS_ON_ITEMS[0];
  }, [selectedPressOnPromoItem, catalogItems, selectedSetIndex]);

  const isPromoFlow = useMemo(() => {
    return selectedPressOnPromoItem !== null;
  }, [selectedPressOnPromoItem]);

  // Assigned kit preference:
  // For Promos: defaults to promo.includedKit || 'elemental'
  // For Regular Catalog: defaults to currentSet.includedKit || (currentSet.price >= 80 ? 'premium' : 'standard')
  const assignedKit: 'elemental' | 'standard' | 'premium' = useMemo(() => {
    if (activeTabMode === 'custom') return 'premium';
    if (isPromoFlow) {
      return (currentSet?.includedKit as any) || 'elemental';
    }
    return (currentSet?.includedKit as any) || (currentSet?.price >= 80.0 ? 'premium' : 'standard');
  }, [activeTabMode, isPromoFlow, currentSet]);

  // Auto-select promo kit assigned in Admin
  useEffect(() => {
    if (activeTabMode === 'catalog') {
      if (assignedKit === 'premium') setSelectedKit('Premium');
      else if (assignedKit === 'standard') setSelectedKit('Standard');
      else setSelectedKit('Elemental');
    } else {
      setSelectedKit('Premium');
    }
  }, [activeTabMode, assignedKit, selectedSetIndex, selectedPressOnPromoItem]);


﻿const handleConfirmAndPay100 = () => {
    const opNumber = paymentOperationNumber.trim();
    const valResult = validateOperationCode(opNumber);
    if (!valResult.isValid) {
      alert(valResult.errorMessage);
      return;
    }

    const orderCode = `PO${String(new Date().getFullYear()).slice(2)}_${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedOrderCode(orderCode);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#5D3704', '#C89D3C', '#FAF7F2'],
      });
    } catch {
      // ignore
    }

    const rawNumber = '51' + (settings.whatsappNumber || '934403311').replace(/\D/g, '').replace(/^51/, '');

    const selectedAddonLabels = selectedAdditionals
      .map((id) => additionalsList.find((a) => a.id === id)?.name)
      .filter(Boolean);

    const clientFullName = `${firstName} ${lastName}`.trim();
    const instagramFormatted = instagram ? `@${instagram.replace('@', '')}` : 'N/A';
    const deliveryTypeLabel = deliveryType === 'studio' ? 'Recojo en STUDIO - JESUS MARIA' : 'Envío a Domicilio';
    const isPickup = deliveryType === 'studio' || /studio|recojo/i.test(deliveryTypeLabel);
    const studioDireccion = 'Av. Arnaldo Márquez 1165 N° 168';
    const studioReferencia = 'Plaza Márquez';
    const addressFormatted = !isPickup
      ? `${address.trim()}${district || departmentProvince ? ` (${[departmentProvince, district].filter(Boolean).join(' - ')})` : ''}`
      : studioDireccion;
    const referenceFormatted = isPickup ? studioReferencia : (reference.trim() || 'N/A');
    const paymentMethodLabel = paymentMethod === 'yape' ? 'Yape' : paymentMethod === 'plin' ? 'Plin' : 'Transferencia BCP';

    const birthDateFormatted = birthDate ? birthDate : (currentUser?.birthDate || 'N/A');

    let message = '';

    const rightMedidas = `P:${rightHandSizes.thumb || 'N/A'} | I:${rightHandSizes.index || 'N/A'} | M:${rightHandSizes.middle || 'N/A'} | A:${rightHandSizes.ring || 'N/A'} | Me:${rightHandSizes.pinky || 'N/A'}`;
    const leftMedidas = `P:${leftHandSizes.thumb || 'N/A'} | I:${leftHandSizes.index || 'N/A'} | M:${leftHandSizes.middle || 'N/A'} | A:${leftHandSizes.ring || 'N/A'} | Me:${leftHandSizes.pinky || 'N/A'}`;

    let customLengthLabel = customLength.toUpperCase();
    if (customLength === 'xs') customLengthLabel = 'XS | 0 - 1';
    else if (customLength === 's') customLengthLabel = 'S | 2 - 3';
    else if (customLength === 'm') customLengthLabel = 'M | 4 - 5';
    else if (customLength === 'l') customLengthLabel = 'L | 6 - 7';
    else if (customLength === 'xl') customLengthLabel = 'XL | 8 - 9';

    if (activeTabMode === 'catalog') {
      const setNameStr = currentSet?.name || 'Set Press On';
      const sizeStr = selectedSize || 'N/A';
      const deliveryStr = deliveryType === 'studio' ? 'Recojo en Studio' : 'Envío a Domicilio';
      const addressStr = isPickup
        ? studioDireccion
        : `${address.trim() || 'N/A'}${district || departmentProvince ? ` (${[departmentProvince, district].filter(Boolean).join(' - ')})` : ''}`;
      const refStr = isPickup ? studioReferencia : (reference.trim() || 'N/A');
      const bdayStr = birthDate || currentUser?.birthDate || 'N/A';
      const igStr = instagram.trim() ? `@${instagram.trim().replace('@', '')}` : 'N/A';
      const addonsStr = selectedAddonLabels.length > 0 ? selectedAddonLabels.join(', ') : 'N/A';
      const opStr = opNumber;
      message =
        `*✦ CONFIRMACIÓN DE PEDIDO | GABEE STUDIO ✦*\n` +
        `*✧ Reserva:* ${orderCode}\n` +
        `──────────────────────────\n` +
        `*✧ Cliente:* ${clientFullName || 'N/A'}\n` +
        `*✧ WhatsApp:* ${phone || 'N/A'}\n` +
        `*✧ Nombre del set:* ${setNameStr}\n` +
        `*✧ Talla:* ${sizeStr}\n` +
        `*✧ Entrega:* ${deliveryStr}\n` +
        `*✧ Dirección:* ${addressStr}\n` +
        `*✧ Referencia:* ${refStr}\n` +
        `*✧ Cumpleaños:* ${bdayStr}\n` +
        `*✧ Instagram:* ${igStr}\n` +
        `*✧ Adicionales:* ${addonsStr}\n` +
        `──────────────────────────\n` +
        `*✧ Monto Total:* S/. ${finalPressOnTotal.toFixed(2)}\n` +
        `*✧ Método de pago:* ${paymentMethodLabel}\n` +
        `*✧ N° de Operación:* ${opStr}\n` +
        `──────────────────────────\n` +
        `*¡Hola Gaby! Te adjunto mi comprobante de pago para confirmar mi pedido. ¡Muchas gracias! ♡*`;
    } else {
      const nailTypeStr = nailAnatomy ? nailAnatomy.toUpperCase() : 'N/A';
      const healthStr = healthNotes.trim() || 'N/A';
      const designStr = customModificationNotes.trim() || 'N/A';
      const shapeStr = (TIP_INFO[customShape]?.name || customShape) || 'N/A';
      const lengthStr = customLengthLabel || 'N/A';
      const deliveryStr = deliveryType === 'studio' ? 'Recojo en Studio' : 'Envío a Domicilio';
      const addressStr = isPickup
        ? studioDireccion
        : `${address.trim() || 'N/A'}${district || departmentProvince ? ` (${[departmentProvince, district].filter(Boolean).join(' - ')})` : ''}`;
      const refStr = isPickup ? studioReferencia : (reference.trim() || 'N/A');
      const bdayStr = birthDate || currentUser?.birthDate || 'N/A';
      const igStr = instagram.trim() ? `@${instagram.trim().replace('@', '')}` : 'N/A';
      const addonsStr = selectedAddonLabels.length > 0 ? selectedAddonLabels.join(', ') : 'N/A';
      const opStr = opNumber;
      message =
        `*✦ CONFIRMACIÓN DE PEDIDO PERSONALIZADO | GABEE STUDIO ✦*\n` +
        `*✧ Reserva:* ${orderCode}\n` +
        `──────────────────────────\n` +
        `*✧ Cliente:* ${clientFullName || 'N/A'}\n` +
        `*✧ WhatsApp:* ${phone || 'N/A'}\n` +
        `*✧ Medidas (Derecha):* ${rightMedidas}\n` +
        `*✧ Medidas (Izquierda):* ${leftMedidas}\n` +
        `*✧ Tipo de uña:* ${nailTypeStr}\n` +
        `*✧ Nota de salud:* ${healthStr}\n` +
        `*✧ Detalles del Diseño:* ${designStr}\n` +
        `*✧ Forma de la punta:* ${shapeStr}\n` +
        `*✧ Largo de la Uña:* ${lengthStr}\n` +
        `*✧ Entrega:* ${deliveryStr}\n` +
        `*✧ Dirección:* ${addressStr}\n` +
        `*✧ Referencia:* ${refStr}\n` +
        `*✧ Cumpleaños:* ${bdayStr}\n` +
        `*✧ Instagram:* ${igStr}\n` +
        `*✧ Adicionales:* ${addonsStr}\n` +
        `──────────────────────────\n` +
        `*✧ Monto Total:* S/. ${finalPressOnTotal.toFixed(2)}\n` +
        `*✧ Método de pago:* ${paymentMethodLabel}\n` +
        `*✧ N° de Operación:* ${opStr}\n` +
        `──────────────────────────\n` +
        `*¡Hola Gaby! Te adjunto mi comprobante de pago para confirmar mi pedido. ¡Muchas gracias! ♡*`;
    }
    // Intentar usar plantilla personalizada del admin
    try {
      const flow = isPromoFlow ? 'promo_presson' : (activeTabMode === 'catalog' ? 'catalogo_presson' : 'pedido_personalizado');
      const tmpl = getWhatsAppTemplate(settings, flow);
      const vars: Record<string, string> = {
        codigo: orderCode,
        cliente: clientFullName || 'N/A',
        whatsapp: phone || 'N/A',
        servicio: (activeTabMode === 'catalog' ? (currentSet?.name || 'Set Press On') : 'Pedido Personalizado'),
        talla: selectedSize || 'N/A',
        kit: selectedKit || 'N/A',
        medidas_der: `P:${rightHandSizes.thumb || 'N/A'} | I:${rightHandSizes.index || 'N/A'} | M:${rightHandSizes.middle || 'N/A'} | A:${rightHandSizes.ring || 'N/A'} | Me:${rightHandSizes.pinky || 'N/A'}` ,
        medidas_izq: `P:${leftHandSizes.thumb || 'N/A'} | I:${leftHandSizes.index || 'N/A'} | M:${leftHandSizes.middle || 'N/A'} | A:${leftHandSizes.ring || 'N/A'} | Me:${leftHandSizes.pinky || 'N/A'}` ,
        anatomia: nailAnatomy ? nailAnatomy.toUpperCase() : 'N/A',
        nota_salud: healthNotes.trim() || 'N/A',
        detalles: customModificationNotes.trim() || 'N/A',
        forma: (TIP_INFO[customShape]?.name || customShape) || 'N/A',
        largo: customLengthLabel || 'N/A',
        modalidad: deliveryType === 'studio' ? 'Recojo en Studio' : 'Envío a Domicilio',
        direccion: isPickup ? studioDireccion : (address.trim() || 'N/A'),
        referencia: isPickup ? studioReferencia : (reference.trim() || 'N/A'),
        cumpleanos: birthDate || currentUser?.birthDate || 'N/A',
        instagram: instagram.trim() ? `@${instagram.trim().replace('@', '')}` : 'N/A',
        adicionales: selectedAddonLabels.length > 0 ? selectedAddonLabels.join(', ') : 'N/A',
        total: finalPressOnTotal.toFixed(2),
        metodo_pago: paymentMethodLabel,
        operacion: opNumber || 'Sin número de operación',
        numero_operacion: opNumber || 'Sin número de operación',
      };
      const rendered = renderWhatsAppTemplate(tmpl, vars);
      if (rendered) message = rendered;
    } catch (e) {
      // fallback to hardcoded message
    }



    // Save Appointment in AppContext as Pending Confirmation (manual review required)
    createAppointment({
      clientName: clientFullName,
      clientPhone: phone,
      clientInstagram: instagram || undefined,
      birthDate: birthDate || undefined,
      serviceType: isPromoFlow ? 'promotion' : 'custom',
      promoDesignTitle: isPromoFlow
        ? (selectedPressOnPromoItem as any)?.title || `Promo: ${currentSet.name}`
        : activeTabMode === 'catalog'
        ? `Press On: ${currentSet.name}`
        : 'Press On: Pedido Personalizado',
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Press On Order',
      locationType: deliveryType === 'studio' ? 'studio' : 'home',
      homeAddress: deliveryType === 'delivery' ? addressFormatted : undefined,
      status: 'pending_deposit',
      totalPrice: finalPressOnTotal,
      depositRequired: finalPressOnTotal,
      depositPaid: false,
      paymentMethod,
      paymentOperationNumber: opNumber,
      additionals: selectedAdditionals,
      notes: activeTabMode === 'catalog' ? specialNotes : customModificationNotes,
      voucherPhoto: voucherPhoto || undefined,
      photos: naturalHandPhotos.concat(dreamDesignPhotos),
      pressOnDetails: {
        mode: activeTabMode,
        setName: activeTabMode === 'catalog' ? currentSet.name : undefined,
        size: activeTabMode === 'catalog' ? selectedSize : undefined,
        kit: selectedKit,
        rightHandSizes,
        leftHandSizes,
        nailAnatomy,
        healthNotes,
        customShape,
        customLength,
        customModificationNotes,
        naturalHandPhotos,
        dreamDesignPhotos,
        deliveryType,
        address,
        district,
      },
    });

    const encoded = encodeURIComponent(message);
    setOrderConfirmed(true);

    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?phone=${rawNumber}&text=${encoded}`, '_blank');
    }, 400);
  };

  const renderDeliveryModeBanner = () => {
    if (settings.pressOnDeliveryMode === 'high_demand') {
      return (
        <div className="p-3 bg-[#FAF7F2] border border-amber-400/80 rounded-2xl text-xs font-['Marcellus'] text-[#5D3704] flex items-start gap-2.5 shadow-2xs my-2 text-left">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            🔥 <strong>¡Aviso de Alta Demanda!:</strong> Debido a un alto volumen de pedidos, el tiempo estimado de confección y despacho es de <strong>7 a 12 días hábiles</strong>. ¡Gracias por tu preferencia y confianza en mi trabajo! 💖
          </p>
        </div>
      );
    }
    if (settings.pressOnDeliveryMode === 'preorder') {
      return (
        <div className="p-3 bg-[#FAF7F2] border border-amber-400/80 rounded-2xl text-xs font-['Marcellus'] text-[#5D3704] flex items-start gap-2.5 shadow-2xs my-2 text-left">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            🔥 <strong>¡Aviso de Pre-Orden!:</strong> Estamos en días de descanso/capacitación. Tu set se confeccionará y despachará con un margen de <strong>10 a 15 días hábiles</strong>. ¡Gracias por tu preferencia y confianza en mi trabajo! 💖
          </p>
        </div>
      );
    }
    return null;
  };

﻿  // ---- Computations (restored) ----
  const additionalsTotalCost = useMemo(() => {
    return selectedAdditionals.reduce((sum, id) => {
      const found = additionalsList.find((a) => a.id === id);
      return sum + (found ? found.price : 0);
    }, 0);
  }, [selectedAdditionals, additionalsList]);

  const assignedKitSafe = assignedKit;

  const kitCost = useMemo(() => {
    if (activeTabMode === 'custom') return 0;
    if (!isPromoFlow) {
      if (
        (selectedKit === 'Standard' && assignedKitSafe === 'standard') ||
        (selectedKit === 'Premium' && assignedKitSafe === 'premium') ||
        (selectedKit === 'Elemental' && assignedKitSafe === 'elemental')
      ) return 0;
      if (selectedKit === 'Premium') return 25;
      if (selectedKit === 'Standard') return 20;
      if (selectedKit === 'Elemental') return 10;
      return 0;
    }
    const isGift =
      (selectedKit === 'Elemental' && assignedKitSafe === 'elemental') ||
      (selectedKit === 'Standard' && assignedKitSafe === 'standard') ||
      (selectedKit === 'Premium' && assignedKitSafe === 'premium');
    if (isGift) return 0;
    if (selectedKit === 'Elemental') return 10;
    if (selectedKit === 'Standard') return 20;
    if (selectedKit === 'Premium') return 25;
    return 0;
  }, [selectedKit, assignedKitSafe, activeTabMode, isPromoFlow]);

  const customShapeExtra = activeTabMode === 'custom' && customShape === 'stiletto' ? 10 : 0;

  const customLengthExtra = useMemo(() => {
    if (activeTabMode !== 'custom') return 0;
    if (customLength === 'm') return 10;
    if (customLength === 'l') return 20;
    if (customLength === 'xl') return 30;
    return 0;
  }, [activeTabMode, customLength]);

  const finalPressOnTotal = useMemo(() => {
    if (activeTabMode === 'custom') {
      return 80.0 + customShapeExtra + customLengthExtra + kitCost + additionalsTotalCost;
    } else {
      return (currentSet?.price || 0) + kitCost + additionalsTotalCost;
    }
  }, [activeTabMode, currentSet, customShapeExtra, customLengthExtra, kitCost, additionalsTotalCost]);

  // ---- Handlers (restored) ----
  const handleSelectSetAndAdvance = (index: number) => {
    setValidationToast(null);
    setSelectedPressOnPromoItem(null);
    setSelectedSetIndex(index);
    setStep(2);
  };

  // CATÁLOGO: exige talla y kit antes de avanzar
  const handleCatalogSizeKitContinue = () => {
    if (!selectedSize && !selectedKit) {
      showValidationToast('Para continuar, por favor selecciona tu talla y tu kit de aplicación.', 3500);
      return;
    }
    if (!selectedSize) {
      showValidationToast('Para continuar, por favor selecciona tu talla.', 3500);
      return;
    }
    if (!selectedKit) {
      showValidationToast('Para continuar, por favor selecciona tu kit de aplicación.', 3500);
      return;
    }
    setValidationToast(null);
    setStep(3);
  };

  const isValidCmMeasurement = (value: string) => {
    const normalized = value.trim().replace(',', '.');
    return normalized !== '' && Number.isFinite(Number(normalized)) && Number(normalized) > 0;
  };

  // PERSONALIZADO: exige medidas, foto de manos y anatomía antes de avanzar
  const handleCustomMeasurementsContinue = () => {
    const measurementsComplete = [...Object.values(rightHandSizes), ...Object.values(leftHandSizes)].every(
      isValidCmMeasurement
    );

    if (!measurementsComplete || naturalHandPhotos.length === 0 || !nailAnatomy) {
      showValidationToast(
        'Para continuar con tu pedido personalizado, primero completa tus medidas en centímetros, adjunta la foto de tus manos al lado de una moneda y selecciona tu anatomía.',
        4000
      );
      return;
    }
    setValidationToast(null);
    setCustomStep(2);
  };

  const toggleAdditionalItem = (id: string) => {
    setSelectedAdditionals((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleNaturalHandPhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      filesArr.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setNaturalHandPhotos((prev) => [...prev, reader.result as string].slice(0, 3));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDreamDesignPhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      filesArr.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setDreamDesignPhotos((prev) => [...prev, reader.result as string].slice(0, 3));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Admin stubs (minimal, to keep compile; admin editing may be limited)
  const handleOpenAddItem = () => {};
  const handleSaveItem = () => {};
  const handleDeleteItem = (_id: string, _e?: any) => {};
  const handleResetCatalogToDefault = () => {};


﻿  // ---- Additional stubs/restored state ----
  const [applyBirthdayDiscount, setApplyBirthdayDiscount] = useState(false);
  const birthdayDiscount = calculateBirthdayDiscount ? calculateBirthdayDiscount(currentUser?.roulettePrize || null, finalPressOnTotal) : { discountAmount: 0, label: '', isGratis: false, percentage: 0 };
  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  const calculatedTotal = finalPressOnTotal;
  const handleOpenEditItem = (_item: any) => {};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Aviso emergente temporal de validación */}
        {validationToast && (
          <div className="absolute inset-x-0 top-16 z-40 flex justify-center px-4 pointer-events-none animate-fadeIn">
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-auto flex items-start gap-2.5 w-full max-w-lg px-4 py-3 rounded-2xl bg-[#FDFBF7]/95 backdrop-blur-md border border-[#D4AF37]/70 shadow-[0_10px_35px_rgba(92,55,4,0.18)]"
            >
              <Info className="w-4 h-4 text-[#C89D3C] shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs font-['Marcellus'] text-[#5D3704] leading-snug">
                {validationToast}
              </p>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => setValidationToast(null)}
                className="ml-auto shrink-0 p-0.5 text-[#5D3704]/60 hover:text-[#5D3704] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* HEADER: Dynamic according to step & active tab mode             */}
        {/* ============================================================== */}
        <div
          className="px-5 py-3.5 border-b border-[#E8DEC9] flex items-center justify-between"
          style={{
            backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
            backgroundSize: '220px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          {/* Logo & Title Box */}
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-xs px-4 py-2 rounded-2xl border border-[#D5C6B1] shadow-xs">
            <GabeeBeeMark size="sm" />
            <div>
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704] block">
                PRESS ON NAILS · GABEE STUDIO
              </span>
              <h3 className="text-sm sm:text-base font-['Cinzel'] font-bold text-[#5D3704] leading-tight">
                {activeTabMode === 'catalog'
                  ? step === 1
                    ? 'ELIGE TU SET'
                    : step === 2
                    ? 'ELIGE TU TALLA Y KIT'
                    : step === 3
                    ? 'MODALIDAD DE ENTREGA Y TUS DATOS'
                    : 'PAGO Y CONFIRMACIÓN'
                  : customStep === 1
                  ? 'ENVÍA TU TALLA'
                  : customStep === 2 && step < 3
                  ? 'PERSONALIZA TU DISEÑO'
                  : step === 3
                  ? 'MODALIDAD DE ENTREGA Y TUS DATOS'
                  : 'PAGO Y CONFIRMACIÓN'}
              </h3>
            </div>
          </div>

          {/* Mode Switcher Tabs Header */}
          <div className="flex items-center gap-2">
            {!orderConfirmed && (
              <div className="hidden sm:flex bg-[#EFE5D7] p-1 rounded-xl border border-[#D5C6B1]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPressOnPromoItem(null);
                    setActiveTabMode('catalog');
                    setStep(1);
                  }}
                  className={`py-1.5 px-3.5 rounded-lg text-xs font-['Cinzel'] font-bold transition-all cursor-pointer ${
                    activeTabMode === 'catalog'
                      ? 'bg-[#F5EBE1] border border-[#5D3704]/40 text-[#5D3704] shadow-xs'
                      : 'text-[#5D3704]/70 hover:bg-[#FAF7F2]'
                  }`}
                >
                  Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('custom');
                    setCustomStep(1);
                    setStep(1);
                  }}
                  className={`py-1.5 px-3.5 rounded-lg text-xs font-['Cinzel'] font-bold transition-all cursor-pointer ${
                    activeTabMode === 'custom'
                      ? 'bg-[#F5EBE1] border border-[#5D3704]/40 text-[#5D3704] shadow-xs'
                      : 'text-[#5D3704]/70 hover:bg-[#FAF7F2]'
                  }`}
                >
                  Personalizado
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-[#5D3704] bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] rounded-full shadow-xs transition-transform hover:scale-105 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        {!orderConfirmed && (
          <div className="w-full bg-[#EFE7DC] h-1.5 relative overflow-hidden">
            <div
              className="h-full bg-[#5D3704] transition-all duration-500 ease-out"
              style={{
                width:
                  step === 4
                    ? '100%'
                    : step === 3
                    ? '75%'
                    : activeTabMode === 'catalog'
                    ? step === 1
                      ? '25%'
                      : '50%'
                    : customStep === 1
                    ? '25%'
                    : '50%',
              }}
            />
          </div>
        )}

        {/* Slim Horizontal Timer Banner below progress bar */}
        {isTimerActive && !orderConfirmed && (
          <div className="w-full bg-[#F5EBE1]/95 border-b border-[#D5C6B1] px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-['Cinzel'] font-bold text-[#5D3704] shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#5D3704] animate-pulse" />
            <span>
              TU CUPO ESTÁ RESERVADO POR: {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')} MIN
            </span>
          </div>
        )}

        {/* Admin Bar Notification when active */}
        {adminMode && (
          <div className="bg-[#3E2723] text-white px-5 py-2 text-xs font-['Cinzel'] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                <strong>Modo Administrador:</strong> Gestiona imágenes, precios y nombres del catálogo Press On.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddItem}
                className="py-1 px-3 bg-[#D4AF37] hover:bg-[#c29d2b] text-[#3E2723] font-bold rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Nuevo Set</span>
              </button>
              <button
                type="button"
                onClick={handleResetCatalogToDefault}
                className="py-1 px-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                title="Restaurar los 3 sets por defecto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F5EFEB]/90">
          {orderConfirmed ? (
            /* ORDER SUCCESS SCREEN (Inspirado en PEDIDO.png y PromoPressOnModal) */
            <div className="max-w-xl mx-auto py-3 text-center space-y-3 animate-fadeIn">
              {/* Círculo translúcido en tonos dorados con brillo suave y check dorado brillante */}
              <div className="w-20 h-20 bg-[#FBF7EE] rounded-full flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-[#D4AF37]/60 animate-bounce">
                <Check className="w-10 h-10 text-[#C89D3C] filter drop-shadow-[0_2px_4px_rgba(200,157,60,0.5)]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704] uppercase tracking-tight">
                  PEDIDO CONFIRMADO CON ÉXITO
                </h3>
                <span className="text-xs font-['Cinzel'] font-bold uppercase tracking-widest text-[#9C7954] block">
                  CÓDIGO DE ORDEN: {generatedOrderCode}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704]/90 leading-relaxed max-w-md mx-auto">
                Nuestro equipo confirmará tu comprobante y luego procederemos a alistar tu pedido, cualquier duda adicional puedes comunicarte con nosotros presionando en el botón de WhatsApp 💬
              </p>

              {/* Recuadro limpio con la lista detallada del pedido */}
              <div className="bg-white/95 p-3.5 sm:p-4 rounded-2xl border border-[#D4AF37]/40 text-left space-y-2 shadow-xs text-xs font-['Marcellus'] text-[#5D3704]">
                <div className="flex justify-between border-b border-[#EFE5D7] pb-2 font-['Cinzel'] font-bold uppercase">
                  <span>Cliente:</span>
                  <span>{firstName} {lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Set: <strong>{activeTabMode === 'catalog' ? (currentSet?.name || 'Set Press On') : 'Pedido Personalizado'}</strong> (Talla {selectedSize})</span>
                  <span className="font-mono font-bold">S/. {(activeTabMode === 'catalog' ? (currentSet?.price || 75) : 80).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Kit Incluido: <strong>Kit {selectedKit}</strong></span>
                  <span className="font-mono font-bold text-emerald-700">S/. 0.00 (Gratis)</span>
                </div>
                <div className="flex justify-between">
                  <span>• Modalidad: <strong>{deliveryType === 'studio' ? 'Recojo en Studio Jesús María' : `Envío a Domicilio (${address})`}</strong></span>
                  <span className="font-mono font-bold">{deliveryType === 'studio' ? 'Gratis' : 'Por calcular'}</span>
                </div>
                {selectedAdditionals.length > 0 && (
                  <div className="flex justify-between">
                    <span>• Adicionales ({selectedAdditionals.length})</span>
                    <span className="font-mono font-bold">+ S/. {additionalsTotalCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#DFD1BD] font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  <span>TOTAL A CANCELAR:</span>
                  <span className="font-mono text-[#C89D3C]">S/. {finalPressOnTotal.toFixed(2)}</span>
                </div>
                {paymentOperationNumber && (
                  <div className="flex justify-between text-[11px] text-[#5D3704]/70 pt-1">
                    <span>Operación {paymentMethod.toUpperCase()}:</span>
                    <span className="font-mono">{paymentOperationNumber}</span>
                  </div>
                )}
              </div>

              {/* Botón con verde oficial de WhatsApp (#25D366) e icono de avioncito de papel */}
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const waPhone = '51' + (settings.whatsappNumber || '934403311').replace(/[^0-9]/g, '').replace(/^51/, '');
                    const clientBirthday = birthDate || currentUser?.birthDate || 'N/A';
                    const isPickupResend = deliveryType === 'studio';
                    const addressStr = isPickupResend ? 'Av. Arnaldo Márquez 1165 N° 168' : `${address.trim()}${district.trim() ? ` (${district.trim()})` : ''}`.trim() || 'N/A';
                    const referenceStr = isPickupResend ? 'Plaza Márquez' : (reference.trim() || 'N/A');
                    const instagramStr = instagram.trim() ? `@${instagram.trim().replace('@', '')}` : 'N/A';
                    const setNameStr = activeTabMode === 'catalog' ? (currentSet?.name || 'Set Press On') : 'Pedido 100% Personalizado';
                    const additionalsListNames = selectedAdditionals.length > 0
                      ? selectedAdditionals.map((id) => pressOnAdditionals.find((a: any) => a.id === id)?.name).filter(Boolean).join(', ')
                      : '';
                    const notesStr = specialNotes.trim() ? `Nota: ${specialNotes.trim()}` : '';
                    const additionalsStr = [additionalsListNames, notesStr].filter(Boolean).join(' | ') || 'N/A';

                    const waMsg = `*✦ CONFIRMACIÓN DE PEDIDO | GABEE STUDIO ✦*\n` +
                      `*✧ Reserva:* ${generatedOrderCode}\n` +
                      `──────────────────────────\n` +
                      `*✧ Cliente:* ${firstName.trim() || 'N/A'} ${lastName.trim() || 'N/A'}\n` +
                      `*✧ WhatsApp:* ${phone.trim() || 'N/A'}\n` +
                      `*✧ Nombre del set:* ${setNameStr || 'N/A'}\n` +
                      `*✧ Talla:* ${selectedSize || 'N/A'}\n` +
                      `*✧ Entrega:* ${deliveryType === 'studio' ? 'Recojo en Studio' : 'Envío a Domicilio'}\n` +
                      `*✧ Dirección:* ${addressStr || 'N/A'}\n` +
                      `*✧ Referencia:* ${referenceStr}\n` +
                      `*✧ Cumpleaños:* ${clientBirthday || 'N/A'}\n` +
                      `*✧ Instagram:* ${instagramStr || 'N/A'}\n` +
                      `*✧ Adicionales:* ${additionalsStr || 'N/A'}\n` +
                      `──────────────────────────\n` +
                      `*✧ Monto Total:* S/. ${finalPressOnTotal.toFixed(2)}\n` +
                      `*✧ Método de pago:* ${paymentMethod.toUpperCase()}\n` +
                      `*✧ N° de Operación:* ${paymentOperationNumber.trim()}\n` +
                      `──────────────────────────\n` +
                      `*¡Hola Gaby! Te adjunto mi comprobante de pago para confirmar mi pedido. ¡Muchas gracias! ♡*`;

                    window.open(`https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waMsg)}`, '_blank');
                    onClose();
                  }}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs sm:text-sm font-['Cinzel'] font-bold tracking-wider cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <span>CONTINUAR POR WHATSAPP</span>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ) : activeTabMode === 'catalog' ? (
            /* ============================================================== */
            /* FLOW A: CATÁLOGO PRESS ON                                      */
            /* ============================================================== */
            <>
              {/* PASO 1 : ELIGE TU SET (GRILLA DEL CATÁLOGO) */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Header text requirement 1 */}
                  <div className="text-center max-w-xl mx-auto space-y-1.5 pt-1">
                    <div className="text-xs uppercase tracking-widest font-['Cinzel'] font-bold text-[#C89D3C]">
                      ✦ ENCUENTRA TU SET FAVORITO ✦
                    </div>
                    <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704]/90 max-w-lg mx-auto leading-relaxed">
                      Déjate enamorar por nuestros diseños y elige tu favorito para personalizar tu talla y tu kit de aplicación paso a paso 💕.
                    </p>
                    {renderDeliveryModeBanner()}
                  </div>

                  {/* Sets Grid - Clean Cards with Photo, Name, Price, and "ELEGIR ♥" */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-2 max-h-[62vh] overflow-y-auto pr-1">
                    {catalogItems.map((item, idx) => {
                      const isSelected = selectedSetIndex === idx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSetAndAdvance(idx)}
                          className={`rounded-2xl sm:rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-lg group relative ${
                            isSelected
                              ? 'border-[#5D3704] ring-2 ring-[#5D3704]/40 shadow-md bg-[#FAF7F2]'
                              : 'border-[#DFD1BD] hover:border-[#5D3704]/50 shadow-xs'
                          }`}
                        >
                          {/* Admin Overlay Controls */}
                          {adminMode && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-xs p-1.5 rounded-xl"
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1 text-white hover:text-[#D4AF37] transition-colors cursor-pointer"
                                title="Editar set"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteItem(item.id, e)}
                                className="p-1 text-rose-300 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Eliminar set"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div>
                            {/* Card Main Photo */}
                            <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F0E6D8]">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />

                              {/* Dynamic Badges Overlay */}
                              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                                {item.stock === 0 ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2]/95 backdrop-blur-xs border border-rose-400 text-[10px] font-['Cinzel'] font-bold text-rose-800 shadow-xs">
                                    Agotado / Bajo Pedido
                                  </span>
                                ) : item.stock !== undefined && item.stock <= 3 ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2]/95 backdrop-blur-xs border border-[#C5A059] text-[10px] font-['Cinzel'] font-bold text-[#5D3704] shadow-xs">
                                    ✦ ¡Solo quedan {item.stock} unidades!
                                  </span>
                                ) : null}

                                {item.isTrending && (
                                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2]/95 backdrop-blur-xs border border-[#C5A059] text-[10px] font-['Cinzel'] font-bold text-[#5D3704] shadow-xs">
                                    ◈ Tendencia Coreana
                                  </span>
                                )}

                                {item.isBestSeller && (
                                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2]/95 backdrop-blur-xs border border-[#C5A059] text-[10px] font-['Cinzel'] font-bold text-[#5D3704] shadow-xs">
                                    ✧ Más Vendido
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Title Only */}
                            <div className="p-4 space-y-1 text-center">
                              <h4 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] leading-snug tracking-wide uppercase">
                                {item.name}
                              </h4>
                            </div>
                          </div>

                          {/* Card Footer: Price & ELEGIR ♥ Button */}
                          <div className="p-4 pt-0">
                            <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                              <span className="font-['Cinzel'] font-bold text-sm sm:text-base text-[#C89D3C]">
                                S/. {item.price.toFixed(2)}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSetAndAdvance(idx);
                                }}
                                className="py-2 px-3.5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              >
                                <span>ELEGIR ♥</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 2 : CONFIGURACIÓN DEL SET SELECCIONADO ("ELIGE TU TALLA Y KIT") */}
              {step === 2 && (
                <div className="max-w-3xl mx-auto space-y-5">
                  <div className="bg-white/95 rounded-2xl sm:rounded-3xl border border-[#DFD1BD] p-5 sm:p-7 space-y-6 shadow-sm">
                    {/* Compact Header for Step 2 */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DEC9] space-y-3">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Compact Single Photo */}
                        <div
                          onClick={() => setLightboxImage(currentSet.image)}
                          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-[#DFD1BD] bg-[#F0E6D8] cursor-pointer group shrink-0 shadow-xs hover:shadow-md transition-all"
                        >
                          <img
                            src={currentSet.image}
                            alt={currentSet.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/90 text-[#5D3704] text-[9px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              <ZoomIn className="w-3 h-3" /> Ampliar
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DEC9] pb-2">
                            <div>
                              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#9C7954] block">
                                SET SELECCIONADO:
                              </span>
                              <h3 className="text-base sm:text-lg font-['Cinzel'] font-bold text-[#5D3704] uppercase">
                                {currentSet.name}
                              </h3>
                            </div>
                            <div className="text-center sm:text-right">
                              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#9C7954] block">
                                PRECIO:
                              </span>
                              <span className="text-base sm:text-xl font-['Cinzel'] font-bold text-[#C89D3C]">
                                S/. {currentSet.price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Full Description Box */}
                          <div className="p-2.5 bg-white rounded-xl border border-[#DFD1BD]/80">
                            <p className="text-xs font-['Marcellus'] text-[#5D3704]/90 leading-relaxed">
                              {currentSet.fullDesc || currentSet.shortDesc || 'Set artesanal exclusivo elaborado a mano con geles de alta gama.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SELECCIÓN DE TALLA */}
                    <div className="space-y-2 pt-2">
                      {isPromoFlow && (
                        <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 text-[11px] font-['Marcellus'] flex items-center gap-2 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Las tarifas de promoción no acumulan BeeCoins ni beneficios VIP.</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                          SELECCIONA TU TALLA:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowSizeChart(true)}
                          className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] hover:text-[#C89D3C] flex items-center gap-1 underline underline-offset-2 cursor-pointer transition-colors"
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>Ver tabla de centímetros</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                        {(['XS', 'S', 'M', 'L'] as SizeType[]).map((size) => {
                          const isAvailable = currentSet.sizeStock
                            ? (currentSet.sizeStock[size] ?? true)
                            : (settings.sizeStock?.[size] ?? true);
                          const isSelected = selectedSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => isAvailable && setSelectedSize(size)}
                              className={`py-3 rounded-xl border text-xs sm:text-sm font-['Cinzel'] font-bold transition-all relative flex flex-col items-center justify-center ${
                                !isAvailable
                                  ? 'bg-gray-100/70 text-gray-400 border-gray-300 line-through opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-[#F5EBE1] text-[#5D3704] border-[#5D3704] ring-1 ring-[#5D3704] shadow-xs cursor-pointer'
                                  : 'bg-[#FAF7F2] text-[#5D3704]/80 border-[#DFD1BD] hover:border-[#5D3704]/50 cursor-pointer'
                              }`}
                            >
                              <span>{size}</span>
                              {!isAvailable && (
                                <span className="text-[8px] font-['Cinzel'] font-bold text-rose-700 block mt-0.5 no-underline uppercase tracking-wider">
                                  Agotado
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* KIT DE APLICACIÓN INCLUIDO */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                          KIT DE APLICACIÓN INCLUIDO:
                        </label>
                        <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704] bg-[#F5EBE1] px-2.5 py-0.5 rounded-full border border-[#D5C6B1]">
                          ¡PROMO APLICADA!
                        </span>
                      </div>

                      {/* Banner de Beneficio Personalizado según el kit asignado al set */}
                      <div className="p-3 sm:p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#D4AF37]/50 text-xs font-['Marcellus'] text-[#5D3704] flex items-center gap-2.5 shadow-2xs">
                        <Gift className="w-4 h-4 shrink-0 text-[#C89D3C]" />
                        <span>
                          <strong>¡Beneficio aplicado!</strong> Tu set incluye el{' '}
                          <strong>
                            {assignedKit === 'premium'
                              ? 'Kit Premium (Valorizado en S/. 25)'
                              : assignedKit === 'elemental'
                              ? 'Kit Elemental (Valorizado en S/. 10)'
                              : 'Kit Standard (Valorizado en S/. 20)'}{' '}
                            ¡GRATIS!
                          </strong>
                        </span>
                      </div>

                      {/* Kit Options: Visualización Inteligente de Kits */}
                      <div className="space-y-2.5">
                        {/* Kit Elemental - Rendered ONLY in Promo Flow if elemental is assigned */}
                        {isPromoFlow && assignedKit === 'elemental' && (
                          <label
                            onClick={() => setSelectedKit('Elemental')}
                            className="flex items-start justify-between p-3.5 rounded-xl border border-[#D4AF37] bg-[#FAF7F2] ring-1 ring-[#D4AF37] cursor-pointer transition-all shadow-xs"
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="kit-radio"
                                checked={selectedKit === 'Elemental'}
                                onChange={() => setSelectedKit('Elemental')}
                                className="mt-0.5 text-[#5D3704]"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                                    KIT ELEMENTAL
                                  </span>
                                  <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37] bg-[#FAF7F2] px-2 py-0.5 rounded-full shadow-2xs">
                                    ¡INCLUIDO GRATIS!
                                  </span>
                                </div>
                                <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80 mt-1 leading-snug">
                                  Lima de preparación, plancheta de pegatinas adhesivas (24 pcs), pegamento líquido, repujador de madera, alcohol pad preparador, stickers decorativos y regalo sorpresa ♥
                                </p>
                              </div>
                            </div>
                            <div className="text-xs font-['Cinzel'] font-bold text-[#5D3704] whitespace-nowrap ml-2">
                              <div className="text-right">
                                <span className="line-through text-[#5D3704]/40 mr-1.5 text-[11px]">S/. 10.00</span>
                                <span className="text-[#C89D3C] font-bold text-xs sm:text-sm">S/. 0.00</span>
                              </div>
                            </div>
                          </label>
                        )}

                        {/* Kit Standard - Rendered ONLY if assignedKit is standard (or default not premium) */}
                        {assignedKit === 'standard' && (
                          <label
                            onClick={() => setSelectedKit('Standard')}
                            className="flex items-start justify-between p-3.5 rounded-xl border border-[#D4AF37] bg-[#FAF7F2] ring-1 ring-[#D4AF37] cursor-pointer transition-all shadow-xs"
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="kit-radio"
                                checked={selectedKit === 'Standard'}
                                onChange={() => setSelectedKit('Standard')}
                                className="mt-0.5 text-[#5D3704]"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                                    KIT STANDARD
                                  </span>
                                  <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37] bg-[#FAF7F2] px-2 py-0.5 rounded-full shadow-2xs">
                                    ¡INCLUIDO GRATIS!
                                  </span>
                                </div>
                                <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80 mt-1 leading-snug">
                                  Lima, Buffer, Repujador, Palito removedor, 2 Alcohol Pad, 2 Pegatinas, 2 pegamentos líquidos, Stickers y Regalito sorpresa ♥
                                </p>
                              </div>
                            </div>
                            <div className="text-xs font-['Cinzel'] font-bold text-[#5D3704] whitespace-nowrap ml-2">
                              <div className="text-right">
                                <span className="line-through text-[#5D3704]/40 mr-1.5 text-[11px]">S/. 20.00</span>
                                <span className="text-[#C89D3C] font-bold text-xs sm:text-sm">S/. 0.00</span>
                              </div>
                            </div>
                          </label>
                        )}

                        {/* Kit Premium - Rendered ONLY if assignedKit is premium */}
                        {assignedKit === 'premium' && (
                          <label
                            onClick={() => setSelectedKit('Premium')}
                            className="flex items-start justify-between p-3.5 rounded-xl border border-[#D4AF37] bg-[#FAF7F2] ring-1 ring-[#D4AF37] cursor-pointer transition-all shadow-xs"
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="kit-radio"
                                checked={selectedKit === 'Premium'}
                                onChange={() => setSelectedKit('Premium')}
                                className="mt-0.5 text-[#5D3704]"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                                    KIT PREMIUM
                                  </span>
                                  <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37] bg-[#FAF7F2] px-2 py-0.5 rounded-full shadow-2xs">
                                    ¡INCLUIDO GRATIS!
                                  </span>
                                </div>
                                <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80 mt-1 leading-snug">
                                  Lima Large, Buffer, Repujador, Palito removedor, 2 Alcohol Pad, 4 Pegatinas, 1 Pegamento líquido grande, Aceite de cutícula nutritivo, Cepillo de uñas, Stickers y Regalito sorpresa ♥
                                </p>
                              </div>
                            </div>
                            <div className="text-xs font-['Cinzel'] font-bold text-[#5D3704] whitespace-nowrap ml-2">
                              <div className="text-right">
                                <span className="line-through text-[#5D3704]/40 mr-1.5 text-[11px]">S/. 25.00</span>
                                <span className="text-[#C89D3C] font-bold text-xs sm:text-sm">S/. 0.00</span>
                              </div>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* COLLAPSIBLE ACCORDION: SERVICIOS ADICIONALES & COMPLEMENTOS */}
                    <div className="border border-[#DFD1BD] rounded-2xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className="w-full p-4 bg-[#F5EBE1]/70 hover:bg-[#F5EBE1] flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#C89D3C]" />
                          <span className="text-xs font-['Cinzel'] font-bold uppercase text-[#5D3704]">
                            SERVICIOS ADICIONALES & COMPLEMENTOS
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5D3704]">
                          {selectedAdditionals.length > 0 && (
                            <span className="text-[10px] font-['Cinzel'] font-bold bg-[#5D3704] text-white px-2 py-0.5 rounded-full">
                              {selectedAdditionals.length} seleccionados
                            </span>
                          )}
                          {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isAccordionOpen && (
                        <div className="p-4 space-y-3 bg-[#FAF7F2] border-t border-[#E8DEC9] max-h-60 overflow-y-auto">
                          {pressOnAdditionals.length === 0 ? (
                            <p className="text-xs font-['Marcellus'] text-[#5D3704]/70">
                              No hay adicionales registrados para esta sección.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {pressOnAdditionals.map((add) => {
                                const isChecked = selectedAdditionals.includes(add.id);
                                return (
                                  <div
                                    key={add.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleAdditionalItem(add.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === ' ' || e.key === 'Enter') {
                                        e.preventDefault();
                                        toggleAdditionalItem(add.id);
                                      }
                                    }}
                                    className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all select-none ${
                                      isChecked
                                        ? 'bg-white border-[#5D3704] ring-1 ring-[#5D3704] shadow-xs'
                                        : 'bg-white/80 border-[#DFD1BD] hover:border-[#5D3704]/40 hover:bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5 pointer-events-none">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        readOnly
                                        tabIndex={-1}
                                        className="mt-0.5 text-[#5D3704] accent-[#5D3704]"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                                            {add.name}
                                          </span>
                                          {add.badge?.trim() && (
                                            <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider bg-[#F5EBE1] text-[#8C6B1C] border border-[#D4AF37]/50 px-1.5 py-0.5 rounded-md shrink-0">
                                              {add.badge.trim()}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/70 line-clamp-1">
                                          {add.description}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-xs font-['Cinzel'] font-bold text-[#C89D3C] shrink-0 ml-2 pointer-events-none">
                                      + S/. {add.price}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ============================================================== */
            /* FLOW B: PEDIDO PERSONALIZADO                                    */
            /* ============================================================== */
            <>
              {step < 3 && (
                customStep === 1 ? (
                  /* PASO 1: ENCABEZADO "ENVÍA TU TALLA" */
                  <div className="max-w-3xl mx-auto space-y-6">
                    {renderDeliveryModeBanner()}
                    {/* 1. Welcoming Message & Base Price S/. 80 */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#DFD1BD] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4">
                    <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704] leading-relaxed flex-1">
                      Tu estilo es único y tus uñas también. Cuando eliges un diseño personalizado, me encargo de cuidar cada detalle, tamaño y forma para ti. Ayúdame enviándome tus medidas bien exactas para que el resultado sea impecable y calce divino en tus manos ✨🌸.
                    </p>
                    <div className="bg-[#FAF7F2] border border-[#D5C6B1] p-3 rounded-2xl text-center shrink-0 w-full sm:w-auto">
                      <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                        PRECIO BASE:
                      </span>
                      <span className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#C89D3C]">
                        S/. 80.00
                      </span>
                    </div>
                  </div>

                  {/* 2. Visual Measurement Guide */}
                  <div className="space-y-2">
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-[#C89D3C]" />
                      <span>GUÍA VISUAL DE MEDIDAS (HAZ CLIC PARA AMPLIAR):</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Método de la Moneda */}
                      <div
                        onClick={() => setLightboxImage('/assets/aistudio/M_TODO_DE_LA_MONEDA_fc5fdd97.png')}
                        className="relative aspect-square sm:aspect-4/3 rounded-2xl overflow-hidden border border-[#DFD1BD] bg-[#FAF7F2] cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src="/assets/aistudio/M_TODO_DE_LA_MONEDA_fc5fdd97.png"
                          alt="Método de la Moneda"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-[#5D3704] text-[10px] font-['Cinzel'] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xs">
                            <ZoomIn className="w-3.5 h-3.5" /> Ampliar Método de la Moneda
                          </span>
                        </div>
                      </div>

                      {/* Método de la Cinta */}
                      <div
                        onClick={() => setLightboxImage('/assets/aistudio/M_TODO_DE_LA_CINTA_93ee9fef.png')}
                        className="relative aspect-square sm:aspect-4/3 rounded-2xl overflow-hidden border border-[#DFD1BD] bg-[#FAF7F2] cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src="/assets/aistudio/M_TODO_DE_LA_CINTA_93ee9fef.png"
                          alt="Método de la Cinta"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-[#5D3704] text-[10px] font-['Cinzel'] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xs">
                            <ZoomIn className="w-3.5 h-3.5" /> Ampliar Método de la Cinta
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Tabla de Medidas por Mano y Dedo */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#DFD1BD] p-5 sm:p-6 space-y-4 shadow-xs">
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block border-b border-[#EFE5D7] pb-2">
                      TABLA DE MEDIDAS POR DEDO (INGRESAR EN CENTÍMETROS - CM):
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Mano Derecha */}
                      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] space-y-2.5">
                        <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] uppercase block border-b border-[#EFE5D7] pb-1">
                          🖐️ MANO DERECHA
                        </span>
                        {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => {
                          const labels: Record<string, string> = {
                            thumb: 'Pulgar',
                            index: 'Índice',
                            middle: 'Medio',
                            ring: 'Anular',
                            pinky: 'Meñique',
                          };
                          return (
                            <div key={finger} className="flex items-center justify-between text-xs font-['Marcellus']">
                              <span className="text-[#5D3704] font-bold">{labels[finger]}:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={rightHandSizes[finger]}
                                  onChange={(e) => setRightHandSizes((prev) => ({ ...prev, [finger]: e.target.value }))}
                                  placeholder="Ej: 1.5"
                                  className="w-20 p-1.5 text-center text-xs bg-white border border-[#DFD1BD] rounded-lg text-[#5D3704] font-bold"
                                />
                                <span className="text-[#5D3704]/70 text-[10px]">cm</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mano Izquierda */}
                      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] space-y-2.5">
                        <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] uppercase block border-b border-[#EFE5D7] pb-1">
                          🤚 MANO IZQUIERDA
                        </span>
                        {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => {
                          const labels: Record<string, string> = {
                            thumb: 'Pulgar',
                            index: 'Índice',
                            middle: 'Medio',
                            ring: 'Anular',
                            pinky: 'Meñique',
                          };
                          return (
                            <div key={finger} className="flex items-center justify-between text-xs font-['Marcellus']">
                              <span className="text-[#5D3704] font-bold">{labels[finger]}:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={leftHandSizes[finger]}
                                  onChange={(e) => setLeftHandSizes((prev) => ({ ...prev, [finger]: e.target.value }))}
                                  placeholder="Ej: 1.5"
                                  className="w-20 p-1.5 text-center text-xs bg-white border border-[#DFD1BD] rounded-lg text-[#5D3704] font-bold"
                                />
                                <span className="text-[#5D3704]/70 text-[10px]">cm</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 4. Adjuntar Foto de Manos y Anatomía Ungueal */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#DFD1BD] p-5 sm:p-6 space-y-4 shadow-xs">
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block border-b border-[#EFE5D7] pb-2">
                      FOTO DE TUS MANOS NATURALES & ANATOMÍA UNGUEAL:
                    </label>

                    {/* Uploader */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#5D3704]/30 text-center space-y-2">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {naturalHandPhotos.map((photo, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D5C6B1]">
                            <img src={photo} alt="Foto mano" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNaturalHandPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {naturalHandPhotos.length < 3 && (
                        <label className="py-2.5 px-4 rounded-xl bg-[#F5EBE1] border border-[#C89D3C] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all">
                          <Camera className="w-4 h-4 text-[#C89D3C]" />
                          <span>ADJUNTAR FOTOS</span>
                          <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif" multiple onChange={handleNaturalHandPhotosUpload} className="hidden" />
                        </label>
                      )}
                      <p className="text-[10px] font-['Marcellus'] text-[#5D3704]/70">
                        * Puedes subir hasta 3 fotos claras de tus manos con buena luz.
                      </p>
                    </div>

                    {/* 3 Selectable Natural Nail Types */}
                    <div>
                      <label className="text-xs font-['Cinzel'] font-bold text-[#5D3704] block mb-2">
                        TIPO DE UÑA NATURAL (ANATOMÍA):
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            id: 'plana' as const,
                            label: 'PLANA',
                            desc: 'Crecimiento recto',
                            img: (
                              /* PLANA: PNG transparente real */
                              <img
                                src="/assets/aistudio/PLANA.png"
                                alt="Uña plana"
                                loading="lazy"
                                className="w-full h-14 object-contain mx-auto mb-1"
                              />
                            ),
                          },
                          {
                            id: 'convexa' as const,
                            label: 'CONVEXA',
                            desc: 'Crecimiento hacia abajo',
                            img: (
                              /* CONVEXA: PNG transparente real */
                              <img
                                src="/assets/aistudio/CONVEXA.png"
                                alt="Uña convexa"
                                loading="lazy"
                                className="w-full h-14 object-contain mx-auto mb-1"
                              />
                            ),
                          },
                          {
                            id: 'concava' as const,
                            label: 'CÓNCAVA',
                            desc: 'Crecimiento hacia arriba',
                            img: (
                              /* CÓNCAVA: PNG transparente real */
                              <img
                                src="/assets/aistudio/CONCAVA.png"
                                alt="Uña cóncava"
                                loading="lazy"
                                className="w-full h-14 object-contain mx-auto mb-1"
                              />
                            ),
                          },
                        ].map((type) => {
                          const isSel = nailAnatomy === type.id;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setNailAnatomy(type.id)}
                              className={`py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-[#F5EBE1] border-[#C89D3C] text-[#5D3704] font-bold shadow-xs ring-1 ring-[#C89D3C]'
                                  : 'bg-[#FAF7F2] text-[#5D3704] border-[#DFD1BD] hover:border-[#C89D3C]/60'
                              }`}
                            >
                              {type.img}
                              <span className="text-xs font-['Cinzel'] font-bold block">{type.label}</span>
                              <span className="text-[10px] font-['Marcellus'] block mt-0.5 text-[#5D3704]/75">
                                {type.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Health notes */}
                    <div>
                      <label className="text-xs font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                        NOTAS DE SALUD UNGUEAL O CONDICIÓN ESPECIAL:
                      </label>
                      <textarea
                        rows={2}
                        value={healthNotes}
                        onChange={(e) => setHealthNotes(e.target.value)}
                        placeholder="Cuéntame si tienes alguna observación o condición especial en tus uñas naturales para brindarte la mejor asesoría."
                        className="w-full p-2.5 bg-[#FAF7F2] border border-[#5D3704]/25 rounded-xl font-['Marcellus'] text-xs text-[#5D3704]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* PASO 2: ENCABEZADO "PERSONALIZA TU DISEÑO" */
                <div className="max-w-3xl mx-auto space-y-6">
                  {renderDeliveryModeBanner()}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#DFD1BD] p-5 sm:p-6 space-y-5 shadow-xs">
                    {/* 1. Banner explicativo (Base S/. 80.00) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#EFE5D7] pb-3">
                      <div>
                        <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#9C7954] block">
                          DISEÑO ARTESANAL EXCLUSIVO
                        </span>
                        <h3 className="text-base sm:text-lg font-['Cinzel'] font-bold text-[#5D3704] uppercase">
                          Pedido 100% personalizado
                        </h3>
                      </div>
                      <div className="bg-[#FAF7F2] border border-[#C89D3C]/40 px-3.5 py-1.5 rounded-2xl text-center shrink-0">
                        <span className="text-[9px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                          PRECIO BASE:
                        </span>
                        <span className="text-base sm:text-xl font-['Cinzel'] font-bold text-[#C89D3C]">
                          S/. 80.00
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704] leading-relaxed">
                      Nuestros personalizados parten desde una base de S/ 80, y según los efectos, dibujitos o aplicaciones que elijas, vamos sumando los detalles para armar tu presupuesto ideal. Envíame tu diseño soñado y con gusto te armamos la cotización 🌸🎨
                    </p>

                    {/* 2. Botón "ADJUNTAR FOTOS DEL DISEÑO SOÑADO (HASTA 3)" */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#5D3704]/30 text-center space-y-2">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {dreamDesignPhotos.map((photo, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#D5C6B1]">
                            <img src={photo} alt="Foto diseño" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setDreamDesignPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {dreamDesignPhotos.length < 3 && (
                        <label className="py-2.5 px-4 rounded-xl bg-[#F5EBE1] border border-[#C89D3C] hover:bg-[#EFE3D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all">
                          <Upload className="w-4 h-4 text-[#C89D3C]" />
                          <span>ADJUNTAR FOTOS</span>
                          <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif" multiple onChange={handleDreamDesignPhotosUpload} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* 3. Caja de texto "Aquí detállame tu diseñito soñado ★" */}
                    <div>
                      <label className="text-xs font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                        Aquí detállame tu diseñito soñado ★
                      </label>
                      <textarea
                        rows={3}
                        value={customModificationNotes}
                        onChange={(e) => setCustomModificationNotes(e.target.value)}
                        placeholder="Escribe aquí si quieres algún cambio de color, alguna temática, etc..."
                        className="w-full p-3 bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-xs text-[#5D3704] focus:border-[#C89D3C]"
                      />
                    </div>

                    {/* 4. Cajitas seleccionables "FORMA DE LA PUNTA" */}
                    <div>
                      <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-2">
                        FORMA DE LA PUNTA:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: 'almendra' as TipType, label: 'Almendra | Almond', tag: '' },
                          { id: 'coffin' as TipType, label: 'Coffin | Ballerina', tag: '' },
                          { id: 'square' as TipType, label: 'Cuadrada | Square', tag: '' },
                          { id: 'stiletto' as TipType, label: 'Stiletto | Punta Fina', tag: '+ S/. 10' },
                        ].map((s) => {
                          const isSel = customShape === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setCustomShape(s.id)}
                              className={`py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-[#F5EBE1] border-[#C89D3C] text-[#5D3704] font-bold shadow-xs ring-1 ring-[#C89D3C]'
                                  : 'bg-[#FAF7F2] text-[#5D3704] border-[#DFD1BD] hover:border-[#C89D3C]/60'
                              }`}
                            >
                              <span className="text-xs font-['Cinzel'] font-bold block">{s.label}</span>
                              {s.tag && (
                                <span className={`text-[10px] font-['Cinzel'] font-bold block mt-1 ${isSel ? 'text-[#C89D3C]' : 'text-[#5D3704]/70'}`}>
                                  {s.tag}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. Cajitas seleccionables "LARGO DE LA UÑA" */}
                    <div>
                      <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-2">
                        LARGO DE LA UÑA:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { id: 'xs', label: 'XS | 0 - 1', tag: 'Sin recargo' },
                          { id: 's', label: 'S | 2 - 3', tag: 'Sin recargo' },
                          { id: 'm', label: 'M | 4 - 5', tag: '+ S/. 10' },
                          { id: 'l', label: 'L | 6 - 7', tag: '+ S/. 20' },
                          { id: 'xl', label: 'XL | 8 - 9', tag: '+ S/. 30' },
                        ].map((l) => {
                          const isSel = customLength === l.id;
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => setCustomLength(l.id)}
                              className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-[#F5EBE1] border-[#C89D3C] text-[#5D3704] font-bold shadow-xs ring-1 ring-[#C89D3C]'
                                  : 'bg-[#FAF7F2] text-[#5D3704] border-[#DFD1BD] hover:border-[#C89D3C]/60'
                              }`}
                            >
                              <span className="text-xs font-['Cinzel'] font-bold block">{l.label}</span>
                              <span className={`text-[10px] font-['Cinzel'] font-bold block mt-1 ${isSel ? 'text-[#C89D3C]' : 'text-[#5D3704]/70'}`}>
                                {l.tag}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 6. Banner de beneficio aplicado */}
                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#D4AF37]/50 text-xs font-['Marcellus'] text-[#5D3704] flex items-center gap-2.5">
                      <Gift className="w-4 h-4 shrink-0 text-[#C89D3C]" />
                      <span>
                        <strong>¡Beneficio aplicado!</strong> Por tu compra personalizada de S/. 80 o más, te llevas el{' '}
                        <strong>Kit Premium (Valorizado en S/. 25) ¡GRATIS!</strong>
                      </span>
                    </div>

                    {/* 7. Tarjeta de Kit de Aplicación Incluido */}
                    <div className="space-y-2">
                      <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                        KIT DE APLICACIÓN INCLUIDO:
                      </label>

                      <div className="p-4 rounded-2xl border border-[#C89D3C] bg-[#FAF7F2] flex items-start justify-between shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                              KIT PREMIUM
                            </span>
                            <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] border border-[#5D3704] px-2 py-0.5 rounded-full">
                              ¡INCLUIDO GRATIS!
                            </span>
                          </div>
                          <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80 mt-1.5 leading-snug">
                            Lima Large, Buffer, Repujador, Palito removedor, 2 Alcohol Pad, 4 Pegatinas, 1 Pegamento líquido grande, Aceite de cutícula nutritivo, Cepillo de uñas, Stickers y Regalito sorpresa ♥
                          </p>
                        </div>
                        <span className="text-xs font-['Cinzel'] font-bold text-[#C89D3C] whitespace-nowrap ml-3">
                          S/. 0.00
                        </span>
                      </div>
                    </div>

                    {/* 8. Acordeón desplegable "SERVICIOS ADICIONALES & COMPLEMENTOS" */}
                    <div className="border border-[#DFD1BD] rounded-2xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className="w-full p-4 bg-[#F5EBE1]/70 hover:bg-[#F5EBE1] flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#C89D3C]" />
                          <span className="text-xs font-['Cinzel'] font-bold uppercase text-[#5D3704]">
                            SERVICIOS ADICIONALES & COMPLEMENTOS
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5D3704]">
                          {selectedAdditionals.length > 0 && (
                            <span className="text-[10px] font-['Cinzel'] font-bold bg-[#5D3704] text-white px-2 py-0.5 rounded-full">
                              {selectedAdditionals.length} seleccionados
                            </span>
                          )}
                          {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isAccordionOpen && (
                        <div className="p-4 space-y-3 bg-[#FAF7F2] border-t border-[#E8DEC9] max-h-60 overflow-y-auto">
                          {pressOnAdditionals.length === 0 ? (
                            <p className="text-xs font-['Marcellus'] text-[#5D3704]/70">
                              No hay adicionales registrados para esta sección.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {pressOnAdditionals.map((add) => {
                                const isChecked = selectedAdditionals.includes(add.id);
                                return (
                                  <div
                                    key={add.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleAdditionalItem(add.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === ' ' || e.key === 'Enter') {
                                        e.preventDefault();
                                        toggleAdditionalItem(add.id);
                                      }
                                    }}
                                    className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all select-none ${
                                      isChecked
                                        ? 'bg-white border-[#5D3704] ring-1 ring-[#5D3704] shadow-xs'
                                        : 'bg-white/80 border-[#DFD1BD] hover:border-[#5D3704]/40 hover:bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5 pointer-events-none">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        readOnly
                                        tabIndex={-1}
                                        className="mt-0.5 text-[#5D3704] accent-[#5D3704]"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                                            {add.name}
                                          </span>
                                          {add.badge?.trim() && (
                                            <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider bg-[#F5EBE1] text-[#8C6B1C] border border-[#D4AF37]/50 px-1.5 py-0.5 rounded-md shrink-0">
                                              {add.badge.trim()}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/70 line-clamp-1">
                                          {add.description}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-xs font-['Cinzel'] font-bold text-[#C89D3C] shrink-0 ml-2 pointer-events-none">
                                      + S/. {add.price}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </>
        )}

          {/* ============================================================== */}
          {/* STEP 3: MODALIDAD DE ENTREGA Y TUS DATOS                       */}
          {/* ============================================================== */}
          {!orderConfirmed && step === 3 && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Loss Aversion BeeCoins Widget */}
              <LossAversionWidget estimatedPrice={finalPressOnTotal} isPromo={isPromoFlow} />

              {/* 1. SELECCIÓN DE MODALIDAD DE ENTREGA */}
              <div className="space-y-2">
                <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                  ELIGE TU MODALIDAD DE ENTREGA:
                </label>

                <div className="space-y-3">
                  {/* Fila 1: Tarjetas Principales de Selección en Grid 2 columnas (Alineación perfecta y misma altura) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
                    {/* Opción 1: Studio */}
                    <div
                      onClick={() => setDeliveryType('studio')}
                      className={`p-4.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-full ${
                        deliveryType === 'studio'
                          ? 'bg-[#F5EBE1] border-[#5D3704] shadow-xs ring-1 ring-[#5D3704]'
                          : 'bg-white border-[#DFD1BD] hover:border-[#5D3704]/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                            <Store className="w-4 h-4 text-[#5D3704]" />
                            <span>STUDIO • JESÚS MARÍA</span>
                          </div>
                          <span className="text-[10px] font-['Cinzel'] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            GRATIS
                          </span>
                        </div>
                        <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80 leading-relaxed">
                          ¡Te esperamos con mucho gusto! Puedes pasar a recoger tu set apenas recibas nuestro mensaje de confirmación ❤️.
                        </p>
                      </div>
                    </div>

                    {/* Opción 2: Envío a Domicilio */}
                    <div
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-4.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-full ${
                        deliveryType === 'delivery'
                          ? 'bg-[#F5EBE1] border-[#5D3704] shadow-xs ring-1 ring-[#5D3704]'
                          : 'bg-white border-[#DFD1BD] hover:border-[#5D3704]/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                            <Truck className="w-4 h-4 text-[#5D3704]" />
                            <span>ENVÍO A DOMICILIO</span>
                          </div>
                        </div>
                        <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80 leading-relaxed">
                          El tiempo y costo de entrega puede variar según tu ubicación. Hacemos envíos a todo el Perú ✈️.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CAMPOS DE REGISTRO EN DOS COLUMNAS */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD1BD] space-y-4 shadow-xs">
                <div className="border-b border-[#EFE5D7] pb-2">
                  <h3 className="text-xs sm:text-sm font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704]">
                    TUS DATOS PERSONALES:
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Fila 1: Nombres (izquierda) | Apellidos (derecha) */}
                  <div>
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                      NOMBRES *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej: Valeria"
                      className="w-full p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/40 focus:border-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                      APELLIDOS *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej: Mendoza"
                      className="w-full p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/40 focus:border-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704] transition-all"
                    />
                  </div>

                  {/* Fila 2: WhatsApp (izquierda) | Instagram (derecha) */}
                  <div>
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                      WHATSAPP DE CONTACTO *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 987 654 321"
                      className="w-full p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/40 focus:border-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                      INSTAGRAM <span className="text-[10px] font-normal opacity-65">(OPCIONAL)</span>
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Ej: @tuusuario"
                      className="w-full p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/40 focus:border-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704] transition-all"
                    />
                  </div>

                  {/* Fila 3, 4 y 5: Datos de envío detallados si es domicilio */}
                  {deliveryType === 'delivery' && (
                    <div className="col-span-1 sm:col-span-2 space-y-3.5 pt-3 border-t border-[#EFE5D7]">
                      {/* Fila 3: DEPTO / PROVINCIA (izquierda) | DISTRITO (derecha) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                            DEPTO / PROVINCIA *
                          </label>
                          <input
                            type="text"
                            value={departmentProvince}
                            onChange={(e) => setDepartmentProvince(e.target.value)}
                            placeholder="Ej: Lima / Lima"
                            className="w-full p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/40 focus:border-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704] transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                            DISTRITO *
                          </label>
                          <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            placeholder="Ej: Jesús María"
                            className="w-full p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/40 focus:border-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704] transition-all"
                          />
                        </div>
                      </div>

                      {/* Fila 4 y 5: DIRECCIÓN EXACTA (izquierda) | REFERENCIA DE ENTREGA (derecha) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                            DIRECCIÓN EXACTA <span className="text-[10px] font-normal opacity-65">(CALLE, NÚMERO, DPTO)</span> *
                          </label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ej: Av. San Felipe 520 Dpto 402"
                            className="w-full p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/40 focus:border-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704] transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                            REFERENCIA DE ENTREGA <span className="text-[10px] font-normal opacity-65">(FRENTE A, ALTURA, ETC.)</span>
                          </label>
                          <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Ej: Frente al parque, edificio de ladrillos vista"
                            className="w-full p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#5D3704]/25 rounded-2xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/40 focus:border-[#5D3704] focus:outline-none focus:ring-1 focus:ring-[#5D3704] transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: PAGO Y CONFIRMACIÓN                                     */}
          {/* ============================================================== */}
          {!orderConfirmed && step === 4 && (
            <div className="max-w-3xl mx-auto space-y-5">

              {/* SPECIFIC TOP MESSAGE FOR PRESS ON AND PERSONALIZADO */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/20 backdrop-blur-xs shadow-xs">
                <div className="text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed">
                  <strong className="font-['Cinzel'] font-bold block mb-0.5 text-sm">✦ Último paso para confirmar tu pedido ✦</strong>
                  Para reservar tu pedido, coordinamos el pago total a través de Yape, Plin o BCP. Una vez enviado tu número de operación, te enviará a nuestro WhatsApp automáticamente para coordinar los últimos detalles. ¡Estás a un solo paso!
                </div>
              </div>

              {/* DESGLOSE DE TU ORDEN PRESS ON */}
              <div className="bg-white/90 p-5 rounded-2xl border border-[#5D3704]/20 space-y-3 shadow-xs backdrop-blur-xs">
                <div className="flex items-center justify-between border-b border-[#EFE5D7] pb-2">
                  <span className="text-xs font-['Cinzel'] font-bold uppercase text-[#5D3704]">
                    DESGLOSE DE TU ORDEN PRESS ON
                  </span>
                  <span className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704]/70">
                    Cliente: {firstName || 'Por confirmar'} {lastName}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-['Marcellus'] text-[#5D3704]">
                  {activeTabMode === 'catalog' ? (
                    <div className="flex justify-between">
                      <span>• {currentSet?.name} (Talla {selectedSize})</span>
                      <span className="font-bold font-mono">S/. {(currentSet?.price || 0).toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>• Pedido Personalizado (Base)</span>
                      <span className="font-bold font-mono">S/. 80.00</span>
                    </div>
                  )}

                  {activeTabMode === 'custom' && customShapeExtra > 0 && (
                    <div className="flex justify-between">
                      <span>• Recargo Punta Stiletto</span>
                      <span className="font-bold font-mono">+ S/. 10.00</span>
                    </div>
                  )}

                  {activeTabMode === 'custom' && customLengthExtra > 0 && (
                    <div className="flex justify-between">
                      <span>• Recargo Largo Especial</span>
                      <span className="font-bold font-mono">+ S/. {customLengthExtra.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>• Kit de Aplicación ({selectedKit})</span>
                    <span className="font-bold font-mono">
                      {kitCost === 0 ? 'S/. 0.00 (Gratis)' : `S/. ${kitCost.toFixed(2)}`}
                    </span>
                  </div>

                  {additionalsTotalCost > 0 && (
                    <div className="flex justify-between">
                      <span>• Servicios / Extras Adicionales</span>
                      <span className="font-bold font-mono">+ S/. {additionalsTotalCost.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>• Modalidad ({deliveryType === 'studio' ? 'Recojo en Studio' : 'Envío a Domicilio'})</span>
                    <span className="font-bold">
                      {deliveryType === 'studio' ? 'Gratis' : 'Costo según distancia'}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#DFD1BD] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-['Cinzel'] uppercase font-bold text-[#5D3704] block">
                      TOTAL A CANCELAR:
                    </span>
                    {settings.pressOnDeliveryMode === 'high_demand' && (
                      <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/80 block">
                        Tiempo de confección: 7 a 12 días hábiles
                      </span>
                    )}
                    {settings.pressOnDeliveryMode === 'preorder' && (
                      <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/80 block">
                        Tiempo de confección: 10 a 15 días hábiles
                      </span>
                    )}
                  </div>
                  <span className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704] font-mono">
                    S/. {calculatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* SELECCIONA TU MÉTODO DE PAGO CON BOTONES TRANSLÚCIDOS Y ESTILO UNIFICADO */}
              <div className="space-y-3">
                <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                  SELECCIONA TU MÉTODO DE PAGO:
                </label>

                {/* 3 Payment Methods Selector with Distinct Translucent Colors */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('yape')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center ${
                      paymentMethod === 'yape'
                        ? 'bg-[#742384]/20 border-[#742384] ring-2 ring-[#742384]/40 text-[#5D3704] font-bold shadow-xs'
                        : 'bg-[#742384]/10 border-[#742384]/30 hover:bg-[#742384]/15 text-[#5D3704]'
                    }`}
                  >
                    <img src="/assets/logos/yape.svg" alt="Yape" className="h-10 w-auto object-contain mx-auto" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('plin')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                      paymentMethod === 'plin'
                        ? 'bg-[#009FE3]/20 border-[#009FE3] ring-2 ring-[#009FE3]/40 text-[#5D3704] font-bold shadow-xs'
                        : 'bg-[#009FE3]/10 border-[#009FE3]/30 hover:bg-[#009FE3]/15 text-[#5D3704]'
                    }`}
                  >
                    <img src="/assets/logos/plin.svg" alt="Plin" className="h-10 w-auto object-contain mx-auto" style={{ transform: 'scale(2) translateY(12%)', clipPath: 'inset(0 0 25% 0)' }} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bcp')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center ${
                      paymentMethod === 'bcp'
                        ? 'bg-[#002A68]/20 border-[#002A68] ring-2 ring-[#002A68]/40 text-[#5D3704] font-bold shadow-xs'
                        : 'bg-[#002A68]/10 border-[#002A68]/30 hover:bg-[#002A68]/15 text-[#5D3704]'
                    }`}
                  >
                    <img src="/assets/logos/bcp.svg" alt="BCP" className="h-6 w-auto object-contain mx-auto" />
                  </button>
                </div>

                {/* Payment Box details with Golden QR code beside */}
                <div className="p-4 rounded-2xl bg-white/90 border border-[#5D3704]/20 backdrop-blur-xs flex flex-col md:flex-row items-center justify-between gap-5">
                  {/* Details */}
                  <div className="flex-1 space-y-2 text-left w-full">
                    {paymentMethod === 'bcp' ? (
                      <div className="space-y-2">
                        <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704]/80 block">
                          Transferencia Bancaria BCP
                        </span>
                        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#5D3704]/20 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-['Cinzel'] font-bold">Cuenta BCP:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold">{settings.bcpAccount}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(settings.bcpAccount, 'bcp_acc')}
                                className="p-1 rounded bg-[#F5EBE1] hover:bg-[#ebdccf] cursor-pointer"
                              >
                                {copiedField === 'bcp_acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-['Cinzel'] font-bold">Código CCI:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[11px]">{settings.bcpCci}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(settings.bcpCci, 'bcp_cci')}
                                className="p-1 rounded bg-[#F5EBE1] hover:bg-[#ebdccf] cursor-pointer"
                              >
                                {copiedField === 'bcp_cci' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#5D3704]/10">
                            <span className="font-['Cinzel'] font-bold">Titular:</span>
                            <span className="font-['Marcellus'] font-bold">{settings.bcpName || 'Gabee Estudio'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704]/80 block">
                          Número Oficial de {paymentMethod.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-bold font-mono tracking-wider text-[#5D3704]">
                            {paymentMethod === 'yape' ? settings.yapeNumber || '+51 934 403 311' : settings.plinNumber || '+51 934 403 311'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                paymentMethod === 'yape' ? settings.yapeNumber || '+51 934 403 311' : settings.plinNumber || '+51 934 403 311',
                                'phone'
                              )
                            }
                            className="p-1.5 rounded-lg bg-[#F5EBE1] text-[#5D3704] hover:bg-[#ebdccf] transition-all cursor-pointer"
                            title="Copiar número"
                          >
                            {copiedField === 'phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs font-['Marcellus'] text-[#5D3704]/80 mt-1">
                          Titular: <strong>{paymentMethod === 'yape' ? settings.yapeName || 'Gabriela K. - Gabee Estudio' : settings.plinName || 'Gabriela K. - Gabee Estudio'}</strong>
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#5D3704]/10 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-['Marcellus'] font-bold">Total a cancelar:</span>
                        <div className="text-right">
                          {applyBirthdayDiscount && birthdayDiscount.discountAmount > 0 && (
                            <div className="text-[10px] text-[#A3485E] line-through font-sans">
                              S/. {calculatedTotal.toFixed(2)}
                            </div>
                          )}
                          <span className="font-mono font-bold text-[#5D3704]">S/. {finalPressOnTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      {applyBirthdayDiscount && birthdayDiscount.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-[11px] text-[#D4AF37] font-bold">
                          <span>🎂 Regalo de Cumpleaños Aplicado:</span>
                          <span>-S/. {birthdayDiscount.discountAmount.toFixed(2)} ({birthdayDiscount.label})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Golden QR Code beside (Exclusivo para Yape y Plin, sin QR para BCP) */}
                  {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
                    <div className="p-2.5 bg-white rounded-2xl border border-[#D4AF37]/60 shadow-[0_2px_10px_rgba(212,175,55,0.15)] shrink-0 flex flex-col items-center justify-center">
                      <img
                        src={settings.yapeQrImage || '/assets/aistudio/AgendaPago1_0aeaaf79.JPG'}
                        alt="QR Oficial Yape / Plin"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/aistudio/AgendaPago1_0aeaaf79.JPG';
                        }}
                        className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-xl transition-all duration-300"
                      />
                      <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704] mt-2 uppercase tracking-wider text-center block">
                        ESCANEAR PARA PAGAR
                      </span>
                    </div>
                  )}
                </div>

                {/* CAMPO OBLIGATORIO DE NÚMERO DE OPERACIÓN DE PAGO ESTANDARIZADO */}
                <OperationCodeInput
                  value={paymentOperationNumber}
                  onChange={setPaymentOperationNumber}
                  label="Ingresa aquí el número de operación de tu pago *"
                  subtitle="Nos ayuda a verificar tu abono al instante y asegurar tu pedido Press On ✨"
                  placeholder="Ej: 849201 (6 a 9 dígitos numéricos)"
                />
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* BOTTOM ACTION BAR WITH UNIFIED TRANSLUCENT BUTTON STYLING       */}
        {/* ============================================================== */}
        {!orderConfirmed && (
          <div
            className="px-5 py-3 border-t border-[#E8DEC9] flex items-center justify-between bg-[#F8F3EC]"
            style={{
              backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
              backgroundSize: '220px auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          >
            {/* Catalog Mode Bottom Buttons */}
            {activeTabMode === 'catalog' && step === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 rounded-xl border border-[#5D3704]/40 bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-6 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </>
            )}

            {activeTabMode === 'catalog' && step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl border border-[#5D3704]/40 bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentUser?.roulettePrize && (
                    <BirthdayDiscountButton
                      isApplied={applyBirthdayDiscount}
                      onToggle={() => setApplyBirthdayDiscount(!applyBirthdayDiscount)}
                      discountAmount={birthdayDiscount.discountAmount}
                    />
                  )}
                  <BeeCoinsFooterBadge totalEstimated={finalPressOnTotal} isPromo={isPromoFlow} />
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#F5EBE1]/90 border border-[#D4AF37]/60 shadow-2xs text-right">
                    <span className="text-[9px] uppercase font-['Cinzel'] font-bold text-[#5D3704]/80 block">
                      TOTAL ESTIMADO:
                    </span>
                    <span className="text-xs sm:text-sm font-['Cinzel'] font-bold text-[#5D3704]">
                      {applyBirthdayDiscount && birthdayDiscount.discountAmount > 0 && (
                        <span className="text-[10px] text-[#A3485E] line-through mr-1 font-sans">
                          S/. {calculatedTotal.toFixed(2)}
                        </span>
                      )}
                      S/. {finalPressOnTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCatalogSizeKitContinue}
                    className="py-2.5 px-5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </>
            )}

            {/* Custom Mode Bottom Buttons */}
            {activeTabMode === 'custom' && customStep === 1 && step < 3 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 rounded-xl border border-[#5D3704]/40 bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  {currentUser?.roulettePrize && (
                    <BirthdayDiscountButton
                      isApplied={applyBirthdayDiscount}
                      onToggle={() => setApplyBirthdayDiscount(!applyBirthdayDiscount)}
                      discountAmount={birthdayDiscount.discountAmount}
                    />
                  )}
                  <BeeCoinsFooterBadge totalEstimated={finalPressOnTotal} isPromo={isPromoFlow} />
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#F5EBE1]/90 border border-[#D4AF37]/60 shadow-2xs text-right">
                    <span className="text-[9px] uppercase font-['Cinzel'] font-bold text-[#5D3704]/80 block">
                      TOTAL ESTIMADO:
                    </span>
                    <span className="text-xs sm:text-sm font-['Cinzel'] font-bold text-[#5D3704]">
                      {applyBirthdayDiscount && birthdayDiscount.discountAmount > 0 && (
                        <span className="text-[10px] text-[#A3485E] line-through mr-1 font-sans">
                          S/. {calculatedTotal.toFixed(2)}
                        </span>
                      )}
                      S/. {finalPressOnTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCustomMeasurementsContinue}
                    className="py-2.5 px-6 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </>
            )}

            {activeTabMode === 'custom' && customStep === 2 && step < 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setCustomStep(1)}
                  className="py-2.5 px-4 rounded-xl border border-[#5D3704]/40 bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentUser?.roulettePrize && (
                    <BirthdayDiscountButton
                      isApplied={applyBirthdayDiscount}
                      onToggle={() => setApplyBirthdayDiscount(!applyBirthdayDiscount)}
                      discountAmount={birthdayDiscount.discountAmount}
                    />
                  )}
                  <BeeCoinsFooterBadge totalEstimated={finalPressOnTotal} isPromo={isPromoFlow} />
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#F5EBE1]/90 border border-[#D4AF37]/60 shadow-2xs text-right">
                    <span className="text-[9px] uppercase font-['Cinzel'] font-bold text-[#5D3704]/80 block">
                      TOTAL ESTIMADO:
                    </span>
                    <span className="text-xs sm:text-sm font-['Cinzel'] font-bold text-[#5D3704]">
                      {applyBirthdayDiscount && birthdayDiscount.discountAmount > 0 && (
                        <span className="text-[10px] text-[#A3485E] line-through mr-1 font-sans">
                          S/. {calculatedTotal.toFixed(2)}
                        </span>
                      )}
                      S/. {finalPressOnTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="py-2.5 px-5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Modalidad de Entrega y Datos */}
            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTabMode === 'catalog') {
                      setStep(2);
                    } else {
                      setStep(1);
                      setCustomStep(2);
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl border border-[#5D3704]/40 bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!firstName.trim() || !phone.trim()) {
                      alert('Por favor ingresa tu Nombre y Teléfono / WhatsApp para continuar.');
                      return;
                    }
                    if (deliveryType === 'delivery' && !address.trim()) {
                      alert('Por favor ingresa tu dirección exacta de entrega.');
                      return;
                    }
                    setStep(4);
                  }}
                  className="py-2.5 px-6 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </>
            )}

            {/* Step 4 Confirmation */}
            {step === 4 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-2.5 px-4 rounded-xl border border-[#5D3704]/40 bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndPay100}
                  className="py-3 px-6 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>CONFIRMAR PEDIDO Y VALIDAR OPERACIÓN</span>
                  <Send className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SUB-MODAL : TABLA DE MEDIDAS EN CENTÍMETROS                    */}
      {/* ============================================================== */}
      {showSizeChart && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#D4AF37]/50 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div
              className="px-5 py-3.5 border-b border-[#E8DEC9] flex items-center justify-between shrink-0"
              style={{
                backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
                backgroundSize: '200px auto',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
              }}
            >
              <div className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/50 shadow-xs">
                <h4 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] tracking-wider uppercase">
                  TABLAS PARA MEDIR TU TALLA
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="p-1.5 bg-white/90 hover:bg-white rounded-full text-[#5D3704] hover:text-[#C89D3C] cursor-pointer shadow-xs transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF7F2]/90">
              {ALL_SIZE_CHARTS.map((chart) => (
                <div
                  key={chart.key}
                  className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/40 shadow-xs space-y-3"
                >
                  <div className="border-b border-[#D4AF37]/25 pb-2.5">
                    <h5 className="font-['Cinzel'] font-bold text-sm sm:text-base text-[#5D3704]">
                      {chart.title}
                    </h5>
                    <p className="text-xs font-['Marcellus'] text-[#5D3704]/80 italic mt-0.5">
                      {chart.description}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs border-collapse border border-[#DFD1BD]">
                      <thead>
                        <tr className="bg-[#5D3704]/10 text-[#5D3704] font-['Cinzel'] font-bold">
                          <th className="border border-[#DFD1BD] p-2 text-left sm:text-center">Dedo</th>
                          <th className="border border-[#DFD1BD] p-2">XS</th>
                          <th className="border border-[#DFD1BD] p-2">S</th>
                          <th className="border border-[#DFD1BD] p-2">M</th>
                          <th className="border border-[#DFD1BD] p-2">L</th>
                        </tr>
                      </thead>
                      <tbody className="font-['Marcellus'] text-[#5D3704]">
                        {chart.rows.map((row) => (
                          <tr key={row.finger} className="hover:bg-[#FAF7F2] transition-colors">
                            <td className="border border-[#DFD1BD] p-2 font-bold font-['Cinzel'] text-left sm:text-center text-[#5D3704]">
                              {row.finger}
                            </td>
                            <td className="border border-[#DFD1BD] p-2">{row.xs}</td>
                            <td className="border border-[#DFD1BD] p-2">{row.s}</td>
                            <td className="border border-[#DFD1BD] p-2">{row.m}</td>
                            <td className="border border-[#DFD1BD] p-2">{row.l}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="p-3.5 rounded-xl bg-[#F5EBE1]/80 border border-[#D4AF37]/40 text-[#5D3704]">
                <p className="text-xs font-['Marcellus'] leading-relaxed">
                  * Si tus medidas están entre dos tallas, te recomendamos seleccionar la mayor, ya que así podrás limarla por los bordes hasta llegar a un calce perfecto.
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-[#E8DEC9] bg-[#FAF7F2] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="py-2 px-6 rounded-xl bg-[#5D3704]/10 hover:bg-[#5D3704]/20 border border-[#5D3704]/40 text-[#5D3704] text-xs font-['Cinzel'] font-bold tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-MODAL : LIGHTBOX / ZOOM DE IMÁGENES                         */}
      {/* ============================================================== */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn cursor-zoom-out"
        >
          <div className="relative max-w-2xl w-full max-h-[88vh] flex items-center justify-center p-2">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full z-10 cursor-pointer shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Vista Ampliada"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl border-2 border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-MODAL : EDITAR / AGREGAR SET AL CATÁLOGO (ADMIN)            */}
      {/* ============================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div
              className="px-5 py-3.5 border-b border-[#E8DEC9] flex items-center justify-between"
              style={{
                backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
                backgroundSize: '200px auto',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
              }}
            >
              <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                {isNewItem ? 'Agregar Nuevo Set al Catálogo' : 'Modificar Set e Imagen'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 bg-white/90 rounded-full text-[#5D3704] hover:bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 bg-white text-xs">
              {/* Image Upload & Preview */}
              <div>
                <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1.5">
                  Foto del Set (Autoconfigurable):
                </label>
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-xl border border-[#DFD1BD] overflow-hidden bg-[#F0E6D8] shrink-0">
                    {itemFormImage ? (
                      <img src={itemFormImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#5D3704]/60 text-center p-1">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="py-2 px-3 rounded-xl bg-[#5D3704] text-white font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#4a2c03]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Foto del Dispositivo</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setItemFormImage(reader.result);
                              }
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={itemFormImage}
                      onChange={(e) => setItemFormImage(e.target.value)}
                      placeholder="O pega la URL de la imagen aquí"
                      className="w-full p-2 text-xs bg-[#FAF7F2] border border-[#5D3704]/25 rounded-xl font-['Marcellus'] text-[#5D3704]"
                    />
                  </div>
                </div>
              </div>

              {/* Set Name */}
              <div>
                <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                  Nombre del Set:
                </label>
                <input
                  type="text"
                  value={itemFormName}
                  onChange={(e) => setItemFormName(e.target.value)}
                  placeholder="Ej: VELVET CAT-EYE & CROMO"
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#5D3704]/25 rounded-xl font-['Cinzel'] font-bold text-[#5D3704]"
                />
              </div>

              {/* Price & Suggested Tip */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                    Precio (S/.):
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={itemFormPrice}
                    onChange={(e) => setItemFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#5D3704]/25 rounded-xl font-['Cinzel'] font-bold text-[#5D3704]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                    Punta Sugerida:
                  </label>
                  <select
                    value={itemFormTip}
                    onChange={(e) => setItemFormTip(e.target.value as TipType)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#5D3704]/25 rounded-xl font-['Marcellus'] text-[#5D3704]"
                  >
                    <option value="almendra">Almendra</option>
                    <option value="coffin">Coffin</option>
                    <option value="stiletto">Stiletto</option>
                    <option value="square">Square</option>
                  </select>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                  Descripción Corta:
                </label>
                <input
                  type="text"
                  value={itemFormShortDesc}
                  onChange={(e) => setItemFormShortDesc(e.target.value)}
                  placeholder="Ej: Diseño magnético aterciopelado con relieves 3D..."
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#5D3704]/25 rounded-xl font-['Marcellus'] text-[#5D3704]"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                  Descripción Detallada (Vista Detalle):
                </label>
                <textarea
                  rows={2}
                  value={itemFormFullDesc}
                  onChange={(e) => setItemFormFullDesc(e.target.value)}
                  placeholder="Detalles sobre materiales, técnicas, dijes, acabados..."
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#5D3704]/25 rounded-xl font-['Marcellus'] text-[#5D3704]"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E8DEC9] bg-[#FAF7F2] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="py-1.5 px-4 rounded-xl border border-[#5D3704]/30 bg-white text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer hover:bg-[#F5EBE1]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="py-1.5 px-4 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer hover:bg-[#ebdccf]"
              >
                Guardar Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
