import React from 'react';

interface GabeeBeeMarkProps {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Abejita dorada utilizada en la barra superior, reutilizada en modales y pie
 * de página. Sin recuadros ni recortes: el halo se difumina dentro del fondo.
 */
export const GabeeBeeMark: React.FC<GabeeBeeMarkProps> = ({
  className = '',
  size = 'sm',
}) => {
  const sizeClass = size === 'md' ? 'h-16 w-16' : 'h-11 w-11';

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${sizeClass} ${className}`}
    >
      {/* Halo cálido que se desvanece antes de cualquier borde visible */}
      <span
        aria-hidden="true"
        className="absolute -inset-[45%] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.06) 42%, rgba(250,247,242,0) 70%)',
        }}
      />
      <img
        src="/assets/aistudio/Logo_Abejita_Sin_Circulo_Gold.png"
        alt="Gabee Studio"
        className="relative w-full h-full object-contain select-none drop-shadow-[0_0_7px_rgba(212,175,55,0.45)]"
        draggable={false}
      />
    </span>
  );
};
