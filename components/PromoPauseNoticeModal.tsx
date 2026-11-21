import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PromoPauseNoticeModal: React.FC = () => {
  const { currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [dismissedUserId, setDismissedUserId] = useState<string | null>(null);

  const isPromoPaused = currentUser && (currentUser.consecutivePromoMonths || 0) >= 1;

  useEffect(() => {
    if (isPromoPaused && currentUser.id !== dismissedUserId) {
      setIsOpen(true);
      setCountdown(5);
    } else {
      setIsOpen(false);
    }
  }, [currentUser?.id, currentUser?.consecutivePromoMonths, dismissedUserId, isPromoPaused]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen || !currentUser) return null;

  const handleClose = () => {
    if (countdown > 0) return;
    setDismissedUserId(currentUser.id);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FAF7F2] border border-[#C5A059] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
                COMUNICADO OFICIAL VIP
              </span>
              <h3 className="text-base font-['Cinzel'] font-bold text-[#5D3704]">
                Aviso Importante de Beneficios Pausados
              </h3>
            </div>
          </div>

          <button
            type="button"
            disabled={countdown > 0}
            onClick={handleClose}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              countdown > 0
                ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                : 'bg-[#FDFBF7] text-[#5D3704] border border-[#C5A059] hover:bg-[#F2E5D5]'
            }`}
            title={countdown > 0 ? `Espera ${countdown} segundos` : 'Cerrar aviso'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Content */}
        <div className="p-4 bg-amber-50/90 border border-amber-300/90 rounded-2xl text-xs font-['Marcellus'] text-amber-950 leading-relaxed space-y-3">
          <p className="font-semibold text-sm text-[#5D3704] font-['Cinzel']">
            ¡Hola, {currentUser.firstName}! 💖
          </p>
          <p>
            Estimada clienta queremos comunicarte que durante este mes, tus beneficios VIP y tus sellos se encuentran pausados temporalmente. Si en tu próximo agendamiento decides tomar una tarifa promocional nuevamente en lugar de tu servicio regular, el sistema actualizará tu estado y perderás la acumulación actual de sellos y privilegios VIP. Preferimos avisarte con anticipación para que tú misma evalúes lo que más te conviene y sigas disfrutando de tu estatus VIP al máximo.
          </p>
        </div>

        {/* Action / Countdown Footer */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-[#8C6B1C] font-bold">
            {countdown > 0 ? `⌛ Botón disponible en ${countdown}s...` : '✓ Lectura confirmada'}
          </span>

          <button
            type="button"
            disabled={countdown > 0}
            onClick={handleClose}
            className={`py-3 px-6 rounded-2xl text-xs font-['Cinzel'] font-bold uppercase tracking-wider transition-all shadow-md ${
              countdown > 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] cursor-pointer'
            }`}
          >
            {countdown > 0 ? `Espera (${countdown}s)` : 'Entendido, he leído el mensaje'}
          </button>
        </div>
      </div>
    </div>
  );
};
