import type { Appointment, BeeCoinRechargeRequest, StoreOrder } from '../types';

/**
 * Cliente del puente de ventas con Telegram.
 * Las credenciales del bot permanecen exclusivamente en el servidor (.env).
 */

export type TelegramDecision = 'accept' | 'reject';
export type TelegramTargetType = 'store' | 'recharge' | 'appointment';

export interface TelegramAction {
  id: string;
  type: TelegramTargetType;
  targetId: string;
  decision: TelegramDecision;
  at: number;
}

async function postJson(path: string, payload: Record<string, unknown>, retries = 2): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) return true;
      if (response.ok && data && data.success === false) {
        // Vinculación pendiente u otro aviso del servidor: no reintentar en bucle innecesario, pero registrar.
        console.warn(`[Telegram] ${path} respondió sin éxito:`, data?.warning || data?.error || data);
        return false;
      }
      if (response.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      console.warn(`[Telegram] Falló POST ${path}:`, response.status, data);
      return false;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      console.warn(`[Telegram] Error enviando notificación a ${path}:`, err);
      return false;
    }
  }
  return false;
}

export function notifyTelegramStoreOrder(order: StoreOrder): Promise<boolean> {
  return postJson('/api/telegram/store-order', {
    order: {
      id: order.id,
      code: order.code,
      createdAt: order.createdAt,
      clientName: order.clientName,
      clientEmail: order.clientEmail,
      clientPhone: order.clientPhone,
      totalSoles: order.totalSoles ?? order.totalAmount ?? 0,
      paymentMethod: order.paymentMethod,
      operationNumber: order.operationNumber,
      deliveryType: order.deliveryType,
      items: (order.items || []).map((item) => ({
        name: item.productName || item.name || 'Producto',
        quantity: item.quantity,
        price: item.price,
      })),
    },
  });
}

export function notifyTelegramRecharge(recharge: BeeCoinRechargeRequest): Promise<boolean> {
  return postJson('/api/telegram/recharge', {
    recharge: {
      id: recharge.id,
      userName: recharge.userName,
      userEmail: recharge.userEmail,
      userPhone: recharge.userPhone,
      packageName: recharge.packageName,
      coinsAmount: recharge.coinsAmount,
      priceSoles: recharge.priceSoles,
      paymentMethod: recharge.paymentMethod,
      operationNumber: recharge.operationNumber,
    },
  });
}

export function notifyTelegramAppointment(appointment: Appointment): Promise<boolean> {
  return postJson('/api/telegram/appointment', {
    appointment: {
      id: appointment.id,
      code: appointment.code,
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      clientEmail: appointment.clientEmail,
      clientInstagram: appointment.clientInstagram,
      serviceType: appointment.serviceType,
      serviceName: appointment.serviceName,
      system: appointment.customDetails?.system || null,
      promoDesignTitle: appointment.promoDesignTitle,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      locationType: appointment.locationType,
      homeAddress: appointment.homeAddress,
      homeReference: appointment.homeReference,
      totalPrice: appointment.totalPrice,
      depositRequired: appointment.depositRequired,
      paymentMethod: appointment.paymentMethod,
      operationNumber: appointment.paymentOperationNumber,
      additionals: appointment.additionals || [],
      notes: appointment.notes,
      pressOnDetails: appointment.pressOnDetails || null,
      status: appointment.status,
    },
  });
}

export async function fetchTelegramActions(): Promise<TelegramAction[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch('/api/telegram/actions', {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json().catch(() => null);
    return Array.isArray(data?.actions) ? (data.actions as TelegramAction[]) : [];
  } catch {
    return [];
  }
}
