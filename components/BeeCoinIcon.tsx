import React from 'react';
import { SiteImage } from '../context/SiteImagesContext';

interface BeeCoinIconProps {
  className?: string;
  size?: number;
}

export const BeeCoinIcon: React.FC<BeeCoinIconProps> = ({ className = 'w-5 h-5', size }) => {
  const containerStyle: React.CSSProperties = {
    background: 'transparent',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    ...(size ? { width: `${size}px`, height: `${size}px` } : {}),
  };

  const imgStyle: React.CSSProperties = {
    mixBlendMode: 'multiply',
    background: 'transparent',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    borderRadius: '50%',
    objectFit: 'cover',
    ...(size ? { width: `${size}px`, height: `${size}px` } : {}),
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-transparent border-0 shadow-none select-none ${className}`}
      style={containerStyle}
    >
      <SiteImage
        imageKey="bee-coin"
        alt="BeeCoin Oficial"
        className="w-full h-full object-cover rounded-full bg-transparent border-0 shadow-none select-none pointer-events-none drop-shadow-xs"
        style={{ ...imgStyle, mixBlendMode: 'normal' }}
        onError={(e) => {
          const fallback = '/assets/aistudio/BEECOINS.png';
          if (e.currentTarget.getAttribute('src') !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
      />
    </span>
  );
};
