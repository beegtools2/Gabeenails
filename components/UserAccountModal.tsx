import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Phone,
  Calendar,
  Instagram,
  Sparkles,
  Check,
  Gift,
  Award,
  Copy,
  AlertCircle,
  Camera,
  Trash2,
  Save,
  CreditCard,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
  Clock,
  ExternalLink,
  Star,
  ShoppingBag,
  Upload,
  MessageSquare,
  Video,
  FileImage,
  Play,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/storageUtils';
import { BeeCoinIcon } from './BeeCoinIcon';
import { GabeeBeeMark } from './GabeeBeeMark';
import { OperationCodeInput } from './OperationCodeInput';
import { validateOperationCode } from '../utils/validationUtils';
import confetti from 'canvas-confetti';
import { sendVerificationEmail, SendVerificationResult } from '../services/emailService';
import { sendPasswordResetEmail } from '../services/passwordResetEmailService';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoulette?: () => void;
}

interface RechargePackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  popular?: boolean;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  onOpenRoulette,
}) => {
  const {
    currentUser,
    registerUser,
    loginUser,
    logoutUser,
    settings,
    rechargeRequests,
    requestBeeCoinRecharge,
    accountModalTab,
    setAccountModalTab,
    updateUserProfile,
    deleteUserAccount,
    isRouletteModalOpen,
    appointments,
    storeOrders,
    inventoryList,
    reviewsList,
    addReviewItem,
    reviewedTargetIds,
    markTargetAsReviewed,
    accountModalMode,
    allUsers,
    setCurrentView,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (isOpen && !currentUser && accountModalMode) {
      setMode(accountModalMode);
    }
  }, [isOpen, currentUser, accountModalMode]);

  // Historial (Tienda, Citas & Press On) - filtros internos
  const [historyFilter, setHistoryFilter] = useState<'all' | 'processing' | 'sent' | 'delivered'>('all');
  const [historyOpenTienda, setHistoryOpenTienda] = useState(false);
  const [historyOpenCitas, setHistoryOpenCitas] = useState(false);
  const [historyOpenPressOn, setHistoryOpenPressOn] = useState(false);

  // Aviso emergente de bienvenida al crear cuenta o iniciar sesión
  const [welcomeToast, setWelcomeToast] = useState<{ id: number; message: string } | null>(null);
  const welcomeToastIdRef = useRef(0);

  const showWelcomeToast = (message: string) => {
    welcomeToastIdRef.current += 1;
    setWelcomeToast({ id: welcomeToastIdRef.current, message });
  };

  useEffect(() => {
    if (!welcomeToast) return;
    const timer = window.setTimeout(() => setWelcomeToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [welcomeToast]);

  const welcomeToastNode = welcomeToast ? (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[30000] flex justify-center px-3">
      <div
        key={welcomeToast.id}
        className="animate-fadeIn flex items-center gap-2.5 max-w-sm w-full px-4 py-3 rounded-2xl bg-[#FDFBF7]/95 backdrop-blur-sm border border-[#C5A059]/70 shadow-[0_10px_35px_rgba(92,55,4,0.18),0_0_18px_rgba(212,175,55,0.20)]"
      >
        <Sparkles className="w-4 h-4 shrink-0 text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.65)]" />
        <span className="font-['Marcellus'] text-[13px] sm:text-sm leading-snug text-[#5D3704]">
          {welcomeToast.message}
        </span>
      </div>
    </div>
  ) : null;

  // Leave Review Modal State
  const [showLeaveReviewModal, setShowLeaveReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    type: 'appointment' | 'order';
    id: string;
    title: string;
  } | null>(null);
  const [leaveReviewRating, setLeaveReviewRating] = useState<number>(5);
  const [leaveReviewComment, setLeaveReviewComment] = useState<string>('');
  const [leaveReviewMediaUrl, setLeaveReviewMediaUrl] = useState<string>('');
  const [leaveReviewMediaType, setLeaveReviewMediaType] = useState<'image'>('image');
  const [leaveReviewSuccessMsg, setLeaveReviewSuccessMsg] = useState<string | null>(null);
  const [leaveReviewErrorMsg, setLeaveReviewErrorMsg] = useState<string | null>(null);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInstagram, setRegInstagram] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');

  // Edit Profile Form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editDepartmentProvince, setEditDepartmentProvince] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Visual in-modal alerts for Authentication & Profile (replaces native alert)
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [regErrorMessage, setRegErrorMessage] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  // Detectar token de recuperación en la URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') || params.get('reset_token');
    if (t || window.location.pathname.includes('reset-password')) {
      if (t) setResetTokenInput(t);
      setShowResetPasswordModal(true);
    }
  }, []);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoginErrorMessage(null);
    setLoginSuccessMessage(null);
    setRegErrorMessage(null);
    setRegSuccessMessage(null);
    setForgotError(null);
    setProfileErrorMessage(null);
  }, [mode, isOpen]);

  // Accordion, Password visibility & Scroll refs
  const [isProfileAccordionOpen, setIsProfileAccordionOpen] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const profileAccordionRef = useRef<HTMLDivElement>(null);

  // User match helper
  const isUserMatch = (item: { userId?: string; clientEmail?: string; clientPhone?: string }) => {
    if (!currentUser) return false;
    if (currentUser.id && item.userId === currentUser.id) return true;
    if (currentUser.email && item.clientEmail?.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (currentUser.phone && item.clientPhone && item.clientPhone.includes(currentUser.phone)) return true;
    return false;
  };

  // Filtered Service Appointments (Excludes Press-On)
  const userServiceAppointments = useMemo(() => {
    if (!currentUser) return [];
    return appointments.filter((apt) => {
      if (!isUserMatch(apt)) return false;
      const status = String((apt as any).status || '').toLowerCase();
      if (status === 'cancelled' || status === 'rejected') return false;
      const isPressOn =
        (apt as any).serviceType === 'press_on' ||
        Boolean(apt.pressOnDetails) ||
        apt.promoDesignTitle?.toLowerCase().includes('press') ||
        apt.serviceName?.toLowerCase().includes('press');
      return !isPressOn;
    });
  }, [appointments, currentUser]);

  // Filtered Press On Orders (Includes Press-On Store Orders & Press-On Appointments; Excludes BeeCoins & Cuidado/Bienestar Store Items)
  const userPressOnOrders = useMemo(() => {
    if (!currentUser) return [];

    const filteredStoreOrders = storeOrders.filter((ord) => {
      if (!isUserMatch(ord)) return false;
      const status = String((ord as any).status || '').toLowerCase();
      if (status === 'cancelled' || status === 'rejected') return false;

      // Exclude BeeCoin / recharge orders
      const isRechargeOrBeeCoin =
        ord.items?.some((i) => {
          const name = (i.productName || (i as any).name || '').toLowerCase();
          return name.includes('beecoin') || name.includes('recarga') || name.includes('saldo');
        }) || (ord.operationNumber && ord.operationNumber.toLowerCase().includes('recharge'));
      if (isRechargeOrBeeCoin) return false;

      // Exclude Cuidado & Bienestar store items from inventoryList
      const isCuidadoBienestar = ord.items?.some((i) => {
        const name = (i.productName || (i as any).name || '').toLowerCase();
        return inventoryList.some((inv) => inv.id === i.productId || inv.name.toLowerCase() === name);
      });
      if (isCuidadoBienestar) return false;

      // Include if items have Press-On attributes or keywords
      return ord.items?.some((i) => {
        const name = (i.productName || (i as any).name || '').toLowerCase();
        return i.tipShape || i.size || name.includes('press') || name.includes('set') || name.includes('uñas');
      });
    });

    const pressOnAppointments = appointments.filter((apt) => {
      if (!isUserMatch(apt)) return false;
      const status = String((apt as any).status || '').toLowerCase();
      if (status === 'cancelled' || status === 'rejected') return false;
      return (
        (apt as any).serviceType === 'press_on' ||
        Boolean(apt.pressOnDetails) ||
        apt.promoDesignTitle?.toLowerCase().includes('press') ||
        apt.serviceName?.toLowerCase().includes('press')
      );
    });

    const mappedAppointments = pressOnAppointments.map((apt) => ({
      id: apt.id,
      code: apt.code || `PO-${apt.id.slice(-6)}`,
      createdAt: apt.createdAt || apt.date,
      clientName: apt.clientName,
      clientPhone: apt.clientPhone,
      clientEmail: apt.clientEmail,
      totalSoles: apt.totalPrice || apt.depositRequired || 0,
      status: apt.status,
      reviewSubmitted: apt.reviewSubmitted,
      paymentMethod: (apt.paymentMethod || 'yape') as any,
      items: [
        {
          productName: apt.pressOnDetails?.setName || apt.promoDesignTitle || apt.serviceName || 'Set Press On',
          size: apt.pressOnDetails?.size || 'M',
          tipShape: apt.pressOnDetails?.customShape || 'Almendra',
          price: apt.totalPrice || apt.depositRequired || 0,
          quantity: 1,
        },
      ],
      isFromAppointment: true,
    }));

    return [...filteredStoreOrders, ...mappedAppointments].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [storeOrders, appointments, currentUser, inventoryList]);

  // Compras de Tienda (Cuidado & Bienestar) para historial del perfil
  const userStoreShopOrders = useMemo(() => {
    if (!currentUser) return [];
    return storeOrders
      .filter((ord) => {
        if (!isUserMatch(ord)) return false;
        const status = String((ord as any).status || '').toLowerCase();
        if (status === 'cancelled' || status === 'rejected') return false;
        const isRechargeOrBeeCoin =
          ord.items?.some((i) => {
            const name = (i.productName || (i as any).name || '').toLowerCase();
            return name.includes('beecoin') || name.includes('recarga') || name.includes('saldo');
          }) || (ord.operationNumber && String(ord.operationNumber).toLowerCase().includes('recharge'));
        if (isRechargeOrBeeCoin) return false;
        // Priorizar compras de Cuidado & Bienestar (inventario)
        const isInventory = ord.items?.some((i) => {
          const name = (i.productName || (i as any).name || '').toLowerCase();
          return inventoryList.some((inv) => inv.id === i.productId || inv.name.toLowerCase() === name);
        });
        if (isInventory) return true;
        // Fallback: si no es un pedido Press On típico, mostrarlo en tienda
        const looksPressOn = ord.items?.some((i) => {
          const name = (i.productName || (i as any).name || '').toLowerCase();
          return Boolean(i.tipShape || i.size) || name.includes('press') || name.includes('set press');
        });
        return !looksPressOn;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [storeOrders, currentUser, inventoryList]);

  // Recargas BeeCoins para historial del perfil
  const userRechargeHistory = useMemo(() => {
    if (!currentUser) return [];
    return rechargeRequests
      .filter((r) => {
        if (!(r.userId === currentUser.id || (currentUser.phone && r.userPhone === currentUser.phone))) return false;
        const status = String((r as any).status || '').toLowerCase();
        return status !== 'cancelled' && status !== 'rejected';
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [rechargeRequests, currentUser]);

  const getStoreOrderBucket = (ord: any): 'processing' | 'sent' | 'delivered' | null => {
    const status = String(ord?.status || '').toLowerCase();
    if (['cancelled', 'rejected'].includes(status)) return null;
    const deliveryType = ord?.deliveryType === 'delivery' ? 'delivery' : 'pickup';
    const step = (() => {
      if (status === 'delivered' || status === 'completed') return 5;
      if (status === 'shipped' || status === 'enviado' || status === 'despachado' || status === 'listo') return 4;
      if (status === 'packing' || status === 'empaquetando' || status === 'preparando') return 3;
      if (status === 'confirmed' || status === 'approved') return 2;
      return 1;
    })();
    if (step === 5) return 'delivered';
    if (step === 4) return 'sent';
    return 'processing';
  };

  const getRechargeBucket = (req: any): 'processing' | 'sent' | 'delivered' | null => {
    const status = String(req?.status || '').toLowerCase();
    if (status === 'rejected' || status === 'cancelled') return null;
    if (status === 'approved' || status === 'completed' || status === 'confirmed') return 'delivered';
    return 'processing';
  };

  const getServiceAppointmentBucket = (apt: any): 'processing' | 'sent' | 'delivered' | null => {
    const status = String(apt?.status || '').toLowerCase();
    if (status === 'cancelled') return null;
    if (status === 'completed') return 'delivered';
    // confirmed, pending_deposit, etc. => en revisión / pago confirmado / en espera
    return 'processing';
  };

  const getPressOnHistoryBucket = (ord: any): 'processing' | 'sent' | 'delivered' | null => {
    if (ord?.isFromAppointment || ord?.pressOnDetails) {
      // Pedido Press On registrado como cita/appointment
      const status = String(ord?.status || '').toLowerCase();
      if (status === 'cancelled') return null;
      if (status === 'completed' || status === 'delivered') return 'delivered';
      return 'processing';
    }
    // Pedido Press On registrado como store order
    const status = String(ord?.status || '').toLowerCase();
    if (['cancelled', 'rejected'].includes(status)) return null;
    if (status === 'delivered' || status === 'completed') return 'delivered';
    if (status === 'shipped' || status === 'enviado' || status === 'despachado' || status === 'listo') return 'sent';
    // pending/confirmed/packing/preparing
    return 'processing';
  };

  const getStoreDeliveryType = (ord: any): 'delivery' | 'pickup' => {
    return ord?.deliveryType === 'delivery' ? 'delivery' : 'pickup';
  };

  const getStoreOrderStep = (status: string, deliveryType: 'delivery' | 'pickup') => {
    const s = (status || '').toLowerCase();
    if (s === 'cancelled' || s === 'rejected') return 0;
    if (s === 'delivered' || s === 'completed') return 5;
    if (s === 'shipped' || s === 'enviado' || s === 'despachado' || s === 'listo') return 4; // Enviado o Listo para recojo
    if (s === 'packing' || s === 'empaquetando' || s === 'preparando') return 3;
    if (s === 'confirmed' || s === 'approved') return 2;
    // legacy fallback
    if (deliveryType === 'delivery' && (s === 'out_for_delivery')) return 4;
    return 1; // pending / verification
  };

  const getRechargeStep = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'rejected' || s === 'cancelled') return 0;
    if (s === 'approved' || s === 'completed' || s === 'confirmed') return 2;
    return 1; // pending verification
  };

  const renderProgressTracker = (currentStep: number, labels: string[], cancelled = false) => {
    const steps = labels.map((_, i) => i + 1);
    const gridColsClass = labels.length === 2 ? 'grid-cols-2' : labels.length === 5 ? 'grid-cols-5' : 'grid-cols-4';
    return (
      <div className="pt-2">
        {cancelled ? (
          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-['Cinzel'] font-bold text-rose-800 text-center">
            Operación cancelada / rechazada
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-1`}>
            {steps.map((step) => {
              const done = currentStep >= step;
              const active = currentStep === step;
              return (
                <div key={step} className="relative flex flex-col items-center text-center min-w-0">
                  <div
                    className={`relative z-10 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                      done
                        ? 'bg-[#d4af37]/20 border-[#c89d3c] text-[#b6862c] shadow-[0_0_10px_rgba(212,175,55,0.28)]'
                        : 'bg-[#FAF7F2] border-[#DFD1BD] text-[#8C6B1C]'
                    } ${active ? 'ring-2 ring-[#D4AF37]/40' : ''}`}
                  >
                    {done ? '✓' : step}
                  </div>
                  <span
                    className={`mt-1.5 text-[9px] leading-tight font-['Cinzel'] font-bold ${
                      done ? 'text-[#5D3704]' : 'text-[#8C6B1C]/60'
                    }`}
                  >
                    {labels[step - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const deleteConfirmRef = useRef<HTMLDivElement>(null);

  const handleOpenDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setTimeout(() => {
      deleteConfirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  // BeeCoins Manual Recharge Modal State (Tienda Interna Sin WhatsApp)
  const [activeRechargePkg, setActiveRechargePkg] = useState<RechargePackage | null>(null);
  const [rechargeOpNumber, setRechargeOpNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bcp'>('yape');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [rechargeSuccessMsg, setRechargeSuccessMsg] = useState<string | null>(null);
  const [rechargeErrorMsg, setRechargeErrorMsg] = useState<string | null>(null);

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentSuccess, setForgotSentSuccess] = useState(false);

  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [emailVerificationSuccess, setEmailVerificationSuccess] = useState(false);
  const [isSendingEmailVerification, setIsSendingEmailVerification] = useState(false);
  const [emailSendResult, setEmailSendResult] = useState<SendVerificationResult | null>(null);
  const [showCheckInboxToast, setShowCheckInboxToast] = useState(false);

  const handleOpenEmailVerification = async () => {
    if (!currentUser) return;
    setShowEmailVerificationModal(true);
    setIsSendingEmailVerification(true);
    setEmailSendResult(null);

    const token = 'vtok_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);

    // Guardar token pendiente localmente y en el perfil
    localStorage.setItem(
      'gabee_pending_verification',
      JSON.stringify({
        token,
        userId: currentUser.id,
        email: currentUser.email,
        createdAt: Date.now(),
      })
    );

    const updated: UserProfile = {
      ...currentUser,
      verificationToken: token,
    };
    updateUserProfile(updated);

    // Despachar correo real a través de la integración de Resend
    const result = await sendVerificationEmail(currentUser.email, currentUser.firstName, token);
    setIsSendingEmailVerification(false);
    setEmailSendResult(result);
  };

  const handleGoToInbox = () => {
    window.open('https://mail.google.com', '_blank');
  };

  const handleCloseVerificationNotice = () => {
    setShowEmailVerificationModal(false);
    setShowCheckInboxToast(true);
    setTimeout(() => setShowCheckInboxToast(false), 6000);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanForgot = forgotEmail.trim().toLowerCase();
    if (!cleanForgot) {
      setForgotError('Por favor ingresa tu correo electrónico registrado.');
      return;
    }
    const deletedIds = safeGetLocalStorage<string[]>('gabee_deleted_user_ids_v1', []);
    const userFound = allUsers.find(
      (u) => !deletedIds.includes(u.id) && u.email && u.email.trim().toLowerCase() === cleanForgot
    );
    if (!userFound) {
      setForgotError('La cuenta no existe o ha sido eliminada. Por favor verifica tus datos o crea una cuenta nueva.');
      return;
    }
    // Generar token seguro con expiración (15 min)
    const token =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires = Date.now() + 15 * 60 * 1000;
    const resetTokens = safeGetLocalStorage<Record<string, { email: string; expires: number }>>('gabee_reset_tokens_v1', {});
    resetTokens[token] = { email: cleanForgot, expires };
    safeSetLocalStorage('gabee_reset_tokens_v1', JSON.stringify(resetTokens));

    setForgotError(null);
    setForgotSentSuccess(true);

    // Enviar correo real (o simulado si no hay API key)
    const result = await sendPasswordResetEmail(
      userFound.email || cleanForgot,
      userFound.firstName || 'Clienta',
      token
    );
    if (!result.success && !result.simulated) {
      setForgotSentSuccess(false);
      setForgotError(result.error || 'No se pudo enviar el correo de recuperación. Intenta nuevamente.');
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = resetTokenInput.trim();
    const newPass = resetNewPassword.trim();
    const confirmPass = resetConfirmPassword.trim();
    if (!token) {
      setResetError('Ingresa el token de recuperación.');
      return;
    }
    if (newPass.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      setResetError('Las contraseñas no coinciden.');
      return;
    }
    const resetTokens = safeGetLocalStorage<Record<string, { email: string; expires: number }>>('gabee_reset_tokens_v1', {});
    const entry = resetTokens[token];
    if (!entry) {
      setResetError('Token inválido o ya utilizado.');
      return;
    }
    if (Date.now() > entry.expires) {
      delete resetTokens[token];
      safeSetLocalStorage('gabee_reset_tokens_v1', JSON.stringify(resetTokens));
      setResetError('El token ha expirado. Solicita uno nuevo.');
      return;
    }
    const email = entry.email;
    const deletedIds = safeGetLocalStorage<string[]>('gabee_deleted_user_ids_v1', []);
    const userIndex = allUsers.findIndex(
      (u) => !deletedIds.includes(u.id) && u.email && u.email.trim().toLowerCase() === email
    );
    if (userIndex === -1) {
      setResetError('Usuario no encontrado.');
      return;
    }
    // Update password
    const updatedUser = { ...allUsers[userIndex], password: newPass };
    updateUserProfile(updatedUser);
    logoutUser();
    // invalidate token
    delete resetTokens[token];
    safeSetLocalStorage('gabee_reset_tokens_v1', JSON.stringify(resetTokens));

    setResetError(null);
    setResetSuccess(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile edit fields when user logs in, modal opens, or profile changes
  useEffect(() => {
    if (currentUser) {
      setEditFirstName(currentUser.firstName || '');
      setEditLastName(currentUser.lastName || '');
      setEditPhone(currentUser.phone || '');
      setEditEmail(currentUser.email || '');
      setEditInstagram(currentUser.instagram || '');
      setEditDepartmentProvince(currentUser.departmentProvince || currentUser.department || 'Lima');
      setEditDistrict(currentUser.district || '');
      setEditAddress(currentUser.address || '');
      setEditReference(currentUser.reference || '');
      setEditPassword(currentUser.password || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return welcomeToastNode;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMessage(null);
    setLoginSuccessMessage(null);

    const cleanEmailOrPhone = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanEmailOrPhone || !cleanPass) {
      setLoginErrorMessage('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    // Check if account exists in allUsers (excluding deleted accounts)
    const deletedIds = safeGetLocalStorage<string[]>('gabee_deleted_user_ids_v1', []);
    const userFound = allUsers.find(
      (u) =>
        !deletedIds.includes(u.id) &&
        ((u.email && u.email.trim().toLowerCase() === cleanEmailOrPhone) ||
         (u.phone && u.phone.trim().toLowerCase() === cleanEmailOrPhone))
    );

    if (!userFound) {
      setLoginErrorMessage('La cuenta no existe o ha sido eliminada. Por favor verifica tus datos o crea una cuenta nueva.');
      return;
    }

    if (userFound.password && userFound.password !== cleanPass) {
      setLoginErrorMessage('Contraseña incorrecta. Por favor verifica tus credenciales.');
      return;
    }

    const user = loginUser(cleanEmailOrPhone, cleanPass);
    if (user) {
      setLoginSuccessMessage(`¡Bienvenida de nuevo, ${user.firstName}! 💕`);
      const firstName = (user.firstName || '').trim();
      showWelcomeToast(`¡Bienvenida nuevamente, querida${firstName ? ` ${firstName}` : ''}!`);
      setLoginErrorMessage(null);
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginErrorMessage('La cuenta no existe o ha sido eliminada.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMessage(null);
    setRegSuccessMessage(null);

    if (
      !regFirstName.trim() ||
      !regLastName.trim() ||
      !regPhone.trim() ||
      !regEmail.trim() ||
      !regPassword.trim() ||
      !regBirthDate.trim()
    ) {
      setRegErrorMessage('Por favor completa todos los campos obligatorios: Nombre, Apellido, WhatsApp, Correo, Contraseña y Fecha de Cumpleaños.');
      return;
    }

    const passwordRegex = /^[a-zA-Z0-9_-]{8,}$/;
    if (!passwordRegex.test(regPassword.trim())) {
      setRegErrorMessage('La contraseña debe tener al menos 8 caracteres y solo puede contener letras, números, guiones y guiones bajos (_ -). Sin símbolos ni caracteres especiales.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim();
    const deletedIds = safeGetLocalStorage<string[]>('gabee_deleted_user_ids_v1', []);
    const existing = allUsers.find(
      (u) =>
        !deletedIds.includes(u.id) &&
        ((u.email && u.email.trim().toLowerCase() === cleanEmail) ||
         (u.phone && u.phone.trim() === cleanPhone))
    );
    if (existing) {
      setRegErrorMessage('Ya existe una cuenta activa con este correo o WhatsApp. Inicia sesión o recupera tu contraseña.');
      return;
    }

    registerUser({
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: regPassword.trim(),
      instagram: regInstagram.trim(),
      birthDate: regBirthDate.trim(),
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FAF7F2', '#C89D3C', '#D4AF37'],
      });
    } catch {
      // Ignore
    }

    setRegSuccessMessage('¡Cuenta creada con éxito! Bienvenida a Gabee Studio 💕');
    showWelcomeToast('¡Felicidades! Creaste tu cuenta en Gabee Studio. ¡Bienvenida!');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (currentUser) {
            updateUserProfile({ ...currentUser, avatarUrl: dataUrl });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    if (currentUser) {
      const updated = { ...currentUser };
      delete updated.avatarUrl;
      updateUserProfile(updated);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMessage(null);
    if (!currentUser) return;
    if (!editFirstName.trim() || !editLastName.trim() || !editPhone.trim() || !editEmail.trim()) {
      setProfileErrorMessage('Por favor completa todos los campos obligatorios del perfil (Nombre, Apellidos, WhatsApp y Correo).');
      return;
    }

    if (editPassword.trim()) {
      const passwordRegex = /^[a-zA-Z0-9_-]{8,}$/;
      if (!passwordRegex.test(editPassword.trim())) {
        setProfileErrorMessage('La contraseña debe tener al menos 8 caracteres y solo puede contener letras, números, guiones y guiones bajos (_ -). Sin símbolos ni caracteres especiales.');
        return;
      }
    }

    // Validación de unicidad de correo: bloquear si ya existe en otra cuenta
    const newEmailLower = editEmail.trim().toLowerCase();
    const deletedIds = safeGetLocalStorage<string[]>('gabee_deleted_user_ids_v1', []);
    const emailTakenByOther = allUsers.some(
      (u) => !deletedIds.includes(u.id) && u.email && u.email.trim().toLowerCase() === newEmailLower && u.id !== currentUser.id
    );
    if (emailTakenByOther) {
      setProfileErrorMessage('Este correo ya se encuentra registrado por otra clienta. Por favor, ingresa uno diferente.');
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim().toLowerCase(),
      instagram: editInstagram.trim(),
      departmentProvince: editDepartmentProvince.trim(),
      department: editDepartmentProvince.trim(),
      province: editDepartmentProvince.trim(),
      district: editDistrict.trim(),
      address: editAddress.trim(),
      reference: editReference.trim(),
      password: editPassword.trim() || currentUser.password,
    };

    // 1. Direct write to localStorage for active user
    safeSetLocalStorage('gabee_nail_studio_current_user_v1', JSON.stringify(updatedUser));

    // 2. Direct write to localStorage for all users array
    const savedAllUsersStr = localStorage.getItem('gabee_nail_studio_all_users_v1');
    if (savedAllUsersStr) {
      try {
        const all = JSON.parse(savedAllUsersStr);
        if (Array.isArray(all)) {
          const idx = all.findIndex((u: any) => u.id === updatedUser.id);
          if (idx !== -1) {
            all[idx] = updatedUser;
          } else {
            all.push(updatedUser);
          }
          safeSetLocalStorage('gabee_nail_studio_all_users_v1', JSON.stringify(all));
        }
      } catch {
        // ignore
      }
    }

    // 3. Update React context state & Firestore
    updateUserProfile(updatedUser);

    // 4. Trigger prominent visual confirmation toast
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2000);
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    const targetUserId = currentUser.id;
    deleteUserAccount(targetUserId);
    setShowDeleteConfirm(false);
    onClose();
    setCurrentView('home');
  };

  const handleLeaveReviewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLeaveReviewMediaType('image');

    const reader = new FileReader();
    reader.onloadend = () => {
      setLeaveReviewMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLeaveReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveReviewErrorMsg(null);
    if (!currentUser || !reviewTarget) return;
    if (!leaveReviewComment.trim()) {
      setLeaveReviewErrorMsg('Por favor escribe tu comentario antes de enviar.');
      return;
    }

    addReviewItem({
      clientName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      serviceName: reviewTarget.title,
      comment: leaveReviewComment.trim(),
      rating: leaveReviewRating,
      mediaUrl: leaveReviewMediaUrl.trim() || undefined,
      mediaType: 'image',
      active: false,
      status: 'pending',
      userId: currentUser.id,
      userEmail: currentUser.email,
      appointmentId: reviewTarget.type === 'appointment' ? reviewTarget.id : undefined,
      orderId: reviewTarget.type === 'order' ? reviewTarget.id : undefined,
    });

    markTargetAsReviewed(reviewTarget.id);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FAF7F2', '#C89D3C', '#D4AF37'],
      });
    } catch {
      // ignore
    }

    setLeaveReviewSuccessMsg('¡Gracias por tu reseña!');
    setTimeout(() => {
      setLeaveReviewSuccessMsg(null);
      setShowLeaveReviewModal(false);
      setLeaveReviewComment('');
      setLeaveReviewMediaUrl('');
      setReviewTarget(null);
    }, 4000);
  };

  // Recharging BeeCoins: 100% internal online store flow without WhatsApp
  const handleSubmitInternalRecharge = () => {
    if (!currentUser || !activeRechargePkg) return;
    const valResult = validateOperationCode(rechargeOpNumber);
    if (!valResult.isValid) {
      alert(valResult.errorMessage);
      return;
    }
    const cleanOp = valResult.cleanCode;

    // 3. Registrar recarga en estado pendiente
    requestBeeCoinRecharge({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      userPhone: currentUser.phone,
      userEmail: currentUser.email,
      packageId: activeRechargePkg.id,
      packageName: activeRechargePkg.name,
      coinsAmount: activeRechargePkg.coins,
      priceSoles: activeRechargePkg.price,
      operationNumber: cleanOp,
      paymentMethod,
    });

    // 4. Mensaje elegante de confirmación dentro de la página (sin derivar a WhatsApp)
    setRechargeSuccessMsg(
      '¡Solicitud recibida! Tu recarga o pedido se encuentra en revisión. La administradora validará tu comprobante y tus BeeCoins se acreditarán en breve.'
    );
    setActiveRechargePkg(null);
    setRechargeOpNumber('');
  };

  return (
    <>
      {/* Aviso emergente de bienvenida (no bloquea la navegación) */}
      {welcomeToastNode}

      <div
      className={`fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-4 transition-opacity duration-300 ${
        isRouletteModalOpen
          ? 'opacity-0 pointer-events-none'
          : 'bg-black/75 backdrop-blur-xs animate-fadeIn'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRouletteModalOpen) onClose();
      }}
    >
      <div
        className="bg-[#FAF7F2] border border-[#C5A059] rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-[#E8DEC9] flex items-center justify-between"
          style={{
            backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="flex items-center gap-2.5 bg-[#FDFBF7] px-3.5 py-1.5 rounded-2xl border border-[#C5A059] shadow-xs">
            <BeeCoinIcon className="w-5 h-5 shrink-0" />
            <div>
              <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                FIDELIDAD & BIENESTAR · GABEE STUDIO
              </span>
              <h3 className="text-sm font-['Cinzel'] font-bold text-[#5D3704]">
                {currentUser
                  ? accountModalTab === 'profile'
                    ? `Perfil de ${currentUser.firstName}`
                    : accountModalTab === 'history'
                    ? 'Tienda, Citas & Press On'
                    : 'Monedero & Recargas BeeCoins'
                  : mode === 'login'
                  ? 'Iniciar Sesión'
                  : 'Crear Cuenta Gratuita'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5D3704] bg-[#FDFBF7] border border-[#C5A059]/60 hover:bg-[#F2E5D5] rounded-full shadow-xs cursor-pointer transition-all"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher when logged in (3 Central Buttons) */}
        {currentUser && (
          <div className="px-3 sm:px-4 pt-2.5 pb-2 bg-[#F7F2EB] border-b border-[#DFD1BD] flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setAccountModalTab('profile')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-['Cinzel'] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                accountModalTab === 'profile'
                  ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-extrabold'
                  : 'bg-[#F5EBE1]/60 text-[#5D3704]/70 border border-transparent hover:bg-[#FDFBF7]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#C89D3C] shrink-0" />
              <span>Mi Perfil & Tarjeta VIP</span>
            </button>

            <button
              type="button"
              onClick={() => setAccountModalTab('history')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-['Cinzel'] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                accountModalTab === 'history'
                  ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-extrabold'
                  : 'bg-[#F5EBE1]/60 text-[#5D3704]/70 border border-transparent hover:bg-[#FDFBF7]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#C89D3C] shrink-0" />
              <span>TIENDA, CITAS & PRESS ON</span>
            </button>

            <button
              type="button"
              onClick={() => setAccountModalTab('wallet')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-['Cinzel'] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                accountModalTab === 'wallet'
                  ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40 font-extrabold'
                  : 'bg-[#F5EBE1]/60 text-[#5D3704]/70 border border-transparent hover:bg-[#FDFBF7]'
              }`}
            >
              <BeeCoinIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Monedero & Recargas</span>
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F5EFEB]/90 space-y-5">
          {currentUser ? (
            accountModalTab === 'profile' ? (
              /* ============================================================== */
              /* VISTA 1: PERFIL ESTILO RED SOCIAL (BOTÓN 1)                    */
              /* ============================================================== */
              <div className="space-y-5 animate-fadeIn">
                {/* Social Card: Avatar, Name & VIP Badge */}
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#C5A059]/60 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Avatar with fallback to Gabee Studio logo */}
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-full border-2 border-[#C5A059] overflow-hidden bg-[#FAF7F2] flex items-center justify-center shadow-sm">
                        {currentUser.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GabeeBeeMark size="md" className="scale-75" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] hover:bg-[#F2E5D5] shadow-xs cursor-pointer transition-all"
                        title="Subir o cambiar foto de perfil"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#8C6B1C]" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                        <h4 className="font-['Cinzel'] font-bold text-lg text-[#5D3704] flex items-center gap-1.5">
                          <span>{currentUser.firstName} {currentUser.lastName}</span>
                          <span className="text-rose-500 text-sm">♥</span>
                        </h4>
                        <span
                          className={`text-[10px] font-['Cinzel'] font-bold px-3 py-1 rounded-full uppercase border ${
                            (currentUser.visitsCount || 0) >= 4
                              ? 'bg-[#FDFBF7] text-[#8C6B1C] border-[#C5A059] ring-1 ring-[#C5A059]/40'
                              : 'bg-[#FDFBF7] text-[#5D3704] border-[#C5A059]/40'
                          }`}
                        >
                          {(currentUser.visitsCount || 0) >= 4 ? '👑 Clienta VIP' : 'Clienta Regular'}
                        </span>
                      </div>
                      <p className="text-xs font-['Marcellus'] text-[#5D3704]/75">
                        {currentUser.email} • {currentUser.phone}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="py-1 px-3 rounded-lg bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] hover:bg-[#F2E5D5] text-[10px] font-['Cinzel'] font-bold uppercase transition-all cursor-pointer"
                        >
                          Cambiar Foto
                        </button>
                        {currentUser.avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="py-1 px-2.5 rounded-lg bg-[#FDFBF7] border border-[#E57373] text-[#C62828] hover:bg-rose-50 text-[10px] font-['Cinzel'] font-bold uppercase transition-all cursor-pointer"
                          >
                            Quitar Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email Verification Status & Button */}
                  <div className="pt-3 border-t border-[#EFE5D7] space-y-2">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-['Marcellus']">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Mail className="w-4 h-4 text-[#C89D3C]" />
                        <span className="font-bold text-[#5D3704]">{currentUser.email}</span>
                        {currentUser.isEmailVerified ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-['Cinzel'] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Cuenta Verificada ✔
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-['Cinzel'] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Cuenta No Verificada
                          </span>
                        )}
                      </div>

                      {!currentUser.isEmailVerified && (
                        <button
                          type="button"
                          onClick={handleOpenEmailVerification}
                          disabled={isSendingEmailVerification}
                          className="py-1.5 px-3.5 rounded-xl bg-[#F5EBE1] hover:bg-[#ebdccf] border border-[#D4AF37] text-[#5D3704] text-[10.5px] font-['Cinzel'] font-bold uppercase transition-all duration-300 cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.35)] hover:shadow-[0_0_18px_rgba(212,175,55,0.55)] flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                        >
                          {isSendingEmailVerification ? (
                            <span>Despachando correo...</span>
                          ) : (
                            <span>Verificar Cuenta</span>
                          )}
                        </button>
                      )}
                    </div>

                    {!currentUser.isEmailVerified && (
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#FAF4EB] via-[#FFFDF9] to-[#FAF4EB] border border-[#D4AF37]/50 flex items-center gap-2 text-xs text-[#8C6B1C] shadow-2xs">
                        <Gift className="w-4 h-4 text-[#C89D3C] shrink-0" />
                        <span className="font-['Marcellus'] font-bold">
                          ¡Verifica tu cuenta y llévate 10 BeeCoins de regalo!
                        </span>
                      </div>
                    )}

                    {showCheckInboxToast && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2 text-xs text-amber-950 font-['Marcellus'] animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          Revisa tu bandeja de entrada en Gmail y haz clic en el enlace recibido para confirmar tu cuenta y acreditar tus 10 BeeCoins.
                        </span>
                      </div>
                    )}

                    {emailVerificationSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2 text-xs text-emerald-900 font-['Marcellus'] animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">
                          ¡Felicidades! Has ganado 10 BeeCoins por verificar tu cuenta
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editable Profile Data Accordion (Collapsed by Default) */}
                <div ref={profileAccordionRef} className="bg-[#FDFBF7] rounded-2xl border border-[#C5A059]/60 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isProfileAccordionOpen;
                      setIsProfileAccordionOpen(next);
                      if (next) {
                        setTimeout(() => {
                          profileAccordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                      }
                    }}
                    className="w-full p-4 flex items-center justify-between text-left bg-[#FDFBF7] hover:bg-[#F2E5D5] transition-all cursor-pointer"
                  >
                    <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] uppercase flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>Datos Personales Editables</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-['Cinzel'] font-bold text-[#8C6B1C]">
                        {isProfileAccordionOpen ? '▲ Ocultar' : '▼ Mostrar / Editar'}
                      </span>
                    </div>
                  </button>

                  {isProfileAccordionOpen && (
                    <form onSubmit={handleSaveProfile} className="p-5 border-t border-[#EFE5D7] space-y-3.5 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                            Apellido *
                          </label>
                          <input
                            type="text"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                            WhatsApp / Celular *
                          </label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                            INSTAGRAM
                          </label>
                          <input
                            type="text"
                            value={editInstagram}
                            onChange={(e) => setEditInstagram(e.target.value)}
                            placeholder="@tu_usuario"
                            className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                          />
                        </div>
                      </div>

                      {/* Campos Detallados de Dirección de Entrega */}
                      <div className="space-y-3 p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#C5A059]/40">
                        <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                          Datos de Dirección para Envíos a Domicilio:
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Fila 3: DEPTO / PROVINCIA * (izquierda) | DISTRITO * (derecha) */}
                          <div>
                            <label className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1">
                              DEPTO / PROVINCIA *
                            </label>
                            <input
                              type="text"
                              value={editDepartmentProvince}
                              onChange={(e) => setEditDepartmentProvince(e.target.value)}
                              placeholder="Ej: Lima / Lima"
                              className="w-full p-2.5 text-xs bg-white border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1">
                              DISTRITO *
                            </label>
                            <input
                              type="text"
                              value={editDistrict}
                              onChange={(e) => setEditDistrict(e.target.value)}
                              placeholder="Ej: Jesús María"
                              className="w-full p-2.5 text-xs bg-white border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                            />
                          </div>

                          {/* Fila 4: DIRECCIÓN EXACTA (calle, número, dpto) * */}
                          <div className="col-span-1 sm:col-span-2">
                            <label className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1">
                              DIRECCIÓN EXACTA (CALLE, NÚMERO, DPTO) *
                            </label>
                            <input
                              type="text"
                              value={editAddress}
                              onChange={(e) => setEditAddress(e.target.value)}
                              placeholder="Ej: Av. San Felipe 520 Dpto 402"
                              className="w-full p-2.5 text-xs bg-white border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                            />
                          </div>

                          {/* Fila 5: REFERENCIA DE ENTREGA (frente a, color de casa, etc.) */}
                          <div className="col-span-1 sm:col-span-2">
                            <label className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1">
                              REFERENCIA DE ENTREGA (FRENTE A, COLOR DE CASA, ETC.)
                            </label>
                            <input
                              type="text"
                              value={editReference}
                              onChange={(e) => setEditReference(e.target.value)}
                              placeholder="Ej: Frente al parque, casa de rejas negras"
                              className="w-full p-2.5 text-xs bg-white border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                        />
                        {!currentUser.isEmailVerified && (
                          <div className="mt-1.5 p-2 rounded-xl bg-[#FAF4EB] border border-[#D4AF37]/50 flex items-center gap-2 text-xs text-[#8C6B1C]">
                            <Gift className="w-3.5 h-3.5 text-[#C89D3C] shrink-0" />
                            <span className="font-['Marcellus'] font-bold">
                              ¡Verifica tu cuenta y llévate 10 BeeCoins de regalo!
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1 flex items-center justify-between">
                          <span>Contraseña de Seguridad</span>
                          <span className="text-[10px] text-[#8C6B1C] font-normal">Mín. 8 caracteres (letras, números, _ -)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showEditPassword ? 'text' : 'password'}
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-2.5 pr-10 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6B1C] hover:text-[#5D3704]"
                            title={showEditPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {editPassword.trim().length > 0 && editPassword.trim().length < 8 && (
                          <p className="text-[11px] font-['Marcellus'] text-rose-600 mt-1 animate-fadeIn">
                            La contraseña debe tener al menos 8 caracteres
                          </p>
                        )}
                      </div>

                      {/* Fecha de Cumpleaños Bloqueada con Candado */}
                      <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#C5A059]/50 space-y-1">
                        <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#C89D3C]" />
                          <span>Fecha de Cumpleaños (Bloqueada Antifraude)</span>
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#5D3704]">
                            {currentUser.birthDate || 'No registrada'}
                          </span>
                          <span className="text-[10px] font-['Cinzel'] text-[#8C6B1C] uppercase font-bold flex items-center gap-1">
                            🔒 Protegida
                          </span>
                        </div>
                        <p className="text-[10px] font-['Marcellus'] text-[#5D3704]/70 leading-tight">
                          * La fecha de cumpleaños no se puede modificar para garantizar la transparencia y seguridad de la Ruleta VIP de Regalos.
                        </p>
                      </div>

                      {/* Banner Visual Elegante de Error en Edición de Perfil */}
                      {profileErrorMessage && (
                        <div className="p-3.5 rounded-xl bg-[#fff5f5] border border-[#feb2b2] text-[#c53030] text-xs font-['Marcellus'] flex items-start gap-2.5 shadow-xs animate-fadeIn">
                          <AlertCircle className="w-4 h-4 text-[#c53030] shrink-0 mt-0.5" />
                          <span className="leading-snug">{profileErrorMessage}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className={`w-full py-2.5 px-4 rounded-xl border text-xs font-['Cinzel'] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
                          profileSaveSuccess
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/50'
                            : 'bg-[#FDFBF7] border-[#C5A059] text-[#5D3704] hover:bg-[#F2E5D5]'
                        }`}
                      >
                        {profileSaveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>¡CAMBIOS GUARDADOS CON ÉXITO!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 text-[#C89D3C]" />
                            <span>Guardar Cambios de Perfil</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Tarjeta de Fidelidad Digital (10 Sellos) */}
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#C5A059]/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EFE5D7] pb-2">
                    <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] uppercase flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#C89D3C]" />
                      <span>Tarjeta de Fidelidad ({currentUser.stampsCount || 0} / 10 Sellos)</span>
                    </span>
                    <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70">
                      {currentUser.visitsCount || 0} Visitas Regulares
                    </span>
                  </div>

                  {/* Integrated Promo Pause Warning Notice if active */}
                  {Boolean(currentUser.consecutivePromoMonths && currentUser.consecutivePromoMonths >= 1) && (
                    <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-xs font-['Marcellus'] text-amber-950 leading-relaxed space-y-1.5 shadow-2xs">
                      <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704] flex items-center gap-1.5 uppercase">
                        <ShieldAlert className="w-4 h-4 text-[#C89D3C]" />
                        <span>Aviso Importante: Beneficios VIP Pausados</span>
                      </span>
                      <p className="text-[11px] leading-relaxed text-[#5D3704]/90">
                        Estimada clienta queremos comunicarte que durante este mes, tus beneficios VIP y tus sellos se encuentran pausados temporalmente. Si en tu próximo agendamiento decides tomar una tarifa promocional nuevamente en lugar de tu servicio regular, el sistema actualizará tu estado y perderás la acumulación actual de sellos y privilegios VIP. Preferimos avisarte con anticipación para que tú misma evalúes lo que más te conviene y sigas disfrutando de tu estatus VIP al máximo.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-5 gap-2.5 pt-2">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const stampNum = idx + 1;
                      const isFilled = (currentUser.stampsCount || 0) >= stampNum;
                      const isReward5 = stampNum === 5;
                      const isReward10 = stampNum === 10;

                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 relative text-center transition-all ${
                            isFilled
                              ? 'bg-[#FAF7F2] border-[#C5A059] text-[#5D3704] shadow-xs ring-1 ring-[#C5A059]'
                              : 'bg-[#FAF7F2]/60 border-[#DFD1BD] text-[#5D3704]/50'
                          }`}
                        >
                          {isFilled ? (
                            <BeeCoinIcon className="w-6 h-6" />
                          ) : isReward5 ? (
                            <Gift className="w-5 h-5 text-[#C89D3C]" />
                          ) : isReward10 ? (
                            <Award className="w-5 h-5 text-[#C89D3C]" />
                          ) : (
                            <span className="text-xs font-['Cinzel'] font-bold">{stampNum}</span>
                          )}

                          <span className="text-[8px] font-['Cinzel'] font-bold mt-0.5 block truncate max-w-full">
                            {isReward5 ? 'Regalo' : isReward10 ? '50% OFF' : `Sello ${stampNum}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] font-['Marcellus'] text-[#5D3704]/75 leading-tight">
                    * <strong>Sello 5:</strong> Regalo especial de productos de belleza. <strong>Sello 10:</strong> 50% de descuento en cualquier servicio o Kit Press-On gratis de regalo (hasta S/. 100).
                  </p>

                  {/* Acceso a Ruleta VIP */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onOpenRoulette}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] hover:bg-[#F2E5D5] text-xs font-['Cinzel'] font-bold uppercase transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                    >
                      <Gift className="w-4 h-4 text-[#C89D3C]" />
                      <span>Girar Ruleta VIP de Regalos</span>
                    </button>
                  </div>
                </div>

                {/* Opciones de Cuenta: Cerrar Sesión & Eliminar Cuenta */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={logoutUser}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] hover:bg-[#F2E5D5] text-xs font-['Cinzel'] font-bold uppercase transition-all cursor-pointer shadow-xs"
                  >
                    Cerrar Sesión
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenDeleteConfirm}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FDFBF7] border border-[#E57373] text-[#C62828] hover:bg-rose-50 text-xs font-['Cinzel'] font-bold uppercase transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Mi Cuenta</span>
                  </button>
                </div>

                {/* Modal Confirmación Eliminar Cuenta con autoscroll ref */}
                {showDeleteConfirm && (
                  <div ref={deleteConfirmRef} className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-center space-y-3 animate-fadeIn">
                    <p className="text-xs font-['Marcellus'] text-rose-950 font-bold">
                      ¿Estás segura de eliminar tu cuenta? Perderás tus BeeCoins y sellos acumulados permanentemente.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#FDFBF7] border border-[#C5A059] text-[#5D3704] text-xs font-['Cinzel'] font-bold cursor-pointer hover:bg-[#F2E5D5]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-600 text-white text-xs font-['Cinzel'] font-bold cursor-pointer hover:bg-rose-700 shadow-xs"
                      >
                        Sí, Eliminar Definitivamente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : accountModalTab === 'history' ? (
              /* ============================================================== */
              /* VISTA 2: MIS CITAS & PEDIDOS (HISTORIAL Y RESEÑAS)             */
              /* ============================================================== */
              <div className="space-y-5 animate-fadeIn">
                {/* Filtros internos */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {([
                    { id: 'all', label: 'Todos' },
                    { id: 'processing', label: 'Procesando' },
                    { id: 'sent', label: 'Enviado' },
                    { id: 'delivered', label: 'Entregado' },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setHistoryFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-['Cinzel'] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        historyFilter === f.id
                          ? 'bg-[#F5EBE1] text-[#5D3704] border-[#C5A059] shadow-xs'
                          : 'bg-white/80 text-[#5D3704]/75 border-[#D4AF37]/40 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {(() => {
                  const filteredStoreShopOrders = userStoreShopOrders.filter((ord) => {
                    if (historyFilter === 'all') return true;
                    return getStoreOrderBucket(ord) === historyFilter;
                  });
                  const filteredRechargeHistory = userRechargeHistory.filter((req) => {
                    if (historyFilter === 'all') return true;
                    return getRechargeBucket(req) === historyFilter;
                  });
                  const filteredServiceAppointments = userServiceAppointments.filter((apt) => {
                    if (historyFilter === 'all') return true;
                    return getServiceAppointmentBucket(apt) === historyFilter;
                  });
                  const filteredPressOnOrders = userPressOnOrders.filter((ord) => {
                    if (historyFilter === 'all') return true;
                    return getPressOnHistoryBucket(ord) === historyFilter;
                  });
                  const tiendaRecargasCount = filteredStoreShopOrders.length + filteredRechargeHistory.length;
                  const showEmptyAll = historyFilter === 'all' && filteredStoreShopOrders.length === 0 && filteredRechargeHistory.length === 0 && filteredServiceAppointments.length === 0 && filteredPressOnOrders.length === 0;

                  return (
                    <>
                {/* TIENDA Y RECARGAS */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setHistoryOpenTienda((open) => !open)}
                    className="w-full flex items-center justify-between gap-2 font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#8C6B1C] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>Tienda y Recargas ({tiendaRecargasCount})</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#C89D3C] shrink-0 transition-transform duration-200 ${historyOpenTienda ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {historyOpenTienda && (
                  <>
                  {filteredStoreShopOrders.length === 0 && filteredRechargeHistory.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD1BD] text-center text-xs font-['Marcellus'] text-[#5D3704]/70">
                      {historyFilter === 'all'
                        ? 'Aún no tienes compras de tienda (Cuidado & Bienestar) ni recargas registradas.'
                        : 'No hay compras de tienda ni recargas en este filtro.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredStoreShopOrders.map((ord) => {
                        const deliveryType = getStoreDeliveryType(ord);
                        const step = getStoreOrderStep(ord.status as string, deliveryType);
                        const isCancelled = (ord.status as string) === 'cancelled';
                        const labels = deliveryType === 'delivery'
                          ? [
                              'Verificación del pedido',
                              'Pedido confirmado',
                              'Empaquetando tu pedido',
                              'Enviado',
                              'Entregado',
                            ]
                          : [
                              'Verificación del pedido',
                              'Pedido confirmado',
                              'Preparando tu pedido',
                              'Listo para recojo',
                              'Entregado',
                            ];
                        const statusLabel = isCancelled
                          ? 'Cancelado'
                          : step === 5
                          ? 'Entregado'
                          : step === 4
                          ? (deliveryType === 'delivery' ? 'Enviado' : 'Listo para recojo')
                          : step === 3
                          ? (deliveryType === 'delivery' ? 'Empaquetando' : 'Preparando')
                          : step === 2
                          ? 'Confirmado'
                          : 'En verificación';
                        return (
                          <div key={`store-${ord.id}`} className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C5A059]/60 shadow-2xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE5D7] pb-2">
                              <div>
                                <span className="text-[10px] font-['Cinzel'] font-bold uppercase text-[#8C6B1C] block">
                                  Compra Tienda · {ord.code || `#${ord.id.slice(-6)}`} · {new Date(ord.createdAt || Date.now()).toLocaleDateString('es-PE')}
                                </span>
                                <h6 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                                  Cuidado & Bienestar · S/. {(ord.totalSoles || ord.totalAmount || 0).toFixed(2)}
                                </h6>
                                <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/75">
                                  Modalidad: {deliveryType === 'delivery' ? 'Envío a domicilio' : 'Recojo en Studio'}
                                </span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-['Cinzel'] font-bold uppercase border ${
                                isCancelled
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : step === 5
                                  ? 'bg-[#FEF7D6] text-[#8C6B1C] border-[#D4AF37]'
                                  : step >= 2
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}>
                                {statusLabel}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs font-['Marcellus'] text-[#5D3704]">
                              <p className="font-semibold text-[#8C6B1C]">Productos:</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                                {ord.items?.map((item, idx) => (
                                  <li key={idx}>
                                    {item.productName || (item as any).name || 'Producto'} x{item.quantity || 1} - S/. {Number(item.price || 0).toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-[10.5px] text-[#5D3704]/75 pt-1">
                                Método de pago: {(ord.paymentMethod || '').toUpperCase()} {ord.operationNumber ? `· Op: ${ord.operationNumber}` : ''}
                              </p>
                            </div>

                            {renderProgressTracker(step, labels, isCancelled)}
                          </div>
                        );
                      })}

                      {filteredRechargeHistory.map((req) => {
                        const step = getRechargeStep(req.status as string);
                        const isRejected = (req.status as string) === 'rejected';
                        const labels = [
                          'Verificación de la recarga',
                          'Recarga confirmada',
                        ];
                        return (
                          <div key={`recharge-${req.id}`} className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C5A059]/60 shadow-2xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE5D7] pb-2">
                              <div>
                                <span className="text-[10px] font-['Cinzel'] font-bold uppercase text-[#8C6B1C] block">
                                  Recarga BeeCoins · {new Date(req.createdAt || Date.now()).toLocaleDateString('es-PE')}
                                </span>
                                <h6 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                                  {req.packageName || 'Recarga'} · +{req.coinsAmount} BeeCoins · S/. {Number(req.priceSoles || 0).toFixed(2)}
                                </h6>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-['Cinzel'] font-bold uppercase border ${
                                isRejected
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : step >= 2
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}>
                                {isRejected ? 'Rechazada' : step === 2 ? 'Recarga confirmada' : 'En verificación'}
                              </span>
                            </div>

                            <div className="text-xs font-['Marcellus'] text-[#5D3704] space-y-1">
                              <p className="text-[11px]">Método de pago: {(req.paymentMethod || '').toUpperCase()} · N° Op: <span className="font-mono">{req.operationNumber}</span></p>
                            </div>

                            {renderProgressTracker(step, labels, isRejected)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </>
                  )}
                </div>

                {/* CITAS AGENDADAS */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setHistoryOpenCitas((open) => !open)}
                    className="w-full flex items-center justify-between gap-2 font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#8C6B1C] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>Citas de Servicios ({filteredServiceAppointments.length})</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#C89D3C] shrink-0 transition-transform duration-200 ${historyOpenCitas ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {historyOpenCitas && (
                  <>
                  {filteredServiceAppointments.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD1BD] text-center text-xs font-['Marcellus'] text-[#5D3704]/70">
                      {historyFilter === 'all'
                        ? 'Aún no tienes citas registradas con esta cuenta.'
                        : 'No hay citas de servicios en este filtro.'}
                    </div>
                  ) : (
                    filteredServiceAppointments.map(apt => {
                      const isCompleted = (apt.status as string) === 'completed';
                      const hasReview = apt.reviewSubmitted || reviewedTargetIds.includes(apt.id) || reviewsList.some(r => r.appointmentId === apt.id);
                      return (
                        <div key={apt.id} className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C5A059]/60 shadow-2xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE5D7] pb-2">
                            <div>
                              <span className="text-[10px] font-['Cinzel'] font-bold uppercase text-[#8C6B1C] block">
                                Cita #{apt.code} · {apt.date} ({apt.timeSlot})
                              </span>
                              <h6 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                                {apt.promoDesignTitle || apt.serviceName || 'Servicio Gabee Studio'}
                              </h6>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-['Cinzel'] font-bold uppercase border ${
                              apt.status === 'confirmed' || (apt.status as string) === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : apt.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              {apt.status === 'confirmed' ? 'Adelanto Verificado / Confirmado' : (apt.status as string) === 'completed' ? 'Completado' : apt.status === 'cancelled' ? 'Cancelado' : 'En espera de revisión'}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-['Marcellus'] text-[#5D3704]">
                            <div>
                              <p>Modalidad: <span className="font-semibold">{apt.locationType === 'home' ? 'Servicio a Domicilio' : 'Atención en Estudio'}</span></p>
                              <p>Monto: <span className="font-semibold font-mono">S/. {apt.totalPrice || apt.depositRequired}</span></p>
                            </div>

                            {/* Dejar Reseña button if completed or confirmed */}
                            {isCompleted && (
                              <div className="pt-1 sm:pt-0">
                                {hasReview ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10.5px] font-['Cinzel'] font-bold shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>✓ Reseña Enviada</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewTarget({
                                        type: 'appointment',
                                        id: apt.id,
                                        title: apt.promoDesignTitle || apt.serviceName || 'Servicio de Manicura',
                                      });
                                      setShowLeaveReviewModal(true);
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#E8DCCB] hover:bg-[#DECDB7] border border-[#D4AF37] text-[#5D3704] text-[10.5px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-2xs flex items-center gap-1.5 hover:shadow-xs"
                                  >
                                    <Star className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFF066] drop-shadow-[0_0_5px_rgba(255,215,0,0.85)] shrink-0" />
                                    <span>Dejar Reseña</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  </>
                  )}
                </div>

                {/* PEDIDOS PRESS ON */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setHistoryOpenPressOn((open) => !open)}
                    className="w-full flex items-center justify-between gap-2 font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#8C6B1C] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#C89D3C]" />
                      <span>PEDIDOS PRESS ON ({filteredPressOnOrders.length})</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#C89D3C] shrink-0 transition-transform duration-200 ${historyOpenPressOn ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {historyOpenPressOn && (
                  <>
                  {filteredPressOnOrders.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#DFD1BD] text-center text-xs font-['Marcellus'] text-[#5D3704]/70">
                      {historyFilter === 'all'
                        ? 'Aún no tienes pedidos de uñas Press-On registrados.'
                        : 'No hay pedidos Press On en este filtro.'}
                    </div>
                  ) : (
                    filteredPressOnOrders.map(ord => {
                      const statusStr = String((ord as any).status || '').toLowerCase();
                      const isCompleted = statusStr === 'despachado' || statusStr === 'delivered' || statusStr === 'completed';
                      const hasReview = ord.reviewSubmitted || reviewedTargetIds.includes(ord.id) || reviewsList.some(r => r.orderId === ord.id);
                      return (
                        <div key={ord.id} className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C5A059]/60 shadow-2xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE5D7] pb-2">
                            <div>
                              <span className="text-[10px] font-['Cinzel'] font-bold uppercase text-[#8C6B1C] block">
                                {ord.code ? `Pedido #${ord.code}` : `Pedido #${ord.id.slice(-6)}`} · {new Date(ord.createdAt || Date.now()).toLocaleDateString('es-PE')}
                              </span>
                              <h6 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                                Total: S/. {(ord.totalSoles || (ord as any).totalAmount || 0).toFixed(2)}
                              </h6>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-['Cinzel'] font-bold uppercase border ${
                              (ord.status as string) === 'delivered' || (ord.status as string) === 'completed'
                                ? 'bg-[#FEF7D6] text-[#8C6B1C] border-[#D4AF37]'
                                : (ord.status as string) === 'despachado' || (ord.status as string) === 'approved' || ord.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              {(ord.status as string) === 'approved' ? 'Aprobado' : (ord.status as string) === 'despachado' ? 'Despachado' : (ord.status as string) === 'delivered' || (ord.status as string) === 'completed' ? 'Entregado' : ord.status === 'confirmed' ? 'Confirmado' : ord.status === 'cancelled' ? 'Cancelado' : 'Pendiente de Revisión'}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs font-['Marcellus'] text-[#5D3704]">
                            <p className="font-semibold text-[#8C6B1C]">Productos:</p>
                            <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                              {ord.items?.map((item, idx) => (
                                <li key={idx}>
                                  {item.productName || (item as any).name || 'Producto Press-On'} (Talla: {item.size || 'M'}, Tip: {item.tipShape || 'Almendra'}) x{item.quantity || 1} - S/. {item.price}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-[#EFE5D7]">
                            <span className="text-[10.5px] font-['Marcellus'] text-[#5D3704]/75">
                              Método de pago: {ord.paymentMethod?.toUpperCase()}
                            </span>

                            {isCompleted && (
                              <div>
                                {hasReview ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10.5px] font-['Cinzel'] font-bold shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>✓ Reseña Enviada</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const firstItem = ord.items?.[0] as any;
                                      const title = firstItem?.productName || firstItem?.name ? `Set Press-On: ${firstItem.productName || firstItem.name}` : 'Pedido Press-On';
                                      setReviewTarget({
                                        type: 'order',
                                        id: ord.id,
                                        title,
                                      });
                                      setShowLeaveReviewModal(true);
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#E8DCCB] hover:bg-[#DECDB7] border border-[#D4AF37] text-[#5D3704] text-[10.5px] font-['Cinzel'] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-2xs flex items-center gap-1.5 hover:shadow-xs"
                                  >
                                    <Star className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFF066] drop-shadow-[0_0_5px_rgba(255,215,0,0.85)] shrink-0" />
                                    <span>Dejar Reseña</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  </>
                  )}
                </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              /* ============================================================== */
              /* VISTA 2: MONEDERO & RECARGAS BEECOINS (BOTÓN 2)                 */
              /* ============================================================== */
              <div className="space-y-5 animate-fadeIn">
                {/* Monedero Principal */}
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#C5A059] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EFE5D7] pb-3">
                    <span className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#8C6B1C] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#C89D3C]" />
                      <span>Saldo Disponible en Monedero</span>
                    </span>
                    <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70">
                      Cuenta Activa
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#C5A059]/60 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <BeeCoinIcon className="w-11 h-11" />
                      <div>
                        <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C] uppercase block">
                          TUS BEECOINS ACUMULADOS:
                        </span>
                        <span className="text-2xl sm:text-3xl font-['Cinzel'] font-bold text-[#5D3704] font-mono">
                          {currentUser.beeCoins.toLocaleString()}{' '}
                          <span className="text-xs sm:text-sm text-[#C89D3C]">BeeCoins</span>
                        </span>
                      </div>
                    </div>
                  </div>


                </div>

                {/* Notificación de Recarga Enviada */}
                {rechargeSuccessMsg && (
                  <div className="p-4 bg-[#FDFBF7] border border-[#C5A059] rounded-2xl text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed animate-fadeIn flex items-start gap-2.5 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-['Cinzel'] font-bold block text-sm text-[#5D3704]">
                        ¡Solicitud recibida! Tu recarga o pedido se encuentra en revisión
                      </span>
                      <span className="text-[11px] text-[#5D3704]/90 block mt-1">
                        {rechargeSuccessMsg}
                      </span>
                    </div>
                  </div>
                )}

                {/* Solicitudes de Recarga Registradas en Revisión */}
                {rechargeRequests.filter((r) => (r.userId === currentUser?.id || (currentUser?.phone && r.userPhone === currentUser.phone)) && r.status === 'pending').length > 0 && (
                  <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl text-xs font-['Marcellus'] text-amber-950 space-y-2.5 shadow-xs animate-fadeIn">
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                      <div className="flex items-center gap-1.5 font-['Cinzel'] font-bold text-xs text-amber-900 uppercase">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>Recargas en Revisión ({rechargeRequests.filter((r) => (r.userId === currentUser?.id || (currentUser?.phone && r.userPhone === currentUser.phone)) && r.status === 'pending').length}):</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-200/90 text-amber-900 border border-amber-300 animate-pulse">
                        Pendiente de Validación
                      </span>
                    </div>

                    <div className="space-y-2">
                      {rechargeRequests.filter((r) => (r.userId === currentUser?.id || (currentUser?.phone && r.userPhone === currentUser.phone)) && r.status === 'pending').map((req) => (
                        <div key={req.id} className="p-3 bg-white/95 rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-[11px] shadow-2xs">
                          <div>
                            <span className="font-['Cinzel'] font-bold text-[#5D3704] block">{req.packageName} (+{req.coinsAmount} BeeCoins)</span>
                            <span className="font-mono text-[#7A614A] text-[10px]">N° Op: <strong>{req.operationNumber}</strong> · {new Date(req.createdAt).toLocaleDateString('es-PE')}</span>
                          </div>
                          <span className="font-mono font-bold text-[#5D3704] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            S/. {req.priceSoles}.00
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10.5px] text-amber-800 leading-relaxed italic">
                      Gaby verificará tu número de operación internamente en el panel. Tus BeeCoins se sumarán automáticamente a tu saldo apenas sea aprobada.
                    </p>
                  </div>
                )}

                {/* Tienda de Recargas de BeeCoins */}
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#C5A059]/60 shadow-xs space-y-3">
                  <div className="border-b border-[#EFE5D7] pb-2">
                    <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] uppercase block">
                      RECARGAR BEECOINS (TIENDA INTERNA):
                    </span>
                    <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/70 block mt-0.5">
                      Selecciona un paquete para ver los datos de pago y validar tu código de operación
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {[
                      { id: 'starter', coins: 50, price: 5, label: 'Starter Pack', popular: false },
                      { id: 'pro', coins: 120, price: 10, label: 'Pack Popular', popular: true },
                      { id: 'vip', coins: 250, price: 20, label: 'Pack VIP Booster', popular: false },
                    ].map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          setActiveRechargePkg({
                            id: pkg.id,
                            name: pkg.label,
                            coins: pkg.coins,
                            price: pkg.price,
                          });
                          setRechargeOpNumber('');
                        }}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative bg-[#FDFBF7] hover:bg-[#F2E5D5] ${
                          pkg.popular
                            ? 'border-[#C5A059] ring-2 ring-[#C5A059]/50 shadow-xs mt-2'
                            : 'border-[#C5A059]/50'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute top-[-11px] left-1/2 -translate-x-1/2 bg-[#FDFBF7] border border-[#C5A059] text-[#8C6B1C] text-[8px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full uppercase z-10">
                            MÁS POPULAR
                          </span>
                        )}
                        <BeeCoinIcon className="w-8 h-8 mx-auto mb-1" />
                        <span className="text-sm font-['Cinzel'] font-bold text-[#5D3704] block">
                          +{pkg.coins} BeeCoins
                        </span>
                        <span className="text-xs font-['Cinzel'] font-bold text-[#8C6B1C] block mt-0.5 font-mono">
                          S/. {pkg.price}.00 Soles
                        </span>
                        <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/75 block mt-2 pt-1.5 border-t border-[#DFD1BD]/60">
                          Recargar con Operación →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : mode === 'login' ? (
            /* ============================================================== */
            /* VIEW B: LOGIN FORM                                             */
            /* ============================================================== */
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
              <div className="p-5 bg-[#FDFBF7] rounded-2xl border border-[#C5A059]/60 space-y-3.5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-['Cinzel'] font-bold text-[#5D3704] border-b border-[#EFE5D7] pb-2">
                  <User className="w-4 h-4 text-[#C89D3C]" />
                  <span>Ingresa a tu Cuenta Gabee Studio</span>
                </div>

                <div>
                  <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginErrorMessage) setLoginErrorMessage(null);
                      if (loginSuccessMessage) setLoginSuccessMessage(null);
                    }}
                    placeholder="ejemplo@correo.com"
                    className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginErrorMessage) setLoginErrorMessage(null);
                        if (loginSuccessMessage) setLoginSuccessMessage(null);
                      }}
                      placeholder="••••••••"
                      className="w-full p-2.5 pr-10 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6B1C] hover:text-[#5D3704]"
                      title={showLoginPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setForgotSentSuccess(false);
                      setShowForgotPasswordModal(true);
                    }}
                    className="text-xs font-['Cinzel'] font-bold text-[#8C6B1C] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Contenedor Banner Visual Elegante de Error en Login */}
                {loginErrorMessage && (
                  <div className="p-3.5 rounded-xl bg-[#fff5f5] border border-[#feb2b2] text-[#c53030] text-xs font-['Marcellus'] flex items-start gap-2.5 shadow-xs animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-[#c53030] shrink-0 mt-0.5" />
                    <span className="leading-snug">{loginErrorMessage}</span>
                  </div>
                )}

                {/* Banner Visual de Éxito en Login */}
                {loginSuccessMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-['Marcellus'] flex items-start gap-2.5 shadow-xs animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{loginSuccessMessage}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs cursor-pointer transition-all"
              >
                Ingresar a Mi Cuenta
              </button>

              <div className="text-center pt-2">
                <div className="text-xs font-['Marcellus'] text-[#5D3704]">
                  ¿Aún no tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setLoginErrorMessage(null);
                      setLoginSuccessMessage(null);
                    }}
                    className="font-['Cinzel'] font-bold text-[#8C6B1C] underline hover:text-[#5D3704] cursor-pointer"
                  >
                    Crear cuenta gratuita aquí
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ============================================================== */
            /* VIEW C: REGISTER FORM                                          */
            /* ============================================================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
              <div className="p-5 bg-[#FDFBF7] rounded-2xl border border-[#C5A059]/60 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#EFE5D7] pb-2">
                  <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] flex items-center gap-1.5">
                    <BeeCoinIcon className="w-4 h-4" />
                    <span>Registro de Cuenta Gratuita</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={regFirstName}
                      onChange={(e) => {
                        setRegFirstName(e.target.value);
                        if (regErrorMessage) setRegErrorMessage(null);
                        if (regSuccessMessage) setRegSuccessMessage(null);
                      }}
                      placeholder="Ej: Gabriela"
                      className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={regLastName}
                      onChange={(e) => {
                        setRegLastName(e.target.value);
                        if (regErrorMessage) setRegErrorMessage(null);
                        if (regSuccessMessage) setRegSuccessMessage(null);
                      }}
                      placeholder="Ej: Kcomt"
                      className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                      WhatsApp / Celular *
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        if (regErrorMessage) setRegErrorMessage(null);
                        if (regSuccessMessage) setRegSuccessMessage(null);
                      }}
                      placeholder="Ej: 934403311"
                      className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (regErrorMessage) setRegErrorMessage(null);
                        if (regSuccessMessage) setRegSuccessMessage(null);
                      }}
                      placeholder="tu_correo@ejemplo.com"
                      className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                      Contraseña * (Mín. 8 caracteres)
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          if (regErrorMessage) setRegErrorMessage(null);
                          if (regSuccessMessage) setRegSuccessMessage(null);
                        }}
                        placeholder="••••••••"
                        className="w-full p-2.5 pr-10 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6B1C] hover:text-[#5D3704]"
                        title={showRegPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                      Usuario de Instagram (Opcional)
                    </label>
                    <input
                      type="text"
                      value={regInstagram}
                      onChange={(e) => {
                        setRegInstagram(e.target.value);
                        if (regErrorMessage) setRegErrorMessage(null);
                        if (regSuccessMessage) setRegSuccessMessage(null);
                      }}
                      placeholder="@tu_usuario"
                      className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                    Fecha de Cumpleaños * (Obligatoria para la Ruleta VIP de Regalos)
                  </label>
                  <input
                    type="date"
                    value={regBirthDate}
                    onChange={(e) => {
                      setRegBirthDate(e.target.value);
                      if (regErrorMessage) setRegErrorMessage(null);
                      if (regSuccessMessage) setRegSuccessMessage(null);
                    }}
                    className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                  />
                  <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/70 block mt-1">
                    * Quedará protegida de forma segura para activar tu giro de la Ruleta VIP cuando corresponda.
                  </span>
                </div>

                {/* Banner Visual Elegante de Error en Registro */}
                {regErrorMessage && (
                  <div className="p-3.5 rounded-xl bg-[#fff5f5] border border-[#feb2b2] text-[#c53030] text-xs font-['Marcellus'] flex items-start gap-2.5 shadow-xs animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-[#c53030] shrink-0 mt-0.5" />
                    <span className="leading-snug">{regErrorMessage}</span>
                  </div>
                )}

                {/* Banner Visual de Éxito en Registro */}
                {regSuccessMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-['Marcellus'] flex items-start gap-2.5 shadow-xs animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{regSuccessMessage}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>Crear Mi Cuenta Gratis</span>
                <BeeCoinIcon className="w-4 h-4 shrink-0" />
              </button>

              <div className="text-center pt-2">
                <div className="text-xs font-['Marcellus'] text-[#5D3704]">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setRegErrorMessage(null);
                      setRegSuccessMessage(null);
                    }}
                    className="font-['Cinzel'] font-bold text-[#8C6B1C] underline hover:text-[#5D3704] cursor-pointer"
                  >
                    Ingresar aquí
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL PASARELA MANUAL DE RECARGA DE BEECOINS                  */}
      {/* ============================================================== */}
      {activeRechargePkg && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border-2 border-[#C5A059] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div
              className="px-5 py-4 border-b border-[#E8DEC9] flex items-center justify-between"
              style={{
                backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
                backgroundSize: '200px auto',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
              }}
            >
              <div className="flex items-center gap-2.5 bg-[#FDFBF7] px-3.5 py-1.5 rounded-2xl border border-[#C5A059] shadow-xs">
                <BeeCoinIcon className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                    PASARELA OFICIAL DE PAGO
                  </span>
                  <h3 className="text-sm font-['Cinzel'] font-bold text-[#5D3704]">
                    Recarga de BeeCoins
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveRechargePkg(null)}
                className="p-2 text-[#5D3704] bg-[#FDFBF7] border border-[#C5A059]/60 hover:bg-[#F2E5D5] rounded-full shadow-xs cursor-pointer transition-all"
                title="Cerrar pasarela"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F5EFEB]/90 space-y-4">
              {/* Resumen del Paquete Seleccionado */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C5A059]/60 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BeeCoinIcon className="w-9 h-9 shrink-0" />
                  <div>
                    <span className="text-[10px] font-['Cinzel'] font-bold text-[#8C6B1C] uppercase block">
                      {activeRechargePkg.name}
                    </span>
                    <span className="text-lg font-['Cinzel'] font-bold text-[#5D3704]">
                      +{activeRechargePkg.coins} BeeCoins
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-['Cinzel'] text-[#5D3704]/70 block uppercase">
                    Total a pagar:
                  </span>
                  <span className="text-lg font-['Cinzel'] font-bold text-[#8C6B1C] font-mono">
                    S/. {activeRechargePkg.price}.00 Soles
                  </span>
                </div>
              </div>

              {/* PASO 1: Datos Oficiales de Pago */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C5A059]/60 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#EFE5D7] pb-2">
                  <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] uppercase flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#FDFBF7] border border-[#C5A059] text-[#8C6B1C] text-[10px] font-bold flex items-center justify-center font-mono">1</span>
                    <span>Cuentas Oficiales de Abono</span>
                  </span>
                </div>

                {/* Métodos Selector */}
                <div className="grid grid-cols-3 gap-2">
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

                {/* Datos según método */}
                {paymentMethod === 'bcp' ? (
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#C5A059]/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-['Cinzel'] font-bold text-[#5D3704]">Cuenta BCP:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#5D3704]">{settings.bcpAccount}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.bcpAccount, 'bcp_acc')}
                          className="p-1 rounded bg-[#FDFBF7] border border-[#C5A059]/50 hover:bg-[#F2E5D5] cursor-pointer"
                          title="Copiar cuenta"
                        >
                          {copiedField === 'bcp_acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5D3704]" />}
                        </button>
                      </div>
                    </div>
                    {settings.bcpCci && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#C5A059]/20">
                        <span className="font-['Cinzel'] font-bold text-[#5D3704]">CCI BCP:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-[#5D3704]">{settings.bcpCci}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(settings.bcpCci, 'bcp_cci')}
                            className="p-1 rounded bg-[#FDFBF7] border border-[#C5A059]/50 hover:bg-[#F2E5D5] cursor-pointer"
                            title="Copiar CCI"
                          >
                            {copiedField === 'bcp_cci' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5D3704]" />}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-[#C5A059]/20">
                      <span className="font-['Cinzel'] font-bold text-[#5D3704]">Titular:</span>
                      <span className="font-['Marcellus'] font-bold text-[#5D3704]">{settings.bcpName}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#C5A059]/40 space-y-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-['Cinzel'] font-bold text-[#5D3704]">
                          Número {paymentMethod.toUpperCase()}:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-base text-[#5D3704]">
                            {paymentMethod === 'yape' ? settings.yapeNumber : settings.plinNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(paymentMethod === 'yape' ? settings.yapeNumber : settings.plinNumber, 'phone')}
                            className="p-1.5 rounded bg-[#FDFBF7] border border-[#C5A059]/50 hover:bg-[#F2E5D5] cursor-pointer"
                            title="Copiar número"
                          >
                            {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5D3704]" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#C5A059]/20">
                        <span className="font-['Cinzel'] font-bold text-[#5D3704]">Titular:</span>
                        <span className="font-['Marcellus'] font-bold text-[#5D3704]">
                          {paymentMethod === 'yape' ? settings.yapeName : settings.plinName}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-2xl border border-[#D4AF37]/60 shadow-xs shrink-0 flex flex-col items-center justify-center">
                      <img
                        src={settings.yapeQrImage || '/assets/aistudio/AgendaPago1_0aeaaf79.JPG'}
                        alt="QR Oficial Yape / Plin"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/aistudio/AgendaPago1_0aeaaf79.JPG';
                        }}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-xl transition-all duration-300"
                      />
                      <span className="text-[9px] font-['Cinzel'] font-bold text-[#5D3704] mt-1.5 uppercase tracking-wider text-center block">
                        ESCANEAR PARA PAGAR
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* PASO 2: Campo vertical obligatorio de número de operación */}
              <OperationCodeInput
                value={rechargeOpNumber}
                onChange={setRechargeOpNumber}
                stepNumber={2}
                label="Ingresa aquí el número de operación de tu pago *"
                placeholder="Ej: 849201 (6 a 9 dígitos numéricos)"
                theme="gold"
              />

              {/* PASO 3: Botón Principal de Envío Interno (Sin Redirección a WhatsApp) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSubmitInternalRecharge}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#8C6B1C]" />
                  <span>Confirmar Recarga y Enviar a Validación</span>
                </button>
                <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/70 text-center block mt-2">
                  * La solicitud se procesará internamente en la plataforma y se acreditará al verificar tu operación.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border-2 border-[#C5A059] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-[#FDFBF7]/85 hover:bg-[#F2E5D5] text-[#5D3704] border border-[#C5A059] rounded-full shadow-xs cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <Key className="w-8 h-8 text-[#C89D3C] mx-auto" />
              <h3 className="font-['Cinzel'] font-bold text-base text-[#5D3704]">
                Recuperación Automática de Contraseña
              </h3>
              <p className="text-xs font-['Marcellus'] text-[#7A6655]">
                Ingresa tu correo electrónico registrado para recibir las instrucciones de restablecimiento.
              </p>
            </div>

            {forgotSentSuccess ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-['Marcellus'] text-emerald-950 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-bold">Enviado</p>
                  <p className="text-[11px]">
                    Revisa tu bandeja de entrada o spam, te hemos enviado la recuperación de cuenta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotSentSuccess(false);
                    setForgotEmail('');
                  }}
                  className="w-full py-3 px-6 rounded-xl bg-[#FDFBF7]/85 hover:bg-[#F2E5D5] border border-[#C5A059] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs hover:shadow-sm cursor-pointer transition-all"
                >
                  ENTENDIDO
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Correo Electrónico Registrado *
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    placeholder="ejemplo@correo.com"
                    className="w-full p-2.5 text-xs bg-white border border-[#C5A059] rounded-xl font-['Marcellus'] text-[#5D3704]"
                  />
                </div>

                {/* Banner Visual Elegante de Error en Recuperación */}
                {forgotError && (
                  <div className="p-3.5 rounded-xl bg-[#fff5f5] border border-[#feb2b2] text-[#c53030] text-xs font-['Marcellus'] flex items-start gap-2.5 shadow-xs animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-[#c53030] shrink-0 mt-0.5" />
                    <span className="leading-snug">{forgotError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-[#FDFBF7]/85 hover:bg-[#F2E5D5] border border-[#C5A059] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs hover:shadow-sm cursor-pointer transition-all"
                >
                  Restablecer Contraseña
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border-2 border-[#C5A059] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowResetPasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-[#FDFBF7]/85 hover:bg-[#F2E5D5] text-[#5D3704] border border-[#C5A059] rounded-full shadow-xs cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-1">
              <Key className="w-8 h-8 text-[#C89D3C] mx-auto" />
              <h3 className="font-['Cinzel'] font-bold text-base text-[#5D3704]">
                Restablecer Contraseña
              </h3>
              <p className="text-xs font-['Marcellus'] text-[#7A6655]">
                Ingresa y confirma tu nueva contraseña para recuperar tu cuenta.
              </p>
            </div>
            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-['Marcellus'] text-emerald-950 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold">¡Contraseña actualizada!</p>
                <p className="text-[11px]">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setResetSuccess(false);
                    setMode('login');
                  }}
                  className="w-full mt-3 py-3 px-6 rounded-xl bg-[#FDFBF7]/85 hover:bg-[#F2E5D5] border border-[#C5A059] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs hover:shadow-sm cursor-pointer transition-all"
                >
                  Ir a Iniciar Sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={resetNewPassword}
                    onChange={(e) => {
                      setResetNewPassword(e.target.value);
                      if (resetError) setResetError(null);
                    }}
                    className="w-full p-2.5 text-xs bg-white border border-[#C5A059] rounded-xl font-['Marcellus'] text-[#5D3704] caret-[#5D3704] outline-none transition-all focus:outline-none focus:border-[#5D3704]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={resetConfirmPassword}
                    onChange={(e) => {
                      setResetConfirmPassword(e.target.value);
                      if (resetError) setResetError(null);
                    }}
                    className="w-full p-2.5 text-xs bg-white border border-[#C5A059] rounded-xl font-['Marcellus'] text-[#5D3704] caret-[#5D3704] outline-none transition-all focus:outline-none focus:border-[#5D3704]"
                  />
                </div>
                {resetError && (
                  <div className="p-3.5 rounded-xl bg-[#fff5f5] border border-[#feb2b2] text-[#c53030] text-xs font-['Marcellus'] flex items-start gap-2.5 shadow-xs animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-[#c53030] shrink-0 mt-0.5" />
                    <span className="leading-snug">{resetError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-[#FDFBF7]/85 hover:bg-[#F2E5D5] border border-[#C5A059] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-xs hover:shadow-sm cursor-pointer transition-all"
                >
                  Guardar Nueva Contraseña
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Modal Limpio y Profesional de Verificación de Correo */}
      {showEmailVerificationModal && (
        <div className="fixed inset-0 z-[25000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border-2 border-[#D4AF37] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative text-center">
            <button
              type="button"
              onClick={() => setShowEmailVerificationModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#5D3704] hover:bg-[#EAE0D0] rounded-full cursor-pointer transition-all"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icono de Correo con halo dorado */}
            <div className="w-16 h-16 rounded-full bg-[#F5EBE1] border-2 border-[#D4AF37] flex items-center justify-center mx-auto text-[#8C6B1C] shadow-[0_0_18px_rgba(212,175,55,0.35)]">
              <Mail className="w-8 h-8 text-[#C89D3C]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                Verificación de Cuenta · Gabee Studio
              </span>
              <h3 className="text-base sm:text-lg font-['Cinzel'] font-bold text-[#5D3704] uppercase tracking-wide">
                ENLACE DE VERIFICACIÓN ENVIADO
              </h3>
            </div>

            {isSendingEmailVerification ? (
              <div className="p-4 rounded-2xl bg-[#FAF4EB] border border-[#D4AF37]/40 flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-['Marcellus'] text-[#5D3704]">
                  Despachando correo de verificación vía Resend a <strong>{currentUser?.email}</strong>...
                </p>
              </div>
            ) : emailSendResult?.error ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-['Marcellus'] space-y-2 text-left">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Estado del Despacho</span>
                </div>
                <p className="leading-relaxed">
                  {emailSendResult.error}
                </p>
                {emailSendResult.verifyUrl && (
                  <div className="pt-2 border-t border-amber-200">
                    <p className="text-[11px] text-amber-800 mb-1">
                      Para probar la verificación de inmediato, puedes abrir tu enlace directo:
                    </p>
                    <a
                      href={emailSendResult.verifyUrl}
                      className="font-bold underline text-[#5D3704] text-[11px] break-all block"
                    >
                      {emailSendResult.verifyUrl}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704]/90 leading-relaxed bg-[#FAF4EB] p-3.5 rounded-2xl border border-[#D4AF37]/40">
                  Te hemos enviado un correo de confirmación a <strong className="font-semibold text-[#5D3704] underline decoration-[#D4AF37]">{currentUser?.email}</strong>. Revisa tu bandeja de entrada en Gmail y haz clic en el botón del mensaje para activar tu cuenta y reclamar tus 10 BeeCoins de regalo.
                </p>
                {emailSendResult?.simulated && emailSendResult.verifyUrl && (
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] font-['Marcellus'] text-left">
                    <span className="font-bold block">💡 Modo Local / Prueba:</span>
                    <span>Puedes simular el clic de Gmail abriendo:{' '}</span>
                    <a href={emailSendResult.verifyUrl} className="font-bold underline text-[#5D3704]">
                      Enlace de confirmación generado
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-2.5 pt-2">
              {/* Botón Principal: Ir a mi bandeja de correo */}
              <button
                type="button"
                onClick={handleGoToInbox}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#FDFBF7] hover:bg-[#F2E5D5] border border-[#C5A059] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4 text-[#8C6B1C]" />
                <span>IR A MI BANDEJA DE CORREO</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8C6B1C] ml-0.5" />
              </button>

              {/* Botón Secundario Sutil: Ya verifiqué mi cuenta (solo cierra la ventana y recuerda revisar) */}
              <button
                type="button"
                onClick={handleCloseVerificationNotice}
                className="w-full py-3 px-5 rounded-2xl bg-[#F5EBE1] hover:bg-[#EAE0D0] border border-[#D4AF37]/60 text-[#5D3704] font-['Cinzel'] font-bold text-[11px] uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-xs hover:border-[#D4AF37] flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#8C6B1C]" />
                <span>Ya verifiqué mi cuenta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dejar Reseña & Testimonio */}
      {showLeaveReviewModal && (
        <div className="fixed inset-0 z-[25000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border-2 border-[#D4AF37] rounded-3xl max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header con Patrón de Abejitas Corporativo */}
            <div
              className="relative p-5 sm:p-6 border-b border-[#D4AF37] text-center rounded-t-3xl overflow-hidden shrink-0"
              style={{
                backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
                backgroundSize: '200px auto',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
              }}
            >
              <button
                type="button"
                onClick={() => setShowLeaveReviewModal(false)}
                className="absolute top-3.5 right-3.5 p-1.5 text-[#5D3704] bg-[#FAF7F2]/90 border border-[#D4AF37] hover:bg-[#EAE0D0] rounded-full cursor-pointer transition-all shadow-2xs z-10"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-[#FAF7F2]/95 backdrop-blur-xs p-4 rounded-2xl border border-[#D4AF37]/60 shadow-2xs space-y-1 relative">
                <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                  TU OPINIÓN ES MUY VALIOSA · GABEE STUDIO
                </span>
                <h3 className="text-base sm:text-lg font-['Cinzel'] font-bold text-[#5D3704] uppercase">
                  DEJAR RESEÑA & TESTIMONIO
                </h3>
                <p className="text-xs font-['Marcellus'] text-[#8C6B1C] font-semibold border-t border-[#D4AF37]/30 pt-1.5 mt-1">
                  {reviewTarget?.title}
                </p>
              </div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 sm:p-6 space-y-4">
              {leaveReviewSuccessMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-2 animate-fadeIn">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs sm:text-sm font-['Cinzel'] font-bold text-emerald-900 leading-relaxed">
                    {leaveReviewSuccessMsg}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeaveReviewSubmit} className="space-y-4">
                  {/* Rating: Estrellas Brillantes y Suaves */}
                  <div>
                    <label className="text-xs font-['Cinzel'] font-bold text-[#5D3704] block mb-2 text-center">
                      Calificación general:
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setLeaveReviewRating(star)}
                          className="p-1 cursor-pointer transition-transform duration-200 hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 transition-all duration-300 ${
                              star <= leaveReviewRating
                                ? 'fill-[#FFF066] text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.85)] scale-105'
                                : 'text-gray-300 hover:text-amber-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                      Tu Comentario o Testimonio *
                    </label>
                    <textarea
                      rows={3}
                      value={leaveReviewComment}
                      onChange={(e) => setLeaveReviewComment(e.target.value)}
                      placeholder="Cuéntanos tu experiencia con el servicio o producto recibido..."
                      className="w-full p-3 text-xs bg-[#FDFBF7] border border-[#C5A059]/50 rounded-xl font-['Marcellus'] text-[#5D3704] focus:outline-none focus:border-[#5D3704]"
                      required
                    />
                  </div>

                  {/* Media File (Photo/Video) */}
                  <div>
                    <label className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] block mb-1">
                      Adjuntar Foto o GIF Animado del Servicio (Opcional):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
                        onChange={handleLeaveReviewFileChange}
                        className="text-xs text-[#5D3704] file:py-1.5 file:px-3 file:rounded-xl file:border file:border-[#C5A059] file:bg-[#FDFBF7] file:text-[#5D3704] file:text-[10px] file:font-['Cinzel'] file:font-bold file:cursor-pointer hover:file:bg-[#F2E5D5]"
                      />
                    </div>

                    {leaveReviewMediaUrl && (
                      <div className="mt-2.5 relative aspect-video rounded-xl bg-black overflow-hidden max-h-40 border border-[#C5A059]">
                        <img src={leaveReviewMediaUrl} alt="Vista previa" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setLeaveReviewMediaUrl('')}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full text-xs cursor-pointer hover:bg-rose-700"
                          title="Quitar multimedia"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botón Principal Estilizado: ENVIAR RESEÑA */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#E8DCCB] hover:bg-[#DECDB7] border border-[#D4AF37] text-[#5D3704] text-xs sm:text-sm font-['Cinzel'] font-bold uppercase tracking-wider cursor-pointer shadow-2xs flex items-center justify-center transition-all duration-200 hover:shadow-xs"
                  >
                    <span>Enviar Reseña</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};
