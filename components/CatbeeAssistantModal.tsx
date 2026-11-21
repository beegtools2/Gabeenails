import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_CATBEE_CONFIG } from '../data/catalogData';

interface ChatMessage {
  id: string;
  sender: 'catbee' | 'user';
  text: string;
  timestamp: string;
  quickActions?: {
    label: string;
    actionType?: 'question' | 'whatsapp';
    isWhatsApp?: boolean;
  }[];
}

export const CatbeeAssistantModal: React.FC = () => {
  const { settings, catbeeConfig, catbeeKnowledge, currentUser } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userQuestionsCount, setUserQuestionsCount] = useState(0);
  const [hasTriggeredComplexQuery, setHasTriggeredComplexQuery] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserQueryRef = useRef<string>('');

  // Initial welcome message from Catbee
  const initialWelcomeText =
    catbeeConfig?.customWelcomeMessage ||
    `**¡Bienvenida a Gabee Studio!**\nAquí resolveremos cualquier duda que tengas, en caso de que desees preguntar algo más en concreto, escríbelo con confianza.`;

  const getInitialMessages = (): ChatMessage[] => {
    const activeKnowledge = (catbeeKnowledge || []).filter((k) => k.active);
    const dynamicQuickActions = activeKnowledge
      .filter((k) => k.actionLabel)
      .slice(0, 4)
      .map((k) => ({
        label: k.actionLabel || k.question,
        actionType: 'question' as const,
      }));

    const defaultQuickActions = [
      { label: '📅 ¿Cómo agendar?', actionType: 'question' as const },
      { label: '🐝 ¿Cómo usar BeeCoins?', actionType: 'question' as const },
      { label: '📦 Verificar mi pedido', actionType: 'question' as const },
    ];

    return [
      {
        id: 'welcome-1',
        sender: 'catbee',
        text: initialWelcomeText,
        timestamp: 'Ahora',
        quickActions: dynamicQuickActions.length > 0 ? dynamicQuickActions : defaultQuickActions,
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Auto-hide floating speech bubble after 14s if user doesn't hover/interact
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setShowTooltip(false);
      }
    }, 14000);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    setShowTooltip(false);
    setHasInteracted(true);
  };

  const handleResetChat = () => {
    setMessages(getInitialMessages());
    setUserQuestionsCount(0);
    setHasTriggeredComplexQuery(false);
    lastUserQueryRef.current = '';
  };

  // Helper to construct WhatsApp action item
  const getWhatsAppAction = () => ({
    label: 'Hablar por WhatsApp',
    actionType: 'whatsapp' as const,
    isWhatsApp: true,
  });

  // Builds the handoff link using the template saved by the admin in the panel.
  const buildCatbeeWhatsAppUrl = (): string => {
    const phone = '51' + (settings.whatsappNumber || '934403311').replace(/\D/g, '').replace(/^51/, '');
    const rawTemplate =
      (catbeeConfig?.whatsappHandoffTemplate || '').trim() ||
      DEFAULT_CATBEE_CONFIG.whatsappHandoffTemplate;

    const lastQuery = lastUserQueryRef.current.trim() || 'información general sobre Gabee Studio';
    const clientName = (currentUser?.firstName || '').trim() || 'Clienta';

    const message = rawTemplate
      .replace(/\r\n?/g, '\n')
      .replace(/\{\s*(consulta|resumen|ultima_consulta|query)\s*\}/gi, () => lastQuery)
      .replace(/\{\s*(nombre|cliente|clienta)\s*\}/gi, () => clientName)
      // Drop any unresolved placeholder / stray token so the message never
      // shows broken text or "undefined" to the client.
      .replace(/\{\s*[a-zA-Z0-9_]+\s*\}/g, '')
      .replace(/\bundefined\b/gi, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const safeMessage = message || DEFAULT_CATBEE_CONFIG.whatsappHandoffTemplate;
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(safeMessage)}`;
  };

  // Automated smart response engine
  const generateCatbeeResponse = (
    userText: string,
    currentQuestionCount: number
  ): { text: string; quickActions?: ChatMessage['quickActions'] } => {
    const textLower = userText.toLowerCase().trim();
    let isComplex = false;

    // Detect if this is a complex / custom request outside normal FAQs
    if (
      textLower.includes('alergia') ||
      textLower.includes('infeccion') ||
      textLower.includes('hongo') ||
      textLower.includes('boda') ||
      textLower.includes('novia') ||
      textLower.includes('evento') ||
      textLower.includes('reclamo') ||
      textLower.includes('queja') ||
      textLower.includes('devolucion') ||
      textLower.includes('urgente') ||
      textLower.includes('personalizado exclusivo') ||
      textLower.includes('diseno de autor') ||
      textLower.includes('hablar con gabriela') ||
      textLower.includes('hablar con una persona') ||
      textLower.includes('humano')
    ) {
      isComplex = true;
    }

    let responseText = '';
    let actions: ChatMessage['quickActions'] = [];

    // 0. Búsqueda prioritaria en la Base de Conocimientos Dinámica de Catbee (Admin Q&A)
    const activeKnowledge = (catbeeKnowledge || []).filter((k) => k.active);
    const matchedKnowledge = activeKnowledge.find((item) => {
      const qLower = item.question.toLowerCase().trim();
      if (textLower === qLower || textLower.includes(qLower) || qLower.includes(textLower)) {
        return true;
      }
      return (item.keywords || []).some((kw) => {
        const kwClean = kw.toLowerCase().trim();
        return kwClean.length >= 2 && textLower.includes(kwClean);
      });
    });

    if (matchedKnowledge) {
      let formattedAnswer = matchedKnowledge.answer
        .replace(/{yapeNumber}/g, settings.yapeNumber || '934 403 311')
        .replace(/{yapeName}/g, settings.yapeName || 'Gabriela E. - Gabee Estudio')
        .replace(/{plinNumber}/g, settings.plinNumber || '934 403 311')
        .replace(/{plinName}/g, settings.plinName || 'Gabriela E. - Gabee Estudio')
        .replace(/{bcpAccount}/g, settings.bcpAccount || '19302589628084')
        .replace(/{bcpName}/g, settings.bcpName || 'Gabee Estudio')
        .replace(/{studioAddress}/g, settings.studioAddress || 'Jesús María, Lima, Perú');

      const followUpActions = activeKnowledge
        .filter((k) => k.id !== matchedKnowledge.id && k.actionLabel)
        .slice(0, 3)
        .map((k) => ({
          label: k.actionLabel || k.question,
          actionType: 'question' as const,
        }));

      actions = followUpActions;

      const derivationThreshold = catbeeConfig?.whatsappDerivationThreshold || 3;
      const shouldAddWhatsApp = currentQuestionCount >= derivationThreshold || isComplex || hasTriggeredComplexQuery;
      if (shouldAddWhatsApp) {
        actions.push(getWhatsAppAction());
      }

      return { text: formattedAnswer, quickActions: actions };
    }

    // 1. Agendamiento / Reservas (Explicación paso a paso completa)
    if (
      textLower.includes('agendar') ||
      textLower.includes('reserva') ||
      textLower.includes('cita') ||
      textLower.includes('horario') ||
      textLower.includes('adelanto') ||
      textLower.includes('estudio') ||
      textLower.includes('domicilio') ||
      textLower.includes('como agendar')
    ) {
      responseText = `¡Agendar tu cita en **Gabee Studio** es súper fácil y rápido! 🐾✨ Aquí tienes el paso a paso:

1. **Modalidad de Atención:** Elige si deseas tu servicio en nuestro acogedor **Studio** (Jesús María) o con atención VIP **A Domicilio**.
2. **Fecha y Horario:** Selecciona en el calendario interactivo el día y el bloque horario que mejor se acomode a ti.
3. **Cupo Congelado por 15 Minutos:** Al elegir tu horario, tu cupo quedará congelado exclusivamente para ti por **15 minutos** para que puedas completar tu reserva con total tranquilidad sin perderlo.
4. **Adelanto del 50% Obligatorio:** Realizas el depósito del **50% de adelanto** del valor total del servicio o promo (por ejemplo, para una promo de S/. 60 el adelanto es de S/. 30) por Yape, Plin o Transferencia BCP. El 50% restante se cancela el día de tu atención.
5. **Confirmación Inmediata:** Tras transferir, ingresas tu número de operación de pago en la web para validar tu cupo y el sistema generará tu **código de reserva único**.

*(Nota: En los kits Press-On hechos a medida, el pago se realiza al 100% por adelantado).*`;
      actions = [
        { label: '🐝 ¿Cómo usar BeeCoins?', actionType: 'question' },
        { label: '📦 Verificar mi pedido', actionType: 'question' },
        { label: '💳 Métodos de pago', actionType: 'question' },
      ];
    }
    // 2. BeeCoins / Monedero / Puntos / Ruleta
    else if (
      textLower.includes('beecoin') ||
      textLower.includes('monedero') ||
      textLower.includes('saldo') ||
      textLower.includes('fidelidad') ||
      textLower.includes('sello') ||
      textLower.includes('puntos') ||
      textLower.includes('ruleta')
    ) {
      responseText = `¡Las **BeeCoins** son nuestra moneda de fidelidad y programa de recompensas exclusivo en **Gabee Studio**! 🐝💛

• **¿Qué son?** Es un sistema de fidelidad creado para consentirte y premiar tu lealtad cada vez que cuidas tus uñas con nosotras.
• **¿Cómo se acumulan?** Ganas automáticamente **10 BeeCoins por cada S/. 1** invertido en cualquier servicio de manicura o sets de uñas Press-On. Además, ¡recibes **10 BeeCoins de regalo directo** al verificar tu correo en tu perfil!
• **Beneficios y Descuentos Exclusivos en el Estudio:**
  - **Tarjeta de Fidelidad:** Cada cita presencial te suma un sello digital. En el **Sello 5** recibes un tratamiento de belleza de regalo, y en el **Sello 10** obtienes un **50% OFF** en tu servicio o un set Press-On de autor totalmente gratis.
  - **Ruleta VIP de Cumpleaños:** En el mes de tu cumpleaños se activa tu ruleta para ganar premios exclusivos, descuentos y regalos sorpresa.
  - **Recargas con Saldo Extra:** Puedes recargar paquetes de BeeCoins en tu monedero con saldo adicional de bonificación para pagar tus citas y compras futuras con ventaja económica.`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '📦 Verificar mi pedido', actionType: 'question' },
        { label: '💳 Métodos de pago', actionType: 'question' },
      ];
    }
    // 3. Pedidos / Estado de compra / Citas realizadas
    else if (
      textLower.includes('pedido') ||
      textLower.includes('estado') ||
      textLower.includes('historial') ||
      textLower.includes('mis citas') ||
      textLower.includes('compra') ||
      textLower.includes('seguimiento') ||
      textLower.includes('verificar')
    ) {
      responseText = `¡Hacer seguimiento a tus citas y pedidos es súper fácil y en tiempo real! 📦🐾

Puedes ingresar a tu **perfil personal** y hacer clic en el botón central **'MIS CITAS & PEDIDOS'** para consultar toda tu información:

• **Citas en Estudio o Domicilio:** Verás el avance de tu reserva y el estado de tu adelanto (*En espera de confirmación*, *Confirmado*, *Atendido*), junto con la fecha, hora y modalidad agendada.
• **Pedidos de Press-On:** Conocerás el estado exacto de confección de tus uñas (*Recibido*, *En preparación*, *Aprobado*, *Despachado*) y tendrás acceso a tu número de guía para envíos por Olva Courier o Shalom.
• **Dejar Reseñas:** Una vez completada tu cita o entregado tu pedido, tendrás disponible el botón **'⭐ Dejar Reseña'** para calificar con estrellas y compartir tu testimonio con fotos en nuestra web.`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '🐝 ¿Cómo usar BeeCoins?', actionType: 'question' },
        { label: '💳 Métodos de pago', actionType: 'question' },
      ];
    }
    // 4. Métodos de Pago / Antifraude
    else if (
      textLower.includes('pago') ||
      textLower.includes('yape') ||
      textLower.includes('plin') ||
      textLower.includes('bcp') ||
      textLower.includes('banco') ||
      textLower.includes('operacion') ||
      textLower.includes('cuenta')
    ) {
      responseText = `Aceptamos los siguientes métodos de pago oficiales para tu adelanto del 50% o pedidos Press-On: 💳✨

• **Yape:** ${settings.yapeNumber || '930 205 316'} (${settings.yapeName || 'Gabriela'})
• **Plin:** ${settings.plinNumber || '930 205 316'} (${settings.plinName || 'Gabriela'})
• **Transferencia BCP:** ${settings.bcpAccount || '191-XXXXXXXX-XXX'} (${settings.bcpName || 'Gabriela'})

🔒 **Confirmación Segura:** Al realizar tu transferencia o pago móvil, únicamente ingresas tu número de operación de pago en la web para validar tu cupo y generar tu código de atención de forma inmediata.`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '📦 Verificar mi pedido', actionType: 'question' },
      ];
    }
    // 5. Press-On / Uñas Reutilizables / Envíos / Tallas
    else if (
      textLower.includes('press') ||
      textLower.includes('press-on') ||
      textLower.includes('press on') ||
      textLower.includes('talla') ||
      textLower.includes('medir') ||
      textLower.includes('envio') ||
      textLower.includes('envíos') ||
      textLower.includes('kit')
    ) {
      responseText = `¡Nuestras uñas **Press-On** son una maravilla de alta gama hechas a mano! 💅🐝

• **Reutilizables y duraderas:** Hechas 100% a mano con geles profesionales y acabado vitrificado de salón.
• **Kits de colocación incluido:** Cada set incluye lima buffer, repujador de madera, toallitas desinfectantes, pegamento líquido y adhesivos gelatinosos.
• **Tallas a Medida:** Disponibles en tallas estándar (XS, S, M, L) o a tu medida exacta usando nuestra guía visual de monedas.
• **Envíos:** Envíos express a todo Lima y a nivel nacional por Olva Courier o Shalom, además de entrega en nuestro estudio. Recuerda que los sets Press-On se reservan con el 100% de pago por adelantado.`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '🐝 ¿Cómo usar BeeCoins?', actionType: 'question' },
      ];
    }
    // 6. Retiro / Daño / Salud de la uña
    else if (
      textLower.includes('retiro') ||
      textLower.includes('retirar') ||
      textLower.includes('quitar') ||
      textLower.includes('danar') ||
      textLower.includes('daño') ||
      textLower.includes('duele') ||
      textLower.includes('cuidado')
    ) {
      responseText = `¡La salud de tus uñas naturales es nuestra prioridad #1! 🌿🐾

• **Cero dolor y cero daño:** Jamás arranques las uñas a la fuerza. En el estudio realizamos un retiro cuidadoso con fresas de cerámica y removedores nutritivos que preservan la queratina natural.
• **Cuidado posterior:** Aplicamos aceites de cutícula y bases de tratamiento restaurador.
• Si tienes un sistema anterior de otro estudio, puedes solicitar el servicio de retiro al agendar tu cita con el 50% de adelanto.`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '💳 Métodos de pago', actionType: 'question' },
      ];
    }
    // 7. Saludos cordiales
    else if (
      textLower.includes('hola') ||
      textLower.includes('buenas') ||
      textLower.includes('buenos dias') ||
      textLower.includes('buenas tardes') ||
      textLower.includes('buenas noches') ||
      textLower === 'hey'
    ) {
      responseText = `¡Hola, hermosa! 🐾🐝 ¿Qué tal tu día? Soy **Catbee**, tu asistente virtual en Gabee Studio.

Estoy aquí para guiarte en todo lo que necesites sobre tus reservas, uñas Press-On y recompensas BeeCoins. ¿Por dónde te gustaría empezar?`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '🐝 ¿Cómo usar BeeCoins?', actionType: 'question' },
        { label: '📦 Verificar mi pedido', actionType: 'question' },
      ];
    }
    // 8. Precios / Tarifas
    else if (
      textLower.includes('precio') ||
      textLower.includes('cuanto cuesta') ||
      textLower.includes('costo') ||
      textLower.includes('tarifa') ||
      textLower.includes('promocion') ||
      textLower.includes('promo')
    ) {
      responseText = `Contamos con tarifas y promociones súper transparentes: 💎✨

• **Promociones del Mes:** Sistemas completos (Softgel / Polygel) desde S/. 60 con manicura combinada rusa incluida.
• **Regla de Adelanto del 50%:** Toda cita en estudio o a domicilio se reserva con el 50% de adelanto (por ejemplo, S/. 30 para una promo de S/. 60) vía Yape, Plin o BCP, y el saldo restante se paga el día de tu atención.
• **Sets Press-On:** Modelos promocionales desde S/. 50 y catálogo exclusivo desde S/. 75 con kit de aplicación de regalo (pago al 100% por adelantado).`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '🐝 ¿Cómo usar BeeCoins?', actionType: 'question' },
        { label: '💳 Métodos de pago', actionType: 'question' },
      ];
    }
    // 9. Ubicación / Dirección / Dónde están
    else if (
      textLower.includes('donde') ||
      textLower.includes('direccion') ||
      textLower.includes('ubicacion') ||
      textLower.includes('lugar') ||
      textLower.includes('queda')
    ) {
      responseText = `¡Nos encontramos en un espacio íntimo, privado y súper acogedor! 📍✨

• **Estudio:** ${settings.studioAddress || 'Jesús María, Lima, Perú'}. Por temas de privacidad y seguridad, la dirección exacta te será compartida de inmediato por WhatsApp una vez confirmado tu cupo con el adelanto del 50%.
• **Modalidad a Domicilio:** Si lo prefieres, podemos trasladar toda la experiencia de Gabee Studio hasta tu hogar con implementos 100% esterilizados.`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '💳 Métodos de pago', actionType: 'question' },
      ];
    }
    // Fallback general (Consulta compleja o fuera de FAQs)
    else {
      isComplex = true;
      responseText = `¡Entendido, reina! 🐾 En **Gabee Studio** nos aseguramos de darte una atención única y personalizada.

Para esta consulta específica o detalles a medida, puedes ponerte en contacto directamente con Gabriela para coordinar todo lo que necesites.`;
      actions = [
        { label: '📅 ¿Cómo agendar?', actionType: 'question' },
        { label: '🐝 ¿Cómo usar BeeCoins?', actionType: 'question' },
      ];
    }

    if (isComplex) {
      setHasTriggeredComplexQuery(true);
    }

    // CONDICIONAL WHATSAPP:
    // Se muestra si la clienta ya ha realizado al menos N preguntas configuradas
    // O si es una consulta compleja fuera del catálogo de FAQs.
    const derivationThreshold = catbeeConfig?.whatsappDerivationThreshold || 3;
    const shouldAddWhatsApp = currentQuestionCount >= derivationThreshold || isComplex || hasTriggeredComplexQuery;

    if (shouldAddWhatsApp) {
      actions.push(getWhatsAppAction());
    }

    return { text: responseText, quickActions: actions };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    lastUserQueryRef.current = text;
    const newQuestionCount = userQuestionsCount + 1;
    setUserQuestionsCount(newQuestionCount);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Realistic typing delay from Catbee
    setTimeout(() => {
      const response = generateCatbeeResponse(text, newQuestionCount);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'catbee',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: response.quickActions,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 650);
  };

  const handleQuickAction = (action: { label: string; actionType?: string; isWhatsApp?: boolean }) => {
    if (action.isWhatsApp || action.actionType === 'whatsapp') {
      window.open(buildCatbeeWhatsAppUrl(), '_blank');
      return;
    }

    // Interactive questions trigger explanatory answers in the chat
    let questionText = action.label;
    if (action.label.includes('¿Cómo agendar?')) questionText = '¿Cómo agendar?';
    else if (action.label.includes('¿Cómo usar BeeCoins?')) questionText = '¿Cómo usar BeeCoins?';
    else if (action.label.includes('Verificar mi pedido')) questionText = 'Verificar mi pedido';
    else if (action.label.includes('Métodos de pago')) questionText = '¿Cuáles son los métodos de pago?';
    else if (action.label.includes('Press-On')) questionText = '¿Cómo funcionan las uñas Press-On y los envíos?';

    handleSendMessage(questionText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. BURBUJA FLOTANTE FIJA & TOOLTIP EN ESQUINA INFERIOR DERECHA */}
      {/* ============================================================== */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end pointer-events-auto select-none">
        {/* Tooltip / Globito emergente flotante inicial (Compacto y Delicado) */}
        {!isOpen && showTooltip && (
          <div
            className="mb-2 max-w-[205px] sm:max-w-[215px] bg-[#FAF7F2] border border-[#D4AF37] rounded-2xl py-2 px-3 shadow-[0_6px_22px_rgba(93,55,4,0.28)] relative animate-bounce-subtle cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            onClick={toggleChat}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
                setHasInteracted(true);
              }}
              className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 bg-[#5D3704] text-[#FAF7F2] hover:bg-[#8C6B1C] rounded-full flex items-center justify-center text-[9px] shadow-sm cursor-pointer transition-colors"
              title="Cerrar aviso"
            >
              <X className="w-2.5 h-2.5" />
            </button>

            <p className="font-['Marcellus'] text-xs text-[#5D3704] leading-snug">
              <span className="block font-semibold">¡Hola! Soy Catbee 🐾🐝</span>
              <span className="block mt-0.5 text-[#8C6B1C] text-[11px]">¿En qué puedo ayudarte hoy?</span>
            </p>

            {/* Flechita apuntando directamente a la ilustración de Catbee */}
            <div className="absolute -bottom-1.5 right-6 w-2.5 h-2.5 bg-[#FAF7F2] border-r border-b border-[#D4AF37] rotate-45 transform" />
          </div>
        )}

        {/* Personaje Flotante Catbee (Sin círculo contenedor ni borde rígido) */}
        <button
          type="button"
          onClick={toggleChat}
          onMouseEnter={() => setShowTooltip(true)}
          className="relative group p-0 bg-transparent border-0 outline-none hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center select-none"
          style={{ width: '82px', height: '82px' }}
          title="Abrir chat con Catbee, Asistente de IA"
        >
          {/* Brillo difuminado suave alrededor del personaje al pasar el cursor o hacer clic */}
          <div className="absolute inset-0 rounded-full bg-[#D4AF37]/25 blur-xl scale-125 opacity-70 group-hover:opacity-100 group-hover:scale-140 group-active:scale-150 transition-all duration-300 pointer-events-none animate-pulse" />

          {/* Ilustración de Catbee con fondo transparente flotando directamente en la esquina */}
          <img
            src="/assets/aistudio/gatobeja_transparent.png"
            alt="Catbee"
            className="w-full h-full object-contain pointer-events-none transition-all duration-300 drop-shadow-[0_4px_12px_rgba(93,55,4,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.85)] group-active:drop-shadow-[0_0_24px_rgba(212,175,55,1)]"
          />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. VENTANA DE CHAT DE CATBEE (MODAL ESTILIZADO)               */}
      {/* ============================================================== */}
      {isOpen && (
        <div className="fixed bottom-26 right-4 sm:bottom-28 sm:right-6 z-[9995] w-[92vw] sm:w-[390px] md:w-[410px] h-[540px] max-h-[82vh] rounded-3xl bg-[#FAF7F2] border-2 border-[#D4AF37] shadow-[0_16px_50px_rgba(93,55,4,0.45),0_0_25px_rgba(212,175,55,0.3)] flex flex-col overflow-hidden animate-fadeIn">
          {/* Header del Chat con Fondo de Patrón de Abejitas */}
          <div
            className="px-4 py-3 border-b border-[#D4AF37] text-[#5D3704] flex items-center justify-between shrink-0 shadow-xs relative rounded-t-3xl"
            style={{
              backgroundImage: "url('/assets/aistudio/Inicio_5d3704_dd6e8988.png')",
              backgroundSize: '200px auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="flex items-center gap-2.5 bg-[#FAF7F2]/90 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-[#D4AF37]/50 shadow-2xs">
              {/* Avatar circular limpio de Catbee con borde dorado centrado en su carita */}
              <div className="relative w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-[#FAF4EB] shrink-0 shadow-xs flex items-center justify-center">
                <img
                  src="/assets/aistudio/catbee_avatar.png"
                  alt="Catbee"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-['Cinzel'] font-bold text-sm tracking-wide text-[#5D3704]">
                    Asistente Catbee
                  </h3>
                  <span className="text-xs">🐾🐝</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-['Marcellus'] text-[#8C6B1C]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-700">En línea</span>
                </div>
              </div>
            </div>

            {/* Acciones de Cabecera: Reiniciar y Cerrar */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2]/90 px-1.5 py-1 rounded-2xl border border-[#D4AF37]/50 shadow-2xs">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-[#5D3704] hover:bg-[#F2E5D5] rounded-full transition-colors cursor-pointer"
                title="Reiniciar chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#5D3704] hover:bg-[#F2E5D5] rounded-full transition-colors cursor-pointer"
                title="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de Conversación */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#FAF7F2] to-[#F5EBE1]/60">
            {messages.map((msg) => {
              const isCatbee = msg.sender === 'catbee';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCatbee ? 'items-start' : 'items-end'} animate-fadeIn`}
                >
                  <div className="flex items-end gap-2 max-w-[88%]">
                    {isCatbee && (
                      <div className="w-7 h-7 rounded-full border border-[#D4AF37] overflow-hidden bg-[#FAF4EB] shrink-0 mb-1 flex items-center justify-center shadow-xs">
                        <img
                          src="/assets/aistudio/catbee_avatar.png"
                          alt="Catbee"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl shadow-xs text-xs font-['Marcellus'] leading-relaxed ${
                        isCatbee
                          ? 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059]/50 rounded-bl-xs'
                          : 'bg-[#5D3704] text-[#FAF7F2] border border-[#D4AF37]/50 rounded-br-xs'
                      }`}
                    >
                      {/* Texto con soporte de negritas */}
                      <div className="whitespace-pre-line space-y-1.5">
                        {msg.text.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>
                            {paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong
                                    key={i}
                                    className={
                                      isCatbee
                                        ? 'font-bold text-[#8C6B1C]'
                                        : 'font-bold text-[#FDF0A6]'
                                    }
                                  >
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return part;
                            })}
                          </p>
                        ))}
                      </div>

                      {/* Botones de preguntas interactivas al final del mensaje */}
                      {msg.quickActions && msg.quickActions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#E8DEC9]/70 flex flex-wrap gap-1.5">
                          {msg.quickActions.map((qa, idx) => {
                            if (qa.isWhatsApp) {
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleQuickAction(qa)}
                                  className="py-1.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white border border-[#1ebd56] text-[10.5px] font-['Cinzel'] font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm hover:scale-[1.02]"
                                >
                                  <Send className="w-3.5 h-3.5 text-white -rotate-12" />
                                  <span>{qa.label}</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleQuickAction(qa)}
                                className="py-1 px-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2E5D5] text-[#5D3704] border border-[#D4AF37] text-[10.5px] font-['Cinzel'] font-bold flex items-center gap-1 cursor-pointer transition-all duration-200 shadow-2xs hover:scale-[1.02]"
                              >
                                <span>{qa.label}</span>
                                <ChevronRight className="w-3 h-3 text-[#8C6B1C]" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[9.5px] font-['Marcellus'] text-[#5D3704]/60 px-1 mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Indicador de escritura animado */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs font-['Marcellus'] text-[#8C6B1C] bg-[#FDFBF7] border border-[#C5A059]/40 p-2.5 rounded-2xl w-fit shadow-2xs animate-pulse">
                <div className="w-6 h-6 rounded-full border border-[#D4AF37] overflow-hidden bg-[#FAF4EB] shrink-0 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/catbee_avatar.png"
                    alt="Catbee"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span>Catbee está escribiendo</span>
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#8C6B1C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#8C6B1C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#8C6B1C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Entrada de Texto */}
          <div className="p-3 bg-[#FAF7F2] border-t border-[#E8DEC9] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta a Catbee..."
                className="flex-1 py-2.5 px-3.5 text-xs bg-white border border-[#C5A059]/60 rounded-xl font-['Marcellus'] text-[#5D3704] placeholder-[#5D3704]/50 focus:outline-none focus:border-[#5D3704] shadow-2xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  inputText.trim()
                    ? 'bg-[#5D3704] border-[#D4AF37] text-[#FAF7F2] hover:bg-[#432702] shadow-xs hover:scale-105'
                    : 'bg-[#F2E5D5]/60 border-transparent text-[#5D3704]/40 cursor-not-allowed'
                }`}
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between text-[9.5px] font-['Marcellus'] text-[#5D3704]/60 px-1">
              <span>Asistente Oficial Gabee Studio 🐾</span>
              <span>Respuestas inteligentes</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
