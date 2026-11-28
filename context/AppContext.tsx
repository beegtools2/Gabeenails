import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  PromoDesign,
  CustomServiceConfig,
  Appointment,
  StudioSettings,
  ServiceType,
  PressOnItem,
  ServiceItem,
  UserProfile,
  BeeCoinRechargeRequest,
  RechargeStatus,
  InventoryItem,
  StoreOrder,
  CourseItem,
  ReviewItem,
  CatbeeKnowledgeItem,
  CatbeeConfig,
} from '../types';

import {
  INITIAL_SETTINGS,
  PROMO_CATALOG_DESIGNS,
  INITIAL_SAMPLE_APPOINTMENTS,
  NAIL_SHAPES,
  NAIL_LENGTHS,
  INITIAL_PRESS_ON_ITEMS,
  INITIAL_SERVICES_CATALOG,
  INITIAL_INVENTORY_DATA,
  INITIAL_COURSES_DATA,
  DEFAULT_CATBEE_CONFIG,
  INITIAL_CATBEE_KNOWLEDGE,
  REMOVAL_SERVICE_OPTIONS,
} from '../data/catalogData';

import { ADDITIONALS_DATA, AdditionalItem } from '../data/additionalsData';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/storageUtils';
import {
  isSupabaseStateConfigured,
  loadSiteStateFromSupabase,
  saveSiteStateToSupabase,
} from '../services/supabaseStateService';

function syncAppStateToSupabase(key: string, value: unknown): void {
  if (!isSupabaseStateConfigured()) return;
  void saveSiteStateToSupabase(`app_state:${key}`, value);
}

import {
  SEED_REVIEW_IDS,
  markReviewsAsDeleted,
  unmarkReviewsAsDeleted,
  sanitizeReviews,
} from '../utils/reviewUtils';
import {
  DEFAULT_ADMIN_PASSWORD,
  persistAdminPassword,
} from '../utils/adminPasswordUtils';
import { getStoredSpreadsheetId } from '../services/googleSheetsService';
import {
  subscribeToAppointments,
  saveAppointmentToFirestore,
  deleteAppointmentFromFirestore,
  subscribeToPromoDesigns,
  subscribeToSettings,
  subscribeToStoreOrders,
  saveStoreOrderToFirestore,
  deleteStoreOrderFromFirestore,
  subscribeToUsers,
  saveUserToFirestore,
  deleteUserFromFirestore,
  subscribeToRecharges,
  saveRechargeToFirestore,
  subscribeToReviews,
  saveReviewItemToFirestore,
  deleteReviewItemFromFirestore,
  clearAllReviewsFromFirestore,
  deleteSeedReviewsFromFirestore,
} from '../services/firebase';
import { renderWhatsAppTemplate, getWhatsAppTemplate } from '../utils/whatsappTemplateUtils';
import {
  fetchTelegramActions,
  notifyTelegramAppointment,
  notifyTelegramRecharge,
  notifyTelegramStoreOrder,
} from '../services/telegramService';

interface AppContextType {
  currentView: 'home' | 'promotions' | 'custom' | 'admin';
  setCurrentView: (view: 'home' | 'promotions' | 'custom' | 'admin') => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  showTermsModal: boolean;
  setShowTermsModal: (show: boolean) => void;
  flipbookType: 'terms' | 'benefits' | null;
  openFlipbook: (type: 'terms' | 'benefits') => void;
  closeFlipbook: () => void;
  showGuideModal: boolean;
  setShowGuideModal: (show: boolean) => void;
  isCoursesModalOpen: boolean;
  setIsCoursesModalOpen: (open: boolean) => void;
  isPressOnModalOpen: boolean;
  setIsPressOnModalOpen: (open: boolean) => void;
  pressOnInitialTab: 'catalog' | 'custom';
  pressOnInitialSetIdx: number;
  pressOnInitialStep: number;
  selectedPressOnPromoItem: PressOnItem | PromoDesign | null;
  setSelectedPressOnPromoItem: (item: PressOnItem | PromoDesign | null) => void;
  openPressOnModal: (
    tab?: 'catalog' | 'custom',
    initialSetIdx?: number,
    initialStep?: number,
    promoItem?: PressOnItem | PromoDesign | null
  ) => void;

  isPromoPressOnModalOpen: boolean;
  setIsPromoPressOnModalOpen: (open: boolean) => void;
  selectedPromoPressOnDesign: PromoDesign | null;
  setSelectedPromoPressOnDesign: (design: PromoDesign | null) => void;
  openPromoPressOnModal: (design: PromoDesign) => void;
  closePromoPressOnModal: () => void;

  pressOnCatalog: PressOnItem[];
  addPressOnItem: (item: Omit<PressOnItem, 'id'>) => void;
  updatePressOnItem: (id: string, updates: Partial<PressOnItem>) => void;
  deletePressOnItem: (id: string) => void;
  resetPressOnCatalog: () => void;

  servicesCatalog: ServiceItem[];
  addServiceItem: (item: Omit<ServiceItem, 'id'>) => void;
  updateServiceItem: (id: string, updates: Partial<ServiceItem>) => void;
  deleteServiceItem: (id: string) => void;
  resetServicesCatalog: () => void;

  showAdditionalsModal: boolean;
  setShowAdditionalsModal: (show: boolean) => void;
  selectedAdditionals: string[];
  toggleAdditional: (id: string) => void;
  clearAdditionals: () => void;
  additionalsTotal: number;
  additionalsList: AdditionalItem[];
  addAdditionalItem: (item: Omit<AdditionalItem, 'id'>) => void;
  updateAdditionalItem: (id: string, updates: Partial<AdditionalItem>) => void;
  deleteAdditionalItem: (id: string) => void;
  resetAdditionalsList: () => void;

  inventoryList: InventoryItem[];
  saveAndSetInventory: (updatedList: InventoryItem[]) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => InventoryItem;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  resetInventoryList: () => void;

  coursesList: CourseItem[];
  addCourseItem: (item: Omit<CourseItem, 'id'>) => CourseItem;
  updateCourseItem: (id: string, updates: Partial<CourseItem>) => void;
  deleteCourseItem: (id: string) => void;
  resetCoursesList: () => void;
  selectedCourseItem: CourseItem | null;
  setSelectedCourseItem: (item: CourseItem | null) => void;
  isCourseModalOpen: boolean;
  setIsCourseModalOpen: (open: boolean) => void;
  openCourseModal: (item: CourseItem) => void;
  closeCourseModal: () => void;

  reviewsList: ReviewItem[];
  addReviewItem: (item: Omit<ReviewItem, 'id' | 'createdAt'>) => ReviewItem;
  updateReviewItem: (id: string, updates: Partial<ReviewItem>) => void;
  deleteReviewItem: (id: string) => void;
  resetReviewsList: () => void;
  reviewedTargetIds: string[];
  markTargetAsReviewed: (targetId: string) => void;

  isBookingOpen: boolean;
  openBooking: (serviceType: ServiceType, promoId?: string, preloadedSystem?: string) => void;
  closeBooking: () => void;
  bookingServiceType: ServiceType;
  selectedPromoForBooking: PromoDesign | null;

  promoDesigns: PromoDesign[];
  selectedPromoForDetails: PromoDesign | null;
  setSelectedPromoForDetails: (promo: PromoDesign | null) => void;
  addPromoDesign: (design: Omit<PromoDesign, 'id'>) => void;
  updatePromoDesign: (id: string, updates: Partial<PromoDesign>) => void;
  deletePromoDesign: (id: string) => void;

  customConfig: CustomServiceConfig;
  setCustomConfig: React.Dispatch<React.SetStateAction<CustomServiceConfig>>;
  resetCustomConfig: () => void;

  appointments: Appointment[];
  createAppointment: (
    appointmentData: Omit<Appointment, 'id' | 'code' | 'createdAt'>,
    options?: { notifyTelegram?: boolean }
  ) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Appointment | undefined;
  updateAppointmentStatus: (id: string, status: Appointment['status'], depositPaid?: boolean) => void;
  deleteAppointment: (id: string) => void;
  clearCancelledAppointments: () => void;

  settings: StudioSettings;
  updateSettings: (newSettings: Partial<StudioSettings>) => void;
  resetSettings: () => void;

  generateWhatsAppLink: (appointment: Appointment) => string;

  googleUser: any | null;
  googleAccessToken: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncingSheets: boolean;
  connectGoogleSheets: () => Promise<void>;
  disconnectGoogleSheets: () => Promise<void>;
  syncAllToGoogleSheets: () => Promise<void>;

  isFirestoreConnected: boolean;

  allUsers: UserProfile[];
  currentUser: UserProfile | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  accountModalTab: 'profile' | 'history' | 'wallet';
  setAccountModalTab: (tab: 'profile' | 'history' | 'wallet') => void;
  accountModalMode: 'login' | 'register';
  setAccountModalMode: (mode: 'login' | 'register') => void;
  openAccountModal: (tab?: 'profile' | 'history' | 'wallet', initialMode?: 'login' | 'register') => void;
  isRouletteModalOpen: boolean;
  setIsRouletteModalOpen: (open: boolean) => void;
  registerUser: (
    data: Omit<
      UserProfile,
      'id' | 'beeCoins' | 'isVip' | 'visitsCount' | 'stampsCount' | 'consecutivePromoMonths' | 'promoPauseHistory' | 'rouletteSpun' | 'createdAt'
    >
  ) => UserProfile;
  loginUser: (phoneOrEmail: string, pass?: string) => UserProfile | null;
  logoutUser: () => void;
  updateUserProfile: (updatedUser: UserProfile) => void;
  deleteUserAccount: (userId: string) => void;
  updateUserCoinsAndVisits: (userId: string, newCoins: number, newVisits: number) => void;
  purchaseBeeCoins: (coinsAmount: number, priceSoles?: number) => void;
  spinRoulette: (prizeName: string) => { prize: string; token: string };

  rechargeRequests: BeeCoinRechargeRequest[];
  requestBeeCoinRecharge: (data: Omit<BeeCoinRechargeRequest, 'id' | 'status' | 'createdAt'>) => BeeCoinRechargeRequest;
  approveBeeCoinRecharge: (rechargeId: string) => void;
  rejectBeeCoinRecharge: (rechargeId: string) => void;
  recordOperationCode: (code: string, source?: 'recharge' | 'store_order' | 'appointment', userId?: string) => void;

  isStoreModalOpen: boolean;
  setIsStoreModalOpen: (open: boolean) => void;
  storeOrders: StoreOrder[];
  createStoreOrder: (data: Omit<StoreOrder, 'id' | 'code' | 'createdAt' | 'status'>) => StoreOrder;
  updateStoreOrderStatus: (
    orderId: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'delivered' | 'completed' | 'packing' | 'shipped'
  ) => void;
  updateStoreOrder: (orderId: string, updates: Partial<StoreOrder>) => void;
  deleteStoreOrder: (orderId: string) => void;

  catbeeConfig: CatbeeConfig;
  updateCatbeeConfig: (newConfig: Partial<CatbeeConfig>) => void;
  resetCatbeeConfig: () => void;
  catbeeKnowledge: CatbeeKnowledgeItem[];
  addCatbeeKnowledge: (item: Omit<CatbeeKnowledgeItem, 'id' | 'updatedAt'>) => CatbeeKnowledgeItem;
  updateCatbeeKnowledge: (id: string, updates: Partial<CatbeeKnowledgeItem>) => void;
  deleteCatbeeKnowledge: (id: string) => void;
  resetCatbeeKnowledge: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'gabee_nail_studio_settings_v1';
const PROMOS_STORAGE_KEY = 'gabee_nail_studio_promos_v1';
const APPOINTMENTS_STORAGE_KEY = 'gabee_nail_studio_appointments_v1';
const ADDITIONALS_STORAGE_KEY = 'gabee_nail_studio_additionals_v1';
const SPREADSHEET_URL_STORAGE_KEY = 'gabee_google_spreadsheet_url_v1';
const PRESS_ON_STORAGE_KEY = 'gabee_press_on_catalog_v2';
const SERVICES_CATALOG_STORAGE_KEY = 'gabee_services_catalog_v3';
const USER_ACCOUNT_STORAGE_KEY = 'gabee_nail_studio_current_user_v1';
const ALL_USERS_STORAGE_KEY = 'gabee_nail_studio_all_users_v1';
const DELETED_USER_IDS_STORAGE_KEY = 'gabee_deleted_user_ids_v1';
const GABEE_STUDIO_INVENTORY_KEY = 'gabee_studio_inventory';
const COURSES_STORAGE_KEY = 'gabee_studio_courses_v1';
const REVIEWS_STORAGE_KEY = 'gabee_reviews_catalog_v1';
const REVIEWED_TARGETS_STORAGE_KEY = 'gabee_reviewed_target_ids_v1';
const CATBEE_CONFIG_STORAGE_KEY = 'gabee_catbee_config_v1';
const CATBEE_KNOWLEDGE_STORAGE_KEY = 'gabee_catbee_knowledge_v1';
const STORE_ORDERS_STORAGE_KEY = 'gabee_nail_studio_store_orders_v1';
const TELEGRAM_APPLIED_ACTIONS_KEY = 'gabee_telegram_applied_actions_v1';
const RECHARGES_STORAGE_KEY = 'gabee_beecoin_recharges_v1';

const INITIAL_SAMPLE_STORE_ORDERS: StoreOrder[] = [
  {
    id: 'ord-sample-5245',
    code: 'TG26_5245',
    clientName: 'ROSA POLO',
    clientPhone: '923547594',
    clientEmail: 'rosa.polo@gmail.com',
    items: [
      {
        productId: 'inv-1',
        productName: 'ESPONJAS FRUTALES',
        price: 8.0,
        quantity: 1,
        image: '/assets/aistudio/PO_1_f5e6a392.JPG',
      },
    ],
    totalSoles: 8.0,
    totalAmount: 8.0,
    beeCoinsUsed: 0,
    paymentMethod: 'yape',
    operationNumber: '3223455',
    status: 'pending',
    createdAt: new Date().toISOString(),
    userId: 'usr-sample-1',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<'home' | 'promotions' | 'custom' | 'admin'>('home');
  const [isAdmin, setIsAdmin] = useState(false);

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const raw = safeGetLocalStorage<UserProfile[]>(ALL_USERS_STORAGE_KEY, []);
    const deletedIds = safeGetLocalStorage<string[]>(DELETED_USER_IDS_STORAGE_KEY, []);
    return raw.filter((u) => !deletedIds.includes(u.id));
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const active = safeGetLocalStorage<UserProfile | null>(USER_ACCOUNT_STORAGE_KEY, null);
    if (!active) return null;
    const deletedIds = safeGetLocalStorage<string[]>(DELETED_USER_IDS_STORAGE_KEY, []);
    if (deletedIds.includes(active.id)) {
      localStorage.removeItem(USER_ACCOUNT_STORAGE_KEY);
      sessionStorage.removeItem(USER_ACCOUNT_STORAGE_KEY);
      return null;
    }
    return active;
  });

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'profile' | 'history' | 'wallet'>('profile');
  const [accountModalMode, setAccountModalMode] = useState<'login' | 'register'>('login');
  const [isRouletteModalOpen, setIsRouletteModalOpen] = useState(false);

  const openAccountModal = (
    tab: 'profile' | 'history' | 'wallet' = 'profile',
    initialMode?: 'login' | 'register'
  ) => {
    setAccountModalTab(tab);
    if (initialMode) {
      setAccountModalMode(initialMode);
    }
    setIsAccountModalOpen(true);
  };

  const registerUser = (
    data: Omit<
      UserProfile,
      'id' | 'beeCoins' | 'isVip' | 'visitsCount' | 'stampsCount' | 'consecutivePromoMonths' | 'promoPauseHistory' | 'rouletteSpun' | 'createdAt'
    >
  ): UserProfile => {
    const newUser: UserProfile = {
      ...data,
      id: `usr-${Date.now()}`,
      beeCoins: 0,
      isVip: false,
      visitsCount: 0,
      stampsCount: 0,
      consecutivePromoMonths: 0,
      promoPauseHistory: [],
      rouletteSpun: false,
      createdAt: new Date().toISOString(),
    };

    setAllUsers((prev) => {
      const updated = [...prev.filter((u) => u.id !== newUser.id), newUser];
      safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ALL_USERS_STORAGE_KEY, updated);
      return updated;
    });

    setCurrentUser(newUser);
    safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(newUser));
    saveUserToFirestore(newUser);
    return newUser;
  };

  const loginUser = (phoneOrEmail: string, pass?: string): UserProfile | null => {
    const clean = phoneOrEmail.trim().toLowerCase();
    const deletedIds = safeGetLocalStorage<string[]>(DELETED_USER_IDS_STORAGE_KEY, []);
    const activeUsers = allUsers.filter((u) => !deletedIds.includes(u.id));

    const found = activeUsers.find(
      (u) =>
        (u.phone && u.phone.trim().toLowerCase() === clean) ||
        (u.email && u.email.trim().toLowerCase() === clean)
    );

    if (found) {
      if (pass && found.password && found.password !== pass.trim()) {
        return null;
      }
      setCurrentUser(found);
      safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(found));
      return found;
    }
    return null;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_ACCOUNT_STORAGE_KEY);
    sessionStorage.removeItem(USER_ACCOUNT_STORAGE_KEY);
  };

  const updateUserProfile = (updatedUser: UserProfile) => {
    const visits = updatedUser.visitsCount ?? 0;
    const synchronizedUser: UserProfile = {
      ...updatedUser,
      isVip: visits >= 4,
    };

    setCurrentUser(synchronizedUser);
    safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(synchronizedUser));

    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === synchronizedUser.id);
      const updated = exists
        ? prev.map((u) => (u.id === synchronizedUser.id ? synchronizedUser : u))
        : [...prev, synchronizedUser];
      safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ALL_USERS_STORAGE_KEY, updated);
      return updated;
    });

    saveUserToFirestore(synchronizedUser);
  };

  const deleteUserAccount = (userId: string) => {
    if (!userId || !currentUser || currentUser.id === userId) {
      setCurrentUser(null);
      localStorage.removeItem(USER_ACCOUNT_STORAGE_KEY);
      sessionStorage.removeItem(USER_ACCOUNT_STORAGE_KEY);
    }

    const deletedIds = safeGetLocalStorage<string[]>(DELETED_USER_IDS_STORAGE_KEY, []);
    if (userId && !deletedIds.includes(userId)) {
      deletedIds.push(userId);
      safeSetLocalStorage(DELETED_USER_IDS_STORAGE_KEY, JSON.stringify(deletedIds));
    }

    setAllUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ALL_USERS_STORAGE_KEY, updated);
      return updated;
    });

    if (userId) {
      deleteUserFromFirestore(userId).catch(() => {});
    }
  };

  const updateUserCoinsAndVisits = (userId: string, newCoins: number, newVisits: number) => {
    const isVip = newVisits >= 4;
    const stampsCount = newVisits <= 10 ? newVisits : ((newVisits - 1) % 10) + 1;
    let modifiedUser: UserProfile | undefined;

    setAllUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          const mod: UserProfile = {
            ...u,
            beeCoins: Math.max(0, newCoins),
            visitsCount: Math.max(0, newVisits),
            stampsCount: Math.max(0, stampsCount),
            isVip,
          };
          modifiedUser = mod;
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(mod);
            safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(mod));
          }
          return mod;
        }
        return u;
      });
      safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ALL_USERS_STORAGE_KEY, updated);
      return updated;
    });

    if (modifiedUser) {
      saveUserToFirestore(modifiedUser);
    }
  };

  const purchaseBeeCoins = (coinsAmount: number) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      beeCoins: currentUser.beeCoins + coinsAmount,
    };
    setCurrentUser(updatedUser);
    safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(updatedUser));

    setAllUsers((prev) => {
      const updated = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ALL_USERS_STORAGE_KEY, updated);
      return updated;
    });

    saveUserToFirestore(updatedUser);
  };

  const spinRoulette = (prizeName: string) => {
    if (!currentUser) return { prize: prizeName, token: '' };
    const token = `RTL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const updatedUser: UserProfile = {
      ...currentUser,
      rouletteSpun: true,
      roulettePrize: prizeName,
      rouletteToken: token,
    };
    setCurrentUser(updatedUser);
    safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(updatedUser));

    setAllUsers((prev) => {
      const updated = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ALL_USERS_STORAGE_KEY, updated);
      return updated;
    });

    saveUserToFirestore(updatedUser);
    return { prize: prizeName, token };
  };

  const [rechargeRequests, setRechargeRequests] = useState<BeeCoinRechargeRequest[]>(() => {
    return safeGetLocalStorage<BeeCoinRechargeRequest[]>(RECHARGES_STORAGE_KEY, []);
  });

  const recordOperationCode = (
    code: string,
    source: 'recharge' | 'store_order' | 'appointment' = 'recharge',
    userId?: string
  ) => {
    void code;
    void source;
    void userId;
  };

  const requestBeeCoinRecharge = (
    data: Omit<BeeCoinRechargeRequest, 'id' | 'status' | 'createdAt'>
  ): BeeCoinRechargeRequest => {
    const newReq: BeeCoinRechargeRequest = {
      ...data,
      id: `rchg-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    recordOperationCode(data.operationNumber, 'recharge', data.userId);
    setRechargeRequests((prev) => {
      const updated = [newReq, ...prev];
      safeSetLocalStorage(RECHARGES_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(RECHARGES_STORAGE_KEY, updated);
      return updated;
    });
    saveRechargeToFirestore(newReq);
    void notifyTelegramRecharge(newReq);
    return newReq;
  };

  const approveBeeCoinRecharge = (rechargeId: string) => {
    setRechargeRequests((prevReqs) => {
      const target = prevReqs.find((r) => r.id === rechargeId);
      if (!target || target.status === 'approved') return prevReqs;

      setAllUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((u) => {
          const isTargetUser =
            u.id === target.userId || (u.phone && target.userPhone && u.phone === target.userPhone);
          if (isTargetUser) {
            const updatedUser = { ...u, beeCoins: (u.beeCoins || 0) + target.coinsAmount };
            if (currentUser && (currentUser.id === u.id || currentUser.phone === u.phone)) {
              setCurrentUser(updatedUser);
              safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(updatedUser));
            }
            saveUserToFirestore(updatedUser);
            return updatedUser;
          }
          return u;
        });
        safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
        syncAppStateToSupabase(ALL_USERS_STORAGE_KEY, updatedUsers);
        return updatedUsers;
      });

      const updatedRequests = prevReqs.map((r) => {
        if (r.id === rechargeId) {
          const mod = { ...r, status: 'approved' as RechargeStatus };
          saveRechargeToFirestore(mod);
          return mod;
        }
        return r;
      });
      safeSetLocalStorage(RECHARGES_STORAGE_KEY, JSON.stringify(updatedRequests));
      syncAppStateToSupabase(RECHARGES_STORAGE_KEY, updatedRequests);
      return updatedRequests;
    });
  };

  const rejectBeeCoinRecharge = (rechargeId: string) => {
    setRechargeRequests((prev) => {
      const updated = prev.map((r) => {
        if (r.id === rechargeId) {
          const mod = { ...r, status: 'rejected' as RechargeStatus };
          saveRechargeToFirestore(mod);
          return mod;
        }
        return r;
      });
      safeSetLocalStorage(RECHARGES_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(RECHARGES_STORAGE_KEY, updated);
      return updated;
    });
  };

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORE_ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const oldMaster = localStorage.getItem('gabee_master_pedidos');
      if (oldMaster) {
        const parsedOld = JSON.parse(oldMaster);
        if (Array.isArray(parsedOld) && parsedOld.length > 0) {
          safeSetLocalStorage(STORE_ORDERS_STORAGE_KEY, JSON.stringify(parsedOld));
          return parsedOld;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_SAMPLE_STORE_ORDERS;
  });

  useEffect(() => {
    try {
      const legacyKeysToRemove = [
        'gabee_master_pedidos',
        'gabee_admin_pedidos',
        'gabee_studio_persistent_orders',
        'gabee_store_orders',
        'gabee_store_orders_v1',
      ];
      legacyKeysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }, []);

  const createStoreOrder = (
    data: Omit<StoreOrder, 'id' | 'code' | 'createdAt' | 'status'>
  ): StoreOrder => {
    const yearShort = new Date().getFullYear().toString().slice(-2);
    let randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    let generatedCode = `TG${yearShort}_${randomSuffix}`;
    let attempts = 0;
    while (storeOrders.some((o) => o.code === generatedCode) && attempts < 10) {
      randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      generatedCode = `TG${yearShort}_${randomSuffix}`;
      attempts++;
    }

    const newOrder: StoreOrder = {
      ...data,
      id: `ord-${Date.now()}`,
      code: generatedCode,
      status: 'pending',
      createdAt: new Date().toISOString(),
      totalAmount: data.totalSoles,
    };

    if (data.operationNumber) {
      recordOperationCode(data.operationNumber, 'store_order', data.userId);
    }

    setStoreOrders((prevOrders) => {
      const filtered = prevOrders.filter((o) => o.id !== newOrder.id);
      const updated = [newOrder, ...filtered];
      safeSetLocalStorage(STORE_ORDERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(STORE_ORDERS_STORAGE_KEY, updated);
      return updated;
    });

    try {
      saveStoreOrderToFirestore(newOrder).catch(() => {});
    } catch {
      // Ignored
    }
    void notifyTelegramStoreOrder(newOrder);

    if (data.beeCoinsUsed > 0 && currentUser) {
      const newCoins = Math.max(0, currentUser.beeCoins - data.beeCoinsUsed);
      const updatedUser = { ...currentUser, beeCoins: newCoins };
      setCurrentUser(updatedUser);
      safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(updatedUser));
      setAllUsers((prevUsers) => {
        const updated = prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
        safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(updated));
        syncAppStateToSupabase(ALL_USERS_STORAGE_KEY, updated);
        return updated;
      });
      saveUserToFirestore(updatedUser);
    }

    setInventoryList((prev) => {
      const updated = prev.map((item) => {
        const orderedItem = data.items.find((it) => it.productId === item.id);
        if (orderedItem) {
          return {
            ...item,
            stock: Math.max(0, (item.stock || 0) - orderedItem.quantity),
          };
        }
        return item;
      });
      safeSetLocalStorage(GABEE_STUDIO_INVENTORY_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(GABEE_STUDIO_INVENTORY_KEY, updated);
      return updated;
    });

    return newOrder;
  };

  const updateStoreOrderStatus = (
    orderId: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'delivered' | 'completed' | 'packing' | 'shipped'
  ) => {
    let updatedOrder: StoreOrder | undefined;
    setStoreOrders((prev) => {
      const updated = prev.map((ord) => {
        if (ord.id === orderId) {
          updatedOrder = { ...ord, status };
          return updatedOrder;
        }
        return ord;
      });
      safeSetLocalStorage(STORE_ORDERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(STORE_ORDERS_STORAGE_KEY, updated);
      return updated;
    });
    if (updatedOrder) {
      saveStoreOrderToFirestore(updatedOrder).catch(() => {});
    }
  };

  const updateStoreOrder = (orderId: string, updates: Partial<StoreOrder>) => {
    let updatedOrder: StoreOrder | undefined;
    setStoreOrders((prev) => {
      const updated = prev.map((ord) => {
        if (ord.id === orderId) {
          updatedOrder = { ...ord, ...updates };
          return updatedOrder;
        }
        return ord;
      });
      safeSetLocalStorage(STORE_ORDERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(STORE_ORDERS_STORAGE_KEY, updated);
      return updated;
    });
    if (updatedOrder) {
      saveStoreOrderToFirestore(updatedOrder).catch(() => {});
    }
  };

  const deleteStoreOrder = (orderId: string) => {
    setStoreOrders((prev) => {
      const updated = prev.filter((ord) => ord.id !== orderId);
      safeSetLocalStorage(STORE_ORDERS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(STORE_ORDERS_STORAGE_KEY, updated);
      return updated;
    });
    deleteStoreOrderFromFirestore(orderId).catch(() => {});
  };

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [flipbookType, setFlipbookType] = useState<'terms' | 'benefits' | null>(null);

  const openFlipbook = (type: 'terms' | 'benefits') => {
    setFlipbookType(type);
    setShowTermsModal(true);
  };

  const closeFlipbook = () => {
    setFlipbookType(null);
    setShowTermsModal(false);
  };

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [isPressOnModalOpen, setIsPressOnModalOpen] = useState(false);
  const [pressOnInitialTab, setPressOnInitialTab] = useState<'catalog' | 'custom'>('catalog');
  const [pressOnInitialSetIdx, setPressOnInitialSetIdx] = useState<number>(0);
  const [pressOnInitialStep, setPressOnInitialStep] = useState<number>(1);
  const [selectedPressOnPromoItem, setSelectedPressOnPromoItem] = useState<PressOnItem | PromoDesign | null>(null);

  const openPressOnModal = (
    tab: 'catalog' | 'custom' = 'catalog',
    initialSetIdx: number = 0,
    initialStep: number = 1,
    promoItem?: PressOnItem | PromoDesign | null
  ) => {
    setPressOnInitialTab(tab);
    setPressOnInitialSetIdx(initialSetIdx);
    setPressOnInitialStep(initialStep);
    setSelectedPressOnPromoItem(promoItem ?? null);
    setIsPressOnModalOpen(true);
  };

  const [isPromoPressOnModalOpen, setIsPromoPressOnModalOpen] = useState(false);
  const [selectedPromoPressOnDesign, setSelectedPromoPressOnDesign] = useState<PromoDesign | null>(null);

  const openPromoPressOnModal = (design: PromoDesign) => {
    setSelectedPromoPressOnDesign(design);
    setIsPromoPressOnModalOpen(true);
  };

  const closePromoPressOnModal = () => {
    setIsPromoPressOnModalOpen(false);
    setSelectedPromoPressOnDesign(null);
  };

  const [showAdditionalsModal, setShowAdditionalsModal] = useState(false);
  const [selectedAdditionals, setSelectedAdditionals] = useState<string[]>([]);

  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  const [googleUser] = useState<any | null>(null);
  const [googleAccessToken] = useState<string | null>(null);
  const [spreadsheetId] = useState<string | null>(() => getStoredSpreadsheetId());
  const [spreadsheetUrl] = useState<string | null>(() =>
    localStorage.getItem(SPREADSHEET_URL_STORAGE_KEY)
  );
  const [isSyncingSheets] = useState(false);

  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!saved) return INITIAL_SETTINGS;
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        adminPassword: parsed.adminPassword || DEFAULT_ADMIN_PASSWORD,
      };
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [promoDesigns, setPromoDesigns] = useState<PromoDesign[]>(() => {
    try {
      const saved = localStorage.getItem(PROMOS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return PROMO_CATALOG_DESIGNS;
  });

  const [selectedPromoForDetails, setSelectedPromoForDetails] = useState<PromoDesign | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SAMPLE_APPOINTMENTS;
    } catch {
      return INITIAL_SAMPLE_APPOINTMENTS;
    }
  });

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingServiceType, setBookingServiceType] = useState<ServiceType>('promotion');
  const [selectedPromoForBooking, setSelectedPromoForBooking] = useState<PromoDesign | null>(null);

  const [customConfig, setCustomConfig] = useState<CustomServiceConfig>({
    level: 'moderado',
    system: 'softgel',
    shape: 'almond',
    lengthId: 'length_xs',
    addons: {
      rhinestones: false,
      previousRemoval: false,
      stilettoShape: false,
      homeService: false,
    },
    calculatedPrice: 70,
  });

  const [additionalsList, setAdditionalsList] = useState<AdditionalItem[]>(() => {
    try {
      const saved = localStorage.getItem(ADDITIONALS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ADDITIONALS_DATA;
    } catch {
      return ADDITIONALS_DATA;
    }
  });

  const addAdditionalItem = (itemData: Omit<AdditionalItem, 'id'>) => {
    const newItem: AdditionalItem = {
      ...itemData,
      id: `add_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      active: itemData.active !== undefined ? itemData.active : true,
    };
    setAdditionalsList((prev) => {
      const updated = [...prev, newItem];
      safeSetLocalStorage(ADDITIONALS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ADDITIONALS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const updateAdditionalItem = (id: string, updates: Partial<AdditionalItem>) => {
    setAdditionalsList((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      safeSetLocalStorage(ADDITIONALS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ADDITIONALS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const deleteAdditionalItem = (id: string) => {
    setAdditionalsList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetLocalStorage(ADDITIONALS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(ADDITIONALS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const resetAdditionalsList = () => {
    setAdditionalsList(ADDITIONALS_DATA);
    safeSetLocalStorage(ADDITIONALS_STORAGE_KEY, JSON.stringify(ADDITIONALS_DATA));
    syncAppStateToSupabase(ADDITIONALS_STORAGE_KEY, ADDITIONALS_DATA);
  };

  const additionalsTotal = useMemo(() => {
    return selectedAdditionals.reduce((sum, id) => {
      const item = additionalsList.find((a) => a.id === id);
      return sum + (item ? item.price : 0);
    }, 0);
  }, [selectedAdditionals, additionalsList]);

  const toggleAdditional = (id: string) => {
    setSelectedAdditionals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearAdditionals = () => {
    setSelectedAdditionals([]);
  };

  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(GABEE_STUDIO_INVENTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_INVENTORY_DATA;
  });

  const [coursesList, setCoursesList] = useState<CourseItem[]>(() => {
    try {
      const saved = localStorage.getItem(COURSES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_COURSES_DATA;
  });

  const [pressOnCatalog, setPressOnCatalog] = useState<PressOnItem[]>(() => {
    try {
      const saved = localStorage.getItem(PRESS_ON_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PRESS_ON_ITEMS;
  });

  const [servicesCatalog, setServicesCatalog] = useState<ServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem(SERVICES_CATALOG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SERVICES_CATALOG;
  });

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizeReviews<ReviewItem>(parsed as ReviewItem[]);
          safeSetLocalStorage(REVIEWS_STORAGE_KEY, JSON.stringify(sanitized));
          return sanitized;
        }
      }
    } catch {}
    return [];
  });

  const [reviewedTargetIds, setReviewedTargetIds] = useState<string[]>(() => {
    return safeGetLocalStorage<string[]>(REVIEWED_TARGETS_STORAGE_KEY, []);
  });

  const [catbeeConfig, setCatbeeConfig] = useState<CatbeeConfig>(() => {
    try {
      const saved = localStorage.getItem(CATBEE_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.systemPrompt === 'string') {
          return { ...DEFAULT_CATBEE_CONFIG, ...parsed };
        }
      }
    } catch {}
    return DEFAULT_CATBEE_CONFIG;
  });

  const [catbeeKnowledge, setCatbeeKnowledge] = useState<CatbeeKnowledgeItem[]>(() => {
    try {
      const saved = localStorage.getItem(CATBEE_KNOWLEDGE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CATBEE_KNOWLEDGE;
  });

  // Carga inicial completa desde Supabase (`public.site_state`) + suscripciones activas
  useEffect(() => {
    setIsFirestoreConnected(isSupabaseStateConfigured());

    const unsubs: (() => void)[] = [];

    void (async () => {
      try {
        const [
          remoteSettings,
          remotePromos,
          remoteServices,
          remotePressOn,
          remoteInventory,
          remoteCourses,
          remoteAdditionals,
          remoteCatbeeConfig,
          remoteCatbeeKnowledge,
          remoteAppointments,
          remoteStoreOrders,
        ] = await Promise.all([
          loadSiteStateFromSupabase<StudioSettings>(`app_state:${SETTINGS_STORAGE_KEY}`),
          loadSiteStateFromSupabase<PromoDesign[]>(`app_state:${PROMOS_STORAGE_KEY}`),
          loadSiteStateFromSupabase<ServiceItem[]>(`app_state:${SERVICES_CATALOG_STORAGE_KEY}`),
          loadSiteStateFromSupabase<PressOnItem[]>(`app_state:${PRESS_ON_STORAGE_KEY}`),
          loadSiteStateFromSupabase<InventoryItem[]>(`app_state:${GABEE_STUDIO_INVENTORY_KEY}`),
          loadSiteStateFromSupabase<CourseItem[]>(`app_state:${COURSES_STORAGE_KEY}`),
          loadSiteStateFromSupabase<AdditionalItem[]>(`app_state:${ADDITIONALS_STORAGE_KEY}`),
          loadSiteStateFromSupabase<CatbeeConfig>(`app_state:${CATBEE_CONFIG_STORAGE_KEY}`),
          loadSiteStateFromSupabase<CatbeeKnowledgeItem[]>(`app_state:${CATBEE_KNOWLEDGE_STORAGE_KEY}`),
          loadSiteStateFromSupabase<Appointment[]>(`app_state:${APPOINTMENTS_STORAGE_KEY}`),
          loadSiteStateFromSupabase<StoreOrder[]>(`app_state:${STORE_ORDERS_STORAGE_KEY}`),
        ]);

        if (remoteSettings && typeof remoteSettings === 'object') {
          const mergedSettings: StudioSettings = {
            ...INITIAL_SETTINGS,
            ...remoteSettings,
            adminPassword: remoteSettings.adminPassword || DEFAULT_ADMIN_PASSWORD,
          };
          setSettings(mergedSettings);
          safeSetLocalStorage(SETTINGS_STORAGE_KEY, JSON.stringify(mergedSettings));
        }

        if (Array.isArray(remotePromos) && remotePromos.length > 0) {
          setPromoDesigns(remotePromos);
          safeSetLocalStorage(PROMOS_STORAGE_KEY, JSON.stringify(remotePromos));
        }

        if (Array.isArray(remoteServices) && remoteServices.length > 0) {
          setServicesCatalog(remoteServices);
          safeSetLocalStorage(SERVICES_CATALOG_STORAGE_KEY, JSON.stringify(remoteServices));
        }

        if (Array.isArray(remotePressOn) && remotePressOn.length > 0) {
          setPressOnCatalog(remotePressOn);
          safeSetLocalStorage(PRESS_ON_STORAGE_KEY, JSON.stringify(remotePressOn));
        }

        if (Array.isArray(remoteInventory) && remoteInventory.length > 0) {
          setInventoryList(remoteInventory);
          safeSetLocalStorage(GABEE_STUDIO_INVENTORY_KEY, JSON.stringify(remoteInventory));
        }

        if (Array.isArray(remoteCourses) && remoteCourses.length > 0) {
          setCoursesList(remoteCourses);
          safeSetLocalStorage(COURSES_STORAGE_KEY, JSON.stringify(remoteCourses));
        }

        if (Array.isArray(remoteAdditionals) && remoteAdditionals.length > 0) {
          setAdditionalsList(remoteAdditionals);
          safeSetLocalStorage(ADDITIONALS_STORAGE_KEY, JSON.stringify(remoteAdditionals));
        }

        if (remoteCatbeeConfig && typeof remoteCatbeeConfig.systemPrompt === 'string') {
          const mergedCfg = { ...DEFAULT_CATBEE_CONFIG, ...remoteCatbeeConfig };
          setCatbeeConfig(mergedCfg);
          safeSetLocalStorage(CATBEE_CONFIG_STORAGE_KEY, JSON.stringify(mergedCfg));
        }

        if (Array.isArray(remoteCatbeeKnowledge) && remoteCatbeeKnowledge.length > 0) {
          setCatbeeKnowledge(remoteCatbeeKnowledge);
          safeSetLocalStorage(CATBEE_KNOWLEDGE_STORAGE_KEY, JSON.stringify(remoteCatbeeKnowledge));
        }

        if (Array.isArray(remoteAppointments) && remoteAppointments.length > 0) {
          setAppointments(remoteAppointments);
          safeSetLocalStorage(APPOINTMENTS_STORAGE_KEY, JSON.stringify(remoteAppointments));
        }

        if (Array.isArray(remoteStoreOrders) && remoteStoreOrders.length > 0) {
          setStoreOrders(remoteStoreOrders);
          safeSetLocalStorage(STORE_ORDERS_STORAGE_KEY, JSON.stringify(remoteStoreOrders));
        }
      } catch {
        // Ignora errores de red para no bloquear la carga inicial
      }
    })();

    unsubs.push(
      subscribeToPromoDesigns((designs) => {
        if (designs && designs.length > 0) {
          setPromoDesigns(designs);
          safeSetLocalStorage(PROMOS_STORAGE_KEY, JSON.stringify(designs));
          syncAppStateToSupabase(PROMOS_STORAGE_KEY, designs);
        }
      })
    );

    unsubs.push(
      subscribeToAppointments((apts) => {
        if (apts && apts.length > 0) {
          setAppointments(apts);
          safeSetLocalStorage(APPOINTMENTS_STORAGE_KEY, JSON.stringify(apts));
          syncAppStateToSupabase(APPOINTMENTS_STORAGE_KEY, apts);
        }
      })
    );

    unsubs.push(
      subscribeToSettings((stg) => {
        if (stg) {
          const merged: StudioSettings = {
            ...INITIAL_SETTINGS,
            ...stg,
            adminPassword: stg.adminPassword || DEFAULT_ADMIN_PASSWORD,
          };
          setSettings(merged);
          safeSetLocalStorage(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          syncAppStateToSupabase(SETTINGS_STORAGE_KEY, merged);
        }
      })
    );

    unsubs.push(
      subscribeToStoreOrders((orders) => {
        if (orders && orders.length > 0) {
          setStoreOrders((prevLocal) => {
            const map = new Map<string, StoreOrder>();
            orders.forEach((o) => map.set(o.id, o));
            prevLocal.forEach((o) => {
              if (!map.has(o.id)) {
                map.set(o.id, o);
              }
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            safeSetLocalStorage(STORE_ORDERS_STORAGE_KEY, JSON.stringify(merged));
            syncAppStateToSupabase(STORE_ORDERS_STORAGE_KEY, merged);
            return merged;
          });
        }
      })
    );

    unsubs.push(
      subscribeToUsers((users) => {
        if (users && users.length > 0) {
          const deletedIds = safeGetLocalStorage<string[]>(DELETED_USER_IDS_STORAGE_KEY, []);
          const activeUsers = users.filter((u) => !deletedIds.includes(u.id));

          setAllUsers((prevAll) => {
            const activeStored = safeGetLocalStorage<UserProfile | null>(USER_ACCOUNT_STORAGE_KEY, null);
            const activeId = activeStored?.id;

            const mergedList = activeUsers.map((remoteUser) => {
              if (activeId && remoteUser.id === activeId) {
                return { ...remoteUser, ...activeStored };
              }
              return remoteUser;
            });

            safeSetLocalStorage(ALL_USERS_STORAGE_KEY, JSON.stringify(mergedList));
            return mergedList;
          });

          const activeStored = safeGetLocalStorage<UserProfile | null>(USER_ACCOUNT_STORAGE_KEY, null);
          if (activeStored?.id) {
            if (deletedIds.includes(activeStored.id)) {
              setCurrentUser(null);
              localStorage.removeItem(USER_ACCOUNT_STORAGE_KEY);
              sessionStorage.removeItem(USER_ACCOUNT_STORAGE_KEY);
            } else {
              const freshInList = activeUsers.find((u) => u.id === activeStored.id);
              if (freshInList) {
                const mergedActive = { ...freshInList, ...activeStored };
                setCurrentUser(mergedActive);
                safeSetLocalStorage(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(mergedActive));
              }
            }
          }
        }
      })
    );

    unsubs.push(
      subscribeToRecharges((reqs) => {
        if (reqs && reqs.length > 0) {
          setRechargeRequests(reqs);
          safeSetLocalStorage(RECHARGES_STORAGE_KEY, JSON.stringify(reqs));
        }
      })
    );

    void deleteSeedReviewsFromFirestore();

    unsubs.push(
      subscribeToReviews((items) => {
        setReviewsList((prevLocal) => {
          const storedLocal = safeGetLocalStorage<ReviewItem[]>(REVIEWS_STORAGE_KEY, prevLocal);
          const remote = sanitizeReviews<ReviewItem>(items || []);
          const local = sanitizeReviews<ReviewItem>(storedLocal);
          const itemMap = new Map<string, ReviewItem>();
          remote.forEach((item) => itemMap.set(item.id, item));
          local.forEach((item) => {
            if (!itemMap.has(item.id)) itemMap.set(item.id, item);
          });
          const merged = Array.from(itemMap.values());
          safeSetLocalStorage(REVIEWS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const saveAndSetInventory = (updatedList: InventoryItem[]) => {
    setInventoryList(updatedList);
    safeSetLocalStorage(GABEE_STUDIO_INVENTORY_KEY, JSON.stringify(updatedList));
    syncAppStateToSupabase(GABEE_STUDIO_INVENTORY_KEY, updatedList);
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      image:
        itemData.image && itemData.image.trim() !== ''
          ? itemData.image.trim()
          : '/assets/aistudio/PO_1_f5e6a392.JPG',
    };
    setInventoryList((prev) => {
      const updated = [...prev, newItem];
      safeSetLocalStorage(GABEE_STUDIO_INVENTORY_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(GABEE_STUDIO_INVENTORY_KEY, updated);
      return updated;
    });
    return newItem;
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventoryList((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const finalImage =
            updates.image !== undefined
              ? updates.image.trim() !== ''
                ? updates.image.trim()
                : item.image
              : item.image;
          return { ...item, ...updates, image: finalImage };
        }
        return item;
      });
      safeSetLocalStorage(GABEE_STUDIO_INVENTORY_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(GABEE_STUDIO_INVENTORY_KEY, updated);
      return updated;
    });
  };

  const deleteInventoryItem = (id: string) => {
    setInventoryList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetLocalStorage(GABEE_STUDIO_INVENTORY_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(GABEE_STUDIO_INVENTORY_KEY, updated);
      return updated;
    });
  };

  const resetInventoryList = () => {
    setInventoryList(INITIAL_INVENTORY_DATA);
    safeSetLocalStorage(GABEE_STUDIO_INVENTORY_KEY, JSON.stringify(INITIAL_INVENTORY_DATA));
    syncAppStateToSupabase(GABEE_STUDIO_INVENTORY_KEY, INITIAL_INVENTORY_DATA);
  };

  const [selectedCourseItem, setSelectedCourseItem] = useState<CourseItem | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  const openCourseModal = (item: CourseItem) => {
    setSelectedCourseItem(item);
    setIsCourseModalOpen(true);
  };

  const closeCourseModal = () => {
    setIsCourseModalOpen(false);
    setSelectedCourseItem(null);
  };

  const addCourseItem = (itemData: Omit<CourseItem, 'id'>): CourseItem => {
    const newItem: CourseItem = {
      ...itemData,
      id: `course-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      image:
        itemData.image && itemData.image.trim() !== ''
          ? itemData.image.trim()
          : '/src/assets/images/nail_chrome_cateye_1792392507727.jpg',
      whatYouWillLearn: itemData.whatYouWillLearn || [],
    };
    setCoursesList((prev) => {
      const updated = [...prev, newItem];
      safeSetLocalStorage(COURSES_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(COURSES_STORAGE_KEY, updated);
      return updated;
    });
    return newItem;
  };

  const updateCourseItem = (id: string, updates: Partial<CourseItem>) => {
    setCoursesList((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const finalImage =
            updates.image !== undefined
              ? updates.image.trim() !== ''
                ? updates.image.trim()
                : item.image
              : item.image;
          return { ...item, ...updates, image: finalImage };
        }
        return item;
      });
      safeSetLocalStorage(COURSES_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(COURSES_STORAGE_KEY, updated);
      return updated;
    });
  };

  const deleteCourseItem = (id: string) => {
    setCoursesList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetLocalStorage(COURSES_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(COURSES_STORAGE_KEY, updated);
      return updated;
    });
  };

  const resetCoursesList = () => {
    setCoursesList(INITIAL_COURSES_DATA);
    safeSetLocalStorage(COURSES_STORAGE_KEY, JSON.stringify(INITIAL_COURSES_DATA));
    syncAppStateToSupabase(COURSES_STORAGE_KEY, INITIAL_COURSES_DATA);
  };

  const addReviewItem = (itemData: Omit<ReviewItem, 'id' | 'createdAt'>): ReviewItem => {
    const rawMedia = itemData.mediaUrl?.trim();
    const cleanMedia =
      rawMedia &&
      rawMedia !== '' &&
      rawMedia !== 'none' &&
      rawMedia !== 'no-image' &&
      rawMedia !== 'undefined'
        ? rawMedia
        : undefined;

    const newItem: ReviewItem = {
      ...itemData,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      mediaUrl: cleanMedia,
      rating: itemData.rating || 5,
      active: itemData.active !== false,
    };
    setReviewsList((prev) => {
      const updated = [newItem, ...prev];
      safeSetLocalStorage(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(REVIEWS_STORAGE_KEY, updated);
      return updated;
    });
    saveReviewItemToFirestore(newItem);
    return newItem;
  };

  const updateReviewItem = (id: string, updates: Partial<ReviewItem>) => {
    unmarkReviewsAsDeleted([id]);
    let updatedItem: ReviewItem | undefined;
    setReviewsList((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...updates };
          return updatedItem;
        }
        return item;
      });
      safeSetLocalStorage(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(REVIEWS_STORAGE_KEY, updated);
      return updated;
    });
    if (updatedItem) {
      saveReviewItemToFirestore(updatedItem);
    }
  };

  const deleteReviewItem = (id: string) => {
    markReviewsAsDeleted([id]);
    setReviewsList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetLocalStorage(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(REVIEWS_STORAGE_KEY, updated);
      return updated;
    });
    void deleteReviewItemFromFirestore(id);
  };

  const markTargetAsReviewed = (targetId: string) => {
    setReviewedTargetIds((prev) => {
      if (prev.includes(targetId)) return prev;
      const updated = [...prev, targetId];
      safeSetLocalStorage(REVIEWED_TARGETS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resetReviewsList = () => {
    const idsToClear = Array.from(
      new Set([...reviewsList.map((item) => item.id), ...SEED_REVIEW_IDS])
    );
    markReviewsAsDeleted(idsToClear);
    setReviewsList([]);
    safeSetLocalStorage(REVIEWS_STORAGE_KEY, JSON.stringify([]));
    syncAppStateToSupabase(REVIEWS_STORAGE_KEY, []);
    void clearAllReviewsFromFirestore(idsToClear);
  };

  const updateCatbeeConfig = (newConfig: Partial<CatbeeConfig>) => {
    setCatbeeConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      safeSetLocalStorage(CATBEE_CONFIG_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(CATBEE_CONFIG_STORAGE_KEY, updated);
      return updated;
    });
  };

  const resetCatbeeConfig = () => {
    setCatbeeConfig(DEFAULT_CATBEE_CONFIG);
    safeSetLocalStorage(CATBEE_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_CATBEE_CONFIG));
    syncAppStateToSupabase(CATBEE_CONFIG_STORAGE_KEY, DEFAULT_CATBEE_CONFIG);
  };

  const addCatbeeKnowledge = (
    itemData: Omit<CatbeeKnowledgeItem, 'id' | 'updatedAt'>
  ): CatbeeKnowledgeItem => {
    const newItem: CatbeeKnowledgeItem = {
      ...itemData,
      id: `kb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
      active: itemData.active !== false,
      keywords: Array.isArray(itemData.keywords) ? itemData.keywords : [],
    };
    setCatbeeKnowledge((prev) => {
      const updated = [newItem, ...prev];
      safeSetLocalStorage(CATBEE_KNOWLEDGE_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(CATBEE_KNOWLEDGE_STORAGE_KEY, updated);
      return updated;
    });
    return newItem;
  };

  const updateCatbeeKnowledge = (id: string, updates: Partial<CatbeeKnowledgeItem>) => {
    setCatbeeKnowledge((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          return { ...item, ...updates, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      safeSetLocalStorage(CATBEE_KNOWLEDGE_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(CATBEE_KNOWLEDGE_STORAGE_KEY, updated);
      return updated;
    });
  };

  const deleteCatbeeKnowledge = (id: string) => {
    setCatbeeKnowledge((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetLocalStorage(CATBEE_KNOWLEDGE_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(CATBEE_KNOWLEDGE_STORAGE_KEY, updated);
      return updated;
    });
  };

  const resetCatbeeKnowledge = () => {
    setCatbeeKnowledge(INITIAL_CATBEE_KNOWLEDGE);
    safeSetLocalStorage(CATBEE_KNOWLEDGE_STORAGE_KEY, JSON.stringify(INITIAL_CATBEE_KNOWLEDGE));
    syncAppStateToSupabase(CATBEE_KNOWLEDGE_STORAGE_KEY, INITIAL_CATBEE_KNOWLEDGE);
  };

  const addPressOnItem = (itemData: Omit<PressOnItem, 'id'>) => {
    const newItem: PressOnItem = {
      ...itemData,
      id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setPressOnCatalog((prev) => {
      const updated = [...prev, newItem];
      safeSetLocalStorage(PRESS_ON_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(PRESS_ON_STORAGE_KEY, updated);
      return updated;
    });
  };

  const updatePressOnItem = (id: string, updates: Partial<PressOnItem>) => {
    setPressOnCatalog((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      safeSetLocalStorage(PRESS_ON_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(PRESS_ON_STORAGE_KEY, updated);
      return updated;
    });
  };

  const deletePressOnItem = (id: string) => {
    setPressOnCatalog((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetLocalStorage(PRESS_ON_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(PRESS_ON_STORAGE_KEY, updated);
      return updated;
    });
  };

  const resetPressOnCatalog = () => {
    setPressOnCatalog(INITIAL_PRESS_ON_ITEMS);
    safeSetLocalStorage(PRESS_ON_STORAGE_KEY, JSON.stringify(INITIAL_PRESS_ON_ITEMS));
    syncAppStateToSupabase(PRESS_ON_STORAGE_KEY, INITIAL_PRESS_ON_ITEMS);
  };

  const addServiceItem = (itemData: Omit<ServiceItem, 'id'>) => {
    const newItem: ServiceItem = {
      ...itemData,
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setServicesCatalog((prev) => {
      const updated = [...prev, newItem];
      safeSetLocalStorage(SERVICES_CATALOG_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(SERVICES_CATALOG_STORAGE_KEY, updated);
      return updated;
    });
  };

  const updateServiceItem = (id: string, updates: Partial<ServiceItem>) => {
    setServicesCatalog((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      safeSetLocalStorage(SERVICES_CATALOG_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(SERVICES_CATALOG_STORAGE_KEY, updated);
      return updated;
    });
  };

  const deleteServiceItem = (id: string) => {
    setServicesCatalog((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetLocalStorage(SERVICES_CATALOG_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(SERVICES_CATALOG_STORAGE_KEY, updated);
      return updated;
    });
  };

  const resetServicesCatalog = () => {
    setServicesCatalog(INITIAL_SERVICES_CATALOG);
    safeSetLocalStorage(SERVICES_CATALOG_STORAGE_KEY, JSON.stringify(INITIAL_SERVICES_CATALOG));
    syncAppStateToSupabase(SERVICES_CATALOG_STORAGE_KEY, INITIAL_SERVICES_CATALOG);
  };

  const openBooking = (serviceType: ServiceType, promoId?: string, preloadedSystem?: string) => {
    setBookingServiceType(serviceType);
    let targetPromo: PromoDesign | null = null;
    if (promoId) {
      targetPromo = promoDesigns.find((p) => p.id === promoId) || null;
      setSelectedPromoForBooking(targetPromo);
    } else {
      setSelectedPromoForBooking(null);
    }

    const defaultLengthId = NAIL_LENGTHS[0]?.id || 'length_xs';
    const defaultShape = NAIL_SHAPES[0]?.id || 'almond';

    if (serviceType === 'promotion') {
      const allowedObj = targetPromo?.allowedSystems || {
        polygel: true,
        softgel: true,
        builder: true,
        acrilicas: false,
        esmaltado_gel: false,
      };
      const firstAllowedSystem = allowedObj.polygel
        ? 'polygel'
        : allowedObj.softgel
        ? 'softgel'
        : allowedObj.builder
        ? 'builder_gel'
        : allowedObj.esmaltado_gel
        ? 'esmaltado_gel'
        : 'acrilicas';
      setCustomConfig((prev) => ({
        ...prev,
        system: firstAllowedSystem,
        shape: defaultShape,
        lengthId: defaultLengthId,
      }));
    } else if (serviceType === 'custom') {
      setCustomConfig((prev) => ({
        ...prev,
        system: preloadedSystem || prev.system || 'softgel',
        shape: defaultShape,
        lengthId: defaultLengthId,
      }));
    } else if (preloadedSystem) {
      setCustomConfig((prev) => ({ ...prev, system: preloadedSystem }));
    }

    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    setSelectedPromoForBooking(null);
  };

  const addPromoDesign = (designData: Omit<PromoDesign, 'id'>) => {
    const newDesign: PromoDesign = {
      ...designData,
      id: `promo-${Date.now()}`,
    };
    setPromoDesigns((prev) => {
      const updated = [...prev, newDesign];
      safeSetLocalStorage(PROMOS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(PROMOS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const updatePromoDesign = (id: string, updates: Partial<PromoDesign>) => {
    setPromoDesigns((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      safeSetLocalStorage(PROMOS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(PROMOS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const deletePromoDesign = (id: string) => {
    setPromoDesigns((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      safeSetLocalStorage(PROMOS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(PROMOS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const createAppointment = (
    appointmentData: Omit<Appointment, 'id' | 'code' | 'createdAt'>,
    options?: { notifyTelegram?: boolean }
  ): Appointment => {
    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const isPressOn = !!appointmentData.pressOnDetails;
    const isPromo = appointmentData.serviceType === 'promotion';
    let prefix = `NS${currentYearShort}_`;
    if (isPressOn) {
      prefix = isPromo ? `PP${currentYearShort}_` : `PO${currentYearShort}_`;
    } else if (isPromo) {
      prefix = `PS${currentYearShort}_`;
    }
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    const newCode = `${prefix}${randomDigits}`;

    const newAppointment: Appointment = {
      ...appointmentData,
      id: `apt-${Date.now()}`,
      code: newCode,
      createdAt: new Date().toISOString(),
    };
    if (appointmentData.paymentOperationNumber) {
      recordOperationCode(appointmentData.paymentOperationNumber, 'appointment');
    }
    setAppointments((prev) => {
      const updated = [newAppointment, ...prev];
      safeSetLocalStorage(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(APPOINTMENTS_STORAGE_KEY, updated);
      return updated;
    });
    saveAppointmentToFirestore(newAppointment);
    if (options?.notifyTelegram !== false) {
      void notifyTelegramAppointment(newAppointment);
    }
    return newAppointment;
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>): Appointment | undefined => {
    let updatedAppointment: Appointment | undefined;
    let previousAppointment: Appointment | undefined;
    setAppointments((prev) => {
      previousAppointment = prev.find((a) => a.id === id);
      const updated = prev.map((a) => {
        if (a.id === id) {
          updatedAppointment = { ...a, ...updates };
          return updatedAppointment;
        }
        return a;
      });
      safeSetLocalStorage(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(APPOINTMENTS_STORAGE_KEY, updated);
      return updated;
    });
    if (updatedAppointment) {
      if (updates.paymentOperationNumber && updates.paymentOperationNumber.trim()) {
        recordOperationCode(updates.paymentOperationNumber, 'appointment');
      }
      saveAppointmentToFirestore(updatedAppointment);
      const prevOp = String(previousAppointment?.paymentOperationNumber || '').trim();
      const nextOp = String(updatedAppointment.paymentOperationNumber || '').trim();
      const opNowProvided = !!nextOp && nextOp !== prevOp;
      if (opNowProvided) {
        void notifyTelegramAppointment(updatedAppointment);
      }
    }
    return updatedAppointment;
  };

  const updateAppointmentStatus = (
    id: string,
    status: Appointment['status'],
    depositPaid?: boolean
  ) => {
    let updatedAppointment: Appointment | undefined;
    setAppointments((prev) => {
      const updated = prev.map((a) => {
        if (a.id === id) {
          updatedAppointment = { ...a, status, depositPaid: depositPaid ?? a.depositPaid };
          return updatedAppointment;
        }
        return a;
      });
      safeSetLocalStorage(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(APPOINTMENTS_STORAGE_KEY, updated);
      return updated;
    });
    if (updatedAppointment) {
      saveAppointmentToFirestore(updatedAppointment);
    }
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      safeSetLocalStorage(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(APPOINTMENTS_STORAGE_KEY, updated);
      return updated;
    });
    deleteAppointmentFromFirestore(id);
  };

  const clearCancelledAppointments = () => {
    setAppointments((prev) => {
      const cancelled = prev.filter((a) => a.status === 'cancelled');
      cancelled.forEach((a) => deleteAppointmentFromFirestore(a.id));
      const updated = prev.filter((a) => a.status !== 'cancelled');
      safeSetLocalStorage(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(APPOINTMENTS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const telegramSalesRef = useRef({ rechargeRequests, storeOrders, appointments });
  const telegramAppliedActionsRef = useRef<string[]>(
    safeGetLocalStorage<string[]>(TELEGRAM_APPLIED_ACTIONS_KEY, [])
  );
  const telegramSyncBusyRef = useRef(false);
  useEffect(() => {
    telegramSalesRef.current = { rechargeRequests, storeOrders, appointments };
  }, [rechargeRequests, storeOrders, appointments]);

  const telegramHandlersRef = useRef({
    approveBeeCoinRecharge,
    rejectBeeCoinRecharge,
    updateStoreOrderStatus,
    updateAppointmentStatus,
  });
  useEffect(() => {
    telegramHandlersRef.current = {
      approveBeeCoinRecharge,
      rejectBeeCoinRecharge,
      updateStoreOrderStatus,
      updateAppointmentStatus,
    };
  });

  useEffect(() => {
    let cancelled = false;

    const markApplied = (actionId: string) => {
      if (telegramAppliedActionsRef.current.includes(actionId)) return;
      const next = [...telegramAppliedActionsRef.current, actionId].slice(-1000);
      telegramAppliedActionsRef.current = next;
      safeSetLocalStorage(TELEGRAM_APPLIED_ACTIONS_KEY, JSON.stringify(next));
    };

    const syncTelegramActions = async () => {
      if (telegramSyncBusyRef.current || cancelled) return;
      telegramSyncBusyRef.current = true;
      try {
        const actions = await fetchTelegramActions();
        if (cancelled) return;

        for (const action of actions) {
          if (telegramAppliedActionsRef.current.includes(action.id)) continue;
          const { rechargeRequests: reqs, storeOrders: orders, appointments: apts } =
            telegramSalesRef.current;

          if (action.type === 'recharge') {
            const request = reqs.find((r) => r.id === action.targetId);
            if (!request) continue;
            if (request.status !== 'pending') {
              markApplied(action.id);
              continue;
            }
            if (action.decision === 'accept') {
              telegramHandlersRef.current.approveBeeCoinRecharge(request.id);
            } else {
              telegramHandlersRef.current.rejectBeeCoinRecharge(request.id);
            }
            markApplied(action.id);
            continue;
          }

          if (action.type === 'store') {
            const order = orders.find((o) => o.id === action.targetId || o.code === action.targetId);
            if (!order) continue;
            if (order.status !== 'pending') {
              markApplied(action.id);
              continue;
            }
            telegramHandlersRef.current.updateStoreOrderStatus(
              order.id,
              action.decision === 'accept' ? 'confirmed' : 'cancelled'
            );
            markApplied(action.id);
            continue;
          }

          if (action.type === 'appointment') {
            const appointment = apts.find(
              (a) => a.id === action.targetId || a.code === action.targetId
            );
            if (!appointment) continue;
            if (!['pending_deposit', 'pending'].includes(appointment.status)) {
              markApplied(action.id);
              continue;
            }
            if (action.decision === 'accept') {
              telegramHandlersRef.current.updateAppointmentStatus(appointment.id, 'confirmed', true);
            } else {
              telegramHandlersRef.current.updateAppointmentStatus(
                appointment.id,
                'cancelled',
                appointment.depositPaid
              );
            }
            markApplied(action.id);
          }
        }
      } finally {
        telegramSyncBusyRef.current = false;
      }
    };

    void syncTelegramActions();
    const interval = window.setInterval(syncTelegramActions, 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncTelegramActions();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  const updateSettings = (newSettings: Partial<StudioSettings>) => {
    const normalized: Partial<StudioSettings> =
      typeof newSettings.adminPassword === 'string'
        ? { ...newSettings, adminPassword: newSettings.adminPassword.trim() }
        : newSettings;

    if (normalized.adminPassword) {
      persistAdminPassword(normalized.adminPassword);
    }

    setSettings((prev) => {
      const updated = { ...prev, ...normalized };
      safeSetLocalStorage(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      syncAppStateToSupabase(SETTINGS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const resetSettings = () => {
    persistAdminPassword(DEFAULT_ADMIN_PASSWORD);
    setSettings(INITIAL_SETTINGS);
    safeSetLocalStorage(SETTINGS_STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS));
    syncAppStateToSupabase(SETTINGS_STORAGE_KEY, INITIAL_SETTINGS);
  };

  const resetCustomConfig = () => {
    setCustomConfig({
      level: 'moderado',
      system: 'softgel',
      shape: 'almond',
      lengthId: 'length_xs',
      addons: {
        rhinestones: false,
        previousRemoval: false,
        stilettoShape: false,
        homeService: false,
      },
      calculatedPrice: 70,
    });
  };

  const generateWhatsAppLink = (appointment: Appointment) => {
    const phone = settings.whatsappNumber || '934403311';
    const cleanPhone = '51' + phone.replace(/[^0-9]/g, '').replace(/^51/, '');

    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    let resCode = appointment.code || '';
    if (!resCode.startsWith('NS') && !resCode.startsWith('PS') && !resCode.startsWith('PO')) {
      const prefix =
        appointment.serviceType === 'promotion' ? `PS${currentYearShort}_` : `NS${currentYearShort}_`;
      resCode = `${prefix}${resCode}`;
    }

    const clientName = appointment.clientName || 'Clienta';
    const clientPhone = appointment.clientPhone?.trim() || 'N/A';
    const fecha = appointment.date || 'Por coordinar';
    const hora = appointment.timeSlot || 'Por coordinar';
    const isStudio =
      appointment.locationType === 'studio' ||
      !appointment.locationType ||
      (appointment.locationType !== 'home' && !appointment.homeAddress?.trim());
    const modalidad = isStudio ? 'En Estudio' : 'A Domicilio';
    const isEsmaltado =
      appointment.customDetails?.system === 'esmaltado_gel' ||
      (appointment.promoDesignTitle || '').toLowerCase().includes('esmaltado');

    let direccion = 'N/A';
    let referencia = 'N/A';
    if (isStudio) {
      direccion = 'Av. Arnaldo Márquez 1165 N° 168';
      referencia = 'Plaza Márquez';
    } else {
      direccion = appointment.homeAddress?.trim() || 'N/A';
      referencia = appointment.homeReference?.trim() || 'N/A';
    }
    const cumpleanos = (appointment.birthDate || currentUser?.birthDate || '').trim() || 'N/A';
    const instagram = (appointment.clientInstagram || currentUser?.instagram || '').trim() || 'N/A';

    const adicionalesText =
      appointment.additionals && appointment.additionals.length > 0
        ? appointment.additionals
            .map((id) => additionalsList.find((a) => a.id === id)?.name || id)
            .join(', ')
        : 'N/A';

    const montoTotal = `S/. ${appointment.totalPrice.toFixed(2)}`;
    const adelanto = `S/. ${appointment.depositRequired.toFixed(2)}`;
    const saldo = `S/. ${Math.max(0, appointment.totalPrice - appointment.depositRequired).toFixed(2)}`;
    const metodo = appointment.paymentMethod ? appointment.paymentMethod.toUpperCase() : 'YAPE';
    const operacion = appointment.paymentOperationNumber?.trim() || '';

    const shapeObj = NAIL_SHAPES.find((s) => s.id === appointment.customDetails?.shape);
    const formaText = shapeObj ? shapeObj.name : 'Almendra';

    const lengthObj = NAIL_LENGTHS.find((l) => l.id === appointment.customDetails?.lengthId);
    const largoText = lengthObj
      ? (lengthObj.range || lengthObj.label).replace(' - ', ' | ')
      : 'Natural / Corto (S)';

    const levelText =
      (appointment.customDetails?.level as any) === 'sencillo' ||
      (appointment.customDetails?.level as any) === 'basico'
        ? 'Sutil (S)'
        : appointment.customDetails?.level === 'complejo'
        ? 'Complejo (C)'
        : 'Moderado (M)';

    const detallesDiseno =
      appointment.notes?.trim() || appointment.promoDesignTitle || 'Diseño según catálogo / referencia';

    let lines: string[] = [];

    if (appointment.serviceType === 'removal' || appointment.removalDetails) {
      const removalServiceOverride = servicesCatalog.find(
        (s) => s.removalOptions && s.removalOptions.length > 0
      );
      const removalCatalog = removalServiceOverride?.removalOptions?.length
        ? removalServiceOverride.removalOptions
        : REMOVAL_SERVICE_OPTIONS;
      const removalOption = removalCatalog.find(
        (opt) => opt.id === appointment.removalDetails?.type
      );
      const sistemaRetiro = removalOption
        ? removalOption.title
        : appointment.removalDetails?.type === 'acrilico'
        ? 'Retiro de Acrílico / Polygel'
        : 'Retiro de Gel';

      lines = [
        '*✦ CONFIRMACIÓN DE CITA | GABEE STUDIO ✦*',
        `*✧ Reserva:* ${resCode}`,
        '──────────────────────────',
        `*✧ Cliente:* ${clientName}`,
        `*✧ WhatsApp:* ${clientPhone}`,
        `*✧ Sistema de Retiro:* ${sistemaRetiro}`,
        `*✧ Fecha:* ${fecha}`,
        `*✧ Hora:* ${hora}`,
        `*✧ Modalidad:* ${modalidad}`,
        `*✧ Dirección:* ${direccion}`,
        `*✧ Referencia:* ${referencia}`,
        `*✧ Cumpleaños:* ${cumpleanos}`,
        `*✧ Instagram:* ${instagram}`,
        `*✧ Adicionales:* ${adicionalesText}`,
        '──────────────────────────',
        `*✧ Monto Total:* ${montoTotal}`,
        `*✧ Adelanto para separar:* ${adelanto}`,
        `*✧ Saldo pendiente:* ${saldo}`,
        `*✧ Método de pago:* ${metodo}`,
        `*✧ N° de Operación:* ${operacion}`,
        '──────────────────────────',
        '*¡Hola Gaby! Ya realicé mi pago correspondiente para agendar mi cita. ¡Muchas gracias! ♡*',
      ];
    } else if (appointment.serviceType === 'promotion') {
      lines = [
        '*✦ CONFIRMACIÓN DE CITA PROMOCIONAL | GABEE STUDIO ✦*',
        `*✧ Reserva:* ${resCode}`,
        '──────────────────────────',
        `*✧ Cliente:* ${clientName}`,
        `*✧ WhatsApp:* ${clientPhone}`,
        '*✧ Nivel del Diseño:* Moderado (M) - Incluido en Promoción',
        `*✧ Forma de la punta:* ${formaText}`,
        `*✧ Largo de la Uña:* ${largoText}`,
        `*✧ Detalles del Diseño:* ${detallesDiseno}`,
        `*✧ Fecha:* ${fecha}`,
        `*✧ Hora:* ${hora}`,
        `*✧ Modalidad:* ${modalidad}`,
        `*✧ Dirección:* ${direccion}`,
        `*✧ Referencia:* ${referencia}`,
        `*✧ Cumpleaños:* ${cumpleanos}`,
        `*✧ Instagram:* ${instagram}`,
        `*✧ Adicionales:* ${adicionalesText}`,
        '──────────────────────────',
        `*✧ Monto Total:* ${montoTotal}`,
        `*✧ Adelanto para separar:* ${adelanto}`,
        `*✧ Saldo pendiente:* ${saldo}`,
        `*✧ Método de pago:* ${metodo}`,
        `*✧ N° de Operación:* ${operacion}`,
        '──────────────────────────',
        '*¡Hola Gaby! Ya realicé mi pago correspondiente para agendar mi cita. ¡Muchas gracias! ♡*',
      ];

      const linkedPromo = appointment.promoDesignId
        ? promoDesigns.find((p) => p.id === appointment.promoDesignId)
        : undefined;
      if ((appointment.promoType || linkedPromo?.promoType) === '2x1' && appointment.promoCompanion) {
        const companion = appointment.promoCompanion;
        const companionLevel =
          companion.level === 'complejo'
            ? 'Complejo (C)'
            : companion.level === 'sencillo'
            ? 'Sutil (S)'
            : 'Moderado (M)';
        const companionSystemLabel: Record<string, string> = {
          polygel: 'Polygel',
          softgel: 'Soft Gel',
          builder_gel: 'Builder Gel',
          builder: 'Builder Gel',
          acrilicas: 'Acrílicas',
          esmaltado_gel: 'Esmaltado en Gel',
        };
        lines.push(
          `Acompañante 2x1: ${companion.name || 'Sin nombre'} · Tel: ${
            companion.phone || 'Sin teléfono'
          } · ${companionSystemLabel[companion.system] || companion.system || 'Sistema promocional'} / ${companionLevel}`
        );
      }
    } else {
      lines = [
        '*✦ CONFIRMACIÓN DE CITA | GABEE STUDIO ✦*',
        `*✧ Reserva:* ${resCode}`,
        '──────────────────────────',
        `*✧ Cliente:* ${clientName}`,
        `*✧ WhatsApp:* ${clientPhone}`,
        `*✧ Nivel del Diseño:* ${levelText}`,
      ];

      if (!isEsmaltado) {
        lines.push(`*✧ Forma de la punta:* ${formaText}`);
        lines.push(`*✧ Largo de la Uña:* ${largoText}`);
      }

      lines.push(
        `*✧ Detalles del Diseño:* ${detallesDiseno}`,
        `*✧ Fecha:* ${fecha}`,
        `*✧ Hora:* ${hora}`,
        `*✧ Modalidad:* ${modalidad}`,
        `*✧ Dirección:* ${direccion}`,
        `*✧ Referencia:* ${referencia}`,
        `*✧ Cumpleaños:* ${cumpleanos}`,
        `*✧ Instagram:* ${instagram}`,
        `*✧ Adicionales:* ${adicionalesText}`,
        '──────────────────────────',
        `*✧ Monto Total:* ${montoTotal}`,
        `*✧ Adelanto para separar:* ${adelanto}`,
        `*✧ Saldo pendiente:* ${saldo}`,
        `*✧ Método de pago:* ${metodo}`,
        `*✧ N° de Operación:* ${operacion}`,
        '──────────────────────────',
        '*¡Hola Gaby! Ya realicé mi pago correspondiente para agendar mi cita. ¡Muchas gracias! ♡*'
      );
    }

    let flow = 'nuestros_servicios';
    if (appointment.serviceType === 'removal' || appointment.removalDetails) flow = 'retiro';
    else if (
      appointment.customDetails?.system === 'esmaltado_gel' ||
      (appointment.promoDesignTitle || '').toLowerCase().includes('esmaltado')
    )
      flow = 'esmaltado';
    else if (appointment.serviceType === 'promotion') flow = 'promo_sistemas';

    const SERVICE_SYSTEM_LABELS: Record<string, string> = {
      esmaltado_gel: 'Esmaltado en Gel',
      polygel: 'Polygel',
      softgel: 'Soft Gel',
      builder_gel: 'Builder Gel',
      builder: 'Builder Gel',
      acrilicas: 'Acrílicas',
    };

    const removalServiceOverride = servicesCatalog.find(
      (s) => s.removalOptions && s.removalOptions.length > 0
    );
    const removalCatalog = removalServiceOverride?.removalOptions?.length
      ? removalServiceOverride.removalOptions
      : REMOVAL_SERVICE_OPTIONS;
    const removalOptionTitle = removalCatalog.find(
      (opt) => opt.id === appointment.removalDetails?.type
    )?.title;

    let servicioLabel = appointment.promoDesignTitle || '';
    if (!servicioLabel) {
      if (appointment.serviceType === 'removal' || appointment.removalDetails) {
        servicioLabel = removalOptionTitle || appointment.serviceName || 'Retiro de Sistema';
      } else if (appointment.serviceType === 'custom') {
        const systemKey = appointment.customDetails?.system || '';
        const systemLabel = SERVICE_SYSTEM_LABELS[systemKey] || '';
        if (systemKey === 'esmaltado_gel' || isEsmaltado) {
          servicioLabel = 'Esmaltado en Gel';
        } else {
          const rawServiceName = (appointment.serviceName || '').trim();
          const normalizedServiceName = rawServiceName.toLowerCase();
          const isGenericServiceName =
            !rawServiceName ||
            normalizedServiceName === 'nuestros servicios' ||
            normalizedServiceName === 'nuestro servicio';
          servicioLabel =
            systemLabel ||
            (isGenericServiceName ? '' : rawServiceName) ||
            SERVICE_SYSTEM_LABELS[rawServiceName.toLowerCase().replace(/\s+/g, '_')] ||
            rawServiceName ||
            'Servicio';
        }
      } else {
        const rawServiceName = (appointment.serviceName || '').trim();
        const normalizedServiceName = rawServiceName.toLowerCase();
        const isGenericServiceName =
          !rawServiceName ||
          normalizedServiceName === 'nuestros servicios' ||
          normalizedServiceName === 'nuestro servicio';
        servicioLabel = isGenericServiceName ? 'Servicio' : rawServiceName;
      }
    }

    const vars: Record<string, string> = {
      codigo: resCode,
      cliente: clientName,
      whatsapp: clientPhone,
      servicio: servicioLabel,
      nivel: levelText,
      forma: formaText,
      largo: largoText,
      detalles: detallesDiseno,
      talla: '',
      kit: '',
      medidas_der: '',
      medidas_izq: '',
      anatomia:
        appointment.customDetails?.system === 'esmaltado_gel'
          ? 'N/A'
          : appointment.customDetails?.shape || 'N/A',
      fecha,
      hora,
      modalidad,
      direccion,
      referencia,
      cumpleanos,
      instagram,
      adicionales: adicionalesText,
      total: montoTotal,
      adelanto,
      saldo,
      metodo_pago: metodo,
      operacion,
      numero_operacion: operacion,
    };

    const tmpl = getWhatsAppTemplate(settings, flow);
    const rendered = renderWhatsAppTemplate(tmpl, vars);
    if (rendered) {
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(rendered)}`;
    }

    const message = lines.join('\n');
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  const connectGoogleSheets = async () => {};
  const disconnectGoogleSheets = async () => {};
  const syncAllToGoogleSheets = async () => {};

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        isAdmin,
        setIsAdmin,
        showTermsModal,
        setShowTermsModal,
        flipbookType,
        openFlipbook,
        closeFlipbook,
        showGuideModal,
        setShowGuideModal,
        isCoursesModalOpen,
        setIsCoursesModalOpen,
        isPressOnModalOpen,
        setIsPressOnModalOpen,
        pressOnInitialTab,
        pressOnInitialSetIdx,
        pressOnInitialStep,
        selectedPressOnPromoItem,
        setSelectedPressOnPromoItem,
        openPressOnModal,

        isPromoPressOnModalOpen,
        setIsPromoPressOnModalOpen,
        selectedPromoPressOnDesign,
        setSelectedPromoPressOnDesign,
        openPromoPressOnModal,
        closePromoPressOnModal,

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

        showAdditionalsModal,
        setShowAdditionalsModal,
        selectedAdditionals,
        toggleAdditional,
        clearAdditionals,
        additionalsTotal,
        additionalsList,
        addAdditionalItem,
        updateAdditionalItem,
        deleteAdditionalItem,
        resetAdditionalsList,

        inventoryList,
        saveAndSetInventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        resetInventoryList,

        coursesList,
        addCourseItem,
        updateCourseItem,
        deleteCourseItem,
        resetCoursesList,
        selectedCourseItem,
        setSelectedCourseItem,
        isCourseModalOpen,
        setIsCourseModalOpen,
        openCourseModal,
        closeCourseModal,

        reviewsList,
        addReviewItem,
        updateReviewItem,
        deleteReviewItem,
        resetReviewsList,
        reviewedTargetIds,
        markTargetAsReviewed,

        isBookingOpen,
        openBooking,
        closeBooking,
        bookingServiceType,
        selectedPromoForBooking,

        promoDesigns,
        selectedPromoForDetails,
        setSelectedPromoForDetails,
        addPromoDesign,
        updatePromoDesign,
        deletePromoDesign,

        customConfig,
        setCustomConfig,
        resetCustomConfig,

        appointments,
        createAppointment,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        clearCancelledAppointments,

        settings,
        updateSettings,
        resetSettings,

        generateWhatsAppLink,

        googleUser,
        googleAccessToken,
        spreadsheetId,
        spreadsheetUrl,
        isSyncingSheets,
        connectGoogleSheets,
        disconnectGoogleSheets,
        syncAllToGoogleSheets,

        isFirestoreConnected,

        allUsers,
        currentUser,
        setCurrentUser,
        isAccountModalOpen,
        setIsAccountModalOpen,
        accountModalTab,
        setAccountModalTab,
        accountModalMode,
        setAccountModalMode,
        openAccountModal,
        isRouletteModalOpen,
        setIsRouletteModalOpen,
        registerUser,
        loginUser,
        logoutUser,
        updateUserProfile,
        deleteUserAccount,
        updateUserCoinsAndVisits,
        purchaseBeeCoins,
        spinRoulette,

        rechargeRequests,
        requestBeeCoinRecharge,
        approveBeeCoinRecharge,
        rejectBeeCoinRecharge,
        recordOperationCode,

        isStoreModalOpen,
        setIsStoreModalOpen,
        storeOrders,
        createStoreOrder,
        updateStoreOrderStatus,
        updateStoreOrder,
        deleteStoreOrder,

        catbeeConfig,
        updateCatbeeConfig,
        resetCatbeeConfig,
        catbeeKnowledge,
        addCatbeeKnowledge,
        updateCatbeeKnowledge,
        deleteCatbeeKnowledge,
        resetCatbeeKnowledge,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
