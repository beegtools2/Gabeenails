import React, { useEffect, useState } from 'react';

interface GabeeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'gold' | 'light' | 'dark';
}

// In-memory cache for processed transparent logo data URL
let transparentLogoCache: string | null = null;

export const GabeeLogo: React.FC<GabeeLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'light',
}) => {
  const isDark = variant === 'dark';
  const originalSrc = '/assets/aistudio/LogoCentro_clean.png';
  const [logoSrc, setLogoSrc] = useState<string>(transparentLogoCache || originalSrc);

  // Process image so white/near-white background seamlessly adopts landing page background
  useEffect(() => {
    if (transparentLogoCache) {
      setLogoSrc(transparentLogoCache);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Scan pixels: turn white and near-white pixels transparent
        // This ensures the logo perfectly takes the exact color of the landing page background
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate lightness and neutrality
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const isNeutral = (maxVal - minVal) < 26;
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

          if (isNeutral && brightness > 215) {
            if (brightness >= 240) {
              // Completely transparent: exact background shines through
              data[i + 3] = 0;
            } else {
              // Smooth feathering on anti-aliased edges
              const factor = (240 - brightness) / (240 - 215);
              data[i + 3] = Math.round(data[i + 3] * Math.pow(factor, 1.2));
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const processedUrl = canvas.toDataURL('image/png');
        transparentLogoCache = processedUrl;
        setLogoSrc(processedUrl);
      } catch (e) {
        // Fallback: mix-blend-multiply handles blending seamlessly
        console.warn('Canvas logo processing fallback to mix-blend-multiply', e);
      }
    };
    img.src = originalSrc;
  }, [originalSrc]);

  const sizeConfig = {
    sm: {
      imgClass: isDark ? 'h-9 w-9 object-contain' : 'h-11 w-11 object-contain mix-blend-multiply',
      badgeClass: isDark ? 'p-1 rounded-xl bg-[#FFFDF9] border border-[#D4AF37]/40 shadow-xs' : '',
      wrapperClass: 'gap-2',
    },
    md: {
      imgClass: isDark ? 'h-14 w-14 object-contain' : 'h-16 w-16 object-contain mix-blend-multiply',
      badgeClass: isDark ? 'p-1.5 rounded-2xl bg-[#FFFDF9] border border-[#D4AF37]/40 shadow-xs' : '',
      wrapperClass: 'gap-2.5',
    },
    lg: {
      imgClass: isDark
        ? 'w-44 h-44 sm:w-56 sm:h-56 object-contain'
        : 'w-48 h-48 sm:w-64 sm:h-64 object-contain mix-blend-multiply drop-shadow-md',
      badgeClass: isDark ? 'p-3 rounded-3xl bg-[#FFFDF9] border border-[#D4AF37]/50 shadow-md' : '',
      wrapperClass: 'gap-3',
    },
    xl: {
      imgClass: isDark
        ? 'w-60 h-60 sm:w-72 sm:h-72 object-contain'
        : 'w-64 h-64 sm:w-80 sm:h-80 object-contain mix-blend-multiply drop-shadow-lg',
      badgeClass: isDark ? 'p-4 rounded-3xl bg-[#FFFDF9] border border-[#D4AF37]/50 shadow-lg' : '',
      wrapperClass: 'gap-4',
    },
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeConfig.wrapperClass} ${className}`}>
      {/* Ambient golden aura for lg/xl presentation on landing page */}
      {(size === 'lg' || size === 'xl') && !isDark && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#DFBA68]/25 via-[#F2CFC7]/20 to-[#EAD6C9]/25 blur-2xl rounded-full -z-10 scale-110 pointer-events-none" />
      )}

      <div className={`transition-transform duration-300 hover:scale-105 ${sizeConfig.badgeClass}`}>
        <img
          src={logoSrc}
          alt="Gabee Nail Artist - Logo Oficial 3D"
          className={`${sizeConfig.imgClass} transition-transform duration-300`}
          loading="eager"
        />
      </div>
    </div>
  );
};
