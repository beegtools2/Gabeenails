import React from 'react';
import { BeeCoinIcon } from './BeeCoinIcon';
import { useApp } from '../context/AppContext';

interface LossAversionWidgetProps {
  estimatedPrice: number;
  isPromo?: boolean;
  onOpenAccountModal?: () => void;
}

export const LossAversionWidget: React.FC<LossAversionWidgetProps> = ({
  estimatedPrice,
  isPromo = false,
  onOpenAccountModal,
}) => {
  if (isPromo) return null; // Exclusión absoluta en promociones
  const { currentUser, openAccountModal } = useApp();
  const calculatedCoins = isPromo ? 0 : Math.floor(estimatedPrice * 10);

  const handleOpenAccount = () => {
    if (onOpenAccountModal) {
      onOpenAccountModal();
    } else {
      openAccountModal();
    }
  };

  if (currentUser) {
    return (
      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#D4AF37]/60 flex items-center justify-between text-xs font-['Marcellus'] text-[#5D3704] shadow-2xs">
        <div className="flex items-center gap-2">
          <BeeCoinIcon className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-['Cinzel'] font-bold block text-[11px]">
              Saldo: {currentUser.beeCoins} BeeCoins
            </span>
            <span className="text-[10px] text-[#5D3704]/80">
              {isPromo
                ? 'Las reservas promocionales no acumulan BeeCoins.'
                : `¡Ganarás +${calculatedCoins} BeeCoins con esta reserva! 🐝✨`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-gray-100/90 border border-gray-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-gray-600 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="opacity-40 grayscale shrink-0">
          <BeeCoinIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="line-through text-gray-400 font-mono font-bold text-xs">
              +{calculatedCoins} BeeCoins
            </span>
            <span className="text-[10px] font-['Cinzel'] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              ¡Puntos no reclamados!
            </span>
          </div>
          <p className="text-[10px] font-['Marcellus'] text-gray-600 leading-tight">
            Acumularías +{calculatedCoins} BeeCoins con este agendamiento. ¡Crea tu cuenta gratis para no perderlos!
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleOpenAccount}
        className="py-2 px-3.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/80 hover:bg-[#D4AF37]/35 text-[#5D3704] shadow-[0_0_12px_rgba(212,175,55,0.4)] text-[11px] font-['Cinzel'] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
      >
        <BeeCoinIcon className="w-3.5 h-3.5" />
        <span>Crear Cuenta</span>
      </button>
    </div>
  );
};
