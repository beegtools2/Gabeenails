import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { InventoryItem, InventoryVariant, StoreOrder } from '../types';
import { GabeeBeeMark } from './GabeeBeeMark';
import { BeeCoinIcon } from './BeeCoinIcon';
import { OperationCodeInput } from './OperationCodeInput';
import { validateOperationCode } from '../utils/validationUtils';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Search,
  Copy,
  QrCode,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  const {
    inventoryList,
    currentUser,
    openAccountModal,
    createStoreOrder,
    settings,
  } = useApp();

  const [storeStep, setStoreStep] = useState<1 | 2>(1);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bcp' | 'beecoins' | 'mixed'>('yape');
  const [mixedTransferMethod, setMixedTransferMethod] = useState<'yape' | 'bcp'>('yape');
  const [operationNumber, setOperationNumber] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<StoreOrder | null>(null);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [cartEmptyMsg, setCartEmptyMsg] = useState(false);
  const cartEmptyToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search state for catalog
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Variante seleccionada por producto (para mostrar botones y añadir al carrito)
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});

  // Panel flotante de resumen de compra (dentro de la tienda)
  const [showCartSummary, setShowCartSummary] = useState(false);

  // Copy state for bank info
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStoreStep(1);
      setSuccessMessage(null);
      setCreatedOrder(null);
      setShowAuthRequiredModal(false);
      setSearchTerm('');
      setIsSearchOpen(false);
      setCartEmptyMsg(false);
    } else {
      document.body.style.overflow = '';
      setShowAuthRequiredModal(false);
    }
    return () => {
      document.body.style.overflow = '';
      if (cartEmptyToastTimerRef.current) {
        clearTimeout(cartEmptyToastTimerRef.current);
        cartEmptyToastTimerRef.current = null;
      }
    };
  }, [isOpen]);

  const availableProducts = inventoryList.filter((item) => item.active !== false && (item.stock > 0 || (item.variants || []).some((v) => v.available)));

  // Filter products by search term
  const filteredProducts = availableProducts.filter((prod) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      prod.name.toLowerCase().includes(term) ||
      (prod.description && prod.description.toLowerCase().includes(term))
    );
  });

  // Tasa de conversión: 1 Sol = 1,000 BeeCoins
  const SOL_TO_BEECOINS = 1000;

  const cartKey = (productId: string, variantId?: string) => `${productId}__${variantId || ''}`;

  const handleAddToCart = (productId: string, variantId?: string) => {
    if (!currentUser) {
      setShowAuthRequiredModal(true);
      return;
    }

    const key = cartKey(productId, variantId);
    setCart((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (productId: string, variantId?: string) => {
    const key = cartKey(productId, variantId);
    setCart((prev) => {
      const copy = { ...prev };
      if (copy[key] > 1) {
        copy[key] -= 1;
      } else {
        delete copy[key];
      }
      return copy;
    });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cartItemsList = Object.entries(cart)
    .map(([key, qty]) => {
      const [productId, variantId] = key.split('__');
      const product = inventoryList.find((p) => p.id === productId);
      const variant = product?.variants?.find((v) => v.id === variantId) || undefined;
      return {
        product: product as InventoryItem | undefined,
        quantity: qty,
        variant: variant as InventoryVariant | undefined,
      };
    })
    .filter((item): item is { product: InventoryItem; quantity: number; variant: InventoryVariant | undefined } => Boolean(item.product));

  const totalSoles = cartItemsList.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Clasificación de ítems según canjeabilidad por BeeCoins
  const eligibleItems = cartItemsList.filter((item) => item.product.allowBeeCoins !== false);
  const nonEligibleItems = cartItemsList.filter((item) => item.product.allowBeeCoins === false);

  const hasEligibleItems = eligibleItems.length > 0;
  const hasNonEligibleItems = nonEligibleItems.length > 0;

  // Escenario 1: Carrito mixto (Al menos 1 canjeable y al menos 1 solo soles)
  const isMixedCart = hasEligibleItems && hasNonEligibleItems;

  // Escenario 2: 100% Canjeables (Todos son canjeables)
  const isAllEligible = hasEligibleItems && !hasNonEligibleItems;

  // Escenario 3: 100% Solo soles (Todos son solo soles)
  const isAllNonEligible = !hasEligibleItems && hasNonEligibleItems;

  // Totales en Soles desglosados
  const eligibleBeeCoinsSoles = eligibleItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const nonEligibleSoles = nonEligibleItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalBeeCoinsRequired = Math.round(eligibleBeeCoinsSoles * SOL_TO_BEECOINS);

  const userCoins = currentUser?.beeCoins || 0;
  const canPayFullyWithCoins = userCoins >= totalBeeCoinsRequired && isAllEligible && totalBeeCoinsRequired > 0;

  // Cálculos para pago mixto:
  // Se descuentan los BeeCoins equivalentes a los productos canjeables (hasta donde alcancen las monedas del usuario)
  const mixedCoinsToUse = Math.min(userCoins, totalBeeCoinsRequired);
  const mixedSolesDiscount = mixedCoinsToUse / SOL_TO_BEECOINS;
  const mixedRemainingSoles = Math.max(0, totalSoles - mixedSolesDiscount);

  // Ajuste automático del método seleccionado si cambia la composición del carrito
  useEffect(() => {
    if (!isOpen) return;
    if (isAllNonEligible && (paymentMethod === 'beecoins' || paymentMethod === 'mixed')) {
      setPaymentMethod('yape');
    } else if (isMixedCart && paymentMethod === 'beecoins') {
      setPaymentMethod('mixed');
    }
  }, [isOpen, isAllNonEligible, isMixedCart, paymentMethod]);



const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthRequiredModal(true);
      return;
    }

    if (cartItemsList.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    let coinsUsed = 0;
    let finalSolesToPay = totalSoles;

    if (paymentMethod === 'beecoins') {
      if (!isAllEligible) {
        alert(
          `Tu carrito contiene productos marcados como "(Solo soles)" por S/. ${nonEligibleSoles.toFixed(
            2
          )}. Por favor selecciona Pago Mixto o dinero real (Yape/BCP).`
        );
        return;
      }
      if (!canPayFullyWithCoins) {
        alert('No tienes suficientes BeeCoins para cubrir el total. Selecciona pago mixto o con dinero real.');
        return;
      }
      coinsUsed = totalBeeCoinsRequired;
      finalSolesToPay = 0;
    } else if (paymentMethod === 'mixed') {
      if (isAllNonEligible) {
        alert(
          'Tu carrito contiene únicamente productos marcados como "(Solo soles)" que no permiten canje de BeeCoins. Por favor realiza el pago con dinero real (Yape/Plin o BCP).'
        );
        return;
      }
      if (mixedCoinsToUse === 0 && userCoins === 0) {
        alert('No tienes BeeCoins disponibles para aplicar al pago mixto. Selecciona Yape / Plin o BCP.');
        return;
      }
      coinsUsed = mixedCoinsToUse;
      finalSolesToPay = mixedRemainingSoles;
      if (finalSolesToPay > 0) {
        const valResult = validateOperationCode(operationNumber);
        if (!valResult.isValid) {
          alert(valResult.errorMessage);
          return;
        }
      }
    } else {
      const valResult = validateOperationCode(operationNumber);
      if (!valResult.isValid) {
        alert(valResult.errorMessage);
        return;
      }
    }

    // 1. Crear el pedido mediante createStoreOrder (gestiona inventario, BeeCoins, Firestore y localStorage)
    const newOrder = createStoreOrder({
      userId: currentUser.id,
      clientName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Clienta Gabee',
      clientPhone: currentUser.phone || '',
      clientEmail: currentUser.email || '',
      items: cartItemsList.map((i) => {
        const variantName = i.variant?.name || (i.variant as any)?.label || (i.variant as any)?.title;
        return {
          productId: i.product.id,
          productName: variantName ? `${i.product.name} (${variantName})` : i.product.name,
          variantName: variantName || undefined,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.image,
        };
      }),
      totalSoles: finalSolesToPay,
      totalAmount: finalSolesToPay,
      beeCoinsUsed: coinsUsed,
      paymentMethod,
      operationNumber: operationNumber.trim() || undefined,
      deliveryType: 'pickup',
    });

    setCreatedOrder(newOrder);
    setCart({});
    setOperationNumber('');
  };

  const totalCartCount = cartItemsList.reduce((s, i) => s + i.quantity, 0);

  if (!isOpen) return null;

  return createPortal(
    <div
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overscroll-contain"
    >
      <div
        className="relative border border-[#5D3704]/20 rounded-3xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden"
        style={{
          backgroundColor: '#FAF7F2',
          backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
          backgroundSize: '240px auto',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-md pointer-events-none" />

        {/* Modal Header */}
        <div
          className="relative z-10 flex-shrink-0 p-4 sm:p-5 border-b border-[#5D3704]/20 flex items-center justify-between gap-3 rounded-t-3xl"
          style={{
            backgroundColor: '#FAF7F2',
            backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="flex items-center gap-3 bg-[#FAF7F2]/90 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-[#5D3704]/20">
            <GabeeBeeMark size="sm" />
            <div>
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]/90 block">
                Gabee Studio · Exclusivos
              </span>
              <h3 className="text-base sm:text-lg font-['Cinzel'] font-bold text-[#5D3704] leading-tight">
                {storeStep === 1 ? 'Tienda de Gabee Studio' : 'Checkout | Métodos de Pago'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {storeStep === 2 && (
              <button
                type="button"
                onClick={() => setStoreStep(1)}
                className="px-3 py-1.5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-[#5D3704] font-['Cinzel'] font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#5D3704]" />
                <span className="hidden sm:inline">Volver a la tienda</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#5D3704] bg-[#F5EBE1] hover:bg-[#ebdccf] rounded-full shadow-2xs transition-colors cursor-pointer shrink-0 border border-[#5D3704]/20"
            >
              <X className="w-5 h-5 text-[#5D3704]" />
            </button>
          </div>
        </div>

        {/* Modal Body with Isolated Native Scrollbar */}
        <div
          className="relative z-10 flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5 pb-28 [scrollbar-width:thin]"
        >
          {createdOrder ? (
            /* Vista de éxito en tono marfil y dorado elegante corporativo */
            <div className="py-8 px-5 sm:px-8 text-center space-y-4 bg-[#FAF7F2]/95 border-2 border-[#D4AF37]/70 rounded-3xl max-w-lg mx-auto shadow-[0_12px_40px_rgba(93,55,4,0.2)] animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-xs">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] bg-[#FAF4EB] px-3 py-1 rounded-full border border-[#D4AF37]/50 inline-block shadow-2xs">
                  ¡Pedido Confirmado con Éxito!
                </span>
                <h4 className="font-['Cinzel'] font-bold text-xl sm:text-2xl text-[#5D3704] pt-1">
                  ¡Gracias por tu compra, {currentUser?.firstName || 'hermosa'}!
                </h4>
              </div>

              {/* Código de Identificación del Pedido TG26_... */}
              <div className="p-3.5 bg-white/95 rounded-2xl border border-[#D4AF37]/60 inline-flex flex-col items-center gap-1 shadow-xs">
                <span className="text-[10.5px] font-['Cinzel'] uppercase tracking-wider text-[#5D3704]/85 font-bold">
                  Código de Identificación de tu Pedido:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-extrabold text-[#8C6B1C] tracking-wider">
                    {createdOrder.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdOrder.code, 'order_code')}
                    className="p-1 rounded bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] cursor-pointer transition-all"
                    title="Copiar código de pedido"
                  >
                    {copiedField === 'order_code' ? (
                      <Check className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#5D3704]" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704]/90 leading-relaxed max-w-md mx-auto">
                Nuestro equipo verificará tu comprobante y coordinará el despacho a tu dirección registrada.
              </p>

              {/* Resumen rápido de compra */}
              <div className="p-3.5 bg-white/90 rounded-2xl border border-[#D4AF37]/40 text-left text-xs font-['Marcellus'] text-[#5D3704] space-y-2">
                <div className="flex justify-between items-center text-[11px] font-['Cinzel'] font-bold border-b border-[#E8DEC9] pb-1.5 text-[#5D3704]">
                  <span>Productos Solicitados ({createdOrder.items.length}):</span>
                  <span className="text-[#8C6B1C]">Total: S/. {createdOrder.totalSoles.toFixed(2)}</span>
                </div>
                <ul className="text-[11px] text-[#5D3704]/90 pl-3 list-disc space-y-1">
                  {createdOrder.items.map((it, idx) => (
                    <li key={idx}>
                      {it.quantity}x {it.productName} — S/. {(it.price * it.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
                {createdOrder.operationNumber && (
                  <div className="pt-1.5 border-t border-[#E8DEC9]/70 text-[10.5px] font-mono text-[#8C6B1C]">
                    Nro. de Operación: {createdOrder.operationNumber}
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setCreatedOrder(null);
                    setStoreStep(1);
                  }}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FFFDF9] via-[#F5EBE1] to-[#FFFDF9] hover:from-[#F2E5D5] hover:to-[#EBDCCF] border-2 border-[#D4AF37] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-[0_0_15px_rgba(212,175,55,0.35)] cursor-pointer"
                >
                  Seguir en la Tienda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedOrder(null);
                    setStoreStep(1);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#F5EBE1] text-[#5D3704] border-2 border-[#D4AF37]/80 font-['Cinzel'] font-bold text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                >
                  Finalizar y Cerrar
                </button>
              </div>
            </div>
          ) : storeStep === 1 ? (
            /* PASO 1: VISTA DE CATÁLOGO / PRODUCTOS */
            <div className="space-y-4">
              {/* Aviso flotante: carrito vacío (se oculta solo) */}
              {cartEmptyMsg && (
                <div className="relative z-20 flex items-start gap-2.5 px-3.5 py-3 rounded-2xl border border-[#D4AF37] bg-[#FFF9EC]/95 backdrop-blur-md shadow-[0_8px_24px_rgba(93,55,4,0.18)] animate-fadeIn">
                  <div className="w-7 h-7 rounded-full bg-[#F5EBE1] border border-[#D4AF37]/60 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-3.5 h-3.5 text-[#C89D3C]" />
                  </div>
                  <p className="text-[11px] font-['Marcellus'] leading-snug text-[#5D3704] pt-0.5">
                    Tu carrito está vacío. Añade al menos un producto para continuar al pago.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#5D3704] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                  <span>Productos Disponibles en Stock</span>
                </h4>

                {/* Search Toggle & Search Input Bar */}
                <div className="flex items-center gap-2 ml-auto">
                  {isSearchOpen ? (
                    <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#D4AF37] rounded-xl px-2.5 py-1 shadow-2xs animate-fadeIn">
                      <Search className="w-3.5 h-3.5 text-[#5D3704]/70 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-36 sm:w-48 text-xs font-['Marcellus'] text-[#5D3704] bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setIsSearchOpen(false);
                        }}
                        className="p-1 hover:bg-[#F5EBE1] rounded-lg text-[#5D3704] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(true)}
                      className="p-2 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/30 hover:bg-[#ebdccf] text-[#5D3704] transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                      title="Buscar productos en el catálogo"
                    >
                      <Search className="w-4 h-4 text-[#5D3704]" />
                    </button>
                  )}

                  {totalCartCount > 0 && (
                    <span className="text-xs font-['Marcellus'] text-[#5D3704] font-semibold bg-[#F5EBE1] px-2.5 py-1 rounded-full border border-[#5D3704]/20 hidden sm:inline-block">
                      {totalCartCount} {totalCartCount === 1 ? 'producto' : 'productos'}
                    </span>
                  )}
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-10 px-4 text-center bg-white/80 rounded-2xl border border-[#E8DEC9] space-y-2">
                  <p className="text-xs text-[#7A6655] italic">
                    {searchTerm.trim()
                      ? `No se encontraron productos que coincidan con "${searchTerm}".`
                      : 'No hay productos disponibles en este momento.'}
                  </p>
                  {searchTerm.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-xs font-['Cinzel'] font-bold text-[#5D3704] underline cursor-pointer"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[calc(85vh-160px)] pr-1 custom-scrollbar pb-28">
                  {filteredProducts.map((prod) => {
                    const hasVariants = (prod.variants || []).length > 0;
                    const selectedVariantId = hasVariants ? selectedVariantByProduct[prod.id] : undefined;
                    const selectedVariant = prod.variants?.find((v) => v.id === selectedVariantId) || undefined;
                    const cartKeyForVariant = cartKey(prod.id, selectedVariantId);
                    const inCartCount = hasVariants ? (cart[cartKeyForVariant] || 0) : (cart[prod.id] || 0);
                    return (
                      <div
                        key={prod.id}
                        className="p-3.5 rounded-2xl bg-white/90 border border-[#E7DDCE] shadow-2xs backdrop-blur-xs hover:border-[#D4AF37]/60 transition-all"
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Imagen a la izquierda */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#F0E6D8] border border-[#DDD1BF] shrink-0">
                            <img
                              src={prod.image || '/assets/aistudio/PO_1_f5e6a392.JPG'}
                              alt={prod.name}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/assets/aistudio/PO_1_f5e6a392.JPG';
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Información a la derecha abarcando todo el ancho disponible */}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] leading-snug">
                              {prod.name}
                            </h5>
                            {prod.description && (
                              <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/75 mt-0.5 leading-relaxed">
                                {prod.description}
                              </p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2 sm:gap-3 text-xs font-['Cinzel'] font-bold text-[#8C6B1C] flex-wrap">
                              <span>S/. {prod.price.toFixed(2)}</span>
                              {prod.allowBeeCoins !== false ? (
                                <span className="text-[10px] text-[#A67C1E] bg-[#FAF4EB] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/60 flex items-center gap-1 font-mono shadow-2xs">
                                  <BeeCoinIcon className="w-3.5 h-3.5" />
                                  <span>{Math.round(prod.price * SOL_TO_BEECOINS).toLocaleString('es-PE')} BeeCoins</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300 italic font-normal">
                                  (Solo soles)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>


                        {/* Fila inferior compacta: variantes + botón Añadir a la misma altura */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Selector de variantes: exactamente debajo de la descripción, dentro de la tarjeta */}
                            {hasVariants && (
                              <div className="flex flex-wrap gap-1.5 w-full min-w-0 pr-1">
                                {(prod.variants || []).map((v) => {
                                  const isSelected = selectedVariantId === v.id;
                                  const variantColor = v.color || '#D4AF37';
                                  if (!v.available) {
                                    return (
                                      <span
                                        key={v.id}
                                        className="px-3 py-1.5 rounded-full text-[11px] font-['Cinzel'] font-bold text-gray-400 bg-gray-50/80 border border-gray-200 opacity-70 cursor-not-allowed select-none whitespace-nowrap flex flex-col items-center leading-tight"
                                        title="Agotado"
                                      >
                                        <span className="line-through">{v.name}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 mt-0.5">Agotado</span>
                                      </span>
                                    );
                                  }
                                  return (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => setSelectedVariantByProduct((prev) => ({ ...prev, [prod.id]: v.id }))}
                                      className={`px-3 py-1.5 rounded-full text-[11px] font-['Cinzel'] font-bold backdrop-blur-md transition-all cursor-pointer border whitespace-nowrap ${
                                        isSelected
                                          ? 'text-white shadow-[0_0_12px_rgba(212,175,55,0.35)] scale-[1.02]'
                                          : 'text-[#5D3704]/85 hover:scale-[1.02]'
                                      }`}
                                      style={{
                                        borderColor: isSelected ? variantColor : `${variantColor}66`,
                                        backgroundColor: isSelected ? variantColor : `${variantColor}22`,
                                      }}
                                    >
                                      {v.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0">
                            {inCartCount > 0 ? (
                              <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#D4AF37]">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(prod.id, selectedVariantId)}
                                  className="w-7 h-7 rounded-lg bg-white border border-[#DDD1BF] text-[#5D3704] flex items-center justify-center hover:bg-[#F2ECE2] cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono font-bold text-xs w-5 text-center text-[#5D3704]">{inCartCount}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(prod.id, selectedVariantId)}
                                  className="w-7 h-7 rounded-lg bg-white border border-[#DDD1BF] text-[#5D3704] flex items-center justify-center hover:bg-[#F2ECE2] cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (hasVariants && !selectedVariantId) {
                                    const firstAvailable = prod.variants?.find((v) => v.available);
                                    if (firstAvailable) {
                                      setSelectedVariantByProduct((prev) => ({ ...prev, [prod.id]: firstAvailable.id }));
                                      handleAddToCart(prod.id, firstAvailable.id);
                                    }
                                    return;
                                  }
                                  handleAddToCart(prod.id, selectedVariantId);
                                }}
                                disabled={hasVariants && !selectedVariant?.available && !selectedVariantId}
                                className={`py-2 px-3.5 rounded-xl border border-[#D4AF37] bg-[#FAF7F2] hover:bg-[#F5EBE1] text-[#5D3704] transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                                  hasVariants && !selectedVariantId ? 'opacity-70' : ''
                                }`}
                                title="Añadir al carrito"
                              >
                                <ShoppingCart className="w-4 h-4 text-[#5D3704]" />
                                <span className="text-xs font-['Cinzel'] font-bold">Añadir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* PASO 2: CHECKOUT & MÉTODOS DE PAGO */
            <div className="space-y-4">
              {/* Resumen de ítems agregados */}
              <div className="p-4 rounded-2xl bg-white/95 border border-[#E7DDCE] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-2.5">
                  <h4 className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-[#5D3704] flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
                    <span>Resumen de tu Pedido ({totalCartCount} ítems)</span>
                  </h4>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {cartItemsList.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between gap-2 text-xs bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DEC9]">
                      <div className="min-w-0 flex-1">
                        <p className="font-['Cinzel'] font-bold text-[#5D3704] truncate">{product.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-[#7A6655] font-mono mt-0.5">
                          <span>S/. {product.price.toFixed(2)} c/u</span>
                          {product.allowBeeCoins !== false ? (
                            <span className="text-[#A67C1E]">
                              ({Math.round(product.price * SOL_TO_BEECOINS).toLocaleString('es-PE')} coins)
                            </span>
                          ) : (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-sans font-semibold">
                              (Solo soles)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(product.id)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#DDD1BF] text-[#5D3704] flex items-center justify-center hover:bg-[#F2ECE2] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-xs w-5 text-center text-[#5D3704]">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product.id)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#DDD1BF] text-[#5D3704] flex items-center justify-center hover:bg-[#F2ECE2] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E8DEC9] flex justify-between items-center text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                  <span>Total Acumulado:</span>
                  <span className="text-sm text-[#8C6B1C]">
                    S/. {totalSoles.toFixed(2)}
                    {totalBeeCoinsRequired > 0 && ` (${totalBeeCoinsRequired.toLocaleString('es-PE')} BeeCoins)`}
                  </span>
                </div>
              </div>

              {/* Alerta 1: Pago Mixto Disponible (si el carrito contiene AL MENOS UN producto canjeable y AL MENOS UN '(Solo soles)') */}
              {isMixedCart && (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-['Cinzel'] font-bold text-[11px] text-amber-900 uppercase">
                      Pago Mixto disponible
                    </h5>
                    <p className="font-['Marcellus'] text-[11px] mt-0.5 leading-relaxed">
                      Puedes usar tus BeeCoins para el producto canjeable y pagar el resto en Soles.
                    </p>
                  </div>
                </div>
              )}

              {/* Alerta 2: Restricción por Productos no canjeables (si TODOS los ítems son '(Solo soles)') */}
              {isAllNonEligible && (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-['Cinzel'] font-bold text-[11px] text-amber-900 uppercase">
                      Restricción por Productos no canjeables
                    </h5>
                    <p className="font-['Marcellus'] text-[11px] mt-0.5 leading-relaxed">
                      Tu carrito incluye productos marcados como <strong>'(Solo soles)'</strong>. Los métodos de pago con BeeCoins o Mixto han sido desactivados para este pedido. Por favor selecciona <strong>Yape / Plin</strong> o <strong>Transferencia BCP</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Formulario de Checkout y Selección de Pago */}
              <form onSubmit={handleCheckout} className="p-4 rounded-2xl bg-white/95 border border-[#E7DDCE] shadow-sm space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
                    Selecciona Método de Pago:
                  </label>

                  {/* Grid de botones de opciones de pago con insignias / logos representativos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Yape / Plin */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('yape')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-['Cinzel'] font-bold cursor-pointer transition-all flex items-center justify-center gap-3 ${
                        paymentMethod === 'yape'
                          ? 'bg-[#F5EBE1] text-[#5D3704] border-2 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                          : 'bg-[#FAF7F2] text-[#5D3704] border border-[#D4AF37]/60 hover:bg-[#F5EBE1]'
                      }`}
                    >
                      <img src="/assets/logos/yape.svg" alt="Yape" className="h-8 w-auto object-contain shrink-0" />
                      <img src="/assets/logos/plin.svg" alt="Plin" className="h-8 w-auto object-contain shrink-0" style={{ clipPath: 'inset(0 0 30% 0)' }} />
                    </button>

                    {/* BCP */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bcp')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-['Cinzel'] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        paymentMethod === 'bcp'
                          ? 'bg-[#F5EBE1] text-[#5D3704] border-2 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                          : 'bg-[#FAF7F2] text-[#5D3704] border border-[#D4AF37]/60 hover:bg-[#F5EBE1]'
                      }`}
                    >
                      <img src="/assets/logos/bcp.svg" alt="BCP" className="h-4 w-auto object-contain shrink-0" />
                    </button>

                    {/* BeeCoins */}
                    <button
                      type="button"
                      disabled={!isAllEligible || totalBeeCoinsRequired === 0}
                      onClick={() => setPaymentMethod('beecoins')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-['Cinzel'] font-bold flex items-center justify-center gap-1.5 transition-all ${
                        !isAllEligible || totalBeeCoinsRequired === 0
                          ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'
                          : paymentMethod === 'beecoins'
                          ? 'bg-[#F5EBE1] text-[#5D3704] border-2 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.35)] cursor-pointer'
                          : 'bg-[#FAF7F2] text-[#5D3704] border border-[#D4AF37]/60 hover:bg-[#F5EBE1] cursor-pointer'
                      }`}
                      title={
                        !isAllEligible
                          ? isMixedCart
                            ? 'Desactivado porque hay productos (Solo soles). Usa Pago Mixto.'
                            : 'Desactivado porque todos los productos son (Solo soles)'
                          : undefined
                      }
                    >
                      <BeeCoinIcon className="w-4 h-4 shrink-0" />
                      <span>BeeCoins</span>
                    </button>

                    {/* Mixto */}
                    <button
                      type="button"
                      disabled={!hasEligibleItems}
                      onClick={() => setPaymentMethod('mixed')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-['Cinzel'] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        !hasEligibleItems
                          ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'
                          : paymentMethod === 'mixed'
                          ? 'bg-[#F5EBE1] text-[#5D3704] border-2 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.35)] cursor-pointer'
                          : 'bg-[#FAF7F2] text-[#5D3704] border border-[#D4AF37]/60 hover:bg-[#F5EBE1] cursor-pointer'
                      }`}
                      title={!hasEligibleItems ? 'Desactivado porque todos los productos son (Solo soles)' : undefined}
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#5D3704] text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                        ✦
                      </div>
                      <span>Mixto</span>
                    </button>
                  </div>
                </div>

                {/* Detalle específico según el método de pago seleccionado */}
                {paymentMethod === 'yape' || paymentMethod === 'plin' ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF4EB] via-[#FFFDF9] to-[#FAF4EB] border border-[#D4AF37]/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-2">
                      <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] flex items-center gap-1.5 uppercase">
                        <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#6C1D9E] to-[#00A896] text-white flex items-center justify-center text-[9px] font-extrabold">Y</span>
                        Datos de Pago · Yape / Plin
                      </span>
                      <span className="text-[10px] font-mono text-[#8C6B1C] font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Confirmación Inmediata
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Vista de Tarjeta QR Oficial Yape/Plin con borde fino sutil y recoloreado marrón cálido corporativo */}
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

                      {/* Datos Yape/Plin */}
                      <div className="flex-1 space-y-2 text-xs font-['Marcellus'] text-[#5D3704] w-full">
                        <div>
                          <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                            Número de Celular Yape / Plin:
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-base sm:text-lg font-bold font-mono tracking-wider text-[#5D3704]">
                              {settings.yapeNumber || '934 403 311'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(settings.yapeNumber || '934 403 311', 'yape_num')}
                              className="p-1.5 rounded-lg bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] cursor-pointer transition-all"
                              title="Copiar número"
                            >
                              {copiedField === 'yape_num' ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-[#5D3704]" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-[#E8DEC9]/70">
                          <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                            Titular de la Cuenta:
                          </span>
                          <span className="font-bold text-xs text-[#5D3704]">
                            {settings.yapeName || 'Gabriela Sil.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : paymentMethod === 'bcp' ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF4EB] via-[#FFFDF9] to-[#FAF4EB] border border-[#D4AF37]/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-2">
                      <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] flex items-center gap-1.5 uppercase">
                        <span className="w-4 h-4 rounded-full bg-[#002A68] text-white flex items-center justify-center text-[8px] font-extrabold border border-orange-400">B</span>
                        Datos de Pago · Transferencia BCP
                      </span>
                      <span className="text-[10px] font-mono text-[#8C6B1C] font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Transferencia Directa
                      </span>
                    </div>

                    {/* Datos BCP limpios sin QR */}
                    <div className="space-y-2 text-xs font-['Marcellus'] text-[#5D3704] w-full">
                      <div>
                        <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                          Número de Cuenta BCP:
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-xs sm:text-sm text-[#5D3704]">
                            {settings.bcpAccount || '191-98765432-0-12'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(settings.bcpAccount || '191-98765432-0-12', 'bcp_acc')}
                            className="p-1 rounded bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] cursor-pointer transition-all"
                            title="Copiar número de cuenta"
                          >
                            {copiedField === 'bcp_acc' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-[#5D3704]" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                          Código CCI (Interbancario):
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-[11px] text-[#5D3704]">
                            {settings.bcpCci || '002-191-0098765432012-50'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(settings.bcpCci || '002-191-0098765432012-50', 'bcp_cci')}
                            className="p-1 rounded bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] cursor-pointer transition-all"
                            title="Copiar CCI"
                          >
                            {copiedField === 'bcp_cci' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-[#5D3704]" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-[#E8DEC9]/70">
                        <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                          Titular de la Cuenta:
                        </span>
                        <span className="font-bold text-xs text-[#5D3704]">
                          {settings.bcpName || 'Gabriela Sil.'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : paymentMethod === 'beecoins' ? (
                  /* BeeCoins 100% Info */
                  <div className="p-4 rounded-2xl bg-[#FAF4EB] border border-[#D4AF37]/60 text-xs text-[#5D3704] space-y-2 font-['Marcellus']">
                    <p className="font-['Cinzel'] font-bold flex items-center gap-1.5 flex-wrap text-xs text-[#5D3704]">
                      <BeeCoinIcon className="w-4 h-4 shrink-0" />
                      <span>Tus BeeCoins Disponibles: {userCoins.toLocaleString('es-PE')} coins</span>
                    </p>
                    <div className="pt-1.5 border-t border-[#E8DEC9]/70 flex justify-between items-center text-[11px]">
                      <span>BeeCoins requeridos para este pedido:</span>
                      <span className="font-['Cinzel'] font-bold text-[#8C6B1C]">{totalBeeCoinsRequired.toLocaleString('es-PE')} coins</span>
                    </div>
                    {!canPayFullyWithCoins ? (
                      <p className="text-rose-700 font-semibold text-[11px] pt-1">
                        ⚠️ No tienes suficientes BeeCoins. Te faltan {(totalBeeCoinsRequired - userCoins).toLocaleString('es-PE')} coins. Puedes seleccionar Pago Mixto para usar tus monedas disponibles y pagar la diferencia en Soles.
                      </p>
                    ) : (
                      <p className="text-emerald-800 font-semibold text-[11px] pt-1">
                        ✓ ¡Tus BeeCoins cubren el 100% de este pedido! No se requiere transferencia en Soles.
                      </p>
                    )}
                  </div>
                ) : (
                  /* Pago Mixto: Desglose completo (Requisito 4) */
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF4EB] via-[#FFFDF9] to-[#FAF4EB] border border-[#D4AF37]/60 space-y-3.5 shadow-2xs">
                    {/* Encabezado Desglose */}
                    <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-2">
                      <span className="text-xs font-['Cinzel'] font-bold text-[#5D3704] flex items-center gap-1.5 uppercase">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#5D3704] text-white flex items-center justify-center text-[8px] font-bold">
                          ✦
                        </div>
                        Desglose de Pago Mixto
                      </span>
                      <span className="text-[10px] font-mono text-[#8C6B1C] font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        BeeCoins + Soles
                      </span>
                    </div>

                    {/* Resumen de Cálculo Mixto */}
                    <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DEC9] space-y-2 text-xs font-['Marcellus'] text-[#5D3704]">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#5D3704]/80">Tus BeeCoins disponibles:</span>
                        <span className="font-['Cinzel'] font-bold flex items-center gap-1 text-[#8C6B1C]">
                          <BeeCoinIcon className="w-3.5 h-3.5" />
                          {userCoins.toLocaleString('es-PE')} coins
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#E8DEC9]/60">
                        <span className="text-[#5D3704]/80">Productos canjeables ({eligibleItems.length}):</span>
                        <span className="font-['Cinzel'] font-bold">
                          S/. {eligibleBeeCoinsSoles.toFixed(2)} ({totalBeeCoinsRequired.toLocaleString('es-PE')} coins)
                        </span>
                      </div>

                      {hasNonEligibleItems && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[#5D3704]/80">Productos '(Solo soles)' ({nonEligibleItems.length}):</span>
                          <span className="font-['Cinzel'] font-bold text-amber-900">
                            S/. {nonEligibleSoles.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-emerald-800 font-semibold bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                        <span>BeeCoins descontados:</span>
                        <span className="font-['Cinzel'] font-bold">
                          -{mixedCoinsToUse.toLocaleString('es-PE')} coins (-S/. {mixedSolesDiscount.toFixed(2)})
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-[#E8DEC9] font-['Cinzel'] font-bold text-[#5D3704]">
                        <span>Saldo Restante a Transferir en Soles:</span>
                        <span className="text-sm text-[#8C6B1C]">
                          S/. {mixedRemainingSoles.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Opciones para transferir el saldo restante en Soles */}
                    {mixedRemainingSoles > 0 && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block mb-1.5">
                            Transfiere el saldo restante (S/. {mixedRemainingSoles.toFixed(2)}) vía:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setMixedTransferMethod('yape')}
                              className={`py-2 px-3 rounded-xl border text-xs font-['Cinzel'] font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                                mixedTransferMethod === 'yape'
                                  ? 'bg-[#F5EBE1] text-[#5D3704] border-2 border-[#D4AF37] shadow-xs'
                                  : 'bg-[#FAF7F2] text-[#5D3704]/80 border border-[#D4AF37]/50 hover:bg-[#F5EBE1]'
                              }`}
                            >
                              <img src="/assets/logos/yape.svg" alt="Yape" className="h-8 w-auto object-contain shrink-0" />
                              <img src="/assets/logos/plin.svg" alt="Plin" className="h-8 w-auto object-contain shrink-0" style={{ clipPath: 'inset(0 0 30% 0)' }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMixedTransferMethod('bcp')}
                              className={`py-2 px-3 rounded-xl border text-xs font-['Cinzel'] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                                mixedTransferMethod === 'bcp'
                                  ? 'bg-[#F5EBE1] text-[#5D3704] border-2 border-[#D4AF37] shadow-xs'
                                  : 'bg-[#FAF7F2] text-[#5D3704]/80 border border-[#D4AF37]/50 hover:bg-[#F5EBE1]'
                              }`}
                            >
                              <img src="/assets/logos/bcp.svg" alt="BCP" className="h-3.5 w-auto object-contain shrink-0" />
                            </button>
                          </div>
                        </div>

                        {/* Datos de transferencia para Yape o BCP */}
                        {mixedTransferMethod === 'yape' ? (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#D4AF37]/50">
                            <div className="p-2 bg-[#FAF7F2] rounded-xl border border-[#D4AF37]/40 shrink-0 flex flex-col items-center">
                              <img
                                src={settings.yapeQrImage || '/assets/aistudio/AgendaPago1_0aeaaf79.JPG'}
                                alt="QR Oficial Yape / Plin"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/assets/aistudio/AgendaPago1_0aeaaf79.JPG';
                                }}
                                className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg"
                              />
                            </div>
                            <div className="flex-1 space-y-1.5 text-xs font-['Marcellus'] text-[#5D3704] w-full">
                              <div>
                                <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                                  Número Yape / Plin:
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-sm sm:text-base font-bold font-mono tracking-wider text-[#5D3704]">
                                    {settings.yapeNumber || '934 403 311'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(settings.yapeNumber || '934 403 311', 'yape_num')}
                                    className="p-1 rounded-lg bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] cursor-pointer transition-all"
                                    title="Copiar número"
                                  >
                                    {copiedField === 'yape_num' ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-[#5D3704]" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="pt-1 border-t border-[#E8DEC9]/70">
                                <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                                  Titular:
                                </span>
                                <span className="font-bold text-xs text-[#5D3704]">
                                  {settings.yapeName || 'Gabriela Sil.'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-xs font-['Marcellus'] text-[#5D3704] p-3 bg-white rounded-xl border border-[#D4AF37]/50 w-full">
                            <div>
                              <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                                Número de Cuenta BCP:
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-xs text-[#5D3704]">
                                  {settings.bcpAccount || '191-98765432-0-12'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(settings.bcpAccount || '191-98765432-0-12', 'bcp_acc')}
                                  className="p-1 rounded bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] cursor-pointer transition-all"
                                  title="Copiar número de cuenta"
                                >
                                  {copiedField === 'bcp_acc' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-[#5D3704]" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                                Código CCI:
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-[11px] text-[#5D3704]">
                                  {settings.bcpCci || '002-191-0098765432012-50'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(settings.bcpCci || '002-191-0098765432012-50', 'bcp_cci')}
                                  className="p-1 rounded bg-[#F5EBE1] hover:bg-[#ebdccf] text-[#5D3704] cursor-pointer transition-all"
                                  title="Copiar CCI"
                                >
                                  {copiedField === 'bcp_cci' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-[#5D3704]" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="pt-1 border-t border-[#E8DEC9]/70">
                              <span className="text-[10px] font-['Cinzel'] font-bold text-[#5D3704]/70 uppercase block">
                                Titular:
                              </span>
                              <span className="font-bold text-xs text-[#5D3704]">
                                {settings.bcpName || 'Gabriela Sil.'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Número de Operación */}
                {(paymentMethod !== 'beecoins' && (paymentMethod !== 'mixed' || mixedRemainingSoles > 0)) && (
                  <div className="space-y-3 pt-1">
                    <OperationCodeInput
                      value={operationNumber}
                      onChange={setOperationNumber}
                      label="Código / Nro de Operación: *"
                      placeholder="Ej: 849201 (6 a 9 dígitos numéricos)"
                    />
                  </div>
                )}

                {/* Botón 'Confirmar y Realizar Pedido' replicando exactamente boton_e8428dac.png */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FFFDF9] via-[#F5EBE1] to-[#FFFDF9] border-2 border-[#D4AF37] hover:border-[#B89230] text-[#5D3704] font-['Cinzel'] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_22px_rgba(212,175,55,0.6)] hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  <ShoppingCart className="w-4 h-4 text-[#8C6B1C]" />
                  <span>
                    Confirmar y Realizar Pedido (
                    {paymentMethod === 'beecoins'
                      ? '0.00 Soles'
                      : paymentMethod === 'mixed'
                      ? `S/. ${mixedRemainingSoles.toFixed(2)}${mixedCoinsToUse > 0 ? ` + ${mixedCoinsToUse.toLocaleString('es-PE')} BeeCoins` : ''}`
                      : `S/. ${totalSoles.toFixed(2)}`}
                    )
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Fixed Summary Bar at Bottom in Step 1 */}
        {storeStep === 1 && !createdOrder && (
          <div className="absolute bottom-0 inset-x-0 z-20 flex-shrink-0 p-3 sm:p-4 bg-[#FAF7F2]/95 backdrop-blur-md border-t-2 border-[#D4AF37]/50 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-b-3xl">
            <button
              type="button"
              onClick={() => setShowCartSummary((prev) => !prev)}
              className="flex items-center gap-2.5 text-[#5D3704] cursor-pointer hover:opacity-80 transition-opacity"
              title="Ver resumen de compra"
            >
              <div className="p-2.5 rounded-xl bg-[#F5EBE1] border border-[#D4AF37]/60 text-[#5D3704] relative">
                <ShoppingCart className="w-5 h-5 text-[#5D3704]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#5D3704] text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#FAF7F2]">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <div className="text-left">
                <span className="text-[10px] font-['Cinzel'] uppercase text-[#5D3704]/70 font-bold block">
                  Resumen de compra {showCartSummary ? '▴' : '▾'}
                </span>
                <span className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#8C6B1C]">
                  TOTAL: S/. {totalSoles.toFixed(2)}
                  {totalBeeCoinsRequired > 0 && ` (${totalBeeCoinsRequired.toLocaleString('es-PE')} BeeCoins)`}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (cartItemsList.length === 0) {
                  setCartEmptyMsg(true);
                  if (cartEmptyToastTimerRef.current) clearTimeout(cartEmptyToastTimerRef.current);
                  cartEmptyToastTimerRef.current = setTimeout(() => {
                    setCartEmptyMsg(false);
                    cartEmptyToastTimerRef.current = null;
                  }, 3500);
                  return;
                }
                if (!currentUser) {
                  setShowAuthRequiredModal(true);
                  return;
                }
                setStoreStep(2);
              }}
              className="px-4 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FFFDF9] via-[#F5EBE1] to-[#FFFDF9] border-2 border-[#D4AF37] hover:border-[#B89230] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_22px_rgba(212,175,55,0.6)] hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Finalizar Pedido</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL ELEGANTE: VALIDACIÓN DE CUENTA OBLIGATORIA PARA COMPRAR */}
      {showAuthRequiredModal && (
        <div
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
        >
          <div
            className="relative border-2 border-[#D4AF37] rounded-3xl max-w-md w-full shadow-[0_20px_60px_rgba(93,55,4,0.45),0_0_30px_rgba(212,175,55,0.35)] overflow-hidden text-center p-6 sm:p-7 space-y-4"
            style={{
              backgroundColor: '#FAF7F2',
              backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
              backgroundSize: '220px auto',
              backgroundRepeat: 'repeat',
            }}
          >
            {/* Overlay difuminado de fondo */}
            <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-md pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              {/* Botón cerrar X */}
              <button
                type="button"
                onClick={() => setShowAuthRequiredModal(false)}
                className="absolute -top-2 -right-2 p-1.5 text-[#5D3704] bg-[#F5EBE1] hover:bg-[#ebdccf] rounded-full shadow-2xs transition-colors cursor-pointer border border-[#5D3704]/20"
                title="Cerrar aviso"
              >
                <X className="w-4 h-4 text-[#5D3704]" />
              </button>

              {/* Icono de bolsa de compras elegante */}
              <div className="w-14 h-14 rounded-full bg-[#F5EBE1] border-2 border-[#D4AF37] flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <ShoppingBag className="w-7 h-7 text-[#8C6B1C]" />
              </div>

              {/* Título exacto solicitado */}
              <div className="space-y-1">
                <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                  Gabee Studio · Cuidado & Bienestar
                </span>
                <h3 className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704] leading-tight">
                  ¡Crea tu cuenta para comprar!
                </h3>
              </div>

              {/* Mensaje descriptivo exacto solicitado */}
              <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704]/90 leading-relaxed px-1">
                Para poder procesar tu pedido y coordinar el envío de tus productos a tu dirección, por favor inicia sesión o crea tu cuenta en Gabee Studio.
              </p>

              {/* Beneficios con diseño marroncito suave */}
              <div className="p-3 rounded-2xl bg-[#F5EBE1]/90 border border-[#D4AF37]/50 text-left text-xs font-['Marcellus'] text-[#5D3704] space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#5D3704]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C89D3C] shrink-0" />
                  <span>Beneficios de tu cuenta Gabee Studio:</span>
                </div>
                <div className="text-[11px] text-[#5D3704]/80 space-y-1 pl-1">
                  <p>🐝 Acumula BeeCoins por cada compra para canjear productos gratis.</p>
                  <p>📦 Registra tu dirección de entrega y sigue el estado de tu pedido.</p>
                </div>
              </div>

              {/* Botones directos estéticos marroncitos claros con bordes finos dorados */}
              <div className="space-y-2.5 pt-1">
                {/* Botón Iniciar Sesión */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthRequiredModal(false);
                    openAccountModal('profile', 'login');
                  }}
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#FAF4EB] via-[#F5EBE1] to-[#FAF4EB] hover:from-[#F2E5D5] hover:to-[#EBDCCF] border border-[#D4AF37] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Iniciar Sesión</span>
                </button>

                {/* Botón Crear Cuenta */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthRequiredModal(false);
                    openAccountModal('profile', 'register');
                  }}
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#F5EBE1] via-[#EFE0D0] to-[#F5EBE1] hover:from-[#EBDCCF] hover:to-[#E3D1BE] border-2 border-[#D4AF37] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Crear Cuenta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
