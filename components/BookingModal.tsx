import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GabeeBeeMark } from './GabeeBeeMark';
import { NailViewer3D } from './NailViewer3D';
import { NAIL_SHAPES, NAIL_LENGTHS, getSystemPrices, getServicePrices, REMOVAL_SERVICE_OPTIONS } from '../data/catalogData';
import { DesignLevel, Appointment, RemovalType, PromoSystemFlags, PromoLevelFlags, normalizePromoType } from '../types';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  X,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  Send,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  QrCode,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Upload,
  Clock,
  Shield,
  Heart,
  Camera,
  ZoomIn,
  Home,
} from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';
import { formatLocalIsoDate, getLocalTomorrowIso } from '../utils/dateUtils';
import { LossAversionWidget } from './LossAversionWidget';
import { BeeCoinsFooterBadge } from './BeeCoinsFooterBadge';
import { BeeCoinIcon } from './BeeCoinIcon';
import { calculateBirthdayDiscount } from '../utils/birthdayDiscountUtils';
import { BirthdayDiscountButton } from './BirthdayDiscountButton';
import { OperationCodeInput } from './OperationCodeInput';
import { validateOperationCode } from '../utils/validationUtils';
import gatobejaImg from '../assets/images/gatobeja_mascot_transparent.png';

const REGULAR_TIME_SLOTS = [
  '09:30 AM',
  '12:00 PM',
  '02:30 PM',
  '05:00 PM',
];

const SPECIAL_TIME_SLOTS = [
  '07:00 AM',
  '07:30 PM',
];

const SYSTEM_OPTIONS = [
  { id: 'polygel', name: 'Polygel', allowedKey: 'polygel' as const, label: 'Polygel' },
  { id: 'softgel', name: 'Soft Gel', allowedKey: 'softgel' as const, label: 'Soft Gel' },
  { id: 'builder_gel', name: 'Builder Gel', allowedKey: 'builder' as const, label: 'Builder Gel' },
  { id: 'acrilicas', name: 'Acrílicas', allowedKey: 'acrilicas' as const, label: 'Acrílicas' },
  { id: 'esmaltado_gel', name: 'Esmaltado en Gel', allowedKey: 'esmaltado_gel' as const, label: 'Esmaltado en Gel' },
];

const getSystemNameFromId = (id?: string): string => {
  return SYSTEM_OPTIONS.find((sys) => sys.id === id)?.label || 'Polygel';
};

export const BookingModal: React.FC = () => {
  const {
    isBookingOpen,
    closeBooking,
    bookingServiceType,
    selectedPromoForBooking,
    customConfig,
    setCustomConfig,
    promoDesigns,
    settings,
    appointments,
    createAppointment,
    updateAppointment,
    generateWhatsAppLink,
    selectedAdditionals,
    toggleAdditional,
    clearAdditionals,
    additionalsTotal,
    additionalsList,
    servicesCatalog,
    recordOperationCode,
  } = useApp();

  // 4 Ordered Steps
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Removal Flow State (Paso 1 when bookingServiceType === 'removal')
  const [removalType, setRemovalType] = useState<RemovalType>('gel');
  const [spaManicure, setSpaManicure] = useState<boolean>(false);

  // Accordion state for additionals in Step 1
  const [isAdditionalsAccordionOpen, setIsAdditionalsAccordionOpen] = useState(false);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalTomorrowIso());
  const [selectedSlot, setSelectedSlot] = useState<string>('02:30 PM');
  const [locationType, setLocationType] = useState<'studio' | 'home'>('studio');
  const dayModality = settings.dayModality?.[selectedDate] || 'both';
  // Auto-ajustar modalidad según configuración del día
  useEffect(() => {
    if (dayModality === 'studio' && locationType !== 'studio') setLocationType('studio');
    if (dayModality === 'home' && locationType !== 'home') setLocationType('home');
  }, [dayModality, selectedDate]);
  const [homeAddress, setHomeAddress] = useState<string>('');
  const [homeReference, setHomeReference] = useState<string>('');
  const [clientFirstName, setClientFirstName] = useState<string>('');
  const [clientLastName, setClientLastName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientInstagram, setClientInstagram] = useState<string>('');
  const [clientBirthDate, setClientBirthDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  // Promo 2x1: datos de la 2.ª persona (acompañante) en la misma reserva
  const [companionName, setCompanionName] = useState<string>('');
  const [companionPhone, setCompanionPhone] = useState<string>('');
  const [companionSystem, setCompanionSystem] = useState<string>('polygel');
  const [companionLevel, setCompanionLevel] = useState<DesignLevel>('moderado');
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bcp'>('yape');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [paymentOperationNumber, setPaymentOperationNumber] = useState<string>('');
  const [voucherPhoto, setVoucherPhoto] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // 15-Minute Reservation Timer (900 seconds) - Starts exclusively at Step 2 ("Selecciona Día y Hora")
  const [timerSeconds, setTimerSeconds] = useState<number>(900);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [pendingAptId, setPendingAptId] = useState<string | null>(null);

  // Confirmed Appointment reference
  const [confirmedApt, setConfirmedApt] = useState<any>(null);

  // 3D Finish state (default leftmost finish: pink_glaze)
  const [activeFinish, setActiveFinish] = useState<'pink_glaze' | 'chrome_silver' | 'gold_liquid' | 'ruby_aura' | 'nude' | 'sage_matcha'>('pink_glaze');

  const selectedService = useMemo(() => {
    return servicesCatalog.find((s) => s.id === customConfig.system) || servicesCatalog[0];
  }, [servicesCatalog, customConfig.system]);

  // Dynamic system prices for custom flow based on selected individual service
  const systemPrices = useMemo(() => {
    return getServicePrices(selectedService, customConfig.system);
  }, [selectedService, customConfig.system]);

  // Removal options: overrides configured by the admin in the service catalog (retiro_sistema) with defaults fallback
  const removalOptions = useMemo(() => {
    const removalService = servicesCatalog.find((s) => s.removalOptions && s.removalOptions.length > 0);
    return removalService?.removalOptions && removalService.removalOptions.length > 0
      ? removalService.removalOptions
      : REMOVAL_SERVICE_OPTIONS;
  }, [servicesCatalog]);

  // Target Promo Design
  const activePromo = useMemo(() => {
    if (selectedPromoForBooking) return selectedPromoForBooking;
    return promoDesigns[0];
  }, [selectedPromoForBooking, promoDesigns]);

  const promoType = normalizePromoType(activePromo?.promoType);
  const isTwoForOne = bookingServiceType === 'promotion' && promoType === '2x1';

  // Sistemas/niveles realmente ofrecidos al elegir la promoción
  const effectiveAllowedSystems = useMemo<PromoSystemFlags>(() => {
    const fallback: PromoSystemFlags = { polygel: true, softgel: true, builder: true, acrilicas: false, esmaltado_gel: false };
    if (!activePromo) return fallback;
    return {
      ...fallback,
      ...activePromo.allowedSystems,
      esmaltado_gel: activePromo.allowedSystems?.esmaltado_gel === true,
    };
  }, [activePromo]);

  const effectiveCompanionAllowedSystems = useMemo<PromoSystemFlags>(() => {
    const fallback: PromoSystemFlags = { polygel: true, softgel: true, builder: true, acrilicas: false, esmaltado_gel: false };
    const raw = activePromo?.companionAllowedSystems || effectiveAllowedSystems || fallback;
    return {
      ...fallback,
      ...raw,
      esmaltado_gel: raw.esmaltado_gel === true,
    };
  }, [activePromo, effectiveAllowedSystems]);

  const effectiveAllowedLevels = useMemo<PromoLevelFlags>(() => {
    const fallback: PromoLevelFlags = { sencillo: false, moderado: true, complejo: false };
    if (!activePromo) return fallback;
    return activePromo.allowedLevels || fallback;
  }, [activePromo]);

  // Reiniciar acompañante al abrir una promo 2x1 con los sistemas/niveles permitidos configurados
  useEffect(() => {
    if (!isBookingOpen || !isTwoForOne || !activePromo) return;
    const sysFlags = effectiveCompanionAllowedSystems;
    const lvlFlags = activePromo.companionAllowedLevels || effectiveAllowedLevels;
    setCompanionName('');
    setCompanionPhone('');
    setCompanionSystem(
      sysFlags.polygel
        ? 'polygel'
        : sysFlags.softgel
        ? 'softgel'
        : sysFlags.builder
        ? 'builder_gel'
        : sysFlags.esmaltado_gel
        ? 'esmaltado_gel'
        : 'acrilicas'
    );
    setCompanionLevel(lvlFlags.sencillo ? 'sencillo' : lvlFlags.moderado ? 'moderado' : 'complejo');
  }, [isBookingOpen, isTwoForOne, activePromo, effectiveCompanionAllowedSystems, effectiveAllowedLevels]);

  const selectedLength = NAIL_LENGTHS.find((l) => l.id === customConfig.lengthId) || NAIL_LENGTHS[0];
  const selectedShape = NAIL_SHAPES.find((s) => s.id === customConfig.shape) || NAIL_SHAPES[0];

  // Selección por defecto del primer elemento de la izquierda al abrir el modal para Servicios y Promociones
  useEffect(() => {
    if (isBookingOpen) {
      const defaultLengthId = NAIL_LENGTHS[0]?.id || 'length_xs';
      const defaultShape = NAIL_SHAPES[0]?.id || 'almond';

      setCustomConfig((prev) => {
        let targetSystem = prev.system;
        let targetLevel = prev.level;
        if (bookingServiceType === 'promotion' && activePromo) {
          const allowedObj = effectiveAllowedSystems;
          targetSystem = allowedObj.polygel
            ? 'polygel'
            : allowedObj.softgel
            ? 'softgel'
            : allowedObj.builder
            ? 'builder_gel'
            : allowedObj.esmaltado_gel
            ? 'esmaltado_gel'
            : 'acrilicas';
          const allowedLevels = effectiveAllowedLevels;
          targetLevel = allowedLevels.sencillo ? 'sencillo' : allowedLevels.moderado ? 'moderado' : 'complejo';
        }
        return {
          ...prev,
          shape: defaultShape,
          lengthId: defaultLengthId,
          system: targetSystem,
          level: targetLevel,
        };
      });
      setActiveFinish('pink_glaze');
    }
  }, [isBookingOpen, bookingServiceType, activePromo, effectiveAllowedSystems, effectiveAllowedLevels]);

  // Base price according to level configured in Admin Panel for this service
  const baseLevelPrice = useMemo(() => {
    if (customConfig.level === 'sencillo') return systemPrices.sutil;
    if (customConfig.level === 'complejo') return systemPrices.complejo;
    return systemPrices.moderado;
  }, [customConfig.level, systemPrices]);

  // Keep customConfig.calculatedPrice synchronized with dynamic selection
  useEffect(() => {
    const dynamicBase = baseLevelPrice + (selectedShape?.extraCost || 0) + (selectedLength?.extraCost || 0);
    if (customConfig.calculatedPrice !== dynamicBase) {
      setCustomConfig((prev) => ({
        ...prev,
        calculatedPrice: dynamicBase,
      }));
    }
  }, [baseLevelPrice, selectedShape?.extraCost, selectedLength?.extraCost, customConfig.calculatedPrice, setCustomConfig]);

  // Ensure selected system is allowed for active promotion
  useEffect(() => {
    if (bookingServiceType === 'promotion' && activePromo) {
      const allowedObj = effectiveAllowedSystems;
      const currentSys = customConfig.system || 'polygel';
      const keyMap: Record<string, keyof typeof allowedObj> = {
        polygel: 'polygel',
        softgel: 'softgel',
        builder_gel: 'builder',
        acrilicas: 'acrilicas',
        esmaltado_gel: 'esmaltado_gel',
      };
      const allowedKey = keyMap[currentSys] || 'polygel';
      if (!allowedObj[allowedKey]) {
        const firstAvailable = allowedObj.polygel
          ? 'polygel'
          : allowedObj.softgel
          ? 'softgel'
          : allowedObj.builder
          ? 'builder_gel'
          : allowedObj.esmaltado_gel
          ? 'esmaltado_gel'
          : 'acrilicas';
        setCustomConfig((prev) => ({ ...prev, system: firstAvailable }));
      }
    }
  }, [activePromo, bookingServiceType, customConfig.system, setCustomConfig, effectiveAllowedSystems]);

  // Ensure selected complexity level is allowed for active promotion (dynamic per admin config)
  useEffect(() => {
    if (bookingServiceType === 'promotion' && activePromo) {
      const allowedLevels = effectiveAllowedLevels;
      if (!allowedLevels[customConfig.level]) {
        const firstAvailable: DesignLevel = allowedLevels.sencillo ? 'sencillo' : allowedLevels.moderado ? 'moderado' : 'complejo';
        setCustomConfig((prev) => ({ ...prev, level: firstAvailable }));
      }
    }
  }, [activePromo, bookingServiceType, customConfig.level, setCustomConfig, effectiveAllowedLevels]);

  // Special schedule verification (+ S/. 20)
  const isSpecialSchedule = SPECIAL_TIME_SLOTS.includes(selectedSlot);
  const specialScheduleFee = isSpecialSchedule ? 20 : 0;

  // Total price calculation with dynamic additionals and special schedule included
  // Formula: Total Estimado = (Precio Base del Nivel de Complejidad seleccionado) + (Suma de los Adicionales marcados)
  const totalPrice = useMemo(() => {
    let basePrice = 0;
    if (bookingServiceType === 'removal') {
      const removalOption = removalOptions.find((opt) => opt.id === removalType);
      basePrice = removalOption ? removalOption.price : 20;
    } else if (bookingServiceType === 'promotion') {
      basePrice = (activePromo ? activePromo.price : settings.defaultPromoPrice) + (selectedShape?.extraCost || 0) + (selectedLength?.extraCost || 0);
    } else {
      basePrice = baseLevelPrice + (selectedShape?.extraCost || 0) + (selectedLength?.extraCost || 0);
    }

    return basePrice + additionalsTotal + specialScheduleFee;
  }, [
    bookingServiceType,
    removalType,
    removalOptions,
    activePromo,
    settings,
    baseLevelPrice,
    additionalsTotal,
    specialScheduleFee,
    selectedShape,
    selectedLength,
  ]);

  // Birthday roulette discount application
  const { currentUser } = useApp();
  const [applyBirthdayDiscount, setApplyBirthdayDiscount] = useState<boolean>(false);

  const birthdayDiscount = useMemo(() => {
    if (!applyBirthdayDiscount || !currentUser?.roulettePrize) {
      return { discountAmount: 0, label: '', isGratis: false, percentage: 0 };
    }
    return calculateBirthdayDiscount(currentUser.roulettePrize, totalPrice);
  }, [applyBirthdayDiscount, currentUser?.roulettePrize, totalPrice]);

  // Regla del 50% de adelanto obligatorio para Servicios y Sistemas (Nuestros Servicios & Promociones)
  const finalPrice = Math.max(0, totalPrice - birthdayDiscount.discountAmount);
  const depositRequired = Math.round((finalPrice * 0.5) * 100) / 100;
  const remainingBalance = Math.max(0, finalPrice - depositRequired);

  // Auto switch slot if current selectedSlot is disabled or occupied on selectedDate
  useEffect(() => {
    const disabledSlots = settings.disabledPresencialTimeSlots?.[selectedDate] || [];
    const isCurrentSlotOccupied =
      disabledSlots.includes(selectedSlot) ||
      appointments.some(
        (a) => a.date === selectedDate && a.timeSlot === selectedSlot && a.status !== 'cancelled' && a.id !== pendingAptId
      );

    if (isCurrentSlotOccupied) {
      const allSlots = [...REGULAR_TIME_SLOTS, ...SPECIAL_TIME_SLOTS];
      const available = allSlots.find(
        (s) =>
          !disabledSlots.includes(s) &&
          !appointments.some(
            (a) => a.date === selectedDate && a.timeSlot === s && a.status !== 'cancelled' && a.id !== pendingAptId
          )
      );
      if (available) {
        setSelectedSlot(available);
      }
    }
  }, [selectedDate, settings.disabledPresencialTimeSlots, selectedSlot, appointments, pendingAptId]);

  // Generate luxury golden QR code for Yape, Plin or BCP
  useEffect(() => {
    let qrPayload = '';
    const customQrText = paymentMethod === 'yape'
      ? settings.yapeQrCode
      : paymentMethod === 'plin'
      ? settings.plinQrCode
      : settings.bcpQrCode;

    if (customQrText && customQrText.trim()) {
      qrPayload = customQrText.trim();
    } else if (paymentMethod === 'bcp') {
      qrPayload = `BCP|CTA:${settings.bcpAccount}|CCI:${settings.bcpCci}|TITULAR:${settings.bcpName}|MONTO:${depositRequired}`;
    } else if (paymentMethod === 'yape') {
      qrPayload = `00020101021153036045802PE5919${settings.yapeName.substring(0, 19)}6004LIMA62100506${settings.yapeNumber.replace(/[^0-9]/g, '')}`;
    } else {
      qrPayload = `00020101021153036045802PE5919${settings.plinName.substring(0, 19)}6004LIMA62100506${settings.plinNumber.replace(/[^0-9]/g, '')}`;
    }

    QRCode.toDataURL(qrPayload, {
      color: { dark: '#5D3704', light: '#FAF7F2' },
      width: 240,
      margin: 1,
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.warn('QR code generation error:', err));
  }, [paymentMethod, settings, depositRequired]);

  // Available days generator (next 21 days) with day of the week
  const availableDates = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 1; i <= 21; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const iso = formatLocalIsoDate(d);
      const dayName = d.toLocaleDateString('es-PE', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('es-PE', { month: 'short' });
      list.push({ iso, dayName, dayNum, monthName });
    }
    return list;
  }, []);

  // Start timer exclusively when reaching Step 2 ("Selecciona Día y Hora")
  useEffect(() => {
    if (step >= 2 && isBookingOpen && !confirmedApt) {
      if (!isTimerActive) {
        setTimerSeconds(900); // 15 minutes (900 seconds)
        setIsTimerActive(true);
      }
    } else if (step < 2) {
      setIsTimerActive(false);
      setTimerSeconds(900);
    }
  }, [step, isBookingOpen, confirmedApt, isTimerActive]);

  // Timer countdown handler (Efecto psicológico - no cancela ni borra automáticamente la cita)
  useEffect(() => {
    let interval: any = null;
    if (isBookingOpen && isTimerActive && timerSeconds > 0 && !confirmedApt) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBookingOpen, isTimerActive, timerSeconds, confirmedApt]);

  // Autocompletado inteligente global desde la cuenta activa de la clienta
  useEffect(() => {
    if (isBookingOpen && currentUser) {
      if (currentUser.firstName) setClientFirstName(currentUser.firstName);
      if (currentUser.lastName) setClientLastName(currentUser.lastName);
      const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      if (fullName) setClientName(fullName);
      if (currentUser.phone) setClientPhone(currentUser.phone);
      if (currentUser.instagram) setClientInstagram(currentUser.instagram);
      if (currentUser.birthDate) setClientBirthDate(currentUser.birthDate);

      const fullAddr = [currentUser.address, currentUser.district].filter(Boolean).join(', ');
      if (fullAddr && (!homeAddress || homeAddress.trim() === '')) {
        setHomeAddress(fullAddr);
      }
    }
  }, [isBookingOpen, currentUser]);

  // Autocompletado de dirección y distrito de inmediato al seleccionar atención a domicilio
  useEffect(() => {
    if (locationType === 'home' && currentUser) {
      const fullAddr = [currentUser.address, currentUser.district].filter(Boolean).join(', ');
      if (fullAddr && (!homeAddress || homeAddress.trim() === '')) {
        setHomeAddress(fullAddr);
      }
    }
  }, [locationType, currentUser]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleResetAndClose = () => {
    setStep(1);
    setPendingAptId(null);
    setClientName('');
    setClientPhone('');
    setClientInstagram('');
    setClientBirthDate('');
    setHomeAddress('');
    setHomeReference('');
    setNotes('');
    setLocationType('studio');
    setPaymentMethod('yape');
    setRemovalType('gel');
    setSpaManicure(false);
    setIsAdditionalsAccordionOpen(false);
    setConfirmedApt(null);
    setPaymentOperationNumber('');
    setVoucherPhoto(null);
    setTimerSeconds(900);
    setIsTimerActive(false);
    setLightboxImage(null);
    clearAdditionals();
    closeBooking();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentImages = customConfig.referenceImages || (customConfig.referenceImage ? [customConfig.referenceImage] : []);
    const remainingSlots = 3 - currentImages.length;
    if (remainingSlots <= 0) {
      alert('Solo puedes adjuntar un máximo de 3 imágenes de referencia.');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCustomConfig((prev) => {
          const existing = prev.referenceImages || (prev.referenceImage ? [prev.referenceImage] : []);
          const updated = [...existing, result].slice(0, 3);
          return {
            ...prev,
            referenceImage: updated[0],
            referenceImages: updated,
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFinalSubmit = () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Por favor ingresa tu nombre y número de WhatsApp.');
      return;
    }

    const opNumber = paymentOperationNumber.trim();

    const valResult = validateOperationCode(opNumber);
    if (!valResult.isValid) {
      alert(valResult.errorMessage);
      return;
    }

    let finalApt: Appointment;
    if (pendingAptId) {
      updateAppointment(pendingAptId, {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientInstagram: clientInstagram.trim() || undefined,
        birthDate: clientBirthDate.trim() || undefined,
        serviceType: bookingServiceType,
        promoDesignId: bookingServiceType === 'promotion' ? activePromo?.id : undefined,
        promoDesignTitle: bookingServiceType === 'promotion' ? activePromo?.title : undefined,
        promoType: bookingServiceType === 'promotion' ? promoType : undefined,
        promoCompanion: isTwoForOne
          ? { name: companionName.trim(), phone: companionPhone.trim(), system: companionSystem, level: companionLevel, price: activePromo?.price }
          : undefined,
        serviceName: bookingServiceType === 'custom'
          ? (selectedService?.title || customConfig.system)
          : bookingServiceType === 'removal'
          ? (removalOptions.find((o) => o.id === removalType)?.title || 'Retiro de Sistema')
          : undefined,
        customDetails: customConfig,
        removalDetails:
          bookingServiceType === 'removal'
            ? { type: removalType, spaManicure: false }
            : undefined,
        date: selectedDate,
        timeSlot: selectedSlot,
        isSpecialSchedule,
        specialScheduleFee,
        locationType,
        homeAddress: locationType === 'home' ? homeAddress.trim() : undefined,
        homeReference: locationType === 'home' ? homeReference.trim() : undefined,
        status: 'pending_deposit',
        totalPrice,
        depositRequired,
        depositPaid: false,
        paymentMethod,
        paymentOperationNumber: opNumber,
        additionals: selectedAdditionals,
        notes: notes.trim() || undefined,
        voucherPhoto: voucherPhoto || undefined,
        photos: [
          ...(voucherPhoto ? [voucherPhoto] : []),
          ...(customConfig.referenceImage ? [customConfig.referenceImage] : []),
        ],
      });
      finalApt = appointments.find((a) => a.id === pendingAptId) || {
        id: pendingAptId,
        code: 'NS26_0000',
        createdAt: new Date().toISOString(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientInstagram: clientInstagram.trim() || undefined,
        birthDate: clientBirthDate.trim() || undefined,
        serviceType: bookingServiceType,
        date: selectedDate,
        timeSlot: selectedSlot,
        locationType,
        homeAddress: locationType === 'home' ? homeAddress.trim() : undefined,
        status: 'pending_deposit',
        totalPrice,
        depositRequired,
        depositPaid: false,
        paymentMethod,
        paymentOperationNumber: opNumber,
        additionals: selectedAdditionals,
        notes: notes.trim() || undefined,
      };
    } else {
      finalApt = createAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientInstagram: clientInstagram.trim() || undefined,
        birthDate: clientBirthDate.trim() || undefined,
        serviceType: bookingServiceType,
        promoDesignId: bookingServiceType === 'promotion' ? activePromo?.id : undefined,
        promoDesignTitle: bookingServiceType === 'promotion' ? activePromo?.title : undefined,
        promoType: bookingServiceType === 'promotion' ? promoType : undefined,
        promoCompanion: isTwoForOne
          ? { name: companionName.trim(), phone: companionPhone.trim(), system: companionSystem, level: companionLevel, price: activePromo?.price }
          : undefined,
        serviceName: bookingServiceType === 'custom'
          ? (selectedService?.title || customConfig.system)
          : bookingServiceType === 'removal'
          ? (removalOptions.find((o) => o.id === removalType)?.title || 'Retiro de Sistema')
          : undefined,
        customDetails: customConfig,
        removalDetails:
          bookingServiceType === 'removal'
            ? { type: removalType, spaManicure: false }
            : undefined,
        date: selectedDate,
        timeSlot: selectedSlot,
        isSpecialSchedule,
        specialScheduleFee,
        locationType,
        homeAddress: locationType === 'home' ? homeAddress.trim() : undefined,
        homeReference: locationType === 'home' ? homeReference.trim() : undefined,
        status: 'pending_deposit',
        totalPrice,
        depositRequired,
        depositPaid: false,
        paymentMethod,
        paymentOperationNumber: opNumber,
        additionals: selectedAdditionals,
        notes: notes.trim() || undefined,
        voucherPhoto: voucherPhoto || undefined,
        photos: [
          ...(voucherPhoto ? [voucherPhoto] : []),
          ...(customConfig.referenceImage ? [customConfig.referenceImage] : []),
        ],
      });
    }

    setConfirmedApt(finalApt);
    setStep(4);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5D3704', '#F5EBE1', '#C29D38', '#25D366'],
      });
    } catch {
      // ignore
    }

    // Auto-open WhatsApp after brief delay
    const waLink = generateWhatsAppLink({ ...finalApt, paymentOperationNumber: opNumber || finalApt.paymentOperationNumber });
    setTimeout(() => {
      window.open(waLink, '_blank');
    }, 400);
  };

  const renderTimeSlotButton = (slot: string, isSpecial: boolean) => {
    const isSettingDisabled = settings.disabledPresencialTimeSlots?.[selectedDate]?.includes(slot);
    const matchingApt = appointments.find(
      (a) => a.date === selectedDate && a.timeSlot === slot && a.status !== 'cancelled' && a.id !== pendingAptId
    );

    const isOccupied = !!matchingApt;
    const isDisabled = isSettingDisabled || isOccupied;
    const isSelected = selectedSlot === slot && !isDisabled;

    let badgeText = isSpecial ? 'Horario Especial (+ S/. 20.00)' : 'Regular';
    let containerStyle = 'border-[#5D3704]/20 bg-white/70 text-[#5D3704] hover:bg-[#F5EBE1] cursor-pointer';

    if (isSettingDisabled) {
      badgeText = 'Bloqueado';
      containerStyle = 'opacity-40 cursor-not-allowed line-through bg-gray-200/80 border-gray-300 text-gray-500';
    } else if (isOccupied && matchingApt) {
      if (matchingApt.status === 'confirmed' || matchingApt.status === 'completed') {
        badgeText = 'Cita Reservada';
        containerStyle = 'opacity-90 cursor-not-allowed bg-[#FAF4EB] border-2 border-[#D4AF37] text-[#5D3704] shadow-xs font-bold';
      } else {
        badgeText = 'Cita temporalmente reservada';
        containerStyle = 'opacity-90 cursor-not-allowed bg-amber-50/90 border-2 border-amber-300 text-amber-900 shadow-xs font-bold';
      }
    } else if (isSelected) {
      containerStyle = 'border-[#5D3704] bg-[#5D3704]/15 ring-2 ring-[#5D3704]/50 font-bold text-[#5D3704] cursor-pointer shadow-xs';
    }

    return (
      <button
        key={slot}
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && setSelectedSlot(slot)}
        className={`p-3 rounded-xl border text-center transition-all backdrop-blur-xs relative flex flex-col items-center justify-center ${containerStyle}`}
      >
        <span className="block font-mono text-xs font-bold">{slot}</span>
        <span
          className={`text-[9px] sm:text-[9.5px] font-['Cinzel'] font-bold block mt-0.5 uppercase tracking-tight ${
            isOccupied
              ? matchingApt?.status === 'confirmed' || matchingApt?.status === 'completed'
                ? 'text-[#5D3704]'
                : 'text-amber-950'
              : isSettingDisabled
              ? 'text-gray-500'
              : 'text-[#5D3704]/80'
          }`}
        >
          {badgeText}
        </span>
      </button>
    );
  };

  if (!isBookingOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Floating Modal Window with Translucent Golden Bee Pattern */}
      <div
        className="relative border border-[#5D3704]/20 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          backgroundImage: 'var(--site-window-pattern)',
          backgroundSize: '240px auto',
          backgroundRepeat: 'repeat',
        }}
      >
        {/* Soft Translucent Glassmorphism Veil Over Bee Pattern */}
        <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-md pointer-events-none" />

        {/* Modal Header (Franja superior con patrón de abejas) */}
        <div
          className="relative z-10 p-5 sm:p-6 flex items-center justify-between gap-4"
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
                Agendamiento · Gabee Studio
              </span>
              <h2 className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704] tracking-tight">
                {step === 4
                  ? '¡Confirmación de Reserva!'
                  : step === 3
                  ? 'MODALIDAD DE SERVICIOS Y TUS DATOS'
                  : step === 2
                  ? 'Selecciona Día y Hora'
                  : bookingServiceType === 'removal'
                  ? 'Retiro de Sistema & Spa'
                  : 'Personaliza tu Set'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 text-[#5D3704] bg-[#F5EBE1] hover:bg-[#ebdccf] rounded-full shadow-2xs transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 text-[#5D3704]" />
          </button>
        </div>

        {/* 4 Steps Indicator Bar (oculto en la confirmación exitosa) */}
        {!confirmedApt && (
          <div className="relative z-10 bg-[#ECE4D8] h-1.5 w-full">
            <div
              className="bg-[#5D3704] h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Slim Horizontal Timer Banner below progress bar (Step 2 and onwards) */}
        {isTimerActive && step >= 2 && !confirmedApt && (
          <div className="relative z-10 w-full bg-[#F5EBE1]/95 border-b border-[#D5C6B1] px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-['Cinzel'] font-bold text-[#5D3704] shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#5D3704] animate-pulse" />
            <span>
              Tu cupo está reservado por: {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')} min
            </span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="relative z-10 p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#5D3704] flex-1">

          {/* ========================================================= */}
          {/* PASO 1: RETIRO DE SISTEMA FLOW                            */}
          {/* ========================================================= */}
          {step === 1 && bookingServiceType === 'removal' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="space-y-4">
              <label className="block text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704]">
                I. Selecciona tu Servicio *
              </label>
                {/* SECCIÓN: RETIROS */}
                <div className="space-y-2">
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                    Retiros
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {removalOptions.filter((opt) => opt.group === 'retiros').map((opt) => {
                      const isSelected = removalType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setRemovalType(opt.id)}
                          className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer backdrop-blur-xs relative overflow-hidden group ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#5D3704]/10 ring-1 ring-[#D4AF37]/60 shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                              : 'border-[#D4AF37]/30 bg-white/70 hover:bg-[#5D3704]/5 hover:border-[#D4AF37]/60'
                          }`}
                        >
                          {/* Encabezado: título arriba a la izquierda + precio fijo en la esquina superior derecha */}
                          <div className="flex items-start justify-between gap-2.5">
                            <span
                              className={`font-['Cinzel'] font-bold text-xs sm:text-sm leading-snug min-w-0 ${isSelected ? 'text-[#5D3704]' : 'text-[#5D3704]/90'}`}
                              style={{ textWrap: 'balance' }}
                            >
                              {opt.title}
                            </span>
                            <span className="font-mono font-bold text-sm text-[#5D3704] bg-[#F5EBE1] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/50 shrink-0">
                              S/. {opt.price.toFixed(2)}
                            </span>
                          </div>
                          {/* Descripción debajo del título (mismo tono legible del modal de personalización) */}
                          {opt.desc && (
                            <p
                              className="font-['Marcellus'] text-[11px] text-[#5D3704]/80 leading-relaxed mt-1.5"
                              style={{ textWrap: 'pretty' }}
                            >
                              {opt.desc}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Nota importante: justo debajo de las tarjetas de RETIROS */}
                  <div className="p-3.5 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#5D3704] shrink-0 mt-0.5" />
                    <p className="font-['Marcellus'] text-xs text-[#5D3704] leading-relaxed">
                      <strong>Nota importante:</strong> Evaluamos el material en el estudio. El costo se reajusta si elige un retiro diferente al que realmente necesita.
                    </p>
                  </div>
                </div>

                {/* SECCIÓN: SPA DE MANOS */}
                <div className="space-y-2">
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                    Spa de Manos
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {removalOptions.filter((opt) => opt.group === 'spa').map((opt) => {
                      const isSelected = removalType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setRemovalType(opt.id)}
                          className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer backdrop-blur-xs relative overflow-hidden group ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#5D3704]/10 ring-1 ring-[#D4AF37]/60 shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                              : 'border-[#D4AF37]/30 bg-white/70 hover:bg-[#5D3704]/5 hover:border-[#D4AF37]/60'
                          }`}
                        >
                          {/* Encabezado: título arriba a la izquierda + precio fijo en la esquina superior derecha */}
                          <div className="flex items-start justify-between gap-2.5">
                            <span
                              className={`font-['Cinzel'] font-bold text-xs sm:text-sm leading-snug min-w-0 ${isSelected ? 'text-[#5D3704]' : 'text-[#5D3704]/90'}`}
                              style={{ textWrap: 'balance' }}
                            >
                              {opt.title}
                            </span>
                            <span className="font-mono font-bold text-sm text-[#5D3704] bg-[#F5EBE1] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/50 shrink-0">
                              S/. {opt.price.toFixed(2)}
                            </span>
                          </div>
                          {/* Descripción debajo del título (mismo tono legible del modal de personalización) */}
                          {opt.desc && (
                            <p
                              className="font-['Marcellus'] text-[11px] text-[#5D3704]/80 leading-relaxed mt-1.5"
                              style={{ textWrap: 'pretty' }}
                            >
                              {opt.desc}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

                {/* Divisor elegante */}
                <div className="flex items-center gap-3 my-5" aria-hidden="true">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/60" />
                  <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-[0.25em] text-[#8C6B1C]/80 whitespace-nowrap">
                    Experiencia Completa
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/60" />
                </div>

                {/* NIVEL INFERIOR: COMBOS RETIRO + SPA (BANNERS PREMIUM) */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                    Combos de Retiro + Spa · Precio Especial
                  </span>
                  <div className="space-y-3">
                    {removalOptions.filter((opt) => opt.group === 'combos').map((opt) => {
                      const isSelected = removalType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setRemovalType(opt.id)}
                          className={`w-full px-5 py-4 sm:py-[18px] rounded-2xl border text-left transition-all duration-300 cursor-pointer backdrop-blur-xs relative overflow-hidden group ${
                            isSelected
                              ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/70 shadow-[0_0_14px_rgba(212,175,55,0.3)] bg-gradient-to-r from-[#F5EBE1] via-[#FAF3E8] to-white'
                              : 'border-[#D4AF37]/50 bg-gradient-to-r from-[#F5EBE1]/70 via-white/80 to-white/60 hover:border-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            {/* Título del combo a la izquierda */}
                            <span
                              className={`font-['Cinzel'] font-bold text-sm sm:text-base leading-snug min-w-0 ${isSelected ? 'text-[#5D3704]' : 'text-[#5D3704]/90'}`}
                              style={{ textWrap: 'balance' }}
                            >
                              {opt.title}
                            </span>
                            {/* Precio elegante en la esquina superior derecha */}
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[8px] font-['Cinzel'] font-bold uppercase tracking-[0.2em] text-[#8C6B1C]/80 leading-none">
                                Precio Especial
                              </span>
                              <span className={`font-mono font-bold text-base sm:text-lg leading-tight ${isSelected ? 'text-[#5D3704]' : 'text-[#5D3704]/90'}`}>
                                S/. {opt.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              {/* Acordeón Estándar de Servicios Adicionales & Complementos */}
              <div className="rounded-2xl border border-[#5D3704]/25 bg-[#F5EBE1]/70 backdrop-blur-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAdditionalsAccordionOpen(!isAdditionalsAccordionOpen)}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F5EBE1] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5D3704]" />
                    <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">
                      Servicios Adicionales & Complementos {selectedAdditionals.length > 0 && `(${selectedAdditionals.length} seleccionados)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {additionalsTotal > 0 && (
                      <span className="font-mono font-bold text-xs text-[#5D3704] bg-white px-2 py-0.5 rounded">
                        +S/. {additionalsTotal.toFixed(2)}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[#5D3704] transition-transform duration-300 ${
                        isAdditionalsAccordionOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isAdditionalsAccordionOpen && (
                  <div className="p-3.5 pt-0 border-t border-[#5D3704]/15 space-y-2 animate-fadeIn">
                    <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80 mb-2">
                      Selecciona los servicios adicionales que desees sumar a tu servicio de retiro (por ejemplo Manicura Spa o Baño de Parafina):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {additionalsList
                        .filter((item) => item.active !== false)
                        .map((item) => {
                          const isSelected = selectedAdditionals.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-[#5D3704] bg-white shadow-2xs font-bold text-[#5D3704]'
                                  : 'border-[#5D3704]/20 bg-white/60 hover:bg-white text-[#5D3704]'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAdditional(item.id)}
                                  className="w-4 h-4 accent-[#5D3704] rounded"
                                />
                                <span className="font-['Marcellus'] text-xs">{item.name}</span>
                                {item.badge?.trim() && (
                                  <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider bg-[#F5EBE1] text-[#8C6B1C] border border-[#D4AF37]/50 px-1.5 py-0.5 rounded-md shrink-0">
                                    {item.badge.trim()}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-bold text-[11px] text-[#5D3704] shrink-0">
                                +S/. {item.price}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 1: PERSONALIZA TU SET (CUSTOM O PROMO)               */}
          {/* ========================================================= */}
          {step === 1 && bookingServiceType !== 'removal' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Sistema Seleccionado (Selector Interactivo de Sistemas en Promoción o Fijo en Custom) */}
              {bookingServiceType === 'promotion' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                      {isTwoForOne ? 'SELECCIONA EL SISTEMA DE LA PERSONA 1 (TITULAR):' : 'SELECCIONA EL SISTEMA DE TU PROMOCIÓN:'}
                    </label>
                    <span className="text-xs font-mono font-bold text-[#5D3704] bg-[#F5EBE1] px-3 py-1 rounded-full border border-[#D5C6B1] shadow-2xs">
                      S/. {activePromo ? activePromo.price : 60}.00
                    </span>
                  </div>

                  {/* Recuadros Interactivos de Selección Dinámicos (4 Sistemas) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {SYSTEM_OPTIONS.map((sys) => {
                      const allowedObj = effectiveAllowedSystems;
                      const isAllowed = allowedObj[sys.allowedKey] !== false;
                      const isSelected = (customConfig.system || 'polygel') === sys.id;

                      if (!isAllowed) {
                        return (
                          <div
                            key={sys.id}
                            className="py-3 px-2 rounded-xl border border-gray-200 bg-gray-100/80 text-gray-400 text-center flex flex-col items-center justify-center cursor-not-allowed opacity-50 select-none"
                            title="Sistema no disponible en esta promoción"
                          >
                            <span className="text-xs font-['Cinzel'] font-bold uppercase line-through">{sys.name}</span>
                            <span className="text-[9px] font-['Cinzel'] font-bold text-gray-400 mt-0.5">
                              No disponible
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={sys.id}
                          type="button"
                          onClick={() => setCustomConfig((prev) => ({ ...prev, system: sys.id }))}
                          className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isSelected
                              ? 'border-[#5D3704] bg-[#F5EBE1] ring-2 ring-[#5D3704]/40 font-bold text-[#5D3704] shadow-xs'
                              : 'border-[#5D3704]/20 bg-white/80 text-[#5D3704] hover:bg-[#F5EBE1]/60'
                          }`}
                        >
                          <span className="text-xs font-['Cinzel'] font-bold uppercase">{sys.name}</span>
                          <span className="text-[9px] font-['Cinzel'] font-bold text-[#5D3704]/80 mt-0.5">
                            Incluido
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Descripciones Dinámicas del Sistema Elegido */}
                  <div className="p-3.5 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/25">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-['Cinzel'] font-bold uppercase text-[#5D3704]">
                        Detalles de {getSystemNameFromId(customConfig.system)}:
                      </span>
                    </div>
                    <p className="text-xs font-['Marcellus'] text-[#5D3704]/90 leading-relaxed pt-1 border-t border-[#5D3704]/15">
                      {customConfig.system === 'softgel'
                        ? settings.systemDescSoftgel || 'Tips 100% de gel flexible prensado y adheridos con base coat foto-curada en cabina UV. Silueta perfecta, ligera y de rápida colocación.'
                        : customConfig.system === 'builder_gel'
                        ? settings.systemDescBuilderGel || 'Nivelación y refuerzo sobre uña natural o extensión con gel de construcción autonivelante. Ideal para fortalecer uñas frágiles y quebradizas.'
                        : customConfig.system === 'acrilicas'
                        ? 'Extensión esculpida con acrílico de alta resistencia y durabilidad excepcional. Ideal para estructuras firmes.'
                        : settings.systemDescPolygel || 'Esculpido o nivelación con hibridación de gel de alta densidad. Brinda máxima resistencia, ligereza y flexibilidad con acabado natural.'}
                    </p>
                  </div>
                </div>
              ) : (
                (() => {
                  const srv = selectedService;
                  return (
                    <div className="p-3.5 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/25 flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]/80 block">
                            Sistema Seleccionado
                          </span>
                          <span className="text-sm sm:text-base font-['Cinzel'] font-bold text-[#5D3704] block">
                            {srv ? srv.title : 'Softgel'}
                          </span>
                        </div>
                        <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704] bg-white px-2.5 py-1 rounded-full border border-[#5D3704]/20 shadow-2xs">
                          {srv ? srv.priceLabel : 'Desde S/. 60.00'}
                        </span>
                      </div>

                      <p className="text-xs font-['Marcellus'] text-[#5D3704]/85 leading-relaxed pt-1.5 border-t border-[#5D3704]/15">
                        {srv ? srv.description : 'Tips de gel flexible prensado y adherido con base coat curado en cabina UV.'}
                      </p>
                    </div>
                  );
                })()
              )}

              {/* 1. Complejidad del Diseño (Niveles dinámicos configurados por el admin en la promoción) */}
              {bookingServiceType === 'promotion' ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 text-[11px] font-['Marcellus'] flex items-center gap-2 shadow-2xs">
                    <BeeCoinIcon className="w-4 h-4 shrink-0" />
                    <span>Las tarifas de promoción no acumulan BeeCoins ni beneficios VIP.</span>
                  </div>

                  {(() => {
                    // Niveles habilitados por la administración para ESTA promoción
                    const promoAllowedLevels = effectiveAllowedLevels;
                    const levelOptions = ([
                      {
                        id: 'sencillo' as DesignLevel,
                        enabled: promoAllowedLevels.sencillo,
                        title: systemPrices.sutilTitle || 'Sutil (S)',
                        desc: 'Diseños clásicos y elegantes, con detalles minimalistas muy al estilo old money.',
                      },
                      {
                        id: 'moderado' as DesignLevel,
                        enabled: promoAllowedLevels.moderado,
                        title: systemPrices.moderadoTitle || 'Moderado (M)',
                        desc: 'Diseños a mano alzada y detalles más especializados, incorporando efectos atemporales.',
                      },
                      {
                        id: 'complejo' as DesignLevel,
                        enabled: promoAllowedLevels.complejo,
                        title: systemPrices.complejoTitle || 'Complejo (C)',
                        desc: 'Diseños más elaborados a mano alzada, decoraciones en tendencia, texturas en 3D y efectos únicos con acabados de primera.',
                      },
                    ] as const);

                    // Los 3 niveles siempre visibles: los no permitidos se muestran
                    // deshabilitados con el mismo estilo del botón "Acrílicas (No disponible)"
                    return (
                      <div>
                        <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-2">
                          Nivel de Complejidad Incluido en tu Promoción
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {levelOptions.map((lvl) =>
                            lvl.enabled ? (
                              <button
                                key={lvl.id}
                                type="button"
                                onClick={() => setCustomConfig((prev) => ({ ...prev, level: lvl.id }))}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  customConfig.level === lvl.id
                                    ? 'border-[#5D3704] bg-[#F5EBE1] ring-2 ring-[#5D3704]/40 font-bold text-[#5D3704]'
                                    : 'border-[#5D3704]/20 bg-white/70 text-[#5D3704] hover:bg-[#F5EBE1]'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-['Cinzel'] font-bold text-xs">{lvl.title}</span>
                                  <span className="text-[10px] font-mono font-bold text-[#8C6B1C] bg-white/90 px-1.5 py-0.5 rounded border border-[#D4AF37]/50">
                                    Incluido
                                  </span>
                                </div>
                                <p className="font-['Marcellus'] text-[11px] text-[#5D3704]/80 leading-relaxed">
                                  {lvl.desc}
                                </p>
                              </button>
                            ) : (
                              <div
                                key={lvl.id}
                                className="p-3 rounded-xl border border-gray-200 bg-gray-100/80 text-gray-400 text-left flex flex-col cursor-not-allowed opacity-50 select-none"
                                title="Nivel no incluido en esta promoción"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-['Cinzel'] font-bold text-xs line-through">{lvl.title}</span>
                                  <span className="text-[10px] font-mono font-bold text-gray-400 bg-white/80 px-1.5 py-0.5 rounded border border-gray-200 no-underline">
                                    No incluido
                                  </span>
                                </div>
                                <p className="font-['Marcellus'] text-[11px] text-gray-400 leading-relaxed no-underline">
                                  {lvl.desc}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704]">
                      Nivel de Complejidad del Diseño
                    </label>
                    <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70">
                      Tarifa según servicio
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'sencillo' as DesignLevel,
                        title: systemPrices.sutilTitle,
                        desc: systemPrices.sutilDesc,
                        price: systemPrices.sutil,
                      },
                      {
                        id: 'moderado' as DesignLevel,
                        title: systemPrices.moderadoTitle,
                        desc: systemPrices.moderadoDesc,
                        price: systemPrices.moderado,
                      },
                      {
                        id: 'complejo' as DesignLevel,
                        title: systemPrices.complejoTitle,
                        desc: systemPrices.complejoDesc,
                        price: systemPrices.complejo,
                      },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() =>
                          setCustomConfig((prev) => ({
                            ...prev,
                            level: lvl.id,
                            calculatedPrice: lvl.price + (selectedShape?.extraCost || 0) + (selectedLength?.extraCost || 0),
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          customConfig.level === lvl.id
                            ? 'border-[#5D3704] bg-[#F5EBE1] ring-2 ring-[#5D3704]/40 font-bold text-[#5D3704]'
                            : 'border-[#5D3704]/20 bg-white/70 text-[#5D3704] hover:bg-[#F5EBE1]'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-['Cinzel'] font-bold text-xs">{lvl.title}</span>
                          <span className="text-[11px] font-mono font-bold text-[#5D3704] bg-white/90 px-1.5 py-0.5 rounded border border-[#5D3704]/20">
                            S/. {lvl.price}.00
                          </span>
                        </div>
                        <p className="font-['Marcellus'] text-[11px] text-[#5D3704]/80 leading-relaxed">
                          {lvl.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PROMO 2x1: CONFIGURACIÓN DE LA 2.ª PERSONA EN LA MISMA RESERVA */}
              {isTwoForOne && (
                <div className="p-4 rounded-2xl border border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#F5EBE1] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 border-b border-[#5D3704]/15 pb-2">
                    <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Persona 2 · Acompañante (2x1)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#5D3704] bg-white px-2.5 py-1 rounded-full border border-[#D4AF37]">
                      Precio 2x1: S/. {activePromo?.price ?? 60}.00
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/85 space-y-2">
                    <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                      Nombre completo de la acompañante *
                    </label>
                    <input
                      type="text"
                      value={companionName}
                      onChange={(e) => setCompanionName(e.target.value)}
                      placeholder="Nombre completo de la Persona 2"
                      className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                    />
                    <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                      Número de teléfono de la acompañante *
                    </label>
                    <input
                      type="tel"
                      value={companionPhone}
                      onChange={(e) => setCompanionPhone(e.target.value)}
                      placeholder="Teléfono de la Persona 2"
                      className="w-full p-2.5 rounded-xl border border-[#DDD1BF] bg-white text-xs font-['Marcellus'] text-[#5D3704]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/85 space-y-2">
                      <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                        Sistema permitido (Persona 2)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {SYSTEM_OPTIONS.map((sys) => {
                          const flags = effectiveCompanionAllowedSystems;
                          const isAllowed = flags[sys.allowedKey] !== false;
                          if (!isAllowed) {
                            return (
                              <div key={sys.id} className="py-2 px-1.5 rounded-xl border border-gray-200 bg-gray-100/80 text-gray-400 text-center text-[10px] font-['Cinzel'] font-bold uppercase line-through opacity-50 select-none">
                                {sys.name}
                              </div>
                            );
                          }
                          return (
                            <button
                              key={sys.id}
                              type="button"
                              onClick={() => setCompanionSystem(sys.id)}
                              className={`py-2 px-1.5 rounded-xl border text-center text-[10px] font-['Cinzel'] font-bold uppercase transition-all cursor-pointer ${
                                companionSystem === sys.id
                                  ? 'border-[#5D3704] bg-[#F5EBE1] ring-2 ring-[#5D3704]/40 text-[#5D3704]'
                                  : 'border-[#5D3704]/20 bg-white/80 text-[#5D3704] hover:bg-[#F5EBE1]/60'
                              }`}
                            >
                              {sys.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#DFD1BD] bg-white/85 space-y-2">
                      <label className="block font-['Cinzel'] font-bold text-[#5D3704]">
                        Nivel de complejidad permitido (Persona 2)
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {([
                          { id: 'sencillo' as DesignLevel, label: 'Sutil (S)' },
                          { id: 'moderado' as DesignLevel, label: 'Moderado (M)' },
                          { id: 'complejo' as DesignLevel, label: 'Complejo (C)' },
                        ]).map((lvl) => {
                          const flags = activePromo?.companionAllowedLevels || effectiveAllowedLevels;
                          const isAllowed = flags[lvl.id] !== false;
                          if (!isAllowed) {
                            return (
                              <div key={lvl.id} className="py-2 px-2 rounded-xl border border-gray-200 bg-gray-100/80 text-gray-400 text-center text-[10px] font-['Cinzel'] font-bold uppercase line-through opacity-50 select-none">
                                {lvl.label}
                              </div>
                            );
                          }
                          return (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => setCompanionLevel(lvl.id)}
                              className={`py-2 px-2 rounded-xl border text-center text-[10px] font-['Cinzel'] font-bold uppercase transition-all cursor-pointer ${
                                companionLevel === lvl.id
                                  ? 'border-[#5D3704] bg-[#F5EBE1] ring-2 ring-[#5D3704]/40 text-[#5D3704]'
                                  : 'border-[#5D3704]/20 bg-white/80 text-[#5D3704] hover:bg-[#F5EBE1]/60'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {activePromo?.companionOptions && (
                    <p className="text-[10px] font-['Marcellus'] text-[#7A6655] leading-relaxed">
                      {activePromo.companionOptions}
                    </p>
                  )}
                </div>
              )}

              {/* RESUMEN DE LA RESERVA PROMOCIONAL 2x1 (ambas personas) */}
              {isTwoForOne && (
                <div className="p-4 rounded-2xl bg-white/85 border border-[#D4AF37]/60 space-y-2">
                  <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                    Resumen de tu reserva
                  </span>
                  <div className="flex items-start justify-between gap-2 border-b border-[#EFE5D7] pb-2">
                    <div className="text-[11px] font-['Marcellus'] text-[#5D3704]/90 leading-relaxed">
                      <strong className="font-['Cinzel']">Persona 1 (Titular):</strong> {clientName.trim() || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Titular'}
                      <br />
                      {getSystemNameFromId(customConfig.system)} · {customConfig.level === 'sencillo' ? 'Sutil (S)' : customConfig.level === 'complejo' ? 'Complejo (C)' : 'Moderado (M)'}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#8C6B1C] shrink-0">Incluida</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 border-b border-[#EFE5D7] pb-2">
                    <div className="text-[11px] font-['Marcellus'] text-[#5D3704]/90 leading-relaxed">
                      <strong className="font-['Cinzel']">Persona 2 (Acompañante):</strong> {companionName.trim() || 'Sin nombre'}
                      <br />
                      {getSystemNameFromId(companionSystem)} · {companionLevel === 'sencillo' ? 'Sutil (S)' : companionLevel === 'complejo' ? 'Complejo (C)' : 'Moderado (M)'}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#8C6B1C] shrink-0">Incluida</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-['Marcellus'] text-[#5D3704]">
                    <span>Precio promocional 2x1 (ambas personas):</span>
                    <span className="font-mono font-bold">S/. {(activePromo?.price ?? 60).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* 2. Forma de la Uña + Visor 3D directamente debajo (Omitido en Esmaltado Permanente) */}
              {customConfig.system !== 'esmaltado_gel' && !selectedService?.title?.toLowerCase().includes('esmaltado') && (
                <div>
                  <label className="block text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] mb-2">
                    Forma de la Uña
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {NAIL_SHAPES.map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() =>
                          setCustomConfig((prev) => ({
                            ...prev,
                            shape: shape.id,
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          customConfig.shape === shape.id
                            ? 'border-[#5D3704] bg-[#F5EBE1] ring-1 ring-[#5D3704] font-bold text-[#5D3704]'
                            : 'border-[#5D3704]/20 bg-white/70 text-[#5D3704] hover:bg-[#F5EBE1]'
                        }`}
                      >
                        <span className="text-xs font-['Cinzel'] font-bold block">{shape.name}</span>
                        {shape.extraCost > 0 && (
                          <span className="text-[10px] font-mono text-[#5D3704] font-bold block mt-0.5">
                            + S/. {shape.extraCost}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Simulador de forma y largo 3D (directamente debajo de Forma) */}
                  <div className="rounded-2xl bg-white/80 border border-[#5D3704]/20 p-3 shadow-2xs backdrop-blur-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] uppercase tracking-wider">
                        Simulador de Forma & Largo 3D
                      </span>
                      <span className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704]">
                        {selectedShape.name} · {selectedLength.code}
                      </span>
                    </div>
                    <NailViewer3D
                      shape={customConfig.shape}
                      lengthCode={selectedLength.code}
                      finish={activeFinish}
                      onShapeChange={(s) =>
                        setCustomConfig((prev) => ({ ...prev, shape: s }))
                      }
                      onFinishChange={(f) => setActiveFinish(f as any)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* 3. Selector de Largo con fondo translúcido marroncito suave */}
              {customConfig.system !== 'esmaltado_gel' && !selectedService?.title?.toLowerCase().includes('esmaltado') && (
                <div>
                  <label className="block text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] mb-2">
                    Largo de la Uña
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {NAIL_LENGTHS.map((len) => (
                      <button
                        key={len.id}
                        type="button"
                        onClick={() =>
                          setCustomConfig((prev) => ({
                            ...prev,
                            lengthId: len.id,
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          customConfig.lengthId === len.id
                            ? 'border-[#5D3704] bg-[#F5EBE1] ring-1 ring-[#5D3704] font-bold text-[#5D3704]'
                            : 'border-[#5D3704]/20 bg-white/70 text-[#5D3704] hover:bg-[#F5EBE1]'
                        }`}
                      >
                        <span className="block text-xs font-['Cinzel'] font-bold">
                          {len.range.replace(' - ', ' | ')}
                        </span>
                        {len.extraCost > 0 && (
                          <span className="text-[10px] font-mono text-[#8C6B1C] font-semibold block mt-0.5">
                            + S/. {len.extraCost}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nota de advertencia de complejidad: justo arriba de la sección de fotos */}
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300/80 flex items-start gap-2 shadow-2xs">
                <span className="text-amber-800 text-xs shrink-0 mt-0.5">⚠️</span>
                <p className="text-[11px] font-['Marcellus'] text-amber-950 leading-relaxed">
                  <strong>Importante:</strong> La foto o referencia adjunta debe coincidir con la complejidad seleccionada. Si el diseño enviado corresponde a un nivel superior, la diferencia se reajustará al confirmar tu agendamiento o el día de tu cita.
                </p>
              </div>

              {/* 4. Subir foto de referencia */}
              <div>
                <label className="block text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] mb-1">
                  ADJUNTAR FOTOS DE REFERENCIA
                </label>
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#5D3704]/30 text-center space-y-2">
                  <div className="flex justify-center gap-2 flex-wrap">
                    {(customConfig.referenceImages || (customConfig.referenceImage ? [customConfig.referenceImage] : [])).map((imgUrl: string, idx: number) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D5C6B1]">
                        <img src={imgUrl} alt={`Referencia ${idx + 1}`} className="w-full h-full object-contain bg-white" />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomConfig((prev) => {
                              const list = prev.referenceImages || (prev.referenceImage ? [prev.referenceImage] : []);
                              const updated = list.filter((_: string, i: number) => i !== idx);
                              return { ...prev, referenceImage: updated[0] || undefined, referenceImages: updated };
                            });
                          }}
                          className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {((customConfig.referenceImages?.length || (customConfig.referenceImage ? 1 : 0)) < 3) && (
                    <label className="py-2.5 px-4 rounded-xl bg-[#F5EBE1] border border-[#C89D3C] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all">
                      <Upload className="w-4 h-4 text-[#C89D3C]" />
                      <span>ADJUNTAR FOTOS</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-[10px] font-['Marcellus'] text-[#5D3704]/70">
                    * Puedes subir hasta 3 fotos claras de tu diseño de referencia.
                  </p>
                </div>
              </div>

              {/* Cuadro de texto justo debajo de la foto */}
              <div>
                <label className="block text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] mb-1">
                  Detalles del Diseño
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Aquí puedes escribir el diseño, alguna modificación o si quieres combinar ambos diseños..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704] focus:outline-none focus:ring-2 focus:ring-[#5D3704]"
                />
              </div>

              {/* Acordeón de Servicios Adicionales */}
              <div className="rounded-2xl border border-[#5D3704]/25 bg-[#F5EBE1]/70 backdrop-blur-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAdditionalsAccordionOpen(!isAdditionalsAccordionOpen)}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F5EBE1] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5D3704]" />
                    <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">
                      Servicios Adicionales & Complementos {selectedAdditionals.length > 0 && `(${selectedAdditionals.length} seleccionados)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {additionalsTotal > 0 && (
                      <span className="font-mono font-bold text-xs text-[#5D3704] bg-white px-2 py-0.5 rounded">
                        +S/. {additionalsTotal.toFixed(2)}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[#5D3704] transition-transform duration-300 ${
                        isAdditionalsAccordionOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isAdditionalsAccordionOpen && (
                  <div className="p-3.5 pt-0 border-t border-[#5D3704]/15 space-y-2 animate-fadeIn">
                    <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80 mb-2">
                      Selecciona los servicios adicionales que desees sumar a tu set:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {additionalsList
                        .filter((item) => item.active !== false)
                        .map((item) => {
                          const isSelected = selectedAdditionals.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-[#5D3704] bg-white shadow-2xs font-bold text-[#5D3704]'
                                  : 'border-[#5D3704]/20 bg-white/60 hover:bg-white text-[#5D3704]'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAdditional(item.id)}
                                  className="w-4 h-4 accent-[#5D3704] rounded"
                                />
                                <span className="font-['Marcellus'] text-xs">{item.name}</span>
                                {item.badge?.trim() && (
                                  <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider bg-[#F5EBE1] text-[#8C6B1C] border border-[#D4AF37]/50 px-1.5 py-0.5 rounded-md shrink-0">
                                    {item.badge.trim()}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-bold text-[11px] text-[#5D3704] shrink-0">
                                +S/. {item.price}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


  {/* ========================================================= */}
  {/* PASO 2: SELECCIONA DÍA Y HORA                             */}
  {/* ========================================================= */}
  {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Calendario translúcido con días de la semana */}
              <div>
                <label className="block text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] mb-2.5">
                  Selecciona el Día de tu Cita
                </label>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                  {availableDates.map((item) => {
                    const isDisabled = settings.disabledPresencialDates?.includes(item.iso);
                    return (
                      <button
                        key={item.iso}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setSelectedDate(item.iso)}
                        className={`min-w-[70px] p-2.5 rounded-2xl border text-center transition-all backdrop-blur-xs ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed line-through bg-gray-200/80 border-gray-300 text-gray-500'
                            : selectedDate === item.iso
                            ? 'border-[#5D3704] bg-[#5D3704]/20 ring-2 ring-[#5D3704] font-bold text-[#5D3704] shadow-xs cursor-pointer'
                            : 'border-[#5D3704]/20 bg-[#F5EBE1]/50 text-[#5D3704] hover:bg-[#F5EBE1] cursor-pointer'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-['Cinzel'] font-bold">
                          {item.dayName}
                        </span>
                        <span className="block text-lg font-bold font-mono my-0.5">
                          {item.dayNum}
                        </span>
                        <span className="block text-[9px] uppercase tracking-wider font-['Marcellus']">
                          {isDisabled ? 'Día Libre' : item.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Banner informativo de alta demanda si hay horarios reservados */}
              {appointments.some((a) => a.date === selectedDate && a.status !== 'cancelled' && a.id !== pendingAptId) && (
                <div className="p-2.5 rounded-xl bg-[#FAF4EB] border border-[#C5A059]/40 text-[11px] font-['Marcellus'] text-[#5D3704] flex items-center gap-2 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#C89D3C] shrink-0" />
                  <span>
                    Los casilleros marcados como <strong>'Cita temporalmente reservada'</strong> o <strong>'Cita Reservada'</strong> están bloqueados para asegurar la exclusividad del servicio.
                  </span>
                </div>
              )}

              {/* Horarios Regulares de Atención (2 horas y media por cita) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#5D3704]" />
                    <span>Jornada Regular de Atención (2h 30m por cita)</span>
                  </label>
                  <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70">
                    9:30 AM a 5:00 PM
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {REGULAR_TIME_SLOTS.map((slot) => renderTimeSlotButton(slot, false))}
                </div>
              </div>

              {/* Horarios Especiales (+ S/. 20.00 recargo fuera de jornada) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#5D3704]" />
                    <span>Horarios Especiales (+ S/. 20.00 recargo)</span>
                  </label>
                  <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70">
                    Temprano / Nocturno
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {SPECIAL_TIME_SLOTS.map((slot) => renderTimeSlotButton(slot, true))}
                </div>
              </div>

              {/* Nota Aclaratoria si se selecciona horario especial */}
              {isSpecialSchedule && (
                <div className="p-3 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/30 text-xs font-['Marcellus'] text-[#5D3704]">
                  ⭐ <strong>Recargo de Horario Especial:</strong> Has seleccionado {selectedSlot}, que corresponde a atención fuera de jornada regular. Se sumará automáticamente un recargo de S/. 20.00 a tu cita.
                </div>
              )}

              {/* Nota de Puntualidad y Tolerancia */}
              <div className="p-3.5 rounded-2xl bg-white/80 border border-[#5D3704]/20 flex items-start gap-2.5 backdrop-blur-xs">
                <Shield className="w-4 h-4 text-[#5D3704] shrink-0 mt-0.5" />
                <p className="font-['Marcellus'] text-xs text-[#5D3704] leading-relaxed">
                  "Tu espacio es exclusivo para ti. Te esperamos con puntualidad; disponemos de una tolerancia máxima de 10 minutos para iniciar tu cita de la mejor manera y cuidar los tiempos del estudio."
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 3: MODALIDAD DE SERVICIOS Y TUS DATOS                */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Loss Aversion BeeCoins Widget */}
              <LossAversionWidget estimatedPrice={totalPrice} isPromo={bookingServiceType === 'promotion'} />

              {/* Modalidad de Atención */}
              <div>
                <label className="block text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] mb-2">
                  Modalidad de Atención
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={dayModality === 'home'}
                    onClick={() => dayModality !== 'home' && setLocationType('studio')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer backdrop-blur-xs ${
                      dayModality === 'home'
                        ? 'opacity-40 cursor-not-allowed bg-gray-200/80 border-gray-300 text-gray-500'
                        : locationType === 'studio'
                        ? 'border-[#5D3704] bg-[#F5EBE1] ring-1 ring-[#5D3704] text-[#5D3704] shadow-xs'
                        : 'border-[#5D3704]/20 bg-white/70 text-[#5D3704]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-[#5D3704]" />
                      <span className="text-xs font-['Cinzel'] font-bold">EN STUDIO • JESÚS MARÍA</span>
                    </div>
                    <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80">
                      Atención especializada en nuestro estudio.
                      <br />
                      Av. Arnaldo Márquez 1165 N° 168
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={dayModality === 'studio'}
                    onClick={() => dayModality !== 'studio' && setLocationType('home')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer backdrop-blur-xs ${
                      dayModality === 'studio'
                        ? 'opacity-40 cursor-not-allowed bg-gray-200/80 border-gray-300 text-gray-500'
                        : locationType === 'home'
                        ? 'border-[#5D3704] bg-[#F5EBE1] ring-1 ring-[#5D3704] text-[#5D3704] shadow-xs'
                        : 'border-[#5D3704]/20 bg-white/70 text-[#5D3704]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-4 h-4 text-[#5D3704]" />
                      <span className="text-xs font-['Cinzel'] font-bold">A DOMICILIO</span>
                    </div>
                    <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80">
                      Te atendemos en la comodidad de tu hogar con un cargo por movilidad, dependiendo la distancia.
                    </p>
                  </button>
                </div>
              </div>

              {locationType === 'home' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Dirección exacta y distrito en Lima *
                    </label>
                    <input
                      type="text"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="Ej: Av. San Felipe 520 Dpto 402, Jesús María"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704] focus:outline-none focus:ring-2 focus:ring-[#5D3704]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Referencia de tu dirección
                    </label>
                    <input
                      type="text"
                      value={homeReference}
                      onChange={(e) => setHomeReference(e.target.value)}
                      placeholder="Ej: Frente al parque, piso 4 timbre 402"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704] focus:outline-none focus:ring-2 focus:ring-[#5D3704]"
                    />
                  </div>
                </div>
              )}

              {/* Datos personales en 2 columnas: Nombres/Apellidos y WhatsApp/Instagram */}
              <div className="pt-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={clientFirstName}
                      onChange={(e) => {
                        setClientFirstName(e.target.value);
                        setClientName(`${e.target.value} ${clientLastName}`.trim());
                      }}
                      placeholder="Ej: Lucía"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704] focus:outline-none focus:ring-2 focus:ring-[#5D3704]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={clientLastName}
                      onChange={(e) => {
                        setClientLastName(e.target.value);
                        setClientName(`${clientFirstName} ${e.target.value}`.trim());
                      }}
                      placeholder="Ej: Morales"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704] focus:outline-none focus:ring-2 focus:ring-[#5D3704]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      WhatsApp de Contacto *
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ej: 987 654 321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704] focus:outline-none focus:ring-2 focus:ring-[#5D3704]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Tu usuario de Instagram <span className="text-[10px] font-normal opacity-65">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={clientInstagram}
                      onChange={(e) => setClientInstagram(e.target.value)}
                      placeholder="@tuusuario"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704] focus:outline-none focus:ring-2 focus:ring-[#5D3704]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 4: MÉTODO DE PAGO / CONFIRMACIÓN                    */}
          {/* ========================================================= */}
          {step === 4 && !confirmedApt && (
            <div className="space-y-4 animate-fadeIn">

              <div className="p-4 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#5D3704] shrink-0 mt-0.5" />
                <div className="text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed">
                  Para separar formalmente tu cupo de atención, se requiere un <strong>adelanto del 50%</strong> (<strong className="font-['Cinzel'] font-bold">S/. {depositRequired.toFixed(2)}</strong>) por Yape, Plin o Transferencia BCP.
                  El saldo restante de <strong className="font-mono">S/. {remainingBalance.toFixed(2)}</strong> se abona el día de tu servicio en el estudio.
                </div>
              </div>

              {/* 3 Payment Methods Selector */}
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
                              onClick={() => handleCopy(settings.bcpAccount, 'bcp_acc')}
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
                              onClick={() => handleCopy(settings.bcpCci, 'bcp_cci')}
                              className="p-1 rounded bg-[#F5EBE1] hover:bg-[#ebdccf] cursor-pointer"
                            >
                              {copiedField === 'bcp_cci' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[#5D3704]/10">
                          <span className="font-['Cinzel'] font-bold">Titular:</span>
                          <span className="font-['Marcellus'] font-bold">{settings.bcpName}</span>
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
                          {paymentMethod === 'yape' ? settings.yapeNumber : settings.plinNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              paymentMethod === 'yape' ? settings.yapeNumber : settings.plinNumber,
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
                        Titular: <strong>{paymentMethod === 'yape' ? settings.yapeName : settings.plinName}</strong>
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#5D3704]/10 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-['Marcellus']">Total del servicio:</span>
                      <span className="font-mono font-bold">S/. {finalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#5D3704] font-bold">
                      <span className="font-['Cinzel']">Adelanto requerido (50%):</span>
                      <span className="font-mono text-[#8C6B1C]">S/. {depositRequired.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#5D3704]/70">
                      <span className="font-['Marcellus']">Saldo el día de la cita:</span>
                      <span className="font-mono">S/. {remainingBalance.toFixed(2)}</span>
                    </div>
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
                subtitle="Nos ayuda a verificar tu abono al instante y asegurar tu cita en el estudio ✨"
                placeholder="Ej: 849201 (6 a 9 dígitos numéricos)"
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* CONFIRMACIÓN EXITOSA TRAS RESERVAR TU CITA                */}
          {/* ========================================================= */}
          {confirmedApt && (
            <div className="text-center py-4 space-y-4 animate-fadeIn">
              {/* Circulito con Check Dorado Brillante (Efecto Glow Sutil) */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-[#FAF7F2] border-2 border-[#D4AF37] flex items-center justify-center shadow-xl animate-bounce"
                style={{ boxShadow: '0 0 25px rgba(212, 175, 55, 0.4)' }}
              >
                <Check className="w-10 h-10 sm:w-12 sm:h-12 text-[#D4AF37] stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704] tracking-tight">
                  PEDIDO CONFIRMADO CON ÉXITO
                </h3>
                <span className="text-[11px] font-['Cinzel'] font-bold text-[#C89D3C] tracking-widest block mt-1 uppercase">
                  CÓDIGO DE ORDEN: {confirmedApt?.code || 'GNB-2026-001'}
                </span>
                <p className="text-xs font-['Marcellus'] text-[#5D3704]/90 max-w-md mx-auto mt-2 leading-relaxed">
                  Nuestro equipo verificará tu comprobante para confirmar tu cita, cualquier duda adicional puedes comunicarte con nosotros presionando en el botón de WhatsApp 💬
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/95 border border-[#D4AF37]/40 text-left text-xs font-['Marcellus'] text-[#5D3704] space-y-2 max-w-md mx-auto shadow-xs">
                <div className="flex justify-between border-b border-[#EFE5D7] pb-1.5">
                  <span className="font-['Cinzel'] font-bold text-[#5D3704]">CLIENTE:</span>
                  <span className="font-bold">{confirmedApt?.clientName || 'Cliente'}</span>
                </div>
                {confirmedApt?.promoType === '2x1' && confirmedApt?.promoCompanion && (
                  <div className="flex justify-between gap-3 border-b border-[#EFE5D7] pb-1.5">
                    <span className="font-['Cinzel'] font-bold text-[#5D3704]">PERSONA 2 (2x1):</span>
                    <span className="font-bold text-right">
                      {confirmedApt.promoCompanion.name} · {getSystemNameFromId(confirmedApt.promoCompanion.system)} ·{' '}
                      {confirmedApt.promoCompanion.level === 'sencillo' ? 'Sutil (S)' : confirmedApt.promoCompanion.level === 'complejo' ? 'Complejo (C)' : 'Moderado (M)'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Fecha y Hora:</span>
                  <span className="font-bold">{confirmedApt?.date || ''} · {confirmedApt?.timeSlot || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Estimado:</span>
                  <span className="font-bold font-mono">S/. {(confirmedApt?.totalPrice ?? totalPrice ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adelanto del 50% por pagar:</span>
                  <span className="font-bold font-mono text-[#5D3704]">S/. {(confirmedApt?.depositRequired ?? depositRequired ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 pt-1 border-t border-[#EFE5D7]">
                  <span className="font-['Cinzel'] font-bold">Saldo el día de la cita:</span>
                  <span className="font-bold font-mono text-[#047857]">
                    S/. {Math.max(0, (confirmedApt?.totalPrice ?? totalPrice ?? 0) - (confirmedApt?.depositRequired ?? depositRequired ?? 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 max-w-md mx-auto">
                <a
                  href={generateWhatsAppLink({ ...confirmedApt, paymentOperationNumber: paymentOperationNumber.trim() || confirmedApt?.paymentOperationNumber })}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-['Cinzel'] font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span>CONTINUAR POR WHATSAPP</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Controls for Steps 1, 2, 3, 4 (Franja inferior con patrón de abejas) */}
        {!confirmedApt && (
          <div
            className="relative z-10 p-4 border-t border-[#5D3704]/20 flex items-center justify-between gap-3"
            style={{
              backgroundColor: '#FAF7F2',
              backgroundImage: 'var(--site-window-pattern)',
              backgroundSize: '200px auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="py-2.5 px-4 rounded-xl border border-[#5D3704]/30 bg-[#F5EBE1] text-xs font-['Cinzel'] font-bold text-[#5D3704] hover:bg-[#ebdccf] flex items-center gap-1 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-[#5D3704]" />
                <span>Atrás</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-2.5 px-4 rounded-xl border border-[#5D3704]/30 bg-[#F5EBE1] text-xs font-['Cinzel'] font-bold text-[#5D3704] hover:bg-[#ebdccf] cursor-pointer transition-all"
              >
                Cancelar
              </button>
            )}

            <div className="flex items-center gap-2.5">
              {/* Recuadro Total Estimado con Botón Mágico 🎂 y Descuento de Cumpleaños */}
              {step === 1 && (
                <div className="flex items-center gap-2">
                  <BirthdayDiscountButton
                    isApplied={applyBirthdayDiscount}
                    onToggle={() => setApplyBirthdayDiscount((prev) => !prev)}
                    discountAmount={birthdayDiscount.discountAmount}
                  />
                  <BeeCoinsFooterBadge totalEstimated={finalPrice} isPromo={bookingServiceType === 'promotion'} />
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#F5EBE1]/90 border border-[#D4AF37]/60 shadow-2xs text-right animate-fadeIn">
                    <span className="text-[9px] font-['Cinzel'] font-bold text-[#5D3704]/80 uppercase tracking-wider block">
                      TOTAL ESTIMADO:
                    </span>
                    {birthdayDiscount.discountAmount > 0 ? (
                      <div className="text-right">
                        <span className="text-[10px] line-through text-gray-500 font-mono block">
                          S/. {totalPrice.toFixed(2)}
                        </span>
                        <span className="text-xs sm:text-sm font-['Cinzel'] font-bold text-[#5D3704]">
                          S/. {finalPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-['Cinzel'] font-bold text-[#5D3704]">
                        S/. {totalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    if (isTwoForOne && !companionName.trim()) {
                      alert('Por favor ingresa el nombre completo de la acompañante para continuar con la promo 2x1.');
                      return;
                    }
                    if (isTwoForOne && !companionPhone.trim()) {
                      alert('Por favor ingresa el número de teléfono de la acompañante para continuar con la promo 2x1.');
                      return;
                    }
                    setStep(2);
                  } else if (step === 2) {
                    // Check if current selectedSlot is occupied by another booking
                    const isOccupied = appointments.some(
                      (a) => a.date === selectedDate && a.timeSlot === selectedSlot && a.status !== 'cancelled' && a.id !== pendingAptId
                    );
                    if (isOccupied) {
                      alert(`El horario ${selectedSlot} ya se encuentra reservado. Por favor elige otro casillero libre.`);
                      return;
                    }

                    // Bloqueo Inmediato al Continuar: registrar de inmediato en estado 'En espera de confirmación' (pending_deposit)
                    // Reserva temporal de horario (sin notificar a Telegram hasta confirmar pago).
                    if (!pendingAptId) {
                      const newApt = createAppointment({
                        clientName: clientName.trim() || (currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : 'Clienta en reserva'),
                        clientPhone: clientPhone.trim() || currentUser?.phone || '',
                        clientInstagram: clientInstagram.trim() || currentUser?.instagram || undefined,
                        birthDate: clientBirthDate.trim() || currentUser?.birthDate || undefined,
                        serviceType: bookingServiceType,
                        promoDesignId: bookingServiceType === 'promotion' ? activePromo?.id : undefined,
                        promoDesignTitle: bookingServiceType === 'promotion' ? activePromo?.title : undefined,
                        promoType: bookingServiceType === 'promotion' ? promoType : undefined,
                        promoCompanion: isTwoForOne
                          ? { name: companionName.trim(), phone: companionPhone.trim(), system: companionSystem, level: companionLevel, price: activePromo?.price }
                          : undefined,
                        customDetails: customConfig,
                        removalDetails: bookingServiceType === 'removal' ? { type: removalType, spaManicure: false } : undefined,
                        date: selectedDate,
                        timeSlot: selectedSlot,
                        isSpecialSchedule,
                        specialScheduleFee,
                        locationType,
                        homeAddress: locationType === 'home' ? homeAddress.trim() : undefined,
                        homeReference: locationType === 'home' ? homeReference.trim() : undefined,
                        status: 'pending_deposit',
                        totalPrice,
                        depositRequired,
                        depositPaid: false,
                        paymentMethod,
                        paymentOperationNumber: '',
                        additionals: selectedAdditionals,
                        notes: notes.trim() || undefined,
                      }, { notifyTelegram: false });
                      setPendingAptId(newApt.id);
                    } else {
                      updateAppointment(pendingAptId, {
                        date: selectedDate,
                        timeSlot: selectedSlot,
                        isSpecialSchedule,
                        specialScheduleFee,
                        totalPrice,
                        depositRequired,
                        additionals: selectedAdditionals,
                        notes: notes.trim() || undefined,
                      });
                    }

                    setStep(3);
                  } else if (step === 3) {
                    if (!clientName.trim() || !clientPhone.trim()) {
                      alert('Por favor completa tu nombre y número de WhatsApp para continuar.');
                      return;
                    }
                    setStep(4);
                  } else if (step === 4) {
                    handleFinalSubmit();
                  }
                }}
                className="py-2.5 px-5 sm:px-6 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-xs font-['Cinzel'] font-bold text-[#5D3704] shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>{step === 4 ? 'Reservar tu cita' : 'Continuar'}</span>
                <ArrowRight className="w-4 h-4 text-[#5D3704]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
};
