import React from 'react';

interface OperationCodeInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  subtitle?: string;
  placeholder?: string;
  stepNumber?: number | string;
  className?: string;
  theme?: 'gold' | 'brown';
}

export const OperationCodeInput: React.FC<OperationCodeInputProps> = ({
  value,
  onChange,
  label = 'Ingresa aquí el número de operación de tu pago *',
  subtitle,
  placeholder = 'Ej: 849201 (6 a 9 dígitos numéricos)',
  stepNumber,
  className = '',
  theme = 'brown',
}) => {
  const isGold = theme === 'gold';
  const isValidLength = value.length >= 6 && value.length <= 9;

  return (
    <div
      className={`p-4 rounded-2xl ${
        isGold
          ? 'bg-[#FDFBF7] border border-[#C5A059]/60 shadow-xs'
          : 'bg-white/90 border border-[#5D3704]/20 shadow-xs'
      } space-y-2 text-left ${className}`}
    >
      <div className={`flex items-center justify-between ${stepNumber ? 'border-b border-[#EFE5D7] pb-2' : ''}`}>
        <div className="flex items-center gap-1.5 flex-1">
          {stepNumber !== undefined && (
            <span
              className={`w-5 h-5 rounded-full ${
                isGold
                  ? 'bg-[#FDFBF7] border border-[#C5A059] text-[#8C6B1C]'
                  : 'bg-[#FAF7F2] border border-[#5D3704] text-[#5D3704]'
              } text-[10px] font-bold flex items-center justify-center font-mono shrink-0`}
            >
              {stepNumber}
            </span>
          )}
          <label className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block">
            {label}
          </label>
        </div>
        {isValidLength && (
          <span className="text-[10px] font-['Cinzel'] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            ✓ Formato Válido
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] font-['Marcellus'] text-[#5D3704]/80">
          {subtitle}
        </p>
      )}

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={9}
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
          onChange(digits);
        }}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold text-[#5D3704] focus:outline-none transition-all ${
          isGold
            ? 'border-[#C5A059]/40 bg-[#FAF7F2] focus:ring-2 focus:ring-[#C5A059]'
            : 'border-[#5D3704]/30 bg-[#FAF7F2] focus:ring-2 focus:ring-[#5D3704]'
        }`}
      />

      <div className="flex justify-between items-center text-[10.5px] font-['Marcellus'] text-[#5D3704]/75">
        <span>Solo números (entre 6 y 9 dígitos)</span>
        <span
          className={`font-mono font-bold transition-colors ${
            isValidLength ? 'text-emerald-700' : 'text-amber-800'
          }`}
        >
          {value.length}/9 dígitos
        </span>
      </div>
    </div>
  );
};
