import React from 'react';
import { useApp } from '../context/AppContext';

interface BirthdayDiscountButtonProps {
  isApplied: boolean;
  onToggle: () => void;
  discountAmount?: number;
}

export const BirthdayDiscountButton: React.FC<BirthdayDiscountButtonProps> = ({
  isApplied,
  onToggle,
}) => {
  const { currentUser } = useApp();

  if (!currentUser || !currentUser.rouletteSpun || !currentUser.roulettePrize) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border flex items-center justify-center text-lg sm:text-xl leading-none transition-all duration-300 cursor-pointer shrink-0 ${
        isApplied
          ? 'bg-[#8C5D28]/25 border-[#D4AF37] text-[#5D3704] shadow-inner ring-2 ring-[#D4AF37]/70 scale-95'
          : 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF7F2] to-[#F5EBE1] border-[#D4AF37] hover:scale-105 active:scale-95 animate-pulse shadow-[0_0_12px_rgba(212,175,55,0.5)]'
      }`}
      title={isApplied ? 'Regalo de Cumpleaños Aplicado 🎂' : 'Toca para aplicar tu Regalo VIP de Cumpleaños 🎂'}
    >
      <span className="select-none filter drop-shadow-xs">🎂</span>
    </button>
  );
};
