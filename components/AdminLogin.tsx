import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { ADMIN_PASSWORD_MAX_LENGTH, ADMIN_SESSION_ENDPOINT } from '../data/adminSession';
import { hasLegacyAdminPassword, loginLegacyAdmin } from '../utils/legacyAdminPreview';

interface AdminLoginProps {
  onAuthenticated: () => void;
  onBackToStore: () => void;
  onImagePreview?: () => void;
  sessionExpired: boolean;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onAuthenticated,
  onBackToStore,
  onImagePreview,
  sessionExpired,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!password) {
      setError('Ingresa la contraseña de administrador.');
      return;
    }

    if (onImagePreview) {
      if (loginLegacyAdmin(password)) {
        setPassword('');
        onAuthenticated();
      } else {
        setError('Contraseña incorrecta.');
      }
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(ADMIN_SESSION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.status === 204) {
        setPassword('');
        onAuthenticated();
      } else if (response.status === 401) {
        setError('Contraseña incorrecta.');
      } else if (response.status === 429) {
        setError('Demasiados intentos. Espera un minuto antes de volver a ingresar.');
      } else {
        setError('No se pudo verificar el acceso al panel. Inténtalo de nuevo.');
      }
    } catch {
      setError('No se pudo conectar con el panel. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] w-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="relative rounded-3xl border border-[#DFC89E] bg-gradient-to-br from-[#FAF0D9] via-[#F3E4C3] to-[#EAD6AE] p-6 sm:p-8 shadow-[0_20px_60px_rgba(93,55,4,0.14),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{ background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.14), transparent 65%)' }} />

          <div className="relative">
            <div className="flex justify-center mb-4">
              <img
                src="/assets/aistudio/Logo_Abejita_Sin_Circulo_Gold.png"
                alt="Gabee Studio"
                className="h-16 w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                draggable={false}
              />
            </div>

            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D4AF37]/45 bg-[#FAF7F2]/70 text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Acceso privado · /admin
              </span>
            </div>

            <h1 className="text-center text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704]">
              Panel de Administración
            </h1>
            {(!onImagePreview || hasLegacyAdminPassword) && (
              <p className="mt-2 text-center text-xs sm:text-sm font-['Marcellus'] text-[#7A614A] leading-relaxed">
                Ingresa la contraseña de administrador para gestionar citas, diseños, pedidos y configuración del estudio.
              </p>
            )}

            {(!onImagePreview || hasLegacyAdminPassword) && <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-[11px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704] mb-1.5"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-[#8C6B1C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    maxLength={ADMIN_PASSWORD_MAX_LENGTH}
                    disabled={isSubmitting}
                    autoFocus
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#DFC89E] bg-[#FAF7F2] text-sm text-[#5D3704] placeholder:text-[#A89175]/70 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#8C6B1C] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {(error || sessionExpired) && (
                  <p className="mt-2 text-xs font-['Cinzel'] font-bold text-rose-700 text-center" role="alert">
                    {error || 'Tu sesión terminó. Ingresa nuevamente al panel.'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-full border border-[#C89D3C] bg-[#FFFEFA] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-widest shadow-[0_6px_18px_rgba(107,67,36,0.14)] hover:bg-white hover:border-[#D4AF37] hover:text-[#8C6B1C] transition-all cursor-pointer"
              >
                {isSubmitting ? 'Ingresando…' : 'Ingresar al panel'}
              </button>
            </form>}

            {onImagePreview && (
              <div className="mt-6 space-y-2 text-center">
                <p className="text-xs text-[#7A614A]">El acceso con publicación aún no está configurado. La vista previa no modifica el sitio.</p>
                <button type="button" className="text-sm font-semibold text-[#5D3704] underline" onClick={onImagePreview}>
                  Abrir vista previa de imágenes
                </button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#D4AF37]/25">
              <button
                type="button"
                onClick={onBackToStore}
                className="w-full inline-flex items-center justify-center gap-2 py-2 text-[11px] font-['Cinzel'] font-bold text-[#8C6B1C] hover:text-[#B8942A] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
