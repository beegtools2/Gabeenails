import React from 'react';
import { BeeCoinIcon } from './BeeCoinIcon';
import { useApp } from '../context/AppContext';

interface BeeCoinsFooterBadgeProps {
  totalEstimated: number;
  isPromo?: boolean;
}

export const BeeCoinsFooterBadge: React.FC<BeeCoinsFooterBadgeProps> = ({
  totalEstimated,
  isPromo = false,
}) => {
  const { currentUser, openAccountModal } = useApp();
  const earnedCoins = isPromo ? 0 : Math.floor(totalEstimated * 10);

  const handleClick = () => {
    if (!currentUser) {
      openAccountModal();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#6B1D2F]/85 via-[#8B263E]/80 to-[#501321]/85 backdrop-blur-md text-[#FDF0A6] shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 shrink-0"
      title={
        isPromo
          ? 'Las tarifas de promoción no acumulan BeeCoins ni beneficios VIP'
          : currentUser
          ? `Acumularás +${earnedCoins} BeeCoins con este pedido`
          : `Toca aquí para iniciar sesión y acumular +${earnedCoins} BeeCoins`
      }
    >
      <BeeCoinIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 filter drop-shadow-xs" />
      <span className="font-mono font-black text-xs sm:text-sm text-[#FDF0A6] tracking-tight">
        +{earnedCoins}
      </span>
    </button>
  );
};
