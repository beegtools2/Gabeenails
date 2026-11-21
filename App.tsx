import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { HeroCover } from './components/HeroCover';
import { PromoCatalog } from './components/PromoCatalog';
import { CustomServiceBuilder } from './components/CustomServiceBuilder';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { TermsModal } from './components/TermsModal';
import { GuideModal } from './components/GuideModal';
import { BookingModal } from './components/BookingModal';
import { AdditionalsModal } from './components/AdditionalsModal';
import { CoursesModal } from './components/CoursesModal';
import { CourseDetailModal } from './components/CourseDetailModal';
import { PressOnModal } from './components/PressOnModal';
import { PromoPressOnModal } from './components/PromoPressOnModal';
import { UserAccountModal } from './components/UserAccountModal';
import { BirthdayRouletteModal } from './components/BirthdayRouletteModal';
import { PromoPauseNoticeModal } from './components/PromoPauseNoticeModal';
import { StoreModal } from './components/StoreModal';
import { CatbeeAssistantModal } from './components/CatbeeAssistantModal';
import { Preloader } from './components/Preloader';
import { Footer } from './components/Footer';
import {
  clearAdminSession,
  createAdminSession,
  isAdminSessionValid,
} from './utils/adminPasswordUtils';

const MainContent: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    isCoursesModalOpen,
    setIsCoursesModalOpen,
    isCourseModalOpen,
    closeCourseModal,
    isPressOnModalOpen,
    setIsPressOnModalOpen,
    isAccountModalOpen,
    setIsAccountModalOpen,
    isRouletteModalOpen,
    setIsRouletteModalOpen,
    isStoreModalOpen,
    setIsStoreModalOpen,
    currentUser,
    allUsers,
    updateUserProfile,
    setIsAdmin,
  } = useApp();

  // Escuchador de verificación de cuenta por enlace en URL (?verify_token=...)
  const [verificationBanner, setVerificationBanner] = useState<string | null>(null);
  const tokenHandledRef = useRef<boolean>(false);

  // Abrir automáticamente el modal de cuenta cuando llega un enlace de recuperación
  const resetTokenOpenedRef = useRef<boolean>(false);
  useEffect(() => {
    if (resetTokenOpenedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_token') || params.get('token');
    const isResetPath = window.location.pathname.includes('reset-password');
    if (resetToken || isResetPath) {
      resetTokenOpenedRef.current = true;
      setIsAccountModalOpen(true);
    }
  }, [setIsAccountModalOpen]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('verify_token');

    if (!verifyToken || tokenHandledRef.current) return;

    // Obtener información pendiente de verificación de localStorage
    let pendingInfo: { token: string; userId?: string; email?: string } | null = null;
    try {
      const stored = localStorage.getItem('gabee_pending_verification');
      if (stored) pendingInfo = JSON.parse(stored);
    } catch {
      // ignore
    }

    // Buscar el usuario al que corresponde este token:
    let target = currentUser;
    if (!target || (target.verificationToken !== verifyToken && pendingInfo?.token !== verifyToken)) {
      target =
        allUsers.find(
          (u) =>
            u.verificationToken === verifyToken ||
            (pendingInfo &&
              pendingInfo.token === verifyToken &&
              (u.id === pendingInfo.userId || u.email?.toLowerCase() === pendingInfo.email?.toLowerCase()))
        ) || null;
    }

    // Si aún no está en currentUser ni en allUsers, revisar almacenamiento local persistente
    if (!target) {
      try {
        const storedUser = localStorage.getItem('gabee_nail_studio_user_account_v1');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.verificationToken === verifyToken || (pendingInfo && pendingInfo.token === verifyToken)) {
            target = parsed;
          }
        }
      } catch {
        // ignore
      }
    }

    if (target) {
      tokenHandledRef.current = true;

      // Limpiar el parámetro de la URL sin recargar la página
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      // Si ya estaba verificada:
      if (target.isEmailVerified) {
        setVerificationBanner('Tu cuenta ya se encuentra verificada previamente ✔');
        setTimeout(() => setVerificationBanner(null), 6000);
        return;
      }

      // Cambiar estado a Cuenta Verificada y acreditar automáticamente 10 BeeCoins
      const verifiedUser: UserProfile = {
        ...target,
        isEmailVerified: true,
        beeCoins: (target.beeCoins || 0) + 10,
        verificationToken: undefined,
      };

      updateUserProfile(verifiedUser);
      localStorage.removeItem('gabee_pending_verification');

      // Animación de confeti festivo
      try {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.4 },
          colors: ['#FAF7F2', '#C89D3C', '#D4AF37', '#10B981'],
        });
      } catch {
        // ignore
      }

      // Notificación de felicitaciones solicitada
      setVerificationBanner('¡Cuenta verificada con éxito! Has ganado 10 BeeCoins');
      setTimeout(() => setVerificationBanner(null), 10000);
    }
  }, [allUsers, currentUser, updateUserProfile]);

  // ── RUTA PRIVADA /admin ──────────────────────────────────────────────────
  // El panel solo existe en /admin. La sesión se valida contra la contraseña
  // persistida por "Configuración y Tarifas", sin depender del servidor.
  const isAdminPath = (pathname: string) => {
    const normalized = pathname.replace(/\/+$/, '') || '/';
    return normalized === '/admin';
  };

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() =>
    isAdminPath(window.location.pathname)
  );
  const [adminAuth, setAdminAuth] = useState<'checking' | 'authenticated' | 'anonymous'>(() =>
    isAdminPath(window.location.pathname) ? 'checking' : 'anonymous'
  );
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  useEffect(() => {
    const syncAdminRoute = () => {
      const adminRoute = isAdminPath(window.location.pathname);
      setIsAdminRoute(adminRoute);

      if (!adminRoute) {
        setAdminAuth('anonymous');
        setIsAdmin(false);
        if (currentViewRef.current === 'admin') setCurrentView('home');
        return;
      }

      setIsAdmin(false);
      if (currentViewRef.current === 'admin') setCurrentView('home');

      if (isAdminSessionValid()) {
        setAdminAuth('authenticated');
        setIsAdmin(true);
        setCurrentView('admin');
      } else {
        clearAdminSession();
        setAdminAuth('anonymous');
      }
    };

    syncAdminRoute();
    window.addEventListener('popstate', syncAdminRoute);
    return () => window.removeEventListener('popstate', syncAdminRoute);
  }, [setCurrentView, setIsAdmin]);

  const handleAdminAuthenticated = () => {
    if (!isAdminPath(window.location.pathname)) {
      window.history.pushState({}, '', '/admin');
    }
    createAdminSession();
    setAdminAuth('authenticated');
    setIsAdmin(true);
    setCurrentView('admin');
  };

  const handleAdminExit = () => {
    clearAdminSession();
    setAdminAuth('anonymous');
    setIsAdmin(false);
    setIsAdminRoute(false);
    setCurrentView('home');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0 });
  };

  const handleBackToStore = () => {
    clearAdminSession();
    setAdminAuth('anonymous');
    setIsAdmin(false);
    setIsAdminRoute(false);
    setCurrentView('home');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0 });
  };

  // Si por alguna razón el estado interno queda en 'admin' fuera de /admin,
  // la tienda sigue renderizando su vista pública normal.
  const publicView = currentView === 'admin' ? 'home' : currentView;

  return (
    <div className="min-h-screen flex flex-col page-marble-bg">
      {/* Banner flotante de Verificación Exitosa de Cuenta (solo vista pública) */}
      {!isAdminRoute && verificationBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[30000] w-[92%] max-w-lg animate-fadeIn">
          <div className="bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] text-white p-4 rounded-2xl shadow-[0_10px_35px_rgba(16,185,129,0.45)] border-2 border-emerald-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-emerald-100 block">
                  ✦ Gabee Studio · Monedero VIP ✦
                </span>
                <p className="text-sm font-['Cinzel'] font-bold text-white drop-shadow-xs">
                  {verificationBanner === '¡Cuenta verificada con éxito! Has ganado 10 BeeCoins' ? (
                    <>
                      <span className="block uppercase tracking-wide">¡CUENTA VERIFICADA CON ÉXITO!</span>
                      <span className="block font-['Marcellus'] font-normal text-emerald-100 text-xs mt-0.5">Has ganado 10 BeeCoins.</span>
                    </>
                  ) : (
                    verificationBanner
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVerificationBanner(null)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {!isAdminRoute && <Preloader />}
      {!isAdminRoute && <Navbar />}

      <main className="flex-1">
        {isAdminRoute ? (
          adminAuth === 'checking' ? (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
              <div className="flex flex-col items-center gap-3 text-[#8C6B1C]">
                <div className="w-9 h-9 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
                <p className="font-['Cinzel'] text-xs font-bold uppercase tracking-widest">
                  Verificando acceso seguro…
                </p>
              </div>
            </div>
          ) : adminAuth === 'authenticated' ? (
            <AdminPanel onExitAdmin={handleAdminExit} />
          ) : (
            <AdminLogin
              onAuthenticated={handleAdminAuthenticated}
              onBackToStore={handleBackToStore}
            />
          )
        ) : (
          <>
            {publicView === 'home' && <HeroCover />}

            {publicView === 'promotions' && <PromoCatalog />}

            {publicView === 'custom' && <CustomServiceBuilder />}
          </>
        )}
      </main>

      {/* Modales globales, asistente y footer: únicamente en la vista pública */}
      {!isAdminRoute && (
        <>
          <TermsModal />
          <GuideModal />
          <BookingModal />
          <AdditionalsModal />
          <CoursesModal
            isOpen={isCoursesModalOpen}
            onClose={() => setIsCoursesModalOpen(false)}
          />
          <CourseDetailModal
            isOpen={isCourseModalOpen}
            onClose={closeCourseModal}
          />
          <PressOnModal
            isOpen={isPressOnModalOpen}
            onClose={() => setIsPressOnModalOpen(false)}
          />
          <PromoPressOnModal />
          <UserAccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            onOpenRoulette={() => setIsRouletteModalOpen(true)}
          />
          <BirthdayRouletteModal
            isOpen={isRouletteModalOpen}
            onClose={() => setIsRouletteModalOpen(false)}
          />
          <PromoPauseNoticeModal />
          <StoreModal
            isOpen={isStoreModalOpen}
            onClose={() => setIsStoreModalOpen(false)}
          />

          {/* Floating AI Assistant Bubble (Catbee) */}
          <CatbeeAssistantModal />

          <Footer />
        </>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
