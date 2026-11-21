import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from './firebaseConfig';
import {
  Appointment,
  PromoDesign,
  StudioSettings,
  InventoryItem,
  ServiceItem,
  PressOnItem,
  CourseItem,
  UserProfile,
  BeeCoinRechargeRequest,
  StoreOrder,
  ReviewItem,
} from '../types';
import { AdditionalItem } from '../data/additionalsData';
import { SEED_REVIEW_IDS } from '../utils/reviewUtils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// CRITICAL: The app will break without firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using offline cache.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// Appointments Services
// -------------------------------------------------------------

export function subscribeToAppointments(
  onData: (appointments: Appointment[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'appointments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Appointment, 'id'>) });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      console.error('Snapshot appointments error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    }
  );
}

export async function saveAppointmentToFirestore(appointment: Appointment): Promise<void> {
  const path = `appointments/${appointment.id}`;
  try {
    const docRef = doc(db, 'appointments', appointment.id);
    const dataToSave = { ...appointment };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteAppointmentFromFirestore(id: string): Promise<void> {
  const path = `appointments/${id}`;
  try {
    await deleteDoc(doc(db, 'appointments', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

// -------------------------------------------------------------
// Promo Designs Catalog Services
// -------------------------------------------------------------

export function subscribeToPromoDesigns(
  onData: (designs: PromoDesign[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'promo_designs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PromoDesign[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<PromoDesign, 'id'>) });
      });
      onData(list);
    },
    (error) => {
      console.warn('Snapshot promo_designs warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function savePromoDesignToFirestore(design: PromoDesign): Promise<void> {
  const path = `promo_designs/${design.id}`;
  try {
    const docRef = doc(db, 'promo_designs', design.id);
    await setDoc(docRef, design, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deletePromoDesignFromFirestore(id: string): Promise<void> {
  const path = `promo_designs/${id}`;
  try {
    await deleteDoc(doc(db, 'promo_designs', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

export async function batchSaveInitialDesigns(designs: PromoDesign[]): Promise<void> {
  for (const d of designs) {
    await savePromoDesignToFirestore(d);
  }
}

// -------------------------------------------------------------
// Studio Settings Services
// -------------------------------------------------------------

export function subscribeToSettings(
  onData: (settings: StudioSettings) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'studio');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as StudioSettings);
      }
    },
    (error) => {
      console.warn('Snapshot settings warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveSettingsToFirestore(settings: StudioSettings): Promise<void> {
  const path = 'settings/studio';
  try {
    const docRef = doc(db, 'settings', 'studio');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.warn(`Firestore settings write warning for ${path}:`, error);
  }
}

// -------------------------------------------------------------
// Inventory Items Services
// -------------------------------------------------------------

export function subscribeToInventoryItems(
  onData: (items: InventoryItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'inventory_items');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<InventoryItem, 'id'>) });
      });
      onData(list);
    },
    (error) => {
      console.warn('Snapshot inventory_items warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveInventoryItemToFirestore(item: InventoryItem): Promise<void> {
  const path = `inventory_items/${item.id}`;
  try {
    const docRef = doc(db, 'inventory_items', item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteInventoryItemFromFirestore(id: string): Promise<void> {
  const path = `inventory_items/${id}`;
  try {
    await deleteDoc(doc(db, 'inventory_items', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

export async function batchSaveInitialInventory(items: InventoryItem[]): Promise<void> {
  for (const item of items) {
    await saveInventoryItemToFirestore(item);
  }
}

// -------------------------------------------------------------
// Services Catalog Services
// -------------------------------------------------------------

export function subscribeToServicesCatalog(
  onData: (services: ServiceItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'services_catalog');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ServiceItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ServiceItem, 'id'>) });
      });
      onData(list);
    },
    (error) => {
      console.warn('Snapshot services_catalog warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveServiceItemToFirestore(item: ServiceItem): Promise<void> {
  const path = `services_catalog/${item.id}`;
  try {
    const docRef = doc(db, 'services_catalog', item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteServiceItemFromFirestore(id: string): Promise<void> {
  const path = `services_catalog/${id}`;
  try {
    await deleteDoc(doc(db, 'services_catalog', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

export async function batchSaveInitialServices(services: ServiceItem[]): Promise<void> {
  for (const s of services) {
    await saveServiceItemToFirestore(s);
  }
}

// -------------------------------------------------------------
// Press-On Nails Catalog Services
// -------------------------------------------------------------

export function subscribeToPressOnCatalog(
  onData: (items: PressOnItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'press_on_catalog');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PressOnItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<PressOnItem, 'id'>) });
      });
      onData(list);
    },
    (error) => {
      console.warn('Snapshot press_on_catalog warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function savePressOnItemToFirestore(item: PressOnItem): Promise<void> {
  const path = `press_on_catalog/${item.id}`;
  try {
    const docRef = doc(db, 'press_on_catalog', item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deletePressOnItemFromFirestore(id: string): Promise<void> {
  const path = `press_on_catalog/${id}`;
  try {
    await deleteDoc(doc(db, 'press_on_catalog', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

export async function batchSaveInitialPressOn(items: PressOnItem[]): Promise<void> {
  for (const item of items) {
    await savePressOnItemToFirestore(item);
  }
}

// -------------------------------------------------------------
// Additionals Services
// -------------------------------------------------------------

export function subscribeToAdditionals(
  onData: (items: AdditionalItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'additionals');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AdditionalItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<AdditionalItem, 'id'>) });
      });
      onData(list);
    },
    (error) => {
      console.warn('Snapshot additionals warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveAdditionalItemToFirestore(item: AdditionalItem): Promise<void> {
  const path = `additionals/${item.id}`;
  try {
    const docRef = doc(db, 'additionals', item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteAdditionalItemFromFirestore(id: string): Promise<void> {
  const path = `additionals/${id}`;
  try {
    await deleteDoc(doc(db, 'additionals', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

export async function batchSaveInitialAdditionals(items: AdditionalItem[]): Promise<void> {
  for (const item of items) {
    await saveAdditionalItemToFirestore(item);
  }
}

// -------------------------------------------------------------
// Store Orders Services
// -------------------------------------------------------------

export function subscribeToStoreOrders(
  onData: (orders: StoreOrder[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'store_orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: StoreOrder[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<StoreOrder, 'id'>) });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error: any) => {
      const msg = error?.message || String(error);
      const isPermissionError =
        error?.code === 'permission-denied' ||
        msg.toLowerCase().includes('missing or insufficient permissions');

      if (!isPermissionError) {
        console.warn('Snapshot store_orders warning:', error);
      }
      if (onError) onError(error);
    }
  );
}

export async function saveStoreOrderToFirestore(order: StoreOrder): Promise<void> {
  const path = `store_orders/${order.id}`;
  try {
    const docRef = doc(db, 'store_orders', order.id);
    const cleanOrder = Object.fromEntries(
      Object.entries(order).filter(([_, v]) => v !== undefined)
    );
    await setDoc(docRef, cleanOrder, { merge: true });
  } catch (error: any) {
    const msg = error?.message || String(error);
    const isPermissionError =
      error?.code === 'permission-denied' ||
      msg.toLowerCase().includes('missing or insufficient permissions');

    // Only log if it's an unexpected non-permission error
    if (!isPermissionError) {
      console.warn(`Firestore write warning for ${path}:`, error);
    }
  }
}

export async function deleteStoreOrderFromFirestore(id: string): Promise<void> {
  const path = `store_orders/${id}`;
  try {
    await deleteDoc(doc(db, 'store_orders', id));
  } catch (error: any) {
    const msg = error?.message || String(error);
    const isPermissionError =
      error?.code === 'permission-denied' ||
      msg.toLowerCase().includes('missing or insufficient permissions');

    if (!isPermissionError) {
      console.warn(`Firestore delete warning for ${path}:`, error);
    }
  }
}

// -------------------------------------------------------------
// User Profiles Services
// -------------------------------------------------------------

export function subscribeToUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<UserProfile, 'id'>) });
      });
      onData(list);
    },
    (error) => {
      console.warn('Snapshot users warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteUserFromFirestore(id: string): Promise<void> {
  const path = `users/${id}`;
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

// -------------------------------------------------------------
// Recharge Requests Services
// -------------------------------------------------------------

export function subscribeToRecharges(
  onData: (recharges: BeeCoinRechargeRequest[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'recharge_requests');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: BeeCoinRechargeRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<BeeCoinRechargeRequest, 'id'>) });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      console.warn('Snapshot recharge_requests warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveRechargeToFirestore(recharge: BeeCoinRechargeRequest): Promise<void> {
  const path = `recharge_requests/${recharge.id}`;
  try {
    const docRef = doc(db, 'recharge_requests', recharge.id);
    await setDoc(docRef, recharge, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteRechargeFromFirestore(id: string): Promise<void> {
  const path = `recharge_requests/${id}`;
  try {
    await deleteDoc(doc(db, 'recharge_requests', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

// -------------------------------------------------------------
// Courses Items Services
// -------------------------------------------------------------

export function subscribeToCourses(
  onData: (items: CourseItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'courses_items');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: CourseItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CourseItem, 'id'>) });
      });
      onData(list);
    },
    (error) => {
      console.warn('Snapshot courses_items warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveCourseItemToFirestore(item: CourseItem): Promise<void> {
  const path = `courses_items/${item.id}`;
  try {
    const docRef = doc(db, 'courses_items', item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteCourseItemFromFirestore(id: string): Promise<void> {
  const path = `courses_items/${id}`;
  try {
    await deleteDoc(doc(db, 'courses_items', id));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

export async function batchSaveInitialCourses(items: CourseItem[]): Promise<void> {
  for (const it of items) {
    await saveCourseItemToFirestore(it);
  }
}

// -------------------------------------------------------------
// Reviews & Testimonials Services
// -------------------------------------------------------------

export function subscribeToReviews(
  onData: (items: ReviewItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'reviews_catalog');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ReviewItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ReviewItem, 'id'>) });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      console.warn('Snapshot reviews_catalog warning:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveReviewItemToFirestore(item: ReviewItem): Promise<void> {
  const path = `reviews_catalog/${item.id}`;
  try {
    const docRef = doc(db, 'reviews_catalog', item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteReviewItemFromFirestore(id: string): Promise<boolean> {
  const path = `reviews_catalog/${id}`;
  try {
    await deleteDoc(doc(db, 'reviews_catalog', id));
    return true;
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
    return false;
  }
}

/** Elimina TODAS las reseñas remotas (y cualquier ID pendiente localmente). */
export async function clearAllReviewsFromFirestore(idsToClear: string[] = []): Promise<void> {
  try {
    const ids = new Set<string>(idsToClear);
    const snapshot = await getDocs(collection(db, 'reviews_catalog'));
    snapshot.forEach((docSnap) => ids.add(docSnap.id));
    await Promise.all(Array.from(ids).map((id) => deleteReviewItemFromFirestore(id)));
  } catch (error) {
    console.warn('Firestore clear reviews warning:', error);
  }
}

/** Purga los documentos semilla del antiguo catálogo si aún existen en Firestore. */
export async function deleteSeedReviewsFromFirestore(): Promise<void> {
  await Promise.all(
    SEED_REVIEW_IDS.map(async (id) => {
      try {
        await deleteDoc(doc(db, 'reviews_catalog', id));
      } catch (error) {
        console.warn(`Firestore seed cleanup warning for reviews_catalog/${id}:`, error);
      }
    })
  );
}


