import React, { useState } from 'react';
import { X, Sparkles, Gift, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { BeeCoinIcon } from './BeeCoinIcon';

interface BirthdayRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROULETTE_SLOTS = [
  { label: '10% OFF', color: '#F5EBE1', text: '#3D2817', weight: 16 },
  { label: '15% OFF', color: '#E4D5C3', text: '#3D2817', weight: 16 },
  { label: '20% OFF', color: '#EFE4D6', text: '#3D2817', weight: 16 },
  { label: '25% OFF', color: '#DBCBB8', text: '#3D2817', weight: 16 },
  { label: '30% OFF', color: '#F8F2EA', text: '#3D2817', weight: 16 },
  { label: '35% OFF', color: '#D4C3B0', text: '#3D2817', weight: 16 },
  {
    label: '¡SERVICIO GRATIS!',
    sublabel: '(Hasta 150 soles)',
    color: '#EADCCB',
    text: '#3D2817',
    weight: 4, // ~4% low probability for grand prize
    isGrandPrize: true,
  },
];

export const BirthdayRouletteModal: React.FC<BirthdayRouletteModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, spinRoulette } = useApp();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(currentUser?.roulettePrize || null);

  if (!isOpen) return null;

  const isVip = (currentUser?.visitsCount || 0) >= 4;
  const alreadySpun = currentUser?.rouletteSpun || Boolean(wonPrize);

  const handleSpin = () => {
    if (!currentUser || !isVip || alreadySpun || isSpinning) return;

    setIsSpinning(true);

    // Weighted random selection: ~4% chance for grand prize, ~16% for discounts
    const totalWeight = ROULETTE_SLOTS.reduce((acc, s) => acc + s.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let winningIndex = 0;
    for (let i = 0; i < ROULETTE_SLOTS.length; i++) {
      if (randomVal < ROULETTE_SLOTS[i].weight) {
        winningIndex = i;
        break;
      }
      randomVal -= ROULETTE_SLOTS[i].weight;
    }

    const sliceDegree = 360 / ROULETTE_SLOTS.length;
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetDegree = extraSpins + (360 - winningIndex * sliceDegree - sliceDegree / 2);

    setRotationDegree(targetDegree);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = ROULETTE_SLOTS[winningIndex].sublabel
        ? `${ROULETTE_SLOTS[winningIndex].label} ${ROULETTE_SLOTS[winningIndex].sublabel}`
        : ROULETTE_SLOTS[winningIndex].label;
      setWonPrize(prize);
      spinRoulette(prize);

      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#5D3704', '#C89D3C', '#D4AF37', '#FAF7F2'],
        });
      } catch {
        // Ignore
      }
    }, 4500);
  };

  const numSlices = ROULETTE_SLOTS.length;
  const sliceAngle = 360 / numSlices;

  return (
    <div
      className="fixed inset-0 z-[30000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSpinning) onClose();
      }}
    >
      <div
        className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-[#E8DEC9] flex items-center justify-between"
          style={{
            backgroundImage: 'var(--site-window-pattern)',
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-[#D5C6B1] shadow-xs">
            <Gift className="w-4 h-4 text-[#C89D3C]" />
            <div>
              <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704] block">
                BENEFICIO EXCLUSIVO VIP
              </span>
              <h3 className="text-sm font-['Cinzel'] font-bold text-[#5D3704]">
                Ruleta de Cumpleaños
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5D3704] bg-[#F5EBE1] hover:bg-[#ebdccf] rounded-full shadow-xs cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 text-center space-y-5 bg-[#F5EFEB]/80">
          {!currentUser ? (
            <div className="p-6 bg-white rounded-2xl border border-[#DFD1BD] space-y-3">
              <AlertCircle className="w-10 h-10 text-[#C89D3C] mx-auto" />
              <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">Inicia Sesión para Acceder</h4>
              <p className="font-['Marcellus'] text-xs text-[#5D3704]/80 leading-relaxed">
                Debes tener una cuenta activa para participar en la Ruleta de Cumpleaños VIP.
              </p>
            </div>
          ) : !isVip ? (
            <div className="p-6 bg-white rounded-2xl border border-[#DFD1BD] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#C89D3C] flex items-center justify-center mx-auto shadow-2xs">
                <BeeCoinIcon className="w-7 h-7" />
              </div>
              <h4 className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">Beneficio Exclusivo para Clientas VIP</h4>
              <p className="font-['Marcellus'] text-xs text-[#5D3704]/80 leading-relaxed">
                La Ruleta de Cumpleaños está habilitada para clientas VIP que han asistido como mínimo a <strong>4 citas regulares</strong> en nuestro estudio.
              </p>
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DEC9] text-xs font-['Cinzel'] font-bold text-[#5D3704]">
                Llevas {currentUser.visitsCount || 0} / 4 Visitas Regulares Acumuladas
              </div>
            </div>
          ) : alreadySpun ? (
            <div className="p-6 bg-white rounded-2xl border-2 border-[#D4AF37] space-y-4 shadow-md text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border-2 border-[#D4AF37] flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7 text-[#C89D3C]" />
              </div>

              {/* Exact Warm Birthday Header Message */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DEC9] text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed whitespace-pre-line shadow-2xs">
                ¡Muchísimas felicidades en tu día! 🎂{"\n"}
                En Gabee Studio nos encanta consentirte, por eso giraste la ruleta de cumpleaños y ganaste un detalle muy especial para que te luzcas. ¡Gracias por ser parte de nuestra familia! 💛
              </div>

              {/* Won Prize Badge: Fondo marrón clarito brillante y elegante con animación de brillo */}
              <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-[#F3E8DB] via-[#EAE0D0] to-[#F3E8DB] border-2 border-[#D4AF37] text-center shadow-md my-1">
                <style>{`
                  @keyframes shimmerBeam {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                `}</style>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.7) 50%, transparent 80%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmerBeam 3s infinite linear',
                  }}
                />
                <span className="block text-[10px] font-['Cinzel'] font-bold text-[#7A4B1A] uppercase tracking-widest mb-1 relative z-10">
                  PREMIO OBTENIDO
                </span>
                {(() => {
                  const prizeText = currentUser.roulettePrize || wonPrize || '';
                  if (prizeText.includes('(')) {
                    const parenIndex = prizeText.indexOf('(');
                    const mainPart = prizeText.substring(0, parenIndex).trim();
                    const subPart = prizeText.substring(parenIndex).trim();
                    return (
                      <div className="relative z-10 space-y-0.5">
                        <span className="block text-base sm:text-lg font-['Cinzel'] font-black text-[#5D3704] tracking-wide">
                          {mainPart}
                        </span>
                        <span className="block text-xs font-['Cinzel'] font-bold text-[#8C6B1C] tracking-wide opacity-90">
                          {subPart}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <span className="block text-base sm:text-lg font-['Cinzel'] font-black text-[#5D3704] tracking-wide relative z-10">
                      {prizeText}
                    </span>
                  );
                })()}
              </div>

              {/* Exact Confirmation Footer Message */}
              <p className="p-3 bg-[#FDFBF7] rounded-xl border border-[#C5A059]/50 text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed">
                Tu regalo ya quedó guardado en nuestro sistema. Solo presiona el botón de &#39;🎂&#39; que sale en cualquiera de nuestros servicios y automáticamente obtendrás tu regalito. ¡Disfruta muchísimo tu día!
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="font-['Marcellus'] text-xs text-[#5D3704] max-w-sm mx-auto leading-relaxed">
                ¡Feliz Cumpleaños, {currentUser.firstName}! 👑 Presiona el botón para girar tu ruleta de regalos VIP. Funciona exactamente 1 vez.
              </p>

              {/* Roulette Wheel Container with 3D Relief & Lighting Effects */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto p-2 bg-gradient-to-br from-[#E8DEC9] via-[#D5C6B1] to-[#8C6B1C] rounded-full shadow-2xl ring-4 ring-[#C5A059]/40">
                {/* Pointer Arrow */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-[#5D3704] filter drop-shadow-lg" />

                {/* Spinning Wheel Container */}
                <div
                  className="w-full h-full rounded-full border-4 border-[#C89D3C] shadow-inner relative overflow-hidden transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
                  style={{ transform: `rotate(${rotationDegree}deg)`, boxShadow: 'inset 0 0 25px rgba(93, 55, 4, 0.4), 0 10px 20px rgba(0,0,0,0.3)' }}
                >
                  {/* SVG Vector Slices for Perfect 7-Sector Layout & Legible Radial Text */}
                  <svg className="w-full h-full" viewBox="0 0 400 400">
                    <defs>
                      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#D4AF37" floodOpacity="0.9" />
                      </filter>
                    </defs>

                    {ROULETTE_SLOTS.map((slot, i) => {
                      const startAngle = i * sliceAngle - 90;
                      const endAngle = (i + 1) * sliceAngle - 90;
                      const midAngle = startAngle + sliceAngle / 2;

                      const radStart = (startAngle * Math.PI) / 180;
                      const radEnd = (endAngle * Math.PI) / 180;

                      const x1 = 200 + 200 * Math.cos(radStart);
                      const y1 = 200 + 200 * Math.sin(radStart);
                      const x2 = 200 + 200 * Math.cos(radEnd);
                      const y2 = 200 + 200 * Math.sin(radEnd);

                      const pathData = `M 200 200 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 200 200 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

                      return (
                        <g key={i}>
                          {/* Sector Pie Slice */}
                          <path
                            d={pathData}
                            fill={slot.isGrandPrize ? '#FDFBF7' : slot.color}
                            stroke={slot.isGrandPrize ? '#D4AF37' : '#C5A059'}
                            strokeWidth={slot.isGrandPrize ? '2.5' : '1.5'}
                            filter={slot.isGrandPrize ? 'url(#goldGlow)' : undefined}
                          />

                          {/* Sector Label Group (Rotated to Radial Bisector) */}
                          <g transform={`rotate(${midAngle + 90}, 200, 200)`}>
                            {slot.sublabel ? (
                              <text
                                x="200"
                                y="72"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="font-['Cinzel'] font-black fill-[#3D2817]"
                                style={{ fontSize: '11px', letterSpacing: '0.02em' }}
                              >
                                <tspan x="200" dy="-7" className={slot.isGrandPrize ? 'fill-[#5D3704] font-extrabold animate-pulse' : ''}>
                                  {slot.label}
                                </tspan>
                                <tspan x="200" dy="13" style={{ fontSize: '8.5px', fontWeight: 'bold' }} className={slot.isGrandPrize ? 'fill-[#8C6B1C] animate-pulse' : 'fill-[#5D3704]'}>
                                  {slot.sublabel}
                                </tspan>
                              </text>
                            ) : (
                              <text
                                x="200"
                                y="70"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="font-['Cinzel'] font-black fill-[#3D2817]"
                                style={{ fontSize: '13px', letterSpacing: '0.05em' }}
                              >
                                {slot.label}
                              </text>
                            )}
                          </g>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Wheel Center Cap with Official Golden Coin without background */}
                  <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#FAF7F2] border-2 border-[#D4AF37] flex items-center justify-center shadow-2xl z-20 overflow-hidden ring-2 ring-[#C5A059]/60">
                    <BeeCoinIcon className="w-14 h-14" />
                  </div>
                </div>
              </div>

              {/* Spin Button */}
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpin}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#FDFBF7] border border-[#C5A059] hover:bg-[#F2E5D5] text-[#5D3704] text-xs font-['Cinzel'] font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#C89D3C]" />
                <span>{isSpinning ? 'Girando Ruleta VIP...' : '¡Girar Ruleta de Cumpleaños!'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

