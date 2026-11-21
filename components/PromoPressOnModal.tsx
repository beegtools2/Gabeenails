import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Gift,
  Ruler,
  Truck,
  Store,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ZoomIn,
  Send,
  ArrowLeft,
  ArrowRight,
  Info,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { TipType, SizeType, PromoDesign } from '../types';
import { GabeeBeeMark } from './GabeeBeeMark';
import { BeeCoinIcon } from './BeeCoinIcon';
import { BeeCoinsFooterBadge } from './BeeCoinsFooterBadge';
import { BirthdayDiscountButton } from './BirthdayDiscountButton';
import { calculateBirthdayDiscount } from '../utils/birthdayDiscountUtils';
import { OperationCodeInput } from './OperationCodeInput';
import { validateOperationCode } from '../utils/validationUtils';
import { renderWhatsAppTemplate, getWhatsAppTemplate } from '../utils/whatsappTemplateUtils';

type StepType = 1 | 2 | 3;

type DuoSetSelection = {
  designId: string;
  size: SizeType | '';
};

type DuoKitInfo = {
  label: string;
  duoLabel: string;
  value: number;
  desc: string;
};

// Four Size Tables Data (matching size chart modal standards)
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

export const PromoPressOnModal: React.FC = () => {
  const {
    isPromoPressOnModalOpen,
    closePromoPressOnModal,
    selectedPromoPressOnDesign,
    promoDesigns,
    settings,
    createAppointment,
    additionalsList,
    currentUser,
    recordOperationCode,
  } = useApp();

  const pressOnAdditionals = useMemo(() => {
    return additionalsList.filter(
      (item) => item.active !== false && (!item.targetSection || item.targetSection === 'press_on' || item.targetSection === 'both')
    );
  }, [additionalsList]);

  // Kit incluido configurado desde admin (dinámico por promoción)
  const includedKitKey = (selectedPromoPressOnDesign?.includedKit || 'elemental') as 'elemental' | 'standard' | 'premium';
  const includedKitInfo = useMemo<DuoKitInfo>(() => {
    const map: Record<'elemental' | 'standard' | 'premium', DuoKitInfo> = {
      elemental: {
        label: 'Kit Elemental',
        duoLabel: '2 Kits Elementales',
        value: 10,
        desc: 'Lima de preparación, plancheta de pegatinas adhesivas (24 pcs), pegamento líquido, repujador de madera, alcohol pad preparador, stickers decorativos y regalito sorpresa ♥',
      },
      standard: {
        label: 'Kit Standard',
        duoLabel: '2 Kits Standard',
        value: 20,
        desc: 'Lima, Buffer, Repujador, Palito removedor, 2 Alcohol Pad, 2 Pegatinas, 2 pegamentos líquidos, Stickers y Regalito sorpresa ♥',
      },
      premium: {
        label: 'Kit Premium',
        duoLabel: '2 Kits Premium',
        value: 25,
        desc: 'Lima Large, Buffer, Repujador, Palito removedor, 2 Alcohol Pad, 4 Pegatinas, 1 Pegamento líquido grande, Aceite de cutícula nutritivo, Cepillo de uñas, Stickers y Regalito sorpresa ♥',
      },
    };
    return map[includedKitKey] || map.elemental;
  }, [includedKitKey]);

  const isDuoPressOn = selectedPromoPressOnDesign?.pressOnStructure === 'duo';

  const duoDesignOptions = useMemo(() => {
    if (!selectedPromoPressOnDesign || !isDuoPressOn) return [];
    const allowedIds = selectedPromoPressOnDesign.duoDesignIds || [];
    return promoDesigns.filter((design) => {
      const isPressOn =
        design.category === 'press_on' || (design.collection || '').toLowerCase().includes('press on');
      const participates =
        allowedIds.length > 0 ? allowedIds.includes(design.id) : true;
      return (
        design.id !== selectedPromoPressOnDesign.id &&
        design.active !== false &&
        isPressOn &&
        participates
      );
    });
  }, [promoDesigns, selectedPromoPressOnDesign, isDuoPressOn]);

  const [step, setStep] = useState<StepType>(1);

  // Form selections (Strictly size and additionals; tip and length selectors removed as requested)
  const [selectedSize, setSelectedSize] = useState<SizeType | ''>('');
  const [duoSelections, setDuoSelections] = useState<DuoSetSelection[]>([
    { designId: '', size: '' },
    { designId: '', size: '' },
  ]);
  const [selectedAdditionals, setSelectedAdditionals] = useState<string[]>([]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Roulette Birthday Prize State
  const [applyBirthdayDiscount, setApplyBirthdayDiscount] = useState(false);

  // Client & delivery details
  const [deliveryType, setDeliveryType] = useState<'studio' | 'delivery'>('studio');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [departmentProvince, setDepartmentProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bcp'>('yape');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderCode, setConfirmedOrderCode] = useState('');
  const [paymentOperationNumber, setPaymentOperationNumber] = useState('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // 20-minute reservation timer state (1200 seconds)
  const [timerSeconds, setTimerSeconds] = useState(1200);

  // Aviso emergente temporal de validación (solo talla; el kit promocional ya viene incluido)
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

  // Full reset function on closing modal
  const handleCloseAndReset = () => {
    if (validationToastTimer.current) window.clearTimeout(validationToastTimer.current);
    validationToastTimer.current = null;
    setValidationToast(null);
    setStep(1);
    setSelectedSize('');
    setDuoSelections([
      { designId: '', size: '' },
      { designId: '', size: '' },
    ]);
    setSelectedAdditionals([]);
    setIsAccordionOpen(false);
    setShowSizeChart(false);
    setApplyBirthdayDiscount(false);
    setDeliveryType('studio');
    setFirstName('');
    setLastName('');
    setPhone('');
    setInstagram('');
    setDepartmentProvince('');
    setDistrict('');
    setAddress('');
    setReference('');
    setNotes('');
    setPaymentMethod('yape');
    setPaymentOperationNumber('');
    setQrCodeDataUrl('');
    setCopiedField(null);
    setIsSubmitting(false);
    setOrderConfirmed(false);
    setConfirmedOrderCode('');
    setTimerSeconds(1200);
    setIsZoomOpen(false);

    closePromoPressOnModal();
  };

  // Countdown ticker
  useEffect(() => {
    if (!selectedPromoPressOnDesign || orderConfirmed) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedPromoPressOnDesign, orderConfirmed]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Synchronize initial values only when a promo design is first opened
  useEffect(() => {
    if (selectedPromoPressOnDesign) {
      setStep(1);
      setOrderConfirmed(false);
      setConfirmedOrderCode('');
      setSelectedSize(isDuoPressOn ? '' : 'S');
      setDuoSelections([
        { designId: '', size: '' },
        { designId: '', size: '' },
      ]);
      setSelectedAdditionals([]);
      setApplyBirthdayDiscount(false);
      setDeliveryType('studio');
      setTimerSeconds(1200); // Reset to 20:00 min
      setIsZoomOpen(false);

      if (currentUser) {
        setFirstName(currentUser.firstName || '');
        setLastName(currentUser.lastName || '');
        setPhone(currentUser.phone || '');
        setInstagram(currentUser.instagram || '');
        setDepartmentProvince(currentUser.departmentProvince || currentUser.department || 'Lima');
        setDistrict(currentUser.district || '');
        setAddress(currentUser.address || '');
        setReference(currentUser.reference || '');
      } else {
        setFirstName('');
        setLastName('');
        setPhone('');
        setInstagram('');
        setDepartmentProvince('');
        setDistrict('');
        setAddress('');
        setReference('');
      }
    }
  }, [selectedPromoPressOnDesign, currentUser, isDuoPressOn]);

  // Autocompletado de dirección de inmediato al seleccionar envío a domicilio
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

  const isSizeAvailableForDesign = (design: PromoDesign | null, size: SizeType) => {
    if (!design) return false;
    if (design.sizeStock) return design.sizeStock[size] ?? true;
    return settings.sizeStock?.[size] ?? true;
  };

  const duoSetDesigns = duoSelections.map((selection) =>
    duoDesignOptions.find((design) => design.id === selection.designId) || null
  );

  const duoSelectionsComplete =
    isDuoPressOn &&
    duoSelections.every(
      (selection, index) =>
        !!duoSetDesigns[index] &&
        !!selection.size &&
        isSizeAvailableForDesign(duoSetDesigns[index], selection.size as SizeType)
    );

  const updateDuoDesign = (setIndex: 0 | 1, designId: string) => {
    setDuoSelections((prev) =>
      prev.map((selection, index) => (index === setIndex ? { designId, size: '' } : selection))
    );
  };

  const updateDuoSize = (setIndex: 0 | 1, size: SizeType) => {
    setDuoSelections((prev) =>
      prev.map((selection, index) => (index === setIndex ? { ...selection, size } : selection))
    );
  };

  // Additionals total
  const additionalsTotal = useMemo(() => {
    return selectedAdditionals.reduce((sum, id) => {
      const item = pressOnAdditionals.find((a: any) => a.id === id);
      return sum + (item ? item.price : 0);
    }, 0);
  }, [selectedAdditionals, pressOnAdditionals]);

  // Base promo price strictly from promo design
  const basePromoPrice = selectedPromoPressOnDesign?.price || 0;

  // Calculated subtotal before discount (Duo es un paquete cerrado a precio único)
  const calculatedTotal = useMemo(() => {
    return isDuoPressOn ? basePromoPrice : basePromoPrice + additionalsTotal;
  }, [basePromoPrice, additionalsTotal, isDuoPressOn]);

  // Birthday discount calculation
  const birthdayDiscount = useMemo(() => {
    if (isDuoPressOn || !applyBirthdayDiscount || !currentUser?.roulettePrize) {
      return { discountAmount: 0, label: '', isGratis: false, percentage: 0 };
    }
    return calculateBirthdayDiscount(currentUser.roulettePrize, calculatedTotal);
  }, [isDuoPressOn, applyBirthdayDiscount, currentUser?.roulettePrize, calculatedTotal]);

  // Final total estimated after applying any active roulette discount
  const finalTotal = Math.max(0, calculatedTotal - birthdayDiscount.discountAmount);

  // Dynamic QR Code generation for payment
  useEffect(() => {
    if (!settings) return;
    let paymentString = '';
    const amountStr = finalTotal.toFixed(2);

    if (paymentMethod === 'yape') {
      paymentString = `00020101021126450011pe.yape.app0112${settings.yapeNumber}520400005303604540${amountStr.length}${amountStr}5802PE5915GABEE NAIL ART6004LIMA6304`;
    } else if (paymentMethod === 'plin') {
      paymentString = `00020101021126450011pe.plin.app0112${settings.yapeNumber}520400005303604540${amountStr.length}${amountStr}5802PE5915GABEE NAIL ART6004LIMA6304`;
    } else {
      paymentString = `BCP:${settings.bcpAccount}|CCI:${settings.bcpCci}|TOTAL:${amountStr}`;
    }

    QRCode.toDataURL(paymentString, { width: 180, margin: 1, color: { dark: '#5D3704', light: '#FFFFFF' } })
      .then((url: string) => setQrCodeDataUrl(url))
      .catch(() => setQrCodeDataUrl(''));
  }, [paymentMethod, finalTotal, settings]);

  if (!isPromoPressOnModalOpen || !selectedPromoPressOnDesign) return null;

  const orderSetName = isDuoPressOn
    ? `Press on Duo · Set 1: ${duoSetDesigns[0]?.title || 'N/A'} (Talla ${duoSelections[0].size || 'N/A'}) + Set 2: ${duoSetDesigns[1]?.title || 'N/A'} (Talla ${duoSelections[1].size || 'N/A'}) · Incluye ${includedKitInfo.duoLabel}`
    : selectedPromoPressOnDesign.title;
  const orderSizeText = isDuoPressOn
    ? `Set 1: ${duoSelections[0].size || 'N/A'} · Set 2: ${duoSelections[1].size || 'N/A'}`
    : selectedSize || 'N/A';
  const orderKitText = isDuoPressOn ? includedKitInfo.duoLabel : includedKitInfo.label;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const toggleAdditionalItem = (id: string) => {
    setSelectedAdditionals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (isDuoPressOn) {
        if (duoDesignOptions.length === 0) {
          showValidationToast('No hay diseños disponibles para armar el Duo. Comunícate con el estudio.', 3500);
          return;
        }
        if (!duoSelectionsComplete) {
          showValidationToast('Selecciona el diseño y una talla disponible para el Set 1 y para el Set 2.', 3500);
          return;
        }
      } else if (!selectedSize) {
        showValidationToast('Para continuar, por favor selecciona tu talla.', 3500);
        return;
      }
    }
    if (step === 2) {
      if (!firstName.trim()) {
        alert('Por favor ingresa tus Nombres.');
        return;
      }
      if (!lastName.trim()) {
        alert('Por favor ingresa tus Apellidos.');
        return;
      }
      if (!phone.trim()) {
        alert('Por favor ingresa tu WhatsApp de Contacto.');
        return;
      }
      if (deliveryType === 'delivery' && !address.trim()) {
        alert('Por favor ingresa la Dirección Exacta de Entrega.');
        return;
      }
    }
    setStep((prev) => (prev < 3 ? ((prev + 1) as StepType) : prev));
  };

  const handlePrevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as StepType) : prev));
  };

  const handleConfirmAndWhatsApp = async () => {
    const opNumber = paymentOperationNumber.trim();
    const valResult = validateOperationCode(opNumber);
    if (!valResult.isValid) {
      alert(valResult.errorMessage);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const createdApt = createAppointment({
        clientName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        clientPhone: phone.trim(),
        clientInstagram: instagram.trim() || undefined,
        serviceType: 'promotion',
        promoDesignId: selectedPromoPressOnDesign.id,
        promoDesignTitle: orderSetName,
        date: new Date().toISOString().split('T')[0],
        timeSlot: 'Por coordinar',
        locationType: deliveryType === 'studio' ? 'studio' : 'home',
        homeAddress: deliveryType === 'delivery'
          ? `${address.trim()}${district.trim() || departmentProvince.trim() ? ` (${[departmentProvince.trim(), district.trim()].filter(Boolean).join(' - ')})` : ''}`
          : undefined,
        status: 'pending_deposit',
        totalPrice: finalTotal,
        depositRequired: finalTotal,
        depositPaid: false,
        paymentMethod: paymentMethod,
        paymentOperationNumber: opNumber,
        pressOnDetails: {
          mode: 'catalog',
          setName: orderSetName,
          size: orderSizeText,
          kit: orderKitText,
          deliveryType: deliveryType,
          address: address,
          district: district,
          department: departmentProvince,
          reference: reference,
        },
        additionals: selectedAdditionals,
        notes: notes.trim() || undefined,
      });

      const orderCode = createdApt.code;

      const itemsList: string[] = [
        `• ${isDuoPressOn ? 'Promo Duo' : 'Set Promo'}: *${orderSetName}* (S/. ${basePromoPrice.toFixed(2)})`,
        `• ${isDuoPressOn ? 'Tallas' : 'Talla'}: *${orderSizeText}*`,
        `• ${isDuoPressOn ? 'Kits Incluidos' : 'Kit Incluido'}: *${orderKitText} (¡Incluidos Gratis con Promo!)*`,
        `• Modalidad de Entrega: *${deliveryType === 'studio' ? 'Recojo en Studio Jesús María' : `Envío a Domicilio (${district})`}*`,
      ];

      if (applyBirthdayDiscount && birthdayDiscount.discountAmount > 0) {
        itemsList.push(`• Descuento Ruleta: *-S/. ${birthdayDiscount.discountAmount.toFixed(2)}* (${birthdayDiscount.label})`);
      }

      if (selectedAdditionals.length > 0) {
        const addsNames = selectedAdditionals
          .map((id) => pressOnAdditionals.find((a: any) => a.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        itemsList.push(`• Adicionales: *${addsNames}* (+S/. ${additionalsTotal.toFixed(2)})`);
      }

      const clientBirthday = currentUser?.birthDate || 'N/A';
      const modalityLabel = deliveryType === 'studio' ? 'Recojo en Studio Jesús María' : 'Envío a Domicilio';
      const isPickup = deliveryType === 'studio' || /studio|recojo/i.test(modalityLabel);
      const addressStr = isPickup
        ? 'Av. Arnaldo Márquez 1165 N° 168'
        : `${address.trim()}${district.trim() || departmentProvince.trim() ? ` (${[departmentProvince.trim(), district.trim()].filter(Boolean).join(' - ')})` : ''}`.trim() || 'N/A';
      const referenceStr = isPickup ? 'Plaza Márquez' : (reference.trim() || 'N/A');
      const instagramStr = instagram.trim() ? `@${instagram.trim().replace('@', '')}` : 'N/A';
      const additionalsListNames = selectedAdditionals.length > 0
        ? selectedAdditionals.map((id) => pressOnAdditionals.find((a: any) => a.id === id)?.name).filter(Boolean).join(', ')
        : '';
      const notesStr = notes.trim() ? `Nota: ${notes.trim()}` : '';
      const additionalsStr = [additionalsListNames, notesStr].filter(Boolean).join(' | ') || 'N/A';

      // Intentar usar plantilla personalizada del admin
      let waMsg = `*✦ CONFIRMACIÓN DE PEDIDO PROMOCIONAL | GABEE STUDIO ✦*\n` +
        `*✧ Reserva:* ${orderCode}\n` +
        `──────────────────────────\n` +
        `*✧ Cliente:* ${firstName.trim() || 'N/A'} ${lastName.trim() || 'N/A'}\n` +
        `*✧ WhatsApp:* ${phone.trim() || 'N/A'}\n` +
        `*✧ Nombre del set:* ${orderSetName}\n` +
        `*✧ Talla:* ${orderSizeText}\n` +
        `*✧ Entrega:* ${modalityLabel}\n` +
        `*✧ Dirección:* ${addressStr}\n` +
        `*✧ Referencia:* ${referenceStr}\n` +
        `*✧ Cumpleaños:* ${clientBirthday}\n` +
        `*✧ Instagram:* ${instagramStr}\n` +
        `*✧ Adicionales:* ${additionalsStr}\n` +
        `──────────────────────────\n` +
        `*✧ Monto Total:* S/. ${finalTotal.toFixed(2)}\n` +
        `*✧ Método de pago:* ${paymentMethod.toUpperCase()}\n` +
        `*✧ N° de Operación:* ${opNumber}\n` +
        `──────────────────────────\n` +
        `*¡Hola Gaby! Te adjunto mi comprobante de pago para confirmar mi pedido. ¡Muchas gracias! ♡*`;

      try {
        const tmpl = getWhatsAppTemplate(settings, 'promo_presson');
        const vars: Record<string, string> = {
          codigo: orderCode,
          cliente: `${firstName.trim() || 'N/A'} ${lastName.trim() || 'N/A'}`,
          whatsapp: phone.trim() || 'N/A',
          servicio: orderSetName,
          talla: orderSizeText,
          kit: orderKitText,
          modalidad: modalityLabel,
          direccion: addressStr,
          referencia: referenceStr,
          cumpleanos: clientBirthday || 'N/A',
          instagram: instagramStr || 'N/A',
          adicionales: additionalsStr || 'N/A',
          total: finalTotal.toFixed(2),
          metodo_pago: paymentMethod.toUpperCase(),
          operacion: opNumber || 'Sin número de operación',
          numero_operacion: opNumber || 'Sin número de operación',
        };
        const rendered = renderWhatsAppTemplate(tmpl, vars);
        if (rendered) waMsg = rendered;
      } catch (e) {
        // fallback
      }

      const waPhone = '51' + (settings.whatsappNumber || '934403311').replace(/[^0-9]/g, '').replace(/^51/, '');
      const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waMsg)}`;

      setConfirmedOrderCode(orderCode);
      setOrderConfirmed(true);

      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Error al confirmar pedido press-on promo:', err);
      alert('Hubo un inconveniente al procesar tu pedido. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
    >
      <div
        className="relative border border-[#D4AF37]/50 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          backgroundColor: '#FAF7F2',
          backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
          backgroundSize: '240px auto',
          backgroundRepeat: 'repeat',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Translucent Veil */}
        <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-md pointer-events-none" />

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

        {/* Modal Header */}
        <div
          className="relative z-10 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#5D3704]/20 flex items-center justify-between gap-3 shrink-0"
          style={{
            backgroundColor: '#FAF7F2',
            backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="flex items-center gap-3 bg-[#FAF7F2]/95 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-[#5D3704]/20 shadow-2xs">
            <GabeeBeeMark size="sm" />
            <div>
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]/90 block leading-tight">
                {isDuoPressOn ? 'PROMO DUO PRESS ON · 2 SETS · GABEE STUDIO' : 'PROMO PRESS ON · GABEE STUDIO'}
              </span>
              <h2 className="text-xs sm:text-sm md:text-base font-['Cinzel'] font-bold text-[#5D3704] tracking-tight uppercase leading-snug">
                {step === 2
                  ? 'MODALIDAD DE ENTREGA Y TUS DATOS'
                  : step === 3
                  ? 'PAGO Y CONFIRMACIÓN'
                  : selectedPromoPressOnDesign?.title || 'PERSONALIZA TU SET'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAndReset}
            className="p-2 text-[#5D3704] bg-[#F5EBE1] hover:bg-[#ebdccf] rounded-full shadow-2xs transition-colors cursor-pointer"
            title="Cerrar modal"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#5D3704]" />
          </button>
        </div>

        {/* 20-minute countdown banner right at the top */}
        {!orderConfirmed && (
          <div className="relative z-10 w-full bg-[#F5EBE1]/95 border-b border-[#D5C6B1] px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-['Cinzel'] font-bold text-[#5D3704] shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#5D3704] animate-pulse" />
            <span>
              TU CUPO ESTÁ RESERVADO POR: {formatTimer(timerSeconds)} MIN
            </span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
          {orderConfirmed ? (
            /* Order Confirmed View (Inspirado en CONFIRMACION.png) */
            <div className="max-w-xl mx-auto py-6 text-center space-y-5 animate-fadeIn">
              {/* Círculo translúcido en tonos dorados con brillo suave y check dorado brillante */}
              <div className="w-20 h-20 bg-[#FBF7EE] rounded-full flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-[#D4AF37]/60 animate-bounce">
                <Check className="w-10 h-10 text-[#C89D3C] filter drop-shadow-[0_2px_4px_rgba(200,157,60,0.5)]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704] uppercase tracking-tight">
                  PEDIDO CONFIRMADO CON ÉXITO
                </h3>
                <span className="text-xs font-['Cinzel'] font-bold uppercase tracking-widest text-[#9C7954] block">
                  CÓDIGO DE ORDEN: {confirmedOrderCode}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704]/90 leading-relaxed max-w-md mx-auto">
                Nuestro equipo confirmará tu comprobante y luego procederemos a alistar tu pedido, cualquier duda adicional puedes comunicarte con nosotros presionando en el botón de WhatsApp 💬
              </p>

              {/* Recuadro limpio con la lista detallada del pedido */}
              <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 text-left space-y-2.5 shadow-xs text-xs font-['Marcellus'] text-[#5D3704]">
                <div className="flex justify-between border-b border-[#EFE5D7] pb-2 font-['Cinzel'] font-bold uppercase">
                  <span>Cliente:</span>
                  <span>{firstName} {lastName}</span>
                </div>
                {isDuoPressOn ? (
                  <>
                    <div className="flex justify-between">
                      <span>• Set 1: <strong>{duoSetDesigns[0]?.title || 'N/A'}</strong> (Talla {duoSelections[0].size || 'N/A'})</span>
                      <span className="font-mono font-bold">Incluido</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Set 2: <strong>{duoSetDesigns[1]?.title || 'N/A'}</strong> (Talla {duoSelections[1].size || 'N/A'})</span>
                      <span className="font-mono font-bold">Incluido</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>• Set: <strong>{selectedPromoPressOnDesign.title}</strong> (Talla {selectedSize})</span>
                    <span className="font-mono font-bold">S/. {basePromoPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>• {isDuoPressOn ? 'Kits Incluidos' : 'Kit Incluido'}: <strong>{orderKitText}</strong></span>
                  <span className="font-mono font-bold text-emerald-700">S/. 0.00 (Gratis)</span>
                </div>
                <div className="flex justify-between">
                  <span>• Modalidad: <strong>{deliveryType === 'studio' ? 'Recojo en Studio Jesús María' : `Envío a Domicilio (${district})`}</strong></span>
                  <span className="font-mono font-bold">{deliveryType === 'studio' ? 'Gratis' : 'Por calcular'}</span>
                </div>
                {selectedAdditionals.length > 0 && (
                  <div className="flex justify-between">
                    <span>• Adicionales ({selectedAdditionals.length})</span>
                    <span className="font-mono font-bold">+ S/. {additionalsTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#DFD1BD] font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                  <span>TOTAL A CANCELAR:</span>
                  <span className="font-mono text-[#C89D3C]">S/. {finalTotal.toFixed(2)}</span>
                </div>
                {paymentOperationNumber && (
                  <div className="flex justify-between text-[11px] text-[#5D3704]/70 pt-1">
                    <span>Operación {paymentMethod.toUpperCase()}:</span>
                    <span className="font-mono">{paymentOperationNumber}</span>
                  </div>
                )}
              </div>

              {/* Botón con verde oficial de WhatsApp (#25D366) e icono de avioncito de papel */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const waPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
                    const clientBirthday = currentUser?.birthDate || 'N/A';
                    const isPickupResend = deliveryType === 'studio';
                    const addressStr = isPickupResend ? 'Av. Arnaldo Márquez 1165 N° 168' : `${address.trim()}${district.trim() ? ` (${district.trim()})` : ''}`.trim() || 'N/A';
                    const referenceStr = isPickupResend ? 'Plaza Márquez' : (reference.trim() || 'N/A');
                    const instagramStr = instagram.trim() ? `@${instagram.trim().replace('@', '')}` : 'N/A';
                    const additionalsListNames = selectedAdditionals.length > 0
                      ? selectedAdditionals.map((id) => pressOnAdditionals.find((a: any) => a.id === id)?.name).filter(Boolean).join(', ')
                      : '';
                    const notesStr = notes.trim() ? `Nota: ${notes.trim()}` : '';
                    const additionalsStr = [additionalsListNames, notesStr].filter(Boolean).join(' | ') || 'N/A';

                    const waMsg = `*✦ CONFIRMACIÓN DE PEDIDO PROMOCIONAL | GABEE STUDIO ✦*\n` +
                      `*✧ Reserva:* ${confirmedOrderCode}\n` +
                      `──────────────────────────\n` +
                      `*✧ Cliente:* ${firstName.trim() || 'N/A'} ${lastName.trim() || 'N/A'}\n` +
                      `*✧ WhatsApp:* ${phone.trim() || 'N/A'}\n` +
                      `*✧ Nombre del set:* ${orderSetName}\n` +
                      `*✧ Talla:* ${orderSizeText}\n` +
                      `*✧ Entrega:* ${deliveryType === 'studio' ? 'Recojo en Studio' : 'Envío a Domicilio'}\n` +
                      `*✧ Dirección:* ${addressStr}\n` +
                      `*✧ Referencia:* ${referenceStr}\n` +
                      `*✧ Cumpleaños:* ${clientBirthday}\n` +
                      `*✧ Instagram:* ${instagramStr}\n` +
                      `*✧ Adicionales:* ${additionalsStr}\n` +
                      `──────────────────────────\n` +
                      `*✧ Monto Total:* S/. ${finalTotal.toFixed(2)}\n` +
                      `*✧ Método de pago:* ${paymentMethod.toUpperCase()}\n` +
                      `*✧ N° de Operación:* ${paymentOperationNumber.trim()}\n` +
                      `──────────────────────────\n` +
                      `*¡Hola Gaby! Te adjunto mi comprobante de pago para confirmar mi pedido. ¡Muchas gracias! ♡*`;

                    window.open(`https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waMsg)}`, '_blank');
                    handleCloseAndReset();
                  }}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs sm:text-sm font-['Cinzel'] font-bold tracking-wider cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <span>CONTINUAR POR WHATSAPP</span>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: PERSONALIZA TU SET EN PROMO */
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Promo Design Card: Photo, Title, Description, and Exclusive Promo Price */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#DFD1BD] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4">
                {/* Thumbnail with AMPLIAR hover overlay (ges.png) */}
                <div
                  className="relative group cursor-pointer w-full sm:w-36 h-36 rounded-2xl overflow-hidden border border-[#DFD1BD] bg-[#FAF7F2] shrink-0"
                  onClick={() => setIsZoomOpen(true)}
                  title="Clic para ampliar imagen"
                >
                  <img
                    src={selectedPromoPressOnDesign.image}
                    alt={selectedPromoPressOnDesign.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Hover Overlay with AMPLIAR Pill Badge */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <div className="bg-[#FAF7F2]/95 backdrop-blur-xs border border-[#5D3704]/30 text-[#5D3704] text-[10px] font-['Cinzel'] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform group-hover:scale-105 transition-transform tracking-wider">
                      <ZoomIn className="w-3.5 h-3.5 text-[#5D3704]" />
                      <span>AMPLIAR</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DEC9] pb-2">
                    <div>
                      <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#9C7954] block">
                        {isDuoPressOn ? 'PROMO DUO PRESS ON · 2 SETS:' : 'SET EN PROMOCIÓN:'}
                      </span>
                      <h4 className="text-base sm:text-lg font-['Cinzel'] font-bold text-[#5D3704] uppercase">
                        {selectedPromoPressOnDesign.title}
                      </h4>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#9C7954] block">
                        {isDuoPressOn ? 'PRECIO ÚNICO DEL DUO:' : 'PRECIO PROMO:'}
                      </span>
                      <span className="text-lg sm:text-xl font-['Cinzel'] font-bold text-[#C89D3C]">
                        S/. {basePromoPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-['Marcellus'] text-[#5D3704]/90 leading-relaxed bg-[#FAF7F2] p-2.5 rounded-xl border border-[#DFD1BD]/70">
                    {selectedPromoPressOnDesign.description || 'Set artesanal exclusivo elaborado a mano con geles de alta gama.'}
                  </p>
                </div>
              </div>

              {/* REGLA ESTRICTA DE BEECOINS: AVISO CON MONEDA A LA IZQUIERDA ARRIBA DE "SELECCIONA TU TALLA:" */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-[#5D3704] text-xs font-['Marcellus'] flex items-center gap-2.5 shadow-2xs backdrop-blur-xs">
                <BeeCoinIcon className="w-5 h-5 shrink-0" />
                <span className="leading-snug">
                  Las tarifas de promoción no acumulan BeeCoins ni beneficios VIP.
                </span>
              </div>

              {isDuoPressOn ? (
                <div className="space-y-4">
                  {duoDesignOptions.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#FFF9EC] border border-[#D4AF37]/70 flex items-start gap-2.5 text-[#5D3704]">
                      <Info className="w-4 h-4 text-[#C89D3C] shrink-0 mt-0.5" />
                      <p className="text-xs font-['Marcellus'] leading-relaxed">
                        No hay diseños Press On habilitados para este Duo. Comunícate con el estudio para armar tu promoción.
                      </p>
                    </div>
                  ) : (
                    [0, 1].map((setIndex) => {
                      const typedIndex = setIndex as 0 | 1;
                      const selection = duoSelections[typedIndex];
                      const selectedDesign = duoSetDesigns[typedIndex];
                      const isReady =
                        !!selectedDesign &&
                        !!selection.size &&
                        isSizeAvailableForDesign(selectedDesign, selection.size as SizeType);

                      return (
                        <div
                          key={setIndex}
                          className="p-4 rounded-2xl bg-white border border-[#DFD1BD] shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-[#E8DEC9] pb-2">
                            <span className="text-xs sm:text-sm font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704]">
                              SET {setIndex + 1}
                            </span>
                            <span
                              className={`text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                isReady
                                  ? 'bg-[#F1F7EE] border-emerald-600/50 text-emerald-800'
                                  : 'bg-[#FAF7F2] border-[#D4AF37]/50 text-[#9C7954]'
                              }`}
                            >
                              {isReady && <CheckCircle2 className="w-3 h-3" />}
                              {isReady ? 'LISTO' : 'PENDIENTE'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                              ELIGE EL DISEÑO DEL SET {setIndex + 1}:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                              {duoDesignOptions.map((design) => {
                                const isSelected = selection.designId === design.id;
                                return (
                                  <button
                                    key={design.id}
                                    type="button"
                                    onClick={() => updateDuoDesign(typedIndex, design.id)}
                                    className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#F5EBE1] border-[#5D3704] ring-1 ring-[#5D3704] shadow-xs'
                                        : 'bg-[#FAF7F2] border-[#DFD1BD] hover:border-[#D4AF37]'
                                    }`}
                                  >
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#DFD1BD] bg-[#F0E9DF] shrink-0">
                                      <img
                                        src={design.image}
                                        alt={design.title}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] leading-snug line-clamp-2 uppercase">
                                        {design.title}
                                      </p>
                                      <p className="text-[9px] font-['Marcellus'] text-[#7A6655] mt-0.5">
                                        Diseño promocional
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                              ELIGE LA TALLA DEL SET {setIndex + 1}:
                            </label>
                            <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                              {(['XS', 'S', 'M', 'L'] as SizeType[]).map((size) => {
                                const isAvailable = isSizeAvailableForDesign(selectedDesign, size);
                                const isSelected = selection.size === size;
                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    disabled={!selectedDesign || !isAvailable}
                                    onClick={() => updateDuoSize(typedIndex, size)}
                                    className={`py-2.5 rounded-xl border text-xs font-['Cinzel'] font-bold transition-all flex flex-col items-center justify-center ${
                                      !selectedDesign || !isAvailable
                                        ? 'bg-gray-100/70 text-gray-400 border-gray-300 line-through opacity-60 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-[#F5EBE1] text-[#5D3704] border-[#5D3704] ring-1 ring-[#5D3704] shadow-xs cursor-pointer'
                                        : 'bg-[#FAF7F2] text-[#5D3704]/80 border-[#DFD1BD] hover:border-[#5D3704]/50 cursor-pointer'
                                    }`}
                                  >
                                    <span>{size}</span>
                                    {(!selectedDesign || !isAvailable) && (
                                      <span className="text-[8px] font-['Cinzel'] font-bold text-rose-700 block mt-0.5 no-underline uppercase tracking-wider">
                                        Agotado
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            {!selectedDesign && (
                              <p className="text-[10px] font-['Marcellus'] text-[#7A6655] italic">
                                Primero elige un diseño para ver sus tallas disponibles.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#D4AF37]/60 flex items-start gap-2.5 shadow-2xs">
                    <Gift className="w-4 h-4 text-[#C89D3C] shrink-0 mt-0.5" />
                    <p className="text-xs font-['Marcellus'] text-[#5D3704]/90 leading-relaxed">
                      <strong>Ambos sets incluyen {includedKitInfo.duoLabel} de regalo</strong> sin costo adicional.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/25 flex items-center justify-between gap-3 shadow-2xs">
                    <span className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704]">
                      TOTAL CERRADO DEL PACK DUO
                    </span>
                    <span className="text-lg font-['Cinzel'] font-bold text-[#C89D3C]">
                      S/. {basePromoPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* SELECCIONA TU TALLA */}
                  <div className="space-y-2 pt-1">
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
                    const isAvailable = selectedPromoPressOnDesign.sizeStock
                      ? (selectedPromoPressOnDesign.sizeStock[size] ?? true)
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

              {/* KIT DE APLICACIÓN INCLUIDO (dinámico, estética catálogo general) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                    KIT DE APLICACIÓN INCLUIDO:
                  </label>
                  <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704] bg-[#F5EBE1] px-2.5 py-0.5 rounded-full border border-[#D5C6B1]">
                    ¡PROMO APLICADA!
                  </span>
                </div>

                {/* Banner de beneficio */}
                <div className="p-3 sm:p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#D4AF37]/50 text-xs font-['Marcellus'] text-[#5D3704] flex items-center gap-2.5 shadow-2xs">
                  <Gift className="w-4 h-4 shrink-0 text-[#C89D3C]" />
                  <span>
                    <strong>¡Beneficio aplicado!</strong> Tu set incluye el{' '}
                    <strong>{includedKitInfo.label} (Valorizado en S/. {includedKitInfo.value.toFixed(2)}) ¡GRATIS!</strong> y un regalito sorpresa ♥
                  </span>
                </div>

                {/* Tarjeta del kit incluido */}
                <div className="p-4 rounded-2xl border border-[#C89D3C] bg-[#FAF7F2] flex items-start justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-['Cinzel'] font-bold text-[#5D3704] tracking-wide uppercase">
                        {includedKitInfo.label}
                      </span>
                      <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37] bg-[#FAF7F2] px-2 py-0.5 rounded-full shadow-2xs">
                        ¡INCLUIDO GRATIS!
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs font-['Marcellus'] text-[#5D3704]/80 mt-1.5 leading-snug">
                      {includedKitInfo.desc}
                    </p>
                  </div>
                  <div className="text-right shrink-0 whitespace-nowrap">
                    <span className="line-through text-[#5D3704]/40 mr-1.5 text-[11px] font-['Cinzel'] font-bold">
                      S/. {includedKitInfo.value.toFixed(2)}
                    </span>
                    <span className="text-[#C89D3C] font-bold text-xs sm:text-sm font-['Cinzel']">S/. 0.00</span>
                  </div>
                </div>
              </div>

              {/* SERVICIOS ADICIONALES & COMPLEMENTOS */}
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
                        {pressOnAdditionals.map((add: any) => {
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
                </>
              )}
            </div>
          ) : step === 2 ? (
            /* STEP 2: DATOS Y ENTREGA */
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Modalidad de entrega */}
              <div className="space-y-3">
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

              {/* Formulario de datos personales en dos columnas */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD1BD] space-y-4 shadow-xs">
                <div className="border-b border-[#EFE5D7] pb-2">
                  <h3 className="text-xs sm:text-sm font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704]">
                    TUS DATOS PERSONALES:
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Fila 1: Nombres (izq) y Apellidos (der) */}
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

                  {/* Fila 2: WhatsApp (izq) e Instagram (der) */}
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
                      {/* Fila 3: DEPTO / PROVINCIA * (izquierda) | DISTRITO * (derecha) */}
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
          ) : (
            /* STEP 3: PAGO Y CONFIRMACIÓN */
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/20 backdrop-blur-xs shadow-xs">
                <div className="text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed">
                  <strong className="font-['Cinzel'] font-bold block mb-0.5 text-sm">✦ Último paso para confirmar tu pedido ✦</strong>
                  Para reservar tu pedido, coordinamos el pago total a través de Yape, Plin o BCP. Una vez enviado tu número de operación, te enviará a nuestro WhatsApp automáticamente para coordinar los últimos detalles. ¡Estás a un solo paso!
                </div>
              </div>

              {/* Desglose de tu orden */}
              <div className="bg-white/95 p-5 rounded-2xl border border-[#5D3704]/20 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#EFE5D7] pb-2">
                  <span className="text-xs font-['Cinzel'] font-bold uppercase text-[#5D3704]">
                    DESGLOSE DE TU ORDEN PRESS-ON PROMO
                  </span>
                  <span className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704]/70">
                    Cliente: {firstName} {lastName}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-['Marcellus'] text-[#5D3704]">
                  {isDuoPressOn ? (
                    <>
                      <div className="flex justify-between">
                        <span>• Set 1: {duoSetDesigns[0]?.title || 'N/A'} (Talla {duoSelections[0].size || 'N/A'})</span>
                        <span className="font-bold font-mono">Incluido</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Set 2: {duoSetDesigns[1]?.title || 'N/A'} (Talla {duoSelections[1].size || 'N/A'})</span>
                        <span className="font-bold font-mono">Incluido</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>• {selectedPromoPressOnDesign.title} (Talla {selectedSize})</span>
                      <span className="font-bold font-mono">S/. {basePromoPrice.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>• {isDuoPressOn ? 'Kits de Aplicación' : 'Kit de Aplicación'} ({orderKitText})</span>
                    <span className="font-bold font-mono">
                      S/. 0.00 (Incluido en Promo)
                    </span>
                  </div>

                  {applyBirthdayDiscount && birthdayDiscount.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-800">
                      <span>• Beneficio de Ruleta ({birthdayDiscount.label})</span>
                      <span className="font-bold font-mono">- S/. {birthdayDiscount.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {selectedAdditionals.length > 0 && (
                    <div className="flex justify-between">
                      <span>• Servicios Adicionales ({selectedAdditionals.length})</span>
                      <span className="font-bold font-mono">+ S/. {additionalsTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-[#DFD1BD] font-bold text-sm text-[#5D3704] font-['Cinzel']">
                    <span>TOTAL ESTIMADO:</span>
                    <span className="text-[#C89D3C] text-base font-mono">S/. {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Selector de métodos de pago */}
              <div className="space-y-3">
                <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                  ELIGE TU MÉTODO DE PAGO:
                </label>

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

                {/* Payment Box details with Golden QR code beside (idéntico a Press On Nails) */}
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
                          <span className="font-mono font-bold text-[#5D3704]">S/. {finalTotal.toFixed(2)}</span>
                        </div>
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
                  label={`Ingresa aquí el número de operación de tu ${paymentMethod.toUpperCase()} o Transferencia *`}
                  subtitle="Nos ayuda a verificar tu abono al instante y asegurar tu pedido Press On Promo ✨"
                  placeholder="Ej: 849201 (6 a 9 dígitos numéricos)"
                />
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* COMPOSICIÓN COMPLETA Y FIJA DEL PIE DE PÁGINA (ESTILO ges.png) */}
        {/* ============================================================== */}
        {!orderConfirmed && (
          <div
            className="relative z-10 px-4 sm:px-6 py-3.5 border-t border-[#E8DEC9] flex items-center justify-between gap-3 shrink-0"
            style={{
              backgroundColor: '#FAF7F2',
              backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
              backgroundSize: '200px auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          >
            {/* Extremo Izquierdo: Botón CANCELAR (en paso 1) o ATRÁS (en pasos siguientes) */}
            <button
              type="button"
              onClick={step === 1 ? handleCloseAndReset : handlePrevStep}
              className="py-2.5 px-4 sm:px-5 rounded-xl border border-[#5D3704]/40 bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            >
              {step === 1 ? (
                <span>CANCELAR</span>
              ) : (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>ATRÁS</span>
                </>
              )}
            </button>

            {/* Bloque Central / Derecho */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Los 3 elementos flotantes (Ruleta, BeeCoins y Total Estimado) se muestran ÚNICAMENTE en el paso 1 (ps2.png) */}
              {step === 1 && (
                <>
                  {/* Icono dinámico de Premio (la Tortita / beneficio de Ruleta) */}
                  {!isDuoPressOn && currentUser?.roulettePrize && (
                    <BirthdayDiscountButton
                      isApplied={applyBirthdayDiscount}
                      onToggle={() => setApplyBirthdayDiscount(!applyBirthdayDiscount)}
                      discountAmount={birthdayDiscount.discountAmount}
                    />
                  )}

                  {/* Insignia de BeeCoins fijada en +0 para tarifas promocionales */}
                  <BeeCoinsFooterBadge totalEstimated={finalTotal} isPromo={true} />

                  {/* Cuadro de TOTAL ESTIMADO actualizado en tiempo real */}
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
                      S/. {finalTotal.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {/* Extremo Derecho: Botón CONTINUAR o CONFIRMAR PEDIDO */}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="py-2.5 px-4 sm:px-5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>CONTINUAR</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmAndWhatsApp}
                  className="py-3 px-5 sm:px-6 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <span>{isSubmitting ? 'PROCESANDO...' : 'CONFIRMAR PEDIDO Y VALIDAR OPERACIÓN'}</span>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SUB-MODAL : TABLA DE MEDIDAS EN CENTÍMETROS (TABLAS PARA MEDIR TU TALLA) */}
      {showSizeChart && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
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

      {/* LIGHTBOX: VISOR DE IMAGEN EN PANTALLA COMPLETA (ges.png) */}
      {isZoomOpen && selectedPromoPressOnDesign && (
        <div
          className="fixed inset-0 w-screen h-screen z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Contenedor de la foto en tamaño grande con esquinas redondeadas y botón X cerca de la esquina superior derecha de la foto */}
          <div
            className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cierre X flotando exactamente sobre la esquina superior derecha de la imagen */}
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white transition-all cursor-pointer shadow-xl border border-white/40 z-30 group"
              title="Cerrar visor"
              aria-label="Cerrar visor"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>

            <img
              src={selectedPromoPressOnDesign.image}
              alt={selectedPromoPressOnDesign.title}
              referrerPolicy="no-referrer"
              className="w-auto h-auto max-w-full max-h-[82vh] object-contain rounded-3xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
