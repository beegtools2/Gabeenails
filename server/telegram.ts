/// <reference types="node" />
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { ApiRequest, ApiResponse } from './http.ts';
import { readJsonBody, sendJson } from './http.ts';

type TelegramDecision = 'accept' | 'reject';
type TelegramTargetType = 'store' | 'recharge' | 'appointment';

interface TelegramAction {
  id: string;
  type: TelegramTargetType;
  targetId: string;
  decision: TelegramDecision;
  at: number;
}

interface StoredMessage {
  text: string;
  chatId: string;
  messageId: number;
}

interface TelegramState {
  offset: number;
  chatId: string;
  messages: Record<string, StoredMessage>;
  actions: TelegramAction[];
}

interface OrderPayload {
  id: string;
  code?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  totalSoles?: number;
  paymentMethod?: string;
  operationNumber?: string;
  deliveryType?: string;
  items?: Array<{ name?: string; productName?: string; quantity?: number; price?: number }>;
  notes?: string;
}

interface RechargePayload {
  id: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  packageName?: string;
  coinsAmount?: number;
  priceSoles?: number;
  paymentMethod?: string;
  operationNumber?: string;
}

interface AppointmentPayload {
  id: string;
  code?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientInstagram?: string;
  serviceType?: string;
  serviceName?: string;
  system?: string | null;
  promoDesignTitle?: string;
  date?: string;
  timeSlot?: string;
  locationType?: string;
  homeAddress?: string;
  homeReference?: string;
  totalPrice?: number;
  depositRequired?: number;
  paymentMethod?: string;
  operationNumber?: string;
  additionals?: string[];
  notes?: string;
  pressOnDetails?: {
    mode?: string;
    setName?: string;
    size?: string;
    kit?: string;
    deliveryType?: string;
    address?: string;
    district?: string;
    department?: string;
    reference?: string;
    customShape?: string;
    customLength?: string;
  };
  status?: string;
}
const MAX_ACTIONS = 500;
const MAX_STORED_MESSAGES = 300;
function loadState(file: string): TelegramState {
  const fallback: TelegramState = { offset: 0, chatId: '', messages: {}, actions: [] };
  try {
    if (!fs.existsSync(file)) return fallback;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      offset: Number(parsed?.offset) || 0,
      chatId: typeof parsed?.chatId === 'string' ? parsed.chatId : '',
      messages: parsed?.messages && typeof parsed.messages === 'object' ? parsed.messages : {},
      actions: Array.isArray(parsed?.actions) ? parsed.actions : [],
    };
  } catch {
    return fallback;
  }
}
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatSoles(value: unknown): string {
  const amount = Number(value);
  return `S/ ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

function formatPaymentMethod(method: unknown): string {
  const value = String(method || '').trim().toLowerCase();
  if (!value) return 'No especificado';
  if (value === 'bcp') return 'Transferencia BCP';
  if (value === 'yape') return 'Yape';
  if (value === 'plin') return 'Plin';
  if (value === 'beecoins') return 'BeeCoins';
  if (value === 'mixed') return 'Pago mixto';
  return String(method).toUpperCase();
}

function formatAppointmentStatus(status: unknown): string {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'Pendiente de revisión';
  if (value === 'pending_deposit') return 'En espera de confirmación';
  if (value === 'confirmed') return 'Confirmada';
  if (value === 'completed') return 'Completada';
  if (value === 'cancelled') return 'Cancelada';
  return 'Pendiente de revisión';
}

function formatSystem(system: unknown): string {
  const value = String(system || '').trim().toLowerCase();
  if (!value) return 'No especificado';
  if (value === 'softgel' || value === 'soft gel') return 'Soft Gel';
  if (value === 'polygel') return 'Polygel';
  if (value === 'builder_gel' || value === 'builder gel') return 'Builder Gel';
  if (value === 'acrilicas' || value === 'acrílicas' || value === 'acrilico') return 'Acrílicas';
  if (value === 'esmaltado_gel' || value === 'esmaltado gel') return 'Esmaltado Gel';
  return String(system);
}

function formatStoreProducts(items: OrderPayload['items']): string[] {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return ['• Sin detalle'];

  return list.map((item) => {
    const name = String(item?.productName || item?.name || 'Producto').trim() || 'Producto';
    const qty = Math.max(1, Number(item?.quantity) || 1);
    return `• ${qty}x ${escapeHtml(name)}`;
  });
}

function buildStoreMessage(order: OrderPayload): string {
  const client = [order.clientName, order.clientPhone].filter(Boolean).join(' / ') || 'Clienta Gabee';
  const productLines = formatStoreProducts(order.items);

  const lines = [
    '🛍️ <b>Nueva Compra en Tienda (Cuidado y Bienestar)</b>',
    '',
    `👤 Cliente: ${escapeHtml(client)}`,
    `🧾 Código: ${order.code ? `<code>${escapeHtml(order.code)}</code>` : 'No registrado'}`,
    '🛒 Pedido:',
    ...productLines,
  ];
  if (order.deliveryType) {
    lines.push(`📦 Modalidad: ${escapeHtml(order.deliveryType === 'delivery' ? 'Envío a domicilio' : 'Recojo en Studio')}`);
  }
  lines.push(`💵 Total: ${formatSoles(order.totalSoles)}`);
  lines.push(`💰 Pago: ${formatSoles(order.totalSoles)}`);
  lines.push(`💳 Método de pago: ${escapeHtml(formatPaymentMethod(order.paymentMethod))}`);
  lines.push(`🔢 N° de operación: ${order.operationNumber ? `<code>${escapeHtml(order.operationNumber)}</code>` : 'No registrado'}`);
  lines.push(`📌 Estado: ${escapeHtml('Pendiente de revisión')}`);
  return lines.join('\n');
}

function buildRechargeMessage(recharge: RechargePayload): string {
  const client = [recharge.userName, recharge.userPhone].filter(Boolean).join(' / ') || 'Clienta Gabee';
  const coins = Number(recharge.coinsAmount) || 0;
  return [
    '💰 <b>Nueva Recarga de BeeCoins</b>',
    '',
    `👤 Cliente: ${escapeHtml(client)}`,
    `🧾 Código: <code>${escapeHtml(recharge.id)}</code>`,
    `📦 Pedido: ${escapeHtml(recharge.packageName || `${coins} BeeCoins`)}`,
    `💵 Total: ${formatSoles(recharge.priceSoles)}`,
    `💰 Pago: ${formatSoles(recharge.priceSoles)}`,
    `💳 Método de pago: ${escapeHtml(formatPaymentMethod(recharge.paymentMethod))}`,
    `🔢 N° de operación: ${recharge.operationNumber ? `<code>${escapeHtml(recharge.operationNumber)}</code>` : 'No registrado'}`,
    `📌 Estado: ${escapeHtml('Pendiente de revisión')}`,
  ].join('\n');
}

function buildAppointmentMessage(apt: AppointmentPayload): string {
  const client = [apt.clientName, apt.clientPhone].filter(Boolean).join(' / ') || 'Clienta Gabee';
  const isPressOn = Boolean(apt.pressOnDetails);

  if (isPressOn) {
    const mode = apt.pressOnDetails?.mode;
    let title = '💅 <b>Nuevo Pedido Press On Nails (Catálogo)</b>';
    if (apt.serviceType === 'promotion' || (apt.promoDesignTitle || '').toLowerCase().includes('promo')) {
      title = '💅 <b>Nuevo Pedido Press On Nails (Promoción)</b>';
    } else if (mode === 'custom') {
      title = '💅 <b>Nuevo Pedido Press On Nails (Personalizado)</b>';
    }
    const detail = apt.pressOnDetails?.setName || apt.promoDesignTitle || apt.serviceName || 'Set Press On';
    const lines = [
      title,
      '',
      `👤 Cliente: ${escapeHtml(client)}`,
      `🧾 Código: ${apt.code ? `<code>${escapeHtml(apt.code)}</code>` : 'No registrado'}`,
      `💅 Pedido: ${escapeHtml(detail)}`,
    ];
    if (apt.pressOnDetails?.deliveryType) {
      lines.push(`📦 Modalidad: ${escapeHtml(apt.pressOnDetails.deliveryType === 'studio' ? 'Recojo en Studio' : 'Envío a domicilio')}`);
    }
    lines.push(`💵 Total: ${formatSoles(apt.totalPrice)}`);
    lines.push(`💰 Adelanto: ${apt.depositRequired != null ? formatSoles(apt.depositRequired) : 'No registrado'}`);
    lines.push(`💳 Método de pago: ${escapeHtml(formatPaymentMethod(apt.paymentMethod))}`);
    lines.push(`🔢 N° de operación: ${apt.operationNumber ? `<code>${escapeHtml(apt.operationNumber)}</code>` : 'No registrado'}`);
    lines.push(`📌 Estado: ${escapeHtml(formatAppointmentStatus(apt.status))}`);
    return lines.join('\n');
  }

  // Cita de Servicios / Promoción del Sistema
  let title = '💆‍♀️ <b>Nueva Cita de Servicios</b>';
  if (apt.serviceType === 'promotion') {
    title = '💆‍♀️ <b>Nueva Cita de Servicios (Promoción)</b>';
  } else if (apt.serviceType === 'removal') {
    title = '💆‍♀️ <b>Nueva Cita de Servicios (Retiro/Spa)</b>';
  }
  const serviceLabel = apt.promoDesignTitle || apt.serviceName || 'Servicio';
  const systemLabel = apt.serviceType === 'removal' ? 'Retiro de Sistema' : formatSystem(apt.system);
  const location = apt.locationType === 'home' ? 'Domicilio' : 'Studio';

  return [
    title,
    '',
    `👤 Cliente: ${escapeHtml(client)}`,
    `🧾 Código de reserva: ${apt.code ? `<code>${escapeHtml(apt.code)}</code>` : 'No registrado'}`,
    `💅 Servicio: ${escapeHtml(serviceLabel)}`,
    `🧩 Sistema: ${escapeHtml(systemLabel)}`,
    `📅 Fecha: ${apt.date ? escapeHtml(apt.date) : 'No registrada'}`,
    `⏰ Horario: ${apt.timeSlot ? escapeHtml(apt.timeSlot) : 'No registrado'}`,
    `📍 Modalidad: ${escapeHtml(location)}`,
    `💵 Total: ${formatSoles(apt.totalPrice)}`,
    `💰 Monto del adelanto: ${apt.depositRequired != null ? formatSoles(apt.depositRequired) : 'No registrado'}`,
    `💳 Método de pago: ${escapeHtml(formatPaymentMethod(apt.paymentMethod))}`,
    `🔢 N° de operación: ${apt.operationNumber ? `<code>${escapeHtml(apt.operationNumber)}</code>` : 'No registrado'}`,
    `📌 Estado: ${escapeHtml(formatAppointmentStatus(apt.status))}`,
  ].join('\n');
}

function buildDecisionLine(kind: 'cita' | 'pedido', decision: TelegramDecision): string {
  if (kind === 'cita') {
    return decision === 'accept' ? '✅ Cita confirmada' : '❌ Cita rechazada';
  }
  return decision === 'accept' ? '✅ Pedido confirmado' : '❌ Pedido rechazado';
}

export interface TelegramService {
  status(): {
    configured: boolean;
    chatLinked: boolean;
    chatId: string | null;
    lastPollAt: number | null;
    lastError: string | null;
    pendingActions: number;
  };
  actions(): { actions: TelegramAction[] };
  notifyStoreOrder(req: ApiRequest, res: ApiResponse): Promise<void>;
  notifyRecharge(req: ApiRequest, res: ApiResponse): Promise<void>;
  notifyAppointment(req: ApiRequest, res: ApiResponse): Promise<void>;
  pollOnceThrottled(): Promise<void>;
  startPolling(): void;
  stopPolling(): void;
}

let singleton: TelegramService | null = null;

export function getTelegramService(): TelegramService {
  if (singleton) return singleton;

  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const envChatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
  // En Vercel el filesystem es de solo lectura: el estado vive en /tmp por instancia.
  const stateFile = process.env.VERCEL
    ? path.join(os.tmpdir(), '.telegram-state.json')
    : path.resolve(process.cwd(), '.telegram-state.json');

  const sharedState = (globalThis as any).__gabeeTelegramState as TelegramState | undefined;
  const state: TelegramState =
    sharedState && typeof sharedState === 'object' && Array.isArray(sharedState.actions)
      ? sharedState
      : loadState(stateFile);
  (globalThis as any).__gabeeTelegramState = state;

  let pollInFlight = false;
  let errorStreak = 0;
  let lastPollRequestAt = 0;

  const health: { lastPollAt: number | null; lastError: string | null; pollerId: string } = ((
    globalThis as any
  ).__gabeeTelegramHealth ||= { lastPollAt: null, lastError: null, pollerId: '' });
  const pollerId = `${process.pid}-${Date.now().toString(36)}`;

  const saveState = () => {
    try {
      if (state.actions.length > MAX_ACTIONS) state.actions = state.actions.slice(-MAX_ACTIONS);
      const messageKeys = Object.keys(state.messages);
      if (messageKeys.length > MAX_STORED_MESSAGES) {
        const trimmed: Record<string, StoredMessage> = {};
        messageKeys.slice(-MAX_STORED_MESSAGES).forEach((key) => {
          trimmed[key] = state.messages[key];
        });
        state.messages = trimmed;
      }
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
    } catch (err: any) {
      console.warn('[Telegram] No se pudo guardar el estado local:', err?.message || err);
    }
  };

  const callTelegram = async (method: string, payload?: Record<string, unknown>) => {
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado');
    // Límite de tiempo estricto: si la red se queda colgada, el poller sigue funcionando.
    const response = await Promise.race([
      fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Telegram ${method} agotó el tiempo de espera`)),
          15000
        )
      ),
    ]);
    const data: any = await response.json().catch(() => null);
    if (!data || data.ok !== true) {
      throw new Error(data?.description || `Telegram ${method} falló (HTTP ${response.status})`);
    }
    return data.result;
  };
  const processTelegramUpdate = async (update: any) => {
    if (!update || typeof update !== 'object') return;
    const updateId = Number(update?.update_id);
    if (Number.isFinite(updateId)) state.offset = Math.max(state.offset, updateId + 1);
    if (update?.message) await handleMessage(update.message);
    if (update?.callback_query) await handleCallback(update.callback_query);
  };

  const resolveChatId = (): string => {
    if (state.chatId) return state.chatId;
    // Ignora el placeholder de ejemplo: el chat real se detecta al enviar /start al bot.
    if (envChatId && envChatId !== '-1001234567890') return envChatId;
    return '';
  };

  const sendMessage = async (text: string, keyboard?: Array<Array<Record<string, string>>>) => {
    const chatId = resolveChatId();
    if (!chatId) {
      console.warn('[Telegram] Envío omitido: chat no vinculado. Abre @GabeeStudio_bot y envía /start.');
      return {
        ok: false,
        linked: false,
        message:
          'Telegram aún no está vinculado. Abre @GabeeStudio_bot en Telegram y envía /start una sola vez.',
      };
    }
    const message: any = await callTelegram('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      disable_notification: false,
      ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    });
    return { ok: true, linked: true, message };
  };

  const registerMessage = (type: TelegramTargetType, targetId: string, text: string, message: any) => {
    if (!message?.message_id) return;
    state.messages[`${type}:${targetId}`] = {
      text,
      chatId: String(message.chat?.id ?? resolveChatId()),
      messageId: message.message_id,
    };
    saveState();
  };

  const answerCallback = async (callbackQueryId: string, text: string) => {
    // Reintento breve para garantizar que el botón deje de cargar en el chat.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
        return;
      } catch (err: any) {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        } else {
          console.warn('[Telegram] No se pudo responder el callback:', err?.message || err);
        }
      }
    }
  };

  const parseCallbackData = (
    data: string
  ): { type: TelegramTargetType; decision: TelegramDecision; targetId: string } | null => {
    // Formato actual: confirm_appointment_<código>, cancel_order_<código>, confirm_recharge_<id>, etc.
    const modern = data.match(/^(confirm|cancel)_(appointment|order|recharge)_(.+)$/);
    if (modern) {
      const decision: TelegramDecision = modern[1] === 'confirm' ? 'accept' : 'reject';
      const kind = modern[2];
      const type: TelegramTargetType =
        kind === 'appointment' ? 'appointment' : kind === 'recharge' ? 'recharge' : 'store';
      return { type, decision, targetId: modern[3] };
    }

    // Compatibilidad con el formato anterior: store:accept:<id>
    const [type, decision, targetId] = data.split(':');
    if (
      (type === 'store' || type === 'recharge' || type === 'appointment') &&
      (decision === 'accept' || decision === 'reject') &&
      targetId
    ) {
      return { type, decision, targetId };
    }
    return null;
  };

  const resolveTelegramKind = (
    type: TelegramTargetType,
    targetId: string,
    storedText?: string
  ): 'cita' | 'pedido' => {
    if (type === 'store' || type === 'recharge') return 'pedido';
    const code = String(targetId || '').toUpperCase();
    if (/^(PO|PP|TG)/.test(code)) return 'pedido';
    if (/^(NS|PS)/.test(code)) return 'cita';
    if (storedText) {
      if (storedText.includes('Cita de Servicios')) return 'cita';
      if (
        storedText.includes('Pedido Press On') ||
        storedText.includes('Compra en Tienda') ||
        storedText.includes('Recarga de BeeCoins')
      ) {
        return 'pedido';
      }
    }
    return 'cita';
  };

  const handleCallback = async (callbackQuery: any) => {
    const data = String(callbackQuery?.data || '');
    const parsed = parseCallbackData(data);

    if (!parsed) {
      await answerCallback(callbackQuery.id, 'Acción no válida.');
      return;
    }

    const { type: targetType, decision: targetDecision, targetId } = parsed;
    const stored = state.messages[`${targetType}:${targetId}`];
    const kind = resolveTelegramKind(targetType, targetId, stored?.text);
    console.log(
      `[Telegram] Callback ${targetDecision === 'accept' ? 'Confirmar' : 'Rechazar'} · ${kind} (${targetType}) · ${targetId}`
    );
    const actionId = `${targetType}:${targetDecision}:${targetId}`;
    const alreadyProcessed = state.actions.some((action) => action.id === actionId);
    if (alreadyProcessed) {
      await answerCallback(callbackQuery.id, 'Esta acción ya fue procesada.');
      return;
    }

    state.actions.push({
      id: actionId,
      type: targetType,
      targetId,
      decision: targetDecision,
      at: Date.now(),
    });
    saveState();

    // Respuesta inmediata a Telegram para que el botón deje de cargar,
    // con el texto exacto según sea cita o pedido.
    await answerCallback(callbackQuery.id, buildDecisionLine(kind, targetDecision));

    if (stored) {
      const updatedText = `${stored.text}\n\n${buildDecisionLine(kind, targetDecision)}`;
      try {
        await callTelegram('editMessageText', {
          chat_id: stored.chatId,
          message_id: stored.messageId,
          text: updatedText,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: { inline_keyboard: [] },
        });
        stored.text = updatedText;
        saveState();
      } catch (err: any) {
        console.warn('[Telegram] No se pudo actualizar el mensaje:', err?.message || err);
      }
    }
  };

  const handleMessage = async (message: any) => {
    const chatId = message?.chat?.id ? String(message.chat.id) : '';
    if (!chatId) return;

    // Solo se vincula el primer chat (o el configurado en .env).
    if (state.chatId && state.chatId !== chatId) return;

    const isNewLink = state.chatId !== chatId;
    state.chatId = chatId;
    saveState();

    const text = String(message?.text || '').trim().toLowerCase();
    if (text === '/start' || text === '/vincular' || isNewLink) {
      try {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text:
            '✅ <b>Chat vinculado a Gabee Studio</b>\n\n' +
            'Recibirás aquí las notificaciones de <b>compras de tienda</b> y <b>recargas de BeeCoins</b> con sus botones de aprobación.\n\n' +
            `Tu chat ID es <code>${chatId}</code>.`,
          parse_mode: 'HTML',
        });
      } catch (err: any) {
        console.warn('[Telegram] No se pudo responder al mensaje:', err?.message || err);
      }
    }
  };

  const pollOnce = async () => {
    const updates: any[] = await callTelegram('getUpdates', {
      offset: state.offset,
      timeout: 0,
      allowed_updates: ['message', 'callback_query'],
    });
    if (!Array.isArray(updates) || updates.length === 0) return;

    for (const update of updates) {
      await processTelegramUpdate(update);
    }
    saveState();
  };
    const runPoll = async () => {
      if (pollInFlight) return;
      pollInFlight = true;
      const started = Date.now();
      try {
        await pollOnce();
        health.lastPollAt = Date.now();
        health.lastError = null;
        health.pollerId = pollerId;
        errorStreak = 0;
      } catch (err: any) {
        errorStreak += 1;
        health.lastError = err?.message || String(err);
        health.pollerId = pollerId;
        if (errorStreak === 1 || errorStreak % 20 === 0) {
          console.warn('[Telegram] Polling:', err?.message || err);
        }
      } finally {
        pollInFlight = false;
        if (Date.now() - started > 30000) {
          console.warn('[Telegram] Poll lenta:', Date.now() - started, 'ms');
        }
      }
    };

  const startPolling = () => {
    if (!token) return;
    const registry = globalThis as any;

    if (registry.__gabeeTelegramInterval) {
      console.log('[Telegram] Poller ya activo, se reutiliza');
      return;
    }

    registry.__gabeeTelegramStopPolling = () => {
      if (registry.__gabeeTelegramInterval) {
        clearInterval(registry.__gabeeTelegramInterval);
        registry.__gabeeTelegramInterval = null;
      }
    };

    void runPoll();
    registry.__gabeeTelegramInterval = setInterval(() => {
      void runPoll();
    }, 2000);
    if (typeof (registry.__gabeeTelegramInterval as any).unref === 'function') {
      (registry.__gabeeTelegramInterval as any).unref();
    }
    console.log('[Telegram] Poller iniciado', pollerId);
  };

  const stopPolling = () => {
    const registry = globalThis as any;
    if (typeof registry.__gabeeTelegramStopPolling === 'function') {
      registry.__gabeeTelegramStopPolling();
      delete registry.__gabeeTelegramStopPolling;
    }
  };

  // En serverless no hay intervalos persistentes: el polling se dispara desde
  // /api/telegram/actions (que el frontend ya consulta cada segundo), con throttle.
  const pollOnceThrottled = async (): Promise<void> => {
    if (!token) return;
    const now = Date.now();
    if (now - lastPollRequestAt < 2000) return;
    lastPollRequestAt = now;
    await runPoll();
  };

  const status = () => ({
    configured: Boolean(token),
    chatLinked: Boolean(resolveChatId()),
    chatId: resolveChatId() || null,
    lastPollAt: health.lastPollAt,
    lastError: health.lastError,
    pendingActions: state.actions.length,
  });

  const actions = () => ({ actions: state.actions.slice(-MAX_ACTIONS) });

  const notifyStoreOrder = async (req: ApiRequest, res: ApiResponse): Promise<void> => {
        try {
          const { data: parsed } = await readJsonBody(req);
          const order: OrderPayload = parsed?.order;
          if (!order?.id) {
            sendJson(res, 400, { success: false, error: 'Falta el ID de la orden.' });
            return;
          }
          const text = buildStoreMessage(order);
          const targetId = order.code || order.id;
          const result = await sendMessage(text, [
            [
              { text: '✅ Confirmar', callback_data: `confirm_order_${targetId}` },
              { text: '❌ Rechazar', callback_data: `cancel_order_${targetId}` },
            ],
          ]);
          if (!result.ok) {
            sendJson(res, 200, { success: false, linked: false, warning: result.message });
            return;
          }
          registerMessage('store', targetId, text, result.message);
          sendJson(res, 200, { success: true });
        } catch (err: any) {
          console.error('[Telegram · Tienda]', err?.message || err);
          sendJson(res, 500, { success: false, error: err?.message || 'Error al notificar la compra.' });
        }
  };

  const notifyRecharge = async (req: ApiRequest, res: ApiResponse): Promise<void> => {
        try {
          const { data: parsed } = await readJsonBody(req);
          const recharge: RechargePayload = parsed?.recharge;
          if (!recharge?.id) {
            sendJson(res, 400, { success: false, error: 'Falta el ID de la recarga.' });
            return;
          }
          const text = buildRechargeMessage(recharge);
          const targetId = recharge.id;
          const result = await sendMessage(text, [
            [
              { text: '✅ Confirmar', callback_data: `confirm_recharge_${targetId}` },
              { text: '❌ Rechazar', callback_data: `cancel_recharge_${targetId}` },
            ],
          ]);
          if (!result.ok) {
            sendJson(res, 200, { success: false, linked: false, warning: result.message });
            return;
          }
          registerMessage('recharge', targetId, text, result.message);
          sendJson(res, 200, { success: true });
        } catch (err: any) {
          console.error('[Telegram · Recarga]', err?.message || err);
          sendJson(res, 500, { success: false, error: err?.message || 'Error al notificar la recarga.' });
        }
  };

  const notifyAppointment = async (req: ApiRequest, res: ApiResponse): Promise<void> => {
        try {
          const { data: parsed } = await readJsonBody(req);
          const appointment: AppointmentPayload = parsed?.appointment;
          if (!appointment?.id) {
            sendJson(res, 400, { success: false, error: 'Falta el ID de la cita/pedido.' });
            return;
          }
          const text = buildAppointmentMessage(appointment);
          const targetId = appointment.code || appointment.id;
          const result = await sendMessage(text, [
            [
              { text: '✅ Confirmar', callback_data: `confirm_appointment_${targetId}` },
              { text: '❌ Rechazar', callback_data: `cancel_appointment_${targetId}` },
            ],
          ]);
          if (!result.ok) {
            sendJson(res, 200, { success: false, linked: result.linked === true, warning: result.message });
            return;
          }
          registerMessage('appointment', targetId, text, result.message);
          sendJson(res, 200, { success: true });
        } catch (err: any) {
          console.error('[Telegram · Cita/Pedido]', err?.message || err);
          sendJson(res, 500, { success: false, error: err?.message || 'Error al notificar la cita/pedido.' });
        }
  };

  singleton = {
    status,
    actions,
    notifyStoreOrder,
    notifyRecharge,
    notifyAppointment,
    pollOnceThrottled,
    startPolling,
    stopPolling,
  };
  return singleton;
}
